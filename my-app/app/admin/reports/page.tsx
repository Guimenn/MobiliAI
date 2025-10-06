'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Store,
  Package,
  ArrowLeft,
  FileText,
  PieChart,
  Activity
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedReport, setSelectedReport] = useState<string>('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.getReports();
      setReports(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reportTypes = [
    {
      id: 'sales',
      title: 'Relatório de Vendas',
      description: 'Análise detalhada das vendas por período',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'financial',
      title: 'Relatório Financeiro',
      description: 'Receitas, despesas e lucros consolidados',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'products',
      title: 'Relatório de Produtos',
      description: 'Produtos mais vendidos e performance',
      icon: Package,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'stores',
      title: 'Relatório de Lojas',
      description: 'Performance e comparação entre lojas',
      icon: Store,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      id: 'customers',
      title: 'Relatório de Clientes',
      description: 'Análise de comportamento e segmentação',
      icon: Users,
      color: 'bg-pink-100 text-pink-600'
    },
    {
      id: 'inventory',
      title: 'Relatório de Estoque',
      description: 'Movimentação e controle de estoque',
      icon: Activity,
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  const generateReport = async (reportType: string) => {
    try {
      setIsLoading(true);
      let response;
      
      switch (reportType) {
        case 'sales':
          response = await adminAPI.getSalesReport();
          break;
        case 'financial':
          response = await adminAPI.getFinancialReport();
          break;
        default:
          response = await adminAPI.getReports();
      }
      
      const data = await response.json();
      console.log('Relatório gerado:', data);
      // Aqui você pode implementar a lógica para exibir ou baixar o relatório
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                <p className="text-sm text-gray-600">Gere e visualize relatórios detalhados do sistema</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="week">Esta Semana</option>
                <option value="month">Este Mês</option>
                <option value="quarter">Este Trimestre</option>
                <option value="year">Este Ano</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">+12.5%</p>
                  <p className="text-sm text-gray-500">Crescimento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">R$ 45.2K</p>
                  <p className="text-sm text-gray-500">Receita</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                  <p className="text-sm text-gray-500">Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Store className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-gray-500">Lojas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reportTypes.map((report) => {
            const IconComponent = report.icon;
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Período:</span>
                      <span className="text-sm font-medium">
                        {selectedPeriod === 'week' && 'Esta Semana'}
                        {selectedPeriod === 'month' && 'Este Mês'}
                        {selectedPeriod === 'quarter' && 'Este Trimestre'}
                        {selectedPeriod === 'year' && 'Este Ano'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Última atualização:</span>
                      <span className="text-sm font-medium">Há 2 horas</span>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 pb-4">
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1 bg-[#3e2626] hover:bg-[#8B4513]"
                      onClick={() => generateReport(report.id)}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Gerar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Recentes</CardTitle>
            <CardDescription>Histórico dos últimos relatórios gerados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#3e2626] rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{report.name}</h3>
                        <p className="text-sm text-gray-600">{report.description}</p>
                        <p className="text-xs text-gray-500">
                          Gerado em {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum relatório gerado</h3>
                  <p className="text-gray-500">Gere seu primeiro relatório usando os cartões acima.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
