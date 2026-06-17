import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@comandero.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@comandero.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const products = [
    {
      name: 'Chorizo Asado',
      price: 15000,
      category: 'CHORIZOS',
      description: 'Chorizo asado a la parrilla',
    },
    {
      name: 'Chorizo Crudo',
      price: 12000,
      category: 'CHORIZOS',
      description: 'Chorizo crudo para preparar',
    },
    {
      name: 'Arroz con Leche 7oz',
      price: 5000,
      category: 'ARROZ CON LECHE',
      description: 'Arroz con leche porción de 7oz',
    },
    {
      name: 'Arroz con Leche 24oz',
      price: 12000,
      category: 'ARROZ CON LECHE',
      description: 'Arroz con leche porción de 24oz',
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });
    if (!existing) {
      await prisma.product.create({ data: product });
    }
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
