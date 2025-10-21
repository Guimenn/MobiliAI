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
import { adminAPI } from '@/lib/api-admin';
import { useAppStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
import HydrationBoundary from '@/components/HydrationBoundary';
import NoSSR from '@/components/NoSSR';
import { 
  Building2, 
  Bell, 
  LogOut, 
  Users, 
  Store,      
  Package, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  BarChart3,
  Building,
  CheckCircle,
  Zap, 
  Plus,
  UserCheck,
  Download, 
  Settings,
  ArrowUp,
  Search, 
  Menu,
  ChevronDown,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Filter,
  MoreHorizontal,
  Home,
  FileText,
  User,
  Users2,
  Grid3X3,
  ShoppingCart,
  Shield,
  BookOpen,
  Layers,
  History,
  MapPin,
  Phone,
  Mail,
  Heart,
  Star,
  Tag,
  BarChart,
  TrendingDown,
  Calendar,
  Clock,
  CreditCard,
  Receipt,
  UserPlus as UserPlusIcon,
  UserMinus,
  Crown
} from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    const checkAuth = async () => {
      if (!currentUser || !token) {
        router.push('/login');
        return;
      }
      await loadCustomersData();
    };

    checkAuth();
  }, [currentUser, token, router]);

  const loadCustomersData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar usuários do banco de dados
      const usersResponse = await adminAPI.getUsers(token);
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

  const handleLogout = () => {
    router.push('/login');
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
    <NoSSR>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"> 
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#3e2626]">MobiliAI</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
      </div>

            {/* User Profile */}
            <div className="p-6 border-b">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#3e2626] text-white">
                    {currentUser?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{currentUser?.role || 'Administrador'}</p>
              </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  onClick={() => router.push('/admin/dashboard')}
                >
                  <Home className="h-4 w-4 mr-3" />
                  Dashboard
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </div>

              <div className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  GESTÃO
                </p>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/stores')}
                  >
                    <Store className="h-4 w-4 mr-3" />
                    Lojas
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/users')}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Usuários
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/products')}
                  >
                    <Package className="h-4 w-4 mr-3" />
                    Produtos
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/sales')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-3" />
                    Vendas
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/reports')}
                  >
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Relatórios
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-[#3e2626] bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/customers')}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Clientes
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/settings')}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configurações
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
              </div>
              </div>

              <div className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  SISTEMA
                </p>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  >
                    <Activity className="h-4 w-4 mr-3" />
                    Atividade
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    Segurança
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Logs
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </div>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
            <div>
                  <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                  <p className="text-sm text-gray-500">Gerencie todos os clientes do sistema</p>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
                <Button size="sm" className="bg-[#3e2626] hover:bg-[#3e2626]/90">
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
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
    </div>
    </NoSSR>
  );
}