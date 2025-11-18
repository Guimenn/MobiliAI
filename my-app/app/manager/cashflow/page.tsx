'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { financialAPI, salesAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Wallet,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Calendar,
  Plus,
  CreditCard,
  Receipt,
  DollarSign,
  ShoppingCart,
  Loader2
} from 'lucide-react';

interface CashFlow {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  category?: string;
  date: string;
  createdAt: string;
}

interface CashFlowReport {
  period?: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
  };
  incomeByCategory?: Record<string, number>;
  expensesByCategory?: Record<string, number>;
  cashFlows: CashFlow[];
}

export default function ManagerCashFlowPage() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cashFlowData, setCashFlowData] = useState<CashFlow[]>([]);
  const [report, setReport] = useState<CashFlowReport | null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<CashFlow[]>([]);

  // Calcular período do mês atual
  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const fetchCashFlowData = async () => {
    if (!isAuthenticated || !user || user.role !== 'STORE_MANAGER') {
      return;
    }

    try {
      setIsLoading(true);
      const { startDate, endDate } = getCurrentMonthRange();
      
      // Buscar fluxo de caixa
      const cashFlows = await financialAPI.getCashFlow(startDate, endDate);
      setCashFlowData(cashFlows || []);

      // Buscar relatório
      const cashFlowReport = await financialAPI.getCashFlowReport(startDate, endDate);
      console.log('📊 Relatório de Fluxo de Caixa:', cashFlowReport);
      setReport(cashFlowReport);

      // Buscar vendas recentes (últimas 5)
      const sales = await salesAPI.getAll(user.storeId);
      const sortedSales = (sales || []).slice(0, 5).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentSales(sortedSales);

      // Separar receitas e despesas
      const incomes = (cashFlows || []).filter((cf: CashFlow) => cf.type === 'INCOME');
      const expenses = (cashFlows || []).filter((cf: CashFlow) => cf.type === 'EXPENSE');
      
      setRecentExpenses(expenses.slice(0, 5).sort((a, b) => 
        new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
      ));
    } catch (error: any) {
      console.error('Erro ao buscar dados de fluxo de caixa:', error);
      toast.error('Erro ao carregar dados de fluxo de caixa', {
        description: error.response?.data?.message || 'Tente novamente mais tarde'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && user.role === 'STORE_MANAGER') {
      fetchCashFlowData();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user || user.role !== 'STORE_MANAGER') {
    return null;
  }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const currentBalance = report?.summary ? safeNumber(report.summary.netCashFlow) : 0;
  const monthlyIncome = report?.summary ? safeNumber(report.summary.totalIncome) : 0;
  const monthlyExpenses = report?.summary ? safeNumber(report.summary.totalExpenses) : 0;
  const netProfit = report?.summary ? safeNumber(report.summary.netCashFlow) : 0;
  const profitMargin = monthlyIncome > 0 ? ((netProfit / monthlyIncome) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#3e2626]">Fluxo de Caixa</h2>
          <p className="text-gray-600 mt-1">Gerencie as entradas e saídas financeiras da loja</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Período
          </Button>
          <Button className="bg-[#3e2626] hover:bg-[#5a3a3a]">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Cash Flow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg border-l-4 border-l-[#3e2626]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Saldo Atual</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#3e2626]" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(currentBalance)}
                </div>
                <p className="text-xs text-[#3e2626]/70">Saldo do mês atual</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg border-l-4 border-l-[#3e2626]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Receitas do Mês</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <ArrowUp className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#3e2626]" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</div>
                <p className="text-xs text-[#3e2626]/70">Total de entradas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg border-l-4 border-l-[#3e2626]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Despesas do Mês</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <ArrowDown className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#3e2626]" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(monthlyExpenses)}</div>
                <p className="text-xs text-[#3e2626]/70">Total de saídas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg border-l-4 border-l-[#3e2626]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Lucro Líquido</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#3e2626]" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </div>
                <p className="text-xs text-[#3e2626]/70">Margem: {profitMargin}%</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUp className="h-5 w-5 text-green-500 mr-2" />
              Últimas Receitas
            </CardTitle>
            <CardDescription>Entradas recentes no caixa</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#3e2626]" />
              </div>
            ) : recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale: any) => {
                  const totalAmount = sale.items?.reduce((sum: number, item: any) => {
                    const price = safeNumber(item.unitPrice);
                    const qty = safeNumber(item.quantity);
                    return sum + (price * qty);
                  }, 0) || safeNumber(sale.totalAmount);
                  return (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#3e2626]">
                            Venda #{sale.saleNumber || sale.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-[#3e2626]/70">
                            {sale.customer?.name || 'Cliente não identificado'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{formatCurrency(totalAmount)}</p>
                        <p className="text-xs text-[#3e2626]/70">{formatDate(sale.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma receita recente</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowDown className="h-5 w-5 text-red-500 mr-2" />
              Últimas Despesas
            </CardTitle>
            <CardDescription>Saídas recentes do caixa</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#3e2626]" />
              </div>
            ) : recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          {expense.category === 'SALARY' ? (
                            <DollarSign className="h-4 w-4 text-red-600" />
                          ) : expense.category === 'SUPPLIER' ? (
                            <Receipt className="h-4 w-4 text-red-600" />
                          ) : (
                            <CreditCard className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#3e2626]">{expense.description}</p>
                          <p className="text-xs text-[#3e2626]/70">
                            {expense.category || 'Despesa'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">-{formatCurrency(safeNumber(expense.amount))}</p>
                        <p className="text-xs text-[#3e2626]/70">
                          {formatDate(expense.date || expense.createdAt)}
                        </p>
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma despesa recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart Placeholder */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Fluxo de Caixa - Últimos 30 Dias</CardTitle>
          <CardDescription>Evolução do saldo de caixa ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Gráfico de Fluxo de Caixa</p>
              <p className="text-sm text-gray-400">Integração com biblioteca de gráficos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

