'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { useProducts } from '@/lib/hooks/useProducts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FavoriteTooltip from '@/components/FavoriteTooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Star, 
  Truck,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  MapPin,
  Sofa,
  Table,
  Armchair,
  Image as ImageIcon,
  Lightbulb,
  Package,
  PlusCircle,
  Boxes,
  Bed,
  Layers,
  Sparkles,
  Shield,
  CreditCard,
  Clock,
  Zap,
  Store
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { customerAPI } from '@/lib/api';
import { toast } from 'sonner';

// Mapeamento de categorias para ícones
const categoryIcons: Record<string, any> = {
  'SOFA': Sofa,
  'MESA': Table,
  'CADEIRA': Armchair,
  'ESTANTE': Boxes,
  'POLTRONA': Layers,
  'QUADRO': ImageIcon,
  'LUMINARIA': Lightbulb,
  'OUTROS': Package,
};

// Nomes legíveis das categorias
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

export default function ProductsPage() {
  const { addToCart, user, isAuthenticated } = useAppStore();
  const { products, loading, error } = useProducts();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // Estado inicial via URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('cat') || 'all');
  const [selectedColor, setSelectedColor] = useState<string>(searchParams.get('color') || '');
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('max') || '');
  const [hasDiscount, setHasDiscount] = useState<boolean>(searchParams.get('discount') === 'true');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>((searchParams.get('sort') as any) || 'name');
  const [page, setPage] = useState<number>(Number(searchParams.get('page') || 1));
  const pageSize = 12;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Estados temporários para preço (não atualizam automaticamente)
  const [tempMinPrice, setTempMinPrice] = useState<string>(searchParams.get('min') || '');
  const [tempMaxPrice, setTempMaxPrice] = useState<string>(searchParams.get('max') || '');

  // Oferta Relâmpago
  const [specialOfferProduct, setSpecialOfferProduct] = useState<Product | null>(null);
  const OFFER_DURATION = 30; // segundos por produto
  const [offerSecondsLeft, setOfferSecondsLeft] = useState(OFFER_DURATION);

  // Debounce de busca
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Sincronizar valores temporários quando os valores atuais mudarem
  useEffect(() => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Persistir estado na URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedTerm) params.set('q', debouncedTerm);
    if (selectedCategory && selectedCategory !== 'all') params.set('cat', selectedCategory);
    if (selectedColor) params.set('color', selectedColor);
    if (minPrice) params.set('min', minPrice);
    if (maxPrice) params.set('max', maxPrice);
    if (hasDiscount) params.set('discount', 'true');
    if (sortBy && sortBy !== 'name') params.set('sort', sortBy);
    if (page && page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ''}`);
  }, [debouncedTerm, selectedCategory, selectedColor, minPrice, maxPrice, hasDiscount, sortBy, page, router]);

  const categories = useMemo(() => {
    // Categorias do banco de dados (uppercase)
    return ['SOFA', 'MESA', 'CADEIRA', 'ESTANTE', 'POLTRONA', 'QUADRO', 'LUMINARIA', 'OUTROS'];
  }, []);

  const colors = useMemo(() => {
    return Array.from(new Set(products.map(p => p.color).filter(Boolean))) as string[];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = debouncedTerm.trim().toLowerCase();
    return products
      .filter((product) => {
        const matchesSearch = !term ||
          product.name.toLowerCase().includes(term) ||
          (product.brand?.toLowerCase().includes(term) ?? false);
        const matchesCategory = selectedCategory === 'all' || 
          product.category?.toString().toUpperCase() === selectedCategory.toUpperCase();
        const matchesColor = !selectedColor || product.color === selectedColor;
        const price = Number(product.price) || 0;
        const matchesMin = !minPrice || minPrice === '' || price >= Number(minPrice);
        const matchesMax = !maxPrice || maxPrice === '' || price <= Number(maxPrice);
        // Filtro de desconto: produtos que estão em promoção
        // Quando o filtro está ativo (hasDiscount = true), mostra apenas produtos com estoque disponível
        // que podem receber desconto (produtos ativos e disponíveis)
        let matchesDiscount = true;
        if (hasDiscount) {
          // Apenas produtos com estoque disponível podem ter desconto
          matchesDiscount = (product.stock || 0) > 0;
        }
        return matchesSearch && matchesCategory && matchesColor && matchesMin && matchesMax && matchesDiscount;
      });
  }, [products, debouncedTerm, selectedCategory, selectedColor, minPrice, maxPrice, hasDiscount]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return Number(a.price) - Number(b.price);
        case 'stock':
          return (b.stock || 0) - (a.stock || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [filteredProducts, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage]);

  // Produtos mais recentes para o banner (primeiros 3 da lista geral)
  const recentProducts = useMemo(() => {
    return products.slice(0, 3);
  }, [products]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedColor('');
    setMinPrice('');
    setMaxPrice('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setHasDiscount(false);
    setSortBy('name');
    setPage(1);
  };

  const applyPriceFilter = () => {
    // Validar se os valores são números válidos
    const min = tempMinPrice.trim() ? Number(tempMinPrice) : '';
    const max = tempMaxPrice.trim() ? Number(tempMaxPrice) : '';
    
    // Validar se min <= max se ambos estiverem preenchidos
    if (min !== '' && max !== '' && min > max) {
      alert('O preço mínimo não pode ser maior que o preço máximo');
      return;
    }
    
    setMinPrice(min !== '' ? String(min) : '');
    setMaxPrice(max !== '' ? String(max) : '');
    setPage(1);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      // Adicionar ao store local (sempre funciona)
      addToCart(product, 1);
      
      // Se estiver autenticado, também adicionar ao backend
      if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
        try {
          await customerAPI.addToCart(product.id, 1);
          // Disparar evento para atualizar notificações imediatamente
          window.dispatchEvent(new CustomEvent('notification:cart-added'));
        } catch (apiError) {
          console.error('Erro ao adicionar ao carrinho no backend:', apiError);
          // Mesmo com erro na API, o item já está no store local
        }
      }
      
      // Mostrar mensagem de sucesso
      toast.success('Produto adicionado ao carrinho!', {
        description: product.name,
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    }
  };

  // Funções para o carrossel de categorias
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    if (categoriesScrollRef.current) {
      setStartX(e.pageX - categoriesScrollRef.current.offsetLeft);
      setScrollLeft(categoriesScrollRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !categoriesScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoriesScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoriesScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Função para obter a localização formatada
  const getUserLocation = () => {
    if (user?.city && user?.state) {
      return `${user.city} - ${user.state}`;
    }
    if (user?.address) {
      return user.address;
    }
    return 'Localização não cadastrada';
  };

  // Seleciona produto aleatório para oferta especial
  const pickRandomProduct = () => {
    if (!products || products.length === 0) return null;
    const inStockProducts = products.filter(p => (p.stock || 0) > 0);
    if (inStockProducts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * inStockProducts.length);
    return inStockProducts[randomIndex];
  };

  // Inicializa oferta e cronômetro quando produtos carregarem
  useEffect(() => {
    if (products && products.length > 0 && !specialOfferProduct) {
      const product = pickRandomProduct();
      setSpecialOfferProduct(product || null);
      setOfferSecondsLeft(OFFER_DURATION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // Cronômetro da oferta
  useEffect(() => {
    if (!specialOfferProduct) return;
    const intervalId = setInterval(() => {
      setOfferSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextProduct = pickRandomProduct();
          setSpecialOfferProduct(nextProduct || null);
          return OFFER_DURATION; // reinicia
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialOfferProduct]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
    
    
    
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Seção de Localização e Categorias */}
        <div className=" flex flex-col lg:flex-row gap-4 mt-6">
          {/* Localização do Usuário */}
          <div className="flex-shrink-0 lg:w-80 mt-6">
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="bg-brand-700 rounded-full p-1.5">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {isAuthenticated && user ? (
                    <>
                      <p className="text-xs text-gray-500">Enviar para</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{getUserLocation()}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500">Entrar para melhor experiência</p>
                      <p className="text-sm font-bold text-gray-900">Cadastre sua localização</p>
                    </>
                  )}
                </div>
                {!isAuthenticated && (
                  <Button
                    onClick={() => router.push('/login')}
                    className="bg-brand-700 hover:bg-brand-700/90 text-white"
                    size="sm"
                  >
                    Criar
                  </Button>
                )}
                {isAuthenticated && (
                  <Button
                    onClick={() => router.push('/profile')}
                    variant="outline"
                    size="sm"
                    className="border-gray-300"
                  >
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Carrossel de Categorias */}
          <div className="flex-1 ">
            <div
              ref={categoriesScrollRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="flex overflow-x-auto overflow-y-visible scrollbar-hide cursor-grab active:cursor-grabbing ml-3 py-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((cat) => {
                const Icon = categoryIcons[cat] || Package;
                const count = products.filter(p => 
                  p.category?.toString().toUpperCase() === cat.toUpperCase()
                ).length;
                const isSelected = selectedCategory?.toUpperCase() === cat.toUpperCase();
                
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="flex flex-col items-center justify-center gap-4 whitespace-nowrap flex-1 min-w-0 px-2"
                  >
                    <div className={`relative w-20 h-20 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'border-brand-600 shadow-lg scale-110'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}>
                      <Icon className={`h-8 w-8 transition-colors duration-200 ${
                        isSelected ? 'text-brand-700' : 'text-brand-700'
                      }`} />
                      {isSelected && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-brand-600 rounded-full" />
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-colors duration-200 ${
                      isSelected ? 'text-brand-700 font-semibold' : 'text-brand-700'
                    }`}>
                      {categoryNames[cat] || cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        

        {/* Título, Banner e Ordenação */}
        <div className="mb-4 space-y-4 ">
          
          {/* Breadcrumbs */}
        <Breadcrumb className="mb-4 mt-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-brand-700 hover:text-brand-800">Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4 text-brand-700" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <span className="font-medium text-brand-700">Produtos</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>


          <div>
            <div>
              <h1 className="text-2xl font-semibold text-brand-700 mb-1">
                {searchTerm ? `Resultados para "${searchTerm}"` : 'Nossos Produtos'}
              </h1>
              <p className="text-sm text-gray-600">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </p>
            </div>
          </div>

          {/* Seção Principal: Oferta Relâmpago e Produtos Recentes */}
          {!searchTerm && (
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Card de Oferta Relâmpago */}
              {specialOfferProduct && (
                <div 
                  className="lg:col-span-3 relative bg-white rounded-lg border-2 border-brand-100 hover:border-brand-300 hover:shadow-xl transition-all duration-200 overflow-hidden group cursor-pointer h-72"
                  onClick={() => router.push(`/products/${specialOfferProduct.id}`)}
                >
                  {/* Badge Oferta Relâmpago - Topo Esquerdo */}
                  <div className="absolute top-3 left-3 z-20">
                    <div className="inline-flex items-center gap-1.5 bg-brand-700 text-black rounded-lg px-3 py-1.5 shadow-lg">
                      <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">Oferta Relâmpago</span>
                    </div>
                  </div>

                  {/* Timer - Topo Direito */}
                  <div className="absolute top-3 right-3 z-20">
                    <div className="inline-flex items-center gap-1.5 bg-red-600 text-white rounded-lg px-3 py-1.5 shadow-lg">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono text-xs font-bold">{formatTime(offerSecondsLeft)}</span>
                    </div>
                  </div>

                  {/* Conteúdo Principal */}
                  <div className="relative z-10 h-full flex flex-row gap-4 pt-14">
                    
                    {/* Seção da Imagem - Esquerda */}
                    <div className="flex-shrink-0 w-40 h-48 items-center justify-center overflow-hidden">
                      {specialOfferProduct.imageUrl ? (
                        <img
                          src={specialOfferProduct.imageUrl}
                          alt={specialOfferProduct.name}
                          className="w-full h-full object-cover pl-5  group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Seção de Informações - Direita */}
                    <div className="flex-1 flex flex-col justify-between h-[calc(100%-3.5rem)]">
                      
                      {/* Informações do Produto */}
                      <div className="space-y-2">
                        {/* Nome do Produto */}
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight">
                          {specialOfferProduct.name}
                        </h3>
                        
                        {/* Preço Original e Badge */}
                        {specialOfferProduct.price && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-500 line-through">
                              R$ {specialOfferProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded uppercase">
                              -30% OFF
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Seção de Preços */}
                      {specialOfferProduct.price && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 font-medium">Por apenas</p>
                          <div className="text-2xl font-bold text-brand-700">
                            R$ {(specialOfferProduct.price * 0.7).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Economia de R$ {(specialOfferProduct.price * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          
                          {/* Botão de ação */}
                          <div >
                            <div className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:text-brand-800 transition-colors">
                              <span>Ver oferta</span>
                              <ChevronRight className="h-4 w-4 text-brand-700 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Banner de Produtos Recentes */}
              {recentProducts.length > 0 && (
                <div className="lg:col-span-9 relative bg-gradient-to-br from-white to-brand-50/20 border-2 border-brand-200 rounded-xl shadow-md overflow-hidden h-72">
                  <div 
                    className="relative w-full h-full bg-cover bg-top"
                    style={{
                      backgroundImage: `url(/productsPage/banner-products.svg)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'top right',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {/* Overlay com tom marrom sutil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-900/5 via-brand-700/3 to-transparent"></div>
                    
                    {/* Conteúdo do Banner */}
                    <div className="relative z-10 h-full p-6 flex items-center justify-between gap-4">
                      {/* Logo e Texto */}
                      <div className="flex flex-col items-center gap-4 flex-1">
                        <div className="flex-shrink-0">
                          <img
                            src="/logoCompleta.svg"
                            alt="MobiliAI"
                            className="h-38 w-auto"
                          />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-black text-brand-800">
                            Confira Nossos{' '}
                            <span className="text-brand-700">
                              Produtos Mais Recentes
                            </span>
                          </h3>
                          <p className="text-lg lg:text-sm text-brand-700/80 font-medium">
                            Descubra as últimas novidades em móveis e decoração
                          </p>
                        </div>
                      </div>

                      {/* Preview de Produtos Mais Recentes */}
                      <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                        {recentProducts.map((product, idx) => (
                          <div
                            key={product.id}
                            className="relative group cursor-pointer"
                            style={{ zIndex: 3 - idx }}
                            onClick={() => router.push(`/products/${product.id}`)}
                          >
                            <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-white bg-white shadow-lg hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 transition-all duration-300">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            {idx < recentProducts.length - 1 && (
                              <div className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-1/2 w-1.5 h-1.5 bg-brand-600 rounded-full border border-white shadow-sm"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          )}

          {/* Ordenação */}
          <div className="flex items-center justify-end mt-4 mb-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
                className="border-2 border-brand-200 rounded-lg px-4 py-2 text-sm font-medium text-brand-700 bg-white hover:border-brand-400 hover:bg-brand-50/50 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200 transition-colors"
              >
                <option value="name">Ordenar por: Mais relevantes</option>
                <option value="price">Menor preço</option>
                <option value="stock">Maior estoque</option>
              </select>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar de filtros estilo Mercado Livre */}
          <aside className={`lg:col-span-3 ${mobileFiltersOpen ? '' : 'hidden'} lg:block`}>
            <div className="bg-white rounded-lg shadow-sm border-2 border-brand-100 sticky top-20 p-3">
             

              {/* Frete Grátis */}
              <div className="mb-3 pb-3 border-b border-brand-100">
                <h3 className="text-xs font-semibold text-brand-700 mb-1.5 border-b border-brand-100 pb-1">Envio</h3>
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <Truck className="h-3.5 w-3.5 text-brand-600" />
                  <span className="text-xs text-gray-700">Frete grátis</span>
                </label>
              </div>

              {/* Categoria */}
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-brand-700 mb-1.5 border-b border-brand-100 pb-1">Categoria</h3>
                <div className="space-y-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={selectedCategory === 'all'}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-3.5 h-3.5 border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-xs text-gray-700">Todas as categorias</span>
                  </label>
                    {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-3.5 h-3.5 border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-xs text-gray-700">
                        {categoryNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-auto">
                        ({products.filter(p => p.category?.toString().toUpperCase() === cat.toUpperCase()).length})
                      </span>
                    </label>
                  ))}
                </div>
                </div>

              {/* Cor */}
              {colors.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-xs font-semibold text-brand-700 mb-1.5 border-b border-brand-100 pb-1">Cor</h3>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="">Todas as cores</option>
                    {colors.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preço */}
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-brand-700 mb-1.5 border-b border-brand-100 pb-1">Preço</h3>
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <Input
                      type="number"
                      placeholder="Mín"
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          applyPriceFilter();
                        }
                      }}
                      className="text-xs h-8"
                      min="0"
                      step="0.01"
                    />
                    <Input
                      type="number"
                      placeholder="Máx"
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          applyPriceFilter();
                        }
                      }}
                      className="text-xs h-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      onClick={applyPriceFilter}
                      size="sm"
                      className="flex-1 bg-brand-700 border border-black hover:bg-brand-800 text-black cursor-pointer h-7 text-xs"
                    >
                      Aplicar
                    </Button>
                    {(minPrice || maxPrice) && (
                      <Button
                        onClick={() => {
                          setTempMinPrice('');
                          setTempMaxPrice('');
                          setMinPrice('');
                          setMaxPrice('');
                          setPage(1);
                        }}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2 border-brand-300 text-brand-700 hover:bg-brand-50"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                  {(minPrice || maxPrice) && (
                    <p className="text-[10px] text-gray-600 text-center">
                      {minPrice && maxPrice 
                        ? `R$ ${Number(minPrice).toLocaleString('pt-BR')} - R$ ${Number(maxPrice).toLocaleString('pt-BR')}`
                        : minPrice
                        ? `A partir de R$ ${Number(minPrice).toLocaleString('pt-BR')}`
                        : `Até R$ ${Number(maxPrice).toLocaleString('pt-BR')}`
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Desconto */}
              <div className="mb-3 pb-3 border-b border-brand-100">
                <h3 className="text-xs font-semibold text-brand-700 mb-1.5 border-b border-brand-100 pb-1">Desconto</h3>
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={hasDiscount}
                    onChange={(e) => {
                      setHasDiscount(e.target.checked);
                      setPage(1);
                    }}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-700">Produtos com desconto</span>
                </label>
              </div>

              {/* Limpar filtros */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full mt-2 border-brand-300 text-brand-700 hover:bg-brand-50 hover:border-brand-400 h-7 text-xs"
              >
                Limpar filtros
              </Button>
                </div>
          </aside>

          {/* Conteúdo principal */}
          <section className="lg:col-span-9">
            {/* Botão de filtros mobile */}
              <Button
              variant="outline"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="mb-4 lg:hidden w-full border-brand-300 text-brand-700 hover:bg-brand-50 hover:border-brand-400"
            >
              <Filter className="h-4 w-4 mr-2 text-brand-700" />
              Filtros
              {mobileFiltersOpen && <ChevronDown className="h-4 w-4 ml-2 text-brand-700" />}
            </Button>

            

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-sm text-gray-600 mb-4">Tente ajustar os filtros para encontrar o que procura.</p>
                <Button onClick={clearFilters}>Limpar filtros</Button>
              </div>
            ) : (
              <>
                {/* Grid de produtos estilo Mercado Livre */}
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {paginatedProducts.map((product) => {
                    const hasDiscount = false; // Pode adicionar lógica de desconto
                    const rating = product.rating || 0; // Rating real do banco
                    const reviews = product.reviewCount || 0; // Reviews reais do banco
                    
                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg border-2 border-brand-100 hover:border-brand-300 hover:shadow-xl transition-all duration-200 overflow-hidden group cursor-pointer"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        {/* Imagem do produto */}
                        <div className="relative aspect-square bg-gray-100 overflow-hidden group">
                        {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              Sem imagem
                            </div>
                          )}
                          {hasDiscount && (
                            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                              -30%
                            </Badge>
                          )}
                          {/* Favorite Tooltip */}
                          <FavoriteTooltip productId={product.id} />
                        </div>

                        {/* Conteúdo do produto */}
                        <div className="p-4 space-y-3">
                          {/* Título */}
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">
                            {product.name}
                          </h3>

                          {/* Marca, categoria e loja */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            {product.brand && <span>{product.brand}</span>}
                            {product.category && (
                              <>
                                <span>•</span>
                                <span>{product.category}</span>
                              </>
                            )}
                            {product.storeName && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1 text-brand-700">
                                  <Store className="h-3 w-3" />
                                  <span>{product.storeName}</span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Rating */}
                          {rating > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium text-gray-900 ml-1">
                                  {rating.toFixed(1)}
                                </span>
                              </div>
                              {reviews > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({reviews > 1000 ? `${(reviews / 1000).toFixed(1)}k` : reviews} {reviews === 1 ? 'avaliação' : 'avaliações'})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Preço */}
                          <div className="space-y-1">
                            {hasDiscount && (
                              <div className="text-xs text-gray-500 line-through">
                                R$ {(Number(product.price) * 1.3).toFixed(2)}
                              </div>
                            )}
                            <div className="text-2xl font-bold text-brand-700">
                              R$ {Number(product.price).toFixed(2)}
                            </div>
                            {hasDiscount && (
                              <div className="text-xs text-green-600 font-medium">
                                30% OFF em PIX
                              </div>
                            )}
                          </div>

                          {/* Parcelamento */}
                          <div className="text-xs text-green-600 font-medium">
                            18x R$ {(Number(product.price) / 18).toFixed(2)} sem juros
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2">
                            {(product.stock || 0) > 10 && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Truck className="h-3 w-3" />
                                <span>Frete grátis</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-brand-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Compra garantida</span>
                        </div>
                      </div>

                          {/* Botão de adicionar ao carrinho */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={(product.stock || 0) === 0}
                            className="w-full bg-brand-700 hover:bg-brand-800 text-white shadow-md hover:shadow-lg transition-all"
                            size="sm"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {(product.stock || 0) === 0 ? 'Sem estoque' : 'Adicionar ao carrinho'}
                        </Button>

                          {/* Estoque */}
                          {(product.stock || 0) > 0 && (product.stock || 0) <= 10 && (
                            <div className="text-xs text-orange-600 font-medium">
                              Restam apenas {product.stock} em estoque!
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

            {/* Paginação */}
                {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                  Anterior
                </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                  Próxima
                </Button>
              </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
