'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  Search,
  Percent,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { Loader } from '@/components/ui/ai/loader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  applicableTo: 'ALL' | 'CATEGORY' | 'PRODUCT' | 'STORE';
  categoryId?: string;
  productId?: string;
  storeId?: string;
  assignmentType?: 'EXCLUSIVE' | 'ALL_ACCOUNTS' | 'NEW_ACCOUNTS_ONLY';
  couponType?: 'PRODUCT' | 'SHIPPING';
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  store?: {
    id: string;
    name: string;
  };
}

export default function CouponsPage() {
  const router = useRouter();
  const { user, token } = useAppStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Estados para listas de seleção
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    minimumPurchase: undefined as number | undefined,
    maximumDiscount: undefined as number | undefined,
    usageLimit: undefined as number | undefined,
    validFrom: '',
    validUntil: '',
    applicableTo: 'ALL' as 'ALL' | 'CATEGORY' | 'PRODUCT' | 'STORE',
    categoryId: '',
    productId: '',
    storeId: '',
    isActive: true,
    assignmentType: 'EXCLUSIVE' as 'EXCLUSIVE' | 'ALL_ACCOUNTS' | 'NEW_ACCOUNTS_ONLY',
    couponType: 'PRODUCT' as 'PRODUCT' | 'SHIPPING',
  });

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'STORE_MANAGER') {
      router.push('/');
      return;
    }

    loadCoupons();
    loadOptions();
  }, [token, user, router]);

  const loadOptions = async () => {
    try {
      setIsLoadingOptions(true);
      
      // Carregar categorias
      const categoriesList = [
        { value: 'SOFA', label: 'Sofá' },
        { value: 'MESA', label: 'Mesa' },
        { value: 'CADEIRA', label: 'Cadeira' },
        { value: 'ARMARIO', label: 'Armário' },
        { value: 'ESTANTE', label: 'Estante' },
        { value: 'POLTRONA', label: 'Poltrona' },
        { value: 'QUADRO', label: 'Quadro' },
        { value: 'LUMINARIA', label: 'Luminária' },
        { value: 'MESA_CENTRO', label: 'Mesa de centro' },
      ];
      setCategories(categoriesList);

      // Carregar produtos (carregar mais páginas se necessário)
      try {
        let allProducts: any[] = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore && page <= 5) {
          const productsData = await adminAPI.getProducts(page, 100);
          if (productsData?.products && productsData.products.length > 0) {
            allProducts = [...allProducts, ...productsData.products];
            hasMore = productsData.products.length === 100;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        setProducts(allProducts.map((p: any) => ({ id: p.id, name: p.name })));
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      }

      // Carregar lojas
      try {
        const storesData = await adminAPI.getStores();
        if (Array.isArray(storesData)) {
          setStores(storesData.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (error) {
        console.error('Erro ao carregar lojas:', error);
      }
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.getCoupons();
      setCoupons(data);
    } catch (error: any) {
      toast.error('Erro ao carregar cupons', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const formatForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      minimumPurchase: undefined,
      maximumDiscount: undefined,
      usageLimit: undefined,
      validFrom: formatForInput(now),
      validUntil: formatForInput(oneMonthLater),
      applicableTo: 'ALL',
      categoryId: '',
      productId: '',
      storeId: '',
      isActive: true,
      assignmentType: 'EXCLUSIVE',
      couponType: 'PRODUCT',
    });
    setSelectedCoupon(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    const assignmentType = (coupon as any).assignmentType || 'EXCLUSIVE';
    const usageLimit = assignmentType === 'NEW_ACCOUNTS_ONLY' ? 1 : (coupon.usageLimit || undefined);
    
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minimumPurchase: coupon.minimumPurchase ? Number(coupon.minimumPurchase) : undefined,
      maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : undefined,
      usageLimit: usageLimit,
      validFrom: (() => {
        const validFromDate = new Date(coupon.validFrom);
        const localValidFrom = new Date(validFromDate.getTime() - validFromDate.getTimezoneOffset() * 60000);
        return localValidFrom.toISOString().slice(0, 16);
      })(),
      validUntil: (() => {
        const validUntilDate = new Date(coupon.validUntil);
        const localValidUntil = new Date(validUntilDate.getTime() - validUntilDate.getTimezoneOffset() * 60000);
        return localValidUntil.toISOString().slice(0, 16);
      })(),
      applicableTo: coupon.applicableTo,
      categoryId: coupon.categoryId || '',
      productId: coupon.productId || '',
      storeId: coupon.storeId || '',
      isActive: coupon.isActive,
      assignmentType: assignmentType,
      couponType: (coupon as any).couponType || 'PRODUCT',
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (formData.applicableTo === 'CATEGORY' && !formData.categoryId) {
        toast.error('Por favor, selecione uma categoria');
        return;
      }
      if (formData.applicableTo === 'PRODUCT' && !formData.productId) {
        toast.error('Por favor, selecione um produto');
        return;
      }
      if (formData.applicableTo === 'STORE' && !formData.storeId) {
        toast.error('Por favor, selecione uma loja');
        return;
      }

      const validFromLocal = new Date(formData.validFrom);
      const validUntilLocal = new Date(formData.validUntil);
      const now = new Date();
      const oneMinuteFromNow = new Date(now.getTime() + 60000);
      
      let validFromISO: string;
      if (validFromLocal <= oneMinuteFromNow) {
        validFromISO = now.toISOString();
      } else {
        validFromISO = validFromLocal.toISOString();
      }
      
      const validUntilISO = validUntilLocal.toISOString();
      const finalUsageLimit = formData.assignmentType === 'NEW_ACCOUNTS_ONLY' ? 1 : formData.usageLimit;
      
      const payload: any = {
        ...formData,
        usageLimit: finalUsageLimit,
        validFrom: validFromISO,
        validUntil: validUntilISO,
      };

      if (!payload.minimumPurchase) delete payload.minimumPurchase;
      if (!payload.maximumDiscount) delete payload.maximumDiscount;
      if (!payload.usageLimit) delete payload.usageLimit;
      if (!payload.description) delete payload.description;
      
      if (payload.applicableTo !== 'CATEGORY') {
        if (!payload.categoryId) delete payload.categoryId;
      }
      if (payload.applicableTo !== 'PRODUCT') {
        if (!payload.productId) delete payload.productId;
      }
      if (payload.applicableTo !== 'STORE') {
        if (!payload.storeId) delete payload.storeId;
      } else {
        if (!payload.storeId || payload.storeId.trim() === '') {
          toast.error('Por favor, selecione uma loja válida');
          return;
        }
        payload.storeId = payload.storeId.trim();
      }

      if (selectedCoupon) {
        await adminAPI.updateCoupon(selectedCoupon.id, payload);
        toast.success('Cupom atualizado com sucesso!');
      } else {
        await adminAPI.createCoupon(payload);
        toast.success('Cupom criado com sucesso!');
      }

      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedCoupon(null);
      loadCoupons();
    } catch (error: any) {
      toast.error('Erro ao salvar cupom', {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Tem certeza que deseja deletar o cupom ${coupon.code}?`)) {
      return;
    }

    try {
      await adminAPI.deleteCoupon(coupon.id);
      toast.success('Cupom deletado com sucesso!');
      loadCoupons();
    } catch (error: any) {
      toast.error('Erro ao deletar cupom', {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Código copiado!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar código');
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [coupons, searchTerm]);

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) {
      return <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">Inativo</Badge>;
    }

    if (now < validFrom) {
      return <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">Aguardando</Badge>;
    }

    if (now > validUntil) {
      return <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">Expirado</Badge>;
    }

    return <Badge variant="outline" className="border-border bg-muted/50 text-foreground">Ativo</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = useMemo(() => {
    const now = new Date();
    const active = coupons.filter(c => {
      if (!c.isActive) return false;
      const validFrom = new Date(c.validFrom);
      const validUntil = new Date(c.validUntil);
      return now >= validFrom && now <= validUntil;
    }).length;
    const expired = coupons.filter(c => {
      const validUntil = new Date(c.validUntil);
      return now > validUntil;
    }).length;
    const totalUsed = coupons.reduce((sum, c) => sum + c.usedCount, 0);
    
    return { total: coupons.length, active, expired, totalUsed };
  }, [coupons]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader size={40} className="mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando cupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-3xl border border-border bg-[#3e2626] px-8 py-10 text-primary-foreground shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <Badge
              variant="outline"
              className="border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
            >
              Gestão de Promoções
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Gerenciar Cupons de Desconto
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Crie e gerencie cupons promocionais para produtos, categorias ou lojas específicas.
                Configure descontos percentuais ou valores fixos com controle total sobre validade e uso.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleCreate} 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Cupom
              </Button>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-4 sm:grid-cols-2 lg:max-w-xl">
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <Ticket className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.total}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Total de cupons</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <CheckCircle className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.active}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Cupons ativos</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <XCircle className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.expired}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Expirados</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.totalUsed}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Usos totais</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Card */}
      <Card className="border border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar cupons por código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      {filteredCoupons.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum cupom encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece criando seu primeiro cupom de desconto.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreate} className="bg-[#3e2626] hover:bg-[#5a3a3a]">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Cupom
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredCoupons.map((coupon) => (
            <Card key={coupon.id} className="border border-border shadow-sm transition hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{coupon.code}</h3>
                          {getStatusBadge(coupon)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {coupon.description && (
                          <p className="text-sm text-muted-foreground">{coupon.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {coupon.applicableTo !== 'ALL' && (
                      <div>
                        <Badge variant="outline" className="mr-2">
                          {coupon.applicableTo === 'CATEGORY' && 'Categoria: '}
                          {coupon.applicableTo === 'PRODUCT' && 'Produto: '}
                          {coupon.applicableTo === 'STORE' && 'Loja: '}
                          {coupon.applicableTo === 'CATEGORY' && (
                            categories.find(c => c.value === coupon.categoryId)?.label || coupon.categoryId
                          )}
                          {coupon.applicableTo === 'PRODUCT' && (
                            products.find(p => p.id === coupon.productId)?.name || coupon.productId || 'Produto não encontrado'
                          )}
                          {coupon.applicableTo === 'STORE' && (
                            coupon.store?.name || 
                            stores.find(s => s.id === coupon.storeId)?.name || 
                            (coupon.storeId ? `Loja ID: ${coupon.storeId}` : 'Loja não encontrada')
                          )}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant="outline" 
                        className="border-border bg-muted/50 text-muted-foreground"
                      >
                        {(coupon as any).couponType === 'SHIPPING' ? 'Frete' : 'Produtos'}
                        {!(coupon as any).couponType && 'Produtos'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="border-border bg-muted/50 text-muted-foreground"
                      >
                        {coupon.assignmentType === 'EXCLUSIVE' && 'Exclusivo'}
                        {coupon.assignmentType === 'ALL_ACCOUNTS' && 'Todas as Contas'}
                        {coupon.assignmentType === 'NEW_ACCOUNTS_ONLY' && 'Primeira Compra'}
                        {!coupon.assignmentType && 'Exclusivo'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Desconto</p>
                        <p className="text-base font-semibold text-foreground">
                          {coupon.discountType === 'PERCENTAGE' ? (
                            <>{coupon.discountValue}%</>
                          ) : (
                            <>{formatCurrency(coupon.discountValue)}</>
                          )}
                        </p>
                      </div>
                      {coupon.minimumPurchase && (
                        <div className="rounded-xl border border-border bg-muted/30 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Compra mínima</p>
                          <p className="text-base font-semibold text-foreground">{formatCurrency(coupon.minimumPurchase)}</p>
                        </div>
                      )}
                      <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Usos</p>
                        <p className="text-base font-semibold text-foreground">
                          {coupon.usedCount} total
                          {coupon.usageLimit && (
                            <span className="text-xs text-muted-foreground block">Limite: {coupon.usageLimit}x/cliente</span>
                          )}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Válido até</p>
                        <p className="text-base font-semibold text-foreground">{formatDate(coupon.validUntil)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 lg:flex-col lg:ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                      className="flex-1 lg:flex-none"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(coupon)}
                      className="flex-1 lg:flex-none"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedCoupon(null);
          setProductSearchTerm('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do cupom de desconto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Código do Cupom *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="EXEMPLO123"
                />
              </div>
              <div>
                <Label htmlFor="discountType">Tipo de Desconto *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: 'PERCENTAGE' | 'FIXED') =>
                    setFormData({ ...formData, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do cupom (opcional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountValue">
                  Valor do Desconto * {formData.discountType === 'PERCENTAGE' ? '(%)' : '(R$)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maximumDiscount">
                  Desconto Máximo {formData.discountType === 'PERCENTAGE' ? '(R$)' : ''}
                </Label>
                <Input
                  id="maximumDiscount"
                  type="number"
                  min="0"
                  value={formData.maximumDiscount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maximumDiscount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minimumPurchase">Compra Mínima (R$)</Label>
                <Input
                  id="minimumPurchase"
                  type="number"
                  min="0"
                  value={formData.minimumPurchase || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimumPurchase: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label htmlFor="usageLimit">Limite de Uso por Cliente</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  value={formData.usageLimit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageLimit: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Opcional"
                  disabled={formData.assignmentType === 'NEW_ACCOUNTS_ONLY'}
                  className={formData.assignmentType === 'NEW_ACCOUNTS_ONLY' ? 'bg-muted cursor-not-allowed' : ''}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.assignmentType === 'NEW_ACCOUNTS_ONLY' 
                    ? 'Para cupons de primeira compra, o limite é automaticamente 1 uso por cliente'
                    : 'Número máximo de vezes que cada cliente pode usar este cupom'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validFrom">Válido de *</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Válido até *</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="applicableTo">Aplicável a</Label>
              <Select
                value={formData.applicableTo}
                onValueChange={(value: 'ALL' | 'CATEGORY' | 'PRODUCT' | 'STORE') => {
                  setFormData({ 
                    ...formData, 
                    applicableTo: value,
                    categoryId: value !== 'CATEGORY' ? '' : formData.categoryId,
                    productId: value !== 'PRODUCT' ? '' : formData.productId,
                    storeId: value !== 'STORE' ? '' : formData.storeId,
                  });
                  if (value !== 'PRODUCT') {
                    setProductSearchTerm('');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Produtos</SelectItem>
                  <SelectItem value="CATEGORY">Categoria Específica</SelectItem>
                  <SelectItem value="PRODUCT">Produto Específico</SelectItem>
                  <SelectItem value="STORE">Loja Específica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="couponType">Tipo de Cupom *</Label>
                <Select
                  value={formData.couponType}
                  onValueChange={(value: 'PRODUCT' | 'SHIPPING') =>
                    setFormData({ ...formData, couponType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCT">Para Produtos</SelectItem>
                    <SelectItem value="SHIPPING">Para Frete</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.couponType === 'PRODUCT' && 'Desconto aplicado nos produtos'}
                  {formData.couponType === 'SHIPPING' && 'Desconto aplicado no frete'}
                </p>
              </div>
              <div>
                <Label htmlFor="assignmentType">Tipo de Atribuição *</Label>
                <Select
                  value={formData.assignmentType}
                  onValueChange={(value: 'EXCLUSIVE' | 'ALL_ACCOUNTS' | 'NEW_ACCOUNTS_ONLY') => {
                    const newFormData = {
                      ...formData,
                      assignmentType: value,
                      usageLimit: value === 'NEW_ACCOUNTS_ONLY' ? 1 : formData.usageLimit,
                    };
                    setFormData(newFormData);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCLUSIVE">Exclusivo (precisa digitar o código)</SelectItem>
                    <SelectItem value="ALL_ACCOUNTS">Atribuído a qualquer conta</SelectItem>
                    <SelectItem value="NEW_ACCOUNTS_ONLY">Somente para primeira compra</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.assignmentType === 'EXCLUSIVE' && 'O cliente precisa digitar o código do cupom manualmente'}
                  {formData.assignmentType === 'ALL_ACCOUNTS' && 'O cupom aparecerá automaticamente para todos os clientes'}
                  {formData.assignmentType === 'NEW_ACCOUNTS_ONLY' && 'O cupom aparecerá automaticamente apenas para clientes que ainda não fizeram nenhuma compra. O limite de uso será automaticamente 1.'}
                </p>
              </div>
            </div>

            {formData.applicableTo === 'CATEGORY' && (
              <div>
                <Label htmlFor="categoryId">Selecione a Categoria *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.applicableTo === 'PRODUCT' && (
              <div>
                <Label htmlFor="productId">Selecione o Produto *</Label>
                {isLoadingOptions ? (
                  <div className="text-sm text-muted-foreground">Carregando produtos...</div>
                ) : (
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, productId: value });
                      setProductSearchTerm('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] p-0">
                      <div className="sticky top-0 z-10 bg-background border-b border-border p-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                          <Input
                            placeholder="Buscar produto por nome..."
                            value={productSearchTerm}
                            onChange={(e) => {
                              e.stopPropagation();
                              setProductSearchTerm(e.target.value);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                                e.stopPropagation();
                              }
                            }}
                            onFocus={(e) => {
                              e.stopPropagation();
                            }}
                            className="pl-10 h-9 w-full"
                            autoFocus
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-[300px] overflow-y-auto">
                        {products.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            Nenhum produto encontrado
                          </div>
                        ) : (() => {
                          const filteredProducts = products.filter((product) =>
                            product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
                          );
                          
                          if (filteredProducts.length === 0) {
                            return (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                Nenhum produto encontrado com "{productSearchTerm}"
                              </div>
                            );
                          }
                          
                          return filteredProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ));
                        })()}
                      </div>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {formData.applicableTo === 'STORE' && (
              <div>
                <Label htmlFor="storeId">Selecione a Loja *</Label>
                {isLoadingOptions ? (
                  <div className="text-sm text-muted-foreground">Carregando lojas...</div>
                ) : (
                  <Select
                    value={formData.storeId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, storeId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma loja" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.length === 0 ? (
                        <SelectItem value="" disabled>
                          Nenhuma loja encontrada
                        </SelectItem>
                      ) : (
                        stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Cupom ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedCoupon(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-[#3e2626] hover:bg-[#5a3a3a]">
              {selectedCoupon ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
