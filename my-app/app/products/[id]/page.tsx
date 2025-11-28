'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore, Product } from '@/lib/store';
import { useProducts } from '@/lib/hooks/useProducts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FavoriteTooltip from '@/components/FavoriteTooltip';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
  Store,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import { env } from '@/lib/env';
import { customerAPI } from '@/lib/api';
import { toast } from 'sonner';
import { showAlert } from '@/lib/alerts';
import ProductReviews from '@/components/ProductReviews';
import ReviewForm from '@/components/ReviewForm';

// Mapeamento de categorias para ícones
const categoryNames: Record<string, string> = {
  'SOFA': 'Sofás',
  'MESA': 'Mesas',
  'CADEIRA': 'Cadeiras',
  'ESTANTE': 'Estantes',
  'POLTRONA': 'Poltronas',
  'QUADRO': 'Quadros',
  'LUMINARIA': 'Luminárias',
  'MESA_CENTRO': 'Mesa de centro',
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
  const [cep, setCep] = useState('');
  const [shippingInfo, setShippingInfo] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewKey, setReviewKey] = useState(0);
  const [flashSecondsLeft, setFlashSecondsLeft] = useState<number | null>(null);

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
              category: (data.category?.toLowerCase() || 'mesa_centro') as any,
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
              imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
              storeId: data.store?.id || data.storeId || '',
              rating: data.rating ? Number(data.rating) : undefined,
              reviewCount: data.reviewCount ? Number(data.reviewCount) : undefined,
              // Campos de Oferta Normal
              isOnSale: data.isOnSale || false,
              salePrice: data.salePrice ? Number(data.salePrice) : undefined,
              saleStartDate: data.saleStartDate,
              saleEndDate: data.saleEndDate,
              // Campos de Oferta Relâmpago
              isFlashSale: data.isFlashSale || false,
              flashSalePrice: data.flashSalePrice ? Number(data.flashSalePrice) : undefined,
              flashSaleDiscountPercent: data.flashSaleDiscountPercent ? Number(data.flashSaleDiscountPercent) : undefined,
              flashSaleStartDate: data.flashSaleStartDate,
              flashSaleEndDate: data.flashSaleEndDate,
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
                    category: (p.category?.toLowerCase() || 'mesa_centro') as any,
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
                    storeName: p.store?.name,
                    storeAddress: p.store?.address,
                  }));
                setRelatedProducts(related);
              }
            }
            return;
          }
         } catch (apiError) {
           // Endpoint público não disponível, tentando produtos locais
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

  // Atualiza o tempo restante da oferta relâmpago com base na data de término do produto
  useEffect(() => {
    if (!product || !product.isFlashSale || !product.flashSaleEndDate) {
      setFlashSecondsLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date();
      const end = new Date(product.flashSaleEndDate as string);
      const diffInSeconds = Math.max(
        0,
        Math.floor((end.getTime() - now.getTime()) / 1000)
      );

      setFlashSecondsLeft(diffInSeconds);
    };

    updateTimeLeft();
    const intervalId = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(intervalId);
  }, [product]);

  const formatFlashTime = (totalSeconds: number | null) => {
    if (totalSeconds === null) return '--h --m';
    const h = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    return `${h}h ${m}m`;
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        // addToCart do store já gerencia backend automaticamente quando autenticado
        await addToCart(product, quantity);
        
        // Disparar evento para atualizar notificações imediatamente
        if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
          window.dispatchEvent(new CustomEvent('notification:cart-added'));
        }
        
        // Mostrar mensagem de sucesso
        toast.success(
          `${quantity === 1 ? 'Produto adicionado' : `${quantity} produtos adicionados`} ao carrinho!`,
          {
            description: product.name,
            duration: 3000,
          }
        );
        
        // Feedback visual
        const button = document.getElementById('add-to-cart-btn');
        if (button) {
          button.classList.add('animate-pulse');
          setTimeout(() => button.classList.remove('animate-pulse'), 500);
        }
      } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
      }
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  const handleCalcShipping = () => {
    if (!cep || cep.replace(/\D/g, '').length < 8) {
      setShippingInfo('Informe um CEP válido');
      return;
    }
    const available = (product?.stock || 0) > 0;
    if (!available) {
      setShippingInfo('Indisponível no momento');
      return;
    }
    const days = Math.floor(2 + Math.random() * 4);
    setShippingInfo(`Chegará em até ${days} dia${days > 1 ? 's' : ''} • Frete grátis`);
  };

  const handleQuantityChange = (delta: number) => {
    if (product) {
      const newQuantity = Math.max(1, quantity + delta);
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
      showAlert('success', 'Link copiado para a área de transferência!');
    }
  };

  // Verificar se produto está nos favoritos
  useEffect(() => {
    const checkFavorite = async () => {
      if (!productId || !isAuthenticated) {
        setIsFavorite(false);
        return;
      }
      try {
        const response = await customerAPI.checkFavorite(productId);
        setIsFavorite(response.isFavorite || false);
      } catch (error: any) {
        // Silenciar erros - apenas mostrar false (0)
        setIsFavorite(false);
      }
    };

    checkFavorite();
  }, [productId, isAuthenticated]);

  // Função para alternar favorito
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar aos favoritos');
      return;
    }

    if (!productId) return;

    try {
      if (isFavorite) {
        await customerAPI.removeFromFavorites(productId);
        setIsFavorite(false);
        toast.success('Produto removido dos favoritos');
      } else {
        await customerAPI.addToFavorites(productId);
        setIsFavorite(true);
        // Disparar evento para atualizar notificações imediatamente
        window.dispatchEvent(new CustomEvent('notification:favorite-added'));
        toast.success('Produto adicionado aos favoritos');
      }
    } catch (error: any) {
      console.error('Erro ao alternar favorito:', error);
      toast.error(error?.response?.data?.message || 'Erro ao atualizar favoritos');
      // Reverter estado em caso de erro
      setIsFavorite(!isFavorite);
    }
  };

  // Buscar rating real do produto (se disponível)
  const rating = product?.rating || 0;
  const reviews = product?.reviewCount || 0;

  // Função para verificar se uma oferta está ativa
  const isSaleActive = (product: Product | null): boolean => {
    if (!product) return false;
    const now = new Date();
    
    // Verificar oferta relâmpago primeiro (tem prioridade)
    if (product.isFlashSale && product.flashSaleStartDate && product.flashSaleEndDate) {
      const start = new Date(product.flashSaleStartDate);
      const end = new Date(product.flashSaleEndDate);
      if (now >= start && now <= end) {
        return true;
      }
    }
    
    // Verificar oferta normal
    if (product.isOnSale && product.saleStartDate && product.saleEndDate) {
      const start = new Date(product.saleStartDate);
      const end = new Date(product.saleEndDate);
      if (now >= start && now <= end) {
        return true;
      }
    }
    
    return false;
  };

  // Função para obter o preço atual (com oferta se ativa)
  const getCurrentPrice = (product: Product | null): number => {
    if (!product) return 0;
    
    if (isSaleActive(product)) {
      // Prioridade para oferta relâmpago
      if (product.isFlashSale) {
        // Se tem flashSalePrice, usar ele
        if (product.flashSalePrice !== undefined && product.flashSalePrice !== null) {
          return Number(product.flashSalePrice);
        }
        // Se não tem flashSalePrice mas tem flashSaleDiscountPercent, calcular
        if (product.flashSaleDiscountPercent !== undefined && product.flashSaleDiscountPercent !== null && product.price) {
          const discount = (Number(product.price) * Number(product.flashSaleDiscountPercent)) / 100;
          return Number(product.price) - discount;
        }
      }
      // Depois oferta normal
      if (product.isOnSale && product.salePrice) {
        return Number(product.salePrice);
      }
    }
    return Number(product.price);
  };

  // Calcular valores de oferta
  const hasActiveSale = isSaleActive(product);
  const isFlashSaleActive = hasActiveSale && product?.isFlashSale;
  const originalPrice = product ? Number(product.price) : 0;
  
  // Calcular preço atual e desconto - SEMPRE se houver oferta configurada
  let currentPrice = originalPrice;
  let flashDiscountPercent = 0;
  
  if (product?.isFlashSale) {
    // Oferta relâmpago configurada - SEMPRE calcular desconto para visualização
    // Se tem flashSalePrice, usar ele
    if (product.flashSalePrice !== undefined && product.flashSalePrice !== null) {
      currentPrice = Number(product.flashSalePrice);
      // Calcular percentual de desconto baseado no flashSalePrice
      if (currentPrice < originalPrice) {
        flashDiscountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      }
    }
    // Se tem flashSaleDiscountPercent, calcular preço
    else if (product.flashSaleDiscountPercent !== undefined && product.flashSaleDiscountPercent !== null && product.flashSaleDiscountPercent > 0) {
      flashDiscountPercent = product.flashSaleDiscountPercent;
      const discount = (originalPrice * flashDiscountPercent) / 100;
      currentPrice = originalPrice - discount;
    }
  } else if (hasActiveSale && product?.isOnSale) {
    // Oferta normal ativa
    currentPrice = getCurrentPrice(product);
  } else {
    // Nenhuma oferta - preço normal
    currentPrice = originalPrice;
  }
  
  // Sempre mostrar desconto se houver oferta relâmpago configurada
  const hasDiscount = product?.isFlashSale && flashDiscountPercent > 0 && currentPrice < originalPrice;

  const handleReviewAdded = () => {
    setReviewKey(prev => prev + 1);
    setShowReviewForm(false);
    // Recarregar dados do produto para atualizar rating
    if (productId) {
      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      fetch(`${apiBaseUrl}/public/products/${productId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
        .then(res => res.json())
        .then(data => {
          if (data.rating !== undefined) {
            setProduct(prev => prev ? { ...prev, rating: data.rating, reviewCount: data.reviewCount } : null);
          }
        })
        .catch(err => console.error('Erro ao atualizar rating:', err));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 page-with-fixed-header">
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
      <div className="min-h-screen bg-gray-50 page-with-fixed-header">
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
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-[#3e2626] hover:text-[#2d1a1a]">
                Início
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4 text-[#3e2626]" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/products" className="text-[#3e2626] hover:text-[#2d1a1a]">
                Produtos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4 text-[#3e2626]" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <span className="font-medium text-[#3e2626]">{product.name}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Conteúdo Principal - estilo marketplace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Galeria de Imagens */}
          <div className="lg:col-span-7 space-y-4">
            {/* Imagem Principal */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border-2 border-[#3e2626]/20 shadow-lg group">
              {productImages[selectedImageIndex] ? (
                <>
                  <Image
                    src={productImages[selectedImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  {/* Overlay marrom sutil na imagem */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3e2626]/5 via-[#3e2626]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {/* Borda marrom sutil no hover */}
                  <div className="absolute inset-0 border-2 border-[#3e2626]/0 group-hover:border-[#3e2626]/30 transition-all duration-300 rounded-2xl"></div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#3e2626]/5">
                  <Package className="h-24 w-24 text-[#3e2626]/30" />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product?.isFlashSale && hasDiscount && (
                  <Badge className="bg-yellow-500 text-white font-bold shadow-lg flex items-center gap-1 animate-pulse">
                    <Zap className="h-3 w-3 fill-white" />
                    {flashDiscountPercent > 0 ? `-${flashDiscountPercent}%` : 'Relâmpago'}
                  </Badge>
                )}
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#3e2626]/5 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border border-[#3e2626]/20"
                  >
                    <ChevronLeft className="h-5 w-5 text-[#3e2626]" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev + 1) % productImages.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#3e2626]/5 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border border-[#3e2626]/20"
                  >
                    <ChevronRight className="h-5 w-5 text-[#3e2626]" />
                  </button>
                </>
              )}

              {/* Indicador de zoom */}
              <div className="absolute bottom-4 right-4 bg-white/90 hover:bg-[#3e2626]/5 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border border-[#3e2626]/20">
                <Eye className="h-4 w-4 text-[#3e2626]" />
              </div>
            </div>

            {/* Miniaturas */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {productImages.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                        ? 'border-[#3e2626] ring-2 ring-[#3e2626]/20 bg-[#3e2626]/5'
                        : 'border-[#3e2626]/20 hover:border-[#3e2626]/40'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {selectedImageIndex === index && (
                      <div className="absolute inset-0 bg-[#3e2626]/5"></div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Descrição e Avaliações (lado esquerdo) */}
            <div className="space-y-5 pt-4 border-t border-[#3e2626]/20">
              {product.description && (
            <div className="bg-gradient-to-br from-white to-[#3e2626]/5 rounded-xl p-6 border border-[#3e2626]/10">
                  <h2 className="text-xl font-bold text-[#3e2626] mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#3e2626]" />
                    Descrição do Produto
                  </h2>
                <p className="text-gray-700 leading-relaxed mb-4">{product.description}</p>
                
                {/* Informações adicionais expandidas */}
                <div className="mt-4 space-y-3 pt-4 border-t border-[#3e2626]/10">
                  <h3 className="text-lg font-semibold text-[#3e2626] mb-3">Detalhes Adicionais</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.material && (
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3e2626] mt-2 flex-shrink-0"></div>
                        <div>
                          <span className="text-sm font-medium text-[#3e2626]">Material:</span>
                          <p className="text-sm text-gray-700">{product.material}</p>
                        </div>
                      </div>
                    )}
                    
                    {product.color && (
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3e2626] mt-2 flex-shrink-0"></div>
                        <div>
                          <span className="text-sm font-medium text-[#3e2626]">Cor:</span>
                          <p className="text-sm text-gray-700">{product.color}</p>
                        </div>
                      </div>
                    )}
                    
                    {product.style && (
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3e2626] mt-2 flex-shrink-0"></div>
                        <div>
                          <span className="text-sm font-medium text-[#3e2626]">Estilo:</span>
                          <p className="text-sm text-gray-700">{product.style}</p>
                        </div>
                      </div>
                    )}
                    
                    {product.brand && (
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3e2626] mt-2 flex-shrink-0"></div>
                        <div>
                          <span className="text-sm font-medium text-[#3e2626]">Marca:</span>
                          <p className="text-sm text-gray-700">{product.brand}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Texto descritivo adicional */}
                  <div className="mt-4 pt-4 border-t border-[#3e2626]/10">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Este produto foi cuidadosamente selecionado para oferecer qualidade e durabilidade. 
                      {product.material && ` Fabricado em ${product.material.toLowerCase()}, `}
                      {product.style && `com estilo ${product.style.toLowerCase()}, `}
                      este item combina funcionalidade e design para atender às suas necessidades.
                    </p>
                  </div>
                  
                  {/* Garantias e cuidados */}
                  <div className="mt-4 pt-4 border-t border-[#3e2626]/10">
                    <h4 className="text-sm font-semibold text-[#3e2626] mb-2">Garantias e Cuidados</h4>
                    <ul className="space-y-1.5 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#3e2626] mt-0.5 flex-shrink-0" />
                        <span>Produto com garantia de qualidade</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#3e2626] mt-0.5 flex-shrink-0" />
                        <span>Entrega rápida e segura</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#3e2626] mt-0.5 flex-shrink-0" />
                        <span>Suporte pós-venda especializado</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}



              <section className="mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7">
                    <div>
                      <h3 className="text-xl font-semibold text-[#3e2626] mb-3 flex items-center gap-2">
                        <Package className="h-5 w-5 text-[#3e2626]" />
                        Características
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.dimensions && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-[#3e2626]/5 rounded-xl border border-[#3e2626]/20 hover:border-[#3e2626]/30 transition-colors">
                            <div className="bg-[#3e2626]/10 rounded-lg p-2"><Ruler className="h-5 w-5 text-[#3e2626]" /></div>
                  <div>
                    <p className="text-xs text-[#3e2626] font-medium">Dimensões</p>
                    <p className="text-sm font-semibold text-[#3e2626]">{product.dimensions}</p>
                  </div>
                </div>
              )}
              {product.weight && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-[#3e2626]/5 rounded-xl border border-[#3e2626]/20 hover:border-[#3e2626]/30 transition-colors">
                            <div className="bg-[#3e2626]/10 rounded-lg p-2"><Weight className="h-5 w-5 text-[#3e2626]" /></div>
                  <div>
                    <p className="text-xs text-[#3e2626] font-medium">Peso</p>
                    <p className="text-sm font-semibold text-[#3e2626]">{product.weight}</p>
                  </div>
                </div>
              )}
              {product.material && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-[#3e2626]/5 rounded-xl border border-[#3e2626]/20 hover:border-[#3e2626]/30 transition-colors">
                            <div className="bg-[#3e2626]/10 rounded-lg p-2"><Package className="h-5 w-5 text-[#3e2626]" /></div>
                  <div>
                    <p className="text-xs text-[#3e2626] font-medium">Material</p>
                    <p className="text-sm font-semibold text-[#3e2626]">{product.material}</p>
                  </div>
                </div>
              )}
              {product.color && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-[#3e2626]/5 rounded-xl border border-[#3e2626]/20 hover:border-[#3e2626]/30 transition-colors">
                            <div className="bg-[#3e2626]/10 rounded-lg p-2"><Palette className="h-5 w-5 text-[#3e2626]" /></div>
                  <div>
                    <p className="text-xs text-[#3e2626] font-medium">Cor</p>
                    <p className="text-sm font-semibold text-[#3e2626]">{product.color}</p>
                  </div>
                </div>
              )}
              {product.storeName && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-[#3e2626]/5 rounded-xl border border-[#3e2626]/20 hover:border-[#3e2626]/30 transition-colors">
                  <div className="bg-[#3e2626]/10 rounded-lg p-2"><Store className="h-5 w-5 text-[#3e2626]" /></div>
                  <div>
                    <p className="text-xs text-[#3e2626] font-medium">Loja/Filial</p>
                    <p className="text-sm font-semibold text-[#3e2626]">{product.storeName}</p>
                    {product.storeAddress && (
                      <p className="text-xs text-[#3e2626]/70 mt-1">{product.storeAddress}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Seção de Avaliações */}
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-[#3e2626]">Avaliações e Comentários</h3>
                </div>

                {/* Resumo de Avaliações */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-white to-[#3e2626]/5 rounded-xl border border-[#3e2626]/20">
                  <div className="flex items-center gap-2">
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold text-[#3e2626]">
                      {rating > 0 ? rating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-[#3e2626] font-medium">
                    {reviews} {reviews === 1 ? 'avaliação' : 'avaliações'}
                  </span>
                </div>

                {/* Formulário de Avaliação */}
                {showReviewForm && (
                  <ReviewForm
                    productId={productId}
                    onSuccess={handleReviewAdded}
                    onCancel={() => setShowReviewForm(false)}
                  />
                )}

                {/* Lista de Avaliações */}
                <ProductReviews key={reviewKey} productId={productId} onReviewAdded={handleReviewAdded} />
              </div>
              </div>
            </div>

          {/* Sidebar de compra (fixa) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Categoria / Marca / Título e rating */}
            <div className="space-y-2 bg-gradient-to-br from-white to-[#3e2626]/5 rounded-xl p-4 border border-[#3e2626]/20">
              <div className="flex items-center gap-3 flex-wrap">
                {product.category && (
                  <Badge variant="outline" className="border-[#3e2626]/30 text-[#3e2626] bg-[#3e2626]/5">
                    {categoryNames[product.category.toUpperCase()] || product.category}
                  </Badge>
                )}
                {product.brand && (
                  <Badge variant="outline" className="border-[#3e2626]/30 text-[#3e2626] bg-[#3e2626]/5">{product.brand}</Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#3e2626] leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-base font-semibold text-[#3e2626]">{rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-[#3e2626]">({reviews} avaliações)</span>
              </div>
              {/* Informação da Loja */}
              {product.storeName && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#3e2626]/20">
                  <Store className="h-4 w-4 text-[#3e2626]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#3e2626]">Loja: {product.storeName}</span>
                    {product.storeAddress && (
                      <span className="text-xs text-[#3e2626]/70">{product.storeAddress}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:top-24">
              <Card className="border-2 border-[#3e2626]/20 shadow-sm bg-gradient-to-br from-white to-[#3e2626]/5">
                <CardContent className="p-6 space-y-6">
                  {/* Preço */}
                  <div className={`bg-gradient-to-br ${isFlashSaleActive ? 'from-yellow-50 to-yellow-100 border-yellow-300' : 'from-[#3e2626]/5 to-[#3e2626]/10 border-[#3e2626]/30'} rounded-2xl p-5 border-2`}>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-sm font-medium text-[#3e2626]">Por apenas</span>
                      <span className="text-4xl font-black text-[#3e2626]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentPrice)}
                      </span>
                    </div>
                    {/* Mostrar desconto se houver oferta relâmpago configurada */}
                    {hasDiscount && (
                      <>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span className="text-sm text-gray-500 line-through">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalPrice)}
                          </span>
                          <Badge className="bg-red-600 text-white text-xs font-bold shadow-sm">
                            -{flashDiscountPercent}% OFF
                          </Badge>
                        </div>

                        {product?.isFlashSale && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {/* Badge Oferta Relâmpago (similar ao da home) */}
                            <div className="relative overflow-hidden bg-gradient-to-r from-[#3e2626] to-[#2a1f1f] text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-[0_4px_12px_rgba(62,38,38,0.55)]">
                              <Zap className="h-3.5 w-3.5 fill-white animate-pulse" />
                              <span className="text-[11px] font-semibold tracking-wide uppercase">
                                Oferta Relâmpago
                              </span>
                            </div>

                            {/* Timer da oferta, baseado na data de término do produto */}
                            {flashSecondsLeft !== null && flashSecondsLeft > 0 && (
                              <div className="relative flex items-center gap-1 rounded-full bg-[#3e2626] text-white px-3 py-1.5 text-[11px] font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
                                <Clock className="h-3 w-3" />
                                <span className="tabular-nums">
                                  {formatFlashTime(flashSecondsLeft)}
                                </span>
                              </div>
                            )}

                            <span className="text-[11px] font-medium text-[#3e2626]/80">
                              Oferta exclusiva por tempo limitado neste produto.
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      Parcelamento em até 18x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentPrice / 18)} sem juros
                    </p>
                  </div>

                  {/* Quantidade */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#3e2626]">Quantidade:</span>
                <div className="flex items-center gap-2 border-2 border-[#3e2626]/30 rounded-xl bg-white">
                      <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="p-2 hover:bg-[#3e2626]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <Minus className="h-4 w-4 text-[#3e2626]" />
                  </button>
                      <span className="px-4 py-2 text-lg font-semibold text-[#3e2626] min-w-[3rem] text-center">{quantity}</span>
                      <button onClick={() => handleQuantityChange(1)} className="p-2 hover:bg-[#3e2626]/5 transition-colors">
                    <Plus className="h-4 w-4 text-[#3e2626]" />
                  </button>
                </div>
              </div>

                  {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3">
                    <Button id="add-to-cart-btn" onClick={handleAddToCart} className="flex-1 bg-[#3e2626] hover:bg-[#2d1a1a] text-white cursor-pointer h-12 text-base font-semibold shadow-md">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Adicionar ao Carrinho
                </Button>
                    <Button onClick={handleBuyNow} variant="outline" className="h-12 px-6 border-2 border-[#3e2626]/40 hover:border-[#3e2626] hover:bg-[#3e2626]/5 text-[#3e2626]">Comprar agora</Button>
                    <Button variant="outline" onClick={handleToggleFavorite} className="h-12 px-4 border-2 border-[#3e2626]/30 hover:border-[#3e2626]/40 hover:bg-[#3e2626]/5">
                      <Heart className={`${isFavorite ? 'fill-red-500 text-red-500' : 'text-[#3e2626]'} h-5 w-5`} />
                </Button>
              </div>

                  <Separator />

                  {/* Frete / CEP */}
                  <div className="space-y-2 bg-[#3e2626]/5 rounded-lg p-3 border border-[#3e2626]/20">
                    <div className="flex items-center gap-2 text-sm text-[#3e2626]">
                      <MapPin className="h-4 w-4 text-[#3e2626]" />
                      <span>Informe seu CEP para calcular o frete</span>
                    </div>
                    <div className="flex gap-2">
                      <Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" className="h-10 border-[#3e2626]/30 focus:border-[#3e2626]" />
                      <Button onClick={handleCalcShipping} variant="outline" className="h-10 px-4 border-[#3e2626]/40 text-[#3e2626] hover:bg-[#3e2626]/10">Calcular</Button>
                    </div>
                    {shippingInfo && (
                      <p className="text-sm text-[#3e2626] flex items-center gap-2"><Truck className="h-4 w-4 text-[#3e2626]" /> {shippingInfo}</p>
                    )}
            </div>

                  {/* Disponibilidade */}
                  <div className="flex items-center justify-between p-3 rounded-xl border-2 border-[#3e2626]/20 bg-gradient-to-br from-white to-[#3e2626]/5">
                    <div>
                      <p className="text-sm text-[#3e2626] font-medium">Estoque disponível</p>
                      <p className={`${(product.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'} text-base font-bold`}>
                        {(product.stock || 0) > 0 ? `${product.stock} unidades` : 'Esgotado'}
                      </p>
              </div>
                    {(product.stock || 0) > 0 && <CheckCircle2 className="h-6 w-6 text-green-600" />}
              </div>

                  {/* Pagamentos e Garantias */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#3e2626]/20">
                    <div className="flex items-center gap-2 text-sm text-[#3e2626] bg-[#3e2626]/5 p-2 rounded-lg"><CreditCard className="h-4 w-4 text-[#3e2626]" /><span>Cartão em até 18x</span></div>
                    <div className="flex items-center gap-2 text-sm text-[#3e2626] bg-[#3e2626]/5 p-2 rounded-lg"><Zap className="h-4 w-4 text-[#3e2626]" /><span>Pix com desconto</span></div>
                    <div className="flex items-center gap-2 text-sm text-[#3e2626] bg-[#3e2626]/5 p-2 rounded-lg"><Shield className="h-4 w-4 text-[#3e2626]" /><span>Compra garantida</span></div>
              </div>
                </CardContent>
              </Card>
        </div>

            {/* Produtos Relacionados (coluna direita em lista) */}
        {relatedProducts.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-xl font-semibold text-gray-900">Produtos Relacionados</h3>
                <div className="flex flex-col gap-4">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard
                      key={relatedProduct.id}
                      product={relatedProduct}
                      variant="compact"
                      showFavorite={true}
                      showAddToCart={false}
                    />
                  ))}
                </div>
            </div>
        )}

            {/* Meios de Pagamento */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Meios de pagamento</h3>
              
              {/* Botão de destaque */}
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 mb-4 rounded-lg flex items-center justify-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pague em até 21x sem juros!
              </Button>

              <div className="space-y-4">
                {/* Linha de Crédito */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Linha de Crédito</h4>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700">Crédito disponível</span>
                  </div>
                </div>

                {/* Cartões de crédito */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Cartões de crédito</h4>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="h-8 w-auto flex items-center justify-center">
                      <img 
                        src="https://down-br.img.susercontent.com/file/a65c5d1c5e556c6197f8fbd607482372" 
                        alt="Visa" 
                        className="h-6 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="h-8 w-auto flex items-center justify-center">
                      <img 
                        src="https://down-br.img.susercontent.com/file/95d849253f75d5e6e6b867af4f7c65aa" 
                        alt="Mastercard" 
                        className="h-6 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="h-8 w-auto flex items-center justify-center">
                      <img 
                        src="https://down-br.img.susercontent.com/file/br-11134258-7r98o-lxsovyseln7jc5" 
                        alt="Elo" 
                        className="h-6 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="h-8 w-auto flex items-center justify-center">
                      <img 
                        src="https://down-br.img.susercontent.com/file/285e5ab6207eb562a9e893a42ff7ee46 " 
                        alt="American Express" 
                        className="h-6 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pix */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Pix</h4>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 flex items-center justify-center">
                      <img 
                        src="https://down-br.img.susercontent.com/file/2a2cfeb34b00ef7b3be23ea516dcd1c5" 
                        alt="PIX" 
                        className="h-8 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Boleto bancário */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Boleto bancário</h4>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 flex items-center justify-center">
                      <img 
                        src="https://down-br.img.susercontent.com/file/44734b7fc343eb46237c2d90c6c9ca60" 
                        alt="Boleto" 
                        className="h-8 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>

          
              </div>
            </div>
          </div>
        </div>

        {/* Características */}

      </main>

      <Footer />
    </div>
  );
}

