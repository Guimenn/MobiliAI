'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { 
  DollarSign, 
  CheckCircle,
  Plus,
  Download, 
  Search, 
  UserPlus as UserPlusIcon,
  Edit,
  Eye,
  Filter,
  User,
  Users,
  UserPlus
} from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const { token } = useAppStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0,
    totalSpent: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadCustomersData();
  }, []);

  const loadCustomersData = async () => {
    try {
      setIsLoading(true);
      
      // Tentar usar o endpoint específico de clientes primeiro
      try {
        const customersResponse = await adminAPI.getCustomers(1, 1000, '');
        
        // Verificar se a resposta tem a estrutura esperada
        // O endpoint retorna { customers: [...], pagination: {...} }
        const customers = Array.isArray(customersResponse) 
          ? customersResponse 
          : (customersResponse?.customers || customersResponse?.data || []);
        
        setCustomers(customers);
        
        // Calcular estatísticas
        const activeCustomers = customers.filter((customer: any) => customer.isActive !== false).length;
        const newCustomers = customers.filter((customer: any) => {
          if (!customer.createdAt) return false;
          const createdAt = new Date(customer.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdAt > thirtyDaysAgo;
        }).length;
        
        // Calcular total gasto (se houver dados de vendas)
        let totalSpent = 0;
        if (customers.length > 0) {
          // Tentar buscar vendas para calcular total gasto
          try {
            const sales = await adminAPI.getSales();
            if (Array.isArray(sales)) {
              customers.forEach((customer: any) => {
                const customerSales = sales.filter((sale: any) => sale.customerId === customer.id);
                const customerTotal = customerSales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
                totalSpent += customerTotal;
              });
            }
          } catch (salesError) {
            console.log('Não foi possível calcular total gasto:', salesError);
          }
        }
        
        setStats({
          totalCustomers: customers.length,
          activeCustomers,
          newCustomers,
          totalSpent
        });
        
        return;
      } catch (customersError) {
        console.log('Endpoint de clientes não disponível, tentando buscar usuários:', customersError);
      }
      
      // Fallback: buscar todos os usuários e filtrar clientes
      const usersData = await adminAPI.getUsers();
      
      // Verificar se a resposta tem a estrutura esperada
      const users = Array.isArray(usersData) 
        ? usersData 
        : (usersData?.data || usersData?.users || []);
      
      // Filtrar apenas clientes
      const customersData = users.filter((user: any) => user.role === 'CUSTOMER');
      
      setCustomers(customersData);
      
      // Calcular estatísticas
      const activeCustomers = customersData.filter((customer: any) => customer.isActive !== false).length;
      const newCustomers = customersData.filter((customer: any) => {
        if (!customer.createdAt) return false;
        const createdAt = new Date(customer.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt > thirtyDaysAgo;
      }).length;
      
      // Calcular total gasto (se houver dados de vendas)
      let totalSpent = 0;
      if (customersData.length > 0) {
        try {
          const sales = await adminAPI.getSales();
          if (Array.isArray(sales)) {
            customersData.forEach((customer: any) => {
              const customerSales = sales.filter((sale: any) => sale.customerId === customer.id);
              const customerTotal = customerSales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
              totalSpent += customerTotal;
            });
          }
        } catch (salesError) {
          console.log('Não foi possível calcular total gasto:', salesError);
        }
      }
      
      setStats({
        totalCustomers: customersData.length,
        activeCustomers,
        newCustomers,
        totalSpent
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados do banco:', error);
      // Em caso de erro, mostrar lista vazia
      setCustomers([]);
      setStats({
        totalCustomers: 0,
        activeCustomers: 0,
        newCustomers: 0,
        totalSpent: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && customer.isActive) ||
                         (filterStatus === 'inactive' && !customer.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% em relação ao mês anterior
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalCustomers > 0 ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100) : 0}% do total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.newCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    Últimos 30 dias
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total Gasto</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% em relação ao mês anterior
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                        <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar clientes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                      </div>
                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Ativos</option>
                      <option value="inactive">Inativos</option>
                    </select>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                          </Button>
                        </div>
                      </div>
              </CardContent>
            </Card>

            {/* Customers List */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Clientes</CardTitle>
                <CardDescription>
                  {filteredCustomers.length} cliente(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626]"></div>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
                    <p className="text-gray-500">Os clientes aparecerão aqui quando forem cadastrados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                    {filteredCustomers.map((customer: any) => (
                      <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[#3e2626] text-white">
                              {customer.name?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name || 'Nome não informado'}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                            {customer.phone && (
                              <p className="text-xs text-gray-400">{customer.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <Badge variant={customer.isActive !== false ? 'default' : 'secondary'}>
                              {customer.isActive !== false ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Cadastrado em {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                            <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}