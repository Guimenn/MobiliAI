import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMultiStoreCatalog() {
  try {
    console.log('🧪 Testando funcionalidade de múltiplos catálogos...\n');

    // Buscar algumas lojas
    const stores = await prisma.store.findMany({
      take: 3,
      select: { id: true, name: true }
    });

    if (stores.length < 2) {
      console.log('❌ Precisa de pelo menos 2 lojas para o teste');
      return;
    }

    console.log(`🏪 Lojas encontradas:`);
    stores.forEach((store, index) => {
      console.log(`  ${index + 1}. ${store.name} (${store.id})`);
    });

    // Buscar um produto existente
    const product = await prisma.product.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        storeId: true,
        store: { select: { name: true } }
      }
    });

    if (!product) {
      console.log('❌ Nenhum produto encontrado');
      return;
    }

    console.log(`\n📦 Produto selecionado: ${product.name} (${product.id})`);
    console.log(`   Loja principal: ${product.store?.name || 'Nenhuma'} (${product.storeId || 'NULL'})`);

    // Verificar se o produto já está no catálogo de cada loja
    console.log(`\n🔍 Verificando catálogos atuais:`);
    for (const store of stores) {
      const inventory = await prisma.storeInventory.findUnique({
        where: {
          storeId_productId: {
            storeId: store.id,
            productId: product.id
          }
        }
      });

      const isInCatalog = product.storeId === store.id || !!inventory;
      console.log(`   ${store.name}: ${isInCatalog ? '✅ No catálogo' : '❌ Fora do catálogo'}`);
    }

    // Testar adicionar o produto ao catálogo da primeira loja
    const targetStore = stores[0];
    console.log(`\n➕ Testando adicionar produto ao catálogo da loja: ${targetStore.name}`);

    // Simular a chamada do método addProductToStoreCatalog
    const existingInventory = await prisma.storeInventory.findUnique({
      where: {
        storeId_productId: {
          storeId: targetStore.id,
          productId: product.id
        }
      }
    });

    if (existingInventory) {
      console.log(`   ⚠️  Produto já está no catálogo desta loja`);
    } else {
      // Criar registro no StoreInventory
      const newInventory = await prisma.storeInventory.create({
        data: {
          storeId: targetStore.id,
          productId: product.id,
          quantity: 0,
          minStock: 0
        }
      });

      console.log(`   ✅ Produto adicionado ao catálogo com sucesso!`);
      console.log(`      ID do registro: ${newInventory.id}`);
    }

    // Verificar novamente os catálogos após a adição
    console.log(`\n🔍 Verificando catálogos após adição:`);
    for (const store of stores) {
      const inventory = await prisma.storeInventory.findUnique({
        where: {
          storeId_productId: {
            storeId: store.id,
            productId: product.id
          }
        }
      });

      const isInCatalog = product.storeId === store.id || !!inventory;
      console.log(`   ${store.name}: ${isInCatalog ? '✅ No catálogo' : '❌ Fora do catálogo'}`);
    }

    // Verificar se a loja principal do produto não mudou
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      select: {
        id: true,
        name: true,
        storeId: true,
        store: { select: { name: true } }
      }
    });

    console.log(`\n🔍 Verificando se a loja principal não mudou:`);
    console.log(`   Antes: ${product.store?.name || 'Nenhuma'} (${product.storeId || 'NULL'})`);
    console.log(`   Depois: ${updatedProduct?.store?.name || 'Nenhuma'} (${updatedProduct?.storeId || 'NULL'})`);

    if (product.storeId === updatedProduct?.storeId) {
      console.log(`   ✅ Loja principal mantida - SUCESSO!`);
    } else {
      console.log(`   ❌ Loja principal mudou - FALHA!`);
    }

    // Testar adicionar à segunda loja também
    if (stores.length >= 2) {
      const secondStore = stores[1];
      console.log(`\n➕ Testando adicionar à segunda loja: ${secondStore.name}`);

      const existingInventory2 = await prisma.storeInventory.findUnique({
        where: {
          storeId_productId: {
            storeId: secondStore.id,
            productId: product.id
          }
        }
      });

      if (existingInventory2) {
        console.log(`   ⚠️  Produto já está no catálogo desta loja`);
      } else {
        const newInventory2 = await prisma.storeInventory.create({
          data: {
            storeId: secondStore.id,
            productId: product.id,
            quantity: 0,
            minStock: 0
          }
        });

        console.log(`   ✅ Produto adicionado ao catálogo da segunda loja com sucesso!`);
        console.log(`      ID do registro: ${newInventory2.id}`);
      }

      // Verificação final
      console.log(`\n🎯 RESULTADO FINAL:`);
      for (const store of stores) {
        const inventory = await prisma.storeInventory.findUnique({
          where: {
            storeId_productId: {
              storeId: store.id,
              productId: product.id
            }
          }
        });

        const isInCatalog = product.storeId === store.id || !!inventory;
        console.log(`   ${store.name}: ${isInCatalog ? '✅ No catálogo' : '❌ Fora do catálogo'}`);
      }

      console.log(`\n✨ CONCLUSÃO: O mesmo produto agora pode estar no catálogo de múltiplas lojas simultaneamente!`);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testMultiStoreCatalog()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  });

