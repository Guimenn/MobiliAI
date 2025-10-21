'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { adminAPI } from '@/lib/api-admin';
import { useAppStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
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
  Star
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    activeStores: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simular usuário admin para demonstração
        const mockUser = {
          id: 1,
          name: 'Administrador',
          email: 'admin@mobiliai.com',
          role: 'ADMIN'
        };
        
        setUser(mockUser);
        setLastUpdated(new Date());
        await loadDashboardData();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    // Usar setTimeout para evitar problemas de hidratação
    const timer = setTimeout(checkAuth, 0);
    return () => clearTimeout(timer);
  }, []);

  // Atualizar dados a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar dados reais da API
      const [usersData, storesData, productsData] = await Promise.all([
        adminAPI.getUsers(token || ''),
        adminAPI.getStores(token || ''),
        adminAPI.getProducts(token || '')
      ]);

      // Processar dados para stats
      const users = usersData.ok ? await usersData.json() : [];
      const stores = storesData.ok ? await storesData.json() : [];
      const products = productsData.ok ? await productsData.json() : [];

      const statsData = {
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalStores: Array.isArray(stores) ? stores.length : 0,
        totalProducts: Array.isArray(products) ? products.length : 0,
        monthlyRevenue: 0, // Calcular baseado nas vendas
        activeStores: Array.isArray(stores) ? stores.filter((s: any) => s.isActive).length : 0
      };

      setStats(statsData);

      setRecentSales([]); // Dados de vendas não disponíveis
      setTopProducts(Array.isArray(products) ? products.slice(0, 5) : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Fallback para dados mock em caso de erro
      setStats({
        totalUsers: 12,
        totalStores: 3,
        totalProducts: 45,
        monthlyRevenue: 12500,
        activeStores: 3
      });

      setRecentSales([
        {
          id: 1,
          customer: { name: 'Ana Silva' },
          store: { name: 'Loja Centro' },
          total: 125.50,
          createdAt: '2024-01-15T10:30:00.000Z',
          status: 'completed'
        },
        {
          id: 2,
          customer: { name: 'Carlos Santos' },
          store: { name: 'Loja Norte' },
          total: 89.90,
          createdAt: '2024-01-14T14:20:00.000Z',
          status: 'completed'
        }
      ]);

      setTopProducts([
        {
          id: 1,
          name: 'Tinta Branca Premium',
          sales: 45,
          revenue: 2250.00
        },
        {
          id: 2,
          name: 'Tinta Azul Marinho',
          sales: 32,
          revenue: 1600.00
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Limpar dados locais
    localStorage.clear();
    sessionStorage.clear();

    // Redirecionar para login
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <NoSSR fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    }>
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="w-8 h-8 bg-[#3e2626] rounded-lg flex items-center justify-center mr-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">MobiliAI</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
            
          {/* User Profile */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-[#3e2626] text-white">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Administrador'}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            <div className="space-y-1">
              <div className="flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer bg-[#3e2626] text-white">
                <Home className="h-4 w-4 mr-3" />
                Dashboard
                <ChevronDown className="h-4 w-4 ml-auto" />
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">GESTÃO</p>
              <div className="space-y-1">
                <div 
                  onClick={() => router.push('/admin/stores')}
                  className="flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100"
                >
                  <Store className="h-4 w-4 mr-3" />
                  Lojas
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => router.push('/admin/users')}
                  className="flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100"
                >
                  <Users className="h-4 w-4 mr-3" />
                  Usuários
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => router.push('/admin/products')}
                  className="flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100"
                >
                  <Package className="h-4 w-4 mr-3" />
                  Produtos
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => router.push('/admin/sales')}
                  className="flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100"
                >
                  <ShoppingCart className="h-4 w-4 mr-3" />
                  Vendas
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => router.push('/admin/reports')}
                  className="flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100"
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Relatórios
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => router.push('/admin/customers')}
                  className="flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-3" />
                  Clientes
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => router.push('/admin/settings')}
                  className="flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Configurações
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SISTEMA</p>
              <div className="space-y-1">
                <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <Activity className="h-4 w-4 mr-3" />
                  Atividade
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <Shield className="h-4 w-4 mr-3" />
                  Segurança
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <FileText className="h-4 w-4 mr-3" />
                  Logs
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
              </div>
            </div>
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">N</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Dashboard Content */}
        <main className="p-6">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b mb-6 rounded-lg">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden mr-2"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
                  <p className="text-sm text-gray-600">
                    Gerencie usuários, produtos, lojas e vendas do sistema.
                    <span className="ml-2 text-xs text-gray-500">
                      <ClientOnly fallback="Carregando...">
                        Última atualização: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('pt-BR') : 'Carregando...'}
                      </ClientOnly>
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search here"
                    className="pl-10 w-64"
                  />
                </div>
            
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">9</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <DashboardContent 
            stats={stats}
            recentSales={recentSales}
            topProducts={topProducts}
            lastUpdated={lastUpdated}
          />
        </main>
      </div>
    </div>
    </NoSSR>
  );
}

// Componente do Dashboard Principal
function DashboardContent({ stats, recentSales, topProducts, lastUpdated }: any) {
  return (
    <>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Vendas por Período */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Vendas por Período</CardTitle>
            <CardDescription>Performance das vendas nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Gráfico de vendas</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 mr-2" />
              dados atualizados há 2 dias
            </div>
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Receita Mensal</CardTitle>
            <CardDescription>(+15%) aumento nas vendas de hoje.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Gráfico de receita</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 mr-2" />
              atualizado há 4 min
            </div>
          </CardContent>
        </Card>

        {/* Produtos Vendidos */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Produtos Vendidos</CardTitle>
            <CardDescription>Performance dos produtos mais vendidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <Package className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Gráfico de produtos</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 mr-2" />
              atualizado agora
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-sm text-green-600">+55% que semana passada</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Lojas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStores}</p>
                <p className="text-sm text-green-600">+3% que mês passado</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                <p className="text-3xl font-bold text-gray-900">R$ {stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600">+1% que ontem</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-sm text-gray-500">Atualizado agora</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <div className="text-center text-white">
              <Store className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-semibold">Lojas</p>
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900">Gestão de Lojas</h3>
            <p className="text-sm text-gray-600">Gerencie todas as lojas da empresa</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <div className="text-center text-white">
              <Users className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-semibold">Usuários</p>
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900">Gestão de Usuários</h3>
            <p className="text-sm text-gray-600">Gerencie funcionários e gerentes</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <Package className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-semibold">Produtos</p>
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900">Catálogo de Produtos</h3>
            <p className="text-sm text-gray-600">Gerencie o catálogo de produtos</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}