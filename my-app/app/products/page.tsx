'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { useProducts } from '@/lib/hooks/useProducts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Star, 
  Grid, 
  List 
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProductsPage() {
  const { addToCart } = useAppStore();
  const { products, loading, error } = useProducts();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado inicial via URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('cat') || 'all');
  const [selectedColor, setSelectedColor] = useState<string>(searchParams.get('color') || '');
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('max') || '');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>((searchParams.get('sort') as any) || 'name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(((searchParams.get('view') as any) || 'grid') === 'list' ? 'list' : 'grid');
  const [page, setPage] = useState<number>(Number(searchParams.get('page') || 1));
  const pageSize = 12;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
    if (viewMode === 'list') params.set('view', 'list');
    if (page && page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ''}`);
  }, [debouncedTerm, selectedCategory, selectedColor, minPrice, maxPrice, sortBy, viewMode, page, router]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => (p.category || 'outros').toString().toLowerCase())));
    return ['all', ...unique];
  }, [products]);

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
          (product.category?.toString().toLowerCase() === selectedCategory);
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
    setViewMode('grid');
    setPage(1);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Explore nosso catálogo completo</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="md:hidden" onClick={() => setMobileFiltersOpen(v => !v)}>
              <Filter className="h-4 w-4 mr-2" /> Filtros
            </Button>
            <span className="text-sm text-muted-foreground">Visualizar:</span>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar de filtros */}
          <aside className={`lg:col-span-3 ${mobileFiltersOpen ? '' : 'hidden'} md:block`}>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filtros
                </CardTitle>
                <CardDescription>Refine sua busca</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="search" className="mb-2 block">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome ou marca..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category" className="mb-2 block">Categoria</Label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-10 px-3 py-2 border rounded-md bg-background"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat === 'all' ? 'Todas' : cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="color" className="mb-2 block">Cor</Label>
                  <select
                    id="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full h-10 px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">Todas</option>
                    {colors.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="mb-2 block">Preço</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                    <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sort" className="mb-2 block">Ordenar por</Label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
                    className="w-full h-10 px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="name">Nome</option>
                    <option value="price">Preço</option>
                    <option value="stock">Estoque</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary">{filteredProducts.length} itens</Badge>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Conteúdo principal */}
          <section className="lg:col-span-9">
            {loading ? (
              <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className={viewMode === 'list' ? 'flex' : ''}>
                    <CardHeader className={viewMode === 'list' ? 'w-40 p-4' : 'p-4'}>
                      <div className={viewMode === 'list' ? 'h-28 w-full bg-muted rounded-md' : 'aspect-square bg-muted rounded-md'} />
                    </CardHeader>
                    <CardContent className={viewMode === 'list' ? 'flex-1 p-4' : 'p-4'}>
                      <div className={viewMode === 'list' ? 'flex items-start justify-between gap-4' : 'space-y-2'}>
                        <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                          <div className="h-4 w-2/3 bg-muted rounded" />
                          <div className="h-3 w-1/3 bg-muted rounded mt-2" />
                        </div>
                        <div className="text-right">
                          <div className="h-4 w-16 bg-muted rounded ml-auto" />
                        </div>
                      </div>
                      <div className="mt-3 h-8 w-28 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">{error}</p>
              </Card>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">Ajuste os filtros para encontrar o que procura.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                {paginatedProducts.map((product) => (
                  <Card key={product.id} className={viewMode === 'list' ? 'flex' : ''}>
                    <CardHeader className={viewMode === 'list' ? 'w-40 p-4' : 'p-4'}>
                      <div className={viewMode === 'list' ? 'h-28 w-full bg-muted rounded-md overflow-hidden' : 'aspect-square bg-muted rounded-md overflow-hidden'}>
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem imagem</div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className={viewMode === 'list' ? 'flex-1 p-4' : 'p-4'}>
                      <div className={viewMode === 'list' ? 'flex items-start justify-between gap-4' : 'space-y-2'}>
                        <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                          <CardTitle className={viewMode === 'list' ? 'text-base truncate' : 'text-base'}>{product.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {product.brand && `${product.brand} • `}
                            {product.color && `${product.color} • `}
                            {(product.category || 'outros')}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-primary">R$ {Number(product.price).toFixed(2)}</div>
                          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>4.8</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" onClick={() => handleAddToCart(product)} disabled={(product.stock || 0) === 0}>
                          <ShoppingCart className="h-4 w-4 mr-2" /> Adicionar
                        </Button>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          (product.stock || 0) > 10
                            ? 'bg-green-100 text-green-800'
                            : (product.stock || 0) > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(product.stock || 0) > 0 ? `${product.stock} em estoque` : 'Sem estoque'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Paginação */}
            {!loading && sortedProducts.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  Próxima
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
