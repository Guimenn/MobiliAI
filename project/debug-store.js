const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugStore() {
  try {
    const storeId = '859c6ead-ff59-4692-bb2e-762b297972bf';

    console.log('=== DEBUG DA LOJA PROBLEMÁTICA ===');
    console.log('ID da loja:', storeId);

    // Verificar se a loja existe
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      console.log('❌ Loja não encontrada');
      return;
    }

    console.log('✅ Loja encontrada:', store.name);
    console.log('Dados da loja:', {
      id: store.id,
      name: store.name,
      isActive: store.isActive,
      createdAt: store.createdAt
    });

    // Verificar usuários associados
    const users = await prisma.user.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    console.log('👥 Usuários associados:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role})`);
    });

    // Verificar vendas
    const sales = await prisma.sale.count({
      where: { storeId }
    });

    console.log('💰 Vendas associadas:', sales);

    // Verificar inventário
    const inventory = await prisma.storeInventory.count({
      where: { storeId }
    });

    console.log('📦 Itens no inventário:', inventory);

    // Verificar caixa
    const cash = await prisma.dailyCash.count({
      where: { storeId }
    });

    console.log('💵 Registros de caixa:', cash);

    // Verificar fluxos de caixa
    const cashFlows = await prisma.cashFlow.count({
      where: { storeId }
    });

    console.log('💸 Fluxos de caixa:', cashFlows);

    // Verificar relatórios
    const reports = await prisma.report.count({
      where: { storeId }
    });

    console.log('📊 Relatórios:', reports);

    // Verificar cupons
    const coupons = await prisma.coupon.count({
      where: { storeId }
    });

    console.log('🎫 Cupons:', coupons);

    console.log('=== FIM DO DEBUG ===');

  } catch (error) {
    console.error('❌ ERRO no debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStore();
