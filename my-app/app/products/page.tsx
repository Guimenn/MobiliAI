'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { useProducts } from '@/lib/hooks/useProducts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FavoriteTooltip from '@/components/FavoriteTooltip';
import ProductCard from '@/components/ProductCard';
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
import { showAlert } from '@/lib/alerts';

// Mapeamento de categorias para ícones
const categoryIcons: Record<string, any> = {
  'SOFA': Sofa,
  'MESA': Table,
  'CADEIRA': Armchair,
  'ESTANTE': Boxes,
  'POLTRONA': Layers,
  'QUADRO': ImageIcon,
  'LUMINARIA': Lightbulb,
  'MESA_CENTRO': Package,
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
  'MESA_CENTRO': 'Mesa de centro',
};

export default function ProductsPage() {
  const { addToCart, user, isAuthenticated } = useAppStore();
  const { products, loading, error } = useProducts();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // Estado inicial via URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  // Ler tanto 'category' quanto 'cat' para compatibilidade
  const categoryParam = (searchParams.get('category') || searchParams.get('cat') || 'all').toUpperCase();
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
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

  // Atualizar categoria quando a URL mudar (ex: quando vem da home)
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || searchParams.get('cat') || 'all';
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

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
    if (selectedCategory && selectedCategory.toUpperCase() !== 'ALL') params.set('cat', selectedCategory);
    if (selectedColor) params.set('color', selectedColor);
    if (minPrice) params.set('min', minPrice);
    if (maxPrice) params.set('max', maxPrice);
    if (hasDiscount) params.set('discount', 'true');
    if (sortBy && sortBy !== 'name') params.set('sort', sortBy);
    if (page && page > 1) params.set('page', String(page));
    const qs = params.toString();
    const newUrl = `/products${qs ? `?${qs}` : ''}`;
    
    // Só atualiza se a URL for diferente da atual
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false });
      // Scroll para o topo quando categoria mudar
      if (selectedCategory) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [debouncedTerm, selectedCategory, selectedColor, minPrice, maxPrice, hasDiscount, sortBy, page, router]);

  const categories = useMemo(() => {
    // Categorias do banco de dados (uppercase)
    return ['SOFA', 'MESA', 'CADEIRA', 'ESTANTE', 'POLTRONA', 'QUADRO', 'LUMINARIA', 'MESA_CENTRO'];
  }, []);

  const colors = useMemo(() => {
    return Array.from(new Set(products.map(p => p.color).filter(Boolean))) as string[];
  }, [products]);

  // Função para verificar se uma oferta está ativa (dentro do período de datas)
  const isSaleActive = useCallback((product: Product): boolean => {
    const now = new Date();
    
    // Verificar oferta relâmpago primeiro (tem prioridade)
    if (product.isFlashSale && product.flashSaleStartDate && product.flashSaleEndDate) {
      try {
        const start = new Date(product.flashSaleStartDate);
        const end = new Date(product.flashSaleEndDate);
        
        // Verificar se as datas são válidas
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.warn('⚠️ Datas inválidas para produto:', product.name, {
            start: product.flashSaleStartDate,
            end: product.flashSaleEndDate
          });
          return false;
        }
        
        // Verificar se a oferta já expirou
        if (now > end) {
          return false;
        }
        
        // Verificar se a oferta está ativa (já começou) OU vai começar nas próximas 24 horas
        const timeUntilStart = start.getTime() - now.getTime();
        const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
        const isActive = now >= start && now <= end;
        const startsWithin24Hours = timeUntilStart > 0 && timeUntilStart <= (24 * 60 * 60 * 1000); // 24 horas
        
        // Considerar ativa se já está ativa OU se vai começar nas próximas 24 horas
        const shouldShow = isActive || startsWithin24Hours;
        
        // Log detalhado para debug
        const timeUntilEnd = end.getTime() - now.getTime();
        
        console.log('🔍 [PRODUTOS] Verificando oferta relâmpago:', {
          produto: product.name,
          produtoId: product.id,
          agora: now.toISOString(),
          inicio: start.toISOString(),
          fim: end.toISOString(),
          inicioOriginal: product.flashSaleStartDate,
          fimOriginal: product.flashSaleEndDate,
          tempoAteInicio: timeUntilStart > 0 ? `${Math.round(timeUntilStart / 1000 / 60)} minutos` : timeUntilStart < 0 ? `há ${Math.round(Math.abs(timeUntilStart) / 1000 / 60)} minutos` : 'agora',
          tempoAteFim: timeUntilEnd > 0 ? `${Math.round(timeUntilEnd / 1000 / 60)} minutos` : timeUntilEnd < 0 ? `há ${Math.round(Math.abs(timeUntilEnd) / 1000 / 60)} minutos` : 'agora',
          horasAteInicio: Math.round(hoursUntilStart * 10) / 10,
          isActive: isActive,
          startsWithin24Hours: startsWithin24Hours,
          shouldShow: shouldShow,
          condicao1: now >= start ? '✅ já começou' : `⏳ começa em ${Math.round(hoursUntilStart * 10) / 10}h`,
          condicao2: now <= end ? '✅ ainda não expirou' : '❌ já expirou'
        });
        
        if (shouldShow) {
          if (isActive) {
            console.log('✅ [PRODUTOS] Oferta relâmpago ATIVA para:', product.name);
          } else {
            console.log('⏳ [PRODUTOS] Oferta relâmpago COMEÇANDO EM BREVE para:', product.name, `(em ${Math.round(hoursUntilStart * 10) / 10} horas)`);
          }
        }
        
        return shouldShow;
      } catch (error) {
        console.error('❌ Erro ao verificar oferta relâmpago:', error, product);
        return false;
      }
    }
    
    // Verificar oferta normal
    if (product.isOnSale && product.saleStartDate && product.saleEndDate) {
      try {
        const start = new Date(product.saleStartDate);
        const end = new Date(product.saleEndDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return false;
        }
        
        return now >= start && now <= end;
      } catch (error) {
        console.error('❌ Erro ao verificar oferta normal:', error, product);
        return false;
      }
    }
    
    return false;
  }, []);

  // Função para verificar se a oferta relâmpago está REALMENTE ativa (já começou)
  const isFlashSaleActuallyActive = useCallback((product: Product): boolean => {
    if (!product.isFlashSale || !product.flashSaleStartDate || !product.flashSaleEndDate) {
      return false;
    }
    try {
      const now = new Date();
      const start = new Date(product.flashSaleStartDate);
      const end = new Date(product.flashSaleEndDate);
      return now >= start && now <= end;
    } catch {
      return false;
    }
  }, []);

  // Função para obter o preço atual (com oferta se ativa)
  const getCurrentPrice = useCallback((product: Product): number => {
    // Prioridade para oferta relâmpago - APENAS se estiver REALMENTE ativa (já começou)
    if (product.isFlashSale && isFlashSaleActuallyActive(product)) {
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
    
    // Depois oferta normal - APENAS se estiver ativa
    if (product.isOnSale && product.saleStartDate && product.saleEndDate) {
      try {
        const now = new Date();
        const start = new Date(product.saleStartDate);
        const end = new Date(product.saleEndDate);
        if (now >= start && now <= end) {
          // Se tem saleDiscountPercent, calcular baseado no percentual
          if (product.saleDiscountPercent !== undefined && product.saleDiscountPercent !== null && product.price) {
            const discount = (Number(product.price) * Number(product.saleDiscountPercent)) / 100;
            return Number(product.price) - discount;
          }
          // Se não tem percentual mas tem salePrice, usar ele
          if (product.salePrice) {
            return Number(product.salePrice);
          }
        }
      } catch {
        // Erro ao verificar datas, usar preço normal
      }
    }
    
    return Number(product.price);
  }, [isFlashSaleActuallyActive]);

  const filteredProducts = useMemo(() => {
    const term = debouncedTerm.trim().toLowerCase();
    return products
      .filter((product) => {
        const matchesSearch = !term ||
          product.name.toLowerCase().includes(term) ||
          (product.brand?.toLowerCase().includes(term) ?? false);
        const matchesCategory = !selectedCategory || selectedCategory.toUpperCase() === 'ALL' || 
          product.category?.toString().toUpperCase() === selectedCategory.toUpperCase();
        const matchesColor = !selectedColor || product.color === selectedColor;
        const currentPrice = getCurrentPrice(product);
        const matchesMin = !minPrice || minPrice === '' || currentPrice >= Number(minPrice);
        const matchesMax = !maxPrice || maxPrice === '' || currentPrice <= Number(maxPrice);
        // Filtro de desconto: produtos que estão em oferta ativa
        let matchesDiscount = true;
        if (hasDiscount) {
          matchesDiscount = isSaleActive(product);
        }
        return matchesSearch && matchesCategory && matchesColor && matchesMin && matchesMax && matchesDiscount;
      });
  }, [products, debouncedTerm, selectedCategory, selectedColor, minPrice, maxPrice, hasDiscount, isSaleActive, getCurrentPrice]);

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
      showAlert('error', 'O preço mínimo não pode ser maior que o preço máximo');
      return;
    }
    
    setMinPrice(min !== '' ? String(min) : '');
    setMaxPrice(max !== '' ? String(max) : '');
    setPage(1);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      // addToCart do store já gerencia backend automaticamente quando autenticado
      await addToCart(product, 1);
      
      // Disparar evento para atualizar notificações imediatamente
      if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
        window.dispatchEvent(new CustomEvent('notification:cart-added'));
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

  // Função para obter a localização formatada completa
  const getUserLocation = () => {
    if (!user) return 'Localização não cadastrada';
    
    const parts: string[] = [];
    
    if (user.address) {
      parts.push(user.address);
    }
    if (user.city && user.state) {
      parts.push(`${user.city} - ${user.state}`);
    } else if (user.city) {
      parts.push(user.city);
    } else if (user.state) {
      parts.push(user.state);
    }
    if (user.zipCode) {
      const formattedZip = user.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2');
      parts.push(`CEP ${formattedZip}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Localização não cadastrada';
  };
  
  // Função auxiliar para obter endereço resumido (apenas cidade-estado)
  const getUserLocationShort = () => {
    if (!user) return 'Localização não cadastrada';
    if (user.city && user.state) {
      return `${user.city} - ${user.state}`;
    }
    if (user.city) return user.city;
    if (user.state) return user.state;
    return 'Localização não cadastrada';
  };

  // Função para calcular tempo restante da oferta relâmpago
  const getTimeRemaining = useCallback((product: Product): number => {
    if (!product.flashSaleEndDate) return 0;
    const now = new Date();
    const end = new Date(product.flashSaleEndDate);
    const start = product.flashSaleStartDate ? new Date(product.flashSaleStartDate) : null;
    
    // Se a oferta ainda não começou, calcular tempo até o início
    if (start && now < start) {
      const diff = Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000));
      return diff;
    }
    
    // Se a oferta já começou, calcular tempo até o fim
    const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    return diff;
  }, []);

  // Seleciona produto com oferta relâmpago REALMENTE ativa (já começou)
  const pickFlashSaleProduct = useCallback(() => {
    if (!products || products.length === 0) return null;
    
    // Buscar produtos com oferta relâmpago REALMENTE ativa (já começou)
    const flashSaleProducts = products.filter(p => isFlashSaleActuallyActive(p) && p.isFlashSale);
    
    if (flashSaleProducts.length > 0) {
      // Selecionar aleatoriamente entre os produtos com oferta ativa
      const randomIndex = Math.floor(Math.random() * flashSaleProducts.length);
      return flashSaleProducts[randomIndex];
    }
    
    return null;
  }, [products, isFlashSaleActuallyActive]);

  // Inicializa produto em destaque quando produtos carregarem
  useEffect(() => {
    if (products && products.length > 0) {
      // Debug: Verificar produtos com oferta relâmpago
      const flashSaleProducts = products.filter(p => p.isFlashSale);
      console.log('🔍 [PRODUTOS] Produtos com isFlashSale=true:', flashSaleProducts.length);
      
      // Verificar quais estão REALMENTE ativas (já começaram)
      const actuallyActiveProducts = products.filter(p => isFlashSaleActuallyActive(p) && p.isFlashSale);
      console.log('✅ [PRODUTOS] Produtos com oferta relâmpago REALMENTE ATIVA (já começou):', actuallyActiveProducts.length);
      
      flashSaleProducts.forEach(p => {
        const isActuallyActive = isFlashSaleActuallyActive(p);
        console.log(`  - ${p.name}:`, {
          id: p.id,
          isFlashSale: p.isFlashSale,
          flashSaleStartDate: p.flashSaleStartDate,
          flashSaleEndDate: p.flashSaleEndDate,
          flashSaleDiscountPercent: p.flashSaleDiscountPercent,
          flashSalePrice: p.flashSalePrice,
          isActuallyActive: isActuallyActive,
          isSaleActive: isSaleActive(p) // Para comparar
        });
      });
      
      const product = pickFlashSaleProduct();
      console.log('🎯 [PRODUTOS] Produto selecionado para oferta relâmpago:', product?.name || 'Nenhum');
      
      if (product) {
        setSpecialOfferProduct(product);
        const timeRemaining = getTimeRemaining(product);
        setOfferSecondsLeft(timeRemaining > 0 ? timeRemaining : OFFER_DURATION);
        console.log('✅ [PRODUTOS] Oferta relâmpago configurada para:', product.name);
      } else {
        // Se não houver oferta ativa, não mostrar nenhum produto
        console.log('❌ [PRODUTOS] Nenhuma oferta relâmpago ativa encontrada');
        setSpecialOfferProduct(null);
        setOfferSecondsLeft(0);
      }
    }
  }, [products, isFlashSaleActuallyActive, pickFlashSaleProduct, getTimeRemaining, isSaleActive]);

  // Cronômetro da oferta relâmpago - atualiza baseado no tempo real restante
  useEffect(() => {
    if (!specialOfferProduct) return;
    
    // Verificar se a oferta ainda está realmente ativa
    if (!isFlashSaleActuallyActive(specialOfferProduct)) {
      console.log('⏰ [PRODUTOS] Oferta expirou ou ainda não começou, buscando próxima...');
      const nextProduct = pickFlashSaleProduct();
      if (nextProduct) {
        setSpecialOfferProduct(nextProduct);
        const nextTimeRemaining = getTimeRemaining(nextProduct);
        setOfferSecondsLeft(nextTimeRemaining > 0 ? nextTimeRemaining : 0);
      } else {
        setSpecialOfferProduct(null);
        setOfferSecondsLeft(0);
      }
      return;
    }
    
    // Atualizar timer imediatamente
    const updateTimer = () => {
      // Verificar novamente se ainda está ativa
      if (!isFlashSaleActuallyActive(specialOfferProduct)) {
        const nextProduct = pickFlashSaleProduct();
        if (nextProduct) {
          setSpecialOfferProduct(nextProduct);
          const nextTimeRemaining = getTimeRemaining(nextProduct);
          setOfferSecondsLeft(nextTimeRemaining > 0 ? nextTimeRemaining : 0);
        } else {
          setSpecialOfferProduct(null);
          setOfferSecondsLeft(0);
        }
        return;
      }
      
      const timeRemaining = getTimeRemaining(specialOfferProduct);
      if (timeRemaining > 0) {
        setOfferSecondsLeft(timeRemaining);
      } else {
        // Se a oferta expirou, buscar próximo produto
        const nextProduct = pickFlashSaleProduct();
        if (nextProduct) {
          setSpecialOfferProduct(nextProduct);
          const nextTimeRemaining = getTimeRemaining(nextProduct);
          setOfferSecondsLeft(nextTimeRemaining > 0 ? nextTimeRemaining : 0);
        } else {
          // Se não houver mais ofertas ativas, remover o produto e ocultar o card
          setSpecialOfferProduct(null);
          setOfferSecondsLeft(0);
        }
      }
    };
    
    // Atualizar imediatamente
    updateTimer();
    
    // Atualizar a cada segundo
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [specialOfferProduct, products, isFlashSaleActuallyActive, pickFlashSaleProduct, getTimeRemaining]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
    
    
    
      <Header />

      <main className="container mx-auto px-4 py-6">
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

        {/* Título */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-brand-700 mb-1">
            {searchTerm ? `Resultados para "${searchTerm}"` : 'Nossos Produtos'}
          </h1>
          <p className="text-sm text-gray-600">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
        </div>

        {/* Seção Principal: Banner e Oferta Relâmpago */}
          {!searchTerm && (() => {
            // Verificar se há oferta relâmpago REALMENTE ativa (já começou)
            const hasActiveFlashSale = specialOfferProduct && isFlashSaleActuallyActive(specialOfferProduct) && specialOfferProduct.isFlashSale;
            
            return (
              <div className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Card de Oferta Relâmpago - só mostra se houver oferta ativa */}
                {hasActiveFlashSale && specialOfferProduct && (() => {
                const originalFlashPrice = Number(specialOfferProduct.price);
                const isFlashActive = isSaleActive(specialOfferProduct) && specialOfferProduct.isFlashSale;
                let currentFlashPrice: number;
                let flashDiscountPercent = 0;
                
                // Calcular desconto se houver oferta relâmpago configurada
                if (specialOfferProduct.isFlashSale) {
                  // Calcular preço com desconto baseado no flashSaleDiscountPercent
                  if (specialOfferProduct.flashSaleDiscountPercent && specialOfferProduct.flashSaleDiscountPercent > 0) {
                    flashDiscountPercent = specialOfferProduct.flashSaleDiscountPercent;
                    // SEMPRE calcular o preço com desconto para visualização
                    const discount = (originalFlashPrice * flashDiscountPercent) / 100;
                    currentFlashPrice = originalFlashPrice - discount;
                  } else if (specialOfferProduct.flashSalePrice) {
                    const flashPrice = Number(specialOfferProduct.flashSalePrice);
                    // SEMPRE usar o preço de oferta para visualização
                    currentFlashPrice = flashPrice;
                    // Calcular percentual de desconto baseado no flashSalePrice
                    if (flashPrice < originalFlashPrice) {
                      flashDiscountPercent = Math.round(((originalFlashPrice - flashPrice) / originalFlashPrice) * 100);
                    }
                  } else {
                    currentFlashPrice = isFlashActive ? getCurrentPrice(specialOfferProduct) : originalFlashPrice;
                    if (currentFlashPrice < originalFlashPrice) {
                      flashDiscountPercent = Math.round(((originalFlashPrice - currentFlashPrice) / originalFlashPrice) * 100);
                    }
                  }
                } else {
                  // Sem oferta relâmpago configurada
                  currentFlashPrice = originalFlashPrice;
                }
                
                const savings = originalFlashPrice > currentFlashPrice ? originalFlashPrice - currentFlashPrice : 0;
                // Sempre mostrar desconto se houver oferta configurada, mesmo que não esteja ativa
                const hasDiscount = flashDiscountPercent > 0;
                
                return (
                  <div 
                    className="lg:col-span-3 relative bg-white rounded-lg border-2 border-yellow-400 hover:border-yellow-500 hover:shadow-xl transition-all duration-200 overflow-hidden group cursor-pointer h-72 shadow-yellow-100"
                    onClick={() => router.push(`/products/${specialOfferProduct.id}`)}
                  >
                    {/* Badge Oferta Relâmpago - Topo Esquerdo */}
                    <div className="absolute top-3 left-3 z-20">
                      <div className="inline-flex items-center gap-1.5 bg-yellow-500 text-white rounded-lg px-3 py-1.5 shadow-lg animate-pulse">
                        <Zap className="h-4 w-4 fill-white text-white" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">Oferta Relâmpago</span>
                        {flashDiscountPercent > 0 && (
                          <span className="ml-1 text-[10px] font-bold">-{flashDiscountPercent}%</span>
                        )}
                      </div>
                    </div>

                    {/* Timer - Topo Direito */}
                    {offerSecondsLeft > 0 && (
                      <div className="absolute top-3 right-3 z-20">
                        <div className="inline-flex items-center gap-1.5 bg-red-600 text-white rounded-lg px-3 py-1.5 shadow-lg">
                          <Clock className="h-4 w-4" />
                          <span className="font-mono text-xs font-bold">{formatTime(offerSecondsLeft)}</span>
                        </div>
                      </div>
                    )}

                    {/* Conteúdo Principal */}
                    <div className="relative z-10 h-full flex flex-row gap-4 pt-14">
                      
                      {/* Seção da Imagem - Esquerda */}
                      <div className="flex-shrink-0 w-40 h-48 items-center justify-center overflow-hidden">
                        {(() => {
                          const imageUrl = specialOfferProduct.imageUrl;
                          
                          return imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={specialOfferProduct.name}
                              className="w-full h-full object-cover pl-5 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-300" />
                            </div>
                          );
                        })()}
                      </div>

                      {/* Seção de Informações - Direita */}
                      <div className="flex-1 flex flex-col justify-between h-[calc(100%-3.5rem)]">
                        
                        {/* Informações do Produto */}
                        <div className="space-y-2">
                          {/* Nome do Produto */}
                          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight">
                            {specialOfferProduct.name}
                          </h3>
                          
                          {/* Preço Original e Badge - mostrar se houver desconto configurado */}
                          {hasDiscount && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-500 line-through">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalFlashPrice)}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded uppercase">
                                -{flashDiscountPercent}% OFF
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Seção de Preços */}
                        {currentFlashPrice && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-600 font-medium">Por apenas</p>
                            <div className="text-2xl font-bold text-brand-700">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentFlashPrice)}
                            </div>
                            {savings > 0 && (
                              <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Economia de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(savings)}
                              </p>
                            )}
                            
                            {/* Botão de ação */}
                            <div>
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
                );
              })()}

              {/* Banner de Produtos Recentes - expande quando não há oferta relâmpago */}
              {recentProducts.length > 0 && (
                <div className={`relative bg-gradient-to-br from-white to-brand-50/20 border-2 border-brand-200 rounded-xl shadow-md overflow-hidden h-72 ${
                  hasActiveFlashSale ? 'lg:col-span-9' : 'lg:col-span-12'
                }`}>
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
                            src="/logotipos/8.svg"
                            alt="MobiliAI"
                            className="h-38 w-auto"
                          />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-2xl font-black text-brand-800 text-center">
                            Confira Nossos{' '}
                            <span className="text-brand-700">
                              Produtos Mais Recentes
                            </span>
                          </h3>
                          <p className="text-md lg:text-md text-brand-700/80 font-medium text-center">
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
                              {(() => {
                                const imageUrl = product.imageUrls && product.imageUrls.length > 0 
                                  ? product.imageUrls[0] 
                                  : product.imageUrl;
                                
                                return imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                      console.error('Erro ao carregar imagem:', imageUrl);
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                    <Package className="h-4 w-4 text-gray-400" />
                                  </div>
                                );
                              })()}
                              <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
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
            );
          })()}

        {/* Seção de Localização e Categorias */}
        <div className="flex flex-col lg:flex-row gap-4 mt-6 mb-6">
          {/* Localização do Usuário */}
          <div className="flex-shrink-0 lg:w-80">
            <div className="bg-white border border-[#3e2626]/10 rounded-xl w-[350px] mt-7 p-5 shadow-sm hover:shadow-md transition-shadow ">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-[#3e2626] to-[#2d1a1a] rounded-full p-2 flex-shrink-0 shadow-sm">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {isAuthenticated && user ? (
                    <>
                      <p className="text-xs text-[#3e2626]/60 font-medium mb-1">Enviar para</p>
                      {user.address ? (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-[#3e2626] leading-tight">{user.address}</p>
                          <p className="text-xs text-[#3e2626]/70 leading-tight">
                            {[user.city, user.state].filter(Boolean).join(' - ')}
                            {user.zipCode && ` • CEP ${user.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}`}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-[#3e2626]">
                          {getUserLocationShort()}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-[#3e2626]/60 font-medium mb-1">Entrar para melhor experiência</p>
                      <p className="text-sm font-semibold text-[#3e2626]">Cadastre sua localização</p>
                    </>
                  )}
                </div>
                {!isAuthenticated && (
                  <Button
                    onClick={() => router.push('/login')}
                    className="bg-[#3e2626] hover:bg-[#2d1a1a] text-white shadow-sm flex-shrink-0"
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
                    className="border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626]/5 flex-shrink-0 shadow-sm"
                  >
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Carrossel de Categorias e Ordenação */}
          <div className="flex-1 flex flex-col">
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
                    onClick={() => {
                      // Se a categoria já está selecionada, desseleciona (volta para 'all')
                      // Caso contrário, seleciona a categoria clicada
                      setSelectedCategory(isSelected ? 'all' : cat);
                    }}
                    className="flex flex-col items-center justify-center gap-3 whitespace-nowrap flex-1 min-w-0 px-2 py-2 rounded-xl transition-all duration-200"
                  >
                    <div className={`relative w-20 h-20 rounded-full border-[3px] flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'border-[#3e2626] bg-[#3e2626] shadow-xl shadow-[#3e2626]/30 scale-110 ring-4 ring-[#3e2626]/20'
                        : 'bg-white border-gray-300 hover:border-brand-400 hover:shadow-lg hover:bg-brand-50/50'
                    }`}>
                      <Icon className={`h-8 w-8 transition-colors duration-200 ${
                        isSelected ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <span className={`text-xs font-medium transition-all duration-200 px-2 py-1 rounded-md ${
                      isSelected 
                        ? 'text-brand-700 font-bold bg-brand-100' 
                        : 'text-gray-700 hover:text-brand-700'
                    }`}>
                      {categoryNames[cat] || cat}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Ordenação */}
            <div className="flex items-center justify-end mt-2 mb-4 pr-3">
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
                      checked={selectedCategory?.toUpperCase() === 'ALL'}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                      }}
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
                        checked={selectedCategory?.toUpperCase() === cat.toUpperCase()}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                        }}
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
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="default"
                      showFavorite={true}
                      showAddToCart={true}
                    />
                  ))}
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
