'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { productsAPI, salesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Banknote,
  QrCode,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Barcode,
  UserCheck,
  Package
} from 'lucide-react';
import { showAlert } from '@/lib/alerts';
import Image from 'next/image';
import PDVPaymentModal from '@/components/PDVPaymentModal';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerId, setCustomerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any>(initialCustomer || null);
  const [pendingPickupOrders, setPendingPickupOrders] = useState<any[]>(pickupOrders || []);
  const [markingAsPickedUp, setMarkingAsPickedUp] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.storeId) {
      loadProducts();
    }
  }, [user?.storeId]);

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
    // Focar no campo de busca ao montar
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const loadProducts = async () => {
    if (!user?.storeId) return;
    
    try {
      setIsLoading(true);
      const data = await productsAPI.getAll(user.storeId);
      // Filtrar apenas produtos ativos e com estoque
      const availableProducts = data.filter((p: Product) => p.stock > 0);
      setProducts(availableProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      showAlert('error', 'Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setProducts([]);
      return;
    }

    if (!user?.storeId) return;

    try {
      setIsSearching(true);
      const allProducts = await productsAPI.getAll(user.storeId);
      
      // Buscar por nome, código de barras ou SKU
      const searchLower = value.toLowerCase();
      const filtered = allProducts.filter((p: Product) => {
        const matchesName = p.name.toLowerCase().includes(searchLower);
        const matchesBarcode = p.barcode?.toLowerCase().includes(searchLower);
        const matchesSku = p.sku?.toLowerCase().includes(searchLower);
        return (matchesName || matchesBarcode || matchesSku) && p.stock > 0;
      });
      
      setProducts(filtered);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Se já existe no carrinho, aumentar quantidade
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        showAlert('error', `Quantidade indisponível. Estoque disponível: ${product.stock}`);
        return;
      }
      updateQuantity(product.id, newQuantity);
      showAlert('success', `${quantity} unidade(s) de ${product.name} adicionada(s)`);
    } else {
      // Adicionar novo item ao carrinho
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
    
    // NÃO limpar busca - permite continuar adicionando produtos
    // Focar no campo de busca novamente
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
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
      
      // Recarregar produtos para atualizar estoque
      await loadProducts();
      
      // Focar no campo de busca
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
      
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
    
    // Recarregar produtos para atualizar estoque
    await loadProducts();
    
    // Focar no campo de busca
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && products.length > 0) {
      addToCart(products[0]);
    }
  };

  // Função para marcar pedido como retirado
  const handleMarkAsPickedUp = async (orderId: string) => {
    try {
      setMarkingAsPickedUp(orderId);
      await salesAPI.update(orderId, {
        status: 'COMPLETED',
      });
      // Atualizar a lista removendo o pedido retirado
      setPendingPickupOrders(prev => prev.filter(order => order.id !== orderId));
      showAlert('success', 'Pedido marcado como retirado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao marcar pedido como retirado:', error);
      showAlert('error', 'Erro ao marcar pedido como retirado. Tente novamente.');
    } finally {
      setMarkingAsPickedUp(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Seção de Pedidos para Retirada */}
      {pendingPickupOrders.length > 0 && (
        <Card className="mb-4 border-2 border-yellow-200 bg-yellow-50 shadow-lg flex-shrink-0">
          <CardHeader className="bg-yellow-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <Package className="h-5 w-5" />
              Pedidos para Retirada ({pendingPickupOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {pendingPickupOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg p-4 border-2 border-yellow-200 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          Pedido #{order.saleNumber}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {order.status === 'PENDING' ? 'Pendente' : 'Preparando'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Valor:</span> R${' '}
                          {Number(order.totalAmount).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-xs text-gray-500 mb-1">Itens do pedido:</p>
                            <div className="space-y-1">
                              {order.items.slice(0, 3).map((item: any, idx: number) => (
                                <p key={idx} className="text-xs text-gray-600">
                                  • {item.product?.name || 'Produto'} - Qtd: {item.quantity}
                                </p>
                              ))}
                              {order.items.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  + {order.items.length - 3} outro(s) item(ns)
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleMarkAsPickedUp(order.id)}
                      disabled={markingAsPickedUp === order.id}
                      className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                      size="sm"
                    >
                      {markingAsPickedUp === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como Retirado
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Coluna Esquerda - Busca e Produtos */}
        <div className="lg:col-span-2 space-y-4 overflow-y-auto">
        {/* Busca de Produtos */}
        <Card className="shadow-lg border-2 border-[#3e2626]/10">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#3e2626] z-10" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por nome, SKU ou código de barras..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-12 pr-12 h-14 text-lg border-2 border-[#3e2626]/20 focus:border-[#3e2626] focus:ring-2 focus:ring-[#3e2626]/20 rounded-lg font-medium"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#3e2626] animate-spin" />
              )}
              {!isSearching && searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-gray-100"
                  onClick={() => {
                    setSearchTerm('');
                    setProducts([]);
                  }}
                >
                  <X className="h-5 w-5 text-gray-500" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <Card className="flex-1 shadow-lg border-0">
          <CardHeader className="bg-[#3e2626] text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produtos
              </span>
              {products.length > 0 && (
                <Badge className="bg-white text-[#3e2626] font-semibold">{products.length} encontrado(s)</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#3e2626]" />
              </div>
            ) : products.length === 0 && searchTerm ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-4">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                </div>
                <p className="text-gray-700 font-semibold text-lg mb-2">Nenhum produto encontrado</p>
                <p className="text-gray-500 text-sm">Tente buscar com outro termo</p>
              </div>
            ) : products.length === 0 && !searchTerm ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-4">
                  <Barcode className="h-10 w-10 text-blue-400" />
                </div>
                <p className="text-gray-700 font-semibold text-lg mb-2">Buscar Produtos</p>
                <p className="text-gray-500 text-sm">Digite o nome, SKU ou código de barras para buscar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {products.map((product) => {
                  const cartItem = cart.find(item => item.productId === product.id);
                  const currentQuantity = cartItem?.quantity || 0;
                  
                  return (
                    <div
                      key={product.id}
                      className="border-2 rounded-xl p-4 hover:border-[#3e2626] hover:shadow-lg transition-all bg-white group"
                    >
                      <div className="flex flex-col space-y-3">
                        {product.imageUrl ? (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                          <p className="text-2xl font-bold text-[#3e2626] mb-3">
                            {formatCurrency(product.price)}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className="text-xs">
                              Estoque: {product.stock}
                            </Badge>
                            {product.barcode && (
                              <span className="text-xs text-gray-500">#{product.barcode}</span>
                            )}
                          </div>
                          
                          {cartItem && (
                            <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-xs text-green-700 font-medium">
                                No carrinho: {currentQuantity} unidade(s)
                              </p>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cartItem) {
                                  updateQuantity(product.id, cartItem.quantity - 1);
                                }
                              }}
                              disabled={!cartItem || cartItem.quantity <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1);
                              }}
                              className="flex-1 bg-[#3e2626] hover:bg-[#5a3a3a] text-white h-9"
                              disabled={product.stock === 0 || (cartItem && cartItem.quantity >= product.stock)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cartItem) {
                                  updateQuantity(product.id, cartItem.quantity + 1);
                                } else {
                                  addToCart(product, 1);
                                }
                              }}
                              disabled={product.stock === 0 || (cartItem && cartItem.quantity >= product.stock)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coluna Direita - Carrinho e Finalização */}
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

