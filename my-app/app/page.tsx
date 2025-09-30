'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  LogOut,
  Shield,
  UserCheck,
  Building2,
  ShoppingCart,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  CreditCard,
  Truck,
  Star,
  Activity,
  Database,
  Lock,
  Unlock,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import ClientOnly from '@/components/ClientOnly';

export default function AdminHome() {
  const { user, isAuthenticated, logout, isUserAuthenticated } = useAppStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalStores: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    monthlyRevenue: 0,
    activeStores: 0
  });

  useEffect(() => {
    // Debug: mostrar estado atual
    console.log('Estado atual:', { isAuthenticated, user, role: user?.role });
    
    // Verificar se o estado está sendo carregado do localStorage
    const storedState = localStorage.getItem('mobili-ai-storage');
    console.log('Estado armazenado:', storedState ? JSON.parse(storedState) : 'Nenhum estado armazenado');
    
    // Carregar estatísticas se estiver autenticado
    if (isUserAuthenticated()) {
      loadStats();
    }
  }, [isAuthenticated, user, isUserAuthenticated]);

  const loadStats = async () => {
    // Simular carregamento de estatísticas
    setStats({
      totalStores: 3,
      totalUsers: 24,
      totalProducts: 156,
      totalSales: 89,
      monthlyRevenue: 125000,
      activeStores: 3
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };


  // Debug: mostrar informações do usuário
  console.log('Usuário logado:', { 
    name: user?.name, 
    role: user?.role, 
    email: user?.email,
    isAuthenticated 
  });

  // Verificar se é admin ou gerente - com debug
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isManager = user?.role?.toLowerCase() === 'store_manager';
  
  console.log('Verificação de acesso:', { 
    isAdmin, 
    isManager, 
    canAccess: isAdmin || isManager,
    roleValue: user?.role,
    roleType: typeof user?.role
  });

  // Debug adicional para verificar se as funcionalidades estão sendo renderizadas
  console.log('Renderizando funcionalidades para:', user?.role);

  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">MobiliAI</h1>
          <p className="text-gray-600 mb-8">Sistema Administrativo</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    }>
      {!isUserAuthenticated() ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">MobiliAI</h1>
            <p className="text-gray-600 mb-8">Sistema Administrativo</p>
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isAdmin ? 'Sistema Administrativo' : 'Gestão da Loja'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {isAdmin ? 'Controle total da empresa' : 'Gerencie sua loja'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? 'Administrador' : 'Gerente'}
                  </p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {user?.name}!
          </h2>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Controle total da empresa - Gerencie lojas, funcionários, produtos e finanças.'
              : 'Gerencie sua loja e acompanhe o desempenho da sua equipe.'
            }
          </p>
          
          {/* Debug Info */}
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Debug:</strong> Role = "{user?.role}" | isAdmin = {isAdmin.toString()} | isManager = {isManager.toString()}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lojas</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStores}</div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Total de lojas' : 'Sua loja'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Total de usuários' : 'Funcionários da loja'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Total de produtos' : 'Produtos da loja'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Receita consolidada' : 'Receita da loja'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Functions */}
        {isAdmin && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Funcionalidades Administrativas</h3>
            
            {/* Cadastro de Lojas */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">🏢 Gestão de Lojas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/stores')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lojas</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Gestão</div>
                    <p className="text-xs text-muted-foreground">
                      Cadastrar, editar e desativar lojas filiais
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/stores/new')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nova Loja</CardTitle>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Cadastrar</div>
                    <p className="text-xs text-muted-foreground">
                      Criar nova loja filial
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/stores/status')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Monitorar</div>
                    <p className="text-xs text-muted-foreground">
                      Status das lojas
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Cadastro de Funcionários */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">👥 Gestão de Funcionários</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/users')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Pessoal</div>
                    <p className="text-xs text-muted-foreground">
                      Gerenciar funcionários de todas as lojas
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/users/new')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Novo Funcionário</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Cadastrar</div>
                    <p className="text-xs text-muted-foreground">
                      Cadastrar funcionário com vínculo à loja
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/users/roles')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Perfis</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Acessos</div>
                    <p className="text-xs text-muted-foreground">
                      Definir perfis de acesso
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Cadastro de Fornecedores */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">🏭 Gestão de Fornecedores</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/suppliers')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Cadastros</div>
                    <p className="text-xs text-muted-foreground">
                      Gerenciar fornecedores
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/suppliers/new')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Novo Fornecedor</CardTitle>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Cadastrar</div>
                    <p className="text-xs text-muted-foreground">
                      Cadastrar novo fornecedor
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/suppliers/contacts')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Informações</div>
                    <p className="text-xs text-muted-foreground">
                      Dados de contato e empresa
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Cadastro de Produtos */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">📦 Gestão de Produtos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/products')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Catálogo</div>
                    <p className="text-xs text-muted-foreground">
                      Gerenciar produtos com SKU e preços
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/products/new')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Novo Produto</CardTitle>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Cadastrar</div>
                    <p className="text-xs text-muted-foreground">
                      Cadastrar produto com código de barras
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/products/categories')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categorias</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Organizar</div>
                    <p className="text-xs text-muted-foreground">
                      Gerenciar categorias de produtos
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Gestão Financeira */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">💰 Gestão Financeira</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/financial')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Financeiro</div>
                    <p className="text-xs text-muted-foreground">
                      Controle de entradas e saídas
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/financial/expenses')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Contas a Pagar</div>
                    <p className="text-xs text-muted-foreground">
                      Aluguel, água, luz, salários
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/financial/suppliers')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Pagamentos</div>
                    <p className="text-xs text-muted-foreground">
                      Controle de pagamentos a fornecedores
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Relatórios Consolidados */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">📊 Relatórios Consolidados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/reports')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Consolidados</div>
                    <p className="text-xs text-muted-foreground">
                      Relatórios de todas as lojas
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/reports/sales')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Vendas</div>
                    <p className="text-xs text-muted-foreground">
                      Acompanhar vendas de todas as lojas
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/reports/financial')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Financeiro</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Fluxo</div>
                    <p className="text-xs text-muted-foreground">
                      Relatórios financeiros consolidados
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Controle e Monitoramento */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Controle e Monitoramento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/system')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sistema</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Configurações</div>
                    <p className="text-xs text-muted-foreground">
                      Configurações do sistema
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/logs')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Logs</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Auditoria</div>
                    <p className="text-xs text-muted-foreground">
                      Logs de atividades do sistema
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/backup')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Backup</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Segurança</div>
                    <p className="text-xs text-muted-foreground">
                      Backup e segurança dos dados
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Manager Functions */}
        {isManager && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Funcionalidades do Gerente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/manager')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dashboard</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Visão Geral</div>
                  <p className="text-xs text-muted-foreground">
                    Estatísticas da sua loja
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/manager/users')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Pessoal</div>
                  <p className="text-xs text-muted-foreground">
                    Gerenciar funcionários da sua loja
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/manager/products')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Estoque</div>
                  <p className="text-xs text-muted-foreground">
                    Gerenciar produtos da sua loja
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações realizadas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sistema iniciado</p>
                  <p className="text-xs text-gray-500">Há alguns minutos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Login realizado</p>
                  <p className="text-xs text-gray-500">Há alguns minutos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Configurações carregadas</p>
                  <p className="text-xs text-gray-500">Há alguns minutos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
        </div>
      )}
    </ClientOnly>
  );
}