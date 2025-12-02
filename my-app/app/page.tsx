'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import ProductCard from '@/components/ProductCard';
import { showAlert } from '@/lib/alerts';
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
import CTA from "@/components/ui/CTA"


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
        // addToCart do store já gerencia backend automaticamente quando autenticado
        await useAppStore.getState().addToCart(product, 1);
        setCartItems(prev => [...prev, productId]);
        
        // Disparar evento para atualizar notificações
        if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
          window.dispatchEvent(new CustomEvent('notification:cart-added'));
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
      showAlert('info', `Você tem ${cartItems.length} item(s) no carrinho`);
      // Aqui você pode implementar lógica para mostrar modal do carrinho ou redirecionar
    } else {
      showAlert('warning', 'Seu carrinho está vazio. Adicione alguns produtos!');
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

  // Função para verificar se uma oferta relâmpago está ativa
  const isFlashSaleActive = (product: any) => {
    // Debug: log do produto para debug
    if (product.isFlashSale) {
      console.log('🔍 Verificando oferta relâmpago:', {
        productId: product.id,
        productName: product.name,
        isFlashSale: product.isFlashSale,
        flashSaleStartDate: product.flashSaleStartDate,
        flashSaleEndDate: product.flashSaleEndDate,
      });
    }
    
    if (!product.isFlashSale) {
      return false;
    }
    
    const now = new Date();
    
    // Converter datas de string ISO para Date
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    if (product.flashSaleStartDate) {
      try {
        startDate = new Date(product.flashSaleStartDate);
        if (isNaN(startDate.getTime())) {
          console.warn('⚠️ Data de início inválida:', product.flashSaleStartDate);
          startDate = null;
        }
      } catch (e) {
        console.warn('⚠️ Erro ao converter data de início:', e);
        startDate = null;
      }
    }
    
    if (product.flashSaleEndDate) {
      try {
        endDate = new Date(product.flashSaleEndDate);
        if (isNaN(endDate.getTime())) {
          console.warn('⚠️ Data de fim inválida:', product.flashSaleEndDate);
          endDate = null;
        }
      } catch (e) {
        console.warn('⚠️ Erro ao converter data de fim:', e);
        endDate = null;
      }
    }
    
    // Se não tem datas, considera ativa se isFlashSale = true
    if (!startDate && !endDate) {
      console.log('✅ Oferta ativa (sem datas definidas)');
      return true;
    }
    
    // Verifica se está dentro do período
    if (startDate && now < startDate) {
      console.log('❌ Oferta ainda não começou:', {
        agora: now.toISOString(),
        inicio: startDate.toISOString(),
      });
      return false;
    }
    
    if (endDate && now > endDate) {
      console.log('❌ Oferta já expirou:', {
        agora: now.toISOString(),
        fim: endDate.toISOString(),
      });
      return false;
    }
    
    console.log('✅ Oferta ativa e dentro do período válido');
    return true;
  };

  // Calcula segundos restantes até o fim da oferta
  const calculateSecondsLeft = (product: any) => {
    if (!product.flashSaleEndDate) return OFFER_DURATION; // Fallback se não tiver data
    
    const now = new Date();
    const endDate = new Date(product.flashSaleEndDate);
    const diff = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000));
    
    return diff > 0 ? diff : 0;
  };

  // Busca produtos com oferta relâmpago ativa (memoizado)
  const activeFlashSaleProducts = useMemo(() => {
    // Só calcula se os produtos não estão carregando
    if (productsLoading || !allProducts || allProducts.length === 0) {
      return [];
    }
    
    const activeProducts = allProducts.filter((product: any) => {
      if (!product.isFlashSale) return false;
      
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (product.flashSaleStartDate) {
        try {
          startDate = new Date(product.flashSaleStartDate);
          if (isNaN(startDate.getTime())) startDate = null;
        } catch {
          startDate = null;
        }
      }
      
      if (product.flashSaleEndDate) {
        try {
          endDate = new Date(product.flashSaleEndDate);
          if (isNaN(endDate.getTime())) endDate = null;
        } catch {
          endDate = null;
        }
      }
      
      // Se não tem datas, considera ativa se isFlashSale = true
      if (!startDate && !endDate) return true;
      
      // Verifica se está dentro do período
      if (startDate && now < startDate) return false;
      if (endDate && now > endDate) return false;
      
      return true;
    });
    
    console.log('🔄 useMemo recalculou activeFlashSaleProducts:', activeProducts.length);
    return activeProducts;
  }, [allProducts, productsLoading]);

  // Seleciona produto aleatório entre os que têm oferta relâmpago ativa
  const pickRandomFlashSaleProduct = useCallback(() => {
    if (activeFlashSaleProducts.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * activeFlashSaleProducts.length);
    return activeFlashSaleProducts[randomIndex];
  }, [activeFlashSaleProducts]);

  // Calcula o preço com desconto da oferta relâmpago
  const getFlashSalePrice = (product: any) => {
    // Se tem preço direto de flash sale, usa ele
    if (product.flashSalePrice) {
      return parseFloat(product.flashSalePrice.toString());
    }
    
    // Se tem percentual de desconto, calcula
    if (product.flashSaleDiscountPercent && product.price) {
      const discount = parseFloat(product.flashSaleDiscountPercent.toString()) / 100;
      return parseFloat(product.price.toString()) * (1 - discount);
    }
    
    // Fallback: retorna o preço original
    return product.price ? parseFloat(product.price.toString()) : 0;
  };

  // Calcula o percentual de desconto
  const getFlashSaleDiscountPercent = (product: any) => {
    if (product.flashSaleDiscountPercent) {
      return parseInt(product.flashSaleDiscountPercent.toString());
    }
    
    // Calcula baseado na diferença de preço
    if (product.flashSalePrice && product.price) {
      const originalPrice = parseFloat(product.price.toString());
      const salePrice = parseFloat(product.flashSalePrice.toString());
      const discount = ((originalPrice - salePrice) / originalPrice) * 100;
      return Math.round(discount);
    }
    
    return 0;
  };

  // Inicializa oferta quando produtos carregarem (só executa quando não está carregando)
  useEffect(() => {
    // Só executa quando os produtos terminaram de carregar
    if (productsLoading) {
      console.log('⏳ Produtos ainda carregando...');
      return;
    }

    if (allProducts && allProducts.length > 0) {
      console.log('📦 Total de produtos carregados:', allProducts.length);
      
      // Debug: verificar TODOS os campos do primeiro produto para ver estrutura
      if (allProducts.length > 0) {
        console.log('🔍 Estrutura do primeiro produto:', {
          id: allProducts[0].id,
          name: allProducts[0].name,
          isFlashSale: allProducts[0].isFlashSale,
          flashSalePrice: allProducts[0].flashSalePrice,
          flashSaleDiscountPercent: allProducts[0].flashSaleDiscountPercent,
          flashSaleStartDate: allProducts[0].flashSaleStartDate,
          flashSaleEndDate: allProducts[0].flashSaleEndDate,
          todasAsChaves: Object.keys(allProducts[0])
        });
      }
      
      // Debug: verificar produtos com isFlashSale
      const productsWithFlashSale = allProducts.filter(p => p.isFlashSale);
      console.log('⚡ Produtos com isFlashSale = true:', productsWithFlashSale.length);
      if (productsWithFlashSale.length > 0) {
        console.log('📋 Produtos com flash sale (detalhes completos):', productsWithFlashSale.map(p => ({
          id: p.id,
          name: p.name,
          isFlashSale: p.isFlashSale,
          flashSalePrice: p.flashSalePrice,
          flashSaleDiscountPercent: p.flashSaleDiscountPercent,
          flashSaleStartDate: p.flashSaleStartDate,
          flashSaleEndDate: p.flashSaleEndDate,
          tipoStartDate: typeof p.flashSaleStartDate,
          tipoEndDate: typeof p.flashSaleEndDate,
        })));
      }
      
      console.log('✅ Produtos com oferta relâmpago ATIVA:', activeFlashSaleProducts.length);
      if (activeFlashSaleProducts.length > 0) {
        console.log('📋 Lista de ofertas ativas:', activeFlashSaleProducts.map(p => ({
          id: p.id,
          name: p.name,
        })));
      }
      
      if (activeFlashSaleProducts.length > 0) {
        // Verificar se já temos um produto selecionado e se ele ainda está ativo
        if (specialOfferProduct) {
          const isCurrentProductStillActive = activeFlashSaleProducts.some(p => p.id === specialOfferProduct.id);
          if (isCurrentProductStillActive) {
            console.log('✅ Produto atual ainda está ativo, mantendo:', specialOfferProduct.name);
            // Recalcula o tempo restante
            const secondsLeft = calculateSecondsLeft(specialOfferProduct);
            setOfferSecondsLeft(secondsLeft);
            setFlashOfferActive(true);
            return; // Não precisa fazer nada mais
          }
        }
        
        // Seleciona um novo produto
        const flashSaleProduct = pickRandomFlashSaleProduct();
        
        if (flashSaleProduct) {
          console.log('🎯 Produto selecionado para oferta:', {
            id: flashSaleProduct.id,
            name: flashSaleProduct.name,
            price: flashSaleProduct.price,
            flashSalePrice: flashSaleProduct.flashSalePrice,
            flashSaleDiscountPercent: flashSaleProduct.flashSaleDiscountPercent,
          });
          setSpecialOfferProduct(flashSaleProduct);
          const secondsLeft = calculateSecondsLeft(flashSaleProduct);
          setOfferSecondsLeft(secondsLeft);
          setFlashOfferActive(true);
          console.log('✅ Estados atualizados:', {
            flashOfferActive: true,
            specialOfferProduct: flashSaleProduct.name,
            secondsLeft
          });
        }
      } else {
        console.log('❌ Nenhuma oferta relâmpago ativa encontrada');
        // Se não há ofertas ativas, limpa o produto e desativa
        setSpecialOfferProduct(null);
        setFlashOfferActive(false);
      }
    } else {
      console.log('⚠️ Nenhum produto carregado ainda ou produtos vazios');
      // Se não há produtos, limpa o estado
      if (!productsLoading) {
        setSpecialOfferProduct(null);
        setFlashOfferActive(false);
      }
    }
  }, [allProducts, activeFlashSaleProducts, pickRandomFlashSaleProduct, productsLoading, specialOfferProduct]);

  // Cronômetro da oferta
  useEffect(() => {
    if (!specialOfferProduct) {
      setFlashOfferActive(false);
      return;
    }
    
    const intervalId = setInterval(() => {
      setOfferSecondsLeft((prev) => {
        if (prev <= 1) {
          // Verifica se a oferta atual ainda está ativa
          const isStillActive = activeFlashSaleProducts.some(p => p.id === specialOfferProduct.id);
          
          if (isStillActive) {
            // Recalcula o tempo restante
            return calculateSecondsLeft(specialOfferProduct);
          } else {
            // Busca outra oferta ativa
            const nextProduct = pickRandomFlashSaleProduct();
            if (nextProduct) {
              setSpecialOfferProduct(nextProduct);
              setFlashOfferActive(true);
              return calculateSecondsLeft(nextProduct);
            } else {
              // Não há mais ofertas ativas
              setSpecialOfferProduct(null);
              setFlashOfferActive(false);
              return 0;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [specialOfferProduct, activeFlashSaleProducts, pickRandomFlashSaleProduct]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    return `${h}h ${m}m`;
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
        <div className="w-[280px] sm:w-[300px] md:w-[350px] lg:w-[400px] flex-shrink-0 relative">
          <div className={`aspect-[6/9] rounded-xl sm:rounded-2xl shadow-xl relative overflow-hidden`}>
            {/* Imagem de fundo */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 sm:scale-105 md:scale-100"
              style={{ backgroundImage: `url(${slide.image})` }}
            ></div>
            {/* Overlay gradiente para melhor legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {/* overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 sm:p-5 md:p-6">
              <div className="text-white">
                <div className="text-xs sm:text-sm text-white/70 mb-1">{slide.number}</div>
                <div className="text-base sm:text-lg font-bold mb-1">{slide.title}</div>
                <div className="text-xs sm:text-sm text-white/80">{slide.subtitle}</div>
              </div>
            </div>
           
          </div>
        </div>
      );
    }

  // small card (quadrado)
  return (
    <div className="w-[220px] sm:w-[250px] md:w-[300px] lg:w-[350px] flex-shrink-0 relative">
      <div className={`aspect-[4/5] rounded-xl sm:rounded-2xl shadow-xl relative overflow-hidden`}>
        {/* Imagem de fundo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 sm:scale-105 md:scale-100"
          style={{ backgroundImage: `url(${slide.image})` }}
        ></div>
        {/* Overlay gradiente para melhor legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 sm:p-5 md:p-6">
          <div className="text-white">
            <div className="text-xs sm:text-sm text-white/70 mb-1">{slide.number}</div>
            <div className="text-base sm:text-lg font-bold mb-1">{slide.title}</div>
            <div className="text-xs sm:text-sm text-white/80">{slide.subtitle}</div>
          </div>
        </div>
      </div>
      
      {/* Navigation Below Card 2 - apenas no desktop */}
      {position === 1 && (
        <div className="hidden sm:flex items-center justify-between mt-3 sm:mt-4 w-full">
          {/* Dots */}
          <div className="flex space-x-1.5 sm:space-x-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Ir para slide ${idx + 1}`}
                onClick={() => setCarouselIndex(idx)}
                className={`${idx === carouselIndex ? 'w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#3e2626]' : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300'} rounded-full transition-all`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex space-x-1.5 sm:space-x-2">
            <button 
              onClick={goPrev} 
              disabled={isAnimating}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 hover:bg-[#3e2626] hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
            </button>
            <button 
              onClick={goNext} 
              disabled={isAnimating}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-[#3e2626] text-white hover:bg-[#2a1f1f] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
  };

  // Estado para controlar se a oferta relâmpago está ativa (baseado em ofertas reais cadastradas)
  const [flashOfferActive, setFlashOfferActive] = useState(false);

  return (
    <div className="min-h-screen ">
      {/* Main Hero Section - Design Ultra Moderno e Apelativo */}
      <div className="relative min-h-screen flex items-center overflow-hidden pt-32 sm:pt-36 md:pt-40 lg:pt-44">
        {/* Background Image com efeitos dinâmicos */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-out"
          style={{ 
            backgroundImage: 'url(/hero-bg.png)',
            filter: 'sepia(40%) saturate(60%) brightness(0.5) contrast(1.1) hue-rotate(-10deg)',
            WebkitFilter: 'sepia(40%) saturate(60%) brightness(0.5) contrast(1.1) hue-rotate(-10deg)',
            transform: 'scale(1.1)'
          }}
        ></div>
        
        {/* Overlay gradiente marrom elegante */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3e2626]/85 via-[#5a3a3a]/70 to-[#3e2626]/60"></div>
        
        {/* Overlay adicional para dar profundidade marrom */}
        <div className="absolute inset-0 bg-[#3e2626]/30 mix-blend-multiply"></div>
        
        {/* Efeitos de luz animados com tons marrons */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#8B4513]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3e2626]/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Grid pattern sutil com tons marrons */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 69, 19, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 69, 19, 0.15) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        ></div>
        
        {/* Header */}
        <Header />

        {/* Content Container - Layout mais compacto e impactante */}
        <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start lg:items-center min-h-[90vh]">
            
            {/* LADO ESQUERDO - Conteúdo focado em experiência */}
            <div className="text-white space-y-6 sm:space-y-8 lg:space-y-10 mt-6 sm:mt-8 lg:mt-10 animate-in fade-in slide-in-from-left duration-1000">

              {/* Título principal */}
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] tracking-tight">
                  <span className="block text-white drop-shadow-2xl">
                    Não é só
                  </span>
                  <span className="block text-white drop-shadow-2xl">
                    mobília.
                  </span>
                  <span className="block text-white drop-shadow-2xl mt-1 sm:mt-2 md:mt-3">
                    <span className="">É</span> experiência.
                  </span>
                </h1>
              </div>

              {/* Descrição focada em experiência */}
              <div className="space-y-2 sm:space-y-3 max-w-lg">
                <p className="text-base sm:text-lg md:text-xl text-white/85 leading-relaxed font-light">
                  Transforme seu ambiente com nossa tecnologia de visualização. Veja como cada peça se encaixa perfeitamente no seu espaço antes de decidir.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-white/70 pt-1 sm:pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/60" />
                    <span>Visualização instantânea</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/60" />
                    <span>Resultados precisos</span>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                <Button 
                  onClick={() => router.push('/IA')}
                  size="lg"
                  className="group relative bg-white text-[#3e2626] hover:bg-white/95 rounded-full px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 text-sm sm:text-base font-bold transition-all duration-300 shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative flex items-center gap-2 sm:gap-3">
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs sm:text-base">EXPERIMENTAR</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
                <Button 
                  onClick={() => router.push('/products')}
                  size="lg"
                  variant="outline"
                  className="group relative bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white/70 rounded-full px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 text-sm sm:text-base font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center gap-2 sm:gap-3">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs sm:text-base">EXPLORAR PRODUTOS</span>
                  </span>
                </Button>
              </div>
            </div>

            {/* LADO DIREITO - Oferta Relâmpago (Condicional) */}
            {(() => {
              console.log('🎨 Renderizando oferta relâmpago:', {
                flashOfferActive,
                hasSpecialOfferProduct: !!specialOfferProduct,
                specialOfferProductName: specialOfferProduct?.name,
                activeFlashSaleProductsCount: activeFlashSaleProducts.length
              });
              return flashOfferActive && specialOfferProduct;
            })() && (
              <div className="relative group w-full animate-in fade-in slide-in-from-right duration-700 mt-8 lg:mt-0">
                <div className="relative bg-gradient-to-br from-white/15 min-h-[500px] md:h-[550px] via-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-2 border-white/40 overflow-hidden transition-all duration-500 hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] hover:border-white/50 hover:scale-[1.01]">
                  {/* Efeito de brilho animado no fundo */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
                  </div>
                  
                  {/* Padrão decorativo sutil de fundo */}
                  <div className="absolute inset-0 opacity-[0.08]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                  
                  {/* Efeito de brilho pulsante no timer */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
                  
                  {/* Badge Oferta Relâmpago */}
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                    <div className="relative overflow-hidden bg-gradient-to-r from-[#3e2626] to-[#2a1f1f] text-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-[0_4px_15px_rgba(62,38,38,0.5)] group/badge hover:shadow-[0_6px_20px_rgba(62,38,38,0.7)] transition-all duration-300">
                      <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-white animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-semibold tracking-wider">Oferta Relâmpago</span>
                    </div>
                    <div className="relative bg-[#3e2626] text-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 animate-pulse">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 relative z-10" />
                      <span className="text-[10px] sm:text-xs font-bold tabular-nums relative z-10">{formatTime(offerSecondsLeft)}</span>
                    </div>
                  </div>

                  {/* Layout: Imagem à esquerda, Conteúdo à direita */}
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {/* Imagem do Produto - Formato Quadrado à Esquerda */}
                    {specialOfferProduct.imageUrl && (
                      <div className="relative w-full h-[250px] sm:h-[300px] md:h-[430px] rounded-2xl overflow-hidden bg-[#3e2626] group/image shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
                        <Image
                          src={specialOfferProduct.imageUrl}
                          alt={specialOfferProduct.name}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover scale-[1.05] sm:scale-[1.03] md:scale-100 transition-transform duration-700 group-hover/image:scale-110"
                          unoptimized
                        />
                        
                        {/* Badge de Desconto melhorado */}
                        {(() => {
                          const discountPercent = getFlashSaleDiscountPercent(specialOfferProduct);
                          return discountPercent > 0 ? (
                            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-gradient-to-br from-[#3e2626] to-[#2a1f1f] text-white rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 shadow-[0_8px_25px_rgba(62,38,38,0.6)] z-20 transform hover:scale-110 transition-transform duration-300">
                              <div className="text-lg sm:text-2xl font-black leading-none">{discountPercent}%</div>
                              <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mt-0.5">OFF</div>
                            </div>
                          ) : null;
                        })()}
                        
                        {/* Efeito de brilho na imagem */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover/image:translate-x-[200%] transition-transform duration-1000 ease-out z-10"></div>
                      </div>
                    )}

                    {/* Informações do Produto - À Direita */}
                    <div className="flex flex-col justify-between space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-4xl font-medium text-white leading-tight tracking-[0.05em] mb-2 sm:mb-3 drop-shadow-lg">
                          {specialOfferProduct.name}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-white/80 font-light tracking-wide mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-none">  
                        {specialOfferProduct.description}
                        </p>
                        
                        {/* Preço melhorado */}
                        {(() => {
                          const originalPrice = specialOfferProduct.price ? parseFloat(specialOfferProduct.price.toString()) : 0;
                          const salePrice = getFlashSalePrice(specialOfferProduct);
                          const savings = originalPrice - salePrice;
                          
                          return (
                            <div className="space-y-1.5 sm:space-y-2">
                              <div className="text-[10px] sm:text-xs text-white/80 font-light tracking-wide">Por apenas</div>
                              <div className="flex items-baseline gap-1.5 sm:gap-2">
                                <span className="text-sm sm:text-lg font-medium text-white/90">R$</span>
                                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                                  {salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              {originalPrice > salePrice && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-1">
                                  <span className="text-xs sm:text-sm text-white/50 line-through font-light">
                                    R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  {savings > 0 && (
                                    <span className="text-[10px] sm:text-xs bg-[#3e2626] text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold border border-white backdrop-blur-sm shadow-lg inline-block w-fit">
                                      Economize R$ {savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        {/* Botão de Ação melhorado */}
                        <Button 
                          onClick={() => addToCart(specialOfferProduct.id)}
                          className="relative w-full bg-gradient-to-r from-white to-white/95 text-[#3e2626] hover:from-white hover:to-white rounded-full px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 shadow-[0_8px_25px_rgba(255,255,255,0.3)] hover:shadow-[0_12px_35px_rgba(255,255,255,0.4)] hover:scale-[1.03] active:scale-[0.97] group/button overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-100%] group-hover/button:translate-x-[200%] transition-transform duration-700"></div>
                          <span className="flex items-center justify-center gap-1.5 sm:gap-2 relative z-10">
                            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover/button:scale-110 transition-transform duration-300" />
                            <span className="text-xs sm:text-sm">Adicionar ao Carrinho</span>
                          </span>
                        </Button>
                        
                        {/* Garantia melhorada */}
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/70 font-light">
                          <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/80" />
                          <span>Compra segura e garantida</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decoração flutuante */}
                  <div className="absolute top-8 right-8 w-24 h-24 bg-white/5 rounded-full blur-2xl hidden sm:block"></div>
                  <div className="absolute bottom-8 left-8 w-16 h-16 bg-white/5 rounded-full blur-xl hidden sm:block"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

     

      {/* Categories Section */}
      <section id="categories-anchor" className="pt-12 sm:pt-16 md:pt-20 lg:pt-24 pb-12 sm:pb-16 md:pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 md:mt-10">
         

          {/* Grid Layout Customizado - 6 colunas x 5 linhas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 auto-rows-fr min-h-[600px] md:min-h-[800px]">
            
            {/* Sofá - 3x2 (colunas 1-3, linhas 1-2) */}
            <Link href={`/products?category=${categories[0].id}`} className="sm:col-span-2 md:col-span-3 lg:col-span-3 md:row-span-2 relative z-0 min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
              <div className="group relative h-full bg-gradient-to-br from-[#3e2626] via-[#8B4513] to-[#A0522D] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02]">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-bottom scale-[2.2] sm:scale-[2] md:scale-[1.79]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[0].id]})` }}
                ></div>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 30px 30px, rgba(255,255,255,0.05) 2px, transparent 2px)`,
                    backgroundSize: '60px 60px'
                  }}></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>
                
                {/* Conteúdo Principal */}
                <div className="relative z-10 p-4 sm:p-6 md:p-8 h-full flex flex-col justify-between pointer-events-auto">
                  <div>
                    <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-[1px] bg-white/10">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-black mb-1 sm:mb-2 leading-tight tracking-[0.08em]">
                        {categories[0].name}
                      </h3>
                      <p className="text-xs sm:text-sm text-black font-light tracking-[0.02em]">
                        {categories[0].description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Efeito de brilho animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none"></div>
                
                {/* Decoração flutuante */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg pointer-events-none"></div>
              </div>
            </Link>

            {/* Poltrona - 2x2 (colunas 4-5, linhas 1-2) */}
            <Link href={`/products?category=${categories[5].id}`} className="sm:col-span-1 md:col-span-2 lg:col-span-2 md:row-span-2 relative z-0 min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[1.8] sm:scale-[1.6] md:scale-[1.4]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[5].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[5].gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none`}></div>
                
                <div className="relative z-10 p-4 sm:p-5 md:p-6 h-full flex flex-col justify-start pointer-events-auto">
                  <div>
                    <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-[1px] bg-white/10">
                      <h4 className="text-xl sm:text-2xl md:text-3xl font-light text-black mb-1 sm:mb-2 leading-tight tracking-[0.08em]">
                        {categories[5].name}
                      </h4>
                      <p className="text-xs sm:text-sm text-black tracking-[0.02em]">
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
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/20 rounded-2xl transition-all duration-300 pointer-events-none"></div>
              </div>
            </Link>

            {/* Cadeiras - 1x2 (coluna 6, linhas 1-2) */}
            <Link href={`/products?category=${categories[2].id}`} className="sm:col-span-1 md:col-span-1 lg:col-span-1 md:row-span-2 relative z-0 min-h-[250px] sm:min-h-[300px] md:min-h-[500px]">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[1.4] sm:scale-[1.2] md:scale-[1]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[2].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[2].gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>
                
                <div className="relative z-10 p-3 sm:p-4 h-full flex flex-col justify-end items-center pointer-events-auto">
                  <div className="text-center">
                    <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-base sm:text-lg md:text-xl font-light text-black mb-1 sm:mb-2 leading-tight tracking-[0.08em]">
                        {categories[2].name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-black tracking-[0.02em]">
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
            <Link href={`/products?category=${categories[1].id}`} className="sm:col-span-1 md:col-span-2 lg:col-span-2 md:row-span-2 relative z-0 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[1.7] sm:scale-[1.5] md:scale-[1.36]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[1].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[1].gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none`}></div>
                
                <div className="relative z-10 p-4 sm:p-5 md:p-6 h-full flex flex-col justify-start pointer-events-auto">
                  <div>
                    <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-xl sm:text-2xl md:text-3xl font-light text-black mb-1 sm:mb-2 leading-tight tracking-[0.08em]">
                        {categories[1].name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-black font-light tracking-[0.02em]">
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
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/20 rounded-2xl transition-all duration-300 pointer-events-none"></div>
              </div>
            </Link>

            {/* Estante - 2x1 (colunas 3-4, linha 3) */}
            <Link href={`/products?category=${categories[4].id}`} className="sm:col-span-2 md:col-span-2 lg:col-span-2 md:row-span-1 relative z-0 min-h-[200px] sm:min-h-[250px]">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-bottom scale-[2.2] sm:scale-[2] md:scale-[1.85]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[4].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[4].gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>
                
                <div className="relative z-10 p-3 sm:p-4 h-full flex flex-col justify-end pointer-events-auto">
                  <div className="text-left">
                    <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-base sm:text-lg md:text-xl font-light text-black mb-1 sm:mb-2 leading-tight tracking-[0.08em]">
                        {categories[4].name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-black font-light tracking-[0.02em]">
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
            <Link href={`/products?category=${categories[6].id}`} className="sm:col-span-2 md:col-span-2 lg:col-span-2 md:row-span-1 relative z-0 min-h-[200px] sm:min-h-[250px]">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[2.2] sm:scale-[2] md:scale-[1.8]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[6].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[6].gradient} opacity-5 group-hover:opacity-8 transition-opacity duration-300 pointer-events-none`}></div>
                
                <div className="relative z-10 p-3 sm:p-4 h-full flex flex-col justify-end pointer-events-auto">
                  <div className="text-left">
                    <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-[1px] bg-white/10">
                      <h4 className="text-base sm:text-lg md:text-xl font-light text-black mb-1 sm:mb-2 leading-tight tracking-[0.08em]">
                        {categories[6].name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-black font-light tracking-[0.02em]">
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
            <Link href={`/products?category=${categories[7].id}`} className="sm:col-span-2 md:col-span-2 lg:col-span-2 md:row-span-1 relative z-0 min-h-[200px] sm:min-h-[250px]">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-bottom scale-[2.2] sm:scale-[2] md:scale-[1.8]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[7].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[7].gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>
                
                <div className="relative z-10 p-3 sm:p-4 h-full flex flex-col justify-end pointer-events-auto">
                  <div className="text-left">
                    <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-base sm:text-lg md:text-xl font-light text-black mb-1 sm:mb-2 leading-tight tracking-[0.08em]">
                        {categories[7].name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-black font-light tracking-[0.02em]">
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
            <Link href={`/products?category=${categories[8].id}`} className="sm:col-span-1 md:col-span-1 lg:col-span-1 md:row-span-1 relative z-0 min-h-[200px] sm:min-h-[250px]">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-[1.8] sm:scale-[1.6] md:scale-[1.4]"
                  style={{ backgroundImage: `url(${categoryBackgrounds[categories[8].id]})` }}
                ></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[8].gradient} opacity-5 group-hover:opacity-8 transition-opacity duration-300 pointer-events-none`}></div>
                
                <div className="relative z-10 p-2 sm:p-3 h-full flex flex-col justify-end items-center pointer-events-auto">
                  <div className="text-center">
                    <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-[1px] bg-white/15">
                      <h4 className="text-sm sm:text-base md:text-lg font-light text-black mb-1 sm:mb-2 leading-tight tracking-[0.08em]">
                        {categories[8].name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-black font-light tracking-[0.02em]">
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
            <Link href="/products" className="sm:col-span-1 md:col-span-1 lg:col-span-1 md:row-span-1 min-h-[200px] sm:min-h-[250px]">
              <div className="group relative h-full bg-gradient-to-br from-[#3e2626] to-[#2a1f1f] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-[#3e2626]/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
                
                <div className="relative z-10 h-full flex items-center justify-center">
                  <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-white group-hover:translate-x-2 transition-all duration-300 group-hover:scale-110" />
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
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 gap-8 sm:gap-10 md:gap-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="lg:col-span-1 space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#3e2626] mb-4 sm:mb-6 leading-tight">
                  <span className="block">Nossa IA</span>
                  <span className="block">Inovadora</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
                  Transforme qualquer ambiente com nossa inteligência artificial que visualiza cores e móveis em tempo real
                </p>
              </div>
              
              <button className="group bg-[#3e2626] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base md:text-lg hover:bg-[#2a1f1f] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 sm:space-x-3">
                <span>Experimentar IA</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>

            {/* Right Side - Carousel */}
            <div className="lg:col-span-2 w-full">
              <div className="relative w-full">
                {/* Mobile: Scroll horizontal com todos os slides */}
                <div className="block sm:hidden relative overflow-x-auto overflow-y-visible scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
                  <div className="flex space-x-3 items-start w-max">
                    {slides.map((slide, idx) => (
                      <div key={idx} className="flex-shrink-0 snap-center">
                        {renderSlide(slide, idx === 0 ? 0 : 1)}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Desktop: Carousel animado */}
                <div className="hidden sm:block relative overflow-hidden">
                  <div 
                    className="flex space-x-3 sm:space-x-4 items-start transition-all duration-700 ease-in-out"
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
      <section className="relative overflow-hidden bg-[#3e2626] py-12 sm:py-16 md:py-20 lg:py-28 text-white">
       
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:gap-12 md:gap-16 lg:grid-cols-5">
            <div className="space-y-6 sm:space-y-8 lg:col-span-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white bg-[#3e2626] backdrop-blur-sm px-4 sm:px-6 py-1.5 sm:py-2 text-[10px] sm:text-xs font-light uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white">
                experiência boutique
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light leading-tight tracking-[0.08em] text-white">
                Curadoria feita à mão para ambientes que contam histórias únicas.
              </h2>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed text-white/80 font-light tracking-[0.02em]">
                Unimos leitura sensorial, inteligência artificial e olhar autoral para transformar fotografias reais em cenas que você consegue sentir. Cada projeto nasce de conversas profundas, referências afetivas e uma seleção criteriosa de materiais.
              </p>
              <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-white/70 font-light">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="leading-relaxed">Paletas desenvolvidas com artistas convidados e dados de iluminação do ambiente.</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <Brush className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="leading-relaxed">Texturas físicas enviadas para aprovação tátil antes da produção final.</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 grid gap-4 sm:gap-6 sm:grid-cols-2">
              {boutiqueHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white bg-[#3e2626] backdrop-blur-sm p-5 sm:p-6 md:p-8 shadow-[0_24px_70px_rgba(62,38,38,0.4)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_80px_rgba(62,38,38,0.6)] hover:border-white"
                    >
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/5 transition-all duration-500"></div>
                    
                    <div className="relative z-10">
                      <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-white/30 to-white/20 border border-white/30 text-white mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <h3 className="text-base sm:text-lg font-light text-white tracking-[0.08em]">{item.title}</h3>
                        <p className="text-xs sm:text-sm leading-relaxed text-white/70 font-light tracking-[0.02em]">{item.description}</p>
                      </div>
                      <span className="mt-4 sm:mt-6 inline-flex text-[10px] sm:text-xs font-light uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white">
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
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Navigation */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8 sm:mb-12 md:mb-16">
            {/* Left Side - Title and Categories */}
            <div className="flex-1">
              {/* Title Section */}
              <div className="mb-6 sm:mb-8 ml-0 sm:ml-5">
                <div className="inline-flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="w-8 sm:w-12 h-0.5 sm:h-1 bg-[#3e2626] rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium text-[#3e2626] tracking-wider uppercase">Coleção Premium</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#3e2626] leading-tight">
                  <span className="block">Móveis em Destaque</span>
                  <span className="block text-[#3e2626]">Para Sua Casa</span>
                </h2>
                
              </div>
              
              {/* Category Navigation - Modern Pills */}
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                <Button 
                  variant="ghost" 
                  onClick={() => handleCategoryChange('Todos')}
                  className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition-all duration-300 text-sm sm:text-base rounded-full relative group ${
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
                    className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition-all duration-300 text-sm sm:text-base rounded-full relative group ${
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
                    className="border-[#3e2626]/30 text-[#3e2626] hover:border-[#3e2626] hover:bg-[#3e2626] hover:text-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-300 rounded-full ml-0 sm:ml-2"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Limpar Filtro</span>
                    <span className="sm:hidden">Limpar</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Right Side - View All Button */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end mt-6 sm:mt-8 lg:mt-0 space-y-3 sm:space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {/* Filter Indicator */}
                {selectedCategory !== 'Todos' && (
                  <div className="flex items-center space-x-2 sm:space-x-3 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-full shadow-lg border border-[#3e2626]/20">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3e2626] rounded-full"></div>
                    <span className="text-xs sm:text-sm text-gray-700">
                      Filtro: <span className="font-semibold text-[#3e2626]">{selectedCategory}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCategoryChange('Todos')}
                      className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-[#3e2626]/10 rounded-full"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    </Button>
                  </div>
                )}
                
                <Button 
                  size="lg" 
                  onClick={() => router.push('/products')}
                  className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base md:text-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 group"
                >
                  <span>Ver Todos os Produtos</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
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
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="default"
                  showFavorite={true}
                  showAddToCart={true}
                />
              ))}
            </div>
          )}

          {/* Enhanced Pagination */}
          {!productsLoading && !productsError && totalPages > 1 && (
            <div className="flex flex-col items-center justify-center mt-8 sm:mt-12 md:mt-16 space-y-4 sm:space-y-6">
              {/* Pagination Info */}
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg border border-[#3e2626]/20">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3e2626] rounded-full"></div>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Mostrando <span className="font-semibold text-[#3e2626]">{startIndex + 1}-{Math.min(endIndex, totalFilteredProducts)}</span> de <span className="font-semibold text-[#3e2626]">{totalFilteredProducts}</span> produtos
                    {selectedCategory !== 'Todos' && (
                      <span className="block text-[10px] sm:text-xs mt-1 text-gray-500">
                        na categoria <span className="font-medium text-[#3e2626]">{selectedCategory}</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 sm:py-3 border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-medium transition-all duration-300 text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Ant</span>
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full font-semibold transition-all duration-300 text-xs sm:text-base ${
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
                  className="px-3 sm:px-4 py-2 sm:py-3 border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-medium transition-all duration-300 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <span className="sm:hidden">Próx</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
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

      <CTA />

    


     {/* Footer */}
     <Footer />
    </div>
  );
}
