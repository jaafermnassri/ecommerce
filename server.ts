import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";
import { google } from "googleapis";
import { GoogleGenAI } from "@google/genai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Prisma will fail to connect.");
}

const JWT_SECRET = process.env.JWT_SECRET || "convertyflow-secret";

// --- Google Sheets Logic ---
async function appendOrderToSheet(userId: string, order: any) {
  console.log(`[Google Sheets] appendOrderToSheet called for user: ${userId}`);
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.googleSheetId) {
      console.log(`[Google Sheets] No googleSheetId found for user ${userId}`);
      return;
    }
    const spreadsheetId = user.googleSheetId;

    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      console.error("GOOGLE_SERVICE_ACCOUNT_KEY missing");
      return;
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (e) {
      console.error("GOOGLE_SERVICE_ACCOUNT_KEY is not a valid JSON string.");
      return;
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 1. Initialize Headers if the sheet is empty
    const checkHeader = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:K1',
    });

    if (!checkHeader.data.values || checkHeader.data.values.length === 0) {
      const headers = [
        ["ID", "Date et Heure", "Cas de Commande", "Nom", "Téléphone", "Gouvernorat", "Adresse", "Produit", "Offre", "Quantité", "Prix Total"]
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1:K1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: headers },
      });

      // Apply styling to headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.12, green: 0.23, blue: 0.54 }, // Dark Blue #1E3A8A equivalent
                    textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 10 },
                    horizontalAlignment: 'CENTER',
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
              }
            }
          ]
        }
      });
    }

    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const isOrder = order.status === 'COMPLETED';
    const status = isOrder ? 'Commande' : 'Prospect';
    const total = typeof order.total === 'number' ? order.total.toFixed(3) : '0.000';
    const customerPhone = order.customerPhone || 'N/A';
    const offerText = order.items?.[0]?.offer || 'N/A';
    const quantity = order.items?.[0]?.quantity || (order.total ? 1 : 0);

    const rowData = [
      order.id || 'N/A',
      createdAt.toLocaleString('fr-FR'),
      status,
      order.customerName || 'N/A',
      customerPhone,
      order.customerCity || 'N/A',
      order.customerAddress || 'N/A',
      order.productName || 'N/A',
      offerText,
      quantity,
      `${total} DT`
    ];

    // 2. Lead De-duplication logic
    if (isOrder && customerPhone !== 'N/A') {
      const allRows = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A:E',
      });

      if (allRows.data.values) {
        // Find if a prospect with the same phone exists
        // Rows are 1-indexed for range, so find index + 1
        const prospectIndex = allRows.data.values.findIndex(row => 
          row[4] === customerPhone && row[2] === 'Prospect'
        );

        if (prospectIndex !== -1) {
          console.log(`[Google Sheets] Found matching prospect at row ${prospectIndex + 1}. Updating...`);
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `A${prospectIndex + 1}:K${prospectIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [rowData] },
          });
          return;
        }
      }
    }

    // 3. Just append if not updating or no match found
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData]
      },
    });
    console.log(`[Google Sheets] Successfully recorded ${status}`);

  } catch (error) {
    console.error("[Google Sheets] Refactored append error:", error);
  }
}

// --- AI assistant logic ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Cloudflare R2 Client (Lazy Init) ---
let r2ClientInstance: S3Client | null = null;
function getR2Client() {
  if (!r2ClientInstance) {
    const r2AccountId = (process.env.R2_ACCOUNT_ID || "").replace(/['"]/g, '').trim();
    const r2AccessKeyId = (process.env.R2_ACCESS_KEY_ID || "").replace(/['"]/g, '').trim();
    const r2SecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").replace(/['"]/g, '').trim();

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      console.error("R2 Config Missing:", { r2AccountId: !!r2AccountId, r2AccessKeyId: !!r2AccessKeyId, r2SecretAccessKey: !!r2SecretAccessKey });
      throw new Error("Cloudflare R2 requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY");
    }

    r2ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });
    console.log("R2 Client initialized successfully");
  }
  return r2ClientInstance;
}

async function getAIResponse(shopId: string, userMessage: string) {
  try {
    const shop = await prisma.user.findUnique({
      where: { id: shopId },
      include: { products: true, settings: true }
    });

    if (!shop || !shop.isPremium || !shop.settings?.whatsappAssistantEnabled) {
      return "Assistant non disponible pour cette boutique.";
    }

    const productList = shop.products.map(p => `- ${p.name}: ${p.price.toFixed(3)} DT (${p.description || 'Pas de description'})`).join('\n');
    
    const prompt = `Vous êtes l'assistant IA de la boutique "${shop.shopName}".
Utilisez les informations suivantes pour répondre aux clients :
- Produits disponibles :
${productList}
- Livraison: 7 DT (Gratuite dès ${shop.settings.freeShippingMin} DT)
- Répondez de manière polie, concise et encouragez l'achat. 
- Si le client veut commander, fournissez un lien vers la boutique : https://${shop.subdomain}.convertyflow.com

Message du client : ${userMessage}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("AI Assistant error:", error);
    return "Désolé, je rencontre une erreur technique.";
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  
  // Configure Multer for local storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  // --- Auth Middleware ---
  const authenticate = async (req: any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
      
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.active && user.role !== 'ADMIN') return res.status(403).json({ error: "Ce compte a été désactivé par l'administrateur." });

      // Maintenance mode check
      const globalSettings = await prisma.globalSettings.findFirst();
      if (globalSettings?.maintenanceMode && user.role !== 'ADMIN') {
        return res.status(503).json({ error: "Platome en maintenance. Revenez plus tard." });
      }

      next();
    } catch (err) {
      res.status(403).json({ error: "Invalid token" });
    }
  };

  // --- Google Sheets Integration ---
  app.post("/api/v1/user/google-sheet", authenticate, async (req: any, res) => {
    const { spreadsheetId } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { googleSheetId: spreadsheetId }
      });
      res.json({ success: true, googleSheetId: user.googleSheetId });
    } catch (error) {
      console.error("Save Sheet ID error:", error);
      res.status(500).json({ error: "Failed to save Sheet ID" });
    }
  });

  app.get("/api/v1/user/google-sheet/status", authenticate, async (req: any, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { googleSheetId: true }
      });
      
      let serviceAccountEmail = process.env.AUTHORIZED_SERVICE_ACCOUNT_EMAIL || "Veuillez configurer GOOGLE_SERVICE_ACCOUNT_KEY";
      
      const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (key) {
        try {
          const parsed = JSON.parse(key);
          if (parsed.client_email) {
            serviceAccountEmail = parsed.client_email;
          }
        } catch (e) {
          // Keep default
        }
      }

      res.json({ 
        googleSheetId: user?.googleSheetId, 
        serviceAccountEmail 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  // --- API Routes ---

  // Health check to verify DB connection
  app.get("/api/health", async (req, res) => {
    try {
      await prisma.user.findFirst();
      res.json({ status: "ok", db: "connected" });
    } catch (err) {
      console.error("Health check failed:", err);
      res.status(500).json({ status: "error", db: "disconnected", details: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- Upload API ---
  app.post("/api/upload", authenticate, upload.single('image'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // --- Cloudflare R2 Presigned URL API ---
  app.post("/api/v1/r2/sign", authenticate, async (req: any, res) => {
    console.log("Received upload request:", req.body);
    try {
      // Validate environment variables first
      const r2AccountId = (process.env.R2_ACCOUNT_ID || "").replace(/['"]/g, '').trim();
      const r2AccessKeyId = (process.env.R2_ACCESS_KEY_ID || "").replace(/['"]/g, '').trim();
      const r2SecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").replace(/['"]/g, '').trim();
      const r2BucketName = (process.env.R2_BUCKET_NAME || "").replace(/['"]/g, '').trim();
      const r2PublicUrl = (process.env.VITE_R2_PUBLIC_URL || "").replace(/['"]/g, '').trim();

      if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName || !r2PublicUrl) {
        console.error("Missing R2 configuration environment variables");
        return res.status(500).json({ 
          error: "Cloudflare R2 n'est pas configuré. Veuillez vérifier vos variables d'environnement.",
          missingConfig: true 
        });
      }

      const { fileName, fileType } = req.body;
      if (!fileName || !fileType) {
        return res.status(400).json({ error: "fileName and fileType are required" });
      }

      // Generate unique file name to avoid collisions
      const extension = fileName.split('.').pop();
      const uniqueKey = `${req.userId}/${uuidv4()}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: r2BucketName,
        Key: uniqueKey,
        ContentType: fileType,
      });

      // URL expires in 3600 seconds (1 hour)
      const client = getR2Client();
      const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      
      const publicUrl = `${r2PublicUrl.endsWith('/') ? r2PublicUrl.slice(0, -1) : r2PublicUrl}/${uniqueKey}`;

      console.log("Generated presigned URL successfully for", uniqueKey);
      res.json({ presignedUrl, publicUrl, key: uniqueKey });
    } catch (error: any) {
      console.error("Presigned URL error:", error);
      res.status(500).json({ 
        error: "Erreur lors de la création du lien de téléversement",
        details: error.message 
      });
    }
  });

  // --- Cloning APIs ---
  app.post("/api/products/clone/:id", authenticate, async (req: any, res) => {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({ where: { id, userId: req.userId } });
      if (!product) return res.status(404).json({ error: "Produit non trouvé" });
      
      const { id: _, createdAt: __, ...data } = product;
      const clonedProduct = await prisma.product.create({
        data: {
          ...data,
          name: `${product.name} (Copy)`,
          userId: req.userId
        }
      });
      res.json(clonedProduct);
    } catch (error) {
      res.status(500).json({ error: "Cloning failed" });
    }
  });

  app.post("/api/landing-pages/clone/:id", authenticate, async (req: any, res) => {
    try {
      const { id } = req.params;
      const page = await prisma.landingPage.findUnique({ where: { id, userId: req.userId } });
      if (!page) return res.status(404).json({ error: "Page non trouvée" });

      const { id: _, createdAt: __, ...data } = page;
      const clonedPage = await prisma.landingPage.create({
        data: {
          ...data,
          title: `${page.title} (Copy)`,
          slug: `${page.slug}-copy-${Math.floor(Math.random() * 1000)}`,
          userId: req.userId
        }
      });
      res.json(clonedPage);
    } catch (error) {
      res.status(500).json({ error: "Cloning failed" });
    }
  });

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, shopName, subdomain, primaryColor } = req.body;
    try {
      // Check if email exists
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) return res.status(400).json({ error: "Cet email est déjà utilisé" });

      // Check if subdomain exists
      if (subdomain) {
        const existingSub = await prisma.user.findUnique({ where: { subdomain } });
        if (existingSub) return res.status(400).json({ error: "Ce sous-domaine est déjà pris" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { 
          email, 
          password: hashedPassword, 
          shopName,
          subdomain,
          role: email === 'mnassrijaafer0@gmail.com' ? 'ADMIN' : 'USER',
          settings: { create: { 
            primaryColor: primaryColor || "#38bdf8",
            freeShippingMin: 150,
            fixedDelivery: 7,
            arabicFont: "Tajawal"
          } }
        },
      });
      res.status(201).json({ message: "User created" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        error: "Registration failed", 
        details: error instanceof Error ? error.message : "Error during creation" 
      });
    }
  });

  // Check Subdomain
  app.get("/api/auth/check-subdomain/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const user = await prisma.user.findUnique({ where: { subdomain } });
      res.json({ available: !user });
    } catch (error) {
      res.status(500).json({ error: "Check failed" });
    }
  });

  // Auth: Me
  app.get("/api/auth/me", authenticate, async (req: any, res) => {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: req.userId },
        select: { id: true, email: true, shopName: true, role: true, isPremium: true, templateId: true, subdomain: true }
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, email: user.email, shopName: user.shopName, role: user.role, subdomain: user.subdomain } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login process failed" });
    }
  });

  // --- Stats for Sidebar ---
  app.get("/api/dashboard/sidebar-stats", authenticate, async (req: any, res) => {
    try {
      const orderCount = await prisma.order.count({ where: { userId: req.userId, status: 'COMPLETED' } });
      res.json({ orderCount });
    } catch (error) {
      res.status(500).json({ orderCount: 0 });
    }
  });

  // --- Products API ---
  app.get("/api/products", authenticate, async (req: any, res) => {
    try {
      const products = await prisma.product.findMany({ 
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      res.json(products);
    } catch (error) {
      console.error("Fetch products error:", error);
      res.status(500).json({ error: "Could not fetch products" });
    }
  });

  app.post("/api/products", authenticate, async (req: any, res) => {
    try {
      const { name, price, comparePrice, description, image, stock, offers, freeShipping, active } = req.body;
      const product = await prisma.product.create({
        data: { 
          name, 
          price: parseFloat(price) || 0, 
          comparePrice: comparePrice ? parseFloat(comparePrice) : null,
          description, 
          image, 
          stock: parseInt(stock) || 0,
          offers: offers || [],
          freeShipping: Boolean(freeShipping),
          active: active !== undefined ? Boolean(active) : true,
          userId: req.userId 
        }
      });
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ error: "Could not create product", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/products/:id", authenticate, async (req: any, res) => {
    try {
      const { id, userId, createdAt, ...updateData } = req.body;
      if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price);
      if (updateData.comparePrice !== undefined) updateData.comparePrice = updateData.comparePrice ? parseFloat(updateData.comparePrice) : null;
      if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock);

      const product = await prisma.product.update({
        where: { id: req.params.id, userId: req.userId },
        data: updateData
      });
      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ error: "Could not update product" });
    }
  });

  app.post("/api/products/:id/toggle-active", authenticate, async (req: any, res) => {
    try {
      const product = await prisma.product.findUnique({ where: { id: req.params.id, userId: req.userId } });
      if (!product) return res.status(404).json({ error: "Product not found" });

      const updated = await prisma.product.update({
        where: { id: req.params.id },
        data: { active: !product.active }
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle status" });
    }
  });

  app.delete("/api/products/:id", authenticate, async (req: any, res) => {
    try {
      const id = req.params.id.trim();
      const product = await prisma.product.findUnique({ where: { id } });
      
      if (!product || product.userId !== req.userId) {
        return res.status(404).json({ error: "Product not found or unauthorized" });
      }

      await prisma.landingPage.updateMany({
        where: { productId: id },
        data: { productId: null }
      });

      await prisma.product.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Could not delete product", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // --- Orders & Leads API ---
  app.get("/api/orders", authenticate, async (req: any, res) => {
    try {
      const orders = await prisma.order.findMany({ 
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      res.json(orders);
    } catch (error) {
      console.error("Fetch orders error:", error);
      res.status(500).json({ error: "Could not fetch orders" });
    }
  });

  app.get("/api/leads", authenticate, async (req: any, res) => {
    try {
      const leads = await prisma.lead.findMany({ 
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      res.json(leads);
    } catch (error) {
      console.error("Fetch leads error:", error);
      res.status(500).json({ error: "Could not fetch leads" });
    }
  });

  app.post("/api/admin/users/toggle-premium", authenticate, async (req: any, res) => {
    try {
      const { userId } = req.body;
      const user = await prisma.user.findUnique({ where: { id: userId || req.userId } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { isPremium: !user.isPremium }
      });

      res.json({ success: true, isPremium: updatedUser.isPremium });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Multitenant Data Wrapper - Stats
  app.get("/api/dashboard/stats", authenticate, async (req: any, res) => {
    try {
      const ordersList = await prisma.order.findMany({ where: { userId: req.userId } });
      const leadsList = await prisma.lead.findMany({ where: { userId: req.userId } });
      
      // Last 7 days data
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayStr = d.toISOString().split('T')[0];
        const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getDay()];
        
        const daySales = ordersList
          .filter(o => o.createdAt.toISOString().startsWith(dayStr))
          .reduce((sum, o) => sum + (o.total || 0), 0);
        const dayLeads = leadsList.filter(l => l.createdAt.toISOString().startsWith(dayStr)).length;
        
        return { name: dayName, sales: daySales, leads: dayLeads };
      });

      const user = await prisma.user.findUnique({ where: { id: req.userId } });

      res.json({
        revenue: ordersList.reduce((acc, curr) => acc + curr.total, 0),
        orderCount: ordersList.length,
        leadCount: leadsList.length,
        abandonedCount: leadsList.filter(l => !l.recovered).length,
        chartData: last7Days,
        isPremium: user?.isPremium || false,
        subdomain: user?.subdomain
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Could not fetch dashboard stats" });
    }
  });

  // --- Landing Pages API ---
  app.get("/api/landing-pages", authenticate, async (req: any, res) => {
    try {
      const pages = await prisma.landingPage.findMany({ 
        where: { userId: req.userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(pages);
    } catch (error) {
      console.error("Fetch landing pages error:", error);
      res.status(500).json({ error: "Could not fetch landing pages" });
    }
  });

  app.post("/api/landing-pages", authenticate, async (req: any, res) => {
    try {
      const { title, slug, content, productId } = req.body;
      const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
      
      const page = await prisma.landingPage.create({
        data: { 
          title, 
          slug: finalSlug, 
          content: content || { 
            hero: { title: "Nouveau Produit", subtitle: "Découvrez notre offre exceptionnelle", image: "" },
            features: [],
            cta: "Commander Maintenant"
          }, 
          productId: productId || null,
          userId: req.userId 
        }
      });
      res.status(201).json(page);
    } catch (error) {
      console.error("Create landing page error:", error);
      res.status(500).json({ error: "Could not create landing page" });
    }
  });

  app.get("/api/landing-pages/:id", authenticate, async (req: any, res) => {
    try {
      const page = await prisma.landingPage.findUnique({
        where: { id: req.params.id, userId: req.userId },
        include: { product: true }
      });
      if (!page) return res.status(404).json({ error: "Page not found" });
      res.json(page);
    } catch (error) {
      console.error("Fetch landing page error:", error);
      res.status(500).json({ error: "Could not fetch landing page" });
    }
  });

  app.put("/api/landing-pages/:id", authenticate, async (req: any, res) => {
    try {
      const { id: _, userId: __, createdAt: ___, product: ____, ...updateData } = req.body;
      const page = await prisma.landingPage.update({
        where: { id: req.params.id, userId: req.userId },
        data: updateData
      });
      res.json(page);
    } catch (error) {
      console.error("Update landing page error:", error);
      res.status(500).json({ 
        error: "Could not update landing page", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.delete("/api/landing-pages/:id", authenticate, async (req: any, res) => {
    try {
      const id = req.params.id.trim();
      const page = await prisma.landingPage.findUnique({ where: { id } });

      if (!page || page.userId !== req.userId) {
        return res.status(404).json({ error: "Landing page not found or unauthorized" });
      }

      await prisma.landingPage.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error("Delete landing page error:", error);
      res.status(500).json({ error: "Could not delete landing page", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/orders/:id", authenticate, async (req: any, res) => {
    try {
      const id = req.params.id.trim();
      const order = await prisma.order.findUnique({ where: { id } });

      if (!order || order.userId !== req.userId) {
        return res.status(404).json({ error: "Order not found or unauthorized" });
      }

      await prisma.order.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error("Delete order error:", error);
      res.status(500).json({ error: "Could not delete order", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/leads/:id", authenticate, async (req: any, res) => {
    try {
      const id = req.params.id.trim();
      const lead = await prisma.lead.findUnique({ where: { id } });

      if (!lead || lead.userId !== req.userId) {
        return res.status(404).json({ error: "Lead not found or unauthorized" });
      }

      await prisma.lead.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error("Delete lead error:", error);
      res.status(500).json({ error: "Could not delete lead", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Public: Render Landing Page by Slug
  app.get("/api/public/landing-page/:slug", async (req, res) => {
    try {
      const globalSettings = await prisma.globalSettings.findFirst();
      if (globalSettings?.maintenanceMode) {
        return res.status(503).json({ error: "Platforme en maintenance" });
      }

      const page = await prisma.landingPage.findUnique({
        where: { slug: req.params.slug },
        include: { 
          product: true,
          user: {
            include: { settings: true }
          }
        }
      });

      if (!page || !page.active) return res.status(404).json({ error: "Page not found" });
      if (page.isSuspended) return res.status(403).json({ error: "Cette page a été suspendue pour non-respect des conditions d'utilisation." });
      res.json(page);
    } catch (error) {
      res.status(500).json({ error: "Could not load landing page" });
    }
  });

  // Public: Render Shop Home
  app.get("/api/public/shop/:subdomain", async (req, res) => {
    try {
      const shop = await prisma.user.findUnique({
        where: { subdomain: req.params.subdomain },
        include: {
          settings: true,
          products: {
            where: { active: true },
            orderBy: { createdAt: 'desc' },
            include: { landingPages: true }
          }
        }
      });

      if (!shop || !shop.active) return res.status(404).json({ error: "Shop not found" });
      
      // Sanitized user object
      const { password, ...safeShop } = shop;
      res.json(safeShop);
    } catch (error) {
      res.status(500).json({ error: "Could not load shop" });
    }
  });

  // Public: Capture Lead (Abandoned recovery)
  app.post("/api/public/capture-lead", async (req, res) => {
    try {
      const { customerName, customerPhone, customerAddress, customerCity, userId, leadId, productName } = req.body;
      
      if (leadId) {
        const lead = await prisma.lead.update({
          where: { id: leadId },
          data: { customerName, customerPhone, customerAddress, customerCity, productName }
        });
        return res.json(lead);
      }

      const lead = await prisma.lead.create({
        data: { 
          customerName, 
          customerPhone, 
          customerAddress,
          customerCity,
          userId,
          productName
        }
      });

      // Google Sheets Sync for Leads
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.googleSheetId) {
        appendOrderToSheet(user.id, lead);
      }

      res.status(201).json(lead);
    } catch (error) {
      console.error("Lead capture error details:", error);
      res.status(500).json({ 
        error: "Failed to capture lead", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Public: Complete Order
  app.post("/api/public/complete-order", async (req, res) => {
    try {
      const { customerName, customerPhone, customerAddress, customerCity, total, deliveryFee, userId, leadId, productName, items } = req.body;
      
      const order = await prisma.order.create({
        data: {
          customerName,
          customerPhone,
          customerAddress,
          customerCity,
          total: parseFloat(total),
          deliveryFee: parseFloat(deliveryFee),
          userId,
          productName,
          items: items || [],
          status: 'COMPLETED',
          leadId
        }
      });

      // Mark lead as recovered if exists
      if (leadId) {
        await prisma.lead.update({
          where: { id: leadId },
          data: { recovered: true, customerPhone, customerAddress, customerCity, productName }
        });
      }

      // Google Sheets Sync
      const user = await prisma.user.findUnique({ 
        where: { id: userId }
      });
      if (user?.googleSheetId) {
        appendOrderToSheet(user.id, order);
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Complete order error:", error);
      res.status(500).json({ error: "Failed to complete order" });
    }
  });

  // --- Admin Middleware ---
  const checkAdmin = async (req: any, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user?.role !== 'ADMIN') return res.status(403).json({ error: "Access denied" });
    next();
  };

  // --- Admin APIs ---

  app.get("/api/admin/announcement", authenticate, async (req, res) => {
    try {
      const settings = await prisma.globalSettings.findFirst();
      res.json({ announcement: settings?.announcement || null });
    } catch (error) {
      res.status(500).json({ announcement: null });
    }
  });

  app.get("/api/admin/stats", authenticate, checkAdmin, async (req: any, res) => {
    try {
      // Platform Revenue from DELIVERED orders
      const revenueData = await prisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { total: true }
      });
      const totalRevenue = revenueData._sum.total || 0;

      // Status-wise breakdown
      const statusCounts = await prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true }
      });

      // Conversion: Orders / (Orders + Leads)
      const totalLeads = await prisma.lead.count();
      const totalOrders = await prisma.order.count();
      const conversionRate = (totalOrders + totalLeads) > 0 
        ? (totalOrders / (totalOrders + totalLeads)) * 100 
        : 0;

      // User metrics
      const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
      const premiumUsers = await prisma.user.count({ where: { role: 'USER', isPremium: true } });
      const premiumConversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const newUsersToday = await prisma.user.count({ 
        where: { role: 'USER', createdAt: { gte: last24h } } 
      });

      // Module A: Top Performing Shops (Leaderboard)
      const topShops = await prisma.user.findMany({
        where: { role: 'USER' },
        take: 10,
        select: {
          id: true,
          shopName: true,
          email: true,
          _count: {
            select: { orders: true }
          },
          orders: {
            select: { total: true }
          }
        }
      });

      const processedTopShops = topShops.map(s => ({
        id: s.id,
        shopName: s.shopName,
        email: s.email,
        orderCount: s._count.orders,
        totalRevenue: s.orders.reduce((acc, curr) => acc + (curr.total || 0), 0)
      })).sort((a, b) => b.orderCount - a.orderCount);

      res.json({
        totalRevenue: parseFloat(totalRevenue.toFixed(3)),
        orderCounts: statusCounts,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        premiumConversionRate: parseFloat(premiumConversionRate.toFixed(1)),
        totalUsers,
        newUsersToday,
        topShops: processedTopShops
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Could not fetch admin stats" });
    }
  });

  app.get("/api/admin/users/:id", authenticate, checkAdmin, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          settings: true,
          products: { take: 5, orderBy: { createdAt: 'desc' } },
          landingPages: { take: 5, orderBy: { createdAt: 'desc' } },
          orders: { take: 10, orderBy: { createdAt: 'desc' } },
          _count: {
            select: { orders: true, products: true, landingPages: true, leads: true }
          }
        }
      });
      if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Could not fetch user details" });
    }
  });

  app.get("/api/admin/users", authenticate, checkAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true, products: true }
          }
        }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Could not fetch users" });
    }
  });

  app.post("/api/admin/users/:id/toggle-active", authenticate, checkAdmin, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: { active: !user.active }
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle status" });
    }
  });

  app.post("/api/admin/users/:id/toggle-premium", authenticate, checkAdmin, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: { isPremium: !user.isPremium }
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle premium" });
    }
  });

  app.delete("/api/admin/users/:id", authenticate, checkAdmin, async (req, res) => {
    try {
      // Need to clean up relations or rely on cascade
      await prisma.settings.deleteMany({ where: { userId: req.params.id } });
      await prisma.landingPage.deleteMany({ where: { userId: req.params.id } });
      await prisma.order.deleteMany({ where: { userId: req.params.id } });
      await prisma.lead.deleteMany({ where: { userId: req.params.id } });
      await prisma.product.deleteMany({ where: { userId: req.params.id } });
      await prisma.message.deleteMany({ where: { senderId: req.params.id } });
      await prisma.user.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Module B: Landing Page Auditor & Moderator
  app.get("/api/admin/landing-pages", authenticate, checkAdmin, async (req, res) => {
    try {
      const pages = await prisma.landingPage.findMany({
        include: {
          user: {
            select: { shopName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(pages);
    } catch (error) {
      res.status(500).json({ error: "Could not fetch landing pages" });
    }
  });

  app.post("/api/admin/landing-pages/:id/toggle-suspension", authenticate, checkAdmin, async (req, res) => {
    try {
      const page = await prisma.landingPage.findUnique({ where: { id: req.params.id } });
      if (!page) return res.status(404).json({ error: "Landing page non trouvée" });

      const updated = await prisma.landingPage.update({
        where: { id: req.params.id },
        data: { isSuspended: !page.isSuspended }
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors du changement de statut" });
    }
  });

  // Module C: Global Admin Search
  app.get("/api/admin/search", authenticate, checkAdmin, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') return res.json({ users: [], orders: [], pages: [] });

      const query = q.toLowerCase();

      // Search Users (Shop Name, Email)
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { shopName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { subdomain: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10
      });

      // Search Orders (Customer Name, Phone)
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { customerName: { contains: query, mode: 'insensitive' } },
            { customerPhone: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: { user: { select: { shopName: true } } },
        take: 10
      });

      // Search Landing Pages (Title, Slug)
      const pages = await prisma.landingPage.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: { user: { select: { shopName: true } } },
        take: 10
      });

      res.json({ users, orders, pages });
    } catch (error) {
      console.error("Global search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/admin/settings", authenticate, checkAdmin, async (req, res) => {
    try {
      let settings = await prisma.globalSettings.findFirst();
      if (!settings) {
        settings = await prisma.globalSettings.create({
          data: { defaultDelivery: 7, freeShippingMin: 150 }
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Could not fetch platform settings" });
    }
  });

  app.put("/api/admin/settings", authenticate, checkAdmin, async (req, res) => {
    try {
      let settings = await prisma.globalSettings.findFirst();
      if (!settings) {
        settings = await prisma.globalSettings.create({
          data: { defaultDelivery: 7, freeShippingMin: 150 }
        });
      }
      const { id, updatedAt, ...cleanData } = req.body;
      const updated = await prisma.globalSettings.update({
        where: { id: settings.id },
        data: cleanData
      });
      res.json(updated);
    } catch (error) {
      console.error("Admin settings update error:", error);
      res.status(500).json({ error: "Failed to update platform settings" });
    }
  });

  // --- Messaging APIs ---

  app.post("/api/messages/admin", authenticate, async (req: any, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user?.isPremium && user?.role !== 'ADMIN') {
        return res.status(403).json({ error: "L'abonnement Premium est requis pour contacter l'administration." });
      }

      const { content, recipientId } = req.body; 
      
      const message = await prisma.message.create({
        data: {
          content,
          senderId: req.userId,
          recipientId: recipientId || null, // If user sends, recipient is null (admin), if admin sends, recipient is the shopId
          isAdmin: user.role === 'ADMIN',
        }
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Fetch messages:
  // - Shop owner sees their sent messages and messages where they are the recipient.
  // - Admin sees all messages, or filtered by shopId to see a specific conversation.
  app.get("/api/messages", authenticate, async (req: any, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      const { shopId } = req.query;

      let whereClause: any = {};
      if (user?.role === 'ADMIN') {
        if (shopId) {
          // View specific conversation
          whereClause = {
            OR: [
              { senderId: shopId as string },
              { recipientId: shopId as string }
            ]
          };
        } else {
          // View all messages for the list
          whereClause = {};
        }
      } else {
        // Shop owner sees only their conversation
        whereClause = {
          OR: [
            { senderId: req.userId },
            { recipientId: req.userId }
          ]
        };
      }

      const messages = await prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { shopName: true, email: true }
          }
        }
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/admin/charts/sales", authenticate, checkAdmin, async (req, res) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, status: 'DELIVERED' },
        orderBy: { createdAt: 'asc' }
      });

      const salesByDate: Record<string, number> = {};
      orders.forEach(o => {
        const date = o.createdAt.toISOString().split('T')[0];
        salesByDate[date] = (salesByDate[date] || 0) + (o.total || 0);
      });

      const chartData = Object.entries(salesByDate).map(([date, total]) => ({ date, total }));
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ error: "Chart data failed" });
    }
  });

  app.get("/api/admin/charts/regions", authenticate, checkAdmin, async (req, res) => {
    try {
      const orders = await prisma.order.findMany({ select: { customerAddress: true } });
      const regions: Record<string, number> = {};
      
      orders.forEach(o => {
        // Simple extraction for demo purposes, in real app would use a specific field
        const commonRegions = ["Tunis", "Sousse", "Sfax", "Nabeul", "Bizerte", "Ariana", "Ben Arous", "Kairouan", "Gafsa", "Gabes"];
        let found = "Autre";
        for (const r of commonRegions) {
          if (o.customerAddress?.toLowerCase().includes(r.toLowerCase())) {
            found = r;
            break;
          }
        }
        regions[found] = (regions[found] || 0) + 1;
      });

      const chartData = Object.entries(regions).map(([name, value]) => ({ name, value }));
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ error: "Region data failed" });
    }
  });

  // --- AI WhatsApp Assistant API ---
  app.post("/api/ai/whatsapp", async (req, res) => {
    try {
      const { shopId, message } = req.body;
      if (!shopId || !message) return res.status(400).json({ error: "Missing parameters" });

      const response = await getAIResponse(shopId, message);
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: "AI Assistant failed" });
    }
  });

  // --- Template Update API ---
  app.put("/api/user/template", authenticate, async (req: any, res) => {
    try {
      const { templateId } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      
      if (!user) return res.status(404).json({ error: "User not found" });

      const premiumTemplates = ['vsl', 'instagram', 'tiktok', 'luxury', 'mega', 'minimal', 'vintage', 'future'];
      if (premiumTemplates.includes(templateId) && !user.isPremium) {
        return res.status(403).json({ error: "Ce template est réservé aux membres Premium." });
      }

      await prisma.user.update({
        where: { id: req.userId },
        data: { templateId }
      });
      res.json({ success: true, templateId });
    } catch (error) {
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // --- Setting default global settings on start if not exist ---
  const initGlobalSettings = async () => {
    const existing = await prisma.globalSettings.findFirst();
    if (!existing) {
      await prisma.globalSettings.create({
        data: { defaultDelivery: 7, freeShippingMin: 150 }
      });
    }
  };
  initGlobalSettings();

  // --- Settings API ---
  app.get("/api/settings", authenticate, async (req: any, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { settings: true }
      });
      
      let settings = user?.settings;
      if (!settings) {
        settings = await prisma.settings.create({ data: { userId: req.userId } });
      }
      
      res.json({ ...settings, isConnectedToGoogle: !!user?.googleSheetId });
    } catch (error) {
      console.error("Fetch settings error:", error);
      res.status(500).json({ error: "Could not fetch settings" });
    }
  });

  app.put("/api/settings", authenticate, async (req: any, res) => {
    try {
      const { id, userId, isConnectedToGoogle, ...updateData } = req.body;
      
      // Sanitization: Ensure only valid fields are sent to Prisma
      const validFields = [
        "storeName", "logo", "banner", "primaryColor", "secondaryColor",
        "bannerText", "freeShippingMin", "fixedDelivery", "tiktokPixel",
        "facebookPixel", "whatsappAssistantEnabled", "arabicFont"
      ];
      
      const sanitizedData: any = {};
      validFields.forEach(field => {
        if (updateData[field] !== undefined) {
          sanitizedData[field] = updateData[field];
        }
      });

      const settings = await prisma.settings.update({
        where: { userId: req.userId },
        data: sanitizedData
      });
      res.json(settings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Could not update settings" });
    }
  });

  // --- Catch-all for non-existent API routes ---
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `L'API demandée n'existe pas: ${req.method} ${req.url}` });
  });

  // --- Vite / Static Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ConvertyFlow Server running on http://localhost:${PORT}`);
  });
}

startServer();
