'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { productsAPI, salesAPI, storesAPI } from '@/lib/api';
import { adminAPI } from '@/lib/api-admin';
import { useAppStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ShoppingCart,
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  User,
  Package,
  DollarSign
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH',
  PENDING = 'PENDING'
}

interface Product {
  id: string;
  name: string;
  price: number | any;
  stock: number;
  sku?: string;
  category?: string;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

export default function CreateSalePage() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Campos do formulário
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paymentReference, setPaymentReference] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);

  // Alertas
  const [alert, setAlert] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!currentUser || !token) {
        router.push('/login');
        return;
      }
      await loadData();
    };
    checkAuth();
  }, [currentUser, token, router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar produtos
      const productsData = await productsAPI.getAll();
      // Converter Decimal para número
      const formattedProducts = productsData.map((p: any) => ({
        ...p,
        price: Number(p.price)
      }));
      setProducts(formattedProducts);

      // Carregar clientes (apenas usuários com role CUSTOMER)
      const usersResponse = await adminAPI.getUsers(token || '');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const customersData = Array.isArray(usersData) 
          ? usersData.filter((user: any) => user.role === 'CUSTOMER')
          : [];
        setCustomers(customersData);
      }

      // Carregar lojas
      const storesData = await storesAPI.getAll();
      setStores(storesData);
      
      // Se o usuário tiver uma loja, selecionar automaticamente
      if (currentUser?.storeId) {
        setSelectedStore(currentUser.storeId);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showAlert('error', 'Erro ao carregar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const addToCart = () => {
    const product = products.find(p => p.id === selectedProductId);
    
    if (!product) {
      showAlert('error', 'Produto não encontrado');
      return;
    }

    if (productQuantity <= 0) {
      showAlert('error', 'Quantidade inválida');
      return;
    }

    if (product.stock < productQuantity) {
      showAlert('error', `Estoque insuficiente. Disponível: ${product.stock}`);
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      // Atualizar quantidade
      if (existingItem.quantity + productQuantity > product.stock) {
        showAlert('error', `Estoque insuficiente. Disponível: ${product.stock}`);
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + productQuantity, subtotal: (item.quantity + productQuantity) * item.price }
          : item
      ));
    } else {
      // Adicionar novo item
      setCart([...cart, {
        ...product,
        quantity: productQuantity,
        subtotal: productQuantity * product.price
      }]);
    }

    // Limpar seleção
    setSelectedProductId('');
    setProductQuantity(1);
    setSearchProduct('');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      showAlert('error', `Estoque insuficiente. Disponível: ${product.stock}`);
      return;
    }

    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity, subtotal: quantity * item.price }
        : item
    ));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    return {
      subtotal,
      discountAmount: (subtotal * discount) / 100,
      taxAmount: (subtotal * tax) / 100,
      total: subtotal - ((subtotal * discount) / 100) + ((subtotal * tax) / 100)
    };
  };

  const handleSubmit = async () => {
    if (!selectedStore) {
      showAlert('error', 'Selecione uma loja');
      return;
    }

    if (cart.length === 0) {
      showAlert('error', 'Adicione pelo menos um produto ao carrinho');
      return;
    }

    // Se não houver cliente selecionado, criar uma venda sem cliente
    if (!selectedCustomer) {
      const confirmVenda = confirm('Deseja continuar com a venda sem cliente?');
      if (!confirmVenda) {
        return;
      }
    }

    const totals = calculateTotal();

    try {
      setIsSubmitting(true);

      const saleData = {
        totalAmount: totals.total,
        discount: totals.discountAmount,
        tax: totals.taxAmount,
        paymentMethod: paymentMethod.toLowerCase(),
        paymentReference: paymentReference || undefined,
        notes: notes || undefined,
        customerId: selectedCustomer || undefined,
        storeId: selectedStore,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price
        }))
      };

      await salesAPI.create(saleData);

      showAlert('success', 'Venda criada com sucesso!');

      // Limpar formulário
      setTimeout(() => {
        setCart([]);
        setSelectedCustomer('');
        setPaymentMethod(PaymentMethod.CASH);
        setPaymentReference('');
        setDiscount(0);
        setTax(0);
        setNotes('');
        router.push('/admin/sales');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao criar venda:', error);
      showAlert('error', error.response?.data?.message || 'Erro ao criar venda. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const search = searchProduct.toLowerCase();
    return p.name?.toLowerCase().includes(search);
  });

  const totals = calculateTotal();

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nova Venda</h1>
                <p className="text-gray-500">Registre uma nova venda na loja</p>
              </div>
            </div>
          </div>

          {/* Alert */}
          {alert && (
            <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
              {alert.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertTitle>{alert.type === 'error' ? 'Erro' : 'Sucesso'}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Esquerda - Formulário */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informações da Venda */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Informações da Venda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Loja *</Label>
                        <Select value={selectedStore} onValueChange={setSelectedStore}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a loja" />
                          </SelectTrigger>
                          <SelectContent>
                            {stores.map(store => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Cliente (opcional)</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            value={searchCustomer}
                            onChange={(e) => setSearchCustomer(e.target.value)}
                            placeholder="Buscar cliente por nome ou email (opcional)..."
                            className="pl-10"
                          />
                        </div>
                        {searchCustomer && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {customers
                              .filter(c => 
                                c.name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
                                c.email?.toLowerCase().includes(searchCustomer.toLowerCase())
                              )
                              .map(customer => (
                                <div
                                  key={customer.id}
                                  className="p-3 hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    setSelectedCustomer(customer.id);
                                    setSearchCustomer(customer.name || customer.email);
                                  }}
                                >
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-sm text-gray-500">{customer.email}</p>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Adicionar Produtos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Adicionar Produtos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label>Buscar Produto</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar por nome ou SKU..."
                            value={searchProduct}
                            onChange={(e) => setSearchProduct(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {searchProduct && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Nenhum produto encontrado
                          </p>
                        ) : (
                          filteredProducts.map(product => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                setSelectedProductId(product.id);
                                setSearchProduct('');
                              }}
                            >
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-500">
                                  {product.sku || 'N/A'} - Estoque: {product.stock}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">R$ {Number(product.price).toFixed(2)}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {selectedProductId && (
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            value={productQuantity}
                            onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                          />
                        </div>
                        <Button onClick={addToCart}>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Produtos no Carrinho */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Carrinho ({cart.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Nenhum produto no carrinho
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">
                                R$ {item.price.toFixed(2)} x {item.quantity}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span className="w-10 text-center">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                              <p className="font-bold w-24 text-right">
                                R$ {item.subtotal.toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Coluna Direita - Resumo e Pagamento */}
              <div className="space-y-6">
                {/* Método de Pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Forma de Pagamento *</Label>
                      <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PaymentMethod.PIX}>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              PIX
                            </div>
                          </SelectItem>
                          <SelectItem value={PaymentMethod.CREDIT_CARD}>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Cartão de Crédito
                            </div>
                          </SelectItem>
                          <SelectItem value={PaymentMethod.DEBIT_CARD}>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Cartão de Débito
                            </div>
                          </SelectItem>
                          <SelectItem value={PaymentMethod.CASH}>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Dinheiro
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(paymentMethod === PaymentMethod.PIX || 
                      paymentMethod === PaymentMethod.CREDIT_CARD || 
                      paymentMethod === PaymentMethod.DEBIT_CARD) && (
                      <div className="space-y-2">
                        <Label>Referência do Pagamento</Label>
                        <Input
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Código da transação"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Desconto (%)</Label>
                        <Input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Taxa (%)</Label>
                        <Input
                          type="number"
                          value={tax}
                          onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observações adicionais..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>R$ {totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Desconto ({discount}%):</span>
                      <span className="text-green-600">- R$ {totals.discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxa ({tax}%):</span>
                      <span className="text-red-600">+ R$ {totals.taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-2xl text-blue-600">
                        R$ {totals.total.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Botão Finalizar */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar Venda
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
