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
  Store,
  CreditCard,
  Receipt,
  Calendar,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function ManagerDashboard() {
  const { user, isAuthenticated, logout } = useAppStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // REMOVER TODA VERIFICAÇÃO DE AUTENTICAÇÃO TEMPORARIAMENTE
  // Para resolver o problema de redirecionamento
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard da Loja</h1>
                  <p className="text-sm text-gray-600">Gerencie sua loja</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Gerente'}</p>
                    <p className="text-xs text-gray-500">Gerente</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Funcionários</TabsTrigger>
            <TabsTrigger value="products">Estoque</TabsTrigger>
            <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">
                    +1 desde o mês passado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">52</div>
                  <p className="text-xs text-muted-foreground">
                    +3 desde o mês passado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 15.230</div>
                  <p className="text-xs text-muted-foreground">
                    +8% desde o mês passado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    Produtos precisam de reposição
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente da Loja</CardTitle>
                <CardDescription>Últimas ações realizadas na sua loja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Nova venda realizada</p>
                      <p className="text-xs text-gray-500">R$ 1.200,00 - há 1 hora</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Produto adicionado</p>
                      <p className="text-xs text-gray-500">Sofá Moderno - há 3 horas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Estoque baixo</p>
                      <p className="text-xs text-gray-500">Mesa de Centro - há 5 horas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Funcionários</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Funcionários da Loja</CardTitle>
                <CardDescription>Gerencie os funcionários da sua loja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Maria Santos</h3>
                      <p className="text-sm text-gray-600">maria@loja.com - Funcionária</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Ativo</Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">João Silva</h3>
                      <p className="text-sm text-gray-600">joao@loja.com - Funcionário</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Ativo</Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestão de Estoque</h2>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </div>
            </div>

            {/* Estoque Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">52</div>
                  <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">3</div>
                  <p className="text-xs text-muted-foreground">Precisam de reposição</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 125.000</div>
                  <p className="text-xs text-muted-foreground">Valor em estoque</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Produtos da Loja</CardTitle>
                <CardDescription>Gerencie o estoque dos produtos da sua loja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Sofá 3 Lugares Moderno</h3>
                        <p className="text-sm text-gray-600">R$ 2.500,00</p>
                        <p className="text-xs text-gray-500">Código: SOF001</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Estoque: 5 unidades</p>
                        <p className="text-xs text-gray-500">Última atualização: 2 dias</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Móveis</Badge>
                        <Badge className="bg-green-100 text-green-800">Em Estoque</Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Mesa de Jantar 6 Lugares</h3>
                        <p className="text-sm text-gray-600">R$ 1.200,00</p>
                        <p className="text-xs text-gray-500">Código: MES002</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Estoque: 2 unidades</p>
                        <p className="text-xs text-orange-600">⚠️ Estoque baixo</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Móveis</Badge>
                        <Badge className="bg-orange-100 text-orange-800">Estoque Baixo</Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Cadeira Executiva Premium</h3>
                        <p className="text-sm text-gray-600">R$ 850,00</p>
                        <p className="text-xs text-gray-500">Código: CAD003</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Estoque: 8 unidades</p>
                        <p className="text-xs text-gray-500">Última atualização: 1 dia</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Móveis</Badge>
                        <Badge className="bg-green-100 text-green-800">Em Estoque</Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Fluxo de Caixa</h2>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Período
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transação
                </Button>
              </div>
            </div>

            {/* Cash Flow Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">R$ 15.230</div>
                  <p className="text-xs text-muted-foreground">+5% este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
                  <ArrowUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">R$ 28.500</div>
                  <p className="text-xs text-muted-foreground">+12% vs mês anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
                  <ArrowDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">R$ 13.270</div>
                  <p className="text-xs text-muted-foreground">+3% vs mês anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">R$ 15.230</div>
                  <p className="text-xs text-muted-foreground">Margem: 53.4%</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowUp className="h-5 w-5 text-green-500 mr-2" />
                    Últimas Receitas
                  </CardTitle>
                  <CardDescription>Entradas recentes no caixa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Venda #001234</p>
                          <p className="text-xs text-gray-600">Cliente: João Silva</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+R$ 1.250,00</p>
                        <p className="text-xs text-gray-500">Hoje, 14:30</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Venda #001233</p>
                          <p className="text-xs text-gray-600">Cliente: Maria Santos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+R$ 890,00</p>
                        <p className="text-xs text-gray-500">Hoje, 12:15</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Venda #001232</p>
                          <p className="text-xs text-gray-600">Cliente: Pedro Costa</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+R$ 2.100,00</p>
                        <p className="text-xs text-gray-500">Ontem, 16:45</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowDown className="h-5 w-5 text-red-500 mr-2" />
                    Últimas Despesas
                  </CardTitle>
                  <CardDescription>Saídas recentes do caixa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Aluguel da Loja</p>
                          <p className="text-xs text-gray-600">Despesa fixa</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">-R$ 3.500,00</p>
                        <p className="text-xs text-gray-500">Ontem, 09:00</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <Receipt className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Fornecedor ABC</p>
                          <p className="text-xs text-gray-600">Reposição de estoque</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">-R$ 1.800,00</p>
                        <p className="text-xs text-gray-500">Ontem, 14:20</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Salários</p>
                          <p className="text-xs text-gray-600">Folha de pagamento</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">-R$ 8.500,00</p>
                        <p className="text-xs text-gray-500">2 dias atrás</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cash Flow Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Caixa - Últimos 30 Dias</CardTitle>
                <CardDescription>Evolução do saldo de caixa ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Gráfico de Fluxo de Caixa</p>
                    <p className="text-sm text-gray-400">Integração com biblioteca de gráficos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Relatórios da Loja</h2>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Relatórios Disponíveis</CardTitle>
                <CardDescription>Visualize os relatórios da sua loja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Relatório de Vendas</h3>
                      <p className="text-sm text-gray-600">Vendas do mês atual</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Relatório de Estoque</h3>
                      <p className="text-sm text-gray-600">Status atual do estoque</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Relatório de Funcionários</h3>
                      <p className="text-sm text-gray-600">Atividade dos funcionários</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}