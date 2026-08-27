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

  const rawMaterials = [
    // CARNES
    { name: 'Chorizo Especial (paquete x5)', category: 'CARNES', unit: 'paquete' },
    { name: 'Chorizo Premium (paquete x5)', category: 'CARNES', unit: 'paquete' },
    { name: 'Carne de Cerdo', category: 'CARNES', unit: 'LB' },
    { name: 'Carne de Res', category: 'CARNES', unit: 'LB' },
    { name: 'Carne Molida Res', category: 'CARNES', unit: 'LB' },
    { name: 'Carne Molida Cerdo', category: 'CARNES', unit: 'LB' },
    { name: 'Pechuga de Pollo', category: 'CARNES', unit: 'unidad' },
    { name: 'Jamón', category: 'CARNES', unit: 'und' },
    { name: 'Tocineta', category: 'CARNES', unit: 'unidad' },
    { name: 'Tocineta ARA', category: 'CARNES', unit: 'unidad' },
    // LACTEOS
    { name: 'Queso', category: 'LACTEOS', unit: 'und' },
    { name: 'Crema de Leche (200g)', category: 'LACTEOS', unit: '200g' },
    // VERDURAS
    { name: 'Cebolla Cabezona', category: 'VERDURAS', unit: 'paquete' },
    { name: 'Tomate', category: 'VERDURAS', unit: 'paquete' },
    { name: 'Limón (12und)', category: 'VERDURAS', unit: '12und' },
    { name: 'Ajo (3 cabezas)', category: 'VERDURAS', unit: '3 cabezas' },
    { name: 'Cebolla Larga', category: 'VERDURAS', unit: 'atado' },
    { name: 'Hierbas', category: 'VERDURAS', unit: 'atado' },
    { name: 'Papa', category: 'VERDURAS', unit: 'LB' },
    { name: 'Aguacate', category: 'VERDURAS', unit: 'und' },
    // ABARROTES
    { name: 'Aceite (3L)', category: 'ABARROTES', unit: '3L' },
    { name: 'Huevo', category: 'ABARROTES', unit: 'panal' },
    { name: 'Mantequilla', category: 'ABARROTES', unit: 'barra' },
    { name: 'Miga de Pan', category: 'ABARROTES', unit: 'und' },
    { name: 'Tortilla', category: 'ABARROTES', unit: 'und' },
    // SALSAS
    { name: 'Mostaza', category: 'SALSAS', unit: 'und' },
    { name: 'Carbonara', category: 'SALSAS', unit: 'und' },
    // DESECHABLES
    { name: 'Bolsa de Aluminio (100und)', category: 'DESECHABLES', unit: '100und' },
    { name: 'Cucharitas (100und)', category: 'DESECHABLES', unit: '100und' },
    { name: 'Copas + Tapa (100und)', category: 'DESECHABLES', unit: '100und' },
    { name: 'Palos Chuzo (100und)', category: 'DESECHABLES', unit: '100und' },
    // GASEOSAS
    { name: 'Gaseosa 3L paca', category: 'GASEOSAS', unit: 'paca' },
    { name: 'Postobon paca x12', category: 'GASEOSAS', unit: 'paca x12' },
    { name: 'Coca-Cola paca x12', category: 'GASEOSAS', unit: 'paca x12' },
    { name: 'Agua Frutal paca x15', category: 'GASEOSAS', unit: 'paca x15' },
    { name: 'Cerveza (6und)', category: 'GASEOSAS', unit: '6und' },
  ];

  for (const rm of rawMaterials) {
    const existing = await prisma.rawMaterial.findFirst({
      where: { name: rm.name },
    });
    if (!existing) {
      await prisma.rawMaterial.create({ data: rm });
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
