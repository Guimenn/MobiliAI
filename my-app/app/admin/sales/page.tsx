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
  Receipt
} from 'lucide-react';

export default function SalesPage() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    const checkAuth = async () => {
      if (!currentUser || !token) {
        router.push('/login');
        return;
      }
      await loadSalesData();
    };

    checkAuth();
  }, [currentUser, token, router]);

  const loadSalesData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar vendas do banco de dados
      const salesResponse = await adminAPI.getSales(token);
      if (salesResponse.ok) {
        const salesResult = await salesResponse.json();
        const salesData = Array.isArray(salesResult) ? salesResult : [];
        setSales(salesData);
        
        // Calcular estatísticas
        const totalRevenue = salesData.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
        const averageOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;
        
        setStats({
          totalSales: salesData.length,
          totalRevenue,
          averageOrderValue,
          conversionRate: 0 // Seria calculado com dados de visitantes
        });
      } else {
        console.log('API de vendas não disponível, usando dados mock');
        // Dados mock para desenvolvimento
        const mockSales = [
          {
            id: '1',
            customerName: 'João Silva',
            customerEmail: 'joao@email.com',
            totalAmount: 1250.00,
            status: 'COMPLETED',
            paymentMethod: 'PIX',
            createdAt: new Date('2024-01-15'),
            items: [
              { productName: 'Sofá 3 Lugares', quantity: 1, price: 1250.00 }
            ]
          },
          {
            id: '2',
            customerName: 'Maria Santos',
            customerEmail: 'maria@email.com',
            totalAmount: 850.00,
            status: 'PENDING',
            paymentMethod: 'CARTÃO',
            createdAt: new Date('2024-01-14'),
            items: [
              { productName: 'Mesa de Jantar', quantity: 1, price: 850.00 }
            ]
          },
          {
            id: '3',
            customerName: 'Pedro Costa',
            customerEmail: 'pedro@email.com',
            totalAmount: 2100.00,
            status: 'COMPLETED',
            paymentMethod: 'PIX',
            createdAt: new Date('2024-01-13'),
            items: [
              { productName: 'Conjunto Sala Completo', quantity: 1, price: 2100.00 }
            ]
          }
        ];
        
        setSales(mockSales);
        
        // Calcular estatísticas dos dados mock
        const totalRevenue = mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const averageOrderValue = mockSales.length > 0 ? totalRevenue / mockSales.length : 0;
        const totalSales = mockSales.length;
        const pendingSales = mockSales.filter(sale => sale.status === 'PENDING').length;
        
        setStats({
          totalSales,
          totalRevenue,
          averageOrderValue,
          conversionRate: 0 // Seria calculado com dados de visitantes
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do banco:', error);
      setSales([]);
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
                    className="w-full justify-start text-[#3e2626] bg-[#3e2626]/5"
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
                  <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
                  <p className="text-sm text-gray-500">Gerencie todas as vendas do sistema</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[#3e2626] hover:bg-[#3e2626]/90"
                  onClick={() => router.push('/admin/sales/create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Venda
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
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSales}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% em relação ao mês anterior
                  </p>
            </CardContent>
          </Card>
          <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% em relação ao mês anterior
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
          <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    +2% em relação ao mês anterior
                  </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        <Card>
          <CardHeader>
                <CardTitle>Vendas Recentes</CardTitle>
                <CardDescription>
                  Lista de todas as vendas realizadas no sistema
                </CardDescription>
          </CardHeader>
          <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626]"></div>
                  </div>
                ) : sales.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma venda encontrada</h3>
                    <p className="text-gray-500">As vendas aparecerão aqui quando forem realizadas.</p>
                  </div>
                ) : (
            <div className="space-y-4">
                    {sales.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-[#3e2626]" />
                    </div>
                          <div>
                            <p className="font-medium text-gray-900">Venda #{sale.saleNumber || sale.id}</p>
                            <p className="text-sm text-gray-500">
                              {sale.customer?.name || 'Cliente'} • {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                            </p>
                      </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              R$ {sale.totalAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                            </p>
                            <Badge variant={sale.status === 'COMPLETED' ? 'default' : 'secondary'}>
                              {sale.status === 'COMPLETED' ? 'Concluída' : sale.status || 'Pendente'}
                            </Badge>
                        </div>
                          <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
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