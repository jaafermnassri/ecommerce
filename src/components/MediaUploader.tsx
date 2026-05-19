import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video, Percent } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface MediaUploaderProps {
  onUploadComplete: (url: string) => void;
  initialUrl?: string;
  type?: 'image' | 'video' | 'any';
  label?: string;
  className?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUploadComplete,
  initialUrl,
  type = 'any',
  label = 'Upload Media',
  className
}) => {
  const { token } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setProgress(0);

    try {
      let fileToUpload = file;

      // Type validation
      if (type === 'image' && !file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }
      if (type === 'video' && !file.type.startsWith('video/')) {
        throw new Error('Please upload a video file');
      }

      // Compression logic for images
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.15, // 150KB as requested
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp' as any
        };
        try {
          setProgress(10);
          fileToUpload = await imageCompression(file, options);
          setProgress(30);
        } catch (err) {
          console.error("Compression error:", err);
          // Continue with original file if compression fails
        }
      }

      // Size limit for videos (10MB)
      if (file.type.startsWith('video/')) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('Video must be under 10MB');
        }
      }

      // 1. Get Presigned URL from backend
      if (!token) {
        throw new Error('Vous devez être connecté pour téléverser des fichiers.');
      }

      const presignedRes = await fetch('/api/v1/r2/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: fileToUpload.name,
          fileType: fileToUpload.type
        })
      });

      const contentType = presignedRes.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await presignedRes.json();
      } else {
        const text = await presignedRes.text();
        console.error("Non-JSON response received:", text);
        throw new Error(`Erreur serveur (${presignedRes.status}). Veuillez contacter le support.`);
      }

      if (!presignedRes.ok) {
        throw new Error(data.error || 'Échec de l\'autorisation de téléversement');
      }
      const { presignedUrl, publicUrl } = data;

      setProgress(50);

      // 2. Upload binary to R2
      const uploadRes = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', fileToUpload.type);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 50) + 50;
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            console.error("R2 Upload failed with status:", xhr.status, xhr.statusText);
            reject(new Error(`Upload failed (${xhr.status}). Vérifiez vos permissions R2.`));
          }
        };

        xhr.onerror = () => {
          console.error("XHR Network Error. This is likely a CORS issue or invalid R2 configuration.");
          reject(new Error('Erreur réseau lors du téléversement. Veuillez vérifier la configuration CORS de votre bucket R2.'));
        };
        
        xhr.send(fileToUpload);
      });

      // 3. Complete
      setPreview(publicUrl);
      onUploadComplete(publicUrl);
      setIsUploading(false);
      setProgress(100);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || 'Error uploading file');
      setIsUploading(false);
    }
  };

  const removeMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onUploadComplete('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isVideo = preview?.match(/\.(mp4|webm|ogg|mov)$/i) || preview?.includes('video');

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">{label}</label>}
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed transition-all duration-300 rounded-[2rem] flex flex-col items-center justify-center p-4 min-h-[160px] overflow-hidden",
          isUploading ? "border-brand-primary bg-indigo-50/30" : "border-slate-200 hover:border-brand-primary hover:bg-slate-50",
          preview ? "border-solid border-slate-100" : ""
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept={type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'image/*,video/*'}
        />

        {preview ? (
          <div className="w-full h-full absolute inset-0 group">
            {isVideo ? (
              <video 
                src={preview} 
                className="w-full h-full object-cover" 
                controls={false}
                autoPlay
                muted
                loop
              />
            ) : (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="p-3 bg-white text-slate-900 rounded-2xl hover:scale-110 transition-transform"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button 
                onClick={removeMedia}
                className="p-3 bg-red-500 text-white rounded-2xl hover:scale-110 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-brand-primary">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              {type === 'video' ? <Video className="w-6 h-6" /> : type === 'image' ? <ImageIcon className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">Cliquez pour téléverser</p>
              <p className="text-[0.65rem] font-medium opacity-60">
                {type === 'image' ? 'Images (Max 150KB)' : type === 'video' ? 'Vidéos (Max 10MB)' : 'Images ou Vidéos'}
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-brand-primary animate-spin opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-brand-primary">{progress}%</span>
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-600 mt-4">Téléversement en cours...</p>
            <div className="w-full max-w-[120px] h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-brand-primary transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-50 text-red-500 p-2 rounded-xl text-[0.65rem] font-bold text-center animate-in slide-in-from-bottom-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
