'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Zap, Search, Clock, Percent, Package } from 'lucide-react';
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

  // Função para encontrar produto com oferta relâmpago ativa
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

  // Resetar formulário quando o componente montar e buscar produto com oferta ativa
  useEffect(() => {
    setSearchTerm('');
    setSelectedProduct(null);
    setDiscountPercent(0);
    const now = new Date();
    setStartDate(now.toISOString().split('T')[0]);
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    setStartTime(nextHour.toTimeString().split(':', 2).join(':'));
    setDurationHours(24);
    findActiveFlashSaleProduct();
  }, [products]);

  // Carregar dados da oferta quando um produto for selecionado
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
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        setStartTime(nextHour.toTimeString().split(':', 2).join(':'));
        setDurationHours(24);
      }
    }
  }, [selectedProduct]);

  // Filtrar produtos
  const filteredProducts = products.filter((product: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term)
    );
  });

  // Calcular preço com desconto
  const calculateSalePrice = () => {
    if (!selectedProduct || !discountPercent) return null;
    const originalPrice = Number(selectedProduct.price);
    const discount = (originalPrice * discountPercent) / 100;
    return originalPrice - discount;
  };

  // Calcular data/hora de fim
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
        duration: 4000,
      });
      return;
    }

    if (discountPercent <= 0 || discountPercent >= 100) {
      toast.error('Desconto inválido', {
        description: 'O desconto deve estar entre 1% e 99%.',
        duration: 4000,
      });
      return;
    }

    if (!startDate || !startTime) {
      toast.error('Data/hora inválida', {
        description: 'Por favor, defina a data e hora de início da oferta.',
        duration: 4000,
      });
      return;
    }

    if (durationHours <= 0) {
      toast.error('Duração inválida', {
        description: 'A duração deve ser maior que 0 horas.',
        duration: 4000,
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
        const diffMinutes = Math.round((oneMinuteAgo.getTime() - startDateTime.getTime()) / 1000 / 60);
        throw new Error(`A data/hora de início não pode ser no passado. A diferença é de ${diffMinutes} minutos.`);
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
        duration: 4000,
      });

      onProductUpdated();
      setTimeout(() => {
        findActiveFlashSaleProduct();
      }, 500);
    } catch (error: any) {
      console.error('Erro ao configurar oferta relâmpago:', error);
      toast.error('Erro ao configurar oferta', {
        description: error.message || 'Tente novamente mais tarde.',
        duration: 4000,
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
        duration: 4000,
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
        duration: 4000,
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
    <div className="w-full space-y-6">
      {/* Header */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white fill-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Oferta Relâmpago</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Configure ofertas relâmpago para produtos
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      <div className="space-y-6">
        {/* Aviso sobre produto com oferta ativa */}
        {activeFlashSaleProduct && activeFlashSaleProduct.id !== selectedProduct?.id && (
          <Card className="border-2 border-orange-300 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Zap className="h-5 w-5 text-orange-600 fill-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Oferta Relâmpago Ativa
                  </h3>
                  <p className="text-sm text-orange-800">
                    <strong>{activeFlashSaleProduct.name}</strong> está atualmente em oferta relâmpago.
                    Ao configurar uma nova oferta, a oferta atual será automaticamente substituída.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seleção de Produto */}
        <Card className="border-2 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Package className="h-5 w-5 mr-2 text-yellow-600" />
              Selecionar Produto
            </CardTitle>
            <CardDescription>
              {activeFlashSaleProduct 
                ? `Apenas um produto pode estar em oferta relâmpago por vez. Produto atual: ${activeFlashSaleProduct.name}`
                : 'Busque e selecione o produto que deseja colocar em oferta relâmpago'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produto por nome, categoria ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de Produtos */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum produto encontrado
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
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
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''
                        } ${hasFlashSale ? (isFlashSaleActive ? 'bg-green-50 border-l-2 border-green-500' : 'bg-orange-50') : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <h3 className="font-semibold text-gray-900">{product.name}</h3>
                              {hasFlashSale && (
                                <span className={`px-2 py-1 text-white text-xs font-bold rounded-full ${
                                  isFlashSaleActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                                }`}>
                                  {isFlashSaleActive ? '⚡ ATIVA AGORA' : 'OFERTA CONFIGURADA'}
                                </span>
                              )}
                              {hasFlashSale && product.flashSaleDiscountPercent && (
                                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                  -{product.flashSaleDiscountPercent}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{product.category}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {hasFlashSale && product.flashSalePrice ? (
                                <>
                                  <p className="text-sm font-semibold text-green-600">
                                    {formatPrice(Number(product.flashSalePrice))}
                                  </p>
                                  <p className="text-xs text-gray-500 line-through">
                                    {formatPrice(Number(product.price))}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatPrice(Number(product.price))}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            {(product.imageUrl || (product.imageUrls && product.imageUrls.length > 0)) && (
                              <img
                                src={product.imageUrl || product.imageUrls[0]}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
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
          <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="h-5 w-5 mr-2 text-yellow-600 fill-yellow-400" />
                Configurar Oferta Relâmpago
              </CardTitle>
              <CardDescription>
                Produto selecionado: <strong>{selectedProduct.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Desconto */}
              <div>
                <Label htmlFor="discount" className="text-sm font-medium text-gray-700">
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
                    className="pr-12 h-12 text-lg font-semibold px-4"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-gray-600 font-semibold pointer-events-none">
                    %
                  </span>
                </div>
                {discountPercent > 0 && salePrice && (
                  <p className="mt-2 text-sm text-gray-600">
                    Preço original: <span className="line-through">{formatPrice(Number(selectedProduct.price))}</span>{' '}
                    → Preço com desconto: <span className="font-bold text-green-600">{formatPrice(salePrice)}</span>
                  </p>
                )}
              </div>

              {/* Data e Hora de Início */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
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
                  <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">
                    Hora de Início
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 h-12 bg-gray-50"
                  />
                </div>
              </div>

              {/* Duração */}
              <div>
                <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
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
                    className="pr-24 h-12 text-lg font-semibold px-4"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-gray-600 font-semibold pointer-events-none">
                    horas
                  </span>
                </div>
                {endDateTime && (
                  <p className="mt-2 text-sm text-gray-600">
                    A oferta termina em:{' '}
                    <span className="font-semibold text-gray-900">
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

              {/* Resumo da Oferta */}
              {discountPercent > 0 && startDate && startTime && durationHours > 0 && (
                <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                    Resumo da Oferta
                  </h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <strong>Produto:</strong> {selectedProduct.name}
                    </p>
                    <p>
                      <strong>Desconto:</strong> {discountPercent}%
                    </p>
                    <p>
                      <strong>Preço original:</strong> {formatPrice(Number(selectedProduct.price))}
                    </p>
                    <p>
                      <strong>Preço com desconto:</strong>{' '}
                      <span className="font-bold text-green-600">{formatPrice(salePrice || 0)}</span>
                    </p>
                    <p>
                      <strong>Início:</strong>{' '}
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
                        <strong>Término:</strong>{' '}
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
                      <strong>Duração:</strong> {durationHours} horas
                    </p>
                  </div>
                </div>
              )}

              {/* Botão para remover oferta existente */}
              {selectedProduct.isFlashSale && (
                <div className="pt-4 border-t border-yellow-300">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-orange-800 font-semibold mb-1">
                      ⚠️ Este produto já possui uma oferta relâmpago configurada
                    </p>
                    <p className="text-xs text-orange-700">
                      Ao configurar uma nova oferta, a oferta anterior será substituída automaticamente.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRemoveFlashSale}
                    disabled={isSaving}
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
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
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={isSaving} type="button">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !selectedProduct || discountPercent <= 0 || !startDate || !startTime}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
            type="button"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    </div>
  );
}

