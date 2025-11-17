'use client';

import { useState, useEffect } from 'react';
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
  Calendar,
  Percent,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
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
        
        while (hasMore && page <= 5) { // Limitar a 5 páginas (500 produtos)
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
    // Definir data de início como agora e data de fim como 30 dias a partir de agora
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    // Converter para formato datetime-local (YYYY-MM-DDTHH:mm)
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
    });
    setSelectedCoupon(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minimumPurchase: coupon.minimumPurchase ? Number(coupon.minimumPurchase) : undefined,
      maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : undefined,
      usageLimit: coupon.usageLimit || undefined,
      // Converter de UTC para datetime-local (formato YYYY-MM-DDTHH:mm)
      // Ajustar para timezone local
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
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      // Validar campos obrigatórios baseado no tipo de aplicabilidade
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

      // Converter datetime-local para ISO string corretamente
      // datetime-local retorna "YYYY-MM-DDTHH:mm" sem timezone
      // Quando você cria new Date("2025-11-17T16:00"), o JavaScript interpreta como horário local
      // Mas quando converte para ISO, vira UTC, causando diferença de timezone
      
      // Solução: tratar como horário local e converter manualmente para UTC
      const validFromLocal = new Date(formData.validFrom);
      const validUntilLocal = new Date(formData.validUntil);
      
      // Se validFrom for no futuro muito próximo (menos de 1 minuto), usar agora
      // Isso garante que cupons criados "para agora" funcionem imediatamente
      const now = new Date();
      const oneMinuteFromNow = new Date(now.getTime() + 60000);
      
      let validFromISO: string;
      if (validFromLocal <= oneMinuteFromNow) {
        // Se a data de início é muito próxima de agora ou no passado, usar agora
        validFromISO = now.toISOString();
      } else {
        validFromISO = validFromLocal.toISOString();
      }
      
      const validUntilISO = validUntilLocal.toISOString();
      
      const payload: any = {
        ...formData,
        validFrom: validFromISO,
        validUntil: validUntilISO,
      };

      // Remover campos vazios
      if (!payload.minimumPurchase) delete payload.minimumPurchase;
      if (!payload.maximumDiscount) delete payload.maximumDiscount;
      if (!payload.usageLimit) delete payload.usageLimit;
      if (!payload.categoryId) delete payload.categoryId;
      if (!payload.productId) delete payload.productId;
      if (!payload.storeId) delete payload.storeId;
      if (!payload.description) delete payload.description;

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

  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) {
      return <Badge variant="destructive">Inativo</Badge>;
    }

    if (now < validFrom) {
      return <Badge variant="secondary">Aguardando</Badge>;
    }

    if (now > validUntil) {
      return <Badge variant="outline">Expirado</Badge>;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="outline">Esgotado</Badge>;
    }

    return <Badge className="bg-green-500">Ativo</Badge>;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#3e2626] flex items-center gap-2">
            <Ticket className="h-8 w-8" />
            Gerenciar Cupons
          </h1>
          <p className="text-gray-600 mt-1">Crie e gerencie cupons de desconto</p>
        </div>
        <Button onClick={handleCreate} className="bg-[#3e2626] hover:bg-[#5a3a3a]">
          <Plus className="h-4 w-4 mr-2" />
          Criar Cupom
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar cupons por código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredCoupons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum cupom encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredCoupons.map((coupon) => (
            <Card key={coupon.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-[#3e2626]">{coupon.code}</h3>
                      {getStatusBadge(coupon)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(coupon.code)}
                        className="h-8 w-8 p-0"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {coupon.description && (
                      <p className="text-gray-600 mb-3">{coupon.description}</p>
                    )}
                    
                    {/* Mostrar aplicabilidade específica */}
                    {coupon.applicableTo !== 'ALL' && (
                      <div className="mb-3">
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
                            stores.find(s => s.id === coupon.storeId)?.name || coupon.store?.name || coupon.storeId || 'Loja não encontrada'
                          )}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Desconto:</span>
                        <p className="font-semibold text-[#3e2626]">
                          {coupon.discountType === 'PERCENTAGE' ? (
                            <>{coupon.discountValue}%</>
                          ) : (
                            <>{formatCurrency(coupon.discountValue)}</>
                          )}
                        </p>
                      </div>
                      {coupon.minimumPurchase && (
                        <div>
                          <span className="text-gray-500">Compra mínima:</span>
                          <p className="font-semibold">{formatCurrency(coupon.minimumPurchase)}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Usos:</span>
                        <p className="font-semibold">
                          {coupon.usedCount} / {coupon.usageLimit || '∞'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Válido até:</span>
                        <p className="font-semibold">{formatDate(coupon.validUntil)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(coupon)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedCoupon(null);
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
                <Label htmlFor="usageLimit">Limite de Uso</Label>
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
                />
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
                onValueChange={(value: 'ALL' | 'CATEGORY' | 'PRODUCT' | 'STORE') =>
                  setFormData({ 
                    ...formData, 
                    applicableTo: value,
                    // Limpar seleções quando mudar o tipo
                    categoryId: value !== 'CATEGORY' ? '' : formData.categoryId,
                    productId: value !== 'PRODUCT' ? '' : formData.productId,
                    storeId: value !== 'STORE' ? '' : formData.storeId,
                  })
                }
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

            {/* Campo condicional para Categoria */}
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

            {/* Campo condicional para Produto */}
            {formData.applicableTo === 'PRODUCT' && (
              <div>
                <Label htmlFor="productId">Selecione o Produto *</Label>
                {isLoadingOptions ? (
                  <div className="text-sm text-gray-500">Carregando produtos...</div>
                ) : (
                  <Select
                    value={formData.productId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, productId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="" disabled>
                          Nenhum produto encontrado
                        </SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Campo condicional para Loja */}
            {formData.applicableTo === 'STORE' && (
              <div>
                <Label htmlFor="storeId">Selecione a Loja *</Label>
                {isLoadingOptions ? (
                  <div className="text-sm text-gray-500">Carregando lojas...</div>
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

