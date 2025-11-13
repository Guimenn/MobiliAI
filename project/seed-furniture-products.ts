import { config } from 'dotenv';
import { PrismaClient, ProductCategory } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

// Configurar Supabase
function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase não configurado. As imagens não serão enviadas para o bucket.');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Função para ler todas as imagens da pasta
function getImageFiles(): string[] {
  // Tentar diferentes caminhos possíveis
  // Primeiro, tentar encontrar a pasta "MobiliAI" em my-app/public
  const basePaths = [
    // Quando executado de dentro de project/
    path.resolve(process.cwd(), '..', 'my-app', 'public'),
    // Quando executado da raiz do projeto
    path.resolve(process.cwd(), 'my-app', 'public'),
    // Caminho usando __dirname (quando compilado via ts-node)
    path.resolve(__dirname, '..', 'my-app', 'public'),
    path.resolve(__dirname, '..', '..', 'my-app', 'public'),
  ];

  let publicFolder: string | null = null;
  
  // Encontrar a pasta public
  for (const basePath of basePaths) {
    if (fs.existsSync(basePath)) {
      publicFolder = basePath;
      break;
    }
  }

  if (!publicFolder) {
    console.warn(`⚠️ Pasta my-app/public não encontrada. Tentativas:`);
    basePaths.forEach(p => console.warn(`   - ${p}`));
    return [];
  }

  // Procurar pela pasta "FotoMovel" diretamente
  let imagesFolder: string | null = null;
  
  console.log(`🔍 Procurando pasta FotoMovel em: ${publicFolder}`);
  
  // Primeiro, tentar encontrar "FotoMovel" diretamente (prioridade máxima)
  const fotoMovelPath = path.join(publicFolder, 'FotoMovel');
  console.log(`   Tentando caminho direto: ${fotoMovelPath}`);
  
  if (fs.existsSync(fotoMovelPath) && fs.statSync(fotoMovelPath).isDirectory()) {
    imagesFolder = fotoMovelPath;
    console.log(`✅ Pasta FotoMovel encontrada diretamente: ${imagesFolder}`);
  } else {
    console.log(`   Caminho direto não encontrado, procurando variações...`);
    // Se não encontrar, procurar por variações (case-insensitive)
    try {
      const dirs = fs.readdirSync(publicFolder, { withFileTypes: true });
      console.log(`   Pastas encontradas em public:`, dirs.filter(d => d.isDirectory()).map(d => d.name));
      
      // Priorizar FotoMovel (case-insensitive)
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const dirNameLower = dir.name.toLowerCase();
          if (dirNameLower === 'fotomovel' || dirNameLower.includes('fotomovel')) {
            imagesFolder = path.join(publicFolder, dir.name);
            console.log(`✅ Pasta FotoMovel encontrada (variação): ${imagesFolder}`);
            break;
          }
        }
      }
      
      // Se ainda não encontrou, tentar outras variações
      if (!imagesFolder) {
        for (const dir of dirs) {
          if (dir.isDirectory() && (dir.name.includes('Mobili') || dir.name.includes('Móveis') || dir.name.includes('MobiliAI'))) {
            imagesFolder = path.join(publicFolder, dir.name);
            console.log(`⚠️ Usando pasta alternativa: ${imagesFolder}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao ler pasta public:', error);
      return [];
    }
  }

  if (!imagesFolder) {
    console.warn(`⚠️ Pasta "FotoMovel" não encontrada em: ${publicFolder}`);
    try {
      const availableDirs = fs.readdirSync(publicFolder, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      console.warn(`   Pastas disponíveis:`, availableDirs);
    } catch (error) {
      console.error('❌ Erro ao listar pastas:', error);
    }
    return [];
  }
  
  // Verificar se a pasta tem arquivos
  try {
    const filesInFolder = fs.readdirSync(imagesFolder);
    const pngFiles = filesInFolder.filter(f => f.toLowerCase().endsWith('.png'));
    console.log(`📊 Pasta contém ${pngFiles.length} arquivos PNG`);
    if (pngFiles.length > 0) {
      console.log(`   Primeiros arquivos:`, pngFiles.slice(0, 5).join(', '));
    }
  } catch (error) {
    console.error('❌ Erro ao listar arquivos da pasta:', error);
  }

  const files = fs.readdirSync(imagesFolder)
    .filter(file => file.toLowerCase().endsWith('.png'))
    .map(file => path.join(imagesFolder!, file))
    .sort((a, b) => {
      // Ordenar numericamente por nome (1.png, 2.png, ..., 195.png)
      const numA = parseInt(path.basename(a, '.png')) || 0;
      const numB = parseInt(path.basename(b, '.png')) || 0;
      return numA - numB;
    });

  console.log(`📸 Total de ${files.length} imagens PNG encontradas na pasta FotoMovel`);
  if (files.length > 0) {
    const firstFile = path.basename(files[0]);
    const lastFile = path.basename(files[files.length - 1]);
    console.log(`   Primeira imagem: ${firstFile}`);
    console.log(`   Última imagem: ${lastFile}`);
  }
  return files;
}

// Função para fazer upload de imagem para o Supabase
async function uploadImageToSupabase(
  supabase: SupabaseClient,
  imagePath: string,
  productId: string,
  index: number
): Promise<string | null> {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);
    const fileExtension = path.extname(fileName);
    const timestamp = Date.now();
    const uploadFileName = `products/${productId}_${timestamp}_${index}${fileExtension}`;

    console.log(`📤 Fazendo upload de ${fileName}...`);

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(uploadFileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      console.error(`❌ Erro ao fazer upload de ${fileName}:`, error.message);
      return null;
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadFileName);

    console.log(`✅ Upload concluído: ${fileName}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`❌ Erro ao processar ${imagePath}:`, error);
    return null;
  }
}

// Base de dados de produtos de móveis com variações
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

// Função para gerar SKU único
function generateSKU(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${Date.now()}-${index}`;
}

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

// Função para obter categoria aleatória
function getRandomCategory(): ProductCategory {
  const categories: ProductCategory[] = [
    ProductCategory.SOFA,
    ProductCategory.MESA,
    ProductCategory.CADEIRA,
    ProductCategory.ESTANTE,
    ProductCategory.POLTRONA,
    ProductCategory.MESA_CENTRO,
    ProductCategory.LUMINARIA,
    ProductCategory.QUADRO,
  ];
  return categories[Math.floor(Math.random() * categories.length)];
}

// Função para obter produto aleatório da categoria
function getRandomProduct(category: ProductCategory) {
  const products = furnitureProducts[category];
  if (!products) {
    // Para categorias que não estão no furnitureProducts, criar produto genérico
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

// Função para obter par de imagens para uma categoria (com e sem fundo)
function getImagePairForCategory(
  category: ProductCategory,
  imageFiles: string[],
  usedImagePairs: Set<number>
): { imageWithBg: string | null; imageWithoutBg: string | null } | null {
  const range = categoryImageRanges[category];
  if (!range) {
    return null;
  }

  // Encontrar todos os pares disponíveis (números pares no intervalo)
  const availablePairs: number[] = [];
  const allPairs: number[] = [];

  for (let i = range.start; i <= range.end; i += 2) {
    if (i + 1 <= range.end) {
      // Procurar as duas imagens do par (i = com fundo, i+1 = sem fundo)
      const image1Index = imageFiles.findIndex(f => {
        const num = parseInt(path.basename(f, '.png')) || 0;
        return num === i;
      });
      const image2Index = imageFiles.findIndex(f => {
        const num = parseInt(path.basename(f, '.png')) || 0;
        return num === i + 1;
      });

      if (image1Index !== -1 && image2Index !== -1) {
        allPairs.push(i);
        if (!usedImagePairs.has(i)) {
          availablePairs.push(i);
        }
      }
    }
  }

  // Se não houver pares disponíveis, usar qualquer par (permitir reutilização)
  const pairsToUse = availablePairs.length > 0 ? availablePairs : allPairs;

  if (pairsToUse.length === 0) {
    return null;
  }

  // Selecionar um par aleatório
  const randomPair = pairsToUse[Math.floor(Math.random() * pairsToUse.length)];

  // Marcar como usado se for um par novo
  if (availablePairs.length > 0) {
    usedImagePairs.add(randomPair);
  }

  // Encontrar os caminhos das imagens
  const image1Path = imageFiles.find(f => {
    const num = parseInt(path.basename(f, '.png')) || 0;
    return num === randomPair;
  });
  const image2Path = imageFiles.find(f => {
    const num = parseInt(path.basename(f, '.png')) || 0;
    return num === randomPair + 1;
  });

  return {
    imageWithBg: image1Path || null,      // Imagem com fundo (número par)
    imageWithoutBg: image2Path || null,  // Imagem sem fundo (número ímpar)
  };
}

export async function seedFurnitureProducts() {
  console.log('🛋️ Criando produtos de móveis aleatórios para todas as filiais...');

  try {
    // Inicializar Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('✅ Supabase configurado - imagens serão enviadas para o bucket');
    }

    // Ler todas as imagens da pasta
    const imageFiles = getImageFiles();
    const usedImagePairs = new Set<number>(); // Rastrear pares de imagens já usados

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
    
    // Rastrear produtos criados para evitar duplicatas (nome + categoria)
    const createdProductKeys = new Set<string>();

    for (const store of stores) {
      console.log(`\n📦 Criando produtos para: ${store.name}`);
      
      const productsToCreate = [];

      // Criar produtos aleatórios
      for (let i = 0; i < productsPerStore; i++) {
        let category = getRandomCategory();
        let productTemplate = getRandomProduct(category);
        
        // Criar chave única baseada em nome + categoria para evitar duplicatas
        let productKey = `${productTemplate.name}_${category}`.toLowerCase();
        let attempts = 0;
        const maxAttempts = 100;
        
        // Tentar encontrar um produto único
        while (createdProductKeys.has(productKey) && attempts < maxAttempts) {
          category = getRandomCategory();
          productTemplate = getRandomProduct(category);
          productKey = `${productTemplate.name}_${category}`.toLowerCase();
          attempts++;
        }
        
        // Se ainda estiver duplicado após muitas tentativas, adicionar sufixo único
        if (createdProductKeys.has(productKey)) {
          productKey = `${productKey}_${Date.now()}_${i}`;
        }
        
        createdProductKeys.add(productKey);
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
        } else if (category === ProductCategory.MESA_CENTRO) {
          dimensions = {
            width: parseFloat((Math.random() * 60 + 80).toFixed(2)),  // 80-140cm
            height: parseFloat((Math.random() * 10 + 40).toFixed(2)),  // 40-50cm
            depth: parseFloat((Math.random() * 60 + 40).toFixed(2)),  // 40-100cm
          };
        } else if (category === ProductCategory.LUMINARIA) {
          dimensions = {
            width: parseFloat((Math.random() * 20 + 20).toFixed(2)),  // 20-40cm
            height: parseFloat((Math.random() * 50 + 30).toFixed(2)), // 30-80cm
            depth: parseFloat((Math.random() * 20 + 20).toFixed(2)),  // 20-40cm
          };
        } else if (category === ProductCategory.QUADRO) {
          dimensions = {
            width: parseFloat((Math.random() * 60 + 40).toFixed(2)),  // 40-100cm
            height: parseFloat((Math.random() * 80 + 50).toFixed(2)), // 50-130cm
            depth: parseFloat((Math.random() * 5 + 2).toFixed(2)),   // 2-7cm
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

      // Criar produtos com imagens
      console.log(`\n📤 Criando produtos e fazendo upload de imagens para ${store.name}...`);
      const createdProducts = [];
      
      for (let i = 0; i < productsToCreate.length; i++) {
        const productData = productsToCreate[i];
        const imageUrls: string[] = [];
        
        // Criar produto primeiro para obter o ID
        const createdProduct = await prisma.product.create({
          data: productData,
        });

        // Fazer upload das imagens DEPOIS de criar o produto (para usar o ID real)
        if (imageFiles.length > 0 && supabase) {
          // Obter par de imagens para a categoria (com e sem fundo)
          const imagePair = getImagePairForCategory(
            productData.category,
            imageFiles,
            usedImagePairs
          );

          if (imagePair && imagePair.imageWithBg && imagePair.imageWithoutBg) {
            // Fazer upload da imagem com fundo
            const imageUrl1 = await uploadImageToSupabase(
              supabase,
              imagePair.imageWithBg,
              createdProduct.id,
              i * 2
            );

            // Fazer upload da imagem sem fundo
            const imageUrl2 = await uploadImageToSupabase(
              supabase,
              imagePair.imageWithoutBg,
              createdProduct.id,
              i * 2 + 1
            );

            if (imageUrl1) {
              imageUrls.push(imageUrl1);
            }
            if (imageUrl2) {
              imageUrls.push(imageUrl2);
            }

            if (imageUrls.length > 0) {
              // Atualizar produto com as URLs das imagens
              await prisma.product.update({
                where: { id: createdProduct.id },
                data: {
                  imageUrl: imageUrls[0], // Primeira imagem como principal
                  imageUrls: imageUrls,    // Array com ambas as imagens
                },
              });
              console.log(`✅ Produto criado e ${imageUrls.length} imagem(ns) ${i + 1}/${productsToCreate.length} enviada(s) para o bucket`);
            } else {
              console.warn(`⚠️ Produto criado mas falha ao enviar imagens ${i + 1}/${productsToCreate.length}`);
            }
          } else {
            console.warn(`⚠️ Nenhuma imagem disponível para categoria ${productData.category} ou todas já foram usadas`);
          }
        } else {
          console.log(`✅ Produto ${i + 1}/${productsToCreate.length} criado (sem imagem)`);
        }

        createdProducts.push(createdProduct);
      }

      totalCreated += createdProducts.length;
      console.log(`✅ Criados ${createdProducts.length} produtos com imagens para ${store.name}`);
    }

    console.log(`\n🎉 Seed concluído! Total de ${totalCreated} produtos criados em ${stores.length} loja(s)`);
    if (imageFiles.length > 0) {
      console.log(`📸 ${imageFiles.length} imagens processadas e enviadas para o bucket`);
    }
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

