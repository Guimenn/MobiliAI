'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore, Product } from '@/lib/store';
import { useProducts } from '@/lib/hooks/useProducts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  Shield,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  MapPin,
  Package,
  Ruler,
  Weight,
  Palette,
  Sparkles,
  Zap,
  ArrowLeft,
  Share2,
  Eye,
} from 'lucide-react';
import Image from 'next/image';
import { env } from '@/lib/env';

// Mapeamento de categorias para ícones
const categoryNames: Record<string, string> = {
  'SOFA': 'Sofás',
  'MESA': 'Mesas',
  'CADEIRA': 'Cadeiras',
  'ESTANTE': 'Estantes',
  'POLTRONA': 'Poltronas',
  'QUADRO': 'Quadros',
  'LUMINARIA': 'Luminárias',
  'OUTROS': 'Outros',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, user, isAuthenticated } = useAppStore();
  const { products } = useProducts();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);

  const productId = params.id as string;

  // Buscar produto
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Tentar buscar do endpoint público primeiro
        try {
          const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
          const response = await fetch(`${apiBaseUrl}/public/products/${productId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const data = await response.json();
            const mappedProduct: Product = {
              id: data.id,
              name: data.name,
              description: data.description,
              category: (data.category?.toLowerCase() || 'outros') as any,
              price: Number(data.price),
              stock: Number(data.stock) || 0,
              color: data.colorHex || data.colorName,
              material: data.material,
              brand: data.brand,
              dimensions: data.width && data.height && data.depth 
                ? `${data.width}x${data.height}x${data.depth}cm` 
                : data.dimensions,
              weight: data.weight,
              style: data.style,
              imageUrl: Array.isArray(data.imageUrls) && data.imageUrls.length > 0 
                ? data.imageUrls[0] 
                : data.imageUrl,
              storeId: data.store?.id || data.storeId || '',
            };
            setProduct(mappedProduct);
            
            // Salvar todas as imagens do produto
            if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
              setProductImages(data.imageUrls);
            } else if (data.imageUrl) {
              setProductImages([data.imageUrl]);
            }
            
            // Buscar produtos relacionados
            if (data.category) {
              const relatedResponse = await fetch(
                `${apiBaseUrl}/public/products?category=${data.category}&limit=4`,
                { headers: { 'Content-Type': 'application/json' } }
              );
              if (relatedResponse.ok) {
                const relatedData = await relatedResponse.json();
                const related = (relatedData.products || relatedData.data || [])
                  .filter((p: any) => p.id !== productId)
                  .slice(0, 4)
                  .map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    category: (p.category?.toLowerCase() || 'outros') as any,
                    price: Number(p.price),
                    stock: Number(p.stock) || 0,
                    color: p.colorHex || p.colorName,
                    material: p.material,
                    brand: p.brand,
                    dimensions: p.width && p.height && p.depth 
                      ? `${p.width}x${p.height}x${p.depth}cm` 
                      : p.dimensions,
                    weight: p.weight,
                    style: p.style,
                    imageUrl: Array.isArray(p.imageUrls) && p.imageUrls.length > 0 
                      ? p.imageUrls[0] 
                      : p.imageUrl,
                    storeId: p.store?.id || p.storeId || '',
                  }));
                setRelatedProducts(related);
              }
            }
            return;
          }
        } catch (apiError) {
          console.log('Endpoint público não disponível, tentando produtos locais');
        }

        // Fallback: buscar da lista de produtos
        const foundProduct = products.find(p => p.id === productId);
        if (foundProduct) {
          setProduct(foundProduct);
          if (foundProduct.imageUrl) {
            setProductImages([foundProduct.imageUrl]);
          }
          // Produtos relacionados da mesma categoria
          const related = products
            .filter(p => p.id !== productId && p.category === foundProduct.category)
            .slice(0, 4);
          setRelatedProducts(related);
        } else {
          setError('Produto não encontrado');
        }
      } catch (err: any) {
        console.error('Erro ao buscar produto:', err);
        setError('Erro ao carregar produto. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, products]);

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      // Feedback visual
      const button = document.getElementById('add-to-cart-btn');
      if (button) {
        button.classList.add('animate-pulse');
        setTimeout(() => button.classList.remove('animate-pulse'), 500);
      }
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (product) {
      const newQuantity = Math.max(1, Math.min(quantity + delta, product.stock || 1));
      setQuantity(newQuantity);
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: `Confira ${product.name} na MobiliAI!`,
          url: window.location.href,
        });
      } catch (err) {
        // Usuário cancelou ou erro
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  // Rating simulado (pode ser substituído por dados reais)
  const rating = 4.5 + Math.random() * 0.5;
  const reviews = Math.floor(Math.random() * 500) + 50;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-brand-700/20 border-t-brand-700 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando produto...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Package className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
            <p className="text-gray-600 mb-6">{error || 'O produto que você está procurando não existe.'}</p>
            <Button onClick={() => router.push('/products')} className="bg-brand-700 hover:bg-brand-800 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para produtos
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-brand-700 hover:text-brand-800">
                Início
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4 text-brand-700" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/products" className="text-brand-700 hover:text-brand-800">
                Produtos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4 text-brand-700" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <span className="font-medium text-brand-700">{product.name}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            {/* Imagem Principal */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border-2 border-brand-100 shadow-lg group">
              {productImages[selectedImageIndex] ? (
                <Image
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="h-24 w-24 text-gray-300" />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.stock && product.stock > 0 && product.stock <= 10 && (
                  <Badge className="bg-orange-500 text-white">
                    Últimas unidades!
                  </Badge>
                )}
                {(product.stock || 0) === 0 && (
                  <Badge className="bg-red-500 text-white">
                    Esgotado
                  </Badge>
                )}
              </div>

              {/* Botões de navegação da galeria */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5 text-brand-700" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev + 1) % productImages.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5 text-brand-700" />
                  </button>
                </>
              )}

              {/* Indicador de zoom */}
              <div className="absolute bottom-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-4 w-4 text-brand-700" />
              </div>
            </div>

            {/* Miniaturas */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {productImages.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-brand-700 ring-2 ring-brand-700/20'
                        : 'border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Categoria e Marca */}
            <div className="flex items-center gap-3 flex-wrap">
              {product.category && (
                <Badge variant="outline" className="border-brand-200 text-brand-700">
                  {categoryNames[product.category.toUpperCase()] || product.category}
                </Badge>
              )}
              {product.brand && (
                <Badge variant="outline" className="border-brand-200 text-brand-700">
                  {product.brand}
                </Badge>
              )}
            </div>

            {/* Nome do Produto */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold text-gray-900">{rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-500">
                  ({reviews} avaliações)
                </span>
              </div>
            </div>

            {/* Preço */}
            <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl p-6 border-2 border-brand-200">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Por apenas</span>
                <span className="text-4xl md:text-5xl font-black text-brand-700">
                  R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Parcelamento em até 18x sem juros
              </p>
            </div>

            {/* Descrição */}
            {product.description && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Especificações */}
            <div className="grid grid-cols-2 gap-4">
              {product.dimensions && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="bg-brand-100 rounded-lg p-2">
                    <Ruler className="h-5 w-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dimensões</p>
                    <p className="text-sm font-semibold text-gray-900">{product.dimensions}</p>
                  </div>
                </div>
              )}
              {product.weight && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="bg-brand-100 rounded-lg p-2">
                    <Weight className="h-5 w-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Peso</p>
                    <p className="text-sm font-semibold text-gray-900">{product.weight}</p>
                  </div>
                </div>
              )}
              {product.material && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="bg-brand-100 rounded-lg p-2">
                    <Package className="h-5 w-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Material</p>
                    <p className="text-sm font-semibold text-gray-900">{product.material}</p>
                  </div>
                </div>
              )}
              {product.color && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="bg-brand-100 rounded-lg p-2">
                    <Palette className="h-5 w-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cor</p>
                    <p className="text-sm font-semibold text-gray-900">{product.color}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Estoque */}
            <div className="p-4 bg-white rounded-xl border-2 border-brand-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Estoque disponível</p>
                  <p className={`text-lg font-bold ${(product.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(product.stock || 0) > 0 ? `${product.stock} unidades` : 'Esgotado'}
                  </p>
                </div>
                {(product.stock || 0) > 0 && (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                )}
              </div>
            </div>

            {/* Quantidade e Ações */}
            <div className="space-y-4">
              {/* Seletor de Quantidade */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Quantidade:</span>
                <div className="flex items-center gap-2 border-2 border-brand-200 rounded-xl">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-4 w-4 text-brand-700" />
                  </button>
                  <span className="px-4 py-2 text-lg font-semibold text-gray-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.stock || 1)}
                    className="p-2 hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-4 w-4 text-brand-700" />
                  </button>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  id="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={(product.stock || 0) === 0}
                  className="flex-1 bg-brand-700 hover:bg-brand-800 text-black cursor-pointer h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {(product.stock || 0) === 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="h-14 px-6 border-2 border-brand-200 hover:border-brand-300 hover:bg-brand-50"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-brand-700'}`} />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="h-14 px-6 border-2 border-brand-200 hover:border-brand-300 hover:bg-brand-50"
                >
                  <Share2 className="h-5 w-5 text-brand-700" />
                </Button>
              </div>
            </div>

            {/* Garantias e Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4 text-brand-700" />
                <span>Frete grátis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-brand-700" />
                <span>Compra garantida</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CreditCard className="h-4 w-4 text-brand-700" />
                <span>Parcelamento</span>
              </div>
            </div>
          </div>
        </div>

        {/* Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Produtos Relacionados</h2>
              <Button
                variant="ghost"
                onClick={() => router.push(`/products?cat=${product.category}`)}
                className="text-brand-700 hover:text-brand-800"
              >
                Ver todos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  onClick={() => router.push(`/products/${relatedProduct.id}`)}
                  className="bg-white rounded-xl border-2 border-brand-100 hover:border-brand-300 hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer group"
                >
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {relatedProduct.imageUrl ? (
                      <Image
                        src={relatedProduct.imageUrl}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-lg font-bold text-brand-700">
                      R$ {relatedProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

