import { config } from 'dotenv';
import { PrismaClient, ProductCategory } from '@prisma/client';

// Carregar variáveis de ambiente
config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

// Base de dados de produtos de móveis com variações
const furnitureProducts = {
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
    { name: 'Mesa de Centro Moderna Branca', description: 'Mesa de centro com gavetas', price: 449.90, color: 'Branco' },
    { name: 'Mesa de Escritório com Gavetas Preta', description: 'Mesa profissional para home office', price: 599.90, color: 'Preto Fosco' },
    { name: 'Mesa de Jantar Redonda 4 Lugares Vidro', description: 'Mesa de vidro temperado com base metálica', price: 749.90, color: 'Transparente' },
    { name: 'Mesa Extensível 8 Lugares Mogno', description: 'Mesa que expande para receber mais convidados', price: 1299.00, color: 'Mogno' },
    { name: 'Mesa Lateral Moderna Dourada', description: 'Mesa auxiliar decorativa', price: 299.90, color: 'Dourado Brilhante' },
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
};

// Função para gerar SKU único
function generateSKU(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${Date.now()}-${index}`;
}

// Função para obter categoria aleatória
function getRandomCategory(): ProductCategory {
  const categories: ProductCategory[] = [ProductCategory.SOFA, ProductCategory.MESA, ProductCategory.CADEIRA, ProductCategory.ESTANTE, ProductCategory.POLTRONA];
  return categories[Math.floor(Math.random() * categories.length)];
}

// Função para obter produto aleatório da categoria
function getRandomProduct(category: ProductCategory) {
  const products = furnitureProducts[category];
  return products[Math.floor(Math.random() * products.length)];
}

export async function seedFurnitureProducts() {
  console.log('🛋️ Criando produtos de móveis aleatórios para todas as filiais...');

  try {
    // Buscar todas as lojas
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    if (stores.length === 0) {
      console.error('❌ Nenhuma loja encontrada! Execute o seed de lojas primeiro.');
      return;
    }

    console.log(`✅ Encontradas ${stores.length} loja(s)`);

    // Definir quantos produtos por loja
    const productsPerStore = 15;
    let totalCreated = 0;

    for (const store of stores) {
      console.log(`\n📦 Criando produtos para: ${store.name}`);
      
      const productsToCreate = [];

      // Criar produtos aleatórios
      for (let i = 0; i < productsPerStore; i++) {
        const category = getRandomCategory();
        const productTemplate = getRandomProduct(category);
        const sku = generateSKU(category, i);

        // Gerar dimensões aleatórias baseadas na categoria
        let dimensions: { width: number; height: number; depth: number } | undefined;
        
        if (category === ProductCategory.SOFA || category === ProductCategory.POLTRONA) {
          dimensions = {
            width: parseFloat((Math.random() * 100 + 150).toFixed(2)), // 150-250cm
            height: parseFloat((Math.random() * 20 + 80).toFixed(2)),  // 80-100cm
            depth: parseFloat((Math.random() * 30 + 80).toFixed(2)),   // 80-110cm
          };
        } else if (category === ProductCategory.MESA) {
          dimensions = {
            width: parseFloat((Math.random() * 100 + 100).toFixed(2)), // 100-200cm
            height: parseFloat((Math.random() * 10 + 70).toFixed(2)),  // 70-80cm
            depth: parseFloat((Math.random() * 100 + 100).toFixed(2)), // 100-200cm
          };
        } else if (category === ProductCategory.CADEIRA) {
          dimensions = {
            width: parseFloat((Math.random() * 20 + 40).toFixed(2)),  // 40-60cm
            height: parseFloat((Math.random() * 10 + 90).toFixed(2)), // 90-100cm
            depth: parseFloat((Math.random() * 10 + 50).toFixed(2)),  // 50-60cm
          };
        } else if (category === ProductCategory.ESTANTE) {
          dimensions = {
            width: parseFloat((Math.random() * 40 + 80).toFixed(2)),  // 80-120cm
            height: parseFloat((Math.random() * 100 + 150).toFixed(2)), // 150-250cm
            depth: parseFloat((Math.random() * 10 + 30).toFixed(2)),  // 30-40cm
          };
        }

        // Gerar peso aleatório
        const weight = parseFloat((Math.random() * 50 + 10).toFixed(2)); // 10-60kg

        // Gerar estoque aleatório
        const stock = Math.floor(Math.random() * 50 + 5); // 5-55 unidades

        productsToCreate.push({
          name: productTemplate.name,
          description: productTemplate.description,
          category,
          price: productTemplate.price,
          costPrice: parseFloat((productTemplate.price * 0.6).toFixed(2)), // 60% do preço
          stock,
          minStock: 5,
          colorName: productTemplate.color,
          colorHex: generateColorHex(productTemplate.color),
          brand: getRandomBrand(),
          sku,
          width: dimensions?.width,
          height: dimensions?.height,
          depth: dimensions?.depth,
          weight,
          storeId: store.id,
          isActive: true,
          isAvailable: true,
        });
      }

      // Criar produtos em lote
      const created = await prisma.product.createMany({
        data: productsToCreate,
        skipDuplicates: true,
      });

      totalCreated += created.count;
      console.log(`✅ Criados ${created.count} produtos para ${store.name}`);
    }

    console.log(`\n🎉 Seed concluído! Total de ${totalCreated} produtos criados em ${stores.length} loja(s)`);
  } catch (error) {
    console.error('❌ Erro ao criar produtos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Função para gerar cor em hexadecimal (aproximado)
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
  };
  return colorMap[colorName] || '#CCCCCC';
}

// Função para obter marca aleatória
function getRandomBrand(): string {
  const brands = ['Tok&Stok', 'Casa & Estilo', 'Móveis Brasileiros', 'Madeira Decora', 'Decorarte', 'Simonsen', 'EcoMóveis', 'Design Móveis'];
  return brands[Math.floor(Math.random() * brands.length)];
}

// Executar se chamado diretamente
if (require.main === module) {
  seedFurnitureProducts()
    .then(() => {
      console.log('✅ Seed finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    });
}

