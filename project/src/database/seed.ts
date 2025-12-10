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

  // Garantir que existe pelo menos uma loja para usuários que precisam
  let store = await prisma.store.findFirst({
    where: { isActive: true }
  });
  if (!store) {
    console.log('🏪 Criando loja padrão...');
    store = await prisma.store.create({
      data: {
        name: 'Loja Central',
        address: 'Rua Principal, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        phone: '(11) 99999-9999',
        email: 'loja@central.com',
        isActive: true,
      },
    });
    console.log('✅ Loja criada:', store.name);
  } else {
    console.log('🏪 Loja existente encontrada:', store.name);
  }

  // Criar usuários
  const users = [
    {
      name: 'Administrador',
      email: 'admin@loja.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      // ADMIN não precisa de storeId
    },
    {
      name: 'João Silva',
      email: 'funcionario@loja.com',
      password: 'func123',
      role: UserRole.CASHIER,
      storeId: store?.id, // CASHIER pode ter loja se existir
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
    {
      name: 'Renan Gerente',
      email: 'renan.queiroz08sr@gmail.com',
      password: 'gerente123',
      role: UserRole.STORE_MANAGER,
      storeId: store?.id, // STORE_MANAGER pode ter loja se existir
      phone: '11999228546',
      address: 'Rua dos Gerentes, 456',
      isActive: true,
      avatarUrl: 'https://ik.imagekit.io/ujp6mp5if/Avatares/6e391ced-18c1-4e33-8526-df94e3f74b90_1765330430723.jpg',
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
  console.log('   - renan.queiroz08sr@gmail.com / gerente123 (Gerente da Loja)');
  console.log('   - funcionario@loja.com / func123 (Funcionário)');
  console.log('   - cliente@loja.com / cliente123 (Cliente)');
}
