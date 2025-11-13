'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useProducts } from '@/lib/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import PromotionalSection from '@/components/PromotionalSection';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { BackendStatus } from '@/components/BackendStatus';
import FavoriteTooltip from '@/components/FavoriteTooltip';
import { 
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Star,
  Truck,
  Shield,
  CreditCard,
  Tag,
  ArrowRight,
  ArrowLeft,
  Play,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Sparkles,
  Palette,
  Camera,
  Home,
  Paintbrush,
  Wand2,
  Users,
  Table,
  Plus,
  Minus,
  Filter,
  Grid,
  List,
  LogOut,
  ChevronDown,
  Upload,
  Eye,
  Download,
  Award,
  Zap,
  Target,
  Lightbulb,
  Brush,
  Droplets,
  Layers,
  Scissors,
  Sofa,
  Lamp,
  BookOpen,
  Package,
  Archive,
  Frame
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAppStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [searchOpening, setSearchOpening] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [specialOfferProduct, setSpecialOfferProduct] = useState<any | null>(null);
  const OFFER_DURATION = 30; // segundos por produto (fase de desenvolvimento)
  const [offerSecondsLeft, setOfferSecondsLeft] = useState(OFFER_DURATION);

  // Buscar produtos do banco de dados
  const { products: allProducts, loading: productsLoading, error: productsError } = useProducts();

  // Redirecionar usuários logados com roles específicos para seus dashboards
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.role?.toUpperCase();
      
      if (userRole === 'ADMIN') {
        router.replace('/admin');
        return;
      }
      
      if (userRole === 'STORE_MANAGER') {
        router.replace('/manager');
        return;
      }
      
      if (userRole === 'EMPLOYEE' || userRole === 'CASHIER') {
        router.replace('/employee');
        return;
      }
    }
  }, [isAuthenticated, user, router]);

  // Função auxiliar para renderizar ícones
  const renderIcon = (IconComponent: any, className: string) => {
    return <IconComponent className={className} />;
  };

  // Função para alternar favorito
  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Função para adicionar ao carrinho
  const addToCart = async (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      try {
        // Adicionar ao store local (sempre funciona)
        useAppStore.getState().addToCart(product, 1);
        setCartItems(prev => [...prev, productId]);
        
        // Se estiver autenticado, também adicionar ao backend
        if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
          try {
            const { customerAPI } = await import('@/lib/api');
            await customerAPI.addToCart(product.id, 1);
            // Disparar evento para atualizar notificações imediatamente
            window.dispatchEvent(new CustomEvent('notification:cart-added'));
          } catch (apiError) {
            console.error('Erro ao adicionar ao carrinho no backend:', apiError);
            // Mesmo com erro na API, o item já está no store local
          }
        }
        
        // Mostrar mensagem de sucesso
        const { toast } = await import('sonner');
        toast.success('Produto adicionado ao carrinho!', {
          description: product.name,
          duration: 3000,
        });
      } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        const { toast } = await import('sonner');
        toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
      }
    }
  };

  // Função para ir para página de favoritos
  const goToFavorites = () => {
    router.push('/favorites');
  };

  // Função para abrir dropdown do usuário
  const handleUserClick = () => {
    if (isAuthenticated) {
      setUserDropdownOpen(!userDropdownOpen);
    } else {
      router.push('/login');
    }
  };

  // Função para abrir carrinho
  const handleCartClick = () => {
    if (cartItems.length > 0) {
      alert(`Você tem ${cartItems.length} item(s) no carrinho`);
      // Aqui você pode implementar lógica para mostrar modal do carrinho ou redirecionar
    } else {
      alert('Seu carrinho está vazio. Adicione alguns produtos!');
    }
  };

  // Função para logout
  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    router.push('/');
  };

  // Função para abrir search com animação
  const handleOpenSearch = () => {
    setSearchOpening(true);
    setSearchOpen(true);
    setTimeout(() => {
      setSearchOpening(false);
    }, 300);
  };

  // Função para fechar search com animação
  const handleCloseSearch = () => {
    setSearchClosing(true);
    setTimeout(() => {
      setSearchOpen(false);
      setSearchClosing(false);
    }, 200);
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-dropdown-container')) {
          setUserDropdownOpen(false);
        }
      }
      if (searchOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.search-icon-container')) {
          handleCloseSearch();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen, searchOpen]);

  // Categorias baseadas no banco de dados
  const categories = [
    { 
      id: 'SOFA', 
      name: 'Sofás', 
      icon: Sofa, 
      count: 45,
      description: 'Sofás confortáveis para sua sala',
      gradient: 'from-[#8B4513] to-[#D2691E]'
    },
    { 
      id: 'MESA', 
      name: 'Mesas', 
      icon: Table, 
      count: 32,
      description: 'Mesas elegantes para qualquer ambiente',
      gradient: 'from-[#3e2626] to-[#8B4513]'
    },
    { 
      id: 'CADEIRA', 
      name: 'Cadeiras', 
      icon: Users, 
      count: 28,
      description: 'Cadeiras ergonômicas e estilosas',
      gradient: 'from-[#A0522D] to-[#CD853F]'
    },
    { 
      id: 'ARMARIO', 
      name: 'Armários', 
      icon: Archive, 
      count: 18,
      description: 'Armários organizadores modernos',
      gradient: 'from-[#654321] to-[#8B4513]'
    },
    { 
      id: 'ESTANTE', 
      name: 'Estantes', 
      icon: BookOpen, 
      count: 22,
      description: 'Estantes funcionais e decorativas',
      gradient: 'from-[#2F4F4F] to-[#708090]'
    },
    { 
      id: 'POLTRONA', 
      name: 'Poltronas', 
      icon: Sofa, 
      count: 15,
      description: 'Poltronas de luxo para relaxar',
      gradient: 'from-[#8B0000] to-[#DC143C]'
    },
    { 
      id: 'QUADRO', 
      name: 'Quadros', 
      icon: Frame, 
      count: 35,
      description: 'Quadros decorativos únicos',
      gradient: 'from-[#4B0082] to-[#9370DB]'
    },
    { 
      id: 'LUMINARIA', 
      name: 'Luminárias', 
      icon: Lamp, 
      count: 25,
      description: 'Iluminação perfeita para seu espaço',
      gradient: 'from-[#FFD700] to-[#FFA500]'
    },
    { 
      id: 'MESA_CENTRO', 
      name: 'Mesa de centro', 
      icon: Package, 
      count: 12,
      description: 'Produtos especiais e exclusivos',
      gradient: 'from-[#696969] to-[#A9A9A9]'
    },
  ];

  // Imagens de fundo por categoria (pasta public/MobiliAI_MóveisCategoria)
  const categoryBackgrounds: Record<string, string> = {
    'SOFA': '/MobiliAI_MóveisCategoria/25.png',
    'MESA': '/MobiliAI_MóveisCategoria/54.png',
    'CADEIRA': '/MobiliAI_MóveisCategoria/103.png',
    'ARMARIO': '/MobiliAI_MóveisCategoria/82.png',
    'ESTANTE': '/MobiliAI_MóveisCategoria/139.png',
    'POLTRONA': '/MobiliAI_MóveisCategoria/8.png',
    'QUADRO': '/MobiliAI_MóveisCategoria/122.png',
    'LUMINARIA': '/MobiliAI_MóveisCategoria/82.png',
    // Fallback temporário para mesa de centro
    'MESA_CENTRO': '/MobiliAI_MóveisCategoria/69.png',
  };
  // Mapear categorias do banco para categorias de exibição
  // Mapeamento de categorias para nomes amigáveis
  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'sofa': 'Sofá',
      'mesa': 'Mesa',
      'cadeira': 'Cadeira',
      'estante': 'Estante',
      'poltrona': 'Poltrona',
      'quadro': 'Quadro',
      'luminaria': 'Luminária',
      'mesa_centro': 'Mesa de centro'
    };
    return categoryMap[category?.toLowerCase()] || category;
  };

  // Categorias disponíveis baseadas nos produtos
  const availableCategories = useMemo(() => {
    const categories = new Set(allProducts.map(p => p.category?.toLowerCase()).filter(Boolean));
    return Array.from(categories).sort();
  }, [allProducts]);

  // Adicionar propriedades extras para exibição
  const enhancedProducts = allProducts.map(product => ({
    ...product,
    categoryDisplayName: getCategoryDisplayName(product.category),
    rating: product.rating || 0, // Usar rating real do banco
    reviews: product.reviewCount || 0, // Usar reviewCount real do banco
    badge: product.isNew ? 'Novo' : product.isBestSeller ? 'Mais Vendido' : product.isFeatured ? 'Destaque' : null,
    originalPrice: undefined as number | undefined // Remover preços originais simulados
  }));

  // Filtrar produtos baseado na categoria selecionada
  const filteredProducts = selectedCategory === 'Todos' 
    ? enhancedProducts 
    : enhancedProducts.filter(product => product.category?.toLowerCase() === selectedCategory.toLowerCase());

  // Configurações de paginação
  const productsPerPage = 8;
  const maxPages = 3;
  const totalFilteredProducts = filteredProducts.length;
  const totalPages = Math.min(Math.ceil(totalFilteredProducts / productsPerPage), maxPages);
  
  // Produtos da página atual
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const featuredProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset página quando categoria muda
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  // Seleciona produto aleatório para oferta especial
  const pickRandomProduct = () => {
    if (!allProducts || allProducts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * allProducts.length);
    return allProducts[randomIndex];
  };

  // Inicializa oferta e cronômetro quando produtos carregarem
  useEffect(() => {
    if (allProducts && allProducts.length > 0 && !specialOfferProduct) {
      const product = pickRandomProduct();
      setSpecialOfferProduct(product);
      setOfferSecondsLeft(OFFER_DURATION);
    }
  }, [allProducts]);

  // Cronômetro da oferta
  useEffect(() => {
    if (!specialOfferProduct) return;
    const intervalId = setInterval(() => {
      setOfferSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextProduct = pickRandomProduct();
          setSpecialOfferProduct(nextProduct);
          return OFFER_DURATION; // reinicia
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [specialOfferProduct]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const testimonials = [
    {
      id: 1,
      name: 'Maria Silva',
      rating: 5,
      text: 'A IA de visualização de móveis é incrível! Consegui ver exatamente como ficaria na minha sala antes de comprar.',
      avatar: '/placeholder-avatar1.jpg'
    },
    {
      id: 2,
      name: 'João Santos',
      rating: 5,
      text: 'Qualidade excelente e atendimento perfeito. A visualização com IA me ajudou muito na escolha dos móveis.',
      avatar: '/placeholder-avatar2.jpg'
    },
    {
      id: 3,
      name: 'Ana Costa',
      rating: 5,
      text: 'Produtos de alta qualidade e a tecnologia de IA é revolucionária. Recomendo!',
      avatar: '/placeholder-avatar3.jpg'
    }
  ];

  const features = [
    {
      icon: Camera,
      title: 'Visualização com IA',
      description: 'Tire uma foto e veja como os móveis ficam no seu ambiente'
    },
    {
      icon: Palette,
      title: 'Decoração Inteligente',
      description: 'Sugestões de móveis harmoniosos baseadas em IA'
    },
    {
      icon: Zap,
      title: 'Resultado Instantâneo',
      description: 'Visualização em tempo real em segundos'
    },
    {
      icon: Award,
      title: 'Qualidade Garantida',
      description: 'Móveis premium com garantia de satisfação'
    }
  ];

  const boutiqueHighlights = [
    {
      icon: Wand2,
      title: 'Curadoria Personalizada',
      description: 'Cada projeto é desenvolvido através de conversas profundas sobre suas referências afetivas e estilo de vida.',
      badge: 'PROCESSO AUTORAL'
    },
    {
      icon: Layers,
      title: 'Renderização em Tempo Real',
      description: 'Visualize seu ambiente transformado com ajustes de iluminação natural e texturas reais antes da produção.',
      badge: 'TECNOLOGIA AVANÇADA'
    },
    {
      icon: Palette,
      title: 'Paletas Exclusivas',
      description: 'Desenvolvidas em parceria com artistas convidados, utilizando dados precisos de iluminação do seu espaço.',
      badge: 'ARTE APLICADA'
    },
    {
      icon: Brush,
      title: 'Aprovação Tátil',
      description: 'Receba amostras físicas de texturas e materiais para aprovação antes da produção final do seu projeto.',
      badge: 'QUALIDADE PREMIUM'
    }
  ];

  // Carousel (Right Side - AI Section)
  const slides = [
    {
      id: 1,
      number: '01',
      title: 'Sala de Estar',
      subtitle: 'Design Moderno',
      image: '/IAsection/ImagemIA1.png',
      largeGradient: 'from-teal-600 to-teal-700',
      smallGradient: 'from-rose-100 to-rose-200',
      accentColor: '#2dd4bf', // teal-400
    },
    {
      id: 2,
      number: '02',
      title: 'Sala de Estar',
      subtitle: 'Elegância Contemporânea',
      image: '/IAsection/ImagemIA2.png',
      largeGradient: 'from-rose-400 to-rose-500',
      smallGradient: 'from-blue-200 to-blue-300',
      accentColor: '#f472b6', // pink-400
    },
    {
      id: 3,
      number: '03',
      title: 'Escritório Executivo',
      subtitle: 'Luxo e Sofisticação',
      image: '/IAsection/ImagemIA3.png',
      largeGradient: 'from-blue-500 to-blue-600',
      smallGradient: 'from-amber-200 to-amber-300',
      accentColor: '#3b82f6', // blue-500
    },
    {
      id: 4,
      number: '04',
      title: 'Sala de Jantar',
      subtitle: 'Momento em Família',
      image: '/IAsection/ImagemIA4.png',
      largeGradient: 'from-amber-600 to-amber-700',
      smallGradient: 'from-lime-100 to-lime-200',
      accentColor: '#f59e0b', // amber-400
    },
  ];

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');

  const goNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationDirection('right');
    setTimeout(() => {
      setCarouselIndex((i) => (i + 1) % slides.length);
      setTimeout(() => setIsAnimating(false), 150);
    }, 400);
  };
  const goPrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationDirection('left');
    setTimeout(() => {
      setCarouselIndex((i) => (i - 1 + slides.length) % slides.length);
      setTimeout(() => setIsAnimating(false), 150);
    }, 400);
  };


  const getVisibleIndex = (offset: number) => (carouselIndex + offset) % slides.length;

  const renderSlide = (slide: any, position: number) => {
    const isLarge = position === 0; // mantém o layout: primeiro card maior, demais quadrados
    if (isLarge) {
      return (
        <div className="w-full md:w-[400px] flex-shrink-0 relative">
          <div className={`aspect-[6/9] rounded-2xl shadow-xl relative overflow-hidden`}>
            {/* Imagem de fundo */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            ></div>
            {/* Overlay gradiente para melhor legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {/* overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
              <div className="text-white">
                <div className="text-sm text-white/70 mb-1">{slide.number}</div>
                <div className="text-lg font-bold mb-1">{slide.title}</div>
                <div className="text-sm text-white/80">{slide.subtitle}</div>
              </div>
            </div>
           
          </div>
        </div>
      );
    }

  // small card (quadrado)
  return (
    <div className="w-full md:w-[350px] flex-shrink-0 relative">
      <div className={`aspect-[4/5] rounded-2xl shadow-xl relative overflow-hidden`}>
        {/* Imagem de fundo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${slide.image})` }}
        ></div>
        {/* Overlay gradiente para melhor legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
          <div className="text-white">
            <div className="text-sm text-white/70 mb-1">{slide.number}</div>
            <div className="text-lg font-bold mb-1">{slide.title}</div>
            <div className="text-sm text-white/80">{slide.subtitle}</div>
          </div>
        </div>
      </div>
      
      {/* Navigation Below Card 2 */}
      {position === 1 && (
        <div className="flex items-center justify-between mt-4">
          {/* Dots */}
          <div className="flex space-x-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Ir para slide ${idx + 1}`}
                onClick={() => setCarouselIndex(idx)}
                className={`${idx === carouselIndex ? 'w-3 h-3 bg-[#3e2626]' : 'w-2 h-2 bg-gray-300'} rounded-full transition-all`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex space-x-2">
            <button 
              onClick={goPrev} 
              disabled={isAnimating}
              className="w-8 h-8 bg-gray-200 hover:bg-[#3e2626] hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
            </button>
            <button 
              onClick={goNext} 
              disabled={isAnimating}
              className="w-8 h-8 bg-[#3e2626] text-white hover:bg-[#2a1f1f] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
  };

  // Estado para controlar se a oferta relâmpago está ativa (será controlado pelo admin)
  const [flashOfferActive, setFlashOfferActive] = useState(true); // Por padrão ativa, mas pode ser controlado pelo admin

  return (
    <div className="min-h-screen ">
      {/* Main Hero Section - Layout com foto escura e texto à esquerda */}
      <div className="relative min-h-screen  flex items-center">
        {/* Background Image com grayscale e escurecido */}
        <div 
          className="absolute  inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url(/hero-bg.png)',
            filter: 'grayscale(100%) brightness(0.7)',
            WebkitFilter: 'grayscale(100%) brightness(0.6)'
          }}
        ></div>
        
        {/* Overlay adicional para escurecer mais */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Header */}
        <Header />

        {/* Content Container */}
        <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh]">
            
            {/* LADO ESQUERDO - Texto */}
            <div className="text-white space-y-8">
              {/* Badge/Status */}
              <div className="flex items-center gap-4 mb-6">
              
              </div>

              {/* Título Principal */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-wide">
                <span className="block text-white/95">
                  Atmosferas autorais criadas com
                </span>
                <span className="block mt-2 font-normal text-white">
                  precisão cromática.
                </span>
              </h1>

              {/* Descrição */}
              <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
                A MobiliAI combina curadoria humana e machine learning proprietário para transformar fotos do seu ambiente em um roteiro visual completo, com texturas, paletas e mobiliário já prontos para o uso.
              </p>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => router.push('/products')}
                  className="bg-white text-[#3e2626] hover:bg-white/90 rounded-full px-8 py-6 text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  EXPLORAR VISUALIZAÇÃO
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6 text-base font-semibold backdrop-blur-sm transition-all duration-300"
                >
                  SAIBA MAIS
                </Button>
              </div>

              
            </div>

            {/* LADO DIREITO - Oferta Relâmpago (Condicional) */}
            {flashOfferActive && specialOfferProduct && (
              <div className="relative group w-full">
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-4 md:p-5 shadow-2xl border-2 border-white/30 overflow-hidden">
                  {/* Padrão decorativo sutil de fundo */}
                  <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #3e2626 1px, transparent 0)`,
                    backgroundSize: '16px 16px'
                  }}></div>
                  
                  {/* Badge Oferta Relâmpago */}
                  <div className="relative z-10 flex items-center gap-2 mb-4">
                    <div className="relative overflow-hidden bg-[#3e2626] text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                      <Zap className="h-3.5 w-3.5 fill-white" />
                      <span className="text-xs font-light tracking-wide">Oferta Relâmpago</span>
                    </div>
                    <div className="bg-red-500 text-white rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-bold tabular-nums">{formatTime(offerSecondsLeft)}</span>
                    </div>
                  </div>

                  {/* Layout: Imagem à esquerda, Conteúdo à direita */}
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Imagem do Produto - Formato Quadrado à Esquerda */}
                    {specialOfferProduct.imageUrl && (
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 group/image">
                        <Image
                          src={specialOfferProduct.imageUrl}
                          alt={specialOfferProduct.name}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                          unoptimized
                        />
                        
                        {/* Badge de Desconto */}
                        <div className="absolute top-3 right-3 bg-[#3e2626] text-white rounded-lg px-3 py-2 shadow-xl">
                          <div className="text-xl font-black leading-none">30%</div>
                          <div className="text-[8px] font-bold uppercase tracking-wider">OFF</div>
                        </div>
                      </div>
                    )}

                    {/* Informações do Produto - À Direita */}
                    <div className="flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-base md:text-lg font-light text-white leading-tight tracking-[0.08em] mb-2">
                          {specialOfferProduct.name}
                        </h3>
                        
                        {/* Preço */}
                        <div className="space-y-1">
                          <div className="text-xs text-white/70 font-light">Por apenas</div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-light text-white">R$</span>
                            <span className="text-2xl md:text-3xl font-light text-white tracking-tight">
                              {(specialOfferProduct.price ? specialOfferProduct.price * 0.7 : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {specialOfferProduct.price && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-white/60 line-through font-light">
                                R$ {specialOfferProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] bg-red-500/20 text-red-200 px-2 py-0.5 rounded-full font-light border border-red-500/30">
                                Economize R$ {(specialOfferProduct.price * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Botão de Ação */}
                        <Button 
                          onClick={() => addToCart(specialOfferProduct.id)}
                          className="relative w-full bg-white text-[#3e2626] hover:bg-white/90 rounded-full px-6 py-3 text-sm font-light tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Adicionar ao Carrinho
                          </span>
                        </Button>
                        
                        {/* Garantia */}
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/60 font-light">
                          <Shield className="h-3 w-3" />
                          <span>Compra segura e garantida</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

     

      {/* Categories Section */}
      <section id="categories-anchor" className="pt-20 md:pt-24 pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto  mt-10">
         

          {/* Grid Layout Customizado - 6 colunas x 5 linhas */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 h-[800px]">
            
            {/* Sofá - 3x2 (colunas 1-3, linhas 1-2) */}
            <Link href={`/products?category=${categories[0].id}`} className="md:col-span-3 md:row-span-2">
              <div className="group relative h-full bg-gradient-to-br from-[#3e2626] via-[#8B4513] to-[#A0522D] rounded-3xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02]">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-bottom scale-[1.79]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[0].id]})` }}
                ></div>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 30px 30px, rgba(255,255,255,0.05) 2px, transparent 2px)`,
                    backgroundSize: '60px 60px'
                  }}></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Conteúdo Principal */}
                <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-block px-4 py-2 rounded-lg backdrop-blur-[1px] bg-white/10">
                      <h3 className="text-4xl md:text-5xl font-light text-black mb-2 leading-tight tracking-[0.08em]">
                        {categories[0].name}
                      </h3>
                      <p className="text-sm text-black font-light tracking-[0.02em]">
                        {categories[0].description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Efeito de brilho animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
              </div>
            </Link>

            {/* Poltrona - 2x2 (colunas 4-5, linhas 1-2) */}
            <Link href={`/products?category=${categories[5].id}`} className="md:col-span-2 md:row-span-2">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[1.4]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[5].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[5].gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-6 h-full flex flex-col justify-start">
                  <div>
                    <div className="inline-block px-4 py-2 rounded-lg backdrop-blur-[1px] bg-white/10">
                      <h4 className="text-2xl md:text-3xl font-light text-black mb-2 leading-tight tracking-[0.08em]">
                        {categories[5].name}
                      </h4>
                      <p className="text-sm text-black  tracking-[0.02em]">
                        {categories[5].description}
                      </p>
                    </div>
                  </div>
                </div>

                 {/* Efeito de brilho animado */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/20 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Cadeiras - 1x2 (coluna 6, linhas 1-2) */}
            <Link href={`/products?category=${categories[2].id}`} className="md:col-span-1 md:row-span-2">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[1]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[2].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[2].gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-4 h-full flex flex-col justify-end items-center">
                  <div className="text-center">
                    <div className="inline-block px-4 py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-lg md:text-xl font-light text-black mb-2 leading-tight tracking-[0.08em]">
                        {categories[2].name}
                      </h4>
                      <p className="text-xs text-black  tracking-[0.02em]">
                        {categories[2].description}
                      </p>
                    </div>
                  </div>
                </div>
                 {/* Efeito de brilho animado */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/15 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Mesa - 2x2 (colunas 1-2, linhas 3-4) */}
            <Link href={`/products?category=${categories[1].id}`} className="md:col-span-2 md:row-span-2">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[1.36]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[1].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[1].gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-6 h-full flex flex-col justify-start">
                  <div>
                    <div className="inline-block px-4 py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-2xl md:text-3xl font-light text-black mb-2 leading-tight tracking-[0.08em]">
                        {categories[1].name}
                      </h4>
                      <p className="text-xs text-black font-light tracking-[0.02em]">
                        {categories[1].description}
                      </p>
                    </div>
                  </div>
                </div>
                 {/* Efeito de brilho animado */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/20 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Estante - 2x1 (colunas 3-4, linha 3) */}
            <Link href={`/products?category=${categories[4].id}`} className="md:col-span-2 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-bottom scale-[1.85]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[4].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[4].gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                  <div className="text-left">
                    <div className="inline-block px-4 py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-lg md:text-xl font-light text-black mb-2 leading-tight tracking-[0.08em]">
                        {categories[4].name}
                      </h4>
                      <p className="text-xs text-black font-light tracking-[0.02em]">
                        {categories[4].description}
                      </p>
                    </div>
                  </div>
                </div>

                 {/* Efeito de brilho animado */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/15 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Quadro - 2x1 (coluna 6, linha 3) */}
            <Link href={`/products?category=${categories[6].id}`} className="md:col-span-2 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[1.8]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[6].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[6].gradient} opacity-5 group-hover:opacity-8 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                  <div className="text-left">
                    <div className="inline-block px-4 py-2 rounded-lg backdrop-blur-[1px] bg-white/10">
                      <h4 className="text-lg md:text-xl font-light text-black mb-2 leading-tight tracking-[0.08em]">
                        {categories[6].name}
                      </h4>
                      <p className="text-xs text-black font-light tracking-[0.02em]">
                        {categories[6].description}
                      </p>
                    </div>
                  </div>
                </div>

                 {/* Efeito de brilho animado */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/10 rounded-xl transition-all duration-300"></div>
              </div>
            </Link>

           

            {/* Luminária - 2x1 (colunas 3-4, linha 4) */}
            <Link href={`/products?category=${categories[7].id}`} className="md:col-span-2 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-bottom scale-[1.8]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[7].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[7].gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                  <div className="text-left">
                    <div className="inline-block px-4 py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-lg md:text-xl font-light text-black mb-2 leading-tight tracking-[0.08em]">
                        {categories[7].name}
                      </h4>
                      <p className="text-xs text-black font-light tracking-[0.02em]">
                        {categories[7].description}
                      </p>
                    </div>
                  </div>
                </div>

                 {/* Efeito de brilho animado */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/15 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Mesa de centro - 1x1 (coluna 6, linha 4) */}
            <Link href={`/products?category=${categories[8].id}`} className="md:col-span-1 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[1.4]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[8].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[8].gradient} opacity-5 group-hover:opacity-8 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-3 h-full flex flex-col justify-end items-center">
                  <div className="text-center">
                    <div className="inline-block px-4 py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-base md:text-lg font-light text-black mb-2 leading-tight tracking-[0.08em]">
                        {categories[8].name}
                      </h4>
                      <p className="text-xs text-black font-light tracking-[0.02em]">
                        {categories[8].description}
                      </p>
                    </div>
                  </div>
                </div>

                 {/* Efeito de brilho animado */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/10 rounded-xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Card "Ver Todos os Produtos" - 1x1 (coluna 6, linha 5) */}
            <Link href="/products" className="md:col-span-1 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-[#3e2626] to-[#2a1f1f] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-[#3e2626]/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
                
                <div className="relative z-10 h-full flex items-center justify-center">
                  <ArrowRight className="h-8 w-8 text-white group-hover:translate-x-2 transition-all duration-300 group-hover:scale-110" />
                </div>
                
                 {/* Efeito de brilho animado */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-xl transition-all duration-300"></div>
              </div>
            </Link>

          </div>
        </div>
      </section>

     

      {/* AI Section */}
      <section className="py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto gap-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center ">
            {/* Left Side - Text Content */}
            <div className="lg:col-span-1 space-y-8 ">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-[#3e2626] mb-6 leading-tight">
                  <span className="block">Nossa IA</span>
                  <span className="block">Inovadora</span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transforme qualquer ambiente com nossa inteligência artificial que visualiza cores e móveis em tempo real
                </p>
              </div>
              
              <button className="group bg-[#3e2626] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#2a1f1f] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-3">
                <span>Experimentar IA</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>

            {/* Right Side - Carousel */}
            <div className="lg:col-span-2 ">
              <div className="relative">
                <div className="relative overflow-hidden ">
                  <div 
                    className="flex space-x-4 items-start transition-all duration-700 ease-in-out"
                    style={{
                      transform: `translateX(${isAnimating ? (animationDirection === 'right' ? '-30px' : '30px') : '0px'})` 
                    }}
                  >
                    {([0,1,2] as const).map((offset) => {
                      const isActive = offset === 0;
                      const slideData = slides[getVisibleIndex(offset)];
                      
                      return (
                        <div
                          key={`${carouselIndex}-${offset}`}
                          className={`flex-shrink-0 transition-all duration-300 ease-out ${
                            isActive 
                              ? 'opacity-100 scale-100 transform translate-y-0' 
                              : 'opacity-80 scale-95 transform translate-y-1'
                          }`}
                          style={{
                            transitionDelay: `${offset * 100}ms`
                          }}
                        >
                          {renderSlide(slideData, offset)}
                        </div>
                      );
                    })}
                  </div>
                        
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Experiência Boutique Section */}
      <section className="relative overflow-hidden bg-[#3e2626] py-28 text-white">
       
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-5">
            <div className="space-y-8 lg:col-span-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white bg-[#3e2626] backdrop-blur-sm px-6 py-2 text-xs font-light uppercase tracking-[0.4em] text-white">
                experiência boutique
              </span>
              <h2 className="text-3xl md:text-5xl font-light leading-tight tracking-[0.08em] text-white">
                Curadoria feita à mão para ambientes que contam histórias únicas.
              </h2>
              <p className="text-lg leading-relaxed text-white/80 font-light tracking-[0.02em]">
                Unimos leitura sensorial, inteligência artificial e olhar autoral para transformar fotografias reais em cenas que você consegue sentir. Cada projeto nasce de conversas profundas, referências afetivas e uma seleção criteriosa de materiais.
              </p>
              <div className="space-y-4 text-sm text-white/70 font-light">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="leading-relaxed">Paletas desenvolvidas com artistas convidados e dados de iluminação do ambiente.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Brush className="h-5 w-5 text-white" />
                  </div>
                  <span className="leading-relaxed">Texturas físicas enviadas para aprovação tátil antes da produção final.</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 grid gap-6 sm:grid-cols-2">
              {boutiqueHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                      className="group relative overflow-hidden rounded-3xl border border-white bg-[#3e2626] backdrop-blur-sm p-8 shadow-[0_24px_70px_rgba(62,38,38,0.4)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_80px_rgba(62,38,38,0.6)] hover:border-white"
                    >
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/5 transition-all duration-500"></div>
                    
                    <div className="relative z-10">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-white/30 to-white/20 border border-white/30 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-light text-white tracking-[0.08em]">{item.title}</h3>
                        <p className="text-sm leading-relaxed text-white/70 font-light tracking-[0.02em]">{item.description}</p>
                      </div>
                      <span className="mt-6 inline-flex text-xs font-light uppercase tracking-[0.35em] text-white">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* Featured Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto">
          {/* Header with Navigation */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-16">
            {/* Left Side - Title and Categories */}
            <div className="flex-1">
              {/* Title Section */}
              <div className="mb-8 ml-5">
                <div className="inline-flex items-center space-x-3 mb-4">
                  <div className="w-12 h-1 bg-[#3e2626] rounded-full"></div>
                  <span className="text-sm font-medium text-[#3e2626] tracking-wider uppercase">Coleção Premium</span>
                </div>
                <h2 className="text-3xl md:text-5xl lg:text-5xl font-bold text-[#3e2626] leading-tight">
                  <span className="block">Móveis em Destaque</span>
                  <span className="block text-[#3e2626]">Para Sua Casa</span>
                </h2>
                
              </div>
              
              {/* Category Navigation - Modern Pills */}
              <div className="flex flex-wrap gap-3 items-center">
                <Button 
                  variant="ghost" 
                  onClick={() => handleCategoryChange('Todos')}
                  className={`px-6 py-3 font-medium transition-all duration-300 text-base rounded-full relative group ${
                    selectedCategory === 'Todos' 
                      ? 'bg-[#3e2626] text-white shadow-lg' 
                      : 'text-[#3e2626] hover:bg-[#3e2626]/10 hover:text-[#3e2626]'
                  }`}
                >
                  Todos
                </Button>
                {availableCategories.map((category) => (
                  <Button 
                    key={category}
                    variant="ghost" 
                    onClick={() => handleCategoryChange(category)}
                    className={`px-6 py-3 font-medium transition-all duration-300 text-base rounded-full relative group ${
                      selectedCategory.toLowerCase() === category.toLowerCase() 
                        ? 'bg-[#3e2626] text-white shadow-lg' 
                        : 'text-[#3e2626] hover:bg-[#3e2626]/10 hover:text-[#3e2626]'
                    }`}
                  >
                    {getCategoryDisplayName(category)}
                  </Button>
                ))}

                {/* Clear Filter Button */}
                {selectedCategory !== 'Todos' && selectedCategory && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleCategoryChange('Todos')}
                    className="border-[#3e2626]/30 text-[#3e2626] hover:border-[#3e2626] hover:bg-[#3e2626] hover:text-white px-4 py-3 text-sm font-medium transition-all duration-300 rounded-full ml-2"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtro
                  </Button>
                )}
              </div>
            </div>

            {/* Right Side - View All Button */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end mt-8 lg:mt-0 space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex items-center space-x-4">
                {/* Filter Indicator */}
                {selectedCategory !== 'Todos' && (
                  <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg border border-[#3e2626]/20">
                    <div className="w-2 h-2 bg-[#3e2626] rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Filtro: <span className="font-semibold text-[#3e2626]">{selectedCategory}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCategoryChange('Todos')}
                      className="h-6 w-6 p-0 hover:bg-[#3e2626]/10 rounded-full"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                )}
                
                <Button 
                  size="lg" 
                  onClick={() => router.push('/products')}
                  className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] px-8 py-4 rounded-full font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-3 group"
                >
                  <span>Ver Todos os Produtos</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {productsLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#3e2626]/20 border-t-[#3e2626] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-gray-600">Carregando produtos...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {productsError && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center max-w-lg">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Erro ao Carregar Produtos</h3>
                <p className="text-lg text-gray-600 mb-4">{productsError}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Dica:</strong> Verifique se o backend está rodando na porta 3001. 
                    Os produtos exibidos são dados de exemplo enquanto o backend não estiver disponível.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] px-6 py-3 rounded-full"
                  >
                    Tentar Novamente
                  </Button>
                  <Button 
                    onClick={() => window.open('http://localhost:3001', '_blank')} 
                    variant="outline"
                    className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white px-6 py-3 rounded-full"
                  >
                    Verificar Backend
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid - Clean Layout */}
          {!productsLoading && !productsError && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  {/* Product Image Container */}
                  <div className="relative overflow-hidden">
                    <div className="aspect-[4/3] flex items-center justify-center relative bg-gray-100">
                      {/* Product Image - if available */}
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={600}
                          height={450}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="text-center text-gray-400">Sem imagem</div>
                      )}
                    </div>

                    {/* Favorite Tooltip */}
                    <FavoriteTooltip productId={product.id} />
                  </div>

                  {/* Product Info Footer - Clean */}
                  <div className="bg-white p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-[#3e2626] leading-tight">{product.name}</h3>
                      {(product.rating || 0) > 0 && (
                        <div className="flex items-center space-x-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-xs font-medium text-gray-600">
                            {product.rating?.toFixed(1) || '0.0'}
                          </span>
                          {product.reviews && product.reviews > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({product.reviews})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-[#3e2626]">
                          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-500 line-through">
                            R$ {product.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <Button 
                        onClick={() => addToCart(product.id)}
                        className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] rounded-lg w-10 h-10 p-0"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Pagination */}
          {!productsLoading && !productsError && totalPages > 1 && (
            <div className="flex flex-col items-center justify-center mt-16 space-y-6">
              {/* Pagination Info */}
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-[#3e2626]/20">
                  <div className="w-2 h-2 bg-[#3e2626] rounded-full"></div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-semibold text-[#3e2626]">{startIndex + 1}-{Math.min(endIndex, totalFilteredProducts)}</span> de <span className="font-semibold text-[#3e2626]">{totalFilteredProducts}</span> produtos
                    {selectedCategory !== 'Todos' && (
                      <span className="block text-xs mt-1 text-gray-500">
                        na categoria <span className="font-medium text-[#3e2626]">{selectedCategory}</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-3">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-3 border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-medium transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`w-12 h-12 rounded-full font-semibold transition-all duration-300 ${
                        currentPage === page
                          ? 'bg-[#3e2626] text-white shadow-lg hover:shadow-xl'
                          : 'border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626] hover:text-white hover:border-[#3e2626]'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-3 border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-medium transition-all duration-300"
                >
                  Próxima
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* View All Products Link */}
              {currentPage === totalPages && (
                <div className="text-center pt-6">
                  <div className="bg-white rounded-2xl p-6 border border-[#3e2626]/10">
                    <p className="text-sm text-gray-600 mb-4">
                      Quer explorar nossa coleção completa de produtos?
                    </p>
                    <Button
                      onClick={() => router.push('/products')}
                      className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg group"
                    >
                      Ver Todos os Produtos
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

    


     {/* Footer */}
     <Footer />
    </div>
  );
}
