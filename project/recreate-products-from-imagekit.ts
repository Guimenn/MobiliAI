import { config } from 'dotenv';
import { PrismaClient, ProductCategory } from '@prisma/client';
import ImageKit from 'imagekit';
import * as fs from 'fs';
import * as path from 'path';

// Carregar variáveis de ambiente
config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

// Configurar ImageKit
function getImageKitClient(): ImageKit | null {
  const imagekitUrlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  const imagekitPublicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const imagekitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!imagekitUrlEndpoint || !imagekitPublicKey || !imagekitPrivateKey) {
    console.warn('⚠️ ImageKit não configurado.');
    return null;
  }

  return new ImageKit({
    publicKey: imagekitPublicKey,
    privateKey: imagekitPrivateKey,
    urlEndpoint: imagekitUrlEndpoint,
  });
}

// Base de dados de produtos de móveis
const furnitureProducts: {
  [key in ProductCategory]?: Array<{ name: string; description: string; price: number; color: string }>;
} = {
  SOFA: [
    { name: 'Sofá Retrátil 3 Lugares Cinza', description: 'Sofá confortável com mecanismo retrátil e reclinável', price: 1899.90, color: 'Cinza Chumbo' },
    { name: 'Sofá Cama Retrátil 3 Lugares Bege', description: 'Sofá que se transforma em cama de casal', price: 1499.00, color: 'Bege Areia' },
    { name: 'Sofá Retrô Chesterfield Marrom', description: 'Sofá clássico estilo inglês com braços altos', price: 3299.00, color: 'Marrom Couro' },
    { name: 'Sofá Modular L 3+2 Lugares Azul', description: 'Sofá modular em formato L com mesinha de centro', price: 2499.90, color: 'Azul Petróleo' },
    { name: 'Sofá Moderno Minimalista 2 Lugares Preto', description: 'Design minimalista com estrutura em aço', price: 899.90, color: 'Preto' },
    { name: 'Sofá Conversível 4 Lugares Cinza', description: 'Perfeito para famílias, assentos macios e confortáveis', price: 1999.00, color: 'Cinza Perla' },
  ],
  MESA: [
    { name: 'Mesa de Jantar 6 Lugares Carvalho', description: 'Mesa rústica em madeira maciça de carvalho', price: 899.90, color: 'Carvalho Claro' },
    { name: 'Mesa de Escritório com Gavetas Preta', description: 'Mesa profissional para home office', price: 599.90, color: 'Preto Fosco' },
    { name: 'Mesa de Jantar Redonda 4 Lugares Vidro', description: 'Mesa de vidro temperado com base metálica', price: 749.90, color: 'Transparente' },
    { name: 'Mesa Extensível 8 Lugares Mogno', description: 'Mesa que expande para receber mais convidados', price: 1299.00, color: 'Mogno' },
    { name: 'Mesa Lateral Moderna Dourada', description: 'Mesa auxiliar decorativa', price: 299.90, color: 'Dourado Brilhante' },
  ],
  MESA_CENTRO: [
    { name: 'Mesa de Centro Moderna Retangular Branca', description: 'Design minimalista com gavetas', price: 449.90, color: 'Branco' },
    { name: 'Mesa de Centro Redonda Vidro', description: 'Mesa de vidro temperado elegante', price: 599.90, color: 'Transparente' },
    { name: 'Mesa de Centro Rústica Mogno', description: 'Madeira maciça com acabamento rústico', price: 799.90, color: 'Mogno' },
    { name: 'Mesa de Centro Industrial Preta', description: 'Estilo industrial com estrutura metálica', price: 549.90, color: 'Preto Metal' },
    { name: 'Mesa de Centro Escandinava Clara', description: 'Estilo nórdico minimalista', price: 649.90, color: 'Pinus Natural' },
    { name: 'Mesa de Centro Oval Dourada', description: 'Design elegante com detalhes dourados', price: 899.90, color: 'Dourado Brilhante' },
  ],
  CADEIRA: [
    { name: 'Cadeira Gamer Ergonômica Preta', description: 'Cadeira ergonômica com apoio lombar ajustável', price: 899.90, color: 'Preto e Vermelho' },
    { name: 'Conjunto 4 Cadeiras de Jantar Brancas', description: 'Cadeiras estofadas confortáveis', price: 799.90, color: 'Branco e Cinza' },
    { name: 'Cadeira Executiva de Couro Marrom', description: 'Cadeira de escritório premium', price: 549.90, color: 'Marrom Couro' },
    { name: 'Cadeira de Balanço Rattan Natural', description: 'Cadeira de balanço artesanal', price: 699.90, color: 'Natural' },
    { name: 'Conjunto 6 Cadeiras Escandinavas Cinza', description: 'Estilo nórdico moderno', price: 1199.90, color: 'Cinza Chumbo' },
    { name: 'Cadeira de Bar Alta Industrial Preta', description: 'Altura de balcão com apoio para pés', price: 349.90, color: 'Preto Metal' },
  ],
  ESTANTE: [
    { name: 'Estante Multiuso 5 Prateleiras Branca', description: 'Organize sua casa de forma elegante', price: 599.90, color: 'Branco' },
    { name: 'Estante Escandinava de Madeira Clara', description: 'Estilo nórdico minimalista', price: 899.90, color: 'Pinus Natural' },
    { name: 'Estante Modular 7 Módulos Preta', description: 'Monte do jeito que quiser', price: 1299.00, color: 'Preto' },
    { name: 'Estante de Aço Industrial Cinza', description: 'Rústica e resistente', price: 799.90, color: 'Cinza Metal' },
    { name: 'Estante com Portas de Vidro Mogno', description: 'Exponha seus livros e decoração', price: 999.90, color: 'Mogno' },
    { name: 'Estante Low Profile 3 Prateleiras', description: 'Compacta para qualquer ambiente', price: 449.90, color: 'Carvalho Claro' },
  ],
  POLTRONA: [
    { name: 'Poltrona Relax Retrátil Cinza', description: 'Máximo conforto para relaxar', price: 899.90, color: 'Cinza Escuro' },
    { name: 'Poltrona Leitora Vermelha', description: 'Perfeita para ler um bom livro', price: 649.90, color: 'Vermelho Bordeaux' },
    { name: 'Poltrona Girafa Designer Moderna', description: 'Design icônico e confortável', price: 1699.00, color: 'Bege Couro' },
    { name: 'Poltrona Egg Designer Preta', description: 'Forma única que envolve seu corpo', price: 1999.00, color: 'Preto' },
    { name: 'Poltrona Reclinável Power Lift Bege', description: 'Assistência para levantar', price: 2499.90, color: 'Bege' },
    { name: 'Conjunto 2 Poltronas Modernas Azul', description: 'Ideal para sala de TV', price: 1199.90, color: 'Azul Marinho' },
  ],
  LUMINARIA: [
    { name: 'Luminária de Mesa Moderna Branca', description: 'Iluminação direta para leitura', price: 199.90, color: 'Branco' },
    { name: 'Luminária de Pé Industrial Preta', description: 'Ajustável com braço articulado', price: 349.90, color: 'Preto' },
    { name: 'Lustre Cristal Clássico Dourado', description: 'Elegância e sofisticação', price: 1299.90, color: 'Dourado Brilhante' },
    { name: 'Plafon Moderno Branco', description: 'Iluminação embutida para teto', price: 249.90, color: 'Branco' },
    { name: 'Abajur de Mesa Vintage Bege', description: 'Estilo retrô com tecido', price: 179.90, color: 'Bege Areia' },
    { name: 'Arandela de Parede Moderna Preta', description: 'Iluminação decorativa', price: 299.90, color: 'Preto' },
    { name: 'Luminária LED de Mesa Cinza', description: 'Tecnologia LED com ajuste de intensidade', price: 399.90, color: 'Cinza Chumbo' },
    { name: 'Pendente Industrial Dourado', description: 'Suspenso com design industrial', price: 549.90, color: 'Dourado Brilhante' },
    { name: 'Luminária de Chão Minimalista Branca', description: 'Design clean e moderno', price: 449.90, color: 'Branco' },
    { name: 'Lustre Moderno Preto', description: 'Design contemporâneo', price: 799.90, color: 'Preto' },
  ],
  QUADRO: [
    { name: 'Quadro Decorativo Abstrato Moderno', description: 'Arte abstrata contemporânea', price: 199.90, color: 'Multicolorido' },
    { name: 'Quadro Natureza Paisagem', description: 'Paisagem natural em alta qualidade', price: 249.90, color: 'Natural' },
    { name: 'Quadro Minimalista Preto e Branco', description: 'Design minimalista elegante', price: 179.90, color: 'Preto e Branco' },
    { name: 'Quadro Vintage Retrô', description: 'Estilo retrô com moldura dourada', price: 299.90, color: 'Dourado Brilhante' },
    { name: 'Quadro Moderno Geométrico', description: 'Formas geométricas coloridas', price: 219.90, color: 'Multicolorido' },
    { name: 'Quadro Fotográfico Cidade', description: 'Fotografia urbana em alta resolução', price: 269.90, color: 'Natural' },
    { name: 'Quadro Escandinavo Minimalista', description: 'Estilo nórdico clean', price: 189.90, color: 'Branco e Cinza' },
    { name: 'Quadro Decorativo Floral', description: 'Arte floral delicada', price: 229.90, color: 'Multicolorido' },
  ],
};

// Intervalos de imagens por categoria (pares consecutivos: par = com fundo, ímpar = sem fundo)
const categoryImageRanges: { [key in ProductCategory]?: { start: number; end: number } } = {
  [ProductCategory.POLTRONA]: { start: 2, end: 25 },
  [ProductCategory.SOFA]: { start: 27, end: 48 },
  [ProductCategory.MESA]: { start: 50, end: 75 },
  [ProductCategory.MESA_CENTRO]: { start: 77, end: 92 },
  [ProductCategory.LUMINARIA]: { start: 94, end: 131 },
  [ProductCategory.CADEIRA]: { start: 133, end: 148 },
  [ProductCategory.QUADRO]: { start: 150, end: 166 },
  [ProductCategory.ESTANTE]: { start: 168, end: 195 },
};

// Função para obter categoria baseada no número da imagem
function getCategoryFromImageNumber(imageNumber: number): ProductCategory {
  for (const [category, range] of Object.entries(categoryImageRanges)) {
    if (range.start <= imageNumber && imageNumber <= range.end) {
      return category as ProductCategory;
    }
  }
  return ProductCategory.MESA_CENTRO; // Default
}

// Função para obter produto aleatório da categoria
function getRandomProduct(category: ProductCategory) {
  const products = furnitureProducts[category];
  if (!products || products.length === 0) {
    const categoryNames: { [key in ProductCategory]?: string } = {
      [ProductCategory.MESA_CENTRO]: 'Mesa de Centro',
      [ProductCategory.LUMINARIA]: 'Luminária',
      [ProductCategory.QUADRO]: 'Quadro Decorativo',
    };
    const categoryName = categoryNames[category] || category;
    return {
      name: `${categoryName} Premium`,
      description: `Produto de alta qualidade na categoria ${categoryName}`,
      price: 299.90,
      color: 'Branco',
    };
  }
  return products[Math.floor(Math.random() * products.length)];
}

// Função para gerar SKU único
function generateSKU(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${Date.now()}-${index}`;
}

// Função para gerar cor em hexadecimal
function generateColorHex(colorName: string): string {
  const colorMap: { [key: string]: string } = {
    'Cinza Chumbo': '#6B6868',
    'Bege Areia': '#F5DEB3',
    'Marrom Couro': '#8B4513',
    'Azul Petróleo': '#36454F',
    'Preto': '#000000',
    'Cinza Perla': '#C8C8C8',
    'Carvalho Claro': '#D2691E',
    'Branco': '#FFFFFF',
    'Preto Fosco': '#1C1C1C',
    'Transparente': '#E0E0E0',
    'Mogno': '#6F2F2F',
    'Dourado Brilhante': '#FFD700',
    'Preto e Vermelho': '#1C1C1C',
    'Branco e Cinza': '#F5F5F5',
    'Natural': '#D4A574',
    'Preto Metal': '#2F2F2F',
    'Pinus Natural': '#E4D5C0',
    'Cinza Metal': '#708090',
    'Cinza Escuro': '#36454F',
    'Vermelho Bordeaux': '#800020',
    'Bege Couro': '#DEB887',
    'Azul Marinho': '#000080',
    'Multicolorido': '#FF6B6B',
    'Preto e Branco': '#000000',
  };
  return colorMap[colorName] || '#CCCCCC';
}

// Função para obter marca aleatória
function getRandomBrand(): string {
  const brands = ['Tok&Stok', 'Casa & Estilo', 'Móveis Brasileiros', 'Madeira Decora', 'Decorarte', 'Simonsen', 'EcoMóveis', 'Design Móveis'];
  return brands[Math.floor(Math.random() * brands.length)];
}

// Função para atualizar imagem no ImageKit com tags
async function updateImageKitTags(
  imagekit: ImageKit,
  fileId: string,
  productId: string,
  fileName: string
): Promise<boolean> {
  try {
    // Adicionar tag com productId
    await imagekit.updateFileDetails(fileId, {
      tags: [`product-${productId}`],
    });

    console.log(`  ✅ ${fileName} -> productId: ${productId}`);
    return true;
  } catch (error: any) {
    console.error(`  ❌ Erro ao atualizar ${fileName}:`, error.message);
    return false;
  }
}

// Função principal
export async function recreateProductsFromImageKit() {
  console.log('🔄 Recriando produtos baseado na numeração do ImageKit...\n');

  try {
    const imagekit = getImageKitClient();

    if (!imagekit) {
      console.error('❌ ImageKit não configurado!');
      return;
    }

    // 1. Buscar todas as imagens do ImageKit ordenadas por número
    console.log('📸 Buscando imagens do ImageKit...');
    const allFiles = await imagekit.listFiles({
      path: '/FotoMovel',
      limit: 1000,
    });

    // Filtrar apenas arquivos (não pastas) e ordenar por número
    const imageFiles = allFiles
      .filter((file: any) => 'fileId' in file)
      .map((file: any) => {
        const fileName = file.name || file.filePath?.split('/').pop() || '';
        const numericMatch = fileName.match(/^(\d+)\.(png|jpg|jpeg|webp)$/i);
        const number = numericMatch ? parseInt(numericMatch[1]) : 0;
        return { ...file, fileName, number };
      })
      .filter((file: any) => file.number > 0)
      .sort((a: any, b: any) => a.number - b.number);

    console.log(`✅ Encontradas ${imageFiles.length} imagens numéricas no ImageKit\n`);

    if (imageFiles.length === 0) {
      console.log('⚠️ Nenhuma imagem numérica encontrada!');
      return;
    }

    // 3. Buscar lojas
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    if (stores.length === 0) {
      console.error('❌ Nenhuma loja encontrada! Execute o seed de lojas primeiro.');
      return;
    }

    console.log(`✅ Encontradas ${stores.length} loja(s)\n`);

    // 4. Deletar todos os registros relacionados primeiro
    console.log('🗑️ Deletando registros relacionados...');
    
    // Deletar na ordem correta para evitar constraint violations
    const deletedSaleItems = await prisma.saleItem.deleteMany({});
    console.log(`  ✅ ${deletedSaleItems.count} itens de venda deletados`);
    
    const deletedCartItems = await prisma.cartItem.deleteMany({});
    console.log(`  ✅ ${deletedCartItems.count} itens do carrinho deletados`);
    
    const deletedComparisons = await prisma.comparison.deleteMany({});
    console.log(`  ✅ ${deletedComparisons.count} comparações deletadas`);
    
    const deletedFavorites = await prisma.favorite.deleteMany({});
    console.log(`  ✅ ${deletedFavorites.count} favoritos deletados`);
    
    const deletedMoodboardItems = await prisma.moodboardItem.deleteMany({});
    console.log(`  ✅ ${deletedMoodboardItems.count} itens de moodboard deletados`);
    
    const deletedCompatibility = await prisma.productCompatibility.deleteMany({});
    console.log(`  ✅ ${deletedCompatibility.count} compatibilidades deletadas`);
    
    const deletedStoreInventory = await prisma.storeInventory.deleteMany({});
    console.log(`  ✅ ${deletedStoreInventory.count} registros de inventário deletados`);
    
    // Agora deletar produtos (ProductReview e ProductVariant têm onDelete: Cascade)
    console.log('🗑️ Deletando produtos existentes...');
    const deletedCount = await prisma.product.deleteMany({});
    console.log(`✅ ${deletedCount.count} produtos deletados\n`);

    // 5. Criar produtos na ordem das imagens, distribuindo entre todas as lojas
    // As imagens vêm em pares: 2-3 = produto 1, 4-5 = produto 2, 6-7 = produto 3, etc.
    // (número par = com fundo, número ímpar = sem fundo)
    
    // Encontrar pares válidos (par com seu ímpar consecutivo)
    const validImagePairs: Array<{ withBg: any; withoutBg: any }> = [];
    
    for (const image of imageFiles) {
      const imageNumber = image.number;
      
      // Se o número é par (com fundo), procurar o ímpar consecutivo (sem fundo)
      if (imageNumber % 2 === 0 && imageNumber >= 2) {
        const nextImage = imageFiles.find(img => img.number === imageNumber + 1);
        if (nextImage) {
          validImagePairs.push({
            withBg: image,
            withoutBg: nextImage,
          });
        }
      }
    }
    
    const totalProducts = validImagePairs.length;
    // Usar todos os produtos disponíveis (não limitar a 15)
    // Isso garante que todas as categorias sejam representadas
    const productsPerStore = totalProducts;
    
    console.log(`📦 Criando produtos para ${stores.length} loja(s)`);
    console.log(`   Total de ${totalProducts} produtos disponíveis`);
    console.log(`   ${productsPerStore} produtos por loja (repetidos)`);
    console.log(`   Encontrados ${validImagePairs.length} pares válidos de imagens`);
    
    // Contar produtos por categoria
    const productsByCategory = new Map<ProductCategory, number>();
    validImagePairs.forEach(pair => {
      const category = getCategoryFromImageNumber(pair.withBg.number);
      productsByCategory.set(category, (productsByCategory.get(category) || 0) + 1);
    });
    console.log(`   Distribuição por categoria:`, Object.fromEntries(productsByCategory));
    console.log('');

    let totalCreated = 0;

    // Preparar produtos únicos (um produto por par de imagens)
    const productsToCreate: Array<{ imagePair: { withBg: any; withoutBg: any }; category: ProductCategory; template: any }> = [];
    
    // Coletar produtos únicos (mesmos para todas as lojas)
    // Usar um índice fixo para garantir que cada par de imagens sempre gere o mesmo produto
    for (let i = 0; i < productsPerStore && i < validImagePairs.length; i++) {
      const imagePair = validImagePairs[i];
      const imageNumber = imagePair.withBg.number;
      const category = getCategoryFromImageNumber(imageNumber);
      
      // Usar o índice do par para garantir consistência (mesmo índice = mesmo produto)
      // Isso garante que a imagem 2-3 sempre gere o mesmo produto, 4-5 sempre gere o mesmo, etc.
      const products = furnitureProducts[category];
      if (products && products.length > 0) {
        // Usar o índice do par para selecionar um produto específico da categoria
        const productIndex = i % products.length;
        const productTemplate = products[productIndex];
        
        productsToCreate.push({
          imagePair,
          category,
          template: productTemplate,
        });
      } else {
        // Fallback para categorias sem produtos definidos
        const categoryNames: { [key in ProductCategory]?: string } = {
          [ProductCategory.MESA_CENTRO]: 'Mesa de Centro',
          [ProductCategory.LUMINARIA]: 'Luminária',
          [ProductCategory.QUADRO]: 'Quadro Decorativo',
        };
        const categoryName = categoryNames[category] || category;
        const productTemplate = {
          name: `${categoryName} Premium ${i + 1}`,
          description: `Produto de alta qualidade na categoria ${categoryName}`,
          price: 299.90,
          color: 'Branco',
        };
        
        productsToCreate.push({
          imagePair,
          category,
          template: productTemplate,
        });
      }
    }
    
    console.log(`\n📦 Criando ${productsToCreate.length} produtos únicos e associando a ${stores.length} loja(s)...\n`);
    
    // Criar produtos únicos (sem storeId) e associar a todas as lojas
    for (let i = 0; i < productsToCreate.length; i++) {
      const { imagePair, category, template: productTemplate } = productsToCreate[i];
      const { withBg: imageWithBg, withoutBg: imageWithoutBg } = imagePair;


      // Gerar dimensões baseadas na categoria
      let dimensions: { width: number; height: number; depth: number } | undefined;
      
      if (category === ProductCategory.SOFA || category === ProductCategory.POLTRONA) {
        dimensions = {
          width: parseFloat((Math.random() * 100 + 150).toFixed(2)),
          height: parseFloat((Math.random() * 20 + 80).toFixed(2)),
          depth: parseFloat((Math.random() * 30 + 80).toFixed(2)),
        };
      } else if (category === ProductCategory.MESA) {
        dimensions = {
          width: parseFloat((Math.random() * 100 + 100).toFixed(2)),
          height: parseFloat((Math.random() * 10 + 70).toFixed(2)),
          depth: parseFloat((Math.random() * 100 + 100).toFixed(2)),
        };
      } else if (category === ProductCategory.CADEIRA) {
        dimensions = {
          width: parseFloat((Math.random() * 20 + 40).toFixed(2)),
          height: parseFloat((Math.random() * 10 + 90).toFixed(2)),
          depth: parseFloat((Math.random() * 10 + 50).toFixed(2)),
        };
      } else if (category === ProductCategory.ESTANTE) {
        dimensions = {
          width: parseFloat((Math.random() * 40 + 80).toFixed(2)),
          height: parseFloat((Math.random() * 100 + 150).toFixed(2)),
          depth: parseFloat((Math.random() * 10 + 30).toFixed(2)),
        };
      } else if (category === ProductCategory.MESA_CENTRO) {
        dimensions = {
          width: parseFloat((Math.random() * 60 + 80).toFixed(2)),
          height: parseFloat((Math.random() * 10 + 40).toFixed(2)),
          depth: parseFloat((Math.random() * 60 + 40).toFixed(2)),
        };
      } else if (category === ProductCategory.LUMINARIA) {
        dimensions = {
          width: parseFloat((Math.random() * 20 + 20).toFixed(2)),
          height: parseFloat((Math.random() * 50 + 30).toFixed(2)),
          depth: parseFloat((Math.random() * 20 + 20).toFixed(2)),
        };
      } else if (category === ProductCategory.QUADRO) {
        dimensions = {
          width: parseFloat((Math.random() * 60 + 40).toFixed(2)),
          height: parseFloat((Math.random() * 80 + 50).toFixed(2)),
          depth: parseFloat((Math.random() * 5 + 2).toFixed(2)),
        };
      }

      const weight = parseFloat((Math.random() * 50 + 10).toFixed(2));
      const stock = Math.floor(Math.random() * 50 + 5);
      const sku = generateSKU(category, i);

      // Criar produto ÚNICO (sem storeId)
      const createdProduct = await prisma.product.create({
        data: {
          name: productTemplate.name,
          description: productTemplate.description,
          category,
          price: productTemplate.price,
          costPrice: parseFloat((productTemplate.price * 0.6).toFixed(2)),
          stock: 0, // Estoque será gerenciado por StoreInventory
          minStock: 5,
          colorName: productTemplate.color,
          colorHex: generateColorHex(productTemplate.color),
          brand: getRandomBrand(),
          sku,
          width: dimensions?.width,
          height: dimensions?.height,
          depth: dimensions?.depth,
          weight,
          storeId: null, // Produto não pertence a uma loja específica
          isActive: true,
          isAvailable: true,
        },
      });

      // Atualizar tags das imagens no ImageKit
      const imageUrls: string[] = [];
      
      if (imageWithBg && 'fileId' in imageWithBg && imageWithBg.url) {
        const fileObj = imageWithBg as any;
        await updateImageKitTags(imagekit, fileObj.fileId, createdProduct.id, imageWithBg.fileName);
        imageUrls.push(imageWithBg.url);
      }

      if (imageWithoutBg && 'fileId' in imageWithoutBg && imageWithoutBg.url) {
        const fileObj = imageWithoutBg as any;
        await updateImageKitTags(imagekit, fileObj.fileId, createdProduct.id, imageWithoutBg.fileName);
        imageUrls.push(imageWithoutBg.url);
      }

      // Atualizar produto com URLs
      if (imageUrls.length > 0) {
        await prisma.product.update({
          where: { id: createdProduct.id },
          data: {
            imageUrl: imageUrls[0],
            imageUrls: imageUrls,
          },
        });
      }

      // Associar produto a TODAS as lojas via StoreInventory
      let inventoryCount = 0;
      for (const store of stores) {
        const storeStock = Math.floor(Math.random() * 50 + 5); // Estoque aleatório por loja
        
        await prisma.storeInventory.create({
          data: {
            productId: createdProduct.id,
            storeId: store.id,
            quantity: storeStock,
            minStock: 5,
          },
        });
        inventoryCount++;
      }
      
      // Log detalhado para os primeiros produtos
      if (i < 3) {
        console.log(`   📦 Produto "${productTemplate.name}" associado a ${inventoryCount} loja(s)`);
      }

      totalCreated++;
      if ((i + 1) % 5 === 0 || (i + 1) === productsToCreate.length) {
        console.log(`✅ Produto ${i + 1}/${productsToCreate.length} criado e associado a ${stores.length} loja(s): ${productTemplate.name} (imagens: ${imageWithBg.number} e ${imageWithoutBg.number})`);
      }
    }

    // Resumo por loja
    console.log(`\n📊 Resumo por loja:`);
    const inventoryByStore = await prisma.storeInventory.groupBy({
      by: ['storeId'],
      _count: { id: true },
    });
    
    for (const group of inventoryByStore) {
      const store = stores.find(s => s.id === group.storeId);
      console.log(`   ${store?.name || 'Loja desconhecida'}: ${group._count.id} produtos em estoque`);
    }
    
    // Verificar se todas as lojas têm produtos
    console.log(`\n🔍 Verificação de distribuição:`);
    for (const store of stores) {
      const storeInventory = await prisma.storeInventory.count({
        where: { storeId: store.id },
      });
      const expectedCount = totalCreated;
      const status = storeInventory === expectedCount ? '✅' : '⚠️';
      console.log(`   ${status} ${store.name}: ${storeInventory}/${expectedCount} produtos`);
    }

    console.log(`\n🎉 Processo concluído!`);
    console.log(`   ✅ ${totalCreated} produtos únicos criados`);
    console.log(`   ✅ Cada produto deve estar associado a ${stores.length} loja(s) via StoreInventory`);
    console.log(`   ✅ Total esperado de ${totalCreated * stores.length} associações produto-loja`);
    console.log(`   ✅ Total real de ${inventoryByStore.reduce((sum, g) => sum + g._count.id, 0)} associações criadas`);
    console.log(`📸 ${imageFiles.length} imagens processadas do ImageKit`);
  } catch (error) {
    console.error('❌ Erro ao recriar produtos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  recreateProductsFromImageKit()
    .then(() => {
      console.log('✅ Script finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar script:', error);
      process.exit(1);
    });
}

