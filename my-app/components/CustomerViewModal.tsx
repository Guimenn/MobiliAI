'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  Heart,
  Star,
  CreditCard,
  Package,
  TrendingUp,
  Eye,
  FileText
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  cpf?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Dados relacionados
  purchases?: Sale[];
  favorites?: Favorite[];
  cartItems?: CartItem[];
  reviews?: ProductReview[];
}

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: SaleItem[];
}

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    name: string;
    category: string;
  };
}

interface Favorite {
  id: string;
  createdAt: string;
  product: {
    name: string;
    price: number;
    category: string;
  };
}

interface CartItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    category: string;
  };
}

interface ProductReview {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  product: {
    name: string;
  };
}

interface CustomerViewModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerViewModal({ customer, isOpen, onClose }: CustomerViewModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'purchases' | 'favorites' | 'reviews'>('info');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !customer) return null;

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
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Concluída';
      case 'PENDING': return 'Pendente';
      case 'CANCELLED': return 'Cancelada';
      case 'REFUNDED': return 'Reembolsada';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'PIX': return 'PIX';
      case 'CREDIT_CARD': return 'Cartão de Crédito';
      case 'DEBIT_CARD': return 'Cartão de Débito';
      case 'CASH': return 'Dinheiro';
      default: return method;
    }
  };

  // Calcular estatísticas do cliente
  const totalPurchases = customer.purchases?.length || 0;
  const totalSpent = customer.purchases?.reduce((sum, purchase) => sum + purchase.totalAmount, 0) || 0;
  const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
  const totalFavorites = customer.favorites?.length || 0;
  const totalReviews = customer.reviews?.length || 0;
  const averageRating = customer.reviews?.length 
    ? customer.reviews.reduce((sum, review) => sum + review.rating, 0) / customer.reviews.length 
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-[#3e2626] text-white text-xl">
                {customer.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
              <p className="text-gray-600">{customer.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={customer.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {customer.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                <span className="text-sm text-gray-500">
                  Cliente desde {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{totalPurchases}</p>
                    <p className="text-xs text-gray-500">Compras</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                    <p className="text-xs text-gray-500">Total Gasto</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Heart className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{totalFavorites}</p>
                    <p className="text-xs text-gray-500">Favoritos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <Star className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {averageRating > 0 ? averageRating.toFixed(1) : '0'}
                    </p>
                    <p className="text-xs text-gray-500">Avaliação Média</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-[#3e2626] text-[#3e2626]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Informações</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'purchases'
                  ? 'border-[#3e2626] text-[#3e2626]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Compras ({totalPurchases})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'favorites'
                  ? 'border-[#3e2626] text-[#3e2626]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>Favoritos ({totalFavorites})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-[#3e2626] text-[#3e2626]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Avaliações ({totalReviews})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Informações Pessoais */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Telefone</p>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                  {customer.cpf && (
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">CPF</p>
                        <p className="text-sm text-gray-600">{customer.cpf}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cadastrado em</p>
                      <p className="text-sm text-gray-600">{formatDate(customer.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              {(customer.address || customer.city || customer.state || customer.zipCode) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        {customer.address && (
                          <p className="text-sm text-gray-900">{customer.address}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {[customer.city, customer.state, customer.zipCode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Estatísticas Detalhadas */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Ticket Médio</p>
                    <p className="text-2xl font-bold text-[#3e2626]">{formatCurrency(averageOrderValue)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Última Compra</p>
                    <p className="text-sm text-gray-600">
                      {customer.purchases && customer.purchases.length > 0
                        ? formatDate(customer.purchases[0].createdAt)
                        : 'Nenhuma compra'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {customer.purchases && customer.purchases.length > 0 ? (
                customer.purchases.map((purchase) => (
                  <Card key={purchase.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">#{purchase.saleNumber}</p>
                          <p className="text-sm text-gray-600">{formatDate(purchase.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(purchase.totalAmount)}</p>
                          <Badge className={getStatusColor(purchase.status)}>
                            {getStatusLabel(purchase.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{getPaymentMethodLabel(purchase.paymentMethod)}</span>
                        <span>{purchase.items?.length || 0} item(s)</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma compra realizada</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {customer.favorites && customer.favorites.length > 0 ? (
                customer.favorites.map((favorite) => (
                  <Card key={favorite.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{favorite.product.name}</p>
                          <p className="text-sm text-gray-600">{favorite.product.category}</p>
                          <p className="text-sm text-gray-500">Adicionado em {formatDate(favorite.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#3e2626]">
                            {formatCurrency(favorite.product.price)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum produto favoritado</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {customer.reviews && customer.reviews.length > 0 ? (
                customer.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">{formatDate(review.createdAt)}</span>
                          </div>
                          <p className="font-semibold text-gray-900">{review.product.name}</p>
                          {review.title && (
                            <p className="text-sm font-medium text-gray-800 mt-1">{review.title}</p>
                          )}
                          {review.comment && (
                            <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma avaliação realizada</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}