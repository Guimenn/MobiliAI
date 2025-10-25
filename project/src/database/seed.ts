import { PrismaClient, UserRole, ProductCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

export async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Buscar uma loja existente ou criar uma loja padrão se não houver nenhuma
  let store = await prisma.store.findFirst();
  
  if (!store) {
    store = await prisma.store.create({
      data: {
        name: 'Loja Central - Matriz',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        phone: '(11) 99999-9999',
        email: 'contato@lojacentral.com',
        description: 'Loja matriz do sistema',
        workingHours: {
          monday: { open: '08:00', close: '18:00', isOpen: true },
          tuesday: { open: '08:00', close: '18:00', isOpen: true },
          wednesday: { open: '08:00', close: '18:00', isOpen: true },
          thursday: { open: '08:00', close: '18:00', isOpen: true },
          friday: { open: '08:00', close: '18:00', isOpen: true },
          saturday: { open: '08:00', close: '17:00', isOpen: true },
          sunday: { open: '09:00', close: '15:00', isOpen: false }
        },
        settings: {
          allowOnlineOrders: true,
          requireApprovalForOrders: false,
          sendNotifications: true,
          autoAcceptPayments: true,
          lowStockAlert: true,
          customerRegistrationRequired: false
        }
      },
    });
  }

  // Criar usuários
  const users = [
    {
      name: 'Administrador',
      email: 'admin@loja.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      storeId: store.id,
    },
    {
      name: 'João Silva',
      email: 'funcionario@loja.com',
      password: 'func123',
      role: UserRole.CASHIER,
      storeId: store.id,
    },
    {
      name: 'Maria Santos',
      email: 'cliente@loja.com',
      password: 'cliente123',
      role: UserRole.CUSTOMER,
      phone: '(11) 88888-8888',
      address: 'Rua das Palmeiras, 456',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04567-890',
    },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });
  }

  // Criar produtos
  const products = [
    {
      name: 'Tinta Acrílica Branco Gelo',
      description: 'Tinta acrílica de alta qualidade para interiores',
      category: ProductCategory.OUTROS,
      price: 89.90,
      costPrice: 60.00,
      stock: 50,
      minStock: 10,
      color: 'Branco Gelo',
      colorCode: '#F8F8FF',
      brand: 'Suvinil',
      size: '3.6L',
      unit: 'Lata',
      storeId: store.id,
    },
    {
      name: 'Tinta Acrílica Azul Oceano',
      description: 'Tinta acrílica para interiores e exteriores',
      category: ProductCategory.OUTROS,
      price: 95.50,
      costPrice: 65.00,
      stock: 30,
      minStock: 10,
      color: 'Azul Oceano',
      colorCode: '#006994',
      brand: 'Suvinil',
      size: '3.6L',
      unit: 'Lata',
      storeId: store.id,
    },
    {
      name: 'Tinta Acrílica Verde Menta',
      description: 'Tinta acrílica suave para quartos e salas',
      category: ProductCategory.OUTROS,
      price: 92.00,
      costPrice: 62.00,
      stock: 25,
      minStock: 10,
      color: 'Verde Menta',
      colorCode: '#98FB98',
      brand: 'Coral',
      size: '3.6L',
      unit: 'Lata',
      storeId: store.id,
    },
    {
      name: 'Pincel Chato 2"',
      description: 'Pincel chato profissional para acabamentos',
      category: ProductCategory.OUTROS,
      price: 15.90,
      costPrice: 8.00,
      stock: 100,
      minStock: 20,
      brand: 'Tigre',
      size: '2 polegadas',
      unit: 'Unidade',
      storeId: store.id,
    },
    {
      name: 'Rolo de Pintura 9"',
      description: 'Rolo de pintura para grandes superfícies',
      category: ProductCategory.OUTROS,
      price: 12.50,
      costPrice: 6.00,
      stock: 80,
      minStock: 15,
      brand: 'Tigre',
      size: '9 polegadas',
      unit: 'Unidade',
      storeId: store.id,
    },
    {
      name: 'Fita Crepe 48mm',
      description: 'Fita crepe para proteção e acabamentos',
      category: ProductCategory.OUTROS,
      price: 8.90,
      costPrice: 4.00,
      stock: 200,
      minStock: 50,
      brand: '3M',
      size: '48mm x 50m',
      unit: 'Rolo',
      storeId: store.id,
    },
    {
      name: 'Kit Pintura Completo',
      description: 'Kit com tinta, pincel, rolo e fita crepe',
      category: ProductCategory.OUTROS,
      price: 199.90,
      costPrice: 120.00,
      stock: 15,
      minStock: 5,
      brand: 'Suvinil',
      size: 'Kit Completo',
      unit: 'Kit',
      storeId: store.id,
    },
  ];

  for (const productData of products) {
    await prisma.product.create({
      data: productData,
    });
  }

  console.log('✅ Seed do banco de dados concluído!');
  console.log('👤 Usuários criados:');
  console.log('   - admin@loja.com / admin123 (Admin)');
  console.log('   - funcionario@loja.com / func123 (Funcionário)');
  console.log('   - cliente@loja.com / cliente123 (Cliente)');
  console.log('🏪 Loja criada: Loja Central');
  console.log('📦 Produtos criados: 7 produtos');
}
