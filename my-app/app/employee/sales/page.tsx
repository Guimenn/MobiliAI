'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { salesAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function EmployeeSalesPage() {
  const { user } = useAppStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    if (!user?.storeId) return;
    
    try {
      setIsLoading(true);
      const salesData = await salesAPI.getAll(user.storeId);
      setSales(salesData);
      
      // Filtrar vendas de hoje
      const today = new Date().toISOString().split('T')[0];
      const todayFiltered = salesData.filter((sale: Sale) => 
        sale.createdAt.startsWith(today)
      );
      setTodaySales(todayFiltered);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Garantir que os valores sejam números válidos
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const numValue = safeNumber(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const getPaymentMethodBadge = (method: string) => {
    const badges: Record<string, string> = {
      'PIX': 'bg-green-100 text-green-800 border-green-200',
      'CASH': 'bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/30',
      'CREDIT_CARD': 'bg-blue-100 text-blue-800 border-blue-200',
      'DEBIT_CARD': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return badges[method] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const totalRevenue = todaySales.reduce((sum, sale) => sum + safeNumber(sale.totalAmount), 0);
  const avgTicket = todaySales.length > 0 ? totalRevenue / todaySales.length : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#3e2626] shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Total de Vendas</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3e2626]">{sales.length}</div>
            <p className="text-xs text-[#3e2626]/70">todas as vendas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#3e2626] shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Vendas Hoje</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3e2626]">{todaySales.length}</div>
            <p className="text-xs text-[#3e2626]/70">vendas do dia</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#3e2626] shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Faturamento</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3e2626]">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-[#3e2626]/70">receita de hoje</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#3e2626] shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Ticket Médio</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3e2626]">{formatCurrency(avgTicket)}</div>
            <p className="text-xs text-[#3e2626]/70">por venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales History */}
      <Card className="bg-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#3e2626]">Vendas de Hoje</CardTitle>
          <CardDescription className="text-[#3e2626]/70">Histórico de vendas do dia atual</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#3e2626] mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando vendas...</p>
              </div>
            </div>
          ) : todaySales.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma venda hoje</h3>
              <p className="text-gray-600">Suas vendas aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border border-[#3e2626]/10 rounded-lg hover:border-[#3e2626]/30 hover:bg-[#3e2626]/5 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-[#3e2626]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#3e2626]">Venda #{sale.saleNumber}</h3>
                      <p className="text-sm text-[#3e2626]/70">
                        {new Date(sale.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-[#3e2626]">{formatCurrency(sale.totalAmount)}</p>
                    <Badge className={`${getPaymentMethodBadge(sale.paymentMethod)} border text-xs font-medium`}>
                      {sale.paymentMethod}
                    </Badge>
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
