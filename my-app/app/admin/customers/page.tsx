'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { 
  DollarSign, 
  CheckCircle,
  Search, 
  User,
  Users,
  UserPlus,
  Eye,
  Edit,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const { token } = useAppStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadCustomersData();
  }, []);

  const loadCustomersData = async () => {
    try {
      setIsLoading(true);
      
      try {
        const customersResponse = await adminAPI.getCustomers(1, 1000, '');
        
        const customers = Array.isArray(customersResponse) 
          ? customersResponse 
          : (customersResponse?.customers || customersResponse?.data || []);
        
        setCustomers(customers);
      } catch (customersError) {
        console.log('Endpoint de clientes não disponível, tentando buscar usuários:', customersError);
        
        const usersData = await adminAPI.getUsers();
        const users = Array.isArray(usersData) 
          ? usersData 
          : (usersData?.data || usersData?.users || []);
        
        const customersData = users.filter((user: any) => user.role === 'CUSTOMER');
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do banco:', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const activeCustomers = customers.filter((customer: any) => customer.isActive !== false).length;
    const newCustomers = customers.filter((customer: any) => {
      if (!customer.createdAt) return false;
      const createdAt = new Date(customer.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt > thirtyDaysAgo;
    }).length;
    
    let totalSpent = 0;
    if (customers.length > 0) {
      try {
        adminAPI.getSales().then((sales) => {
          if (Array.isArray(sales) && sales.length > 0) {
            customers.forEach((customer: any) => {
              const customerSales = sales.filter((sale: any) => sale.customerId === customer.id);
              const customerTotal = customerSales.reduce((sum: number, sale: any) => {
                const saleAmount = sale.totalAmount ?? sale.total ?? sale.totalValue ?? 0;
                return sum + (Number(saleAmount) || 0);
              }, 0);
              totalSpent += customerTotal;
            });
          }
        }).catch(() => {});
      } catch (salesError) {
        console.error('Erro ao calcular total gasto:', salesError);
      }
    }
    
    return {
      totalCustomers: customers.length,
      activeCustomers,
      newCustomers,
      totalSpent
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && customer.isActive) ||
                           (filterStatus === 'inactive' && !customer.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, filterStatus]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-3xl border border-border bg-[#3e2626] px-8 py-10 text-primary-foreground shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <Badge
              variant="outline"
              className="border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
            >
              Gestão de Clientes
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Clientes
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Gerencie e acompanhe todos os clientes cadastrados no sistema. Visualize informações, histórico e estatísticas.
              </p>
            </div>
          </div>

          <CustomersStats stats={stats} formatPrice={formatPrice} />
        </div>
      </section>

      {/* Filters */}
      <Card className="border border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar clientes por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="status-filter" className="text-sm mb-2 block">Status</Label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum cliente encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros para encontrar clientes.'
                : 'Os clientes aparecerão aqui quando forem cadastrados.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer: any) => (
            <Card 
              key={customer.id} 
              className="border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="bg-muted text-foreground">
                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {customer.name || 'Nome não informado'}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={
                            customer.isActive !== false 
                              ? 'border-border bg-muted/50 text-foreground' 
                              : 'border-border bg-muted/50 text-muted-foreground'
                          }
                        >
                          {customer.isActive !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{customer.email || 'Email não informado'}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.createdAt && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Cadastrado em {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                      className="h-10 w-10"
                      title="Visualizar cliente"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => router.push(`/admin/customers/${customer.id}/edit`)}
                      className="h-10 w-10"
                      title="Editar cliente"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomersStats({ stats, formatPrice }: any) {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-4 sm:grid-cols-2 lg:max-w-xl">
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <Users className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{stats.totalCustomers}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Total</p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <CheckCircle className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{stats.activeCustomers}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Ativos</p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <UserPlus className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{stats.newCustomers}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Novos (30d)</p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <DollarSign className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{formatPrice(stats.totalSpent)}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Total Gasto</p>
      </div>
    </div>
  );
}
