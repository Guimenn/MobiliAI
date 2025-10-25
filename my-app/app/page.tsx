<<<<<<< Updated upstream
﻿'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import PromotionalSection from '@/components/PromotionalSection';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
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
  const [selectedCategory, setSelectedCategory] = useState('Sala de Estar');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Função auxiliar para renderizar ícones
  const renderIcon = (IconComponent: any, className: string) => {
    return <IconComponent className={className} />;
  };

  // Função para alternar favorito
  const toggleFavorite = (productId: number) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Função para adicionar ao carrinho
  const addToCart = (productId: number) => {
    setCartItems(prev => [...prev, productId]);
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
      id: 'OUTROS', 
      name: 'Outros', 
      icon: Package, 
      count: 12,
      description: 'Produtos especiais e exclusivos',
      gradient: 'from-[#696969] to-[#A9A9A9]'
    },
  ];

  const allProducts = [
    {
      id: 1,
      name: 'Sofá 3 Lugares Moderno',
      price: 2499.99,
      originalPrice: 2999.99,
      color: '#3e2626',
      rating: 4.9,
      reviews: 156,
      badge: 'Mais Vendido',
      category: 'Sala de Estar'
    },
    {
      id: 2,
      name: 'Cadeira Executiva Premium',
      price: 899.99,
      color: '#8B4513',
      rating: 4.8,
      reviews: 89,
      badge: 'Novo',
      category: 'Quarto'
    },
    {
      id: 3,
      name: 'Mesa de Centro Elegante',
      price: 1299.99,
      originalPrice: 1599.99,
      color: '#D2B48C',
      rating: 4.7,
      reviews: 124,
      badge: 'Oferta',
      category: 'Sala de Estar'
    },
    {
      id: 4,
      name: 'Luminária Pendant Moderna',
      price: 599.99,
      color: '#A0522D',
      rating: 4.6,
      reviews: 67,
      badge: null,
      category: 'Sala de Estar'
    },
    {
      id: 5,
      name: 'Poltrona Relax Premium',
      price: 1899.99,
      color: '#CD853F',
      rating: 4.9,
      reviews: 92,
      badge: null,
      category: 'Sala de Estar'
    },
    {
      id: 6,
      name: 'Mesa de Jantar 6 Lugares',
      price: 2199.99,
      color: '#DEB887',
      rating: 4.8,
      reviews: 78,
      badge: 'Novo',
      category: 'Sala de Jantar'
    },
    {
      id: 7,
      name: 'Cama King Size Premium',
      price: 3299.99,
      color: '#8B4513',
      rating: 4.9,
      reviews: 134,
      badge: 'Mais Vendido',
      category: 'Quarto'
    },
    {
      id: 8,
      name: 'Armário de Cozinha Moderno',
      price: 1899.99,
      color: '#D2B48C',
      rating: 4.7,
      reviews: 89,
      badge: null,
      category: 'Cozinha'
    },
    {
      id: 9,
      name: 'Mesa de Jantar 4 Lugares',
      price: 1599.99,
      color: '#A0522D',
      rating: 4.8,
      reviews: 67,
      badge: 'Oferta',
      category: 'Sala de Jantar'
    },
    {
      id: 10,
      name: 'Cadeira de Jardim Resistente',
      price: 399.99,
      color: '#3e2626',
      rating: 4.6,
      reviews: 45,
      badge: null,
      category: 'Exterior'
    },
    {
      id: 11,
      name: 'Guarda-roupa 6 Portas',
      price: 2499.99,
      color: '#8B4513',
      rating: 4.8,
      reviews: 98,
      badge: 'Novo',
      category: 'Quarto'
    },
    {
      id: 12,
      name: 'Conjunto de Mesa e Cadeiras',
      price: 2199.99,
      color: '#D2B48C',
      rating: 4.7,
      reviews: 76,
      badge: null,
      category: 'Sala de Jantar'
    }
  ];

  // Filtrar produtos baseado na categoria selecionada
  const filteredProducts = selectedCategory === 'Todos' 
    ? allProducts 
    : allProducts.filter(product => product.category === selectedCategory);

  // Configurações de paginação
  const productsPerPage = 6;
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
            {/* botão */}
            <button 
              onClick={goNext} 
              className="absolute bottom-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
            >
              <ArrowRight className="h-4 w-4 text-white rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      );
    }

  // small card (quadrado)
=======
export default function Home() {
>>>>>>> Stashed changes
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">MobiliAI - Sistema Funcionando!</h1>
    </div>
  );
<<<<<<< Updated upstream
  };

  return (
    <div className="min-h-screen">
      {/* Hero Background Container */}
      <div className="relative min-h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-bg.png)' }}
        ></div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#3e2626]/60"></div>
        
        {/* Header */}
        <Header />

        {/* Hero Section */}
        <section className="relative flex items-center justify-center overflow-hidden h-full">
          {/* Content */}
          <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 lg:px-8 text-center mt-30">
            <div className="max-w-5xl mx-auto">
              {/* Main Heading */}
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-thin leading-tight tracking-wider">
                <span className="block font-thin" style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Decore seu espaço com
                </span>
                <span className="block font-thin mt-3 text-3xl md:text-5xl lg:text-7xl" style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  móveis estilosos
                </span>
              </h1>
            </div>
          </div>
        </section>
      </div>

     

      {/* Categories Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
         

          {/* Grid Layout Customizado - 6 colunas x 5 linhas */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 h-[800px]">
            
            {/* Sofá - 3x2 (colunas 1-3, linhas 1-2) */}
            <Link href={`/products?category=${categories[0].id}`} className="md:col-span-3 md:row-span-2">
              <div className="group relative h-full bg-gradient-to-br from-[#3e2626] via-[#8B4513] to-[#A0522D] rounded-3xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02]">
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
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                      <Sofa className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                      {categories[0].name}
                    </h3>
                    <p className="text-white/90 text-xl leading-relaxed max-w-md">
                      {categories[0].description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                      <span className="text-white font-bold text-xl">
                        {categories[0].count} produtos
                      </span>
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <ArrowRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" />
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
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[5].gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className={`w-16 h-16 bg-gradient-to-br ${categories[5].gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                      {renderIcon(categories[5].icon, "h-8 w-8 text-white")}
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-[#3e2626]">
                        {categories[5].count}
                      </span>
                      <p className="text-sm text-gray-500 font-medium">produtos</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-2xl font-bold text-[#3e2626] mb-2">
                      {categories[5].name}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {categories[5].description}
                    </p>
                  </div>
                </div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/20 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Armário - 1x2 (coluna 6, linhas 1-2) */}
            <Link href={`/products?category=${categories[3].id}`} className="md:col-span-1 md:row-span-2">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[3].gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${categories[3].gradient} rounded-xl flex items-center justify-center shadow-md mb-4`}>
                      {renderIcon(categories[3].icon, "h-6 w-6 text-white")}
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-[#3e2626]">
                        {categories[3].count}
                      </span>
                      <p className="text-xs text-gray-500">produtos</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-[#3e2626] mb-1">
                      {categories[3].name}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {categories[3].description}
                    </p>
                  </div>
                </div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/15 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Mesa - 2x2 (colunas 1-2, linhas 3-4) */}
            <Link href={`/products?category=${categories[1].id}`} className="md:col-span-2 md:row-span-2">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[1].gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className={`w-16 h-16 bg-gradient-to-br ${categories[1].gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                      {renderIcon(categories[1].icon, "h-8 w-8 text-white")}
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-[#3e2626]">
                        {categories[1].count}
                      </span>
                      <p className="text-sm text-gray-500 font-medium">produtos</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-2xl font-bold text-[#3e2626] mb-2">
                      {categories[1].name}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {categories[1].description}
                    </p>
                  </div>
                </div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/20 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Estante - 2x1 (colunas 3-4, linha 3) */}
            <Link href={`/products?category=${categories[4].id}`} className="md:col-span-2 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[4].gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-4 h-full flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${categories[4].gradient} rounded-xl flex items-center justify-center shadow-md`}>
                      {renderIcon(categories[4].icon, "h-6 w-6 text-white")}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#3e2626] mb-1">
                        {categories[4].name}
                      </h4>
                      <p className="text-sm text-gray-600">{categories[4].description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#3e2626]">
                      {categories[4].count}
                    </span>
                    <p className="text-xs text-gray-500">produtos</p>
                  </div>
                </div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/15 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Quadro - 1x1 (coluna 6, linha 3) */}
            <Link href={`/products?category=${categories[6].id}`} className="md:col-span-1 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[6].gradient} opacity-5 group-hover:opacity-8 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-3 h-full flex flex-col items-center justify-center">
                  <div className={`w-10 h-10 bg-gradient-to-br ${categories[6].gradient} rounded-lg flex items-center justify-center shadow-sm mb-2`}>
                    {renderIcon(categories[6].icon, "h-5 w-5 text-white")}
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-[#3e2626] mb-1">
                      {categories[6].name}
                    </h4>
                    <p className="text-xs text-gray-500">{categories[6].count} produtos</p>
                  </div>
                </div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/10 rounded-xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Cadeira - 1x1 (coluna 5, linha 4) */}
            <Link href={`/products?category=${categories[2].id}`} className="md:col-span-1 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[2].gradient} opacity-5 group-hover:opacity-8 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-3 h-full flex flex-col items-center justify-center">
                  <div className={`w-10 h-10 bg-gradient-to-br ${categories[2].gradient} rounded-lg flex items-center justify-center shadow-sm mb-2`}>
                    {renderIcon(categories[2].icon, "h-5 w-5 text-white")}
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-[#3e2626] mb-1">
                      {categories[2].name}
                    </h4>
                    <p className="text-xs text-gray-500">{categories[2].count} produtos</p>
                  </div>
                </div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/10 rounded-xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Luminária - 2x1 (colunas 3-4, linha 4) */}
            <Link href={`/products?category=${categories[7].id}`} className="md:col-span-2 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[7].gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-4 h-full flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${categories[7].gradient} rounded-xl flex items-center justify-center shadow-md`}>
                      {renderIcon(categories[7].icon, "h-6 w-6 text-white")}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#3e2626] mb-1">
                        {categories[7].name}
                      </h4>
                      <p className="text-sm text-gray-600">{categories[7].description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#3e2626]">
                      {categories[7].count}
                    </span>
                    <p className="text-xs text-gray-500">produtos</p>
                  </div>
                </div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3e2626]/15 rounded-2xl transition-all duration-300"></div>
              </div>
            </Link>

            {/* Outros - 1x1 (coluna 6, linha 4) */}
            <Link href={`/products?category=${categories[8].id}`} className="md:col-span-1 md:row-span-1">
              <div className="group relative h-full bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[8].gradient} opacity-5 group-hover:opacity-8 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 p-3 h-full flex flex-col items-center justify-center">
                  <div className={`w-10 h-10 bg-gradient-to-br ${categories[8].gradient} rounded-lg flex items-center justify-center shadow-sm mb-2`}>
                    {renderIcon(categories[8].icon, "h-5 w-5 text-white")}
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-[#3e2626] mb-1">
                      {categories[8].name}
                    </h4>
                    <p className="text-xs text-gray-500">{categories[8].count} produtos</p>
                  </div>
                </div>
                
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
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-xl transition-all duration-300"></div>
              </div>
            </Link>

          </div>
        </div>
      </section>

     

      {/* AI Section */}
      <section className="py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-[1000px] mx-auto translate-x-[-130px] gap-12">
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
                <div className="relative overflow-hidden w-[900px]">
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

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Navigation */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-16">
            {/* Left Side - Title and Categories */}
            <div className="flex-1">
              {/* Title Section */}
              <div className="mb-6">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#3e2626] leading-tight">
                  <span className="block">Móveis em Destaque</span>
                  <span className="block">Para Sua Casa</span>
                </h2>
              </div>
              
              {/* Category Navigation - Below Title */}
              <div className="flex flex-wrap gap-4 items-center">
                <Button 
                  variant="ghost" 
                  onClick={() => handleCategoryChange('Sala de Jantar')}
                  className={`px-0 py-1 font-medium transition-all duration-300 text-lg relative ${
                    selectedCategory === 'Sala de Jantar' 
                      ? 'text-[#3e2626]' 
                      : 'text-[#3e2626] hover:text-[#3e2626] hover:bg-transparent'
                  }`}
                >
                  Sala de Jantar
                  {selectedCategory === 'Sala de Jantar' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></div>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleCategoryChange('Sala de Estar')}
                  className={`px-0 py-1 font-medium transition-all duration-300 text-lg relative ${
                    selectedCategory === 'Sala de Estar' 
                      ? 'text-[#3e2626]' 
                      : 'text-[#3e2626] hover:text-[#3e2626] hover:bg-transparent'
                  }`}
                >
                  Sala de Estar
                  {selectedCategory === 'Sala de Estar' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></div>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleCategoryChange('Quarto')}
                  className={`px-0 py-1 font-medium transition-all duration-300 text-lg relative ${
                    selectedCategory === 'Quarto' 
                      ? 'text-[#3e2626]' 
                      : 'text-[#3e2626] hover:text-[#3e2626] hover:bg-transparent'
                  }`}
                >
                  Quarto
                  {selectedCategory === 'Quarto' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></div>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleCategoryChange('Cozinha')}
                  className={`px-0 py-1 font-medium transition-all duration-300 text-lg relative ${
                    selectedCategory === 'Cozinha' 
                      ? 'text-[#3e2626]' 
                      : 'text-[#3e2626] hover:text-[#3e2626] hover:bg-transparent'
                  }`}
                >
                  Cozinha
                  {selectedCategory === 'Cozinha' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></div>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleCategoryChange('Exterior')}
                  className={`px-0 py-1 font-medium transition-all duration-300 text-lg relative ${
                    selectedCategory === 'Exterior' 
                      ? 'text-[#3e2626]' 
                      : 'text-[#3e2626] hover:text-[#3e2626] hover:bg-transparent'
                  }`}
                >
                  Exterior
                  {selectedCategory === 'Exterior' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></div>
                  )}
                </Button>

                {/* Clear Filter Button */}
                {selectedCategory !== 'Todos' && selectedCategory !== 'Sala de Estar' && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleCategoryChange('Todos')}
                    className="border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 px-3 py-1 text-sm font-medium transition-all duration-300 ml-2"
                  >
                    Limpar Filtro
                  </Button>
                )}
              </div>
            </div>

            {/* Right Side - View All Button */}
            <div className="flex justify-center lg:justify-end mt-8 lg:mt-0">
              <div className="flex items-center space-x-3">
                {/* Filter Indicator */}
                {selectedCategory !== 'Todos' && (
                  <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-full">
                    <span className="text-sm text-gray-600">
                      Filtro: <span className="font-medium text-[#3e2626]">{selectedCategory}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCategoryChange('Todos')}
                      className="h-6 w-6 p-0 hover:bg-gray-200 rounded-full"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                )}
                
                <Button 
                  size="lg" 
                  onClick={() => router.push('/products')}
                  className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Ver Todos os Produtos</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid - 2x3 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <div key={product.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                {/* Product Image Container */}
                <div className="relative">
                  <div 
                    className="aspect-square flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: product.color }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
                    
                    {/* Product Icon/Visual */}
                    <div className="relative z-10 text-center">
                      <Sofa className="h-20 w-20 text-white/90 mx-auto mb-3 drop-shadow-lg" />
                      <p className="text-white font-semibold text-base">Móvel Premium</p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full blur-sm"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/10 rounded-full blur-sm"></div>
                  </div>

                  {/* Discount Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="w-12 h-12 bg-[#3e2626] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">-10%</span>
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <div className="absolute top-4 right-4">
                    <Button 
                      size="sm" 
                      onClick={() => toggleFavorite(product.id)}
                      className={`w-10 h-10 shadow-lg rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                        favorites.includes(product.id)
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-white/90 hover:bg-white text-[#3e2626]'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Product Info Footer - Dark Background */}
                <div className="bg-[#3e2626] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">
                      {product.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-white">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {product.originalPrice && (
                        <span className="text-lg text-white/70 line-through">
                          R$ {product.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => addToCart(product.id)}
                      className="bg-white text-[#3e2626] hover:bg-gray-100 shadow-lg rounded-full w-12 h-12 p-0 hover:scale-110 transition-all duration-300"
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center mt-12 space-y-4">
              {/* Pagination Info */}
              <div className="text-center text-gray-600">
                <p className="text-sm">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, totalFilteredProducts)} de {totalFilteredProducts} produtos
                  {selectedCategory !== 'Todos' && (
                    <span className="block text-xs mt-1">
                      na categoria <span className="font-medium text-[#3e2626]">{selectedCategory}</span>
                    </span>
                  )}
                </p>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 ${
                      currentPage === page
                        ? 'bg-[#3e2626] text-white hover:bg-[#2a1f1f]'
                        : 'border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white'
                    }`}
                  >
                    {page}
                  </Button>
                ))}

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* View All Products Link */}
              {currentPage === totalPages && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500 mb-3">
                    Quer ver todos os produtos disponíveis?
                  </p>
                  <Button
                    onClick={() => router.push('/products')}
                    className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] px-6 py-2 rounded-full font-medium transition-all duration-300"
                  >
                    Ver Todos os Produtos
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

       {/* Promotional Section */}
       <PromotionalSection />


     {/* Footer */}
     <Footer />
    </div>
  );
}
=======
}
>>>>>>> Stashed changes
