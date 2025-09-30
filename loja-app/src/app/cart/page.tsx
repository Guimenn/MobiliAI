'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  DollarSign, 
  QrCode, 
  Package,
  Truck,
  Shield,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'customer';
  storeId?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
  description?: string;
}

interface ShippingAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function CartPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('loja-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
    
    // Carregar carrinho do localStorage
    const savedCart = localStorage.getItem('loja-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('loja-user');
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      localStorage.setItem('loja-cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeItem = (itemId: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.id !== itemId);
      localStorage.setItem('loja-cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    if (subtotal >= 200) return 0; // Frete grátis acima de R$ 200
    return 25; // Frete fixo
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (user?.role === 'customer' && !shippingAddress.street) {
      alert('Por favor, preencha o endereço de entrega');
      return;
    }

    setIsProcessing(true);

    try {
      // Simular processamento do pedido
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpar carrinho
      setCart([]);
      localStorage.removeItem('loja-cart');
      
      // Mostrar confirmação
      setOrderComplete(true);
      
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa fazer login para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pedido Realizado com Sucesso!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Seu pedido foi processado e você receberá uma confirmação por email.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete:</span>
                    <span>{calculateShipping() === 0 ? 'Grátis' : `R$ ${calculateShipping().toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Informações de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p><strong>Método de Pagamento:</strong> {paymentMethod.toUpperCase()}</p>
                  <p><strong>Prazo de Entrega:</strong> 3-5 dias úteis</p>
                  <p><strong>Status:</strong> <span className="text-green-600">Confirmado</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Package className="mr-2 h-4 w-4" />
                Continuar Comprando
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      user={user}
      cartCount={cart.length}
      onLogout={handleLogout}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="mr-3 h-8 w-8" />
              Carrinho de Compras
            </h1>
            <p className="text-gray-600 mt-2">
              Revise seus produtos antes de finalizar a compra
            </p>
          </div>
          
          <Link href="/products">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuar Comprando
            </Button>
          </Link>
        </div>

        {cart.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Seu carrinho está vazio
              </h3>
              <p className="text-gray-600 mb-6">
                Adicione alguns produtos para começar sua compra
              </p>
              <Link href="/products">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Package className="mr-2 h-4 w-4" />
                  Ver Produtos
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="secondary">{item.category}</Badge>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium text-lg w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Price and Remove */}
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600 mb-2">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          R$ {item.price.toFixed(2)} cada
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Checkout Summary */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal ({cart.length} itens):</span>
                      <span>R$ {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span className={calculateShipping() === 0 ? 'text-green-600' : ''}>
                        {calculateShipping() === 0 ? 'Grátis' : `R$ ${calculateShipping().toFixed(2)}`}
                      </span>
                    </div>
                    {calculateShipping() > 0 && (
                      <p className="text-sm text-gray-600">
                        Frete grátis a partir de R$ 200,00
                      </p>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address (for customers) */}
              {user?.role === 'customer' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="mr-2 h-5 w-5" />
                      Endereço de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        placeholder="Rua"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Número"
                          value={shippingAddress.number}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, number: e.target.value }))}
                        />
                        <Input
                          placeholder="CEP"
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                        />
                      </div>
                      <Input
                        placeholder="Complemento (opcional)"
                        value={shippingAddress.complement}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, complement: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Bairro"
                          value={shippingAddress.neighborhood}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                        />
                        <Input
                          placeholder="Cidade"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                      <Input
                        placeholder="Estado"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Método de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('pix')}
                      className="w-full justify-start"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      PIX (5% desconto)
                    </Button>
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className="w-full justify-start"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Cartão de Crédito
                    </Button>
                    {user?.role === 'cashier' && (
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('cash')}
                        className="w-full justify-start"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Dinheiro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Security and Checkout */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Compra 100% Segura
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-4">
                    Seus dados estão protegidos e sua compra é garantida.
                  </p>
                  
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing || cart.length === 0}
                    className="w-full py-3 text-lg bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Finalizar Compra
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
