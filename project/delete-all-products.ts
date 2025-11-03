import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Carregar variáveis de ambiente
config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function deleteAllProducts() {
  console.log('🗑️ Iniciando exclusão de todos os produtos...');

  try {
    // Contar produtos antes da exclusão
    const productCount = await prisma.product.count();
    console.log(`📊 Total de produtos encontrados: ${productCount}`);

    if (productCount === 0) {
      console.log('ℹ️ Nenhum produto encontrado no banco de dados.');
      return;
    }

    // Confirmar exclusão
    console.log(`⚠️ ATENÇÃO: Esta operação irá deletar ${productCount} produto(s) permanentemente!`);
    console.log(`\n🔄 Deletando relacionamentos primeiro...`);
    
    // Deletar todos os relacionamentos que referenciam produtos
    // Ordem: primeiro deletar os itens que referenciam produtos
    
    console.log('   🗑️ Deletando SaleItems...');
    const deletedSaleItems = await prisma.saleItem.deleteMany({});
    console.log(`   ✅ ${deletedSaleItems.count} item(s) de venda deletado(s)`);

    console.log('   🗑️ Deletando CartItems...');
    const deletedCartItems = await prisma.cartItem.deleteMany({});
    console.log(`   ✅ ${deletedCartItems.count} item(s) do carrinho deletado(s)`);

    console.log('   🗑️ Deletando Favorites...');
    const deletedFavorites = await prisma.favorite.deleteMany({});
    console.log(`   ✅ ${deletedFavorites.count} favorito(s) deletado(s)`);

    console.log('   🗑️ Deletando Comparisons...');
    const deletedComparisons = await prisma.comparison.deleteMany({});
    console.log(`   ✅ ${deletedComparisons.count} comparação(ões) deletada(s)`);

    console.log('   🗑️ Deletando MoodboardItems...');
    const deletedMoodboardItems = await prisma.moodboardItem.deleteMany({});
    console.log(`   ✅ ${deletedMoodboardItems.count} item(s) de moodboard deletado(s)`);

    console.log('   🗑️ Deletando ProductCompatibility...');
    const deletedCompatibility = await prisma.productCompatibility.deleteMany({});
    console.log(`   ✅ ${deletedCompatibility.count} compatibilidade(s) deletada(s)`);

    console.log('   🗑️ Deletando ProductReviews...');
    const deletedReviews = await prisma.productReview.deleteMany({});
    console.log(`   ✅ ${deletedReviews.count} avaliação(ões) deletada(s)`);

    console.log('   🗑️ Deletando ProductVariants...');
    const deletedVariants = await prisma.productVariant.deleteMany({});
    console.log(`   ✅ ${deletedVariants.count} variante(s) deletada(s)`);

    console.log('   🗑️ Deletando StoreInventory...');
    const deletedInventory = await prisma.storeInventory.deleteMany({});
    console.log(`   ✅ ${deletedInventory.count} registro(s) de inventário deletado(s)`);

    console.log('\n🗑️ Deletando produtos...');
    // Agora deletar todos os produtos
    const deleted = await prisma.product.deleteMany({
      where: {},
    });

    console.log(`✅ ${deleted.count} produto(s) deletado(s) com sucesso!`);
    
    // Verificar se foi tudo deletado
    const remainingCount = await prisma.product.count();
    if (remainingCount === 0) {
      console.log('✅ Todos os produtos foram deletados!');
    } else {
      console.warn(`⚠️ Ainda restam ${remainingCount} produto(s) no banco.`);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar produtos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  deleteAllProducts()
    .then(() => {
      console.log('✅ Script finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar script:', error);
      process.exit(1);
    });
}

export { deleteAllProducts };

