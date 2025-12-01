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
  ArrowLeft,
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
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products'); // Novo estado para mobile
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
    
    // Voltar para tela de produtos no mobile
    setMobileView('products');
    
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
    
    // Voltar para tela de produtos no mobile e limpar carrinho
    setMobileView('products');
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
    
    // Voltar para tela de produtos no mobile e limpar carrinho
    setMobileView('products');
    clearCart();
    setCurrentSale(null);
  };

  const handleOrderPickedUp = (orderId: string) => {
    setPendingPickupOrders(prev => prev.filter(order => order.id !== orderId));
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50">
      {/* Abas de Navegação */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex gap-2 p-2 sm:p-4">
          <Button
            variant={activeTab === 'products' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('products')}
            className={`flex-1 h-10 sm:h-12 text-sm sm:text-base font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-[#3e2626] hover:bg-[#5a3a3a] text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Store className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Produtos
          </Button>
          <Button
            variant={activeTab === 'pickup' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('pickup')}
            className={`flex-1 h-10 sm:h-12 text-sm sm:text-base font-semibold transition-all relative ${
              activeTab === 'pickup'
                ? 'bg-[#3e2626] hover:bg-[#5a3a3a] text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Retiradas
            {pendingPickupOrders.length > 0 && (
              <Badge className="ml-1 sm:ml-2 bg-red-500 text-white text-xs">
                {pendingPickupOrders.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile: Tela de Carrinho Completa */}
      {activeTab === 'products' && mobileView === 'cart' && (
        <div className="flex-1 overflow-y-auto p-4 lg:hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileView('products')}
                className="h-9 w-9 p-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-bold text-[#3e2626]">Carrinho</h2>
              {cart.length > 0 && (
                <Badge className="ml-auto bg-[#3e2626] text-white">
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Itens do Carrinho */}
            {cart.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Carrinho vazio</p>
                <p className="text-sm text-gray-400 mt-2">Adicione produtos ao carrinho</p>
                <Button
                  onClick={() => setMobileView('products')}
                  className="mt-4 bg-[#3e2626] hover:bg-[#5a3a3a] text-white"
                >
                  Ver Produtos
                </Button>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {cart.map((item) => (
                      <div key={item.productId} className="border rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          {item.imageUrl ? (
                            <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                              <ShoppingCart className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                            <p className="text-xs text-gray-500 mb-2">
                              {formatCurrency(item.unitPrice)} cada
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= item.stock}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-[#3e2626]">
                                  {formatCurrency(item.total)}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 mt-1"
                                  onClick={() => removeFromCart(item.productId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Desconto */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Desconto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex space-x-2">
                      <Button
                        variant={discountType === 'percent' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setDiscountType('percent');
                          setDiscount(0);
                        }}
                        className="flex-1 h-10"
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
                        className="flex-1 h-10"
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
                      className="h-10"
                    />
                  </CardContent>
                </Card>

                {/* Método de Pagamento */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Método de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setPaymentMethod('CASH')}
                        className="flex flex-col items-center h-auto py-4"
                      >
                        <Banknote className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">Dinheiro</span>
                      </Button>
                      <Button
                        variant={paymentMethod === 'PIX' ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setPaymentMethod('PIX')}
                        className="flex flex-col items-center h-auto py-4"
                      >
                        <QrCode className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">PIX</span>
                      </Button>
                      <Button
                        variant={paymentMethod === 'CREDIT_CARD' ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setPaymentMethod('CREDIT_CARD')}
                        className="flex flex-col items-center h-auto py-4"
                      >
                        <CreditCard className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">Crédito</span>
                      </Button>
                      <Button
                        variant={paymentMethod === 'DEBIT_CARD' ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setPaymentMethod('DEBIT_CARD')}
                        className="flex flex-col items-center h-auto py-4"
                      >
                        <CreditCard className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">Débito</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Dados do Cliente (Opcional para PIX e Cartão) */}
                {(paymentMethod === 'PIX' || paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Dados do Cliente (Opcional)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        type="text"
                        placeholder="Nome do cliente"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <Input
                        type="email"
                        placeholder="Email do cliente"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="tel"
                          placeholder="Telefone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                        <Input
                          type="text"
                          placeholder="CPF"
                          value={customerCpf}
                          onChange={(e) => setCustomerCpf(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resumo e Total */}
                <Card className="bg-[#3e2626] text-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-red-300">
                        <span>Desconto:</span>
                        <span>-{formatCurrency(calculateDiscountAmount())}</span>
                      </div>
                    )}
                    <Separator className="bg-white/20" />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Botões de Ação */}
                <div className="space-y-3 pb-4">
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
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="w-full h-11"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Carrinho
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile: Tela de Produtos | Desktop: Layout Normal */}
      {mobileView === 'products' && (
        <div className={`flex flex-1 overflow-hidden ${
          activeTab === 'products' 
            ? 'flex-col lg:flex-row' 
            : 'flex-col'
        } gap-4 lg:gap-6 p-4 lg:p-6`}>
          {/* Coluna Esquerda - Conteúdo Principal */}
          <div className={`${
            activeTab === 'products' 
              ? 'flex-1 lg:flex-[2] min-w-0 overflow-hidden relative' 
              : 'flex-1 overflow-hidden'
          }`}>
            {activeTab === 'products' ? (
              <>
                <PDVProductsPage
                  cart={cart}
                  onAddToCart={addToCart}
                  onUpdateQuantity={updateQuantity}
                  onRemoveFromCart={removeFromCart}
                />
                
                {/* Botão Flutuante do Carrinho (Mobile) */}
                {cart.length > 0 && (
                  <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
                    <Button
                      onClick={() => setMobileView('cart')}
                      className="w-full bg-[#3e2626] hover:bg-[#5a3a3a] text-white h-14 text-base font-bold shadow-2xl rounded-xl"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Ver Carrinho
                      <Badge className="ml-2 bg-white text-[#3e2626] font-bold">
                        {cart.length}
                      </Badge>
                      <span className="ml-auto font-semibold">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <PDVPickupPage
                pickupOrders={pendingPickupOrders}
                onOrderPickedUp={handleOrderPickedUp}
              />
            )}
          </div>

        {/* Desktop: Coluna Direita - Carrinho Lateral */}
        {activeTab === 'products' && (
        <div className="hidden lg:block space-y-3 sm:space-y-4 lg:w-96 lg:flex-shrink-0">
        <Card className="sticky top-0 lg:top-4 shadow-xl border-0 max-h-[calc(100vh-1rem)] lg:max-h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="bg-[#3e2626] text-white rounded-t-lg p-4 sm:p-6 flex-shrink-0">
            <CardTitle className="flex items-center justify-between text-white text-base sm:text-lg">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                Carrinho
              </span>
              {cart.length > 0 && (
                <Badge className="bg-white text-[#3e2626] font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">{cart.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto min-h-0">
            {/* Itens do Carrinho */}
            {cart.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">Carrinho vazio</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Busque e adicione produtos</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 sm:space-y-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="border rounded-lg p-2 sm:p-3">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        {item.imageUrl ? (
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs sm:text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.unitPrice)} x {item.quantity}
                          </p>
                          <div className="flex items-center space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs sm:text-sm font-medium w-6 sm:w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 ml-auto text-red-500 hover:text-red-700"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-[#3e2626] mt-1">
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
                  <label className="text-xs sm:text-sm font-medium">Desconto</label>
                  <div className="flex space-x-2">
                    <Button
                      variant={discountType === 'percent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setDiscountType('percent');
                        setDiscount(0);
                      }}
                      className="flex-1 h-8 sm:h-9 text-xs"
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
                      className="flex-1 h-8 sm:h-9 text-xs"
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
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>

                <Separator />

                {/* Dados do Cliente (Opcional para PIX e Cartão) */}
                {(paymentMethod === 'PIX' || paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') && (
                  <div className="space-y-2 sm:space-y-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="text-xs sm:text-sm font-medium text-blue-900">Dados do Cliente (Opcional)</label>
                    <Input
                      type="text"
                      placeholder="Nome do cliente"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="text-xs sm:text-sm h-8 sm:h-9"
                    />
                    <Input
                      type="email"
                      placeholder="Email do cliente"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="text-xs sm:text-sm h-8 sm:h-9"
                    />
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <Input
                        type="tel"
                        placeholder="Telefone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="text-xs sm:text-sm h-8 sm:h-9"
                      />
                      <Input
                        type="text"
                        placeholder="CPF"
                        value={customerCpf}
                        onChange={(e) => setCustomerCpf(e.target.value)}
                        className="text-xs sm:text-sm h-8 sm:h-9"
                      />
                    </div>
                  </div>
                )}

                {/* Método de Pagamento */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Método de Pagamento</label>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <Button
                      variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('CASH')}
                      className="flex flex-col items-center h-auto py-2 sm:py-3"
                    >
                      <Banknote className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1" />
                      <span className="text-xs">Dinheiro</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'PIX' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('PIX')}
                      className="flex flex-col items-center h-auto py-2 sm:py-3"
                    >
                      <QrCode className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1" />
                      <span className="text-xs">PIX</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'CREDIT_CARD' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className="flex flex-col items-center h-auto py-2 sm:py-3"
                    >
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1" />
                      <span className="text-xs">Crédito</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'DEBIT_CARD' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('DEBIT_CARD')}
                      className="flex flex-col items-center h-auto py-2 sm:py-3"
                    >
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1" />
                      <span className="text-xs">Débito</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-red-600">
                      <span>Desconto:</span>
                      <span>-{formatCurrency(calculateDiscountAmount())}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-[#3e2626]">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                {/* Botão Finalizar */}
                <Button
                  onClick={handleFinishSale}
                  disabled={isProcessingSale || cart.length === 0}
                  className="w-full bg-[#3e2626] hover:bg-[#2a1f1f] text-white h-10 sm:h-12 text-sm sm:text-base lg:text-lg font-bold flex-shrink-0"
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
                    className="w-full h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
      )}

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

