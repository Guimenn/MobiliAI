'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { 
  DollarSign, 
  Plus,
  Download, 
  PieChart,
  LineChart,
  Target,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  BarChart3,
  BarChart,
  FileText
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const { token } = useAppStore();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalCustomers: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar dados para relatórios
      const [salesResponse, usersResponse] = await Promise.all([
        adminAPI.getSales(),
        adminAPI.getUsers()
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

    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
  );
}