'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { adminAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Store, 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  BarChart3,
  Settings,
  Plus,
  Search,
  LogOut,
  Eye,
  Edit,
  Trash2,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  Download,
  Upload,
  Bell,
  UserCheck,
  Building2,
  CreditCard,
  TrendingDown,
  Target,
  Zap,
  Shield,
  Database,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  Lock,
  Unlock,
  Star,
  Heart,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAppStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeStores: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  // Função para buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [dashboardData, storesData, usersData] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAllStores(),
        adminAPI.getAllUsers(1, 10, '')
      ]);

      // Atualizar estatísticas
      if (dashboardData.overview) {
        setStats(dashboardData.overview);
      }

      // Atualizar vendas recentes
      if (dashboardData.recentSales) {
        setRecentSales(dashboardData.recentSales);
      }

      // Atualizar produtos em destaque
      if (dashboardData.topProducts) {
        setTopProducts(dashboardData.topProducts);
      }

      // Atualizar lojas
      if (storesData) {
        setStores(storesData);
      }

      // Atualizar usuários (apenas funcionários e gerentes)
      if (usersData && usersData.users) {
        const filteredUsers = usersData.users.filter((user: any) => 
          user.role === 'STORE_MANAGER' || user.role === 'CASHIER'
        );
        setUsers(filteredUsers);
      }

    } catch (err: any) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }

      if (user.role !== 'ADMIN') {
        switch (user.role) {
          case 'STORE_MANAGER':
            router.push('/manager');
            break;
          case 'CASHIER':
            router.push('/');
            break;
          case 'CUSTOMER':
            router.push('/');
            break;
          default:
            router.push('/login');
        }
        return;
      }
    };

    checkAuth();
    
    // Buscar dados do dashboard se autenticado como admin
    if (isAuthenticated && user && user.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#3e2626]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Erro ao carregar dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData} className="bg-[#3e2626] hover:bg-[#8B4513]">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#3e2626] rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#3e2626]">MobiliAI Admin</h1>
                <p className="text-sm text-gray-600">Painel Administrativo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-[#3e2626]">{user.name}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#3e2626] text-white text-sm">
                    {user.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="stores">Lojas</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">{stats.totalUsers.toLocaleString()}</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">Usuários cadastrados</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Lojas</CardTitle>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Store className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">{stats.totalStores}</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">{stats.activeStores} ativas</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Produtos</CardTitle>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">{stats.totalProducts.toLocaleString()}</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">Produtos cadastrados</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">R$ {stats.monthlyRevenue.toLocaleString()}</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">Receita mensal</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-[#3e2626]" />
                    Vendas dos Últimos 6 Meses
                  </CardTitle>
                  <CardDescription>Evolução das vendas por período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-br from-[#3e2626]/5 to-[#8B4513]/5 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 text-[#3e2626] mx-auto mb-4" />
                      <p className="text-[#3e2626] font-medium">Gráfico de Vendas</p>
                      <p className="text-sm text-gray-500">Integração com biblioteca de gráficos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-[#3e2626]" />
                    Atividade Recente
                  </CardTitle>
                  <CardDescription>Últimas ações no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSales.length > 0 ? recentSales.slice(0, 5).map((sale: any) => (
                      <div key={sale.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Nova venda - R$ {sale.items?.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{sale.customer?.name} - {sale.store?.name} - {new Date(sale.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma venda recente</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Ações Rápidas
                </CardTitle>
                <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-[#3e2626] hover:bg-[#8B4513]">
                    <Plus className="h-6 w-6" />
                    <span className="text-sm">Nova Loja</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <UserCheck className="h-6 w-6" />
                    <span className="text-sm">Novo Usuário</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Package className="h-6 w-6" />
                    <span className="text-sm">Novo Produto</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Download className="h-6 w-6" />
                    <span className="text-sm">Relatório</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Produtos em Destaque
                </CardTitle>
                <CardDescription>Produtos com melhor desempenho de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.length > 0 ? topProducts.slice(0, 5).map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-[#3e2626] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">Avaliação: {product.rating || 0}/5</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#3e2626]">R$ {product.price.toLocaleString()}</p>
                        <div className="w-24 mt-1">
                          <Progress value={product.rating ? (product.rating / 5) * 100 : 0} className="h-2" />
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum produto em destaque</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stores" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#3e2626]">Gerenciar Lojas</h2>
                <p className="text-gray-600">Gerencie todas as lojas da empresa</p>
              </div>
              <div className="flex space-x-2">
                <Input placeholder="Buscar lojas..." className="w-64" />
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button className="bg-[#3e2626] hover:bg-[#8B4513]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Loja
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626]"></div>
                </div>
              ) : stores.length > 0 ? stores.map((store: any) => (
                <Card key={store.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <Badge className={store.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {store.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <CardDescription>{store.address} - {store.city}/{store.state}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Store className="h-4 w-4 mr-2" />
                        {store._count?.products || 0} produtos
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        {store._count?.sales || 0} vendas
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {store.email}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma loja cadastrada</p>
                </div>
              )}

            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#3e2626]">Gerenciar Funcionários</h2>
                <p className="text-gray-600">Gerencie funcionários e gerentes do sistema</p>
              </div>
              <div className="flex space-x-2">
                <Input placeholder="Buscar funcionários..." className="w-64" />
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                <Button className="bg-[#3e2626] hover:bg-[#8B4513]">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Lista de Funcionários</CardTitle>
                <CardDescription>Funcionários e gerentes cadastrados no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626]"></div>
                    </div>
                  ) : users.length > 0 ? users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-[#3e2626] text-white text-sm">
                            {user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-[#3e2626]">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={
                              user.role === 'STORE_MANAGER' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'CASHIER' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {user.role === 'STORE_MANAGER' ? 'Gerente' :
                               user.role === 'CASHIER' ? 'Funcionário' :
                               user.role}
                            </Badge>
                            <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum funcionário ou gerente cadastrado</p>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#3e2626]">Gerenciar Produtos</h2>
                <p className="text-gray-600">Gerencie todos os produtos do catálogo</p>
              </div>
              <div className="flex space-x-2">
                <Input placeholder="Buscar produtos..." className="w-64" />
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                <Button className="bg-[#3e2626] hover:bg-[#8B4513]">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </div>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Lista de Produtos</CardTitle>
                <CardDescription>Produtos cadastrados no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#3e2626] to-[#8B4513] rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#3e2626]">Sofá 3 Lugares Moderno</h3>
                        <p className="text-sm text-gray-600">R$ 2.500,00 - Estoque: 15 unidades</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-blue-100 text-blue-800">Móveis</Badge>
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#8B4513] to-[#D2B48C] rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#3e2626]">Mesa de Jantar 6 Lugares</h3>
                        <p className="text-sm text-gray-600">R$ 1.200,00 - Estoque: 8 unidades</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-blue-100 text-blue-800">Móveis</Badge>
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#3e2626]">Relatórios de Vendas</h2>
                <p className="text-gray-600">Acompanhe o desempenho das vendas</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Período
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">R$ 12.5K</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">+8% vs ontem</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">47</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">+12% vs ontem</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">R$ 266</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">+5% vs ontem</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Vendas Recentes</CardTitle>
                <CardDescription>Últimas vendas realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Pedido #001234</h3>
                        <p className="text-sm text-gray-600">Cliente: João Silva - R$ 1.250,00</p>
                        <p className="text-xs text-gray-500">Hoje, 14:30</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Concluído</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Pedido #001233</h3>
                        <p className="text-sm text-gray-600">Cliente: Maria Santos - R$ 890,00</p>
                        <p className="text-xs text-gray-500">Hoje, 12:15</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Processando</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#3e2626]">Configurações do Sistema</h2>
                <p className="text-gray-600">Gerencie as configurações gerais do sistema</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-[#3e2626]" />
                    Configurações Gerais
                  </CardTitle>
                  <CardDescription>Configurações básicas do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações por Email</p>
                      <p className="text-sm text-gray-600">Receber notificações por email</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Unlock className="h-4 w-4 mr-2" />
                      Ativado
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Backup Automático</p>
                      <p className="text-sm text-gray-600">Backup diário dos dados</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Unlock className="h-4 w-4 mr-2" />
                      Ativado
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Manutenção Programada</p>
                      <p className="text-sm text-gray-600">Sistema em manutenção</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Desativado
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-[#3e2626]" />
                    Segurança
                  </CardTitle>
                  <CardDescription>Configurações de segurança do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Autenticação 2FA</p>
                      <p className="text-sm text-gray-600">Autenticação de dois fatores</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Unlock className="h-4 w-4 mr-2" />
                      Ativado
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Logs de Acesso</p>
                      <p className="text-sm text-gray-600">Registrar logs de acesso</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Unlock className="h-4 w-4 mr-2" />
                      Ativado
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sessões Simultâneas</p>
                      <p className="text-sm text-gray-600">Limitar sessões por usuário</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Desativado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}