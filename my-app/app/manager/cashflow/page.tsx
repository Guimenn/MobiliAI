'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { financialAPI, salesAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CashFlowTransactionModal from '@/components/CashFlowTransactionModal';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  const [allSales, setAllSales] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<CashFlow[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Funções para calcular períodos
  const getPeriodDates = (period: string) => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    switch (period) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this-week':
        start = new Date(now);
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Segunda-feira
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last-30-days':
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last-3-months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last-6-months':
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // Inicializar período com mês atual
  useEffect(() => {
    const { startDate: defaultStart, endDate: defaultEnd } = getPeriodDates(selectedPeriod);
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  }, []);

  // Atualizar datas quando período mudar
  useEffect(() => {
    const { startDate: newStart, endDate: newEnd } = getPeriodDates(selectedPeriod);
    setStartDate(newStart);
    setEndDate(newEnd);
  }, [selectedPeriod]);

  const fetchCashFlowData = async () => {
    if (!isAuthenticated || !user || user.role !== 'STORE_MANAGER') {
      return;
    }

    if (!startDate || !endDate) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Buscar fluxo de caixa
      const cashFlows = await financialAPI.getCashFlow(startDate, endDate);
      setCashFlowData(cashFlows || []);

      // Buscar relatório
      const cashFlowReport = await financialAPI.getCashFlowReport(startDate, endDate);
      console.log('📊 Relatório de Fluxo de Caixa:', cashFlowReport);
      setReport(cashFlowReport);

      // Buscar vendas do período (não apenas as últimas 5 para o gráfico)
      const sales = await salesAPI.getAll(user.storeId);
      
      // Filtrar vendas pelo período selecionado
      const filteredSales = (sales || []).filter((sale: any) => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
        return saleDate >= startDate && saleDate <= endDate;
      });
      
      // Últimas 5 para exibição
      const sortedSales = filteredSales.slice(0, 5).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentSales(sortedSales);
      
      // Armazenar todas as vendas do período para o gráfico
      setAllSales(filteredSales);

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
    if (isAuthenticated && user && user.role === 'STORE_MANAGER' && startDate && endDate) {
      fetchCashFlowData();
    }
  }, [isAuthenticated, user, startDate, endDate]);

  const handleCreateTransaction = async (transactionData: {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    category?: string;
    date?: string;
  }) => {
    try {
      await financialAPI.createCashFlow(transactionData);
      toast.success('Transação criada com sucesso!');
      await fetchCashFlowData();
    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      toast.error('Erro ao criar transação', {
        description: error.response?.data?.message || 'Tente novamente mais tarde'
      });
      throw error;
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

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

  // Calcular receitas incluindo vendas
  const calculateTotalIncome = () => {
    let income = report?.summary ? safeNumber(report.summary.totalIncome) : 0;
    
    // Adicionar vendas do período como receitas
    if (allSales && allSales.length > 0) {
      const salesTotal = allSales.reduce((sum: number, sale: any) => {
        const totalAmount = sale.items?.reduce((s: number, item: any) => {
          const price = safeNumber(item.unitPrice);
          const qty = safeNumber(item.quantity);
          return s + (price * qty);
        }, 0) || safeNumber(sale.totalAmount);
        return sum + totalAmount;
      }, 0);
      income += salesTotal;
    }
    
    return income;
  };

  // Calcular despesas
  const calculateTotalExpenses = () => {
    return report?.summary ? safeNumber(report.summary.totalExpenses) : 0;
  };

  const monthlyIncome = calculateTotalIncome();
  const monthlyExpenses = calculateTotalExpenses();
  const netProfit = monthlyIncome - monthlyExpenses;
  const currentBalance = netProfit;
  const profitMargin = monthlyIncome > 0 ? ((netProfit / monthlyIncome) * 100).toFixed(1) : '0.0';

  // Processar dados para o gráfico
  const processChartData = () => {
    // Agrupar transações por data
    const groupedByDate: Record<string, { income: number; expense: number }> = {};
    
    // Processar transações de fluxo de caixa
    if (cashFlowData && cashFlowData.length > 0) {
      cashFlowData.forEach((cf: CashFlow) => {
        const dateKey = new Date(cf.date || cf.createdAt).toISOString().split('T')[0];
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = { income: 0, expense: 0 };
        }
        
        if (cf.type === 'INCOME') {
          groupedByDate[dateKey].income += safeNumber(cf.amount);
        } else {
          groupedByDate[dateKey].expense += safeNumber(cf.amount);
        }
      });
    }

    // Processar vendas como receitas (usar allSales que contém todas as vendas do período)
    if (allSales && allSales.length > 0) {
      allSales.forEach((sale: any) => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
        if (!groupedByDate[saleDate]) {
          groupedByDate[saleDate] = { income: 0, expense: 0 };
        }
        
        // Calcular total da venda
        const totalAmount = sale.items?.reduce((sum: number, item: any) => {
          const price = safeNumber(item.unitPrice);
          const qty = safeNumber(item.quantity);
          return sum + (price * qty);
        }, 0) || safeNumber(sale.totalAmount);
        
        groupedByDate[saleDate].income += totalAmount;
      });
    }

    // Se não houver dados, retornar array vazio
    if (Object.keys(groupedByDate).length === 0) {
      return [];
    }

    // Converter para array e ordenar por data
    const chartData = Object.entries(groupedByDate)
      .map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dateKey: date,
        receita: values.income,
        despesa: values.expense,
        saldo: values.income - values.expense
      }))
      .sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());

    // Calcular saldo acumulado
    let runningBalance = 0;
    return chartData.map(item => {
      runningBalance += item.saldo;
      return {
        ...item,
        saldoAcumulado: runningBalance
      };
    });
  };

  const chartData = processChartData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#3e2626]">Fluxo de Caixa</h2>
          <p className="text-gray-600 mt-1">Gerencie as entradas e saídas financeiras da loja</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="this-week">Esta Semana</SelectItem>
                <SelectItem value="this-month">Este Mês</SelectItem>
                <SelectItem value="last-30-days">Últimos 30 Dias</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 Meses</SelectItem>
                <SelectItem value="last-6-months">Últimos 6 Meses</SelectItem>
                <SelectItem value="this-year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-[#3e2626] hover:bg-[#5a3a3a]" onClick={() => setIsTransactionModalOpen(true)}>
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

      {/* Cash Flow Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 text-[#3e2626] mr-2" />
            Evolução do Fluxo de Caixa
          </CardTitle>
          <CardDescription>
            Receitas, despesas e saldo acumulado ao longo do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#3e2626]" />
            </div>
          ) : chartData.length === 0 ? (
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
                <p className="text-sm text-gray-400 mt-1">Crie transações para visualizar o gráfico</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(value) => {
                    if (value >= 1000) {
                      return `R$ ${(value / 1000).toFixed(1)}k`;
                    }
                    return `R$ ${value.toFixed(0)}`;
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                  labelStyle={{ color: '#3e2626', fontWeight: 'bold' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  name="Receitas" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="despesa" 
                  name="Despesas" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldoAcumulado" 
                  name="Saldo Acumulado" 
                  stroke="#3e2626" 
                  strokeWidth={3}
                  dot={{ fill: '#3e2626', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal de Nova Transação */}
      <CashFlowTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleCreateTransaction}
        isLoading={isLoading}
      />
    </div>
  );
}

