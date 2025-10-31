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
  CreditCard
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
                <div className="bg-blue-600 rounded-full p-1.5">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
                        ? 'border-blue-500 shadow-lg scale-110'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}>
                      <Icon className={`h-8 w-8 transition-colors duration-200 ${
                        isSelected ? 'text-blue-600' : 'text-gray-700'
                      }`} />
                      {isSelected && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-colors duration-200 ${
                      isSelected ? 'text-blue-600 font-semibold' : 'text-gray-700'
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
        <div className="mb-4 space-y-4">
          
          {/* Breadcrumbs */}
        <Breadcrumb className="mb-4 mt-16">
          <BreadcrumbList className="mt-16">
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


          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 ">
              <h1 className="text-2xl font-semibold text-gray-900">
                {searchTerm ? `Resultados para "${searchTerm}"` : 'Nossos Produtos'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </p>
            </div>
            
            {/* Banner de Produtos Recém-Chegados */}
            {!searchTerm && paginatedProducts.length > 0 && (
              <div className="flex-[3] min-w-0 mb-8">
                <div className="bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden w-full">
                  {/* Label Ad */}
                  <div className="px-8 pt-4 pb-2 bg-gray-50/50">
                    <span className="text-xs text-gray-400 font-medium tracking-wide">PUBLICIDADE</span>
                  </div>
                  
                  {/* Conteúdo do Banner */}
                  <div className="flex items-center gap-8 px-8 py-6">
                    {/* Logo e Texto */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-100">
                          <Package className="h-10 w-10 text-white" />
                        </div>
          <div>
                          <div className="text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                            Mobili<span className="text-blue-600">AI</span>
                          </div>
                          <div className="text-sm text-gray-600 font-medium">Pinturas & Acabamentos</div>
                        </div>
                      </div>
                    </div>

                    {/* Linha divisória */}
                    <div className="hidden md:block h-20 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>

                    {/* Chamada */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
                        Confira produtos incríveis e aproveite as melhores ofertas!
                      </h3>
                      <button className="text-blue-600 hover:text-blue-700 font-semibold text-base inline-flex items-center gap-2 group transition-colors">
                        Ir para a loja
                        <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* Preview de Produtos */}
                    <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
                      {paginatedProducts.slice(0, 3).map((product, idx) => (
                        <div
                          key={product.id}
                          className="relative group"
                        >
                          <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-gray-100 bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-200">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ordenação */}
          <div className="flex items-center justify-end ">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:border-market-blue-light"
            >
              <option value="name">Ordenar por: Mais relevantes</option>
              <option value="price">Menor preço</option>
              <option value="stock">Maior estoque</option>
            </select>
          </div>

          {/* Badges de Benefícios */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium">Compra 100% segura</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Frete grátis acima de R$ 299</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium">Garantia de qualidade</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Pagamento em até 12x</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
                    className="w-4 h-4 rounded border-gray-300 text-market-blue-light focus:ring-market-blue-light"
                  />
                  <Truck className="h-4 w-4 text-market-blue-light" />
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
                      className="w-4 h-4 border-gray-300 text-market-blue-light focus:ring-market-blue-light"
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
                        className="w-4 h-4 border-gray-300 text-market-blue-light focus:ring-market-blue-light"
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
                            <div className="flex items-center gap-1 text-xs text-blue-600">
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
                            className="w-full bg-market-blue-light hover:bg-market-blue-light/90 text-white"
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
