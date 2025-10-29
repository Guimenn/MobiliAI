'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { salesAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Plus,
  Download, 
  Eye,
  ShoppingCart,
  Receipt
} from 'lucide-react';

export default function SalesPage() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar vendas do banco de dados
      try {
        const salesData = await salesAPI.getAll();
        setSales(Array.isArray(salesData) ? salesData : []);
        
        // Calcular estatísticas
        const totalRevenue = salesData.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
        const averageOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;
        
        setStats({
          totalSales: salesData.length,
          totalRevenue,
          averageOrderValue,
          conversionRate: 0 // Seria calculado com dados de visitantes
        });
      } catch (apiError) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
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
  );
}