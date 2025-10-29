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
      
      // Carregar usuários do banco de dados
      const usersResponse = await adminAPI.getUsers();
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Verificar se usersData é um array e filtrar apenas clientes
        const customersData = Array.isArray(usersData) 
          ? usersData.filter((user: any) => user.role === 'CUSTOMER')
          : [];
        setCustomers(customersData);
        
        // Calcular estatísticas
        const activeCustomers = customersData.filter((customer: any) => customer.isActive).length;
        const newCustomers = customersData.filter((customer: any) => {
          const createdAt = new Date(customer.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdAt > thirtyDaysAgo;
        }).length;
        
        setStats({
          totalCustomers: customersData.length,
          activeCustomers,
          newCustomers,
          totalSpent: 0 // Seria calculado com dados de vendas
        });
      } else {
        console.log('API de usuários não disponível, usando dados mock');
        // Dados mock para clientes
        const mockCustomers = [
          {
            id: '1',
            name: 'João Silva',
            email: 'joao@email.com',
            phone: '(11) 99999-9999',
            role: 'CUSTOMER',
            isActive: true,
            createdAt: new Date('2024-01-10'),
            totalSpent: 1250.00,
            lastPurchase: new Date('2024-01-15')
          },
          {
            id: '2',
            name: 'Maria Santos',
            email: 'maria@email.com',
            phone: '(11) 88888-8888',
            role: 'CUSTOMER',
            isActive: true,
            createdAt: new Date('2024-01-05'),
            totalSpent: 850.00,
            lastPurchase: new Date('2024-01-14')
          },
          {
            id: '3',
            name: 'Pedro Costa',
            email: 'pedro@email.com',
            phone: '(11) 77777-7777',
            role: 'CUSTOMER',
            isActive: false,
            createdAt: new Date('2023-12-20'),
            totalSpent: 2100.00,
            lastPurchase: new Date('2024-01-13')
          }
        ];
        
        setCustomers(mockCustomers);
        
        // Calcular estatísticas dos dados mock
        const activeCustomers = mockCustomers.filter(customer => customer.isActive).length;
        const newCustomers = mockCustomers.filter(customer => {
          const createdAt = new Date(customer.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdAt > thirtyDaysAgo;
        }).length;
        
        setStats({
          totalCustomers: mockCustomers.length,
          activeCustomers,
          newCustomers,
          totalSpent: mockCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0)
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do banco:', error);
      setCustomers([]);
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
                            <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                              {customer.isActive ? 'Ativo' : 'Inativo'}
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