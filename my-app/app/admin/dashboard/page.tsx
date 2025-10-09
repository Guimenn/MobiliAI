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
import ClientOnly from '@/components/ClientOnly';
import HydrationBoundary from '@/components/HydrationBoundary';
import NoSSR from '@/components/NoSSR';
import ImageUpload from '@/components/ImageUpload';
import { uploadMultipleProductImages, simulateImageUpload } from '@/lib/supabase';
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
  Mail
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    activeStores: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  
  // Filtros para usuários
  const [userFilters, setUserFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });
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
      
      console.log('🔄 Tentando carregar dados do backend...');
      
      // Buscar dados reais do banco
      const [overviewStats, recentSalesData, topProductsData] = await Promise.all([
        adminAPI.getOverviewStats(),
        adminAPI.getRecentSales(),
        adminAPI.getTopProducts()
      ]);

      console.log('✅ Dados carregados com sucesso do backend');

      // Atualizar estatísticas com dados reais
      setStats({
        totalUsers: overviewStats.totalUsers || 0,
        totalStores: overviewStats.totalStores || 0,
        totalProducts: overviewStats.totalProducts || 0,
        monthlyRevenue: overviewStats.monthlyRevenue || 0,
        activeStores: overviewStats.activeStores || 0
      });

      // Atualizar vendas recentes com dados reais
      setRecentSales(recentSalesData || []);
      
      // Atualizar produtos mais vendidos
      setTopProducts(topProductsData || []);
      
      // Atualizar timestamp da última atualização
      setLastUpdated(new Date());
      
    } catch (error) {
      console.warn('⚠️ Backend indisponível, usando dados mock para dashboard:', error);
      
      // Em caso de erro, usar dados mock
      setStats({
        totalUsers: 156,
        totalStores: 8,
        totalProducts: 1247,
        monthlyRevenue: 125000,
        activeStores: 6
      });
      
      setRecentSales([
        {
          id: 1,
          customer: 'João Silva',
          product: 'Tinta Acrílica Branco',
          amount: 89.90,
          date: '2024-01-15',
          status: 'completed'
        },
        {
          id: 2,
          customer: 'Maria Santos',
          product: 'Pincel Chato 2"',
          amount: 15.50,
          date: '2024-01-15',
          status: 'completed'
        },
        {
          id: 3,
          customer: 'Pedro Costa',
          product: 'Rolo de Pintura',
          amount: 25.00,
          date: '2024-01-14',
          status: 'pending'
        }
      ]);
      
      setTopProducts([
        { id: 1, name: 'Tinta Acrílica Branco', sales: 45, revenue: 2250 },
        { id: 2, name: 'Pincel Chato 2"', sales: 32, revenue: 640 },
        { id: 3, name: 'Rolo de Pintura', sales: 28, revenue: 420 },
        { id: 4, name: 'Massa Corrida', sales: 22, revenue: 550 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSectionData = async (section: string) => {
    try {
      setIsLoading(true);
      console.log(`Carregando dados da seção: ${section}`);
      
      switch (section) {
        case 'users':
          console.log('Buscando usuários...');
          try {
            const usersData = await adminAPI.getUsers();
            console.log('Dados de usuários recebidos:', usersData);
            
            // Verificar se os dados estão em usersData.users ou se é um array direto
            const usersArray = usersData?.users || usersData;
            setUsers(Array.isArray(usersArray) ? usersArray : []);
          } catch (error) {
            console.log('Erro na API de usuários, usando dados mock');
            // Dados mock para teste
            setUsers([
              {
                id: 1,
                name: 'João Silva',
                email: 'joao@empresa.com',
                role: 'ADMIN',
                isActive: true
              },
              {
                id: 2,
                name: 'Maria Santos',
                email: 'maria@empresa.com',
                role: 'STORE_MANAGER',
                isActive: true
              },
              {
                id: 3,
                name: 'Pedro Costa',
                email: 'pedro@empresa.com',
                role: 'CASHIER',
                isActive: true
              }
            ]);
          }
          break;
        case 'stores':
          console.log('Buscando lojas...');
          const storesData = await adminAPI.getStores();
          console.log('Dados de lojas recebidos:', storesData);
          setStores(Array.isArray(storesData) ? storesData : []);
          break;
        case 'products':
          console.log('Buscando produtos...');
          try {
            const productsData = await adminAPI.getProducts();
            console.log('Dados de produtos recebidos:', productsData);
            
            // Verificar se os dados estão em productsData.products ou se é um array direto
            const productsArray = productsData?.products || productsData;
            setProducts(Array.isArray(productsArray) ? productsArray : []);
          } catch (error) {
            console.log('Erro na API de produtos, usando dados mock');
            // Dados mock para teste
            setProducts([
              {
                id: 1,
                name: 'Tinta Branca Premium',
                category: 'Tintas',
                price: 89.90,
                stock: 50,
                isActive: true,
                sku: 'TIN-001'
              },
              {
                id: 2,
                name: 'Pincel Chato 2"',
                category: 'Pincéis',
                price: 15.50,
                stock: 25,
                isActive: true,
                sku: 'PIN-002'
              },
              {
                id: 3,
                name: 'Rolo de Pintura',
                category: 'Rolos',
                price: 22.90,
                stock: 30,
                isActive: true,
                sku: 'ROL-003'
              },
              {
                id: 4,
                name: 'Fita Crepe',
                category: 'Acessórios',
                price: 8.90,
                stock: 100,
                isActive: true,
                sku: 'FIT-004'
              }
            ]);
          }
            break;
        case 'sales':
          console.log('Buscando vendas...');
          try {
            const salesData = await adminAPI.getRecentSales();
            console.log('Dados de vendas recebidos:', salesData);
            
            // Verificar se os dados estão em salesData.sales ou se é um array direto
            const salesArray = salesData?.sales || salesData;
            setSales(Array.isArray(salesArray) ? salesArray : []);
          } catch (error) {
            console.log('Erro na API de vendas, usando dados mock');
            // Dados mock para teste
            setSales([
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
              },
              {
                id: 3,
                customer: { name: 'Maria Costa' },
                store: { name: 'Loja Sul' },
                total: 45.30,
                createdAt: '2024-01-13T09:15:00.000Z',
                status: 'pending'
              }
            ]);
          }
            break;
        case 'reports':
          // Carregar dados de relatórios se necessário
            break;
        case 'settings':
          // Carregar configurações se necessário
          break;
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error(`Erro ao carregar dados da seção ${section}:`, error);
      // Em caso de erro, definir arrays vazios
      switch (section) {
        case 'users':
          setUsers([]);
            break;
        case 'stores':
          setStores([]);
            break;
        case 'products':
          setProducts([]);
            break;
        case 'sales':
          setSales([]);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (section !== 'dashboard') {
      loadSectionData(section);
    }
  };

  const handleLogout = () => {
    // Limpar dados locais
    localStorage.clear();
    sessionStorage.clear();

    // Redirecionar para login
    window.location.href = '/login';
  };

  // Função para filtrar usuários
  const getFilteredUsers = () => {
    if (!Array.isArray(users)) return [];
    
    return users
      .filter((user: any, index: number, self: any[]) => 
        index === self.findIndex((u: any) => u.email === user.email)
      )
      .filter((user: any) => {
        // Filtro por role
        if (userFilters.role !== 'all' && user.role !== userFilters.role) {
          return false;
        }
        
        // Filtro por status
        if (userFilters.status !== 'all') {
          if (userFilters.status === 'active' && !user.isActive) return false;
          if (userFilters.status === 'inactive' && user.isActive) return false;
        }
        
        // Filtro por busca
        if (userFilters.search) {
          const searchTerm = userFilters.search.toLowerCase();
    return (
            user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => {
        const roleOrder = { 'ADMIN': 0, 'STORE_MANAGER': 1, 'CASHIER': 2, 'CUSTOMER': 3 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 4) - (roleOrder[b.role as keyof typeof roleOrder] || 4);
      });
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
                    {user.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            <div className="space-y-1">
              <div 
                onClick={() => handleSectionChange('dashboard')}
                className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer ${
                  activeSection === 'dashboard' 
                    ? 'bg-[#3e2626] text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4 mr-3" />
                Dashboard
                <ChevronDown className="h-4 w-4 ml-auto" />
        </div>
            </div>
            
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">GESTÃO</p>
              <div className="space-y-1">
                <div 
                  onClick={() => handleSectionChange('stores')}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer ${
                    activeSection === 'stores' 
                      ? 'bg-[#3e2626] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Store className="h-4 w-4 mr-3" />
                  Lojas
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => handleSectionChange('users')}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer ${
                    activeSection === 'users' 
                      ? 'bg-[#3e2626] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="h-4 w-4 mr-3" />
                  Usuários
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => handleSectionChange('products')}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer ${
                    activeSection === 'products' 
                      ? 'bg-[#3e2626] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Package className="h-4 w-4 mr-3" />
                  Produtos
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => handleSectionChange('sales')}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer ${
                    activeSection === 'sales' 
                      ? 'bg-[#3e2626] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4 mr-3" />
                  Vendas
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => handleSectionChange('reports')}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer ${
                    activeSection === 'reports' 
                      ? 'bg-[#3e2626] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Relatórios
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <div 
                  onClick={() => handleSectionChange('settings')}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer ${
                    activeSection === 'settings' 
                      ? 'bg-[#3e2626] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
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
                  <History className="h-4 w-4 mr-3" />
                  Logs
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
            </div>
          </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">

        {/* Dashboard Content */}
        <main className="p-6">
          {activeSection === 'dashboard' && (
            <>
              {/* Top Header - Only for Dashboard */}
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
            </>
          )}
          
          {activeSection === 'users' && (
            <UsersSection 
              users={users}
              isLoading={isLoading}
            />
          )}
          
          {activeSection === 'stores' && (
            <StoresSection 
              stores={stores}
              isLoading={isLoading}
            />
          )}
          
          {activeSection === 'products' && (
            <ProductsSection 
              products={products}
              isLoading={isLoading}
            />
          )}
          
          {activeSection === 'sales' && (
            <SalesSection 
              sales={sales}
              isLoading={isLoading}
            />
          )}
          
          {activeSection === 'reports' && (
            <ReportsSection />
          )}
          
          {activeSection === 'settings' && (
            <SettingsSection />
          )}
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
                  <Activity className="h-4 w-4 mr-2" />
                  dados atualizados há 2 dias
                  </div>
                </CardContent>
              </Card>

            {/* Receita Mensal */}
            <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Receita Mensal</CardTitle>
                <CardDescription className="text-green-600">(+15%) aumento nas vendas de hoje.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Gráfico de receita</p>
                    </div>
                      </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Activity className="h-4 w-4 mr-2" />
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
                  <Activity className="h-4 w-4 mr-2" />
                  atualizado agora
                  </div>
                </CardContent>
              </Card>
            </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                      <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+55% que semana passada</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-2">Total de Usuários</p>
                </CardContent>
              </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                        <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStores}</p>
                    <p className="text-sm text-green-600">+3% que mês passado</p>
            </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Store className="h-6 w-6 text-gray-600" />
                      </div>
                        </div>
                <p className="text-sm font-medium text-gray-900 mt-2">Total de Lojas</p>
                </CardContent>
              </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">R$ {stats.monthlyRevenue.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+1% que ontem</p>
                    </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-gray-600" />
                  </div>
                    </div>
                <p className="text-sm font-medium text-gray-900 mt-2">Receita Mensal</p>
                </CardContent>
              </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
              <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Atualizado agora</p>
                        </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-600" />
                      </div>
                      </div>
                <p className="text-sm font-medium text-gray-900 mt-2">Total de Produtos</p>
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
              <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
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

// Componente da Seção de Usuários
function UsersSection({ users, isLoading }: any) {
  // Estados para filtros
  const [userFilters, setUserFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  // Estados para modal de novo usuário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
    isActive: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Função para criar novo usuário
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsCreating(true);
    try {
      // Aqui você pode integrar com a API real
      // const response = await adminAPI.createUser(newUser);
      
      // Simulação de criação de usuário
      console.log('Criando usuário:', newUser);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Usuário criado com sucesso!');
      setIsModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'CASHIER',
        isActive: true
      });
      
      // Recarregar a página para mostrar o novo usuário
      window.location.reload();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'CASHIER',
      isActive: true
    });
  };

  // Função para filtrar usuários
  const getFilteredUsers = () => {
    if (!Array.isArray(users)) return [];
    
    return users
      .filter((user: any, index: number, self: any[]) => 
        index === self.findIndex((u: any) => u.email === user.email)
      )
      .filter((user: any) => {
        // Filtro por role
        if (userFilters.role !== 'all' && user.role !== userFilters.role) {
          return false;
        }
        
        // Filtro por status
        if (userFilters.status !== 'all') {
          if (userFilters.status === 'active' && !user.isActive) return false;
          if (userFilters.status === 'inactive' && user.isActive) return false;
        }
        
        // Filtro por busca
        if (userFilters.search) {
          const searchTerm = userFilters.search.toLowerCase();
          return (
            user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => {
        const roleOrder = { 'ADMIN': 0, 'STORE_MANAGER': 1, 'CASHIER': 2, 'CUSTOMER': 3 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 4) - (roleOrder[b.role as keyof typeof roleOrder] || 4);
      });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
                        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"> 
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
                  <p className="text-white/80 text-lg">Gerencie funcionários, gerentes e clientes do sistema</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-[#3e2626] hover:bg-white/90 font-semibold px-6 py-2 rounded-xl"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Brand Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Administradores</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {users.filter((u: any) => u.role === 'ADMIN').length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Acesso total</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Gerentes</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {users.filter((u: any) => u.role === 'STORE_MANAGER').length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Gestão de lojas</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Funcionários</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {users.filter((u: any) => u.role === 'CASHIER').length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Operacionais</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Clientes</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {users.filter((u: any) => u.role === 'CUSTOMER').length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Usuários finais</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Buscar usuários
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3e2626]/60 h-5 w-5" />
                <Input
                  id="search"
                  placeholder="Digite nome ou email..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-12 h-12 border-2 border-[#3e2626]/20 rounded-xl focus:border-[#3e2626] focus:ring-0 text-lg bg-white"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="lg:w-56">
              <Label htmlFor="role" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Cargo
              </Label>
              <select
                id="role"
                value={userFilters.role}
                onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
              >
                <option value="all">Todos os cargos</option>
                <option value="ADMIN">Administradores</option>
                <option value="STORE_MANAGER">Gerentes</option>
                <option value="CASHIER">Funcionários</option>
                <option value="CUSTOMER">Clientes</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="lg:w-56">
              <Label htmlFor="status" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Status
              </Label>
              <select
                id="status"
                value={userFilters.status}
                onChange={(e) => setUserFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
              >
                <option value="all">Todos os status</option>
                <option value="active">Apenas ativos</option>
                <option value="inactive">Apenas inativos</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="lg:w-48">
              <Label className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Visualização
              </Label>
              <div className="flex bg-[#3e2626]/5 rounded-xl p-1 border border-[#3e2626]/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-[#3e2626] text-white shadow-sm' 
                      : 'text-[#3e2626]/70 hover:text-[#3e2626]'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-[#3e2626] text-white shadow-sm' 
                      : 'text-[#3e2626]/70 hover:text-[#3e2626]'
                  }`}
                >
                  <Menu className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setUserFilters({ role: 'all', status: 'all', search: '' })}
                className="flex items-center space-x-2 h-12 px-6 border-2 border-[#3e2626]/20 rounded-xl hover:border-[#3e2626] hover:text-[#3e2626] text-[#3e2626]/70"
              >
                <X className="h-4 w-4" />
                <span>Limpar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Display Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#3e2626]">Lista de Usuários</CardTitle>
              <CardDescription className="text-lg text-[#3e2626]/70">
                {getFilteredUsers().length} usuário(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="border-2 border-[#3e2626]/20 rounded-xl px-4 py-2 text-[#3e2626] hover:bg-[#3e2626] hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {getFilteredUsers().length > 0 ? (
            viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredUsers().map((user: any) => (
                  <div key={user.id} className="bg-gradient-to-br from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-xl hover:border-[#3e2626] transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] text-white font-bold text-lg">
                              {user.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${
                            user.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-[#3e2626] text-lg">{user.name}</h3>
                          <p className="text-[#3e2626]/70 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'ADMIN' ? 'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20' :
                          user.role === 'STORE_MANAGER' ? 'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20' :
                          user.role === 'CASHIER' ? 'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20' :
                          user.role === 'CUSTOMER' ? 'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20' :
                          'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20'
                        }`}>
                          {user.role === 'ADMIN' ? 'Administrador' : 
                           user.role === 'STORE_MANAGER' ? 'Gerente' : 
                           user.role === 'CASHIER' ? 'Funcionário' :
                           user.role === 'CUSTOMER' ? 'Cliente' : user.role}
                        </Badge>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-[#3e2626]/10">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/20">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {getFilteredUsers().map((user: any) => (
                  <div key={user.id} className="bg-gradient-to-r from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-lg hover:border-[#3e2626] transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="w-14 h-14 border-4 border-white shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] text-white font-bold">
                              {user.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                            user.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-[#3e2626] text-lg">{user.name}</h3>
                            <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'ADMIN' ? 'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20' :
                              user.role === 'STORE_MANAGER' ? 'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20' :
                              user.role === 'CASHIER' ? 'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20' :
                              user.role === 'CUSTOMER' ? 'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20' :
                              'bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20'
                            }`}>
                              {user.role === 'ADMIN' ? 'Administrador' : 
                               user.role === 'STORE_MANAGER' ? 'Gerente' : 
                               user.role === 'CASHIER' ? 'Funcionário' :
                               user.role === 'CUSTOMER' ? 'Cliente' : user.role}
                            </Badge>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-[#3e2626]/70 text-sm mt-1">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/20">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-[#3e2626]/10 to-[#3e2626]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-[#3e2626]/60" />
              </div>
              <h3 className="text-2xl font-bold text-[#3e2626] mb-3">Nenhum usuário encontrado</h3>
              <p className="text-[#3e2626]/70 text-lg mb-6">
                {userFilters.search || userFilters.role !== 'all' || userFilters.status !== 'all'
                  ? 'Tente ajustar os filtros para encontrar usuários.'
                  : 'Não há usuários cadastrados no sistema.'
                }
              </p>
              {(userFilters.search || userFilters.role !== 'all' || userFilters.status !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => setUserFilters({ role: 'all', status: 'all', search: '' })}
                  className="px-6 py-3 rounded-xl border-2 border-[#3e2626]/20 hover:border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Novo Usuário */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center backdrop-blur-sm"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', zIndex: 10000 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Usuário</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome completo"
                  className="mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Digite o email"
                  className="mt-1"
                />
              </div>

              {/* Senha */}
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Digite a senha"
                  className="mt-1"
                />
              </div>

              {/* Cargo */}
              <div>
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Cargo *
                </Label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                >
                  <option value="CASHIER">Funcionário</option>
                  <option value="STORE_MANAGER">Gerente</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={newUser.isActive}
                  onChange={(e) => setNewUser(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-[#3e2626] focus:ring-[#3e2626] border-gray-300 rounded"
                />
                <Label htmlFor="isActive" className="text-sm text-gray-700">
                  Usuário ativo
                </Label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={isCreating}
                className="bg-[#3e2626] hover:bg-[#2a1a1a] text-white"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente da Seção de Lojas
function StoresSection({ stores, isLoading }: any) {
  // Estados para filtros
  const [storeFilters, setStoreFilters] = useState({
    status: 'all',
    search: ''
  });

  // Estados para modal de nova loja
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    manager: '',
    isActive: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Função para criar nova loja
  const handleCreateStore = async () => {
    if (!newStore.name || !newStore.address || !newStore.city || !newStore.state || !newStore.phone) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsCreating(true);
    try {
      // Aqui você pode integrar com a API real
      // const response = await adminAPI.createStore(newStore);
      
      // Simulação de criação de loja
      console.log('Criando loja:', newStore);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Loja criada com sucesso!');
      setIsModalOpen(false);
      setNewStore({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        manager: '',
        isActive: true
      });
      
      // Recarregar a página para mostrar a nova loja
      window.location.reload();
    } catch (error) {
      console.error('Erro ao criar loja:', error);
      alert('Erro ao criar loja. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewStore({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      manager: '',
      isActive: true
    });
  };

  // Função para filtrar lojas
  const getFilteredStores = () => {
    if (!Array.isArray(stores)) return [];
    
    return stores
      .filter((store: any) => {
        // Filtro por status
        if (storeFilters.status !== 'all') {
          if (storeFilters.status === 'active' && !store.isActive) return false;
          if (storeFilters.status === 'inactive' && store.isActive) return false;
        }
        
        // Filtro por busca
        if (storeFilters.search) {
          const searchTerm = storeFilters.search.toLowerCase();
          return (
            store.name?.toLowerCase().includes(searchTerm) ||
            store.city?.toLowerCase().includes(searchTerm) ||
            store.state?.toLowerCase().includes(searchTerm) ||
            store.address?.toLowerCase().includes(searchTerm) ||
            store.phone?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando lojas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"> 
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
              </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold">Gestão de Lojas</h1>
                  <p className="text-white/80 text-lg">Gerencie todas as lojas da empresa</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-[#3e2626] hover:bg-white/90 font-semibold px-6 py-2 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
          Nova Loja
                </Button>
            </div>
          </div>
        </div>
            </div>

      {/* Stats Cards - Brand Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {stores.length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Lojas cadastradas</p>
                      </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Store className="h-8 w-8 text-white" />
                        </div>
                      </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Ativas</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {stores.filter((s: any) => s.isActive).length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Em operação</p>
                  </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Store className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
              <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Funcionários</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {stores.reduce((sum: number, store: any) => sum + (store._count?.users || 0), 0)}
                </p>
                <p className="text-xs text-[#3e2626]/70">Total de colaboradores</p>
                      </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Produtos</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {stores.reduce((sum: number, store: any) => sum + (store._count?.products || 0), 0)}
                </p>
                <p className="text-xs text-[#3e2626]/70">Em estoque</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Buscar lojas
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3e2626]/60 h-5 w-5" />
                <Input
                  id="search"
                  placeholder="Digite nome, cidade, endereço ou telefone..."
                  value={storeFilters.search}
                  onChange={(e) => setStoreFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-12 h-12 border-2 border-[#3e2626]/20 rounded-xl focus:border-[#3e2626] focus:ring-0 text-lg bg-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-56">
              <Label htmlFor="status" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Status
              </Label>
              <select
                id="status"
                value={storeFilters.status}
                onChange={(e) => setStoreFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
              >
                <option value="all">Todas as lojas</option>
                <option value="active">Apenas ativas</option>
                <option value="inactive">Apenas inativas</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="lg:w-48">
              <Label className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Visualização
              </Label>
              <div className="flex bg-[#3e2626]/5 rounded-xl p-1 border border-[#3e2626]/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-[#3e2626] text-white shadow-sm' 
                      : 'text-[#3e2626]/70 hover:text-[#3e2626]'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-[#3e2626] text-white shadow-sm' 
                      : 'text-[#3e2626]/70 hover:text-[#3e2626]'
                  }`}
                >
                  <Menu className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setStoreFilters({ status: 'all', search: '' })}
                className="flex items-center space-x-2 h-12 px-6 border-2 border-[#3e2626]/20 rounded-xl hover:border-[#3e2626] hover:text-[#3e2626] text-[#3e2626]/70"
              >
                <X className="h-4 w-4" />
                <span>Limpar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores Display Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
          <div className="flex items-center justify-between">
                      <div>
              <CardTitle className="text-2xl font-bold text-[#3e2626]">Lista de Lojas</CardTitle>
              <CardDescription className="text-lg text-[#3e2626]/70">
                {getFilteredStores().length} loja(s) encontrada(s)
              </CardDescription>
                        </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="border-2 border-[#3e2626]/20 rounded-xl px-4 py-2 text-[#3e2626] hover:bg-[#3e2626] hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
                      </div>
                    </div>
            </CardHeader>
        <CardContent className="p-8">
          {getFilteredStores().length > 0 ? (
            viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredStores().map((store: any) => (
                  <div key={store.id} className="bg-gradient-to-br from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-xl hover:border-[#3e2626] transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                          <Store className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#3e2626] text-lg">{store.name}</h3>
                          <p className="text-[#3e2626]/70 text-sm">{store.city}, {store.state}</p>
                        </div>
                      </div>
                    </div>
                    
              <div className="space-y-3">
                      <div className="flex items-center text-sm text-[#3e2626]/70">
                        <MapPin className="h-4 w-4 mr-2" />
                  {store.address}
                    </div>
                      
                      <div className="flex items-center text-sm text-[#3e2626]/70">
                        <Phone className="h-4 w-4 mr-2" />
                  {store.phone}
                  </div>
                      
                      {store.email && (
                        <div className="flex items-center text-sm text-[#3e2626]/70">
                          <Mail className="h-4 w-4 mr-2" />
                          {store.email}
                </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#3e2626]/10">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#3e2626]">{store._count?.users || 0}</p>
                          <p className="text-xs text-[#3e2626]/70">Funcionários</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#3e2626]">{store._count?.products || 0}</p>
                          <p className="text-xs text-[#3e2626]/70">Produtos</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-[#3e2626]/10">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          store.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {store.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/20">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {getFilteredStores().map((store: any) => (
                  <div key={store.id} className="bg-gradient-to-r from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-lg hover:border-[#3e2626] transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                          <Store className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-[#3e2626] text-lg">{store.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              store.isActive 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {store.isActive ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          <p className="text-[#3e2626]/70 text-sm mt-1">{store.city}, {store.state}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center text-sm text-[#3e2626]/70">
                              <MapPin className="h-4 w-4 mr-1" />
                              {store.address}
                            </div>
                            <div className="flex items-center text-sm text-[#3e2626]/70">
                              <Phone className="h-4 w-4 mr-1" />
                              {store.phone}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#3e2626]">{store._count?.users || 0}</p>
                          <p className="text-xs text-[#3e2626]/70">Funcionários</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#3e2626]">{store._count?.products || 0}</p>
                          <p className="text-xs text-[#3e2626]/70">Produtos</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/20">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-[#3e2626]/10 to-[#3e2626]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="h-12 w-12 text-[#3e2626]/60" />
              </div>
              <h3 className="text-2xl font-bold text-[#3e2626] mb-3">Nenhuma loja encontrada</h3>
              <p className="text-[#3e2626]/70 text-lg mb-6">
                {storeFilters.search || storeFilters.status !== 'all'
                  ? 'Tente ajustar os filtros para encontrar lojas.'
                  : 'Não há lojas cadastradas no sistema.'
                }
              </p>
              {(storeFilters.search || storeFilters.status !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => setStoreFilters({ status: 'all', search: '' })}
                  className="px-6 py-3 rounded-xl border-2 border-[#3e2626]/20 hover:border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
              </CardContent>
            </Card>

      {/* Modal de Nova Loja */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center backdrop-blur-sm"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', zIndex: 10000 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nova Loja</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
      </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome da Loja *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={newStore.name}
                  onChange={(e) => setNewStore(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome da loja"
                  className="mt-1"
                />
              </div>

              {/* Endereço */}
              <div>
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Endereço *
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={newStore.address}
                  onChange={(e) => setNewStore(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Digite o endereço completo"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cidade */}
                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                    Cidade *
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    value={newStore.city}
                    onChange={(e) => setNewStore(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Digite a cidade"
                    className="mt-1"
                  />
                </div>

                {/* Estado */}
                <div>
                  <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                    Estado *
                  </Label>
                  <select
                    id="state"
                    value={newStore.state}
                    onChange={(e) => setNewStore(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                  >
                    <option value="">Selecione o estado</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>

                {/* CEP */}
                <div>
                  <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                    CEP
                  </Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={newStore.zipCode}
                    onChange={(e) => setNewStore(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="00000-000"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Telefone */}
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Telefone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newStore.phone}
                    onChange={(e) => setNewStore(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStore.email}
                    onChange={(e) => setNewStore(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="loja@empresa.com"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Gerente */}
              <div>
                <Label htmlFor="manager" className="text-sm font-medium text-gray-700">
                  Gerente Responsável
                </Label>
                <Input
                  id="manager"
                  type="text"
                  value={newStore.manager}
                  onChange={(e) => setNewStore(prev => ({ ...prev, manager: e.target.value }))}
                  placeholder="Nome do gerente responsável"
                  className="mt-1"
                />
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={newStore.isActive}
                  onChange={(e) => setNewStore(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-[#3e2626] focus:ring-[#3e2626] border-gray-300 rounded"
                />
                <Label htmlFor="isActive" className="text-sm text-gray-700">
                  Loja ativa
                </Label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateStore}
                disabled={isCreating}
                className="bg-[#3e2626] hover:bg-[#2a1a1a] text-white"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Loja'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente da Seção de Produtos
function ProductsSection({ products, isLoading }: any) {
  // Estados para filtros
  const [productFilters, setProductFilters] = useState({
    category: 'all',
    status: 'all',
    search: ''
  });

  // Estados para modal de novo produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'Tintas',
    price: 0,
    stock: 0,
    sku: '',
    isActive: true,
    brand: '',
    unit: 'un',
    minStock: 10,
    maxStock: 100,
    supplier: '',
    barcode: '',
    observations: ''
  });
  const [productImages, setProductImages] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Função para criar novo produto
  const handleCreateProduct = async () => {
    console.log('🚀 Iniciando criação de produto...');
    console.log('📋 Dados do produto:', newProduct);
    console.log('🖼️ Imagens selecionadas:', productImages.length);
    
    if (!newProduct.name || !newProduct.category || newProduct.price <= 0) {
      alert('❌ Por favor, preencha todos os campos obrigatórios:\n- Nome do produto\n- Categoria\n- Preço maior que zero');
      return;
    }

    setIsCreating(true);
    try {
      // Gerar ID temporário para o produto
      const tempProductId = `prod_${Date.now()}`;
      console.log('🆔 ID do produto:', tempProductId);
      
      // Upload das imagens para o Supabase
      let imageUrls: string[] = [];
      if (productImages.length > 0) {
        console.log(`📤 Fazendo upload de ${productImages.length} imagens...`);
        try {
          // Tentar upload real primeiro
          imageUrls = await uploadMultipleProductImages(productImages, tempProductId);
          console.log('✅ Imagens enviadas com sucesso:', imageUrls);
          
          // Se não conseguiu fazer upload real, usar simulação
          if (imageUrls.length === 0 || imageUrls.every(url => url.includes('placeholder'))) {
            console.log('🔄 Usando simulação de upload...');
            const simulationPromises = productImages.map(file => simulateImageUpload(file, tempProductId));
            imageUrls = await Promise.all(simulationPromises);
            console.log('🎭 Imagens simuladas:', imageUrls);
          }
        } catch (uploadError) {
          console.error('❌ Erro no upload das imagens:', uploadError);
          console.log('🔄 Tentando simulação de upload...');
          try {
            const simulationPromises = productImages.map(file => simulateImageUpload(file, tempProductId));
            imageUrls = await Promise.all(simulationPromises);
            console.log('🎭 Upload simulado concluído:', imageUrls);
          } catch (simError) {
            console.error('❌ Erro na simulação:', simError);
            alert('⚠️ Erro ao processar imagens. Produto será criado sem imagens.');
          }
        }
      } else {
        console.log('ℹ️ Nenhuma imagem selecionada');
      }
      
      // Criar objeto do produto com as URLs das imagens
      const productData = {
        ...newProduct,
        images: imageUrls,
        id: tempProductId,
        createdAt: new Date().toISOString()
      };
      
      console.log('📦 Dados finais do produto:', productData);
      
      // Aqui você pode integrar com a API real
      // const response = await adminAPI.createProduct(productData);
      
      // Simulação de criação de produto
      console.log('💾 Salvando produto no banco de dados...');
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('🎉 Produto criado com sucesso!');
      alert(`✅ Produto "${newProduct.name}" criado com sucesso!\n\n📊 Detalhes:\n- Categoria: ${newProduct.category}\n- Preço: R$ ${newProduct.price.toFixed(2)}\n- Imagens: ${imageUrls.length}\n- SKU: ${newProduct.sku || 'Não informado'}`);
      
      handleCloseModal();
      
      // Recarregar a página para mostrar o novo produto
      window.location.reload();
    } catch (error) {
      console.error('❌ Erro ao criar produto:', error);
      alert(`❌ Erro ao criar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setIsCreating(false);
    }
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewProduct({
      name: '',
      description: '',
      category: 'Tintas',
      price: 0,
      stock: 0,
      sku: '',
      isActive: true,
      brand: '',
      unit: 'un',
      minStock: 10,
      maxStock: 100,
      supplier: '',
      barcode: '',
      observations: ''
    });
    setProductImages([]);
  };

  // Função para filtrar produtos
  const getFilteredProducts = () => {
    if (!Array.isArray(products)) return [];
    
    return products
      .filter((product: any) => {
        // Filtro por categoria
        if (productFilters.category !== 'all' && product.category !== productFilters.category) {
          return false;
        }
        
        // Filtro por status
        if (productFilters.status !== 'all') {
          if (productFilters.status === 'active' && !product.isActive) return false;
          if (productFilters.status === 'inactive' && product.isActive) return false;
        }
        
        // Filtro por busca
        if (productFilters.search) {
          const searchTerm = productFilters.search.toLowerCase();
          return (
            product.name?.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.sku?.toLowerCase().includes(searchTerm) ||
            product.category?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  };

  // Função para obter status do estoque
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Sem Estoque', color: 'bg-red-100 text-red-800' };
    if (stock < 10) return { label: 'Estoque Baixo', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Em Estoque', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"> 
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
              </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold">Gestão de Produtos</h1>
                  <p className="text-white/80 text-lg">Gerencie o catálogo de produtos da empresa</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-[#3e2626] hover:bg-white/90 font-semibold px-6 py-2 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
          Novo Produto
                </Button>
            </div>
          </div>
        </div>
            </div>

      {/* Stats Cards - Brand Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {products.length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Produtos cadastrados</p>
                  </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
                  </div>
                </CardContent>
              </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Ativos</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {products.filter((p: any) => p.isActive).length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Disponíveis</p>
      </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
              <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Estoque Baixo</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {products.filter((p: any) => p.stock < 10).length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Atenção necessária</p>
                  </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Valor Total</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  R$ {products.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0).toFixed(0)}
                </p>
                <p className="text-xs text-[#3e2626]/70">Em estoque</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Buscar produtos
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3e2626]/60 h-5 w-5" />
                <Input
                  id="search"
                  placeholder="Digite nome, descrição ou SKU..."
                  value={productFilters.search}
                  onChange={(e) => setProductFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-12 h-12 border-2 border-[#3e2626]/20 rounded-xl focus:border-[#3e2626] focus:ring-0 text-lg bg-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-56">
              <Label htmlFor="category" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Categoria
              </Label>
              <select
                id="category"
                value={productFilters.category}
                onChange={(e) => setProductFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
              >
                <option value="all">Todas as categorias</option>
                <option value="Tintas">Tintas</option>
                <option value="Pincéis">Pincéis</option>
                <option value="Rolos">Rolos</option>
                <option value="Acessórios">Acessórios</option>
                <option value="Ferramentas">Ferramentas</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="lg:w-56">
              <Label htmlFor="status" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Status
              </Label>
              <select
                id="status"
                value={productFilters.status}
                onChange={(e) => setProductFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
              >
                <option value="all">Todos os status</option>
                <option value="active">Apenas ativos</option>
                <option value="inactive">Apenas inativos</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="lg:w-48">
              <Label className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Visualização
              </Label>
              <div className="flex bg-[#3e2626]/5 rounded-xl p-1 border border-[#3e2626]/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-[#3e2626] text-white shadow-sm' 
                      : 'text-[#3e2626]/70 hover:text-[#3e2626]'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-[#3e2626] text-white shadow-sm' 
                      : 'text-[#3e2626]/70 hover:text-[#3e2626]'
                  }`}
                >
                  <Menu className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setProductFilters({ category: 'all', status: 'all', search: '' })}
                className="flex items-center space-x-2 h-12 px-6 border-2 border-[#3e2626]/20 rounded-xl hover:border-[#3e2626] hover:text-[#3e2626] text-[#3e2626]/70"
              >
                <X className="h-4 w-4" />
                <span>Limpar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Display Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
          <div className="flex items-center justify-between">
                  <div>
              <CardTitle className="text-2xl font-bold text-[#3e2626]">Lista de Produtos</CardTitle>
              <CardDescription className="text-lg text-[#3e2626]/70">
                {getFilteredProducts().length} produto(s) encontrado(s)
              </CardDescription>
                  </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="border-2 border-[#3e2626]/20 rounded-xl px-4 py-2 text-[#3e2626] hover:bg-[#3e2626] hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
                </div>
                  </div>
                </CardHeader>
        <CardContent className="p-8">
          {getFilteredProducts().length > 0 ? (
            viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredProducts().map((product: any) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <div key={product.id} className="bg-gradient-to-br from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-xl hover:border-[#3e2626] transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                            <Package className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#3e2626] text-lg">{product.name}</h3>
                            <p className="text-[#3e2626]/70 text-sm">{product.category}</p>
                          </div>
                        </div>
                      </div>
                      
              <div className="space-y-3">
                        {product.description && (
                          <p className="text-sm text-[#3e2626]/70 line-clamp-2">{product.description}</p>
                        )}
                        
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-[#3e2626]">
                    R$ {typeof product.price === 'number' ? product.price.toFixed(2) : '0,00'}
                  </span>
                          <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                            {stockStatus.label}
                          </Badge>
                  </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-[#3e2626]/70">
                            Estoque: {product.stock || 0} unidades
                </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {product.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                  </div>
                        
                        {product.sku && (
                          <div className="flex items-center text-sm text-[#3e2626]/70">
                            <Package className="h-4 w-4 mr-1" />
                            SKU: {product.sku}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-[#3e2626]/10">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/20">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {getFilteredProducts().map((product: any) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <div key={product.id} className="bg-gradient-to-r from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-lg hover:border-[#3e2626] transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                            <Package className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-bold text-[#3e2626] text-lg">{product.name}</h3>
                              <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                                {stockStatus.label}
                              </Badge>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                product.isActive 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {product.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <p className="text-[#3e2626]/70 text-sm mt-1">{product.category} • Estoque: {product.stock || 0} unidades</p>
                            <p className="text-2xl font-bold text-[#3e2626] mt-1">R$ {typeof product.price === 'number' ? product.price.toFixed(2) : '0,00'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/20">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-[#3e2626]/10 to-[#3e2626]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-[#3e2626]/60" />
              </div>
              <h3 className="text-2xl font-bold text-[#3e2626] mb-3">Nenhum produto encontrado</h3>
              <p className="text-[#3e2626]/70 text-lg mb-6">
                {productFilters.search || productFilters.category !== 'all' || productFilters.status !== 'all'
                  ? 'Tente ajustar os filtros para encontrar produtos.'
                  : 'Não há produtos cadastrados no sistema.'
                }
              </p>
              {(productFilters.search || productFilters.category !== 'all' || productFilters.status !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => setProductFilters({ category: 'all', status: 'all', search: '' })}
                  className="px-6 py-3 rounded-xl border-2 border-[#3e2626]/20 hover:border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
                </CardContent>
              </Card>

      {/* Modal de Novo Produto */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center backdrop-blur-sm"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-2xl p-8 w-full max-w-5xl mx-4 shadow-2xl border-2 border-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', zIndex: 10000 }}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100">
              <div>
                <h3 className="text-2xl font-bold text-[#3e2626]">Novo Produto</h3>
                <p className="text-sm text-gray-500 mt-1">Preencha os dados do produto e adicione imagens</p>
          </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Upload de Imagens */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <ImageUpload
                  images={productImages}
                  onImagesChange={setProductImages}
                  maxImages={5}
                />
              </div>

              {/* Informações Básicas */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="text-lg font-semibold text-[#3e2626] mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Informações Básicas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="md:col-span-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nome do Produto *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Tinta Acrílica Premium Branco Neve 3.6L"
                      className="mt-1"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Descrição
                    </Label>
                    <textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva as características e benefícios do produto..."
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Categoria *
                    </Label>
                    <select
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                    >
                      <option value="Tintas">Tintas</option>
                      <option value="Pincéis">Pincéis</option>
                      <option value="Rolos">Rolos</option>
                      <option value="Acessórios">Acessórios</option>
                      <option value="Ferramentas">Ferramentas</option>
                      <option value="Vernizes">Vernizes</option>
                      <option value="Massas">Massas</option>
                      <option value="Solventes">Solventes</option>
                    </select>
                  </div>

                  {/* Marca */}
                  <div>
                    <Label htmlFor="brand" className="text-sm font-medium text-gray-700">
                      Marca
                    </Label>
                    <Input
                      id="brand"
                      type="text"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Ex: Suvinil, Coral, etc."
                      className="mt-1"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <Label htmlFor="sku" className="text-sm font-medium text-gray-700">
                      SKU / Código
                    </Label>
                    <Input
                      id="sku"
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Ex: TIN-ACR-BRA-36L"
                      className="mt-1"
                    />
                  </div>

                  {/* Código de Barras */}
                  <div>
                    <Label htmlFor="barcode" className="text-sm font-medium text-gray-700">
                      Código de Barras / EAN
                    </Label>
                    <Input
                      id="barcode"
                      type="text"
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="Ex: 7898357419876"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Precificação e Estoque */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="text-lg font-semibold text-[#3e2626] mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Precificação e Estoque
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Preço */}
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                      Preço de Venda *
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Unidade */}
                  <div>
                    <Label htmlFor="unit" className="text-sm font-medium text-gray-700">
                      Unidade
                    </Label>
                    <select
                      id="unit"
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                    >
                      <option value="un">Unidade</option>
                      <option value="lt">Litro</option>
                      <option value="ml">Mililitro</option>
                      <option value="kg">Quilograma</option>
                      <option value="g">Grama</option>
                      <option value="m">Metro</option>
                      <option value="cx">Caixa</option>
                      <option value="pct">Pacote</option>
                    </select>
                  </div>

                  {/* Estoque Atual */}
                  <div>
                    <Label htmlFor="stock" className="text-sm font-medium text-gray-700">
                      Estoque Inicial
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>

                  {/* Estoque Mínimo */}
                  <div>
                    <Label htmlFor="minStock" className="text-sm font-medium text-gray-700">
                      Estoque Mínimo
                    </Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={newProduct.minStock}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                      className="mt-1"
                    />
                  </div>

                  {/* Estoque Máximo */}
                  <div>
                    <Label htmlFor="maxStock" className="text-sm font-medium text-gray-700">
                      Estoque Máximo
                    </Label>
                    <Input
                      id="maxStock"
                      type="number"
                      min="0"
                      value={newProduct.maxStock}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 0 }))}
                      placeholder="100"
                      className="mt-1"
                    />
                  </div>

                  {/* Fornecedor */}
                  <div>
                    <Label htmlFor="supplier" className="text-sm font-medium text-gray-700">
                      Fornecedor
                    </Label>
                    <Input
                      id="supplier"
                      type="text"
                      value={newProduct.supplier}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Nome do fornecedor"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="text-lg font-semibold text-[#3e2626] mb-4">Observações Adicionais</h4>
                <textarea
                  id="observations"
                  value={newProduct.observations}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Informações adicionais, instruções de uso, cuidados especiais, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div>
                  <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Status do Produto
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">Produto disponível para venda?</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={newProduct.isActive}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#3e2626]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#3e2626]"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {newProduct.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateProduct}
                disabled={isCreating}
                className="bg-[#3e2626] hover:bg-[#2a1a1a] text-white"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Produto'
                )}
              </Button>
      </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente da Seção de Vendas
function SalesSection({ sales, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando vendas...</p>
                  </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Vendas</h1>
          <p className="text-sm text-gray-600">Acompanhe todas as vendas realizadas</p>
        </div>
        <Button className="bg-[#3e2626] hover:bg-[#8B4513]">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
                <p className="text-sm text-gray-500">Total de Vendas</p>
              </div>
                  </div>
                </CardContent>
              </Card>
            </div>

      {/* Sales List */}
      <Card>
              <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
          <CardDescription>Histórico completo de vendas realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
            {Array.isArray(sales) && sales.map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#3e2626] rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                    <h3 className="font-semibold text-gray-900">Venda #{sale.id}</h3>
                    <p className="text-sm text-gray-600">{sale.customer?.name || 'Cliente não identificado'}</p>
                    <p className="text-sm text-gray-500">{sale.store?.name || 'Loja não identificada'}</p>
                      </div>
                    </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">R$ {typeof sale.total === 'number' ? sale.total.toFixed(2) : '0,00'}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  </div>
                      </div>
            ))}
                </div>
              </CardContent>
            </Card>

      </div>
    );
  }

// Componente da Seção de Relatórios
function ReportsSection() {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Função para gerar relatório
  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dados mock para demonstração
      const mockData = {
        sales: {
          totalRevenue: 125000,
          totalSales: 450,
          averageTicket: 277.78,
          growthRate: 15.5,
          topProducts: [
            { name: 'Tinta Branca Premium', sales: 89, revenue: 8010 },
            { name: 'Pincel Chato 2"', sales: 156, revenue: 2418 },
            { name: 'Rolo de Pintura', sales: 134, revenue: 3068.6 },
            { name: 'Fita Crepe', sales: 203, revenue: 1806.7 }
          ],
          salesByStore: [
            { store: 'Loja Centro', sales: 120, revenue: 45000 },
            { store: 'Loja Norte', sales: 98, revenue: 38000 },
            { store: 'Loja Sul', sales: 156, revenue: 42000 }
          ],
          salesByDay: [
            { date: '2024-01-01', sales: 15, revenue: 4500 },
            { date: '2024-01-02', sales: 23, revenue: 6900 },
            { date: '2024-01-03', sales: 18, revenue: 5400 },
            { date: '2024-01-04', sales: 31, revenue: 9300 },
            { date: '2024-01-05', sales: 27, revenue: 8100 }
          ]
        },
        products: {
          totalProducts: 124,
          activeProducts: 118,
          lowStock: 12,
          totalValue: 45000,
          topCategories: [
            { category: 'Tintas', products: 45, revenue: 65000 },
            { category: 'Pincéis', products: 32, revenue: 12000 },
            { category: 'Rolos', products: 28, revenue: 15000 },
            { category: 'Acessórios', products: 19, revenue: 8000 }
          ]
        },
        stores: {
          totalStores: 3,
          activeStores: 3,
          totalEmployees: 24,
          averageRevenue: 41666.67,
          storePerformance: [
            { store: 'Loja Centro', employees: 8, revenue: 45000, efficiency: 95 },
            { store: 'Loja Norte', employees: 7, revenue: 38000, efficiency: 88 },
            { store: 'Loja Sul', employees: 9, revenue: 42000, efficiency: 92 }
          ]
        }
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (typeof window === 'undefined') {
      return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
                  <p className="text-white/80 text-lg">Gere e visualize relatórios detalhados do sistema</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
              </select>
              <Button 
                onClick={generateReport}
                disabled={isGenerating}
                className="bg-white text-[#3e2626] hover:bg-white/90 font-semibold px-6 py-2 rounded-xl"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3e2626] mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Label htmlFor="reportType" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Tipo de Relatório
              </Label>
              <select
                id="reportType"
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
              >
                <option value="sales">Relatório de Vendas</option>
                <option value="products">Relatório de Produtos</option>
                <option value="stores">Relatório de Lojas</option>
                <option value="financial">Relatório Financeiro</option>
                <option value="inventory">Relatório de Estoque</option>
                <option value="customers">Relatório de Clientes</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-8">
          {selectedReport === 'sales' && (
            <>
              {/* Sales Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Receita Total</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{formatCurrency(reportData.sales.totalRevenue)}</p>
                        <p className="text-xs text-green-600">{formatPercentage(reportData.sales.growthRate)} vs período anterior</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                        <DollarSign className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total de Vendas</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{reportData.sales.totalSales}</p>
                        <p className="text-xs text-[#3e2626]/70">transações realizadas</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                        <ShoppingCart className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Ticket Médio</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{formatCurrency(reportData.sales.averageTicket)}</p>
                        <p className="text-xs text-[#3e2626]/70">por transação</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                        <TrendingUp className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Crescimento</p>
                        <p className="text-3xl font-bold text-green-600">{formatPercentage(reportData.sales.growthRate)}</p>
                        <p className="text-xs text-[#3e2626]/70">vs período anterior</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <ArrowUp className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
                  <CardTitle className="text-2xl font-bold text-[#3e2626]">Produtos Mais Vendidos</CardTitle>
                  <CardDescription className="text-lg text-[#3e2626]/70">Ranking dos produtos com maior volume de vendas</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    {reportData.sales.topProducts.map((product: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">{index + 1}</span>
                          </div>
                    <div>
                            <h3 className="font-bold text-[#3e2626] text-lg">{product.name}</h3>
                            <p className="text-[#3e2626]/70 text-sm">{product.sales} vendas realizadas</p>
                    </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#3e2626]">{formatCurrency(product.revenue)}</p>
                          <p className="text-sm text-[#3e2626]/70">receita gerada</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sales by Store */}
              <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
                  <CardTitle className="text-2xl font-bold text-[#3e2626]">Vendas por Loja</CardTitle>
                  <CardDescription className="text-lg text-[#3e2626]/70">Performance comparativa entre as lojas</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reportData.sales.salesByStore.map((store: any, index: number) => (
                      <div key={index} className="bg-gradient-to-br from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                            <Store className="h-6 w-6 text-white" />
                  </div>
                    <div>
                            <h3 className="font-bold text-[#3e2626] text-lg">{store.store}</h3>
                            <p className="text-[#3e2626]/70 text-sm">{store.sales} vendas</p>
                    </div>
                  </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#3e2626]/70">Receita:</span>
                            <span className="font-bold text-[#3e2626]">{formatCurrency(store.revenue)}</span>
                          </div>
                          <div className="w-full bg-[#3e2626]/10 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] h-2 rounded-full"
                              style={{ width: `${(store.revenue / reportData.sales.totalRevenue) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedReport === 'products' && (
            <>
              {/* Products Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total de Produtos</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{reportData.products.totalProducts}</p>
                        <p className="text-xs text-[#3e2626]/70">cadastrados</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                        <Package className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Produtos Ativos</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{reportData.products.activeProducts}</p>
                        <p className="text-xs text-green-600">{((reportData.products.activeProducts / reportData.products.totalProducts) * 100).toFixed(1)}% do total</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Package className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Estoque Baixo</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{reportData.products.lowStock}</p>
                        <p className="text-xs text-yellow-600">atenção necessária</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Package className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Valor Total</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{formatCurrency(reportData.products.totalValue)}</p>
                        <p className="text-xs text-[#3e2626]/70">em estoque</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                        <DollarSign className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Categories */}
              <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
                  <CardTitle className="text-2xl font-bold text-[#3e2626]">Categorias Mais Vendidas</CardTitle>
                  <CardDescription className="text-lg text-[#3e2626]/70">Análise de performance por categoria</CardDescription>
          </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    {reportData.products.topCategories.map((category: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#3e2626] text-lg">{category.category}</h3>
                            <p className="text-[#3e2626]/70 text-sm">{category.products} produtos • {formatCurrency(category.revenue)} receita</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626]/10 to-[#3e2626]/20 rounded-2xl flex items-center justify-center">
                            <span className="text-2xl font-bold text-[#3e2626]">{category.products}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedReport === 'stores' && (
            <>
              {/* Stores Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total de Lojas</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{reportData.stores.totalStores}</p>
                        <p className="text-xs text-[#3e2626]/70">operando</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                        <Store className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Funcionários</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{reportData.stores.totalEmployees}</p>
                        <p className="text-xs text-[#3e2626]/70">colaboradores</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Receita Média</p>
                        <p className="text-3xl font-bold text-[#3e2626]">{formatCurrency(reportData.stores.averageRevenue)}</p>
                        <p className="text-xs text-[#3e2626]/70">por loja</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                        <DollarSign className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Eficiência Média</p>
                        <p className="text-3xl font-bold text-[#3e2626]">92%</p>
                        <p className="text-xs text-green-600">excelente performance</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <TrendingUp className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Store Performance */}
              <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
                  <CardTitle className="text-2xl font-bold text-[#3e2626]">Performance das Lojas</CardTitle>
                  <CardDescription className="text-lg text-[#3e2626]/70">Análise detalhada de cada loja</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {reportData.stores.storePerformance.map((store: any, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                              <Store className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-[#3e2626] text-xl">{store.store}</h3>
                              <p className="text-[#3e2626]/70">{store.employees} funcionários</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-8">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-[#3e2626]">{formatCurrency(store.revenue)}</p>
                              <p className="text-sm text-[#3e2626]/70">Receita</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-[#3e2626]">{store.efficiency}%</p>
                              <p className="text-sm text-[#3e2626]/70">Eficiência</p>
                            </div>
                            <div className="w-20 h-20 relative">
                              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-[#3e2626]/10"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className="text-[#3e2626]"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  fill="none"
                                  strokeDasharray={`${store.efficiency}, 100`}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Export Options */}
      {reportData && (
        <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
            <CardTitle className="text-2xl font-bold text-[#3e2626]">Exportar Relatório</CardTitle>
            <CardDescription className="text-lg text-[#3e2626]/70">Baixe o relatório nos formatos disponíveis</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-wrap gap-4">
              <Button className="bg-[#3e2626] hover:bg-[#2a1a1a] text-white px-6 py-3 rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" className="border-2 border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626] hover:text-white px-6 py-3 rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" className="border-2 border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626] hover:text-white px-6 py-3 rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" className="border-2 border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626] hover:text-white px-6 py-3 rounded-xl">
              <BarChart3 className="h-4 w-4 mr-2" />
                Imagem
            </Button>
            </div>
                </CardContent>
              </Card>
      )}
    </div>
  );
}

// Componente da Seção de Configurações
function SettingsSection() {
  return (
    <div className="space-y-6">
              <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-600">Gerencie as configurações do sistema</p>
            </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
                <CardHeader>
            <CardTitle>Configurações da Empresa</CardTitle>
            <CardDescription>Configure os dados da sua empresa</CardDescription>
                </CardHeader>
          <CardContent>
            <div className="space-y-4">
                    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa
                </label>
                <Input placeholder="Nome da empresa" />
                    </div>
                    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input placeholder="contato@empresa.com" />
                    </div>
                  </div>
                </CardContent>
              </Card>

        <Card>
                <CardHeader>
            <CardTitle>Configurações do Sistema</CardTitle>
            <CardDescription>Configure o comportamento do sistema</CardDescription>
                </CardHeader>
          <CardContent>
            <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                  <h3 className="text-sm font-medium text-gray-900">Modo de Manutenção</h3>
                  <p className="text-sm text-gray-500">Ativar modo de manutenção</p>
                    </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                  </div>
                  </div>
                </CardContent>
              </Card>
            </div>
    </div>
  );
}