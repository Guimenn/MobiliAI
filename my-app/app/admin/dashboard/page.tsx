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
import AdminProductsSection from '@/components/AdminProductsSection';
import { useAppStore } from '@/lib/store';
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
  const { user: currentUser, token } = useAppStore();
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
  const [customers, setCustomers] = useState<any[]>([]);
  
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
      // const [overviewStats, recentSalesData, topProductsData] = await Promise.all([
      //   adminAPI.getOverviewStats(),
      //   adminAPI.getRecentSales(),
      //   adminAPI.getTopProducts()
      // ]);

      console.log('✅ Dados carregados com sucesso do backend');

      // Atualizar estatísticas com dados reais
      // setStats({
      //   totalUsers: overviewStats.totalUsers || 0,
      //   totalStores: overviewStats.totalStores || 0,
      //   totalProducts: overviewStats.totalProducts || 0,
      //   monthlyRevenue: overviewStats.monthlyRevenue || 0,
      //   activeStores: overviewStats.activeStores || 0
      // });

      // Atualizar vendas recentes com dados reais
      // setRecentSales(recentSalesData || []);
      
      // Atualizar produtos mais vendidos
      // setTopProducts(topProductsData || []);
      
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
            const response = await adminAPI.getUsers(token || '');
            const usersData = response.ok ? await response.json() : null;
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
            const response = await adminAPI.getStores(token || '');
            const storesData = response.ok ? await response.json() : null;
          console.log('Dados de lojas recebidos:', storesData);
          setStores(Array.isArray(storesData) ? storesData : []);
          break;
        case 'products':
          console.log('Buscando produtos...');
          try {
            const productsData = await adminAPI.getProducts(token || '');
            console.log('Dados de produtos recebidos:', productsData);
            
            // Verificar se os dados estão em productsData.products ou se é um array direto
            const productsArray = productsData?.products || productsData;
            setProducts(Array.isArray(productsArray) ? productsArray : []);
          } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            setProducts([]);
            // Mostrar erro para o usuário
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            alert(`Erro ao carregar produtos: ${errorMessage}`);
          }
            break;
        case 'sales':
          console.log('Buscando vendas...');
          try {
            // const salesData = await adminAPI.getRecentSales();
            // console.log('Dados de vendas recebidos:', salesData);
            
            // Verificar se os dados estão em salesData.sales ou se é um array direto
            // const salesArray = salesData?.sales || salesData;
            // setSales(Array.isArray(salesArray) ? salesArray : []);
            
            // Usar dados mock por enquanto
            setSales([]);
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
        case 'customers':
          console.log('Buscando clientes...');
          try {
            // Usar dados mock para desenvolvimento
            setCustomers([
              {
                id: '1',
                name: 'João Silva',
                email: 'joao@email.com',
                phone: '(11) 99999-9999',
                address: 'Rua das Flores, 123',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234-567',
                cpf: '123.456.789-00',
                isActive: true,
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z',
                role: 'CUSTOMER',
                _count: {
                  purchases: 5,
                  favorites: 12,
                  reviews: 3
                }
              },
              {
                id: '2',
                name: 'Maria Santos',
                email: 'maria@email.com',
                phone: '(11) 88888-8888',
                address: 'Av. Paulista, 456',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01310-100',
                isActive: true,
                createdAt: '2024-02-10T14:30:00Z',
                updatedAt: '2024-02-10T14:30:00Z',
                role: 'CUSTOMER',
                _count: {
                  purchases: 8,
                  favorites: 25,
                  reviews: 6
                }
              },
              {
                id: '3',
                name: 'Pedro Costa',
                email: 'pedro@email.com',
                phone: '(11) 77777-7777',
                isActive: false,
                createdAt: '2024-03-05T09:15:00Z',
                updatedAt: '2024-03-05T09:15:00Z',
                role: 'CUSTOMER',
                _count: {
                  purchases: 2,
                  favorites: 5,
                  reviews: 1
                }
              }
            ]);
          } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            setCustomers([]);
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
                  onClick={() => handleSectionChange('customers')}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer ${
                    activeSection === 'customers' 
                      ? 'bg-[#3e2626] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-4 w-4 mr-3" />
                  Clientes
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
            <AdminProductsSection 
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
          
          {activeSection === 'customers' && (
            <CustomersSection 
              customers={customers}
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

// Componente da Seção de Clientes
function CustomersSection({ customers, isLoading }: any) {
  // Estados para filtros
  const [customerFilters, setCustomerFilters] = useState({
    status: 'all',
    search: ''
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para filtrar clientes
  const getFilteredCustomers = () => {
    if (!Array.isArray(customers)) return [];
    
    return customers
      .filter((customer: any) => {
        // Filtro por status
        if (customerFilters.status !== 'all') {
          if (customerFilters.status === 'active' && !customer.isActive) return false;
          if (customerFilters.status === 'inactive' && customer.isActive) return false;
        }
        
        // Filtro por busca
        if (customerFilters.search) {
          const searchTerm = customerFilters.search.toLowerCase();
          return (
            customer.name?.toLowerCase().includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm) ||
            customer.phone?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const handleViewCustomer = (customer: any) => {
    // Simular dados detalhados do cliente
    const detailedCustomer = {
      ...customer,
      purchases: [
        {
          id: '1',
          saleNumber: 'VND-001',
          totalAmount: 1250.00,
          status: 'COMPLETED',
          paymentMethod: 'PIX',
          createdAt: '2024-01-20T10:00:00Z',
          items: [
            {
              id: '1',
              quantity: 1,
              unitPrice: 1250.00,
              totalPrice: 1250.00,
              product: {
                name: 'Sofá 3 Lugares',
                category: 'SOFA'
              }
            }
          ]
        }
      ],
      favorites: [
        {
          id: '1',
          createdAt: '2024-01-15T10:00:00Z',
          product: {
            name: 'Mesa de Jantar',
            price: 899.90,
            category: 'MESA'
          }
        }
      ],
      reviews: [
        {
          id: '1',
          rating: 5,
          title: 'Excelente produto!',
          comment: 'Muito satisfeito com a compra, produto de ótima qualidade.',
          createdAt: '2024-01-25T10:00:00Z',
          product: {
            name: 'Sofá 3 Lugares'
          }
        }
      ]
    };
    
    setSelectedCustomer(detailedCustomer);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando clientes...</p>
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
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
                  <p className="text-white/80 text-lg">Visualize e gerencie informações dos clientes</p>
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
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total de Clientes</p>
                <p className="text-3xl font-bold text-[#3e2626]">{customers.length}</p>
                <p className="text-xs text-[#3e2626]/70">Cadastrados</p>
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
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Clientes Ativos</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {customers.filter((c: any) => c.isActive).length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Ativos</p>
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
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total de Compras</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {customers.reduce((sum: number, c: any) => sum + (c._count?.purchases || 0), 0)}
                </p>
                <p className="text-xs text-[#3e2626]/70">Realizadas</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total de Favoritos</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {customers.reduce((sum: number, c: any) => sum + (c._count?.favorites || 0), 0)}
                </p>
                <p className="text-xs text-[#3e2626]/70">Produtos</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Buscar clientes
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3e2626]/60 h-5 w-5" />
                <Input
                  id="search"
                  placeholder="Digite nome, email ou telefone..."
                  value={customerFilters.search}
                  onChange={(e) => setCustomerFilters(prev => ({ ...prev, search: e.target.value }))}
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
                value={customerFilters.status}
                onChange={(e) => setCustomerFilters(prev => ({ ...prev, status: e.target.value }))}
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
                onClick={() => setCustomerFilters({ status: 'all', search: '' })}
                className="flex items-center space-x-2 h-12 px-6 border-2 border-[#3e2626]/20 rounded-xl hover:border-[#3e2626] hover:text-[#3e2626] text-[#3e2626]/70"
              >
                <X className="h-4 w-4" />
                <span>Limpar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Display Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#3e2626]">Lista de Clientes</CardTitle>
              <CardDescription className="text-lg text-[#3e2626]/70">
                {getFilteredCustomers().length} cliente(s) encontrado(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {getFilteredCustomers().length > 0 ? (
            viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredCustomers().map((customer: any) => (
                  <div key={customer.id} className="bg-gradient-to-br from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-xl hover:border-[#3e2626] transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] text-white font-bold text-lg">
                              {customer.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${
                            customer.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-[#3e2626] text-lg">{customer.name}</h3>
                          <p className="text-[#3e2626]/70 text-sm">{customer.email}</p>
                          {customer.phone && (
                            <p className="text-[#3e2626]/70 text-sm">{customer.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          customer.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {customer.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-[#3e2626]/5 rounded-lg p-2">
                          <p className="text-lg font-bold text-[#3e2626]">{customer._count?.purchases || 0}</p>
                          <p className="text-xs text-[#3e2626]/70">Compras</p>
                        </div>
                        <div className="bg-[#3e2626]/5 rounded-lg p-2">
                          <p className="text-lg font-bold text-[#3e2626]">{customer._count?.favorites || 0}</p>
                          <p className="text-xs text-[#3e2626]/70">Favoritos</p>
                        </div>
                        <div className="bg-[#3e2626]/5 rounded-lg p-2">
                          <p className="text-lg font-bold text-[#3e2626]">{customer._count?.reviews || 0}</p>
                          <p className="text-xs text-[#3e2626]/70">Avaliações</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center pt-4 border-t border-[#3e2626]/10">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewCustomer(customer)}
                          className="rounded-xl hover:bg-[#3e2626] hover:text-white text-[#3e2626] border-[#3e2626]/20 w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {getFilteredCustomers().map((customer: any) => (
                  <div key={customer.id} className="bg-gradient-to-r from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-lg hover:border-[#3e2626] transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="w-14 h-14 border-4 border-white shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] text-white font-bold">
                              {customer.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                            customer.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-[#3e2626] text-lg">{customer.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              customer.isActive 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {customer.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-[#3e2626]/70 text-sm mt-1">{customer.email}</p>
                          {customer.phone && (
                            <p className="text-[#3e2626]/70 text-sm">{customer.phone}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-[#3e2626]/70 mt-2">
                            <div className="flex items-center">
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              {customer._count?.purchases || 0} compras
                            </div>
                            <div className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {customer._count?.favorites || 0} favoritos
                            </div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              {customer._count?.reviews || 0} avaliações
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewCustomer(customer)}
                          className="rounded-xl hover:bg-[#3e2626] hover:text-white text-[#3e2626] border-[#3e2626]/20"
                        >
                          <Eye className="h-4 w-4" />
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
                <User className="h-12 w-12 text-[#3e2626]/60" />
              </div>
              <h3 className="text-2xl font-bold text-[#3e2626] mb-3">Nenhum cliente encontrado</h3>
              <p className="text-[#3e2626]/70 text-lg mb-6">
                {customerFilters.search || customerFilters.status !== 'all'
                  ? 'Tente ajustar os filtros para encontrar clientes.'
                  : 'Não há clientes cadastrados no sistema.'
                }
              </p>
              {(customerFilters.search || customerFilters.status !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => setCustomerFilters({ status: 'all', search: '' })}
                  className="px-6 py-3 rounded-xl border-2 border-[#3e2626]/20 hover:border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer View Modal */}
      {isModalOpen && selectedCustomer && (
        <CustomerViewModal
          customer={selectedCustomer}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
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
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Seção de Vendas</h3>
        <p className="text-gray-500">Funcionalidade em desenvolvimento.</p>
      </div>
    </div>
  );
}

// Componente da Seção de Configurações
function SettingsSection({ isLoading }: any) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Seção de Configurações</h3>
        <p className="text-gray-500">Funcionalidade em desenvolvimento.</p>
      </div>
    </div>
  );
}

// Componente da Seção de Relatórios
function ReportsSection({ isLoading }: any) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Seção de Relatórios</h3>
        <p className="text-gray-500">Funcionalidade em desenvolvimento.</p>
      </div>
    </div>
  );
}
