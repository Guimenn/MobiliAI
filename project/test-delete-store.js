const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDeleteStore() {
  try {
    const storeId = '53cc1b32-d3c0-44d7-a905-1554af115406';

    console.log('=== TESTE DIRETO DE EXCLUSÃO DE LOJA ===');
    console.log('ID da loja:', storeId);

    // Verificar se a loja existe
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      console.log('Loja não encontrada');
      return;
    }

    console.log('Loja encontrada:', store.name);

    // Verificar usuários associados
    const associatedUsers = await prisma.user.count({
      where: { storeId }
    });
    console.log('Usuários associados à loja:', associatedUsers);

    if (associatedUsers > 0) {
      console.log('Desvinculando usuários...');

      const updatedUsers = await prisma.user.updateMany({
        where: {
          storeId,
          role: {
            in: ['STORE_MANAGER', 'CASHIER', 'EMPLOYEE']
          }
        },
        data: {
          storeId: null
        }
      });

      console.log('Usuários desvinculados:', updatedUsers.count);
    }

    // Verificar e excluir vendas associadas
    const salesCount = await prisma.sale.count({
      where: { storeId }
    });
    console.log('Vendas associadas à loja:', salesCount);

    if (salesCount > 0) {
      const deletedSales = await prisma.sale.deleteMany({
        where: { storeId }
      });
      console.log('Vendas excluídas:', deletedSales.count);
    }

    // Excluir dados relacionados
    const deletedInventory = await prisma.storeInventory.deleteMany({ where: { storeId } });
    const deletedCash = await prisma.dailyCash.deleteMany({ where: { storeId } });
    const deletedCashFlows = await prisma.cashFlow.deleteMany({ where: { storeId } });
    const deletedReports = await prisma.report.deleteMany({ where: { storeId } });
    const deletedCoupons = await prisma.coupon.deleteMany({ where: { storeId } });

    console.log('Dados relacionados removidos');

    // Tentar excluir a loja
    console.log('Tentando excluir a loja...');
    const deletedStore = await prisma.store.delete({
      where: { id: storeId }
    });

    console.log('✅ LOJA EXCLUÍDA COM SUCESSO:', deletedStore);

  } catch (error) {
    console.error('❌ ERRO ao excluir loja:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteStore();
