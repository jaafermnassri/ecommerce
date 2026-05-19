import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Promoting user to ADMIN...');
  try {
    const user = await prisma.user.update({
      where: { email: 'mnassrijaafer0@gmail.com' },
      data: { role: 'ADMIN' }
    });
    console.log('User promoted successfully:', user.email);
  } catch (e) {
    console.log('User not found or already updated.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
