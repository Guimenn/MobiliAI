'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart, 
  X, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Plus, 
  Minus, 
  User, 
  LogOut, 
  Store, 
  Package, 
  BarChart3,
  ShoppingBag,
  Heart,
  Star
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
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

  // Mock products data
  const mockProducts: Product[] = [
    { 
      id: 'prod1', 
      name: 'Sofá 3 Lugares Cinza', 
      price: 2500.00, 
      stock: 5, 
      category: 'SOFA',
      description: 'Sofá moderno e confortável para sala de estar',
      image: '/api/placeholder/300/200'
    },
    { 
      id: 'prod2', 
      name: 'Mesa de Centro Moderna', 
      price: 350.00, 
      stock: 10, 
      category: 'MESA',
      description: 'Mesa de centro com design contemporâneo',
      image: '/api/placeholder/300/200'
    },
    { 
      id: 'prod3', 
      name: 'Cadeira Ergonômica', 
      price: 250.00, 
      stock: 20, 
      category: 'CADEIRA',
      description: 'Cadeira ergonômica para escritório',
      image: '/api/placeholder/300/200'
    },
    { 
      id: 'prod4', 
      name: 'Estante Modular', 
      price: 800.00, 
      stock: 3, 
      category: 'ESTANTE',
      description: 'Estante modular versátil',
      image: '/api/placeholder/300/200'
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Store className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Loja</h1>
            <p className="text-gray-600">Escolha seu tipo de acesso</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => handleLogin('cashier')}
              className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700"
            >
              <User className="mr-2 h-5 w-5" />
              Acesso Funcionário
            </Button>
            
            <Button 
              onClick={() => handleLogin('customer')}
              className="w-full py-3 text-lg bg-green-600 hover:bg-green-700"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Acesso Cliente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.role === 'cashier' ? 'Ponto de Venda' : 'Loja Online'}
                </h1>
                <p className="text-sm text-gray-600">
                  {user?.role === 'cashier' ? 'Sistema de vendas' : 'Compre seus móveis'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.role === 'cashier' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Status do Caixa:</span>
                  <Badge variant={cashOpen ? "default" : "secondary"}>
                    {cashOpen ? 'Aberto' : 'Fechado'}
                  </Badge>
                </div>
              )}
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'cashier' ? 'Funcionário' : 'Cliente'}
                </p>
              </div>
              
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {user?.role === 'cashier' && (
          <div className="mb-6 flex justify-center">
            {!cashOpen ? (
              <Button 
                onClick={() => setCashOpen(true)}
                className="px-8 py-3 text-lg bg-green-600 hover:bg-green-700"
              >
                Abrir Caixa
              </Button>
            ) : (
              <Button 
                onClick={() => setCashOpen(false)}
                className="px-8 py-3 text-lg bg-red-600 hover:bg-red-700"
              >
                Fechar Caixa
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search & List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex space-x-2 mb-6">
                <Input
                  type="text"
                  placeholder="Buscar produto por nome ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.length > 0 ? (
                  products.map(product => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <Badge variant="secondary" className="w-fit">{product.category}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-blue-600">R$ {product.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">Estoque: {product.stock}</p>
                        <Button 
                          onClick={() => addToCart(product)}
                          disabled={user?.role === 'cashier' && !cashOpen}
                          className="mt-2 w-full"
                        >
                          Adicionar ao Carrinho
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="col-span-2 text-center text-gray-500">
                    Nenhum produto encontrado. Tente buscar!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Carrinho ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Carrinho vazio</p>
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
                            size="icon" 
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium text-sm">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        R$ {total.toFixed(2)}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Método de Pagamento:</h3>
                      <div className="flex space-x-2">
                        <Button
                          variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('cash')}
                          className="flex-1"
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Dinheiro
                        </Button>
                        <Button
                          variant={paymentMethod === 'card' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('card')}
                          className="flex-1"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Cartão
                        </Button>
                        <Button
                          variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('pix')}
                          className="flex-1"
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          Pix
                        </Button>
                      </div>
                    </div>

                    {paymentMethod === 'cash' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          Valor Recebido (Dinheiro):
                        </label>
                        <Input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(Number(e.target.value))}
                          placeholder="0.00"
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
                        (paymentMethod === 'cash' && (typeof cashAmount !== 'number' || cashAmount < total)) ||
                        isLoading
                      }
                    >
                      {isLoading ? 'Processando...' : 'Finalizar Venda'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}