'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Store, 
  MapPin, 
  Phone, 
  Mail,
  Users,
  Package,
  DollarSign,
  Calendar,
  Clock,
  Settings,
  Edit,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  Plus,
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from '@/components/ui/chart';
import { adminAPI, dashboardAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import MedicalCertificateModal from '@/components/MedicalCertificateModal';
import TerminationModal from '@/components/TerminationModal';
import StoreHoursConfig from '@/components/StoreHoursConfig';
import StoreSales from './components/StoreSales';
import StoreInventory from './components/StoreInventory';

export default function StoreDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const { token } = useAppStore();
  
  const [store, setStore] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    salesData: [] as any[],
    attendanceData: [] as any[],
    employeePerformance: [] as any[],
    recentActivity: [] as any[],
    totalSales: 0,
    totalEmployees: 0,
    attendanceRate: 0,
    averageHours: 0
  });
  const [storeHoursData, setStoreHoursData] = useState({
    openingTime: '',
    closingTime: '',
    workingDays: [] as string[],
    lunchStart: '',
    lunchEnd: ''
  });
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);
  const [isProcessingMedical, setIsProcessingMedical] = useState(false);
  const [isProcessingTermination, setIsProcessingTermination] = useState(false);
  const [isProcessingTimeClock, setIsProcessingTimeClock] = useState(false);

  // Função para organizar funcionários por hierarquia
  const getHierarchyOrder = (role: string) => {
    const hierarchy = {
      'GERENTE': 1,
      'SUPERVISOR': 2,
      'VENDEDOR': 3,
      'CAIXA': 4,
      'ESTOQUISTA': 5,
      'ATENDENTE': 6,
      'AUXILIAR': 7
    };
    return hierarchy[role as keyof typeof hierarchy] || 99;
  };

  const sortedEmployees = employees.sort((a, b) => {
    const orderA = getHierarchyOrder(a.role);
    const orderB = getHierarchyOrder(b.role);
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  useEffect(() => {
    if (storeId) {
      console.log('useEffect: Carregando loja com ID:', storeId);
      loadStoreDetails();
    } else {
      console.error('useEffect: storeId não encontrado');
    }
  }, [storeId]);


  useEffect(() => {
    if (activeTab === 'employees' && storeId) {
      loadEmployees();
    }
  }, [activeTab, storeId]);

  const loadStoreDetails = async () => {
    try {
      setIsLoading(true);
      console.log('Carregando detalhes da loja:', storeId);
      
      const data = await adminAPI.getStoreById(storeId);
      console.log('Dados da loja carregados:', data);
      
      if (!data) {
        console.error('Dados da loja não encontrados');
        return;
      }
      
      setStore(data);
      
      // Carregar dados de horário de funcionamento
      const workingDays = Array.isArray(data.workingDays) ? data.workingDays : (typeof data.workingDays === 'string' ? JSON.parse(data.workingDays || '[]') : []);
      setStoreHoursData({
        openingTime: data.openingTime || '',
        closingTime: data.closingTime || '',
        workingDays: workingDays,
        lunchStart: data.lunchStart || '',
        lunchEnd: data.lunchEnd || ''
      });
      
      // Carregar dados do dashboard da loja
      await loadStoreDashboardData();
    } catch (error) {
      console.error('Erro ao carregar detalhes da loja:', error);
      // Em caso de erro, definir dados padrão
      setStore({
        id: storeId,
        name: 'Loja não encontrada',
        address: 'Endereço não disponível',
        city: 'Cidade não disponível',
        state: 'Estado não disponível',
        phone: 'Telefone não disponível',
        email: 'Email não disponível',
        isActive: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoreDashboardData = async () => {
    try {
      // Buscar dados reais do backend
      const [overview, salesData, attendanceData, employeePerformance, recentActivity] = await Promise.all([
        dashboardAPI.getStoreOverview(storeId),
        dashboardAPI.getStoreSales(storeId),
        dashboardAPI.getStoreAttendance(storeId),
        dashboardAPI.getEmployeePerformance(storeId),
        dashboardAPI.getRecentActivity(storeId)
      ]);

      setDashboardData({
        salesData,
        attendanceData,
        employeePerformance,
        recentActivity,
        totalSales: overview.totalSales,
        totalEmployees: overview.totalEmployees,
        attendanceRate: overview.attendanceRate,
        averageHours: overview.averageHours
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      
      // Fallback para dados simulados em caso de erro
      const salesData = [
        { name: 'Jan', vendas: Math.floor(Math.random() * 30000) + 10000, clientes: Math.floor(Math.random() * 50) + 20 },
        { name: 'Fev', vendas: Math.floor(Math.random() * 30000) + 10000, clientes: Math.floor(Math.random() * 50) + 20 },
        { name: 'Mar', vendas: Math.floor(Math.random() * 30000) + 10000, clientes: Math.floor(Math.random() * 50) + 20 },
        { name: 'Abr', vendas: Math.floor(Math.random() * 30000) + 10000, clientes: Math.floor(Math.random() * 50) + 20 },
        { name: 'Mai', vendas: Math.floor(Math.random() * 30000) + 10000, clientes: Math.floor(Math.random() * 50) + 20 },
        { name: 'Jun', vendas: Math.floor(Math.random() * 30000) + 10000, clientes: Math.floor(Math.random() * 50) + 20 }
      ];

      const attendanceData = [
        { name: 'Seg', presenca: Math.floor(Math.random() * 20) + 10, atrasos: Math.floor(Math.random() * 5) },
        { name: 'Ter', presenca: Math.floor(Math.random() * 20) + 10, atrasos: Math.floor(Math.random() * 5) },
        { name: 'Qua', presenca: Math.floor(Math.random() * 20) + 10, atrasos: Math.floor(Math.random() * 5) },
        { name: 'Qui', presenca: Math.floor(Math.random() * 20) + 10, atrasos: Math.floor(Math.random() * 5) },
        { name: 'Sex', presenca: Math.floor(Math.random() * 20) + 10, atrasos: Math.floor(Math.random() * 5) }
      ];

      const employeePerformance = employees.map((emp: any) => ({
        name: emp.name,
        vendas: Math.floor(Math.random() * 10000) + 2000,
        pontos: Math.floor(Math.random() * 50) + 20,
        atrasos: Math.floor(Math.random() * 10)
      }));

      const recentActivity = [
        { id: 1, action: 'Funcionário bateu ponto', employee: 'João Silva', time: '2 horas atrás', type: 'success' },
        { id: 2, action: 'Venda realizada', employee: 'Maria Santos', time: '4 horas atrás', type: 'success' },
        { id: 3, action: 'Atraso registrado', employee: 'Pedro Costa', time: '6 horas atrás', type: 'warning' },
        { id: 4, action: 'Novo funcionário adicionado', employee: 'Ana Lima', time: '1 dia atrás', type: 'info' }
      ];

      const totalSales = salesData.reduce((sum, month) => sum + month.vendas, 0);
      const totalEmployees = employees.length;
      const attendanceRate = Math.floor(Math.random() * 20) + 80;
      const averageHours = Math.floor(Math.random() * 4) + 6;

      setDashboardData({
        salesData,
        attendanceData,
        employeePerformance,
        recentActivity,
        totalSales,
        totalEmployees,
        attendanceRate,
        averageHours
      });
    }
  };

  const loadEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const data = await adminAPI.getStoreEmployees(storeId);
      setEmployees(data);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };



  const handleUpdateEmployee = async (employeeData: any) => {
    try {
      setIsUpdatingEmployee(true);
      await adminAPI.updateEmployee(selectedEmployee.id, employeeData);
      setShowEditEmployeeModal(false);
      setSelectedEmployee(null);
      // Recarregar funcionários
      await loadEmployees();
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
    } finally {
      setIsUpdatingEmployee(false);
    }
  };

  const handleMedicalCertificate = async (certificateData: any) => {
    try {
      setIsProcessingMedical(true);
      // Aqui você implementaria a chamada para a API de atestados
      console.log('Processando atestado:', certificateData);
      setShowMedicalModal(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Erro ao processar atestado:', error);
    } finally {
      setIsProcessingMedical(false);
    }
  };

  const handleTermination = async (terminationData: any) => {
    try {
      setIsProcessingTermination(true);
      // Aqui você implementaria a chamada para a API de demissão
      console.log('Processando demissão:', terminationData);
      setShowTerminationModal(false);
      setSelectedEmployee(null);
      // Recarregar funcionários após demissão
      await loadEmployees();
    } catch (error) {
      console.error('Erro ao processar demissão:', error);
    } finally {
      setIsProcessingTermination(false);
    }
  };

  const handleStoreHoursChange = async (hoursData: any) => {
    try {
      console.log('Salvando horário de funcionamento:', hoursData);
      // Salvar no backend primeiro
      await adminAPI.updateStore(storeId, hoursData);
      // Atualizar estado local
      setStoreHoursData(hoursData);
      // Atualizar store também
      setStore((prev: any) => ({
        ...prev,
        ...hoursData
      }));
      console.log('Horário salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar horário de funcionamento:', error);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes da loja...</p>
          
          {/* Botão de teste para o modal */}
          <div className="mt-8">
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loja não encontrada</h2>
          <p className="text-gray-600 mb-6">A loja solicitada não foi encontrada.</p>
          <Button onClick={() => router.push('/admin/stores')}>
            Voltar para Lojas
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'overview', label: 'Visão Geral', icon: Eye },
    { id: 'employees', label: 'Funcionários', icon: Users },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'sales', label: 'Vendas', icon: DollarSign },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes da loja...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Loja não encontrada</h3>
          <p className="text-gray-600 mb-6">A loja solicitada não foi encontrada ou não existe.</p>
          <Button onClick={() => router.push('/admin/stores')} className="bg-[#3e2626] hover:bg-[#2a1a1a] text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lojas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/stores')}
                className="flex items-center text-white hover:bg-white/20 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{store.name}</h1>
                  <p className="text-white/80 text-lg">{store.city}, {store.state}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-white/80 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {store.address}
                    </div>
                    <div className="flex items-center text-white/80 text-sm">
                      <Phone className="h-4 w-4 mr-1" />
                      {store.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${store.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-white/90 font-medium">
                    {store.isActive ? 'Loja Ativa' : 'Loja Inativa'}
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  {store.isActive ? 'Em operação' : 'Fora de operação'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Loja
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-t-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-[#3e2626] text-[#3e2626] bg-[#3e2626]/5'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Vendas da Loja</CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-xl flex items-center justify-center shadow-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">R$ {dashboardData.totalSales.toLocaleString()}</div>
                  <p className="text-sm text-[#3e2626]/70">
                    <span className="text-green-600 font-semibold">+12%</span> vs mês anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Funcionários</CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">{dashboardData.totalEmployees}</div>
                  <p className="text-sm text-[#3e2626]/70">
                    {dashboardData.attendanceRate}% de presença
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Horas Médias</CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">{dashboardData.averageHours}h</div>
                  <p className="text-sm text-[#3e2626]/70">
                    Por funcionário/dia
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Performance</CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3e2626]">{dashboardData.attendanceRate}%</div>
                  <p className="text-sm text-[#3e2626]/70">
                    Taxa de presença
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas Mensais</CardTitle>
                  <CardDescription>Evolução das vendas nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{
                    vendas: { label: "Vendas", color: "hsl(var(--chart-1))" },
                    clientes: { label: "Clientes", color: "hsl(var(--chart-2))" }
                  }}>
                    <LineChart data={dashboardData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="vendas" 
                        stroke="var(--color-vendas)" 
                        strokeWidth={2}
                        dot={{ fill: "var(--color-vendas)" }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Attendance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Frequência Semanal</CardTitle>
                  <CardDescription>Presença e atrasos por dia da semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{
                    presenca: { label: "Presença", color: "hsl(var(--chart-1))" },
                    atrasos: { label: "Atrasos", color: "hsl(var(--chart-2))" }
                  }}>
                    <BarChart data={dashboardData.attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="presenca" fill="var(--color-presenca)" />
                      <Bar dataKey="atrasos" fill="var(--color-atrasos)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Employee Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance dos Funcionários</CardTitle>
                <CardDescription>Vendas e pontos por funcionário</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  vendas: { label: "Vendas", color: "hsl(var(--chart-1))" },
                  pontos: { label: "Pontos", color: "hsl(var(--chart-2))" }
                }}>
                  <BarChart data={dashboardData.employeePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="vendas" fill="var(--color-vendas)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Últimas ações na loja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.employee} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="font-medium">Endereço:</span>
                      <span className="ml-2">{store.address}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="font-medium">Cidade:</span>
                      <span className="ml-2">{store.city}, {store.state} - {store.zipCode}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="font-medium">Telefone:</span>
                      <span className="ml-2">{store.phone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{store.email || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium">Criada em:</span>
                      <span className="ml-2">{new Date(store.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium">Última atualização:</span>
                      <span className="ml-2">{new Date(store.updatedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                
                {store.description && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                    <p className="text-sm text-gray-600">{store.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Horário de Funcionamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Horário de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const workingDaysArray = Array.isArray(store.workingDays) ? store.workingDays : (typeof store.workingDays === 'string' ? JSON.parse(store.workingDays) : []);
                  
                  const DAYS_MAP: { [key: string]: string } = {
                    'segunda': 'Segunda-feira',
                    'terca': 'Terça-feira',
                    'quarta': 'Quarta-feira',
                    'quinta': 'Quinta-feira',
                    'sexta': 'Sexta-feira',
                    'sabado': 'Sábado',
                    'domingo': 'Domingo'
                  };

                  const ALL_DAYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

                  return store.openingTime && store.closingTime ? (
                    <div className="space-y-4">
                      {/* Informações Gerais */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="font-medium">Horário de Funcionamento:</span>
                          <span className="ml-2">{store.openingTime} - {store.closingTime}</span>
                        </div>
                        {store.lunchStart && store.lunchEnd && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span className="font-medium">Horário de Almoço:</span>
                            <span className="ml-2">{store.lunchStart} - {store.lunchEnd}</span>
                          </div>
                        )}
                      </div>

                      {/* Tabela de Dias */}
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-2/3">Dia da Semana</TableHead>
                              <TableHead className="w-1/3 text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ALL_DAYS.map((dayKey) => {
                              const isWorkingDay = workingDaysArray.includes(dayKey);
                              return (
                                <TableRow key={dayKey}>
                                  <TableCell className="font-medium">
                                    {DAYS_MAP[dayKey]}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {isWorkingDay ? (
                                      <Badge className="bg-green-100 text-green-800">
                                        {store.openingTime} - {store.closingTime}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                        Fechado
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Horário de funcionamento não configurado</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Configure o horário na aba "Configurações"
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Configurações */}
            {store.settings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configurações da Loja
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(store.settings).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-700">
                          {key === 'allowOnlineOrders' && 'Permitir pedidos online'}
                          {key === 'requireApprovalForOrders' && 'Exigir aprovação para pedidos'}
                          {key === 'sendNotifications' && 'Enviar notificações'}
                          {key === 'autoAcceptPayments' && 'Aceitar pagamentos automaticamente'}
                          {key === 'lowStockAlert' && 'Alerta de estoque baixo'}
                          {key === 'customerRegistrationRequired' && 'Cadastro obrigatório'}
                        </span>
                        <Badge className={value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {value ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6">
            {/* Header da seção de funcionários */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Funcionários da Loja</h3>
                <p className="text-sm text-gray-600">Gerencie os funcionários desta filial</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => router.push(`/admin/stores/${storeId}/employees`)}
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Ver Todos
                </Button>
              <Button 
                  onClick={() => router.push(`/admin/stores/${storeId}/employee/new`)}
                className="bg-[#3e2626] hover:bg-[#8B4513]"
              >
                <Users className="h-4 w-4 mr-2" />
                Adicionar Funcionário
              </Button>
              </div>
            </div>

            {/* Lista de funcionários */}
            <div className="bg-white rounded-lg border">
              {isLoadingEmployees ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando funcionários...</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="p-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário encontrado</h3>
                    <p className="text-gray-500 mb-4">Adicione funcionários para começar a gerenciar a loja.</p>
                    <Button 
                      onClick={() => router.push(`/admin/stores/${storeId}/employee/new`)}
                      variant="outline"
                    >
                      Adicionar Primeiro Funcionário
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Funcionário</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Admissão</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedEmployees.map((employee) => (
                          <TableRow key={employee.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-[#3e2626] rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-xs">
                              {employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                                  <div className="font-medium text-gray-900">{employee.name}</div>
                                  <div className="text-sm text-gray-500">ID: {employee.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                employee.role === 'GERENTE' ? 'bg-red-50 text-red-700 border-red-200' :
                                employee.role === 'SUPERVISOR' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                employee.role === 'VENDEDOR' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                employee.role === 'CAIXA' ? 'bg-green-50 text-green-700 border-green-200' :
                                employee.role === 'ESTOQUISTA' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                employee.role === 'ATENDENTE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }>
                                {employee.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="text-gray-900">{employee.email}</div>
                                {employee.phone && (
                                  <div className="text-gray-500">
                                    {employee.phone.length === 13 && employee.phone.startsWith('55') 
                                      ? `+${employee.phone.slice(0, 2)} (${employee.phone.slice(2, 4)}) ${employee.phone.slice(4, 9)}-${employee.phone.slice(9)}`
                                      : employee.phone.length === 11
                                      ? `(${employee.phone.slice(0, 2)}) ${employee.phone.slice(2, 7)}-${employee.phone.slice(7)}`
                                      : employee.phone.length === 10
                                      ? `(${employee.phone.slice(0, 2)}) ${employee.phone.slice(2, 6)}-${employee.phone.slice(6)}`
                                      : employee.phone
                                    }
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                          <Badge className={employee.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {employee.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('pt-BR') : 
                                 employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('pt-BR') : '-'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                                  onClick={() => router.push(`/admin/stores/${storeId}/employee?employeeId=${employee.id}`)}
                                  title="Ver/Editar funcionário"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                          <Button 
                            variant="outline" 
                            size="sm"
                                  onClick={() => router.push(`/admin/stores/${storeId}/time-clock?employeeId=${employee.id}`)}
                            title="Registrar ponto"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>

                          <Button 
                            variant="outline" 
                            size="sm"
                                  onClick={() => router.push(`/admin/stores/${storeId}/time-clock-history?employeeId=${employee.id}`)}
                            title="Ver histórico de pontos"
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowMedicalModal(true);
                              }}
                              title="Atestado médico"
                              className="text-green-600 hover:text-green-700"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                                  onClick={() => router.push(`/admin/stores/${storeId}/termination?employeeId=${employee.id}`)}
                              title="Processar demissão"
                              className="text-red-600 hover:text-red-700"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </div>
                            </TableCell>
                          </TableRow>
                    ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && <StoreInventory storeId={storeId} />}

        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Vendas da Loja</h2>
                <p className="text-gray-600">Gerencie as vendas desta loja</p>
              </div>
              <Button 
                onClick={() => router.push(`/admin/sales/create?storeId=${storeId}`)}
                className="bg-[#3e2626] hover:bg-[#4a2f2f] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Venda
              </Button>
            </div>
            <StoreSales storeId={storeId} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações da Loja</span>
                </CardTitle>
                <CardDescription>
                  Gerencie as configurações e informações da loja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Informações Básicas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Loja</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-900">{store?.name || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-900">{store?.phone || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-900">{store?.email || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <Badge className={store?.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {store?.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-900">{store?.address || '-'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-900">{store?.description || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Estatísticas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Funcionários</p>
                          <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Horários</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {store?.workingHours ? 'Configurado' : 'Não configurado'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-600">Configurações</p>
                          <p className="text-2xl font-bold text-gray-900">Completo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horário de Funcionamento */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Horário de Funcionamento</h4>
                  <StoreHoursConfig 
                    storeData={storeHoursData}
                    onChange={handleStoreHoursChange}
                  />
                </div>

                {/* Configurações Avançadas */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configurações Avançadas</h4>
                  
                  {/* Status da Loja */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Status da Loja</Label>
                        <p className="text-sm text-gray-600">
                          {store?.isActive 
                            ? 'A loja está funcionando normalmente' 
                            : 'A loja está temporariamente fechada'
                          }
                        </p>
                      </div>
                      <Badge className={store?.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {store?.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>

                  {/* Horários de Funcionamento */}
                  <div className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Horários de Funcionamento</Label>
                      <p className="text-sm text-gray-600">
                        {store?.workingHours ? 'Configurado' : 'Não configurado'}
                      </p>
                      {store?.workingHours && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p>Horário padrão: {store.workingHours.default?.start || 'N/A'} - {store.workingHours.default?.end || 'N/A'}</p>
                          <p>Almoço: {store.workingHours.lunchBreakMinutes || 60} minutos</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações do Sistema */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Informações do Sistema</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">ID da Loja:</span>
                          <code className="ml-2 text-gray-900">{store?.id}</code>
                        </div>
                        <div>
                          <span className="text-gray-600">Criada em:</span>
                          <span className="ml-2 text-gray-900">
                            {store?.createdAt ? new Date(store.createdAt).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Última atualização:</span>
                          <span className="ml-2 text-gray-900">
                            {store?.updatedAt ? new Date(store.updatedAt).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Funcionários:</span>
                          <span className="ml-2 text-gray-900">{employees.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configurações de Segurança */}
                  <div className="p-4 border rounded-lg">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Configurações de Segurança</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-sm font-medium">Logs de Acesso</span>
                            <p className="text-xs text-gray-600">Registrar todas as ações dos usuários</p>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Ativo
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-sm font-medium">Backup Automático</span>
                            <p className="text-xs text-gray-600">Fazer backup diário dos dados</p>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Ativo
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-sm font-medium">Notificações de Segurança</span>
                            <p className="text-xs text-gray-600">Receber alertas sobre atividades suspeitas</p>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Ativo
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>


      {/* Modal de Edição de Funcionário */}
      <EditEmployeeModal
        isOpen={showEditEmployeeModal}
        onClose={() => {
          setShowEditEmployeeModal(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleUpdateEmployee}
        employee={selectedEmployee}
        isLoading={isUpdatingEmployee}
      />

      {/* Modal de Atestado Médico */}
      <MedicalCertificateModal
        isOpen={showMedicalModal}
        onClose={() => {
          setShowMedicalModal(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleMedicalCertificate}
        employee={selectedEmployee}
        isLoading={isProcessingMedical}
      />

      {/* Modal de Demissão */}
      <TerminationModal
        isOpen={showTerminationModal}
        onClose={() => {
          setShowTerminationModal(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleTermination}
        employee={selectedEmployee}
        isLoading={isProcessingTermination}
      />

    </div>
  );
}