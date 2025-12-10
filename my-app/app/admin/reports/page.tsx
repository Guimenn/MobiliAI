'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Filter,
  FileText,
  FileSpreadsheet
} from 'lucide-react';

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { Loader } from '@/components/ui/ai/loader';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
  const [specificDate, setSpecificDate] = useState<string>('');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  
  // Determinar filterMode automaticamente baseado nas datas
  const filterMode: FilterMode = (specificDate || (dateRangeStart && dateRangeEnd)) ? 'specific' : 'auto';
  // Cache para evitar buscar tudo de novo ao trocar tipo de visualização/filtros
  const [allSalesCache, setAllSalesCache] = useState<any[] | null>(null);
  const [savedReportsCache, setSavedReportsCache] = useState<any[] | null>(null);

  useEffect(() => {
    // Ao trocar tipo de visualização/filtros, reaproveitar dados em cache
    // e apenas recalcular períodos, sem necessariamente refazer todas as requisições.
    loadReportsData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType, filterMode, specificDate, dateRangeStart, dateRangeEnd]);

  // Atualização automática para o dia de hoje no modo diário
  useEffect(() => {
    if (viewType === 'daily' && filterMode === 'auto') {
      // Atualizar a cada 30 segundos para o dia de hoje
      const interval = setInterval(() => {
        // Força recarregar pois podem ter entrado novas vendas
        loadReportsData(true);
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

  const translatePaymentMethod = (method: string): string => {
    const translations: Record<string, string> = {
      'DEBIT_CARD': 'Cartão de Débito',
      'DEBIT': 'Cartão de Débito',
      'CREDIT_CARD': 'Cartão de Crédito',
      'CREDIT': 'Cartão de Crédito',
      'CASH': 'Dinheiro',
      'PIX': 'PIX',
      'BANK_TRANSFER': 'Transferência Bancária',
      'TRANSFER': 'Transferência Bancária',
      'OUTRO': 'Outro',
      'OTHER': 'Outro'
    };
    
    // Tentar tradução direta
    if (translations[method]) {
      return translations[method];
    }
    
    // Se não encontrar, tentar com uppercase
    const upperMethod = method.toUpperCase();
    if (translations[upperMethod]) {
      return translations[upperMethod];
    }
    
    // Se ainda não encontrar, formatar o texto removendo underscores e capitalizando
    return method
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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

  // Utilitário para obter uma data "local" a partir de period/createdAt
  // evitando problemas de timezone com strings no formato YYYY-MM-DD.
  const getReportLocalDate = (report: any): Date => {
    const { period, createdAt } = report || {};

    if (period) {
      if (typeof period === 'string') {
        // Se for apenas data (YYYY-MM-DD), parse manual para manter como data local
        const match = period.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
          const year = Number(match[1]);
          const month = Number(match[2]) - 1;
          const day = Number(match[3]);
          return new Date(year, month, day);
        }
      }

      const d = new Date(period);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    if (createdAt) {
      const d = new Date(createdAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    // Fallback: hoje normalizado
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  // Função helper para parsear string de data YYYY-MM-DD para Date local (evita problemas de timezone)
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Função para agrupar relatórios por período e pegar apenas o mais recente de cada período
  const groupReportsByPeriod = (reports: any[], type: ViewType): any[] => {
    const periodMap = new Map<string, any>();
    
    reports.forEach((report) => {
      const reportDate = getReportLocalDate(report);
      const periodKey = getPeriodKey(reportDate, type);
      
      // Se não existe relatório para este período, ou se este é mais recente, usar este
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, report);
      } else {
        const existingReport = periodMap.get(periodKey);
        const existingDate = getReportLocalDate(existingReport);
        const currentDate = getReportLocalDate(report);
        
        // Se o relatório atual é mais recente, substituir
        if (currentDate > existingDate) {
          periodMap.set(periodKey, report);
        }
      }
    });
    
    return Array.from(periodMap.values());
  };

  // Função para gerar relatório dinamicamente baseado nas vendas do período
  // allSales (opcional) permite reutilizar o resultado de getSales para evitar múltiplas chamadas e melhorar performance
  const generateReportFromSales = async (
    startDate: Date,
    endDate: Date,
    periodKey: string,
    type: ViewType,
    allSales?: any[]
  ): Promise<any> => {
    try {
      // Buscar vendas do período usando a API (ou lista já carregada)
      let periodSales: any[] = [];
      let salesArray: any[] = [];

      try {
        if (allSales && Array.isArray(allSales)) {
          // Reutilizar vendas já carregadas (unificadas de todas as origens)
          salesArray = allSales;
        } else {
          // Fallback: buscar todas as vendas usando o helper compartilhado
          const fetchedFallback = await fetchSalesFallback();
          salesArray = Array.isArray(fetchedFallback) ? fetchedFallback : [];
        }

        // Normalizar datas para comparação por DIA local (evita problemas de timezone)
        const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        periodSales = salesArray.filter((sale: any) => {
          if (!sale || !sale.createdAt) return false;
          const rawSaleDate = new Date(sale.createdAt);
          const saleLocalDate = new Date(
            rawSaleDate.getFullYear(),
            rawSaleDate.getMonth(),
            rawSaleDate.getDate()
          );
          return isDateInRange(saleLocalDate, normalizedStart, normalizedEnd);
        });

        // Se não encontrou vendas, tentar a API específica por data (mantém compatibilidade)
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

      // Processar TODOS os dados a partir das vendas ANTES de criar o relatório
      const salesByPeriodData: any[] = [];
      const topProductsData: any[] = [];
      const storesData: any[] = [];
      const topEmployeesData: any[] = [];
      const paymentMethodsData: any[] = [];
      
      if (periodSales.length > 0) {
        // Agrupar vendas por data ou hora para o gráfico de receita por período
        const salesMap = new Map<string, number>();
        
        if (type === 'daily') {
          // Para visualização diária, agrupar por hora
          periodSales.forEach((sale: any) => {
            const saleDate = new Date(sale.createdAt);
            const hour = saleDate.getHours();
            const hourLabel = `${String(hour).padStart(2, '0')}:00`;
            const amount = sale.totalAmount || sale.total || sale.amount || sale.value || 0;
            const currentRevenue = salesMap.get(hourLabel) || 0;
            salesMap.set(hourLabel, currentRevenue + Number(amount));
          });

          // Converter para array e ordenar por hora
          salesByPeriodData.push(...Array.from(salesMap.entries())
            .map(([hour, revenue]) => ({ date: hour, revenue }))
            .sort((a, b) => {
              const hourA = parseInt(a.date.split(':')[0]);
              const hourB = parseInt(b.date.split(':')[0]);
              return hourA - hourB;
            }));
        } else {
          // Para outros tipos, agrupar por data
          periodSales.forEach((sale: any) => {
            const date = new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const amount = sale.totalAmount || sale.total || sale.amount || sale.value || 0;
            const currentRevenue = salesMap.get(date) || 0;
            salesMap.set(date, currentRevenue + Number(amount));
          });

          // Converter para array e ordenar
          salesByPeriodData.push(...Array.from(salesMap.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => {
              const dateA = a.date.split('/').reverse().join('-');
              const dateB = b.date.split('/').reverse().join('-');
              return new Date(dateA).getTime() - new Date(dateB).getTime();
            })
            .slice(-7)); // Últimos 7 dias
        }

        // Agrupar produtos para o gráfico de top produtos
        const productsMap = new Map<string, { name: string; quantity: number; revenue: number }>();
        periodSales.forEach((sale: any) => {
          sale.items?.forEach((item: any) => {
            const productName = item.product?.name || 'Produto sem nome';
            const itemRevenue = Number(item.totalPrice || item.unitPrice * item.quantity || 0);
            if (productsMap.has(productName)) {
              const current = productsMap.get(productName);
              if (current) {
                productsMap.set(productName, {
                  name: productName,
                  quantity: current.quantity + (item.quantity || 0),
                  revenue: current.revenue + itemRevenue
                });
              }
            } else {
              productsMap.set(productName, {
                name: productName,
                quantity: item.quantity || 0,
                revenue: itemRevenue
              });
            }
          });
        });

        // Converter para array, ordenar por receita e pegar top 5
        topProductsData.push(...Array.from(productsMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5));

        // Agrupar vendas por LOJA
        const storesMap = new Map<string, { 
          id: string; 
          name: string; 
          totalRevenue: number; 
          totalSales: number; 
          totalProfit: number;
        }>();
        periodSales.forEach((sale: any) => {
          const storeId = sale.storeId || sale.store?.id || 'unknown';
          const storeName = sale.store?.name || 'Loja sem nome';
          const amount = sale.totalAmount || sale.total || sale.amount || sale.value || 0;
          
          // Calcular lucro da venda
          let saleProfit = 0;
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item: any) => {
              if (item.profit !== null && item.profit !== undefined) {
                saleProfit += Number(item.profit);
              } else if (item.costPrice !== null && item.costPrice !== undefined && item.unitPrice && item.quantity) {
                const unitPrice = Number(item.unitPrice);
                const costPrice = Number(item.costPrice);
                const quantity = Number(item.quantity);
                saleProfit += (unitPrice - costPrice) * quantity;
              }
            });
          }
          
          if (storesMap.has(storeId)) {
            const current = storesMap.get(storeId)!;
            storesMap.set(storeId, {
              id: storeId,
              name: current.name,
              totalRevenue: current.totalRevenue + Number(amount),
              totalSales: current.totalSales + 1,
              totalProfit: current.totalProfit + saleProfit
            });
          } else {
            storesMap.set(storeId, {
              id: storeId,
              name: storeName,
              totalRevenue: Number(amount),
              totalSales: 1,
              totalProfit: saleProfit
            });
          }
        });

        // Converter stores para array e calcular ticket médio
        storesData.push(...Array.from(storesMap.values()).map(store => ({
          ...store,
          averageTicket: store.totalSales > 0 ? store.totalRevenue / store.totalSales : 0,
          isActive: true
        })).sort((a, b) => b.totalRevenue - a.totalRevenue));

        // Agrupar vendas por VENDEDOR/EMPLOYEE
        const employeesMap = new Map<string, { 
          id: string; 
          name: string; 
          totalRevenue: number; 
          totalSales: number; 
        }>();
        periodSales.forEach((sale: any) => {
          const employeeId = sale.employeeId || sale.employee?.id || 'unknown';
          const employeeName = sale.employee?.name || sale.employeeName || 'Vendedor sem nome';
          const amount = sale.totalAmount || sale.total || sale.amount || sale.value || 0;
          
          if (employeesMap.has(employeeId)) {
            const current = employeesMap.get(employeeId)!;
            employeesMap.set(employeeId, {
              id: employeeId,
              name: current.name,
              totalRevenue: current.totalRevenue + Number(amount),
              totalSales: current.totalSales + 1
            });
          } else {
            employeesMap.set(employeeId, {
              id: employeeId,
              name: employeeName,
              totalRevenue: Number(amount),
              totalSales: 1
            });
          }
        });

        // Converter employees para array e ordenar por receita (top vendedores)
        topEmployeesData.push(...Array.from(employeesMap.values())
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 10)); // Top 10 vendedores

        // Agrupar vendas por MÉTODO DE PAGAMENTO
        const paymentMethodsMap = new Map<string, { 
          method: string; 
          count: number; 
          total: number; 
        }>();
        periodSales.forEach((sale: any) => {
          const method = sale.paymentMethod || sale.payment_method || 'OUTRO';
          const amount = sale.totalAmount || sale.total || sale.amount || sale.value || 0;
          
          if (paymentMethodsMap.has(method)) {
            const current = paymentMethodsMap.get(method)!;
            paymentMethodsMap.set(method, {
              method,
              count: current.count + 1,
              total: current.total + Number(amount)
            });
          } else {
            paymentMethodsMap.set(method, {
              method,
              count: 1,
              total: Number(amount)
            });
          }
        });

        // Converter paymentMethods para array
        paymentMethodsData.push(...Array.from(paymentMethodsMap.values())
          .sort((a, b) => b.total - a.total));
      }

      // Criar relatório virtual
      // Usar a chave do período como data do período (já está no formato correto)
      // Para daily, a chave já é YYYY-MM-DD
      let reportPeriod = periodKey;
      
      // Se não for daily, precisamos extrair a data do startDate
      if (type !== 'daily') {
        const reportDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        reportPeriod = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}-${String(reportDate.getDate()).padStart(2, '0')}`;
      }
      
      // Usar periodKey como ID para garantir unicidade por período
      const virtualReport = {
        id: `virtual-${periodKey}`,
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
            totalStores: storesData.length,
            activeStores: storesData.filter(s => s.isActive).length
          },
          stores: storesData,
          topProducts: topProductsData,
          topEmployees: topEmployeesData,
          paymentMethods: paymentMethodsData,
          charts: {
            salesByPeriod: salesByPeriodData,
            topProductsChart: topProductsData
          },
          sales: periodSales // Incluir vendas para processamento posterior se necessário
        }
      };


      return virtualReport;
    } catch (error) {
      console.error('Erro ao gerar relatório dinamicamente:', error);
      return null;
    }
  };

  const loadReportsData = async (forceReload: boolean = false) => {
    try {
      setIsLoading(true);
      
      // Buscar todos os relatórios, usando cache quando possível
      let baseReports: any[] = [];
      if (!forceReload && savedReportsCache && savedReportsCache.length > 0) {
        baseReports = savedReportsCache;
      } else {
        const savedReports = await adminAPI.getReports();
        baseReports = Array.isArray(savedReports) ? savedReports : [];
        setSavedReportsCache(baseReports);
      }

      const reportsArray = [...baseReports];

      let filteredReports = [...reportsArray];

      // Aplicar filtros
      if (filterMode === 'specific') {
        if (specificDate) {
          // Filtro por data específica
          // Parsear data localmente para evitar problemas de timezone
          const targetDate = parseLocalDate(specificDate);
          targetDate.setHours(0, 0, 0, 0);
          const endDate = new Date(targetDate);
          endDate.setHours(23, 59, 59, 999);
          
          filteredReports = filteredReports.filter((report) => {
            const reportDate = getReportLocalDate(report);
            return isDateInRange(reportDate, targetDate, endDate);
          });
          
          // Se não encontrou relatórios salvos, gerar um relatório virtual para essa data
          if (filteredReports.length === 0) {
            const key = getPeriodKey(targetDate, 'daily');
            try {
              // Carregar vendas apenas uma vez
              const allSales = await fetchSalesFallback();
              const virtualReport = await generateReportFromSales(targetDate, endDate, key, 'daily', allSales);
              if (virtualReport) {
                filteredReports = [virtualReport];
              } else {
                // Criar relatório vazio se não houver vendas
                filteredReports = [{
                  id: `empty-${key}`,
                  name: `Relatório Diário - ${key}`,
                  type: 'daily',
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
                      activeStores: 0,
                    },
                    stores: [],
                    topProducts: [],
                    topEmployees: [],
                    paymentMethods: [],
                    charts: {
                      salesByPeriod: [],
                      topProductsChart: [],
                    },
                  },
                }];
              }
            } catch (error) {
              console.error('Erro ao gerar relatório virtual para data específica:', error);
            }
          }
        } else if (dateRangeStart && dateRangeEnd) {
          // Filtro por período
          // Parsear datas localmente para evitar problemas de timezone
          const start = parseLocalDate(dateRangeStart);
          start.setHours(0, 0, 0, 0);
          const end = parseLocalDate(dateRangeEnd);
          end.setHours(23, 59, 59, 999);
          
          filteredReports = filteredReports.filter((report) => {
            const reportDate = getReportLocalDate(report);
            return isDateInRange(reportDate, start, end);
          });
          
          // Determinar o tipo de agrupamento baseado no intervalo
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          let groupingType: ViewType = 'daily';
          if (diffDays > 365) {
            groupingType = 'yearly';
          } else if (diffDays > 31) {
            groupingType = 'monthly';
          } else if (diffDays > 7) {
            groupingType = 'weekly';
          }
          
          // Sempre gerar um relatório consolidado para o período inteiro
          // Se encontrou relatórios salvos, verificar se algum já cobre o período completo
          let hasConsolidatedReport = false;
          if (filteredReports.length > 0) {
            // Verificar se algum relatório salvo cobre exatamente o período
            for (const report of filteredReports) {
              const reportDate = getReportLocalDate(report);
              const reportPeriodKey = getPeriodKey(reportDate, groupingType);
              const expectedKey = getPeriodKey(start, groupingType);
              if (reportPeriodKey === expectedKey) {
                hasConsolidatedReport = true;
                break;
              }
            }
          }
          
          // Se não encontrou relatório consolidado, gerar um virtual
          if (!hasConsolidatedReport) {
            const key = getPeriodKey(start, groupingType);
            try {
              // Carregar vendas apenas uma vez
              const allSales = await fetchSalesFallback();
              const virtualReport = await generateReportFromSales(start, end, key, groupingType, allSales);
              if (virtualReport) {
                // Substituir os relatórios filtrados pelo consolidado
                filteredReports = [virtualReport];
              } else {
                // Criar relatório vazio se não houver vendas
                filteredReports = [{
                  id: `empty-${key}`,
                  name: `Relatório ${groupingType === 'daily' ? 'Diário' : groupingType === 'weekly' ? 'Semanal' : groupingType === 'monthly' ? 'Mensal' : 'Anual'} - ${key}`,
                  type: groupingType,
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
                      activeStores: 0,
                    },
                    stores: [],
                    topProducts: [],
                    topEmployees: [],
                    paymentMethods: [],
                    charts: {
                      salesByPeriod: [],
                      topProductsChart: [],
                    },
                  },
                }];
              }
            } catch (error) {
              console.error('Erro ao gerar relatório virtual para período:', error);
            }
          } else {
            // Se encontrou relatório consolidado, usar apenas ele
            filteredReports = filteredReports.filter((report) => {
              const reportDate = getReportLocalDate(report);
              const reportPeriodKey = getPeriodKey(reportDate, groupingType);
              const expectedKey = getPeriodKey(start, groupingType);
              return reportPeriodKey === expectedKey;
            });
            // Se houver múltiplos, pegar o mais recente
            if (filteredReports.length > 1) {
              filteredReports = [filteredReports.sort((a, b) => {
                const dateA = getReportLocalDate(a);
                const dateB = getReportLocalDate(b);
                return dateB.getTime() - dateA.getTime();
              })[0]];
            }
          }
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
          const reportDate = getReportLocalDate(report);
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
                const existingDate = getReportLocalDate(existing);
                const currentDate = getReportLocalDate(report);
                if (currentDate > existingDate) {
                  useCurrent = true;
                }
              }
            } catch (error) {
              // Em caso de erro, manter o mais recente usando datas locais
              const existingDate = getReportLocalDate(existing);
              const currentDate = getReportLocalDate(report);
              if (currentDate > existingDate) {
                useCurrent = true;
              }
            }
            
            if (useCurrent) {
              savedReportsByKey.set(periodKey, report);
            }
          }
        });

        // Carregar TODAS as vendas (PDV + online) apenas uma vez para melhorar performance,
        // reutilizando cache sempre que possível.
        let allSalesForAutoMode: any[] | undefined = undefined;
        try {
          if (!forceReload && allSalesCache && allSalesCache.length > 0) {
            allSalesForAutoMode = allSalesCache;
          } else {
            const fetched = await fetchSalesFallback();
            allSalesForAutoMode = Array.isArray(fetched) ? fetched : [];
            setAllSalesCache(allSalesForAutoMode);
          }
        } catch (error) {
          console.error('Erro ao buscar vendas para modo automático:', error);
          allSalesForAutoMode = [];
        }

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
            virtualReport = await generateReportFromSales(start, end, key, viewType, allSalesForAutoMode);
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
            // Se não tem NENHUM relatório (salvo nem virtual), ainda assim
            // queremos manter a sequência de períodos no modo automático.
            // Isso garante que dias/semanas/meses sem vendas apareçam com
            // receita/vendas zeradas na grade de "Relatórios Recentes".
            const emptyReport = {
              id: `empty-${key}`,
              name: `Relatório ${
                viewType === 'daily'
                  ? 'Diário'
                  : viewType === 'weekly'
                    ? 'Semanal'
                    : viewType === 'monthly'
                      ? 'Mensal'
                      : 'Anual'
              } - ${key}`,
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
        
        // Garantir que temos exatamente os períodos esperados na ordem correta
        const orderedReports: any[] = [];
        const addedKeys = new Set<string>();
        
        for (let i = 0; i < expectedPeriodRanges.length; i++) {
          const { key } = expectedPeriodRanges[i];
          const report = finalReportsMap.get(key);
          if (report && !addedKeys.has(key)) {
            orderedReports.push(report);
            addedKeys.add(key);
          }
        }
        
        // Se ainda faltam períodos, adicionar os que estão no map mas não na ordem esperada
        for (const [key, report] of finalReportsMap.entries()) {
          if (!addedKeys.has(key)) {
            orderedReports.push(report);
            addedKeys.add(key);
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
          const dateA = getReportLocalDate(a);
          const dateB = getReportLocalDate(b);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Se há múltiplos relatórios para o mesmo período, agrupar
        if (specificDate || (dateRangeStart && dateRangeEnd)) {
          // Determinar o tipo baseado no intervalo
          let groupingType: ViewType = 'daily';
          if (dateRangeStart && dateRangeEnd) {
            // Parsear datas localmente para evitar problemas de timezone
            const start = parseLocalDate(dateRangeStart);
            const end = parseLocalDate(dateRangeEnd);
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
        const dateA = getReportLocalDate(a);
        const dateB = getReportLocalDate(b);
        return dateB.getTime() - dateA.getTime();
      });

      // Deduplicação final baseada no periodKey para garantir unicidade
      const uniqueReportsMap = new Map<string, any>();
      finalSortedReports.forEach((report) => {
        const reportDate = getReportLocalDate(report);
        const periodKey = getPeriodKey(reportDate, viewType);
        
        // Se já existe um relatório para este período, manter o mais recente
        if (!uniqueReportsMap.has(periodKey)) {
          uniqueReportsMap.set(periodKey, report);
        } else {
          const existingReport = uniqueReportsMap.get(periodKey);
          const existingDate = getReportLocalDate(existingReport);
          const currentDate = getReportLocalDate(report);
          
          if (currentDate > existingDate) {
            uniqueReportsMap.set(periodKey, report);
          }
        }
      });

      // Converter de volta para array e manter a ordem base
      let uniqueReports = Array.from(uniqueReportsMap.values()).sort((a, b) => {
        const dateA = getReportLocalDate(a);
        const dateB = getReportLocalDate(b);
        return dateB.getTime() - dateA.getTime();
      });

      // GARANTIR sempre 7 dias contínuos no modo automático diário,
      // mesmo que não haja vendas/relatórios em alguns dias.
      if (filterMode === 'auto' && viewType === 'daily') {
        const maxReports = getMaxReports('daily');

        // Mapa rápido por chave diária (YYYY-MM-DD)
        const reportsByDayKey = new Map<string, any>();
        uniqueReports.forEach((report) => {
          const reportDate = getReportLocalDate(report);
          const key = getPeriodKey(reportDate, 'daily');
          if (!reportsByDayKey.has(key)) {
            reportsByDayKey.set(key, report);
          }
        });

        // Data local "hoje" normalizada
        const now = new Date();
        const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const filledDailyReports: any[] = [];

        for (let i = 0; i < maxReports; i++) {
          const day = new Date(todayLocal);
          day.setDate(day.getDate() - i);
          const key = getPeriodKey(day, 'daily'); // YYYY-MM-DD

          let reportForDay = reportsByDayKey.get(key);

          // Se não existir relatório para esse dia, criar um "vazio"
          if (!reportForDay) {
            reportForDay = {
              id: `auto-empty-${key}`,
              name: `Relatório Diário - ${key}`,
              type: 'daily',
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
                  activeStores: 0,
                },
                stores: [],
                topProducts: [],
                topEmployees: [],
                paymentMethods: [],
                charts: {
                  salesByPeriod: [],
                  topProductsChart: [],
                },
              },
            };
          }

          filledDailyReports.push(reportForDay);
        }

        // Já está na ordem [hoje, ontem, ...]; se quiser manter a
        // ordenação descendente por data, podemos garantir aqui:
        uniqueReports = filledDailyReports.sort((a, b) => {
          const dateA = getReportLocalDate(a);
          const dateB = getReportLocalDate(b);
          return dateB.getTime() - dateA.getTime();
        });
      }

      setDailyReports(uniqueReports);

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
    // Agrupar vendas por data ou hora dependendo do tipo de visualização
    const salesMap = new Map();
    
    if (viewType === 'daily') {
      // Para visualização diária, agrupar por hora
      sales.forEach(sale => {
        const saleDate = new Date(sale.createdAt);
        const hour = saleDate.getHours();
        const hourLabel = `${String(hour).padStart(2, '0')}:00`;
        const currentRevenue = salesMap.get(hourLabel) || 0;
        salesMap.set(hourLabel, currentRevenue + Number(sale.totalAmount));
      });

      // Converter para array e ordenar por hora
      const sortedSales = Array.from(salesMap.entries())
        .map(([hour, revenue]) => ({ date: hour, revenue }))
        .sort((a, b) => {
          const hourA = parseInt(a.date.split(':')[0]);
          const hourB = parseInt(b.date.split(':')[0]);
          return hourA - hourB;
        });

      setSalesByPeriod(sortedSales);
      return sortedSales;
    } else {
      // Para outros tipos, agrupar por data
      sales.forEach(sale => {
        const date = new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const currentRevenue = salesMap.get(date) || 0;
        salesMap.set(date, currentRevenue + Number(sale.totalAmount));
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
    }
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

    // Processar o relatório de forma síncrona primeiro
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

    const reportData = processedReport.data || {};
    
    // Processar gráficos ANTES de definir currentReport para que apareçam imediatamente
    if (reportData.charts) {
      if (reportData.charts.salesByPeriod && Array.isArray(reportData.charts.salesByPeriod) && reportData.charts.salesByPeriod.length > 0) {
        // Se for visualização diária, sempre reprocessar por hora se houver vendas disponíveis
        if (viewType === 'daily') {
          if (reportData.sales && Array.isArray(reportData.sales) && reportData.sales.length > 0) {
            // Reprocessar por hora para garantir formato correto
            processSalesByPeriod(reportData.sales);
          } else {
            // Se não há vendas, verificar se os dados salvos estão no formato de hora
            const firstItem = reportData.charts.salesByPeriod[0];
            const isHourFormat = firstItem?.date && firstItem.date.includes(':') && !firstItem.date.includes('/');
            if (!isHourFormat) {
              // Se não está no formato de hora, limpar para forçar reprocessamento
              setSalesByPeriod([]);
            } else {
              setSalesByPeriod(reportData.charts.salesByPeriod);
            }
          }
        } else {
          setSalesByPeriod(reportData.charts.salesByPeriod);
        }
      } else {
        setSalesByPeriod([]);
      }
      if (reportData.charts.topProductsChart && Array.isArray(reportData.charts.topProductsChart) && reportData.charts.topProductsChart.length > 0) {
        setTopProducts(reportData.charts.topProductsChart);
      } else if (reportData.topProducts && Array.isArray(reportData.topProducts) && reportData.topProducts.length > 0) {
        // Se não há charts mas há topProducts, usar eles
        setTopProducts(reportData.topProducts);
      } else {
        setTopProducts([]);
      }
    } else if (reportData.sales && Array.isArray(reportData.sales) && reportData.sales.length > 0) {
      // Processar dados de vendas imediatamente se disponíveis
      processSalesByPeriod(reportData.sales);
      processTopProducts(reportData.sales);
    } else {
      // Se for visualização diária e não há vendas, mas há período no relatório, tentar buscar vendas
      if (viewType === 'daily' && processedReport.period) {
        // Tentar buscar vendas do período do relatório de forma assíncrona
        const reportDate = getReportLocalDate(processedReport);
        const dayStart = new Date(reportDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(reportDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        fetchSalesFallback().then((allSales) => {
          const daySales = allSales.filter((sale: any) => {
            if (!sale || !sale.createdAt) return false;
            const saleDate = new Date(sale.createdAt);
            const saleLocalDate = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
            return saleLocalDate.getTime() === reportDate.getTime();
          });
          if (daySales.length > 0) {
            processSalesByPeriod(daySales);
          } else {
            setSalesByPeriod([]);
          }
        }).catch(() => {
          setSalesByPeriod([]);
        });
      } else {
        // Inicializar vazios imediatamente
        setSalesByPeriod([]);
        setTopProducts([]);
      }
    }

    // Definir currentReport DEPOIS de processar os gráficos para que tudo apareça junto
    setCurrentReport(processedReport);

    // Se não há dados de gráficos, tentar buscar de forma assíncrona (sem bloquear)
    if (!reportData.charts && (!reportData.sales || !Array.isArray(reportData.sales) || reportData.sales.length === 0)) {
      // Buscar dados de fallback de forma assíncrona sem bloquear a renderização
      fetchSalesFallback().then((fallbackSales) => {
        if (fallbackSales.length > 0) {
          setSalesData(fallbackSales);
          processSalesByPeriod(fallbackSales);
          processTopProducts(fallbackSales);
        }
      }).catch((error) => {
        console.error('Erro ao buscar vendas para fallback:', error);
      });
    }
  };

  // Helper centralizado para buscar TODAS as vendas (PDV + online) e unificar
  const fetchSalesFallback = async () => {
    try {
      // Buscar vendas de ambas as fontes em paralelo
      const [adminSalesRaw, coreSalesRaw] = await Promise.allSettled([
        adminAPI.getSales(),     // /admin/sales (tipicamente vendas "admin/online")
        salesAPI.getAll(),       // /sales (PDV, caixa, etc.)
      ]);

      const adminSales =
        adminSalesRaw.status === 'fulfilled' && Array.isArray(adminSalesRaw.value)
          ? adminSalesRaw.value
          : [];

      const coreSales =
        coreSalesRaw.status === 'fulfilled' && Array.isArray(coreSalesRaw.value)
          ? coreSalesRaw.value
          : [];

      // Unificar e remover duplicados por id/saleNumber
      const mergedMap = new Map<string, any>();
      const all = [...adminSales, ...coreSales];

      all.forEach((sale: any) => {
        if (!sale) return;
        const key =
          sale.id ||
          sale.saleId ||
          sale.saleNumber ||
          `${sale.storeId || 'store'}-${sale.createdAt || ''}-${sale.totalAmount || sale.total || 0}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, sale);
        }
      });

      return Array.from(mergedMap.values());
    } catch (error) {
      console.error('Erro ao buscar vendas para fallback/unificado:', error);
      return [];
    }
  };

  const handleExportPDF = () => {
    if (!currentReport) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Vendas', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Período
    doc.setFontSize(12);
    doc.text(`Período: ${currentReport.period || 'N/A'}`, 20, yPosition);
    yPosition += 10;

    // Resumo
    const summary = currentReport.data?.summary || {};
    doc.setFontSize(14);
    doc.text('Resumo', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const summaryData = [
      ['Receita Total', `R$ ${Number(summary.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Total de Vendas', summary.totalSales || 0],
      ['Ticket Médio', `R$ ${Number(summary.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Produtos Vendidos', summary.totalProducts || 0],
      ['Clientes Atendidos', summary.totalCustomers || 0]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [62, 38, 38] },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Receita por Loja
    if (currentReport.data?.stores && currentReport.data.stores.length > 0) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Receita por Loja', 20, yPosition);
      yPosition += 10;

      const storeData = currentReport.data.stores.map((store: any) => [
        store.name || store.storeName || 'Loja sem nome',
        store.totalSales || 0,
        `R$ ${Number(store.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${Number(store.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Loja', 'Vendas', 'Receita', 'Ticket Médio']],
        body: storeData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [62, 38, 38] },
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Top Produtos
    if (currentReport.data?.topProducts && currentReport.data.topProducts.length > 0) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Top Produtos', 20, yPosition);
      yPosition += 10;

      const productData = currentReport.data.topProducts.slice(0, 10).map((product: any, idx: number) => {
        const quantity =
          product.totalSold ??
          product.quantity ??
          product.totalQuantity ??
          0;
        const revenue =
          product.totalRevenue ??
          product.revenue ??
          product.totalPrice ??
          0;

        return [
          idx + 1,
          product.name || product.productName || 'Produto sem nome',
          quantity,
          `R$ ${Number(revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Posição', 'Produto', 'Quantidade', 'Receita']],
        body: productData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [62, 38, 38] },
      });
    }

    // Salvar PDF
    const fileName = `relatorio-${currentReport.period || new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleExportExcel = () => {
    if (!currentReport) return;

    const workbook = XLSX.utils.book_new();

    // Resumo
    const summary = currentReport.data?.summary || {};
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Receita Total', `R$ ${Number(summary.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Total de Vendas', summary.totalSales || 0],
      ['Ticket Médio', `R$ ${Number(summary.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Produtos Vendidos', summary.totalProducts || 0],
      ['Clientes Atendidos', summary.totalCustomers || 0]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

    // Receita por Loja
    if (currentReport.data?.stores && currentReport.data.stores.length > 0) {
      const storeData = [
        ['Loja', 'Vendas', 'Receita', 'Ticket Médio']
      ];

      currentReport.data.stores.forEach((store: any) => {
        storeData.push([
          store.name || store.storeName || 'Loja sem nome',
          store.totalSales || 0,
          `R$ ${Number(store.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${Number(store.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);
      });

      const storeSheet = XLSX.utils.aoa_to_sheet(storeData);
      XLSX.utils.book_append_sheet(workbook, storeSheet, 'Lojas');
    }

    // Top Produtos
    if (currentReport.data?.topProducts && currentReport.data.topProducts.length > 0) {
      const productData = [
        ['Posição', 'Produto', 'Quantidade', 'Receita']
      ];

      currentReport.data.topProducts.slice(0, 20).forEach((product: any, idx: number) => {
        const quantity =
          product.totalSold ??
          product.quantity ??
          product.totalQuantity ??
          0;
        const revenue =
          product.totalRevenue ??
          product.revenue ??
          product.totalPrice ??
          0;

        productData.push([
          idx + 1,
          product.name || product.productName || 'Produto sem nome',
          quantity,
          `R$ ${Number(revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);
      });

      const productSheet = XLSX.utils.aoa_to_sheet(productData);
      XLSX.utils.book_append_sheet(workbook, productSheet, 'Top Produtos');
    }

    // Top Vendedores
    if (currentReport.data?.topEmployees && currentReport.data.topEmployees.length > 0) {
      const employeeData = [
        ['Posição', 'Vendedor', 'Vendas', 'Receita']
      ];

      currentReport.data.topEmployees.slice(0, 20).forEach((emp: any, idx: number) => {
        employeeData.push([
          idx + 1,
          emp.name || emp.employeeName || 'Vendedor sem nome',
          emp.totalSales || 0,
          `R$ ${Number(emp.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);
      });

      const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);
      XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Top Vendedores');
    }

    // Salvar Excel
    const fileName = `relatorio-${currentReport.period || new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
      // Não usar setIsLoading aqui para não bloquear a renderização
      // Os dados aparecerão imediatamente quando currentReport for definido
      await hydrateReport(report);
    } catch (error) {
      console.error('Erro ao carregar relatório selecionado:', error);
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    disabled={isLoading}
                    className="gap-2"
                    title="Exportar como PDF"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    onClick={handleExportExcel}
                    variant="outline"
                    disabled={isLoading}
                    className="gap-2"
                    title="Exportar como Excel"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Button>
                
                </div>
              )}
              <Button 
                onClick={handleGenerateDailyReport}
                disabled={isLoading}
                className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white shadow-lg gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
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
              <Loader size={32} className="text-[#3e2626] mx-auto mb-4" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label>Filtro de Data</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDateDialogOpen(true)}
                        className={`justify-start ${filterMode === 'specific' ? 'flex-1' : 'w-full'}`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filterMode === 'specific' 
                          ? (specificDate 
                              ? `Data: ${parseLocalDate(specificDate).toLocaleDateString('pt-BR')}`
                              : dateRangeStart && dateRangeEnd
                                ? `${parseLocalDate(dateRangeStart).toLocaleDateString('pt-BR')} - ${parseLocalDate(dateRangeEnd).toLocaleDateString('pt-BR')}`
                                : 'Definir data específica')
                          : 'Definir data específica'}
                      </Button>
                      {filterMode === 'specific' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSpecificDate('');
                            setDateRangeStart('');
                            setDateRangeEnd('');
                          }}
                          className="text-red-600 hover:text-red-700 whitespace-nowrap"
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dialog para seleção de data/período */}
            <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Definir Data Específica</DialogTitle>
                  <DialogDescription>
                    Escolha uma data específica ou um período para filtrar os relatórios
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialogSpecificDate">Data Específica</Label>
                      <Input
                        id="dialogSpecificDate"
                        type="date"
                        value={specificDate}
                        onChange={(e) => {
                          setSpecificDate(e.target.value);
                          if (e.target.value) {
                            setDateRangeStart('');
                            setDateRangeEnd('');
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        Selecione uma data única para ver o relatório desse dia
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Ou
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Período</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dialogDateRangeStart" className="text-sm">Data Inicial</Label>
                          <Input
                            id="dialogDateRangeStart"
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
                        <div className="space-y-2">
                          <Label htmlFor="dialogDateRangeEnd" className="text-sm">Data Final</Label>
                          <Input
                            id="dialogDateRangeEnd"
                            type="date"
                            value={dateRangeEnd}
                            onChange={(e) => {
                              setDateRangeEnd(e.target.value);
                              if (e.target.value) {
                                setSpecificDate('');
                              }
                            }}
                            min={dateRangeStart}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Selecione um período para ver relatórios de um intervalo de datas
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSpecificDate('');
                      setDateRangeStart('');
                      setDateRangeEnd('');
                      setIsDateDialogOpen(false);
                    }}
                  >
                    Limpar
                  </Button>
                  <Button
                    onClick={() => setIsDateDialogOpen(false)}
                    className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white"
                  >
                    Aplicar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                      ? `Relatórios da data: ${parseLocalDate(specificDate).toLocaleDateString('pt-BR')}`
                      : dateRangeStart && dateRangeEnd
                        ? `Relatórios do período: ${parseLocalDate(dateRangeStart).toLocaleDateString('pt-BR')} até ${parseLocalDate(dateRangeEnd).toLocaleDateString('pt-BR')}`
                        : 'Acesse os relatórios filtrados'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-10 flex flex-col items-center justify-center gap-3">
                    <Loader size={28} className="text-[#3e2626]" />
                    <p className="text-sm text-gray-500">Atualizando relatórios...</p>
                  </div>
                ) : dailyReports.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dailyReports.map((report) => {
                      const summary = getReportSummary(report);
                      const reportDate = getReportLocalDate(report);
                      const reportPeriodKey = getPeriodKey(reportDate, viewType);
                      
                      // Comparar por periodKey e id para garantir que o relatório correto está ativo
                      const currentReportPeriodKey = currentReport 
                        ? getPeriodKey(getReportLocalDate(currentReport), viewType)
                        : null;
                      const isActive = currentReport && (
                        currentReport.id === report.id || 
                        (currentReportPeriodKey === reportPeriodKey && currentReport.period === report.period)
                      );
                      
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
                        // No modo específico, se for um período (dateRangeStart e dateRangeEnd), mostrar o período completo
                        if (dateRangeStart && dateRangeEnd) {
                          const startDate = parseLocalDate(dateRangeStart);
                          const endDate = parseLocalDate(dateRangeEnd);
                          periodType = 'período';
                          periodLabel = `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                        } else if (specificDate) {
                          // Se for data específica, mostrar apenas a data
                          const reportType = report.type || 'daily';
                          periodType = reportType === 'daily' ? 'diário' : reportType === 'weekly' ? 'semanal' : reportType === 'monthly' ? 'mensal' : 'anual';
                          periodLabel = reportDate.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                        } else {
                          // Fallback: determinar o tipo baseado na data do relatório
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
                      }
                      
                      // Usar periodKey como key para garantir unicidade por período
                      // Combinar periodKey com id para garantir unicidade absoluta
                      const uniqueKey = `${reportPeriodKey}-${report.id}`;
                      return (
                        <div
                          key={uniqueKey}
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
                            ? `Não há relatórios para a data ${parseLocalDate(specificDate).toLocaleDateString('pt-BR')}. Tente selecionar outra data ou período.`
                            : dateRangeStart && dateRangeEnd
                              ? `Não há relatórios para o período de ${parseLocalDate(dateRangeStart).toLocaleDateString('pt-BR')} até ${parseLocalDate(dateRangeEnd).toLocaleDateString('pt-BR')}. Tente selecionar outro período.`
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
            {currentReport && !isLoading && (() => {
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
            {currentReport && !isLoading && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">Receita por Período</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    {viewType === 'daily' 
                      ? 'Receita por hora do dia'
                      : 'Últimos 7 dias de receita'}
                  </CardDescription>
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
                          label={{ value: viewType === 'daily' ? 'Hora' : 'Data', position: 'insideBottom', offset: -5 }}
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
                          labelFormatter={(label) => {
                            if (viewType === 'daily') {
                              // Se o label já está no formato de hora (contém ':'), usar diretamente
                              if (label && label.includes(':') && !label.includes('/')) {
                                return `Hora: ${label}`;
                              }
                              // Caso contrário, tentar formatar como hora
                              return `Hora: ${label}`;
                            }
                            return `Data: ${label}`;
                          }}
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
                        data={currentReport.data.stores.map((store: any) => {
                          const storeName = store.name || store.storeName || 'Loja sem nome';
                          return {
                            name: storeName.length > 15 ? storeName.substring(0, 15) + '...' : storeName,
                            receita: Number(store.totalRevenue || 0),
                            vendas: store.totalSales || 0,
                            ticketMedio: Number(store.averageTicket || 0)
                          };
                        })}
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
                        data={currentReport.data.stores.map((store: any) => {
                          const storeName = store.name || store.storeName || 'Loja sem nome';
                          return {
                            name: storeName.length > 15 ? storeName.substring(0, 15) + '...' : storeName,
                            ticketMedio: Number(store.averageTicket || 0),
                            receita: Number(store.totalRevenue || 0),
                            vendas: store.totalSales || 0
                          };
                        })}
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
            )}

            {/* Métricas de Pagamento */}
            {currentReport && !isLoading && currentReport.data?.paymentMethods && currentReport.data.paymentMethods.length > 0 && (
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
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          {translatePaymentMethod(pm.method)}
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
            {currentReport && !isLoading && currentReport.data?.stores && currentReport.data.stores.length > 0 && (
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
                                    <div className="font-medium text-gray-900">{store.name || store.storeName || 'Loja sem nome'}</div>
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
            {!isLoading && (
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
                            <p className="text-sm font-medium text-gray-900 truncate">{emp.name || emp.employeeName || 'Vendedor sem nome'}</p>
                            <p className="text-xs text-gray-500 truncate">{emp.storeName || ''}</p>
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
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name || product.productName || 'Produto sem nome'}</p>
                            <p className="text-xs text-gray-500">Qtd: {product.quantity || 0}</p>
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
            )}

            {/* Métricas de Presença e Clientes */}
            {!isLoading && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
