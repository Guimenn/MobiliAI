import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para duplicar produtos em todas as lojas
 * Cria produtos novos para cada loja (mantém os 90 originais + cria cópias para outras lojas)
 * Cada loja terá seus próprios produtos independentes (mesmo nome, mas IDs diferentes)
 * Vantagem: Total independência - editar na loja 1 não afeta loja 2
 */
async function duplicateProductsToAllStores() {
  try {
    console.log('🔍 Buscando produtos base e lojas...\n');
    
    // Buscar TODOS os produtos ativos (independente de ter storeId ou não)
    // Vamos usar todos os produtos como base para criar StoreInventory em todas as lojas
    let baseProducts = await prisma.product.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        shortDescription: true,
        category: true,
        price: true,
        costPrice: true,
        stock: true,
        minStock: true,
        style: true,
        material: true,
        colorHex: true,
        colorName: true,
        customColor: true,
        width: true,
        height: true,
        depth: true,
        weight: true,
        brand: true,
        model: true,
        sku: true,
        barcode: true,
        imageUrl: true,
        imageUrls: true,
        videoUrl: true,
        tags: true,
        keywords: true,
        isFeatured: true,
        isNew: true,
        isBestSeller: true,
        isAvailable: true,
        supplierId: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📦 Encontrados ${baseProducts.length} produtos base`);

    if (baseProducts.length === 0) {
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

    console.log(`\n📊 Iniciando adição de produtos às lojas via StoreInventory...\n`);
    console.log(`   Mantendo os ${baseProducts.length} produtos originais no banco\n`);
    console.log(`   Cada loja receberá os produtos com estoque independente no StoreInventory\n`);

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Para cada loja
    for (const store of stores) {
      console.log(`\n🏪 Processando loja: ${store.name} (${store.id})`);
      
      // Verificar quantos produtos já estão no StoreInventory desta loja
      const existingCount = await prisma.storeInventory.count({
        where: { storeId: store.id }
      });
      
      if (existingCount >= baseProducts.length) {
        console.log(`   ⏭️  Loja já tem ${existingCount} produtos no StoreInventory (suficiente), pulando...`);
        totalSkipped += baseProducts.length;
        continue;
      }

      let addedInStore = 0;
      let skippedInStore = 0;

      // Para cada produto, adicionar ao StoreInventory da loja
      for (const product of baseProducts) {
        try {
          // Verificar se já existe no StoreInventory desta loja
          const existing = await prisma.storeInventory.findUnique({
            where: {
              storeId_productId: {
                storeId: store.id,
                productId: product.id
              }
            }
          });

          if (existing) {
            skippedInStore++;
            if (skippedInStore % 20 === 0) {
              console.log(`   ⏭️  ${skippedInStore} produtos já existem...`);
            }
            continue;
          }

          // Calcular estoque inicial (distribuir o estoque do produto entre as lojas)
          const stockPerStore = Math.floor((product.stock || 0) / stores.length);
          const remainingStock = (product.stock || 0) % stores.length;
          // As primeiras lojas recebem 1 unidade extra se houver resto
          const storeIndex = stores.findIndex(s => s.id === store.id);
          const initialQuantity = stockPerStore + (storeIndex < remainingStock ? 1 : 0);

          // Criar registro no StoreInventory
          await prisma.storeInventory.create({
            data: {
              storeId: store.id,
              productId: product.id,
              quantity: initialQuantity,
              minStock: product.minStock || 0
            }
          });

          addedInStore++;
          totalAdded++;
          
          if (addedInStore % 20 === 0) {
            console.log(`   ✅ ${addedInStore} produtos adicionados...`);
          }
        } catch (error: any) {
          console.error(`   ❌ Erro ao adicionar produto "${product.name}": ${error.message}`);
          totalErrors++;
        }
      }

      console.log(`   ✅ Loja "${store.name}": ${addedInStore} adicionados, ${skippedInStore} já existiam`);
    }

    console.log(`\n\n📊 RESUMO FINAL:`);
    console.log(`   ✅ Produtos adicionados ao StoreInventory: ${totalAdded}`);
    console.log(`   ⏭️  Produtos já existentes: ${totalSkipped}`);
    console.log(`   ❌ Erros: ${totalErrors}`);
    console.log(`   📦 Produtos originais no banco: ${baseProducts.length} (MANTIDOS - não duplicados)`);
    console.log(`   🏪 Total de lojas: ${stores.length}`);
    console.log(`   💾 Total de registros no StoreInventory: ${totalAdded + totalSkipped}`);

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
      console.log(`     - Produtos disponíveis: ${count}`);
      console.log(`     - Estoque total: ${totalStock._sum.quantity || 0} unidades`);
    }
    
    console.log(`\n💡 IMPORTANTE:`);
    console.log(`   ✅ Os ${baseProducts.length} produtos originais foram MANTIDOS no banco`);
    console.log(`   ✅ Cada loja tem acesso a eles via StoreInventory com estoque INDEPENDENTE`);
    console.log(`   ✅ Editar estoque na loja 1 NÃO afeta a loja 2`);
    console.log(`   ✅ Total de produtos no banco: ${baseProducts.length} (não ${baseProducts.length * stores.length})`);

  } catch (error) {
    console.error('❌ Erro ao duplicar produtos para lojas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
duplicateProductsToAllStores()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });

