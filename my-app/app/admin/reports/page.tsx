'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminAPI, salesAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { 
  DollarSign, 
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  BarChart,
  Download,
  RefreshCw,
  Calendar,
  Store,
  CreditCard,
  Clock,
  Trophy,
  Activity,
  Loader2,
  Filter
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3e2626', '#6b4e3d', '#8b6f47', '#a67c52', '#c49a6a'];

type ViewType = 'daily' | 'weekly' | 'monthly' | 'yearly';
type FilterMode = 'auto' | 'specific';

export default function ReportsPage() {
  const { token } = useAppStore();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentReport, setCurrentReport] = useState<any | null>(null);
  const [salesByPeriod, setSalesByPeriod] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [filterMode, setFilterMode] = useState<FilterMode>('auto');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

  useEffect(() => {
    loadReportsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType, filterMode, specificDate, dateRangeStart, dateRangeEnd]);

  // Atualização automática para o dia de hoje no modo diário
  useEffect(() => {
    if (viewType === 'daily' && filterMode === 'auto') {
      // Atualizar a cada 30 segundos para o dia de hoje
      const interval = setInterval(() => {
        loadReportsData();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType, filterMode]);

  // Funções auxiliares para calcular períodos
  const getPeriodStartDate = (type: ViewType, index: number): Date => {
    // Usar data local para evitar problemas de timezone
    const now = new Date();
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case 'daily':
        const day = new Date(localDate);
        day.setDate(day.getDate() - index);
        return day;
      case 'weekly':
        const week = new Date(localDate);
        week.setDate(week.getDate() - (index * 7));
        // Começar na segunda-feira da semana
        const dayOfWeek = week.getDay();
        const diff = week.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        week.setDate(diff);
        return week;
      case 'monthly':
        const month = new Date(localDate);
        month.setMonth(month.getMonth() - index);
        month.setDate(1);
        return month;
      case 'yearly':
        const year = new Date(localDate);
        year.setFullYear(year.getFullYear() - index);
        year.setMonth(0, 1);
        return year;
    }
  };

  const getPeriodEndDate = (type: ViewType, index: number): Date => {
    const start = getPeriodStartDate(type, index);
    const end = new Date(start);
    
    switch (type) {
      case 'daily':
        // Para o dia de hoje (índice 0), usar a hora atual para atualização em tempo real
        if (index === 0) {
          return new Date(); // Hora atual
        }
        end.setHours(23, 59, 59, 999);
        return end;
      case 'weekly':
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return end;
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        return end;
      case 'yearly':
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        return end;
    }
  };

  const formatPeriodLabel = (type: ViewType, periodStart: Date, periodEnd: Date): string => {
    switch (type) {
      case 'daily':
        return periodStart.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      case 'weekly':
        return `${periodStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${periodEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      case 'monthly':
        return periodStart.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric'
        });
      case 'yearly':
        return periodStart.getFullYear().toString();
    }
  };

  const getMaxReports = (type: ViewType): number => {
    switch (type) {
      case 'daily': return 7;
      case 'weekly': return 4;
      case 'monthly': return 12;
      case 'yearly': return 6;
    }
  };

  const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
    return date >= start && date <= end;
  };

  // Função para obter a chave única do período baseado no tipo
  const getPeriodKey = (reportDate: Date, type: ViewType): string => {
    // Criar uma cópia da data e normalizar para meia-noite local
    const date = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
    
    switch (type) {
      case 'daily':
        // Chave: YYYY-MM-DD
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'weekly':
        // Chave: YYYY-MM-DD (data de início da semana - segunda-feira)
        const weekStart = new Date(date);
        const dayOfWeek = weekStart.getDay();
        const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        weekStart.setDate(diff);
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      case 'monthly':
        // Chave: YYYY-MM
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'yearly':
        // Chave: YYYY
        return `${date.getFullYear()}`;
    }
  };

  // Função para agrupar relatórios por período e pegar apenas o mais recente de cada período
  const groupReportsByPeriod = (reports: any[], type: ViewType): any[] => {
    const periodMap = new Map<string, any>();
    
    reports.forEach((report) => {
      const reportDate = new Date(report.period || report.createdAt);
      const periodKey = getPeriodKey(reportDate, type);
      
      // Se não existe relatório para este período, ou se este é mais recente, usar este
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, report);
      } else {
        const existingReport = periodMap.get(periodKey);
        const existingDate = new Date(existingReport.period || existingReport.createdAt);
        const currentDate = new Date(report.period || report.createdAt);
        
        // Se o relatório atual é mais recente, substituir
        if (currentDate > existingDate) {
          periodMap.set(periodKey, report);
        }
      }
    });
    
    return Array.from(periodMap.values());
  };

  // Função para gerar relatório dinamicamente baseado nas vendas do período
  const generateReportFromSales = async (startDate: Date, endDate: Date, periodKey: string, type: ViewType): Promise<any> => {
    try {
      // Buscar vendas do período usando a API
      let periodSales: any[] = [];
      
      // Sempre tentar buscar todas as vendas primeiro como fallback mais confiável
      try {
        const allSales = await adminAPI.getSales();
        const salesArray = Array.isArray(allSales) ? allSales : [];
        
        // Filtrar vendas do período
        periodSales = salesArray.filter((sale: any) => {
          if (!sale || !sale.createdAt) return false;
          const saleDate = new Date(sale.createdAt);
          return isDateInRange(saleDate, startDate, endDate);
        });
        
        // Se não encontrou vendas, tentar a API específica por data
        if (periodSales.length === 0) {
          try {
            const startDateStr = startDate.toISOString();
            const endDateStr = endDate.toISOString();
            const apiSales = await salesAPI.getByDateRange(startDateStr, endDateStr);
            if (Array.isArray(apiSales) && apiSales.length > 0) {
              periodSales = apiSales;
            }
          } catch (apiError) {
            // Ignorar erro da API específica, já temos o fallback
            console.warn('Erro ao buscar vendas por API específica:', apiError);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        periodSales = [];
      }

      // Verificar se é o dia de hoje usando data local
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const periodStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      
      const isToday = type === 'daily' && periodStart.getTime() === today.getTime();
      
      
      // Para o dia de hoje, sempre retornar um relatório mesmo sem vendas
      // Para outros períodos, retornar null se não houver vendas
      if (periodSales.length === 0 && !isToday) {
        return null;
      }

      // Calcular métricas
      const totalRevenue = periodSales.reduce((sum: number, sale: any) => {
        // Tentar diferentes campos possíveis para o valor total
        const amount = sale.totalAmount || sale.total || sale.amount || sale.value || 0;
        return sum + Number(amount || 0);
      }, 0);
      const totalSales = periodSales.length;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Calcular lucro total
      let totalProfit = 0;
      periodSales.forEach((sale: any) => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach((item: any) => {
            if (item.profit !== null && item.profit !== undefined) {
              totalProfit += Number(item.profit);
            } else if (item.costPrice !== null && item.costPrice !== undefined && item.unitPrice && item.quantity) {
              const unitPrice = Number(item.unitPrice);
              const costPrice = Number(item.costPrice);
              const quantity = Number(item.quantity);
              totalProfit += (unitPrice - costPrice) * quantity;
            }
          });
        }
      });

      // Criar relatório virtual
      // Usar a chave do período como data do período (já está no formato correto)
      // Para daily, a chave já é YYYY-MM-DD
      let reportPeriod = periodKey;
      
      // Se não for daily, precisamos extrair a data do startDate
      if (type !== 'daily') {
        const reportDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        reportPeriod = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}-${String(reportDate.getDate()).padStart(2, '0')}`;
      }
      
      const virtualReport = {
        id: `virtual-${periodKey}-${Date.now()}`,
        name: `Relatório ${type === 'daily' ? 'Diário' : type === 'weekly' ? 'Semanal' : type === 'monthly' ? 'Mensal' : 'Anual'} - ${periodKey}`,
        type: type,
        period: reportPeriod,
        status: 'completed',
        createdAt: new Date().toISOString(),
        data: {
          summary: {
            totalRevenue,
            totalSales,
            totalProfit,
            averageTicket,
            totalStores: 0,
            activeStores: 0
          },
          stores: [],
          topProducts: [],
          topEmployees: [],
          paymentMethods: [],
          charts: {
            salesByPeriod: [],
            topProductsChart: []
          }
        }
      };


      return virtualReport;
    } catch (error) {
      console.error('Erro ao gerar relatório dinamicamente:', error);
      return null;
    }
  };

  const loadReportsData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar todos os relatórios
      const savedReports = await adminAPI.getReports();
      const reportsArray = Array.isArray(savedReports) ? savedReports : [];

      let filteredReports = [...reportsArray];

      // Aplicar filtros
      if (filterMode === 'specific') {
        if (specificDate) {
          // Filtro por data específica
          const targetDate = new Date(specificDate);
          targetDate.setHours(0, 0, 0, 0);
          const endDate = new Date(targetDate);
          endDate.setHours(23, 59, 59, 999);
          
          filteredReports = filteredReports.filter((report) => {
            const reportDate = new Date(report.period || report.createdAt);
            reportDate.setHours(0, 0, 0, 0);
            return isDateInRange(reportDate, targetDate, endDate);
          });
        } else if (dateRangeStart && dateRangeEnd) {
          // Filtro por período
          const start = new Date(dateRangeStart);
          start.setHours(0, 0, 0, 0);
          const end = new Date(dateRangeEnd);
          end.setHours(23, 59, 59, 999);
          
          filteredReports = filteredReports.filter((report) => {
            const reportDate = new Date(report.period || report.createdAt);
            return isDateInRange(reportDate, start, end);
          });
        } else {
          // Se não há filtro específico, não mostrar nada
          filteredReports = [];
        }
      } else {
        // Modo automático - gerar relatórios para os períodos esperados
        const maxReports = getMaxReports(viewType);
        
        // Criar lista de períodos esperados
        const expectedPeriodRanges: { start: Date; end: Date; key: string }[] = [];
        
        for (let i = 0; i < maxReports; i++) {
          const start = getPeriodStartDate(viewType, i);
          const end = getPeriodEndDate(viewType, i);
          const key = getPeriodKey(start, viewType);
          expectedPeriodRanges.push({ start, end, key });
        }
        
        // Agrupar TODOS os relatórios salvos por período (eliminar duplicatas)
        // Para cada período, manter apenas o relatório com maior receita
        const savedReportsByKey = new Map<string, any>();
        filteredReports.forEach(report => {
          const reportDate = new Date(report.period || report.createdAt);
          const periodKey = getPeriodKey(reportDate, viewType);
          
          if (!savedReportsByKey.has(periodKey)) {
            savedReportsByKey.set(periodKey, report);
          } else {
            const existing = savedReportsByKey.get(periodKey);
            
            // Comparar receitas para manter o melhor relatório
            let existingRevenue = 0;
            let currentRevenue = 0;
            let useCurrent = false;
            
            try {
              const existingData = typeof existing.data === 'string' 
                ? JSON.parse(existing.data) 
                : existing.data || {};
              const existingSummary = existingData?.summary || calculateSummaryFromData(existing) || {};
              existingRevenue = Number(existingSummary.totalRevenue || 0);
              
              const currentData = typeof report.data === 'string' 
                ? JSON.parse(report.data) 
                : report.data || {};
              const currentSummary = currentData?.summary || calculateSummaryFromData(report) || {};
              currentRevenue = Number(currentSummary.totalRevenue || 0);
              
              // Se a receita é maior, usar o atual
              if (currentRevenue > existingRevenue) {
                useCurrent = true;
              } else if (currentRevenue === existingRevenue) {
                // Se a receita é igual, manter o mais recente
                const existingDate = new Date(existing.period || existing.createdAt);
                const currentDate = new Date(report.period || report.createdAt);
                if (currentDate > existingDate) {
                  useCurrent = true;
                }
              }
            } catch (error) {
              // Em caso de erro, manter o mais recente
              const existingDate = new Date(existing.period || existing.createdAt);
              const currentDate = new Date(report.period || report.createdAt);
              if (currentDate > existingDate) {
                useCurrent = true;
              }
            }
            
            if (useCurrent) {
              savedReportsByKey.set(periodKey, report);
            }
          }
        });

        // Gerar relatórios para cada período esperado (em ordem sequencial)
        // Garantir que cada período tenha exatamente UM relatório
        const finalReportsMap = new Map<string, any>();
        
        for (let i = 0; i < expectedPeriodRanges.length; i++) {
          const { start, end, key } = expectedPeriodRanges[i];
          const isToday = viewType === 'daily' && i === 0;
          
          // Buscar relatório salvo para este período pela chave exata
          let savedReport = savedReportsByKey.get(key);
          let savedReportKey = key;
          
          // Se não encontrou pela chave exata, tentar encontrar por range
          if (!savedReport) {
            for (const [savedKey, savedReportItem] of savedReportsByKey.entries()) {
              const reportDateStr = savedReportItem.period || savedReportItem.createdAt;
              const reportDate = new Date(reportDateStr);
              const normalizedReportDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
              const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
              const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
              
              if (normalizedReportDate >= normalizedStart && normalizedReportDate <= normalizedEnd) {
                savedReport = savedReportItem;
                savedReportKey = savedKey;
                break;
              }
            }
          }
          
          // Remover da lista para evitar duplicatas (se encontrou)
          if (savedReport) {
            savedReportsByKey.delete(savedReportKey);
          }
          
          // Sempre gerar relatório virtual para garantir dados atualizados
          // Especialmente para o dia de hoje
          let virtualReport: any = null;
          try {
            virtualReport = await generateReportFromSales(start, end, key, viewType);
          } catch (error) {
            console.error(`Erro ao gerar relatório virtual para período ${key}:`, error);
          }
          
          // Decidir qual relatório usar
          if (virtualReport && savedReport) {
            // Comparar receitas
            try {
              const savedData = typeof savedReport.data === 'string' 
                ? JSON.parse(savedReport.data) 
                : savedReport.data || {};
              const savedSummary = savedData?.summary || calculateSummaryFromData(savedReport) || {};
              const savedRevenue = Number(savedSummary.totalRevenue || 0);
              
              const virtualData = typeof virtualReport.data === 'string' 
                ? JSON.parse(virtualReport.data) 
                : virtualReport.data || {};
              const virtualSummary = virtualData?.summary || calculateSummaryFromData(virtualReport) || {};
              const virtualRevenue = Number(virtualSummary.totalRevenue || 0);
              
              // Usar o que tem maior receita, ou virtual se for hoje
              if (isToday || virtualRevenue >= savedRevenue) {
                finalReportsMap.set(key, virtualReport);
              } else {
                finalReportsMap.set(key, savedReport);
              }
            } catch (error) {
              // Em caso de erro, preferir virtual
              finalReportsMap.set(key, virtualReport || savedReport);
            }
          } else if (virtualReport) {
            finalReportsMap.set(key, virtualReport);
          } else if (savedReport) {
            finalReportsMap.set(key, savedReport);
          } else {
            // Se não tem nenhum relatório, criar um relatório vazio para manter a sequência
            // Mas apenas se for o dia de hoje ou se houver necessidade de mostrar todos os períodos
            if (isToday) {
              // Para o dia de hoje, sempre criar um relatório mesmo sem dados
              const emptyReport = {
                id: `empty-${key}-${Date.now()}`,
                name: `Relatório ${viewType === 'daily' ? 'Diário' : viewType === 'weekly' ? 'Semanal' : viewType === 'monthly' ? 'Mensal' : 'Anual'} - ${key}`,
                type: viewType,
                period: key,
                status: 'completed',
                createdAt: new Date().toISOString(),
                data: {
                  summary: {
                    totalRevenue: 0,
                    totalSales: 0,
                    totalProfit: 0,
                    averageTicket: 0,
                    totalStores: 0,
                    activeStores: 0
                  },
                  stores: [],
                  topProducts: [],
                  topEmployees: [],
                  paymentMethods: [],
                  charts: {
                    salesByPeriod: [],
                    topProductsChart: []
                  }
                }
              };
              finalReportsMap.set(key, emptyReport);
            }
          }
        }
        
        // Garantir que temos exatamente os períodos esperados na ordem correta
        const orderedReports: any[] = [];
        for (let i = 0; i < expectedPeriodRanges.length; i++) {
          const { key } = expectedPeriodRanges[i];
          const report = finalReportsMap.get(key);
          if (report) {
            orderedReports.push(report);
          }
        }
        
        // Se ainda faltam períodos, adicionar os que estão no map mas não na ordem esperada
        for (const [key, report] of finalReportsMap.entries()) {
          if (!orderedReports.find(r => getPeriodKey(new Date(r.period || r.createdAt), viewType) === key)) {
            orderedReports.push(report);
          }
        }
        
        // Ordenar por data (mais recente primeiro)
        filteredReports = orderedReports.sort((a, b) => {
          const dateA = new Date(a.period || a.createdAt);
          const dateB = new Date(b.period || b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      }

      // Para modo específico, também ordenar e agrupar se necessário
      if (filterMode === 'specific') {
      // Ordenar por data (mais recente primeiro)
        filteredReports = filteredReports.sort((a, b) => {
          const dateA = new Date(a.period || a.createdAt);
          const dateB = new Date(b.period || b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Se há múltiplos relatórios para o mesmo período, agrupar
        if (specificDate || (dateRangeStart && dateRangeEnd)) {
          // Determinar o tipo baseado no intervalo
          let groupingType: ViewType = 'daily';
          if (dateRangeStart && dateRangeEnd) {
            const start = new Date(dateRangeStart);
            const end = new Date(dateRangeEnd);
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 365) {
              groupingType = 'yearly';
            } else if (diffDays > 31) {
              groupingType = 'monthly';
            } else if (diffDays > 7) {
              groupingType = 'weekly';
            }
          }
          filteredReports = groupReportsByPeriod(filteredReports, groupingType);
        }
      }

      const processedReports = filteredReports.map((report) => {
        if (typeof report.data === 'string') {
          try {
            return { ...report, data: JSON.parse(report.data) };
          } catch {
            return report;
          }
        }
        return report;
      });

      // Ordenação final por data do período (mais recente primeiro)
      const finalSortedReports = processedReports.sort((a, b) => {
        const dateA = new Date(a.period || a.createdAt);
        const dateB = new Date(b.period || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setDailyReports(finalSortedReports);

      // Atualizar o relatório atual
      if (finalSortedReports.length > 0) {
        // Se há relatórios filtrados, verificar se o atual ainda está na lista
        if (currentReport) {
          const stillExists = finalSortedReports.some(r => r.id === currentReport.id);
          if (!stillExists) {
            // Se o relatório atual não está mais na lista, carregar o mais recente
            await hydrateReport(finalSortedReports[0]);
          }
        } else {
          // Se não há relatório atual, carregar o mais recente
          await hydrateReport(finalSortedReports[0]);
        }
      } else {
        // Se não há relatórios filtrados, limpar o relatório atual apenas se estiver no modo específico
        // No modo automático, manter o relatório atual se existir
        if (filterMode === 'specific') {
          setCurrentReport(null);
          setSalesByPeriod([]);
          setTopProducts([]);
        } else if (!currentReport) {
          // Se não há relatório atual e não há relatórios, limpar tudo
        setCurrentReport(null);
        setSalesByPeriod([]);
        setTopProducts([]);
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processSalesByPeriod = (sales: any[]) => {
    // Agrupar vendas por data
    const salesMap = new Map();
    
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (salesMap.has(date)) {
        salesMap.set(date, salesMap.get(date) + Number(sale.totalAmount));
      } else {
        salesMap.set(date, Number(sale.totalAmount));
      }
    });

    // Converter para array e ordenar por data
    const sortedSales = Array.from(salesMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      })
      .slice(-7); // Últimos 7 dias

    setSalesByPeriod(sortedSales);
    return sortedSales;
  };

  const processTopProducts = (sales: any[]) => {
    // Agrupar produtos vendidos
    const productsMap = new Map();
    
    sales.forEach(sale => {
      sale.items?.forEach((item: any) => {
        const productName = item.product?.name || 'Produto sem nome';
        if (productsMap.has(productName)) {
          const current = productsMap.get(productName);
          productsMap.set(productName, {
            name: productName,
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + Number(item.totalPrice)
          });
        } else {
          productsMap.set(productName, {
            name: productName,
            quantity: item.quantity,
            revenue: Number(item.totalPrice)
          });
        }
      });
    });

    // Converter para array, ordenar por receita e pegar top 5
    const sortedProducts = Array.from(productsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopProducts(sortedProducts);
    return sortedProducts;
  };

  const calculateSummaryFromData = (report: any) => {
    if (!report) return null;
    
    // Parsear data se for string JSON
    let reportData = report.data;
    if (typeof reportData === 'string') {
      try {
        reportData = JSON.parse(reportData);
      } catch (e) {
        console.error('Erro ao parsear dados do relatório:', e);
        return null;
      }
    }
    
    if (!reportData) return null;

    // Calcular a partir das lojas se o summary estiver vazio
    const stores = reportData.stores || [];
    const totalRevenue = stores.reduce((sum: number, store: any) => 
      sum + Number(store.totalRevenue || 0), 0
    );
    const totalSales = stores.reduce((sum: number, store: any) => 
      sum + Number(store.totalSales || 0), 0
    );
    const totalProfit = stores.reduce((sum: number, store: any) => 
      sum + Number(store.totalProfit || 0), 0
    );
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const activeStores = stores.filter((s: any) => s.isActive !== false).length;
    const totalStores = stores.length;

    // Se o summary existir e tiver valores, usar ele, senão usar os calculados
    const summary = reportData.summary || {};
    
    // Sempre usar os valores calculados se o summary estiver zerado ou não existir
    const useCalculated = !summary.totalRevenue || summary.totalRevenue === 0;
    
    return {
      totalRevenue: useCalculated ? totalRevenue : (summary.totalRevenue || 0),
      totalSales: useCalculated ? totalSales : (summary.totalSales || 0),
      totalProfit: useCalculated ? totalProfit : (summary.totalProfit || 0),
      averageTicket: useCalculated ? averageTicket : (summary.averageTicket || 0),
      totalStores: summary.totalStores || totalStores,
      activeStores: useCalculated ? activeStores : (summary.activeStores || activeStores)
    };
  };

  const hydrateReport = async (report: any) => {
    if (!report) return;

    const processedReport = { ...report };

    if (typeof processedReport.data === 'string') {
      try {
        processedReport.data = JSON.parse(processedReport.data);
      } catch (e) {
        console.error('Erro ao parsear dados do relatório:', e);
        processedReport.data = {};
      }
    }

    const calculatedSummary = calculateSummaryFromData(processedReport);
    if (calculatedSummary) {
      processedReport.data = processedReport.data || {};
      processedReport.data.summary = {
        ...(processedReport.data.summary || {}),
        ...calculatedSummary,
      };
    }

    setCurrentReport(processedReport);

    const reportData = processedReport.data || {};
    if (reportData.charts) {
      if (reportData.charts.salesByPeriod && Array.isArray(reportData.charts.salesByPeriod)) {
        setSalesByPeriod(reportData.charts.salesByPeriod);
      }
      if (reportData.charts.topProductsChart && Array.isArray(reportData.charts.topProductsChart)) {
        setTopProducts(reportData.charts.topProductsChart);
      }
    } else {
      const fallbackSales = reportData.sales
        ? (Array.isArray(reportData.sales) ? reportData.sales : [])
        : await fetchSalesFallback();
      setSalesData(fallbackSales);
      processSalesByPeriod(fallbackSales);
      processTopProducts(fallbackSales);
    }
  };

  const fetchSalesFallback = async () => {
    try {
      const sales = await adminAPI.getSales();
      return Array.isArray(sales) ? sales : [];
    } catch (error) {
      console.error('Erro ao buscar vendas para fallback:', error);
      return [];
    }
  };

  const handleDownloadReport = () => {
    if (!currentReport) return;
    
    const dataStr = JSON.stringify(currentReport.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-completo-${currentReport.period || new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateDailyReport = async () => {
    try {
      setIsLoading(true);
      const report = await adminAPI.generateDailyReport();
      
      if (report) {
        await hydrateReport(report);
        await loadReportsData();
      }
    } catch (error) {
      console.error('Erro ao gerar relatório diário:', error);
      alert('Erro ao gerar relatório diário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReport = async (report: any) => {
    try {
      setIsLoading(true);
      await hydrateReport(report);
    } catch (error) {
      console.error('Erro ao carregar relatório selecionado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getReportSummary = (report: any) => {
    const summary = report?.data?.summary;
    if (summary) return summary;
    return calculateSummaryFromData(report) || {};
  };

    return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Relatório Completo</h1>
              <p className="mt-2 text-sm text-gray-600">
                {currentReport ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(currentReport.period || currentReport.createdAt).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-500">
                      Gerado em {new Date(currentReport.createdAt).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </>
                ) : (
                  'Nenhum relatório disponível'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentReport && (
                <Button 
                  onClick={handleDownloadReport}
                  variant="outline"
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              )}
              <Button 
                onClick={handleGenerateDailyReport}
                disabled={isLoading}
                className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white shadow-lg gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Atualizar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {isLoading && !currentReport ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#3e2626] mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Gerando relatório completo...</p>
              <p className="text-sm text-gray-500 mt-1">Aguarde enquanto os dados são processados</p>
            </div>
          </div>
        ) : !currentReport ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-20 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum relatório disponível</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Clique no botão acima para gerar um relatório completo do dia.</p>
              <Button 
                onClick={handleGenerateDailyReport}
                className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white gap-2"
              >
                <Calendar className="h-4 w-4" />
                Gerar Relatório Agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Filtros */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros de Relatórios
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Escolha o tipo de visualização e período desejado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="viewType">Tipo de Visualização</Label>
                    <Select value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
                      <SelectTrigger id="viewType">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário (últimos 7 dias)</SelectItem>
                        <SelectItem value="weekly">Semanal (últimas 4 semanas)</SelectItem>
                        <SelectItem value="monthly">Mensal (últimos 12 meses)</SelectItem>
                        <SelectItem value="yearly">Anual (últimos 6 anos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filterMode">Modo de Filtro</Label>
                    <Select value={filterMode} onValueChange={(value) => {
                      setFilterMode(value as FilterMode);
                      if (value === 'auto') {
                        setSpecificDate('');
                        setDateRangeStart('');
                        setDateRangeEnd('');
                      }
                    }}>
                      <SelectTrigger id="filterMode">
                        <SelectValue placeholder="Selecione o modo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automático</SelectItem>
                        <SelectItem value="specific">Data/Período Específico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filterMode === 'specific' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="specificDate">Data Específica</Label>
                        <Input
                          id="specificDate"
                          type="date"
                          value={specificDate}
                          onChange={(e) => {
                            setSpecificDate(e.target.value);
                            if (e.target.value) {
                              setDateRangeStart('');
                              setDateRangeEnd('');
                            }
                          }}
                          placeholder="Selecione uma data"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Período (ou deixe a data acima vazia)</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="dateRangeStart" className="text-xs">De</Label>
                            <Input
                              id="dateRangeStart"
                              type="date"
                              value={dateRangeStart}
                              onChange={(e) => {
                                setDateRangeStart(e.target.value);
                                if (e.target.value) {
                                  setSpecificDate('');
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dateRangeEnd" className="text-xs">Até</Label>
                            <Input
                              id="dateRangeEnd"
                              type="date"
                              value={dateRangeEnd}
                              onChange={(e) => {
                                setDateRangeEnd(e.target.value);
                                if (e.target.value) {
                                  setSpecificDate('');
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  {filterMode === 'auto' 
                    ? `Relatórios ${viewType === 'daily' ? 'Diários' : viewType === 'weekly' ? 'Semanais' : viewType === 'monthly' ? 'Mensais' : 'Anuais'} Recentes`
                    : 'Relatórios Filtrados'
                  }
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  {filterMode === 'auto'
                    ? `Acesse rapidamente os relatórios gerados nos últimos ${getMaxReports(viewType)} ${viewType === 'daily' ? 'dias' : viewType === 'weekly' ? 'semanas' : viewType === 'monthly' ? 'meses' : 'anos'}`
                    : specificDate 
                      ? `Relatórios da data: ${new Date(specificDate).toLocaleDateString('pt-BR')}`
                      : dateRangeStart && dateRangeEnd
                        ? `Relatórios do período: ${new Date(dateRangeStart).toLocaleDateString('pt-BR')} até ${new Date(dateRangeEnd).toLocaleDateString('pt-BR')}`
                        : 'Acesse os relatórios filtrados'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dailyReports.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dailyReports.map((report) => {
                      const summary = getReportSummary(report);
                      const isActive = currentReport?.id === report.id;
                      const reportDate = new Date(report.period || report.createdAt);
                      
                      // Determinar o período para exibição baseado no tipo selecionado
                      let periodLabel = '';
                      let periodType = '';
                      
                      if (filterMode === 'auto') {
                        // No modo automático, usar o viewType selecionado
                        periodType = viewType === 'daily' ? 'diário' : viewType === 'weekly' ? 'semanal' : viewType === 'monthly' ? 'mensal' : 'anual';
                        
                      if (viewType === 'daily') {
                        periodLabel = reportDate.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        });
                      } else if (viewType === 'weekly') {
                        const weekStart = new Date(reportDate);
                        const dayOfWeek = weekStart.getDay();
                        const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                        weekStart.setDate(diff);
                          weekStart.setHours(0, 0, 0, 0);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                          weekEnd.setHours(23, 59, 59, 999);
                        periodLabel = `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                      } else if (viewType === 'monthly') {
                          const monthStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
                          periodLabel = monthStart.toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric'
                        });
                      } else if (viewType === 'yearly') {
                          periodLabel = reportDate.getFullYear().toString();
                        }
                      } else {
                        // No modo específico, determinar o tipo baseado na data do relatório
                        // Verificar se é diário, semanal, mensal ou anual
                        const reportType = report.type || 'daily';
                        periodType = reportType === 'daily' ? 'diário' : reportType === 'weekly' ? 'semanal' : reportType === 'monthly' ? 'mensal' : 'anual';
                        
                        if (reportType === 'daily') {
                          periodLabel = reportDate.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                        } else if (reportType === 'weekly') {
                          const weekStart = new Date(reportDate);
                          const dayOfWeek = weekStart.getDay();
                          const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                          weekStart.setDate(diff);
                          weekStart.setHours(0, 0, 0, 0);
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekEnd.getDate() + 6);
                          weekEnd.setHours(23, 59, 59, 999);
                          periodLabel = `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                        } else if (reportType === 'monthly') {
                          const monthStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
                          periodLabel = monthStart.toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric'
                          });
                        } else if (reportType === 'yearly') {
                        periodLabel = reportDate.getFullYear().toString();
                      } else {
                        periodLabel = reportDate.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        });
                        }
                      }
                      
                      return (
                        <div
                          key={report.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'border-[#3e2626] bg-[#3e2626]/5 shadow-md'
                              : 'border-gray-200 bg-white hover:border-[#3e2626]/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {periodLabel}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {periodType}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(report.createdAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="mt-4 space-y-1">
                            <p className="text-sm text-gray-600">Receita</p>
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {Number(summary.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {summary.totalSales || 0} vendas • Ticket médio:{' '}
                              R$ {Number(summary.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleSelectReport(report)}
                            variant={isActive ? 'default' : 'outline'}
                            className={`mt-4 w-full ${isActive ? 'bg-[#3e2626] hover:bg-[#2d1c1c]' : 'border-[#3e2626] text-[#3e2626]'}`}
                          >
                            {isActive ? 'Visualizando' : 'Ver relatório'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum relatório encontrado
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                      {filterMode === 'specific' 
                        ? (specificDate 
                            ? `Não há relatórios para a data ${new Date(specificDate).toLocaleDateString('pt-BR')}. Tente selecionar outra data ou período.`
                            : dateRangeStart && dateRangeEnd
                              ? `Não há relatórios para o período de ${new Date(dateRangeStart).toLocaleDateString('pt-BR')} até ${new Date(dateRangeEnd).toLocaleDateString('pt-BR')}. Tente selecionar outro período.`
                              : 'Selecione uma data específica ou um período para filtrar os relatórios.')
                        : `Não há relatórios ${viewType === 'daily' ? 'diários' : viewType === 'weekly' ? 'semanais' : viewType === 'monthly' ? 'mensais' : 'anuais'} disponíveis nos últimos ${getMaxReports(viewType)} ${viewType === 'daily' ? 'dias' : viewType === 'weekly' ? 'semanas' : viewType === 'monthly' ? 'meses' : 'anos'}.`
                      }
                    </p>
                    {filterMode === 'auto' && (
                      <Button 
                        onClick={handleGenerateDailyReport}
                        className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Gerar Relatório Agora
                      </Button>
                    )}
                  </div>
                )}
                </CardContent>
              </Card>

            {/* Cards de Resumo Geral - Estilo Horizon */}
            {(() => {
              // Calcular summary se não existir ou estiver vazio
              const summary = currentReport.data?.summary || calculateSummaryFromData(currentReport) || {};
              
              return (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-gray-900">
                        R$ {Number(summary.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-amber-700" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-gray-900">
                        {summary.totalSales || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-[#3e2626]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-gray-900">
                        R$ {Number(summary.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Lojas Ativas</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Store className="h-5 w-5 text-orange-700" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-gray-900">
                        {summary.activeStores || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Lucro Total</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-gray-900">
                        R$ {Number(summary.totalProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Gráficos Modernos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">Receita por Período</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Últimos 7 dias de receita</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesByPeriod.length === 0 ? (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-400">Nenhum dado disponível</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={salesByPeriod}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          label={{ value: 'Data', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          label={{ value: 'Receita (R$)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                          labelFormatter={(label) => `Data: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3e2626" 
                          strokeWidth={3}
                          dot={{ fill: '#3e2626', r: 5 }}
                          activeDot={{ r: 7 }}
                          name="Receita"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">Top 5 Produtos</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Ranking por receita gerada</CardDescription>
                </CardHeader>
                <CardContent>
                  {topProducts.length === 0 ? (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-400">Nenhum dado disponível</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          type="number" 
                          stroke="#6b7280" 
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          label={{ value: 'Receita (R$)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={140}
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                          }}
                          formatter={(value: any, name: string, props: any) => [
                            `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            `Receita • Qtd: ${props.payload.quantity}`
                          ]}
                          labelFormatter={(label) => `Produto: ${label}`}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="#3e2626"
                          radius={[0, 8, 8, 0]}
                          name="Receita"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Receita por Loja */}
              {currentReport.data?.stores && currentReport.data.stores.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Receita por Loja</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Comparativo de receita entre lojas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart 
                        data={currentReport.data.stores.map((store: any) => ({
                          name: store.storeName.length > 15 ? store.storeName.substring(0, 15) + '...' : store.storeName,
                          receita: Number(store.totalRevenue),
                          vendas: store.totalSales,
                          ticketMedio: Number(store.averageTicket)
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          type="number" 
                          stroke="#6b7280" 
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          label={{ value: 'Receita (R$)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={140}
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                          }}
                          formatter={(value: any, name: string, props: any) => {
                            const data = props.payload;
                            return [
                              `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                              `Receita • ${data.vendas} vendas • Ticket: R$ ${Number(data.ticketMedio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            ];
                          }}
                          labelFormatter={(label) => `Loja: ${label}`}
                        />
                        <Bar 
                          dataKey="receita" 
                          fill="#3e2626"
                          radius={[0, 8, 8, 0]}
                          name="Receita"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Ticket Médio por Loja */}
              {currentReport.data?.stores && currentReport.data.stores.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Ticket Médio por Loja</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Comparativo de ticket médio entre lojas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart 
                        data={currentReport.data.stores.map((store: any) => ({
                          name: store.storeName.length > 15 ? store.storeName.substring(0, 15) + '...' : store.storeName,
                          ticketMedio: Number(store.averageTicket),
                          receita: Number(store.totalRevenue),
                          vendas: store.totalSales
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          type="number" 
                          stroke="#6b7280" 
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                          label={{ value: 'Ticket Médio (R$)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={140}
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                          }}
                          formatter={(value: any, name: string, props: any) => {
                            const data = props.payload;
                            return [
                              `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                              `Ticket Médio • Receita: R$ ${Number(data.receita).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • ${data.vendas} vendas`
                            ];
                          }}
                          labelFormatter={(label) => `Loja: ${label}`}
                        />
                        <Bar 
                          dataKey="ticketMedio" 
                          fill="#8b6f47"
                          radius={[0, 8, 8, 0]}
                          name="Ticket Médio"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Métricas de Pagamento */}
            {currentReport.data?.paymentMethods && currentReport.data.paymentMethods.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">Métodos de Pagamento</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Distribuição por método</CardDescription>
          </CardHeader>
          <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {currentReport.data.paymentMethods.map((pm: any, idx: number) => (
                      <div 
                        key={pm.method} 
                        className="p-4 bg-white rounded-lg border border-gray-100"
                      >
                        <p className="text-xs font-medium text-gray-600 mb-2 uppercase">
                          {pm.method.replace('_', ' ')}
                        </p>
                        <p className="text-xl font-semibold text-gray-900 mb-1">{pm.count}</p>
                        <p className="text-sm font-medium text-emerald-600">
                          R$ {Number(pm.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
          </CardContent>
        </Card>
                    )}

                    {/* Performance por Loja */}
            {currentReport.data?.stores && currentReport.data.stores.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">Performance por Loja</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Comparativo de vendas e receita</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendas</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Médio</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentReport.data.stores.map((store: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/30">
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{store.storeName}</div>
                                  </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{store.totalSales}</div>
                                  </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                R$ {Number(store.totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                                  </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                R$ {Number(store.averageTicket).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                                  </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                store.hasCashOpen 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {store.hasCashOpen ? 'Aberto' : 'Fechado'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                </CardContent>
              </Card>
                    )}

            {/* Top Vendedores e Produtos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Top Vendedores */}
              {currentReport.data?.topEmployees && currentReport.data.topEmployees.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Top Vendedores</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Ranking por receita</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentReport.data.topEmployees.slice(0, 5).map((emp: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
                        >
                          <div className="flex-shrink-0 w-8">
                            {idx === 0 && <span className="text-xl">🥇</span>}
                            {idx === 1 && <span className="text-xl">🥈</span>}
                            {idx === 2 && <span className="text-xl">🥉</span>}
                            {idx > 2 && <span className="text-sm text-gray-500">{idx + 1}º</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{emp.employeeName}</p>
                            <p className="text-xs text-gray-500 truncate">{emp.storeName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              R$ {Number(emp.totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                                    </div>
                        </div>
                      ))}
                      </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Produtos */}
              {currentReport.data?.topProducts && currentReport.data.topProducts.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Top Produtos</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Mais vendidos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentReport.data.topProducts.slice(0, 5).map((product: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
                        >
                          <div className="flex-shrink-0 w-8">
                            {idx === 0 && <span className="text-xl">🥇</span>}
                            {idx === 1 && <span className="text-xl">🥈</span>}
                            {idx === 2 && <span className="text-xl">🥉</span>}
                            {idx > 2 && <span className="text-sm text-gray-500">{idx + 1}º</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
                            <p className="text-xs text-gray-500">Qtd: {product.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              R$ {Number(product.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Métricas de Presença e Clientes */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Métricas de Presença */}
              {currentReport.data?.attendance && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Métricas de Presença</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Análise de presença e pontualidade</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Presentes</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentReport.data.attendance.totalEmployees || 0}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Atrasos</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentReport.data.attendance.totalLates || 0}</p>
                                    </div>
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Horas Extras</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentReport.data.attendance.totalOvertime || 0}</p>
                        </div>
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Média de Horas</p>
                        <p className="text-2xl font-semibold text-gray-900">{Number(currentReport.data.attendance.averageHours || 0).toFixed(1)}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                    )}

                    {/* Análise de Clientes */}
              {currentReport.data?.customers && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Análise de Clientes</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Métricas de clientes únicos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Clientes Únicos</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentReport.data.customers.total || 0}</p>
                          </div>
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Novos Clientes</p>
                        <p className="text-2xl font-semibold text-emerald-600">{currentReport.data.customers.newCustomers || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
