'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Edit,
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  FileText,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAppStore();
  const customerId = params?.id as string;
  
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar dados do cliente
      try {
        const customerData = await adminAPI.getCustomerById(customerId);
        setCustomer(customerData);
      } catch (error) {
        // Se não encontrar como cliente, tenta buscar como usuário
        try {
          const userData = await adminAPI.getUserById(customerId);
          if (userData && userData.role === 'CUSTOMER') {
            setCustomer(userData);
          } else {
            throw new Error('Cliente não encontrado');
          }
        } catch (userError) {
          throw new Error('Cliente não encontrado');
        }
      }

      // Buscar vendas do cliente
      try {
        const salesData = await adminAPI.getSales();
        const salesArray = Array.isArray(salesData) ? salesData : (salesData?.sales || salesData?.data || []);
        const customerSales = salesArray.filter((sale: any) => sale.customerId === customerId);
        setSales(customerSales);
      } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        setSales([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados do cliente:', error);
      toast.error('Erro ao carregar dados do cliente', {
        description: error.message || 'Cliente não encontrado',
      });
      router.push('/admin/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'CONCLUIDA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
      case 'CANCELADA':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REFUNDED':
      case 'REEMBOLSADA':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'CONCLUIDA':
        return 'Concluída';
      case 'PENDING':
      case 'PENDENTE':
        return 'Pendente';
      case 'CANCELLED':
      case 'CANCELADA':
        return 'Cancelada';
      case 'REFUNDED':
      case 'REEMBOLSADA':
        return 'Reembolsada';
      default:
        return status || 'Desconhecido';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-8">
        <Card className="border border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Cliente não encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              O cliente que você está procurando não foi encontrado.
            </p>
            <Button onClick={() => router.push('/admin/customers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSpent = sales.reduce((sum, sale) => {
    const amount = sale.totalAmount || sale.total || sale.totalValue || 0;
    return sum + (Number(amount) || 0);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/customers')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={() => router.push(`/admin/customers/${customerId}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar Cliente
        </Button>
      </div>

      {/* Customer Info Card */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-[#3e2626] text-white text-xl">
                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{customer.name || 'Nome não informado'}</CardTitle>
              <CardDescription className="mt-1">
                {customer.email || 'Email não informado'}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={
                    customer.isActive !== false 
                      ? 'border-green-200 bg-green-50 text-green-800' 
                      : 'border-red-200 bg-red-50 text-red-800'
                  }
                >
                  {customer.isActive !== false ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inativo
                    </>
                  )}
                </Badge>
                {customer.createdAt && (
                  <span className="text-sm text-muted-foreground">
                    Cliente desde {formatDate(customer.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações de Contato</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground">{customer.email || 'Não informado'}</p>
                  </div>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p className="text-sm text-foreground">{customer.phone}</p>
                    </div>
                  </div>
                )}
                {customer.cpf && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CPF</p>
                      <p className="text-sm text-foreground">{customer.cpf}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Endereço</h3>
              <div className="space-y-3">
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                      <p className="text-sm text-foreground">
                        {customer.address}
                        {customer.city && `, ${customer.city}`}
                        {customer.state && ` - ${customer.state}`}
                        {customer.zipCode && ` (${customer.zipCode})`}
                      </p>
                    </div>
                  </div>
                )}
                {!customer.address && (
                  <p className="text-sm text-muted-foreground">Endereço não informado</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-semibold mt-1">{sales.length}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gasto</p>
                <p className="text-2xl font-semibold mt-1">{formatCurrency(totalSpent)}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-semibold mt-1">
                  {sales.length > 0 ? formatCurrency(totalSpent / sales.length) : formatCurrency(0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales History */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
          <CardDescription>
            Lista de todos os pedidos realizados por este cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Este cliente ainda não realizou nenhum pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale: any) => {
                const saleAmount = sale.totalAmount || sale.total || sale.totalValue || 0;
                const saleStatus = sale.status || 'UNKNOWN';
                
                return (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-foreground">
                          Pedido #{sale.saleNumber || sale.id?.slice(0, 8) || 'N/A'}
                        </p>
                        <Badge variant="outline" className={getStatusColor(saleStatus)}>
                          {getStatusLabel(saleStatus)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {sale.createdAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(sale.createdAt)}</span>
                          </div>
                        )}
                        {sale.paymentMethod && (
                          <span>Pagamento: {sale.paymentMethod}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(Number(saleAmount))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

