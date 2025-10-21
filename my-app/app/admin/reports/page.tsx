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
  PieChart,
  LineChart,
  Target
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalCustomers: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    const checkAuth = async () => {
      if (!currentUser || !token) {
        router.push('/login');
        return;
      }
      await loadReportsData();
    };

    checkAuth();
  }, [currentUser, token, router]);

  const loadReportsData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar dados para relatórios
      const [salesResponse, usersResponse] = await Promise.all([
        adminAPI.getSales(token),
        adminAPI.getUsers(token)
      ]);

      let salesData = [];
      let usersData = [];

      if (salesResponse.ok) {
        const salesResult = await salesResponse.json();
        salesData = Array.isArray(salesResult) ? salesResult : [];
      } else {
        console.log('API de vendas não disponível, usando dados mock');
        // Dados mock para vendas
        salesData = [
          { id: '1', totalAmount: 1250.00, status: 'COMPLETED', createdAt: new Date('2024-01-15') },
          { id: '2', totalAmount: 850.00, status: 'PENDING', createdAt: new Date('2024-01-14') },
          { id: '3', totalAmount: 2100.00, status: 'COMPLETED', createdAt: new Date('2024-01-13') }
        ];
      }

      if (usersResponse.ok) {
        const usersResult = await usersResponse.json();
        usersData = Array.isArray(usersResult) ? usersResult : [];
      } else {
        console.log('API de usuários não disponível, usando dados mock');
        // Dados mock para usuários
        usersData = [
          { id: '1', role: 'CUSTOMER', name: 'João Silva', email: 'joao@email.com' },
          { id: '2', role: 'CUSTOMER', name: 'Maria Santos', email: 'maria@email.com' },
          { id: '3', role: 'CUSTOMER', name: 'Pedro Costa', email: 'pedro@email.com' },
          { id: '4', role: 'ADMIN', name: 'Admin', email: 'admin@email.com' }
        ];
      }

      // Calcular estatísticas
      const totalRevenue = salesData.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
      const totalSales = salesData.length;
      const totalCustomers = usersData.filter((user: any) => user.role === 'CUSTOMER').length;
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      setStats({
        totalRevenue,
        totalSales,
        totalCustomers,
        averageOrderValue
      });

      // Gerar relatórios mockados
      setReports([
        {
          id: 1,
          name: 'Relatório de Vendas Mensal',
          type: 'sales',
          period: 'Janeiro 2024',
          status: 'completed',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Análise de Produtos Mais Vendidos',
          type: 'products',
          period: 'Últimos 30 dias',
          status: 'completed',
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Relatório de Clientes',
          type: 'customers',
          period: 'Trimestre Q1',
          status: 'processing',
          createdAt: new Date().toISOString()
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados do banco:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };

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
                    className="w-full justify-start text-[#3e2626] bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/reports')}
                  >
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Relatórios
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
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
                  <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                  <p className="text-sm text-gray-500">Análises e relatórios do sistema</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button size="sm" className="bg-[#3e2626] hover:bg-[#3e2626]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Relatório
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
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% em relação ao mês anterior
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSales}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% em relação ao mês anterior
                  </p>
            </CardContent>
          </Card>
          <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    +15% em relação ao mês anterior
                  </p>
            </CardContent>
          </Card>
          <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.averageOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">
                    +5% em relação ao mês anterior
                  </p>
            </CardContent>
          </Card>
        </div>

            {/* Quick Reports */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-[#3e2626]" />
                    Vendas por Período
                  </CardTitle>
                  <CardDescription>
                    Análise de vendas por dia, semana ou mês
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                    <LineChart className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-[#3e2626]" />
                    Produtos Mais Vendidos
                  </CardTitle>
                  <CardDescription>
                    Ranking dos produtos com maior volume de vendas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                    <PieChart className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-[#3e2626]" />
                    Análise de Clientes
                  </CardTitle>
                  <CardDescription>
                    Comportamento e segmentação de clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Target className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
        </div>

            {/* Reports List */}
        <Card>
          <CardHeader>
                <CardTitle>Relatórios Gerados</CardTitle>
                <CardDescription>
                  Histórico de relatórios criados no sistema
                </CardDescription>
          </CardHeader>
          <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626]"></div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum relatório encontrado</h3>
                    <p className="text-gray-500">Os relatórios aparecerão aqui quando forem gerados.</p>
                  </div>
                ) : (
            <div className="space-y-4">
                    {reports.map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-[#3e2626]" />
                      </div>
                      <div>
                            <p className="font-medium text-gray-900">{report.name}</p>
                            <p className="text-sm text-gray-500">
                              {report.period} • {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                            {report.status === 'completed' ? 'Concluído' : 'Processando'}
                          </Badge>
                          <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
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