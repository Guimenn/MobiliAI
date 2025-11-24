'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Zap, Search, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api';
import { showConfirm } from '@/lib/alerts';

interface FlashSalePanelProps {
  products: any[];
  onProductUpdated: () => void;
  onClose: () => void;
  token: string;
}

export default function FlashSalePanel({ 
  products, 
  onProductUpdated,
  onClose,
  token 
}: FlashSalePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(24);
  const [isSaving, setIsSaving] = useState(false);
  const [activeFlashSaleProduct, setActiveFlashSaleProduct] = useState<any | null>(null);

  const findActiveFlashSaleProduct = () => {
    const now = new Date();
    const activeProduct = products.find((product: any) => {
      if (!product.isFlashSale || !product.flashSaleStartDate || !product.flashSaleEndDate) {
        return false;
      }
      const start = new Date(product.flashSaleStartDate);
      const end = new Date(product.flashSaleEndDate);
      return now >= start && now <= end;
    });
    setActiveFlashSaleProduct(activeProduct || null);
  };

  useEffect(() => {
    setSearchTerm('');
    setSelectedProduct(null);
    setDiscountPercent(0);
    const now = new Date();
    setStartDate(now.toISOString().split('T')[0]);
    const currentTime = now.toTimeString().split(':', 2).join(':');
    setStartTime(currentTime);
    setDurationHours(24);
    findActiveFlashSaleProduct();
  }, [products]);

  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.isFlashSale && selectedProduct.flashSaleDiscountPercent) {
        setDiscountPercent(selectedProduct.flashSaleDiscountPercent);
        if (selectedProduct.flashSaleStartDate) {
          const startDateObj = new Date(selectedProduct.flashSaleStartDate);
          setStartDate(startDateObj.toISOString().split('T')[0]);
          setStartTime(startDateObj.toTimeString().split(':', 2).join(':'));
        }
        if (selectedProduct.flashSaleStartDate && selectedProduct.flashSaleEndDate) {
          const start = new Date(selectedProduct.flashSaleStartDate);
          const end = new Date(selectedProduct.flashSaleEndDate);
          const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
          setDurationHours(hours > 0 ? hours : 24);
        }
      } else {
        setDiscountPercent(0);
        const now = new Date();
        setStartDate(now.toISOString().split('T')[0]);
        const currentTime = now.toTimeString().split(':', 2).join(':');
        setStartTime(currentTime);
        setDurationHours(24);
      }
    }
  }, [selectedProduct]);

  const filteredProducts = products.filter((product: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term)
    );
  });

  const calculateSalePrice = () => {
    if (!selectedProduct || !discountPercent) return null;
    const originalPrice = Number(selectedProduct.price);
    const discount = (originalPrice * discountPercent) / 100;
    return originalPrice - discount;
  };

  const calculateEndDateTime = () => {
    if (!startDate || !startTime || !durationHours) return null;
    try {
      const [year, month, day] = startDate.split('-').map(Number);
      const [hours, minutes] = startTime.split(':').map(Number);
      const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
      if (isNaN(start.getTime())) return null;
      const end = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));
      return isNaN(end.getTime()) ? null : end;
    } catch (error) {
      return null;
    }
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      toast.error('Selecione um produto', {
        description: 'Por favor, escolha um produto para a oferta relâmpago.',
      });
      return;
    }

    if (discountPercent <= 0 || discountPercent >= 100) {
      toast.error('Desconto inválido', {
        description: 'O desconto deve estar entre 1% e 99%.',
      });
      return;
    }

    if (!startDate || !startTime) {
      toast.error('Data/hora inválida', {
        description: 'Por favor, defina a data e hora de início da oferta.',
      });
      return;
    }

    if (durationHours <= 0) {
      toast.error('Duração inválida', {
        description: 'A duração deve ser maior que 0 horas.',
      });
      return;
    }

    try {
      setIsSaving(true);
      const [year, month, day] = startDate.split('-').map(Number);
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      if (isNaN(startDateTime.getTime())) {
        throw new Error('Data/hora de início inválida');
      }

      const endDateTime = calculateEndDateTime();
      if (!endDateTime) {
        throw new Error('Não foi possível calcular a data de término');
      }

      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      
      if (startDateTime < oneMinuteAgo) {
        const diffMs = now.getTime() - startDateTime.getTime();
        const diffMinutes = Math.round(diffMs / 1000 / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const remainingMinutes = diffMinutes % 60;
        
        let diffText = '';
        if (diffHours > 0) {
          diffText = `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
          if (remainingMinutes > 0) {
            diffText += ` e ${remainingMinutes} minuto${remainingMinutes > 1 ? 's' : ''}`;
          }
        } else if (diffMinutes > 0) {
          diffText = `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        } else {
          diffText = 'menos de 1 minuto';
        }
        
        throw new Error(`A data/hora de início não pode ser no passado. A diferença é de ${diffText}.`);
      }

      if (endDateTime <= startDateTime) {
        throw new Error('A data de término deve ser depois da data de início');
      }

      const originalPrice = Number(selectedProduct.price);
      if (isNaN(originalPrice) || originalPrice <= 0) {
        throw new Error('Preço do produto inválido');
      }
      
      const discount = (originalPrice * discountPercent) / 100;
      const salePrice = Math.max(0, originalPrice - discount);

      const updateData = {
        isFlashSale: true,
        flashSaleDiscountPercent: discountPercent,
        flashSalePrice: salePrice,
        flashSaleStartDate: startDateTime.toISOString(),
        flashSaleEndDate: endDateTime.toISOString(),
        isOnSale: false,
      };

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const url = `${API_BASE_URL}/admin/products/${selectedProduct.id}`;

      let response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok && response.status === 404) {
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Erro desconhecido' };
        }
        throw new Error(errorData.message || `Erro ao atualizar produto: ${response.status} ${response.statusText}`);
      }

      await response.json();

      toast.success('Oferta relâmpago configurada!', {
        description: `${selectedProduct.name} está em oferta com ${discountPercent}% de desconto.`,
      });

      onProductUpdated();
      setTimeout(() => {
        findActiveFlashSaleProduct();
      }, 500);
    } catch (error: any) {
      console.error('Erro ao configurar oferta relâmpago:', error);
      toast.error('Erro ao configurar oferta', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFlashSale = async () => {
    if (!selectedProduct || !selectedProduct.isFlashSale) return;

    const confirmed = await showConfirm(`Tem certeza que deseja remover a oferta relâmpago de "${selectedProduct.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        isFlashSale: false,
        flashSaleDiscountPercent: null,
        flashSalePrice: null,
        flashSaleStartDate: null,
        flashSaleEndDate: null,
      };

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const url = `${API_BASE_URL}/admin/products/${selectedProduct.id}`;

      let response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok && response.status === 404) {
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Erro desconhecido' };
        }
        throw new Error(errorData.message || `Erro ao remover oferta: ${response.status} ${response.statusText}`);
      }

      toast.success('Oferta removida!', {
        description: `A oferta relâmpago de ${selectedProduct.name} foi removida.`,
      });

      onProductUpdated();
      setTimeout(() => {
        findActiveFlashSaleProduct();
      }, 500);
      setSelectedProduct(null);
    } catch (error: any) {
      console.error('Erro ao remover oferta relâmpago:', error);
      toast.error('Erro ao remover oferta', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const salePrice = calculateSalePrice();
  const endDateTime = calculateEndDateTime();

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-3xl border border-border bg-[#3e2626] px-8 py-10 text-primary-foreground shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Oferta Relâmpago
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base mt-1">
                Configure ofertas relâmpago para produtos
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Aviso sobre produto com oferta ativa */}
      {activeFlashSaleProduct && activeFlashSaleProduct.id !== selectedProduct?.id && (
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Zap className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Oferta Relâmpago Ativa
                </h3>
                <p className="text-sm text-muted-foreground">
                  <strong>{activeFlashSaleProduct.name}</strong> está atualmente em oferta relâmpago.
                  Ao configurar uma nova oferta, a oferta atual será automaticamente substituída.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seleção de Produto */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Selecionar Produto
          </CardTitle>
          <CardDescription>
            {activeFlashSaleProduct 
              ? `Apenas um produto pode estar em oferta relâmpago por vez. Produto atual: ${activeFlashSaleProduct.name}`
              : 'Busque e selecione o produto da sua loja que deseja colocar em oferta relâmpago'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome, categoria ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum produto encontrado
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredProducts.map((product: any) => {
                  const isSelected = selectedProduct?.id === product.id;
                  const hasFlashSale = product.isFlashSale;
                  
                  let isFlashSaleActive = false;
                  if (hasFlashSale && product.flashSaleStartDate && product.flashSaleEndDate) {
                    const now = new Date();
                    const start = new Date(product.flashSaleStartDate);
                    const end = new Date(product.flashSaleEndDate);
                    isFlashSaleActive = now >= start && now <= end;
                  }
                  
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        isSelected ? 'bg-muted border-l-4 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-foreground">{product.name}</h3>
                            {hasFlashSale && (
                              <Badge 
                                variant="outline" 
                                className={
                                  isFlashSaleActive 
                                    ? 'border-border bg-muted/50 text-foreground' 
                                    : 'border-border bg-muted/50 text-muted-foreground'
                                }
                              >
                                {isFlashSaleActive ? '⚡ ATIVA AGORA' : 'OFERTA CONFIGURADA'}
                              </Badge>
                            )}
                            {hasFlashSale && product.flashSaleDiscountPercent && (
                              <Badge variant="outline" className="border-border bg-muted/50 text-foreground">
                                -{product.flashSaleDiscountPercent}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
                          <div className="flex items-center gap-2">
                            {hasFlashSale && product.flashSalePrice ? (
                              <>
                                <p className="text-sm font-semibold text-foreground">
                                  {formatPrice(Number(product.flashSalePrice))}
                                </p>
                                <p className="text-xs text-muted-foreground line-through">
                                  {formatPrice(Number(product.price))}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-semibold text-foreground">
                                {formatPrice(Number(product.price))}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {(product.imageUrl || (product.imageUrls && product.imageUrls.length > 0)) && (
                            <img
                              src={product.imageUrl || product.imageUrls[0]}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg border border-border"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuração da Oferta */}
      {selectedProduct && (
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Configurar Oferta Relâmpago
            </CardTitle>
            <CardDescription>
              Produto selecionado: <strong>{selectedProduct.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="discount" className="text-sm font-medium">
                Desconto (%)
              </Label>
              <div className="relative mt-1">
                <Input
                  id="discount"
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                  placeholder="Ex: 30"
                  className="pr-12 h-12 text-lg font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-semibold pointer-events-none">
                  %
                </span>
              </div>
              {discountPercent > 0 && salePrice && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Preço original: <span className="line-through">{formatPrice(Number(selectedProduct.price))}</span>{' '}
                  → Preço com desconto: <span className="font-bold text-foreground">{formatPrice(salePrice)}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Data de Início
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label htmlFor="startTime" className="text-sm font-medium">
                  Hora de Início
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 h-12"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration" className="text-sm font-medium">
                Duração (Horas)
              </Label>
              <div className="relative mt-1">
                <Input
                  id="duration"
                  type="number"
                  step="1"
                  min="1"
                  max="168"
                  value={durationHours || ''}
                  onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                  placeholder="Ex: 24"
                  className="pr-24 h-12 text-lg font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-semibold pointer-events-none">
                  horas
                </span>
              </div>
              {endDateTime && (
                <p className="mt-2 text-sm text-muted-foreground">
                  A oferta termina em:{' '}
                  <span className="font-semibold text-foreground">
                    {endDateTime.toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              )}
            </div>

            {discountPercent > 0 && startDate && startTime && durationHours > 0 && (
              <Card className="border border-border bg-muted/30">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4" />
                    Resumo da Oferta
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Produto:</strong> {selectedProduct.name}
                    </p>
                    <p>
                      <strong className="text-foreground">Desconto:</strong> {discountPercent}%
                    </p>
                    <p>
                      <strong className="text-foreground">Preço original:</strong> {formatPrice(Number(selectedProduct.price))}
                    </p>
                    <p>
                      <strong className="text-foreground">Preço com desconto:</strong>{' '}
                      <span className="font-bold text-foreground">{formatPrice(salePrice || 0)}</span>
                    </p>
                    <p>
                      <strong className="text-foreground">Início:</strong>{' '}
                      {new Date(`${startDate}T${startTime}:00`).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {endDateTime && (
                      <p>
                        <strong className="text-foreground">Término:</strong>{' '}
                        {endDateTime.toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    <p>
                      <strong className="text-foreground">Duração:</strong> {durationHours} horas
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedProduct.isFlashSale && (
              <div className="pt-4 border-t border-border">
                <Card className="border border-border bg-muted/30 mb-4">
                  <CardContent className="pt-6">
                    <p className="text-sm text-foreground font-semibold mb-1">
                      ⚠️ Este produto já possui uma oferta relâmpago configurada
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ao configurar uma nova oferta, a oferta anterior será substituída automaticamente.
                    </p>
                  </CardContent>
                </Card>
                <Button
                  variant="outline"
                  onClick={handleRemoveFlashSale}
                  disabled={isSaving}
                  className="w-full border-border hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remover Oferta Relâmpago
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose} disabled={isSaving} type="button">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !selectedProduct || discountPercent <= 0 || !startDate || !startTime}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          type="button"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              Configurando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              {activeFlashSaleProduct && activeFlashSaleProduct.id !== selectedProduct?.id
                ? 'Substituir Oferta Atual'
                : 'Configurar Oferta Relâmpago'
              }
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
