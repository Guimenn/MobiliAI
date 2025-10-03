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
  ShoppingCart, 
  Package, 
  DollarSign, 
  Clock,
  LogOut,
  Plus,
  Search,
  CreditCard,
  Receipt,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  User,
  Calendar,
  Eye
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user, isAuthenticated, logout } = useAppStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
              <h1 className="text-2xl font-bold text-gray-900">PDV - Ponto de Venda</h1>
              <p className="text-sm text-gray-600">Sistema de vendas para funcionários</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Funcionário'}</p>
                <p className="text-xs text-gray-500">Vendedor</p>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pos">PDV</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Carrinho de Compras
                    </CardTitle>
                    <CardDescription>Carrinho vazio - Adicione produtos para iniciar a venda</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-12 text-gray-500">
                        <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">Nenhum produto no carrinho</p>
                        <p className="text-sm">Busque e adicione produtos para começar</p>
                      </div>
                      
                      {/* Search */}
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Buscar produtos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1"
                        />
                        <Button>
                          <Search className="h-4 w-4 mr-2" />
                          Buscar
                        </Button>
                      </div>

                      {/* Quick Products */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                          <Package className="h-6 w-6 mb-2" />
                          <span className="text-xs">Produto Rápido</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                          <User className="h-6 w-6 mb-2" />
                          <span className="text-xs">Cliente Frequente</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Checkout */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Finalizar Venda</CardTitle>
                    <CardDescription>Resumo do pedido</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nenhum item selecionado</p>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>R$ 0,00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Desconto:</span>
                        <span>R$ 0,00</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>R$ 0,00</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full" disabled>
                        <CreditCard className="h-4 w-4 mr-2" />
                        PIX
                      </Button>
                      <Button variant="outline" className="w-full" disabled>
                        <Receipt className="h-4 w-4 mr-2" />
                        Dinheiro
                      </Button>
                      <Button variant="outline" className="w-full" disabled>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Cartão
                      </Button>
                    </div>

                    <div className="pt-4 border-t">
                      <Button variant="secondary" className="w-full" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar Venda
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Minhas Vendas</h2>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Hoje
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Venda
                </Button>
              </div>
            </div>

            {/* Sales Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">
                    +2 desde ontem
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 3.250</div>
                  <p className="text-xs text-muted-foreground">
                    +15% vs ontem
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 406</div>
                  <p className="text-xs text-muted-foreground">
                    +8% vs ontem
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meta do Dia</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">65%</div>
                  <p className="text-xs text-muted-foreground">
                    R$ 3.250 / R$ 5.000
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas Recentes</CardTitle>
                <CardDescription>Suas vendas do dia atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Venda #001234</h3>
                        <p className="text-sm text-gray-600">Cliente: João Silva</p>
                        <p className="text-xs text-gray-500">Hoje, 14:30</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">R$ 1.250,00</p>
                      <Badge className="bg-green-100 text-green-800">PIX</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Venda #001233</h3>
                        <p className="text-sm text-gray-600">Cliente: Maria Santos</p>
                        <p className="text-xs text-gray-500">Hoje, 12:15</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">R$ 890,00</p>
                      <Badge className="bg-blue-100 text-blue-800">Cartão</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Venda #001232</h3>
                        <p className="text-sm text-gray-600">Cliente: Pedro Costa</p>
                        <p className="text-xs text-gray-500">Hoje, 10:45</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">R$ 2.100,00</p>
                      <Badge className="bg-yellow-100 text-yellow-800">Dinheiro</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Produtos Disponíveis</h2>
              <div className="flex space-x-2">
                <Input
                  placeholder="Buscar produtos..."
                  className="w-64"
                />
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Sofá 3 Lugares</span>
                    <Badge className="bg-green-100 text-green-800">Em Estoque</Badge>
                  </CardTitle>
                  <CardDescription>Código: SOF001</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Preço:</span>
                    <span className="font-bold">R$ 2.500,00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estoque:</span>
                    <span className="text-sm">5 unidades</span>
                  </div>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Mesa de Jantar</span>
                    <Badge className="bg-orange-100 text-orange-800">Estoque Baixo</Badge>
                  </CardTitle>
                  <CardDescription>Código: MES002</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Preço:</span>
                    <span className="font-bold">R$ 1.200,00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estoque:</span>
                    <span className="text-sm text-orange-600">2 unidades</span>
                  </div>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Cadeira Executiva</span>
                    <Badge className="bg-green-100 text-green-800">Em Estoque</Badge>
                  </CardTitle>
                  <CardDescription>Código: CAD003</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Preço:</span>
                    <span className="font-bold">R$ 850,00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estoque:</span>
                    <span className="text-sm">8 unidades</span>
                  </div>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Meus Relatórios</h2>
              <Button>
                <Receipt className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Relatórios Disponíveis</CardTitle>
                <CardDescription>Visualize seus relatórios de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Relatório de Vendas Diário</h3>
                      <p className="text-sm text-gray-600">Vendas do dia atual</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Relatório de Vendas Semanal</h3>
                      <p className="text-sm text-gray-600">Vendas da semana atual</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Relatório de Performance</h3>
                      <p className="text-sm text-gray-600">Sua performance de vendas</p>
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
