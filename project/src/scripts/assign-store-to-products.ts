import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para atribuir storeId aos produtos que estão sem loja
 * Distribui os produtos igualmente entre as lojas existentes
 */
async function assignStoreToProducts() {
  try {
    console.log('🔍 Buscando produtos sem storeId...');
    
    // Buscar todos os produtos sem storeId
    const productsWithoutStore = await prisma.product.findMany({
      where: {
        storeId: null
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`📦 Encontrados ${productsWithoutStore.length} produtos sem storeId`);

    if (productsWithoutStore.length === 0) {
      console.log('✅ Todos os produtos já têm storeId atribuído!');
      return;
    }

    // Buscar todas as lojas
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`🏪 Encontradas ${stores.length} lojas:`);
    stores.forEach(store => {
      console.log(`  - ${store.name} (${store.id})`);
    });

    if (stores.length === 0) {
      console.error('❌ Nenhuma loja encontrada! Crie lojas antes de executar este script.');
      return;
    }

    // Distribuir produtos igualmente entre as lojas
    const productsPerStore = Math.ceil(productsWithoutStore.length / stores.length);
    console.log(`\n📊 Distribuindo aproximadamente ${productsPerStore} produtos por loja...\n`);

    let storeIndex = 0;
    let productsAssigned = 0;

    for (let i = 0; i < productsWithoutStore.length; i++) {
      const product = productsWithoutStore[i];
      const store = stores[storeIndex];

      // Atualizar produto com storeId
      await prisma.product.update({
        where: { id: product.id },
        data: { storeId: store.id }
      });

      productsAssigned++;
      console.log(`✅ Produto "${product.name}" atribuído à loja "${store.name}"`);

      // Alternar para a próxima loja quando atingir o limite por loja
      if (productsAssigned % productsPerStore === 0 && storeIndex < stores.length - 1) {
        storeIndex++;
      }
    }

    console.log(`\n✅ Concluído! ${productsAssigned} produtos foram atribuídos às lojas.`);

    // Verificar distribuição final
    console.log('\n📊 Distribuição final por loja:');
    for (const store of stores) {
      const count = await prisma.product.count({
        where: { storeId: store.id }
      });
      console.log(`  - ${store.name}: ${count} produtos`);
    }

  } catch (error) {
    console.error('❌ Erro ao atribuir storeId aos produtos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
assignStoreToProducts()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });

