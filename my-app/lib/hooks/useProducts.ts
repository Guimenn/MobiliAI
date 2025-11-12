import { useState, useEffect } from 'react';
import { productsAPI } from '@/lib/api';
import { Product } from '@/lib/store';
import { env } from '@/lib/env';

interface UseProductsOptions {
  category?: string;
  storeId?: string;
  limit?: number;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Função para testar conectividade com o backend
const testBackendConnection = async (): Promise<boolean> => {
  try {
    // Testar o endpoint público de produtos
    const response = await fetch(`${env.API_URL}/public/products?limit=1`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Testar conectividade primeiro
      const isBackendAvailable = await testBackendConnection();
      
      if (!isBackendAvailable) {
        console.warn('⚠️ Backend não disponível, usando dados mock');
        setError('Backend temporariamente indisponível. Usando dados de exemplo.');
        setProducts(getMockProducts());
        return;
      }
      
      // Usar endpoint público de produtos
      const params = new URLSearchParams();
      if (options.category) {
        params.append('category', options.category);
      }
      if (options.storeId) {
        params.append('storeId', options.storeId);
      }
      params.append('limit', '500'); // Limite alto para pegar todos os produtos
      
      const response = await fetch(`${env.API_URL}/public/products?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        // Se for erro 500, tentar usar dados mock
        if (response.status === 500) {
          console.warn('Servidor retornou erro 500, usando dados mock');
          setError('Servidor temporariamente indisponível. Usando dados de exemplo.');
          setProducts(getMockProducts());
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Se não conseguir parsear JSON, usar dados mock
        console.warn('Resposta inválida da API, usando dados mock');
        setError('Formato de resposta inválido. Usando dados de exemplo.');
        setProducts(getMockProducts());
        return;
      }
      
      // Se a resposta tem uma estrutura de paginação, pegar os produtos e verificar se há mais páginas
      let allProducts: any[] = [];
      let totalPages = 1;
      
      // Se a resposta tem paginação, buscar todas as páginas
      if (data.pagination) {
        totalPages = data.pagination.pages || 1;
        allProducts = data.products || [];
        
        // Se há mais páginas, buscar todas
        if (totalPages > 1) {
          const allPagesPromises = [];
          for (let page = 2; page <= totalPages; page++) {
            const pageParams = new URLSearchParams();
            if (options.category) {
              pageParams.append('category', options.category);
            }
            if (options.storeId) {
              pageParams.append('storeId', options.storeId);
            }
            pageParams.append('limit', '500');
            pageParams.append('page', String(page));
            
            allPagesPromises.push(
              fetch(`${env.API_URL}/public/products?${pageParams.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              }).then(res => res.json())
            );
          }
          
          const otherPages = await Promise.all(allPagesPromises);
          otherPages.forEach(pageData => {
            if (pageData.products && Array.isArray(pageData.products)) {
              allProducts = [...allProducts, ...pageData.products];
            }
          });
        }
      } else {
        // Se não tem paginação, usar a resposta direta
        allProducts = data.products || data.data || data;
      }
      
      // Verificar se allProducts é um array válido
      if (!Array.isArray(allProducts)) {
        // Se não for array, usar dados mock
        console.warn('Resposta não contém array de produtos, usando dados mock');
        setError('Formato de resposta inválido. Usando dados de exemplo.');
        setProducts(getMockProducts());
        return;
      }
      
      // Mapear os dados da API para o formato do Product
      const mappedProducts: Product[] = allProducts.map((product: any) => {
        const imageUrl = (product.imageUrls && product.imageUrls.length > 0) 
          ? product.imageUrls[0] 
          : (product.imageUrl || undefined);
        
        // Debug: log das URLs de imagem para os primeiros produtos
        if (allProducts.indexOf(product) < 3) {
          console.log(`📸 Produto ${product.name}:`, {
            imageUrl: product.imageUrl,
            imageUrls: product.imageUrls,
            finalImageUrl: imageUrl
          });
        }
        
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category?.toLowerCase() || 'mesa_centro',
          price: Number(product.price),
          stock: Number(product.stock) || 0,
          color: product.colorHex || product.colorName,
          material: product.material,
          brand: product.brand,
          dimensions: product.width && product.height && product.depth 
            ? `${product.width}x${product.height}x${product.depth}cm` 
            : product.dimensions,
          weight: product.weight,
          style: product.style,
          imageUrl: imageUrl,
          imageUrls: product.imageUrls || (imageUrl ? [imageUrl] : []), // Preservar array de imagens
          storeId: product.store?.id || product.storeId || '',
          rating: product.rating ? Number(product.rating) : 0,
          reviewCount: product.reviewCount ? Number(product.reviewCount) : 0,
          storeName: product.store?.name,
          storeAddress: product.store?.address,
          // Campos de Oferta Normal
          isOnSale: product.isOnSale || false,
          salePrice: product.salePrice ? Number(product.salePrice) : undefined,
          saleDiscountPercent: product.saleDiscountPercent ? Number(product.saleDiscountPercent) : undefined,
          saleStartDate: product.saleStartDate ? new Date(product.saleStartDate).toISOString() : undefined,
          saleEndDate: product.saleEndDate ? new Date(product.saleEndDate).toISOString() : undefined,
          // Campos de Oferta Relâmpago
          isFlashSale: product.isFlashSale || false,
          flashSalePrice: product.flashSalePrice ? Number(product.flashSalePrice) : undefined,
          flashSaleDiscountPercent: product.flashSaleDiscountPercent ? Number(product.flashSaleDiscountPercent) : undefined,
          flashSaleStartDate: product.flashSaleStartDate ? new Date(product.flashSaleStartDate).toISOString() : undefined,
          flashSaleEndDate: product.flashSaleEndDate ? new Date(product.flashSaleEndDate).toISOString() : undefined,
        };
      });

      setProducts(mappedProducts);
    } catch (err: any) {
      console.error('Erro ao buscar produtos:', err);
      
      // Determinar mensagem de erro baseada no tipo de erro
      let errorMessage = 'Erro ao carregar produtos.';
      
      if (err.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. Usando dados de exemplo.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Endpoint de produtos não encontrado. Usando dados de exemplo.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Erro de conexão. Verifique sua internet. Usando dados de exemplo.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Tempo limite excedido. Usando dados de exemplo.';
      } else if (err.message?.includes('Formato de resposta inválido')) {
        errorMessage = 'Formato de dados inválido. Usando dados de exemplo.';
      }
      
      setError(errorMessage);
      
      // Fallback para dados mock em caso de erro
      setProducts(getMockProducts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [options.category, options.storeId]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
};

// Dados mock como fallback
const getMockProducts = (): Product[] => [
  {
    id: '1',
    name: 'Sofá 3 Lugares Moderno',
    description: 'Sofá confortável e elegante para sua sala de estar',
    category: 'sofa',
    price: 2499.99,
    stock: 10,
    color: '#3e2626',
    material: 'Tecido premium',
    brand: 'MobiliAI',
    dimensions: '200x90x80cm',
    weight: '45kg',
    style: 'Moderno',
    imageUrl: '/placeholder-sofa.jpg',
    storeId: '1',
  },
  {
    id: '2',
    name: 'Cadeira Executiva Premium',
    description: 'Cadeira ergonômica para escritório',
    category: 'cadeira',
    price: 899.99,
    stock: 15,
    color: '#8B4513',
    material: 'Couro sintético',
    brand: 'MobiliAI',
    dimensions: '60x60x120cm',
    weight: '15kg',
    style: 'Executivo',
    imageUrl: '/placeholder-chair.jpg',
    storeId: '1',
  },
  {
    id: '3',
    name: 'Mesa de Centro Elegante',
    description: 'Mesa de centro com design contemporâneo',
    category: 'mesa',
    price: 1299.99,
    stock: 8,
    color: '#D2B48C',
    material: 'Madeira maciça',
    brand: 'MobiliAI',
    dimensions: '120x60x45cm',
    weight: '25kg',
    style: 'Contemporâneo',
    imageUrl: '/placeholder-table.jpg',
    storeId: '1',
  },
  {
    id: '4',
    name: 'Luminária Pendant Moderna',
    description: 'Luminária pendente para iluminação ambiente',
    category: 'iluminacao',
    price: 599.99,
    stock: 20,
    color: '#A0522D',
    material: 'Metal e vidro',
    brand: 'MobiliAI',
    dimensions: '30x30x60cm',
    weight: '3kg',
    style: 'Moderno',
    imageUrl: '/placeholder-lamp.jpg',
    storeId: '1',
  },
  {
    id: '5',
    name: 'Poltrona Relax Premium',
    description: 'Poltrona super confortável para relaxar',
    category: 'sofa',
    price: 1899.99,
    stock: 12,
    color: '#CD853F',
    material: 'Tecido premium',
    brand: 'MobiliAI',
    dimensions: '80x80x90cm',
    weight: '30kg',
    style: 'Relax',
    imageUrl: '/placeholder-armchair.jpg',
    storeId: '1',
  },
  {
    id: '6',
    name: 'Mesa de Jantar 6 Lugares',
    description: 'Mesa de jantar para família grande',
    category: 'mesa',
    price: 2199.99,
    stock: 5,
    color: '#DEB887',
    material: 'Madeira maciça',
    brand: 'MobiliAI',
    dimensions: '180x90x75cm',
    weight: '60kg',
    style: 'Rustico',
    imageUrl: '/placeholder-dining-table.jpg',
    storeId: '1',
  },
];
