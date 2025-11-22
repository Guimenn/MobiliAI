import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para adicionar todos os produtos existentes a todas as lojas
 * Cria registros no StoreInventory para cada produto em cada loja
 */
async function addProductsToAllStores() {
  try {
    console.log('🔍 Buscando produtos e lojas...\n');
    
    // Buscar todos os produtos ativos
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        storeId: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📦 Encontrados ${products.length} produtos`);

    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado!');
      return;
    }

    // Buscar todas as lojas ativas
    const stores = await prisma.store.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`🏪 Encontradas ${stores.length} lojas:\n`);
    stores.forEach((store, index) => {
      console.log(`  ${index + 1}. ${store.name} (${store.id})`);
    });

    if (stores.length === 0) {
      console.error('❌ Nenhuma loja encontrada! Crie lojas antes de executar este script.');
      return;
    }

    console.log(`\n📊 Iniciando adição de produtos às lojas...\n`);

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Para cada produto
    for (const product of products) {
      console.log(`\n🔄 Processando: ${product.name} (${product.id})`);
      console.log(`   Estoque atual: ${product.stock}`);
      console.log(`   StoreId principal: ${product.storeId || 'NULL'}`);

      // Calcular estoque por loja (distribuir igualmente)
      const stockPerStore = Math.floor(product.stock / stores.length);
      const remainingStock = product.stock % stores.length;

      console.log(`   Distribuindo: ${stockPerStore} unidades por loja (+ ${remainingStock} unidades extras)`);

      // Para cada loja
      for (let i = 0; i < stores.length; i++) {
        const store = stores[i];
        
        // Verificar se já existe registro no StoreInventory
        const existingInventory = await prisma.storeInventory.findUnique({
          where: {
            storeId_productId: {
              storeId: store.id,
              productId: product.id
            }
          }
        });

        if (existingInventory) {
          console.log(`   ⏭️  Loja "${store.name}": Já existe (quantity: ${existingInventory.quantity})`);
          totalSkipped++;
          continue;
        }

        try {
          // Calcular quantidade para esta loja
          // As primeiras lojas recebem 1 unidade extra se houver resto
          const quantity = stockPerStore + (i < remainingStock ? 1 : 0);

          // Criar registro no StoreInventory
          await prisma.storeInventory.create({
            data: {
              storeId: store.id,
              productId: product.id,
              quantity: quantity,
              minStock: product.minStock || 0
            }
          });

          console.log(`   ✅ Loja "${store.name}": Adicionado com ${quantity} unidades`);
          totalAdded++;
        } catch (error: any) {
          console.error(`   ❌ Loja "${store.name}": Erro - ${error.message}`);
          totalErrors++;
        }
      }
    }

    console.log(`\n\n📊 RESUMO FINAL:`);
    console.log(`   ✅ Produtos adicionados: ${totalAdded} registros`);
    console.log(`   ⏭️  Já existiam: ${totalSkipped} registros`);
    console.log(`   ❌ Erros: ${totalErrors} registros`);
    console.log(`   📦 Total de produtos processados: ${products.length}`);
    console.log(`   🏪 Total de lojas: ${stores.length}`);

    // Verificar distribuição final
    console.log(`\n📊 Verificando distribuição final por loja:\n`);
    for (const store of stores) {
      const count = await prisma.storeInventory.count({
        where: { storeId: store.id }
      });
      const totalStock = await prisma.storeInventory.aggregate({
        where: { storeId: store.id },
        _sum: { quantity: true }
      });
      console.log(`   ${store.name}:`);
      console.log(`     - Produtos: ${count}`);
      console.log(`     - Estoque total: ${totalStock._sum.quantity || 0} unidades`);
    }

  } catch (error) {
    console.error('❌ Erro ao adicionar produtos às lojas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
addProductsToAllStores()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });

