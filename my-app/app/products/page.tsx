'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { useProducts } from '@/lib/hooks/useProducts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
  Zap
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>((searchParams.get('sort') as any) || 'name');
  const [page, setPage] = useState<number>(Number(searchParams.get('page') || 1));
  const pageSize = 12;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  // Persistir estado na URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedTerm) params.set('q', debouncedTerm);
    if (selectedCategory && selectedCategory !== 'all') params.set('cat', selectedCategory);
    if (selectedColor) params.set('color', selectedColor);
    if (minPrice) params.set('min', minPrice);
    if (maxPrice) params.set('max', maxPrice);
    if (sortBy && sortBy !== 'name') params.set('sort', sortBy);
    if (page && page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ''}`);
  }, [debouncedTerm, selectedCategory, selectedColor, minPrice, maxPrice, sortBy, page, router]);

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
        const matchesMin = !minPrice || price >= Number(minPrice);
        const matchesMax = !maxPrice || price <= Number(maxPrice);
        return matchesSearch && matchesCategory && matchesColor && matchesMin && matchesMax;
      });
  }, [products, debouncedTerm, selectedCategory, selectedColor, minPrice, maxPrice]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedColor('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('name');
    setPage(1);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
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
    <div className="min-h-screen bg-gray-50">
    
    

      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Seção de Localização e Categorias */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          {/* Localização do Usuário */}
          <div className="flex-shrink-0 lg:w-80">
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
              className="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing ml-3"
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
                    className="flex flex-col items-center justify-center gap-4 whitespace-nowrap flex-1 min-w-0"
                  >
                    <div className={`relative w-20 h-20 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'border-brand-600 shadow-lg scale-110'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}>
                      <Icon className={`h-8 w-8 transition-colors duration-200 ${
                        isSelected ? 'text-brand-700' : 'text-gray-700'
                      }`} />
                      {isSelected && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-brand-600 rounded-full" />
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-colors duration-200 ${
                      isSelected ? 'text-brand-700 font-semibold' : 'text-gray-700'
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
              <BreadcrumbLink href="/">Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <span className="font-medium text-gray-900">Produtos</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>


          <div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                {searchTerm ? `Resultados para "${searchTerm}"` : 'Nossos Produtos'}
              </h1>
              <p className="text-sm text-gray-600">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </p>
            </div>
          </div>

          {/* Oferta Relâmpago e Banner Publicitário */}
          {!searchTerm && (
            <div className="mb-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Oferta Relâmpago */}
              {specialOfferProduct && (
                <div 
                  className="lg:col-span-3 relative bg-gradient-to-br from-white via-gray-50/30 to-white border border-gray-200 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl hover:border-[#3e2626]/30 transition-all duration-300 group h-full"
                  onClick={() => router.push(`/products/${specialOfferProduct.id}`)}
                >
                  {/* Background Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3e2626]/5 via-transparent to-red-500/5 opacity-50"></div>
                  
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.03]">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 30px 30px, rgba(0,0,0,0.1) 2px, transparent 2px)`,
                      backgroundSize: '60px 60px'
                    }}></div>
                  </div>

                  {/* Oferta Relâmpago Badge */}
                  <div className="absolute top-3 left-3 z-20 transform -rotate-1">
                    <div className="relative inline-flex items-center gap-1.5 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-xl px-3 py-1.5 shadow-xl border border-[#3e2626]/20">
                      <Zap className="h-4 w-4 fill-yellow-300 text-yellow-300 transform rotate-12 animate-pulse" />
                      <span className="text-xs font-extrabold tracking-tight">Oferta Relâmpago</span>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="absolute top-3 right-3 z-20 transform rotate-1">
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold shadow-xl border border-red-400/30">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-mono">{formatTime(offerSecondsLeft)}</span>
                    </div>
                  </div>

                  {/* Conteúdo Principal */}
                  <div className="relative z-10 px-4 pb-4 pt-12">
                    <div className="flex flex-col items-center text-center gap-3">
                      {/* Imagem do Produto */}
                      {specialOfferProduct.imageUrl ? (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 p-0.5 shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <div className="w-full h-full rounded-lg overflow-hidden border border-white bg-white">
                            <img
                              src={specialOfferProduct.imageUrl}
                              alt={specialOfferProduct.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-md">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      {/* Info do Produto */}
                      <div className="w-full space-y-2">
                        {/* Categoria/Brand */}
                        <div className="flex items-center justify-center gap-1.5">
                          {specialOfferProduct.brand && (
                            <>
                              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                {specialOfferProduct.brand}
                              </span>
                              <span className="text-gray-300 text-xs">•</span>
                            </>
                          )}
                          <span className="text-xs font-semibold text-gray-600 uppercase">
                            {specialOfferProduct.category}
                          </span>
                        </div>

                        {/* Título */}
                        <h3 className="text-gray-900 font-black text-sm leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-[#3e2626] transition-colors px-1">
                          {specialOfferProduct.name}
                        </h3>
                        
                        {/* Preços */}
                        <div className="space-y-1">
                          {specialOfferProduct.price && (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-xs line-through text-gray-400 font-semibold">
                                R$ {specialOfferProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white text-xs font-black shadow-sm">
                                -30%
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline justify-center gap-0.5">
                            <span className="text-xs font-bold text-gray-600">R$</span>
                            <span className="text-2xl font-black text-[#3e2626] leading-none">
                              {(specialOfferProduct.price ? specialOfferProduct.price * 0.7 : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center justify-center pt-0.5">
                          <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-2.5 py-1 shadow-sm">
                            <Truck className="h-3 w-3 mr-1" />
                            <span className="text-xs font-bold">Frete Grátis</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Banner Publicitário */}
              {paginatedProducts.length > 0 && (
                <div className="lg:col-span-9 h-full">
                  <div className="bg-gradient-to-br from-white via-brand-400/5 to-brand-700/5 border border-gray-200 rounded-xl shadow-lg overflow-hidden w-full h-full flex flex-col hover:shadow-xl transition-all duration-300">
                    {/* Label Ad */}
                    <div className="px-3 pt-1.5 pb-1 bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-100">
                      <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">PUBLICIDADE</span>
                    </div>
                    
                    {/* Conteúdo do Banner */}
                    <div className="grid grid-cols-12 items-center gap-4 px-8 py-2 h-full">
                      {/* Logo e Branding */}
                      <div className="col-span-3 flex items-center">
                        <div className="flex items-center">
                          <img
                            src="/logoCompleta.svg"
                            alt="MobiliAI"
                            className="h-32 md:h-48 w-auto"
                          />
                        </div>
                      </div>

                      {/* Chamada */}
                      <div className="col-span-6 min-w-0 md:pl-4 pl-3 md:border-l md:border-gray-200">
                        <h3 className="text-2xl font-black text-gray-900 leading-snug mb-1">
                          Produtos Exclusivos com{' '}
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 to-brand-600">
                            Inteligência Artificial
                          </span>
                        </h3>
                        <p className="text-base text-gray-600 font-semibold leading-tight">
                          Descubra móveis únicos e aproveite ofertas imperdíveis
                        </p>
                      </div>

                      {/* Preview de Produtos */}
                      <div className="hidden lg:grid col-span-3 grid-cols-3 gap-3 justify-items-end">
                        {paginatedProducts.slice(0, 3).map((product, idx) => (
                          <div
                            key={product.id}
                            className="relative group"
                            style={{ zIndex: 3 - idx }}
                          >
                            <div className="w-full aspect-square max-w-none rounded-xl overflow-hidden border-2 border-white bg-white shadow-md hover:shadow-lg hover:border-brand-300 hover:-translate-y-0.5 transition-all duration-300">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            {idx < 2 && (
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
         <div className="flex items-center justify-end mt-16">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:border-brand-500"
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-20 p-4">
              {/* Buscar */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Buscar</h3>
                  <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                    placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

              {/* Frete Grátis */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Envio</h3>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <Truck className="h-4 w-4 text-brand-600" />
                  <span className="text-sm text-gray-700">Frete grátis</span>
                </label>
              </div>

              {/* Categoria */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Categoria</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={selectedCategory === 'all'}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-4 h-4 border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">Todas as categorias</span>
                  </label>
                    {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-4 h-4 border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700">
                        {categoryNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        ({products.filter(p => p.category?.toString().toLowerCase() === cat).length})
                      </span>
                    </label>
                  ))}
                </div>
                </div>

              {/* Cor */}
              {colors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Cor</h3>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Todas as cores</option>
                    {colors.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preço */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Preço</h3>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="text-sm"
                  />
                </div>
                </div>

              {/* Limpar filtros */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
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
              className="mb-4 lg:hidden w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {mobileFiltersOpen && <ChevronDown className="h-4 w-4 ml-2" />}
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
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedProducts.map((product) => {
                    const hasDiscount = false; // Pode adicionar lógica de desconto
                    const rating = 4.5 + Math.random() * 0.5; // Rating aleatório entre 4.5 e 5
                    const reviews = Math.floor(Math.random() * 5000) + 100; // Reviews aleatórias
                    
                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        {/* Imagem do produto */}
                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
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
                        </div>

                        {/* Conteúdo do produto */}
                        <div className="p-4 space-y-3">
                          {/* Título */}
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">
                            {product.name}
                          </h3>

                          {/* Marca e categoria */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {product.brand && <span>{product.brand}</span>}
                            {product.category && (
                              <>
                                <span>•</span>
                                <span>{product.category}</span>
                              </>
                            )}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-900 ml-1">
                                {rating.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              | {reviews > 1000 ? `${(reviews / 1000).toFixed(1)}k` : reviews} vendidos
                            </span>
                          </div>

                          {/* Preço */}
                          <div className="space-y-1">
                            {hasDiscount && (
                              <div className="text-xs text-gray-500 line-through">
                                R$ {(Number(product.price) * 1.3).toFixed(2)}
                              </div>
                            )}
                            <div className="text-2xl font-bold text-gray-900">
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
                            className="w-full bg-brand-700 hover:bg-brand-700/90 text-white"
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
