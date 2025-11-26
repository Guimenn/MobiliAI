import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

export async function seedDatabase() {
  console.log('🌱 Iniciando seed de usuários...');

  // Buscar uma loja existente (opcional - apenas para usuários que precisam de loja)
  const store = await prisma.store.findFirst();

  // Criar usuários
  const users = [
    {
      name: 'Administrador',
      email: 'admin@loja.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      storeId: store?.id || null,
    },
    {
      name: 'João Silva',
      email: 'funcionario@loja.com',
      password: 'func123',
      role: UserRole.CASHIER,
      storeId: store?.id || null,
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

  let createdCount = 0;
  let skippedCount = 0;

  for (const userData of users) {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`⏭️  Usuário já existe: ${userData.email}`);
      skippedCount++;
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });
    createdCount++;
    console.log(`✅ Usuário criado: ${userData.email}`);
  }

  console.log('\n✅ Seed de usuários concluído!');
  console.log(`👤 Usuários criados: ${createdCount}`);
  console.log(`⏭️  Usuários já existentes: ${skippedCount}`);
  console.log('\n📋 Credenciais:');
  console.log('   - admin@loja.com / admin123 (Admin)');
  console.log('   - funcionario@loja.com / func123 (Funcionário)');
  console.log('   - cliente@loja.com / cliente123 (Cliente)');
}
