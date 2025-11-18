'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { salesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Banknote,
  QrCode,
  Loader2,
  CheckCircle,
  X,
  Package,
  Store,
} from 'lucide-react';
import { showAlert } from '@/lib/alerts';
import Image from 'next/image';
import PDVPaymentModal from '@/components/PDVPaymentModal';
import PDVPickupPage from '@/components/PDVPickupPage';
import PDVProductsPage from '@/components/PDVProductsPage';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  barcode?: string;
  sku?: string;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
  stock: number;
  imageUrl?: string;
}

type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';

interface PDVComponentProps {
  initialCustomer?: any;
  pickupOrders?: any[];
  onReset?: () => void;
}

export default function PDVComponent({ initialCustomer, pickupOrders = [], onReset }: PDVComponentProps = {}) {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'products' | 'pickup'>('products');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerId, setCustomerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any>(initialCustomer || null);
  const [pendingPickupOrders, setPendingPickupOrders] = useState<any[]>(pickupOrders || []);

  useEffect(() => {
    // Se receber cliente inicial, preencher os campos
    if (initialCustomer) {
      setFoundCustomer(initialCustomer);
      setCustomerId(initialCustomer.id);
      setCustomerName(initialCustomer.name);
      setCustomerEmail(initialCustomer.email || '');
      setCustomerPhone(initialCustomer.phone || '');
      setCustomerCpf(initialCustomer.cpf || '');
    }
  }, [initialCustomer]);

  useEffect(() => {
    // Se houver pedidos de retirada, mostrar a aba de retirada por padrão
    if (pendingPickupOrders.length > 0 && activeTab === 'products') {
      setActiveTab('pickup');
    }
  }, [pendingPickupOrders.length]);

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        showAlert('error', `Quantidade indisponível. Estoque disponível: ${product.stock}`);
        return;
      }
      updateQuantity(product.id, newQuantity);
      showAlert('success', `${quantity} unidade(s) de ${product.name} adicionada(s)`);
    } else {
      if (quantity > product.stock) {
        showAlert('error', `Quantidade indisponível. Estoque disponível: ${product.stock}`);
        return;
      }
      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        unitPrice: Number(product.price),
        quantity: quantity,
        total: Number(product.price) * quantity,
        stock: product.stock,
        imageUrl: product.imageUrl
      };
      setCart([...cart, newItem]);
      showAlert('success', `${quantity} unidade(s) de ${product.name} adicionada(s) ao carrinho`);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => {
      if (item.productId === productId) {
        if (newQuantity > item.stock) {
          showAlert('error', 'Quantidade indisponível em estoque');
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          total: item.unitPrice * newQuantity
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setDiscountType('percent');
    setPaymentMethod('CASH');
    setCustomerId('');
    setNotes('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerCpf('');
    
    // Se tiver callback de reset, chamar
    if (onReset) {
      onReset();
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscountAmount = () => {
    if (discountType === 'percent') {
      return (calculateSubtotal() * discount) / 100;
    }
    return discount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return Math.max(0, subtotal - discountAmount);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleFinishSale = async () => {
    if (cart.length === 0) {
      showAlert('error', 'Adicione produtos ao carrinho antes de finalizar a venda');
      return;
    }

    if (!user?.storeId) {
      showAlert('error', 'Loja não identificada');
      return;
    }

    // Se for pagamento em dinheiro, finalizar diretamente
    if (paymentMethod === 'CASH') {
      await finalizeSaleWithCash();
      return;
    }

    // Para PIX e Cartão, criar a venda primeiro e depois processar pagamento
    try {
      setIsProcessingSale(true);

      const saleData = {
        storeId: user.storeId,
        totalAmount: calculateTotal(),
        discount: calculateDiscountAmount(),
        tax: 0,
        paymentMethod: paymentMethod.toLowerCase() as string, // Método de pagamento selecionado
        paymentReference: undefined,
        notes: notes.trim() || undefined,
        customerId: customerId.trim() || undefined,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: ''
        }))
      };

      const sale = await salesAPI.create(saleData);
      setCurrentSale(sale);
      
      // Abrir modal de pagamento
      setPaymentModalOpen(true);
      
    } catch (error: any) {
      console.error('Erro ao criar venda:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar venda';
      showAlert('error', errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const finalizeSaleWithCash = async () => {
    if (!user?.storeId) {
      showAlert('error', 'Loja não identificada');
      return;
    }

    try {
      setIsProcessingSale(true);

      const saleData = {
        storeId: user.storeId,
        totalAmount: calculateTotal(),
        discount: calculateDiscountAmount(),
        tax: 0,
        paymentMethod: 'cash',
        paymentReference: undefined,
        notes: notes.trim() || undefined,
        customerId: customerId.trim() || undefined,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: ''
        }))
      };

      const sale = await salesAPI.create(saleData);
      
      showAlert('success', `Venda #${sale.saleNumber} finalizada com sucesso!`);
      
      // Limpar carrinho e campos
      clearCart();
      
    } catch (error: any) {
      console.error('Erro ao finalizar venda:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao finalizar venda';
      showAlert('error', errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Atualizar status da venda como concluída
    if (currentSale) {
      try {
        await salesAPI.update(currentSale.id, {
          status: 'completed' as any, // Prisma usa COMPLETED, mas o DTO aceita do enum
        });
      } catch (error) {
        console.error('Erro ao atualizar status da venda:', error);
      }
    }

    showAlert('success', `Venda #${currentSale?.saleNumber} finalizada com sucesso!`);
    
    // Limpar carrinho e campos
    clearCart();
    setCurrentSale(null);
  };

  const handleOrderPickedUp = (orderId: string) => {
    setPendingPickupOrders(prev => prev.filter(order => order.id !== orderId));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Abas de Navegação */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex gap-2 p-4">
          <Button
            variant={activeTab === 'products' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('products')}
            className={`flex-1 h-12 text-base font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-[#3e2626] hover:bg-[#5a3a3a] text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Store className="h-5 w-5 mr-2" />
            Produtos
          </Button>
          <Button
            variant={activeTab === 'pickup' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('pickup')}
            className={`flex-1 h-12 text-base font-semibold transition-all relative ${
              activeTab === 'pickup'
                ? 'bg-[#3e2626] hover:bg-[#5a3a3a] text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="h-5 w-5 mr-2" />
            Retiradas
            {pendingPickupOrders.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">
                {pendingPickupOrders.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className={`grid flex-1 overflow-hidden p-6 gap-6 ${
        activeTab === 'products' 
          ? 'grid-cols-1 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {/* Coluna Esquerda - Conteúdo Principal */}
        <div className={activeTab === 'products' ? 'lg:col-span-2 overflow-hidden' : 'overflow-hidden'}>
          {activeTab === 'products' ? (
            <PDVProductsPage
              cart={cart}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
            />
          ) : (
            <PDVPickupPage
              pickupOrders={pendingPickupOrders}
              onOrderPickedUp={handleOrderPickedUp}
            />
          )}
        </div>

      {/* Coluna Direita - Carrinho e Finalização (apenas na aba de produtos) */}
      {activeTab === 'products' && (
      <div className="space-y-4">
        <Card className="sticky top-4 shadow-xl border-0">
          <CardHeader className="bg-[#3e2626] text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                Carrinho
              </span>
              {cart.length > 0 && (
                <Badge className="bg-white text-[#3e2626] font-bold text-base px-3 py-1">{cart.length} item(s)</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Itens do Carrinho */}
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Carrinho vazio</p>
                <p className="text-sm text-gray-400 mt-2">Busque e adicione produtos</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="border rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        {item.imageUrl ? (
                          <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.unitPrice)} x {item.quantity}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 ml-auto text-red-500 hover:text-red-700"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-bold text-[#3e2626] mt-1">
                            {formatCurrency(item.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Desconto */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Desconto</label>
                  <div className="flex space-x-2">
                    <Button
                      variant={discountType === 'percent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setDiscountType('percent');
                        setDiscount(0);
                      }}
                      className="flex-1"
                    >
                      %
                    </Button>
                    <Button
                      variant={discountType === 'fixed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setDiscountType('fixed');
                        setDiscount(0);
                      }}
                      className="flex-1"
                    >
                      R$
                    </Button>
                  </div>
                  <Input
                    type="number"
                    placeholder={discountType === 'percent' ? 'Ex: 10' : 'Ex: 50,00'}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max={discountType === 'percent' ? '100' : undefined}
                    step={discountType === 'percent' ? '1' : '0.01'}
                  />
                </div>

                <Separator />

                {/* Dados do Cliente (Opcional para PIX e Cartão) */}
                {(paymentMethod === 'PIX' || paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="text-sm font-medium text-blue-900">Dados do Cliente (Opcional)</label>
                    <Input
                      type="text"
                      placeholder="Nome do cliente"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="email"
                      placeholder="Email do cliente"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="tel"
                        placeholder="Telefone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        placeholder="CPF"
                        value={customerCpf}
                        onChange={(e) => setCustomerCpf(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Método de Pagamento */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('CASH')}
                      className="flex flex-col items-center h-auto py-3"
                    >
                      <Banknote className="h-5 w-5 mb-1" />
                      <span className="text-xs">Dinheiro</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'PIX' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('PIX')}
                      className="flex flex-col items-center h-auto py-3"
                    >
                      <QrCode className="h-5 w-5 mb-1" />
                      <span className="text-xs">PIX</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'CREDIT_CARD' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className="flex flex-col items-center h-auto py-3"
                    >
                      <CreditCard className="h-5 w-5 mb-1" />
                      <span className="text-xs">Crédito</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'DEBIT_CARD' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('DEBIT_CARD')}
                      className="flex flex-col items-center h-auto py-3"
                    >
                      <CreditCard className="h-5 w-5 mb-1" />
                      <span className="text-xs">Débito</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Desconto:</span>
                      <span>-{formatCurrency(calculateDiscountAmount())}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-[#3e2626]">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                {/* Botão Finalizar */}
                <Button
                  onClick={handleFinishSale}
                  disabled={isProcessingSale || cart.length === 0}
                  className="w-full bg-[#3e2626] hover:bg-[#2a1f1f] text-white h-12 text-lg font-bold"
                >
                  {isProcessingSale ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Finalizar Venda
                    </>
                  )}
                </Button>

                {cart.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Carrinho
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      )}
      </div>

      {/* Modal de Pagamento */}
      {currentSale && (
        <PDVPaymentModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setCurrentSale(null);
          }}
          saleId={currentSale.id}
          amount={calculateTotal()}
          paymentMethod={paymentMethod === 'PIX' ? 'PIX' : paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'DEBIT_CARD'}
          customerInfo={{
            name: customerName || undefined,
            email: customerEmail || undefined,
            phone: customerPhone || undefined,
            cpf: customerCpf || undefined,
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

