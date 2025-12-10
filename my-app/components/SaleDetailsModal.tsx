'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  User, 
  Store, 
  Calendar, 
  CreditCard, 
  Package,
  DollarSign,
  X
} from 'lucide-react';
import { salesAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';

interface SaleDetailsModalProps {
  saleId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SaleDetails {
  id: string;
  saleNumber: string;
  totalAmount: number;
  discount: number;
  tax: number;
  status: string;
  paymentMethod: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  customer?: {
    name: string;
    email: string;
  };
  employee: {
    name: string;
    email: string;
  };
  store: {
    name: string;
    address: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    profit?: number;
    notes?: string;
    product: {
      name: string;
      sku?: string;
    };
  }>;
}

export default function SaleDetailsModal({ saleId, isOpen, onClose }: SaleDetailsModalProps) {
  const { user } = useAppStore();
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canViewProfit = user?.role === 'ADMIN' || user?.role === 'admin';

  useEffect(() => {
    if (saleId && isOpen) {
      loadSaleDetails();
    }
  }, [saleId, isOpen]);

  const loadSaleDetails = async () => {
    if (!saleId) return;
    
    try {
      setIsLoading(true);
      const saleData = await salesAPI.getById(saleId);
      setSale(saleData);
    } catch (error) {
      console.error('Erro ao carregar detalhes da venda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Concluída', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
      REFUNDED: { label: 'Reembolsada', className: 'bg-gray-100 text-gray-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodConfig = {
      PIX: 'PIX',
      CREDIT_CARD: 'Cartão de Crédito',
      DEBIT_CARD: 'Cartão de Débito',
      CASH: 'Dinheiro',
      PENDING: 'Pendente',
      BOLETO: 'Boleto',
      // Fallback para valores minúsculos
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      cash: 'Dinheiro',
    };

    return methodConfig[method as keyof typeof methodConfig] || method;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Detalhes da Venda
          </DialogTitle>
          <DialogDescription>
            Informações completas da venda selecionada
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626]"></div>
          </div>
        ) : sale ? (
          <div className="space-y-6">
            {/* Cabeçalho da Venda */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Venda #{sale.saleNumber}</CardTitle>
                    <CardDescription>
                      Criada em {formatDate(sale.createdAt)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(sale.status)}
                </div>
              </CardHeader>
            </Card>

            {/* Informações da Venda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sale.customer ? (
                    <div>
                      <p className="font-medium">{sale.customer.name}</p>
                      <p className="text-sm text-gray-500">{sale.customer.email}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Venda sem cliente</p>
                  )}
                </CardContent>
              </Card>

              {/* Funcionário */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Funcionário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{sale.employee.name}</p>
                  <p className="text-sm text-gray-500">{sale.employee.email}</p>
                </CardContent>
              </Card>

              {/* Loja */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="h-5 w-5" />
                    Loja
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{sale.store.name}</p>
                  <p className="text-sm text-gray-500">{sale.store.address}</p>
                </CardContent>
              </Card>

              {/* Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{getPaymentMethodLabel(sale.paymentMethod)}</p>
                  {sale.paymentReference && (
                    <p className="text-sm text-gray-500">Ref: {sale.paymentReference}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Itens da Venda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Itens da Venda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sale.items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product.name}</p>
                        {item.product.sku && (
                          <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {item.quantity}x {formatCurrency(item.unitPrice)}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 italic break-words">{item.notes}</p>
                        )}
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                        {canViewProfit && item.profit !== undefined && item.profit !== null && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            Lucro: {formatCurrency(item.profit)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumo Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.totalAmount + sale.discount - sale.tax)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>-{formatCurrency(sale.discount)}</span>
                    </div>
                  )}
                  {sale.tax > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Taxa:</span>
                      <span>+{formatCurrency(sale.tax)}</span>
                    </div>
                  )}
                  {canViewProfit && (() => {
                    const totalProfit = sale.items.reduce((sum, item) => {
                      return sum + (item.profit ? Number(item.profit) : 0);
                    }, 0);
                    return totalProfit > 0 ? (
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span>Lucro Total:</span>
                        <span>{formatCurrency(totalProfit)}</span>
                      </div>
                    ) : null;
                  })()}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(sale.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            {sale.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{sale.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Erro ao carregar detalhes da venda</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

