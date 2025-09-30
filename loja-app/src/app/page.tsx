'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import LoginScreen from '@/components/LoginScreen';
import { 
  Search, 
  ShoppingCart, 
  X, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Plus, 
  Minus, 
  Package, 
  ShoppingBag,
  Star,
  TrendingUp,
  Eye,
  MessageCircle,
  Palette,
  Scan,
  Calculator,
  Receipt
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
  brand?: string;
  color?: string;
  finish?: string;
  coverage?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'customer';
  storeId?: string;
}

export default function LojaHome() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pix'>('cash');
  const [cashAmount, setCashAmount] = useState<number | ''>('');
  const [cashOpen, setCashOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock products data - Tintas e produtos relacionados
  const mockProducts: Product[] = [
    { 
      id: 'prod1', 
      name: 'Tinta Acrílica Premium Branco Gelo', 
      price: 89.90, 
      stock: 25, 
      category: 'TINTAS',
      description: 'Tinta acrílica de alta qualidade para interiores e exteriores',
      image: '/api/placeholder/300/200',
      brand: 'ColorMax',
      color: 'Branco Gelo',
      finish: 'Fosco',
      coverage: '16m²/L'
    },
    { 
      id: 'prod2', 
      name: 'Esmalte Sintético Azul Royal', 
      price: 125.50, 
      stock: 15, 
      category: 'TINTAS',
      description: 'Esmalte sintético para madeiras e metais',
      image: '/api/placeholder/300/200',
      brand: 'Premium Paint',
      color: 'Azul Royal',
      finish: 'Brilhante',
      coverage: '12m²/L'
    },
    { 
      id: 'prod3', 
      name: 'Primer Universal Branco', 
      price: 45.00, 
      stock: 30, 
      category: 'PRIMERS',
      description: 'Primer universal para qualquer tipo de superfície',
      image: '/api/placeholder/300/200',
      brand: 'BaseTech',
      color: 'Branco',
      finish: 'Fosco',
      coverage: '20m²/L'
    },
    { 
      id: 'prod4', 
      name: 'Kit Pintura Completo Verde Menta', 
      price: 299.90, 
      stock: 8, 
      category: 'KITS',
      description: 'Kit completo com tinta, primer, pincéis e rolos',
      image: '/api/placeholder/300/200',
      brand: 'Complete Paint',
      color: 'Verde Menta',
      finish: 'Fosco',
      coverage: '45m²'
    },
    { 
      id: 'prod5', 
      name: 'Pincel Chato 2" Profissional', 
      price: 15.90, 
      stock: 50, 
      category: 'FERRAMENTAS',
      description: 'Pincel de cerdas naturais para acabamento perfeito',
      image: '/api/placeholder/300/200',
      brand: 'ProTools'
    },
    { 
      id: 'prod6', 
      name: 'Rolo de Pintura 7"', 
      price: 12.50, 
      stock: 40, 
      category: 'FERRAMENTAS',
      description: 'Rolo de lã para pintura de grandes áreas',
      image: '/api/placeholder/300/200',
      brand: 'RollMax'
    },
    { 
      id: 'prod7', 
      name: 'Fita Crepe 48mm x 50m', 
      price: 8.90, 
      stock: 60, 
      category: 'FERRAMENTAS',
      description: 'Fita crepe para proteção e acabamento',
      image: '/api/placeholder/300/200',
      brand: 'TapePro'
    },
    { 
      id: 'prod8', 
      name: 'Tinta Látex PVA Rosa Pink', 
      price: 67.80, 
      stock: 20, 
      category: 'TINTAS',
      description: 'Tinta látex PVA para quartos infantis',
      image: '/api/placeholder/300/200',
      brand: 'Kids Color',
      color: 'Rosa Pink',
      finish: 'Fosco',
      coverage: '18m²/L'
    },
  ];

  useEffect(() => {
    // Simular verificação de autenticação
    const checkAuth = () => {
      const storedUser = localStorage.getItem('loja-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
    setProducts(mockProducts);
  }, []);

  const handleLogin = (role: 'cashier' | 'customer') => {
    const mockUser: User = {
      id: '1',
      name: role === 'cashier' ? 'João Funcionário' : 'Maria Cliente',
      email: role === 'cashier' ? 'joao@loja.com' : 'maria@email.com',
      role,
      storeId: role === 'cashier' ? 'store-1' : undefined
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('loja-user', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCart([]);
    setCashOpen(false);
    localStorage.removeItem('loja-user');
  };

  const handleSearch = () => {
    const filtered = mockProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setProducts(filtered);
  };

  const addToCart = (product: Product) => {
    if (user?.role === 'customer' || (user?.role === 'cashier' && cashOpen)) {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        if (existingItem) {
          return prevCart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prevCart, { ...product, quantity: 1 }];
      });
    }
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== itemId);
      }
      return prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Finalizando venda:', { 
        cart, 
        paymentMethod, 
        cashAmount, 
        total: calculateTotal(),
        user: user?.role 
      });
      
      alert('Venda finalizada com sucesso!');
      setCart([]);
      setSearchTerm('');
      setProducts(mockProducts);
      setCashAmount('');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda');
    } finally {
      setIsLoading(false);
    }
  };

  const total = calculateTotal();
  const change = paymentMethod === 'cash' && typeof cashAmount === 'number' ? cashAmount - total : 0;

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // PÁGINA PRINCIPAL DE COMPRAS - ÚNICA PARA TODOS
  return (
    <Layout 
      user={user}
      cashOpen={cashOpen}
      cartCount={cart.length}
      onLogout={handleLogout}
      onToggleCash={() => setCashOpen(!cashOpen)}
    >
      <div className="space-y-6">
        {/* Dashboard de Vendas/Compras */}
        {user?.role === 'cashier' && !cashOpen && (
          <div className="flex justify-center">
            <Card className="border-red-200 bg-red-50 max-w-md">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-red-800 mb-2">Caixa Fechado</h2>
                <p className="text-red-600 mb-4">Abra o caixa para iniciar as vendas</p>
                <Button 
                  onClick={() => setCashOpen(true)}
                  className="px-8 py-3 text-lg bg-green-600 hover:bg-green-700"
                >
                  Abrir Caixa
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interface de Compras/Vendas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Busca e Lista de Produtos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  {user?.role === 'cashier' ? 'Buscar Produtos para Venda' : 'Nossos Produtos'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-6">
                  <Input
                    type="text"
                    placeholder={user?.role === 'cashier' ? "Digite o nome ou código do produto..." : "Buscar produtos..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow text-lg"
                  />
                  <Button onClick={handleSearch} size="lg">
                    <Search className="mr-2 h-5 w-5" />
                    Buscar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map(product => (
                    <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary">{product.category}</Badge>
                              {product.brand && <Badge variant="outline">{product.brand}</Badge>}
                            </div>
                            <p className="text-2xl font-bold text-blue-600">R$ {product.price.toFixed(2)}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Estoque: {product.stock}</span>
                              {product.coverage && <span>{product.coverage}</span>}
                            </div>
                          </div>
                          <Button 
                            onClick={() => addToCart(product)}
                            disabled={user?.role === 'cashier' && !cashOpen}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Carrinho de Compras/Vendas */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    {user?.role === 'cashier' ? (
                      <Receipt className="mr-2 h-5 w-5" />
                    ) : (
                      <ShoppingCart className="mr-2 h-5 w-5" />
                    )}
                    {user?.role === 'cashier' ? 'Venda Atual' : 'Seu Carrinho'}
                  </div>
                  <Badge variant="secondary">{cart.length} itens</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{user?.role === 'cashier' ? 'Carrinho vazio' : 'Seu carrinho está vazio'}</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-grow">
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            R$ {item.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium text-sm w-6 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="mt-6 border-t pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        R$ {total.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Forma de Pagamento:</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('cash')}
                          size="sm"
                        >
                          <DollarSign className="mr-1 h-3 w-3" />
                          Dinheiro
                        </Button>
                        <Button
                          variant={paymentMethod === 'card' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('card')}
                          size="sm"
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Cartão
                        </Button>
                        <Button
                          variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('pix')}
                          size="sm"
                        >
                          <QrCode className="mr-1 h-3 w-3" />
                          PIX
                        </Button>
                      </div>
                    </div>

                    {paymentMethod === 'cash' && user?.role === 'cashier' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Valor Recebido:
                        </label>
                        <Input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(Number(e.target.value))}
                          placeholder="0.00"
                          className="text-lg"
                        />
                        {typeof cashAmount === 'number' && cashAmount > 0 && (
                          <p className="mt-2 text-lg font-semibold">
                            Troco: <span className="text-green-500">R$ {change.toFixed(2)}</span>
                          </p>
                        )}
                      </div>
                    )}

                    <Button 
                      onClick={handleCheckout} 
                      className="w-full py-3 text-lg bg-green-600 hover:bg-green-700" 
                      disabled={
                        cart.length === 0 || 
                        (user?.role === 'cashier' && !cashOpen) ||
                        (paymentMethod === 'cash' && (typeof cashAmount !== 'number' || cashAmount < total)) ||
                        isLoading
                      }
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processando...
                        </>
                      ) : (
                        <>
                          <Calculator className="mr-2 h-5 w-5" />
                          {user?.role === 'cashier' ? 'Finalizar Venda' : 'Finalizar Compra'}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}