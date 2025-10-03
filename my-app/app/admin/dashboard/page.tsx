'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

    const timer = setTimeout(checkAuth, 500);
    return () => clearTimeout(timer);
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
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-[#3e2626]">{user.name}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
                <div className="w-8 h-8 bg-[#3e2626] rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-white" />
                </div>
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
              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Lojas</CardTitle>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Store className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">8</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">+2 este mês</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">1,247</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">+12% este mês</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Produtos Ativos</CardTitle>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">2,847</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">+8% este mês</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Receita Mensal</CardTitle>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">R$ 847K</div>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">+15% este mês</p>
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
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Nova loja cadastrada</p>
                        <p className="text-xs text-gray-500">Loja Shopping Center - há 2 horas</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Usuário criado</p>
                        <p className="text-xs text-gray-500">Maria Silva - há 4 horas</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Produto atualizado</p>
                        <p className="text-xs text-gray-500">Sofá Moderno - há 6 horas</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Relatório gerado</p>
                        <p className="text-xs text-gray-500">Vendas mensais - há 8 horas</p>
                      </div>
                    </div>
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
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Loja Matriz</CardTitle>
                    <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                  </div>
                  <CardDescription>Rua Principal, 123 - Centro</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      15 funcionários
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="h-4 w-4 mr-2" />
                      1,247 produtos
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      R$ 45K este mês
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

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Loja Shopping</CardTitle>
                    <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                  </div>
                  <CardDescription>Shopping Center, 2º andar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      8 funcionários
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="h-4 w-4 mr-2" />
                      892 produtos
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      R$ 32K este mês
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

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Loja Norte</CardTitle>
                    <Badge className="bg-yellow-100 text-yellow-800">Manutenção</Badge>
                  </div>
                  <CardDescription>Av. Norte, 456 - Zona Norte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      12 funcionários
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="h-4 w-4 mr-2" />
                      1,156 produtos
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      R$ 28K este mês
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
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#3e2626]">Gerenciar Usuários</h2>
                <p className="text-gray-600">Gerencie todos os usuários do sistema</p>
              </div>
              <div className="flex space-x-2">
                <Input placeholder="Buscar usuários..." className="w-64" />
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
                <CardTitle>Lista de Usuários</CardTitle>
                <CardDescription>Usuários cadastrados no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#3e2626] rounded-full flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#3e2626]">João Silva</h3>
                        <p className="text-sm text-gray-600">joao@loja.com</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-blue-100 text-blue-800">Gerente</Badge>
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
                      <div className="w-10 h-10 bg-[#8B4513] rounded-full flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#3e2626]">Maria Santos</h3>
                        <p className="text-sm text-gray-600">maria@loja.com</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-orange-100 text-orange-800">Funcionária</Badge>
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
                      <div className="w-10 h-10 bg-[#D2B48C] rounded-full flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#3e2626]">Pedro Costa</h3>
                        <p className="text-sm text-gray-600">pedro@loja.com</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-purple-100 text-purple-800">Cliente</Badge>
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