'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Truck,
  Shield,
  Gift,
  Heart,
  Package,
  CheckCircle,
  Star,
  Tag,
  Zap,
  Sparkles,
  Clock,
  MapPin,
  Phone,
  Mail,
  Sofa,
  Table,
  Users,
  Archive,
  BookOpen,
  Frame,
  Lamp,
  Package as PackageIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const router = useRouter();
  const { cart, cartTotal, removeFromCart, updateCartItemQuantity, clearCart, addToCart } = useAppStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showEmptyCart, setShowEmptyCart] = useState(false);

  // Função para renderizar ícone baseado na categoria
  const renderCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'sofa': Sofa,
      'mesa': Table,
      'cadeira': Users,
      'armario': Archive,
      'cama': Package,
      'decoracao': Frame,
      'iluminacao': Lamp,
      'outros': PackageIcon,
    };
    
    const IconComponent = iconMap[category] || PackageIcon;
    return <IconComponent className="h-6 w-6" />;
  };

  // Função para calcular desconto
  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  // Função para calcular frete
  const calculateShipping = () => {
    if (cartTotal >= 500) return 0; // Frete grátis acima de R$ 500
    return 29.90; // Frete padrão
  };

  // Função para calcular total final
  const finalTotal = cartTotal + calculateShipping();

  // Função para checkout
  const handleCheckout = async () => {
    setIsCheckingOut(true);
    // Simular processo de checkout
    setTimeout(() => {
      setIsCheckingOut(false);
      alert('Redirecionando para o pagamento...');
      // Aqui você integraria com o sistema de pagamento
    }, 2000);
  };

  // Função para continuar comprando
  const continueShopping = () => {
    router.push('/products');
  };

  // Função para limpar carrinho
  const handleClearCart = () => {
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
      clearCart();
    }
  };

  // Função para adicionar aos favoritos
  const addToFavorites = (product: any) => {
    // Aqui você integraria com o sistema de favoritos
    alert(`${product.name} adicionado aos favoritos!`);
  };

  // Produtos recomendados (simulados)
  const recommendedProducts = [
    {
      id: 'rec1',
      name: 'Cadeira Executiva Premium',
      price: 899.99,
      originalPrice: 1199.99,
      category: 'cadeira',
      color: '#8B4513',
      rating: 4.8,
      reviews: 89
    },
    {
      id: 'rec2',
      name: 'Mesa de Centro Elegante',
      price: 1299.99,
      originalPrice: 1599.99,
      category: 'mesa',
      color: '#D2B48C',
      rating: 4.7,
      reviews: 124
    },
    {
      id: 'rec3',
      name: 'Luminária Pendant Moderna',
      price: 599.99,
      category: 'iluminacao',
      color: '#A0522D',
      rating: 4.6,
      reviews: 67
    }
  ];

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        
        {/* Empty Cart State */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Empty Cart Icon */}
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-8 shadow-lg">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
            </div>
            
            <h1 className="text-4xl font-bold text-[#3e2626] mb-4">
              Seu carrinho está vazio
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Que tal adicionar alguns móveis incríveis ao seu carrinho?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={continueShopping}
                className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <span>Continuar Comprando</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push('/')}
                className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 flex items-center space-x-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar ao Início</span>
              </Button>
            </div>
          </div>
          
          {/* Recommended Products */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-[#3e2626] text-center mb-12">
              Produtos Recomendados
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recommendedProducts.map((product) => (
                <Card key={product.id} className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="relative">
                    <div 
                      className="aspect-square flex items-center justify-center relative"
                      style={{ backgroundColor: product.color }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
                      <div className="relative z-10 text-center">
                        {renderCategoryIcon(product.category)}
                        <p className="text-white font-semibold text-sm mt-2">Móvel Premium</p>
                      </div>
                    </div>
                    
                    {/* Discount Badge */}
                    {product.originalPrice && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 text-white">
                          -{calculateDiscount(product.originalPrice, product.price)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-[#3e2626]">
                        {product.name}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addToFavorites(product)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.rating} ({product.reviews} avaliações)
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-[#3e2626]">
                          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            R$ {product.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => addToCart(product, 1)}
                        className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] rounded-full w-10 h-10 p-0 hover:scale-110 transition-all duration-300"
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              onClick={() => router.back()}
              className="text-[#3e2626] hover:bg-[#3e2626]/10 rounded-full p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#3e2626]">
                Carrinho de Compras
              </h1>
              <p className="text-gray-600 mt-1">
                {cart.length} {cart.length === 1 ? 'item' : 'itens'} no seu carrinho
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline"
            onClick={handleClearCart}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-full px-4 py-2"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Carrinho
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item) => (
              <Card key={item.product.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row">
                  {/* Product Image */}
                  <div className="sm:w-48 h-48 sm:h-auto relative">
                    <div 
                      className="w-full h-full flex items-center justify-center relative"
                      style={{ backgroundColor: item.product.color || '#8B4513' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
                      <div className="relative z-10 text-center">
                        {renderCategoryIcon(item.product.category)}
                        <p className="text-white font-semibold text-sm mt-2">Móvel Premium</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#3e2626] mb-2">
                          {item.product.name}
                        </h3>
                        {item.product.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {item.product.description}
                          </p>
                        )}
                        
                        {/* Product Details */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                          {item.product.category && (
                            <div className="flex items-center space-x-1">
                              {renderCategoryIcon(item.product.category)}
                              <span className="capitalize">{item.product.category}</span>
                            </div>
                          )}
                          {item.product.material && (
                            <div className="flex items-center space-x-1">
                              <Package className="h-4 w-4" />
                              <span>{item.product.material}</span>
                            </div>
                          )}
                          {item.product.brand && (
                            <div className="flex items-center space-x-1">
                              <Tag className="h-4 w-4" />
                              <span>{item.product.brand}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addToFavorites(item.product)}
                          className="text-gray-400 hover:text-red-500 self-end"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 self-end"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Price and Quantity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 p-0 rounded-full"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-lg font-semibold text-[#3e2626] min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 p-0 rounded-full"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-[#3e2626]">
                            R$ {(item.product.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-sm text-gray-500">
                              R$ {item.product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white">
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Resumo do Pedido</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Order Details */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</span>
                    <span className="font-semibold">
                      R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Frete</span>
                    <span className="font-semibold">
                      {calculateShipping() === 0 ? (
                        <span className="text-green-600 flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Grátis</span>
                        </span>
                      ) : (
                        `R$ ${calculateShipping().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      )}
                    </span>
                  </div>
                  
                  {calculateShipping() > 0 && (
                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <Truck className="h-3 w-3 text-blue-600" />
                        <span>Frete grátis para compras acima de R$ 500,00</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold text-[#3e2626]">
                      <span>Total</span>
                      <span>R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
                
                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Garantia de 1 ano</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Entrega rápida em até 7 dias</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Pagamento seguro</span>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <Button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-[#3e2626] text-white hover:bg-[#2a1f1f] py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>Finalizar Compra</span>
                    </>
                  )}
                </Button>
                
                {/* Continue Shopping */}
                <Button 
                  variant="outline"
                  onClick={continueShopping}
                  className="w-full border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white py-3 rounded-full font-semibold transition-all duration-300"
                >
                  Continuar Comprando
                </Button>
              </CardContent>
            </Card>
            
            {/* Trust Signals */}
            <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Compra Segura</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Seus dados estão protegidos com criptografia SSL
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Recommended Products */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-[#3e2626] text-center mb-12">
            Você também pode gostar
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recommendedProducts.map((product) => (
              <Card key={product.id} className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                <div className="relative">
                  <div 
                    className="aspect-square flex items-center justify-center relative"
                    style={{ backgroundColor: product.color }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
                    <div className="relative z-10 text-center">
                      {renderCategoryIcon(product.category)}
                      <p className="text-white font-semibold text-sm mt-2">Móvel Premium</p>
                    </div>
                  </div>
                  
                  {/* Discount Badge */}
                  {product.originalPrice && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-500 text-white">
                        -{calculateDiscount(product.originalPrice, product.price)}%
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-[#3e2626]">
                      {product.name}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addToFavorites(product)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating} ({product.reviews} avaliações)
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-[#3e2626]">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          R$ {product.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => addToCart(product, 1)}
                      className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] rounded-full w-10 h-10 p-0 hover:scale-110 transition-all duration-300"
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}






