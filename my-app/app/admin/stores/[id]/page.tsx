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
  AlertCircle,
  TrendingUp as PromoteIcon
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCEP, formatPhone, formatState, formatCity, formatAddress, formatName, formatEmail } from '@/lib/input-utils';
import { X, Save } from 'lucide-react';
import { Loader } from '@/components/ui/ai/loader';

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
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);
  const [isProcessingMedical, setIsProcessingMedical] = useState(false);
  const [isProcessingTermination, setIsProcessingTermination] = useState(false);
  const [isProcessingPromotion, setIsProcessingPromotion] = useState(false);
  const [promotionData, setPromotionData] = useState({ newPosition: '', newSalary: '' });
  const [isProcessingTimeClock, setIsProcessingTimeClock] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Função para organizar funcionários por hierarquia (usando roles reais do sistema)
  const getHierarchyOrder = (role: string) => {
    const hierarchy: Record<string, number> = {
      ADMIN: 0,
      STORE_MANAGER: 1,
      EMPLOYEE: 2,
      CASHIER: 3,
    };
    return hierarchy[role] ?? 99;
  };

  // Texto amigável para exibir o cargo do funcionário
  const getEmployeeDisplayRole = (employee: any) => {
    if (employee.position) return employee.position;
    if (employee.role === 'STORE_MANAGER') return 'Gerente';
    return 'Funcionário';
  };

  const sortedEmployees = (employees || []).sort((a, b) => {
    const orderA = getHierarchyOrder(a.role);
    const orderB = getHierarchyOrder(b.role);
    if (orderA !== orderB) return orderA - orderB;
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB);
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

  // Prevenir scroll do body e do conteúdo principal quando o modal estiver aberto
  useEffect(() => {
    if (isEditModalOpen) {
      // Salvar o estado atual do overflow
      const originalBodyOverflow = window.getComputedStyle(document.body).overflow;
      const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow;
      
      // Bloquear scroll no body e html
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Bloquear scroll no main content também
      const mainContent = document.querySelector('main');
      if (mainContent) {
        const originalMainOverflow = window.getComputedStyle(mainContent).overflow;
        (mainContent as HTMLElement).style.overflow = 'hidden';
        
        // Limpar quando o componente desmontar ou modal fechar
        return () => {
          document.body.style.overflow = originalBodyOverflow;
          document.documentElement.style.overflow = originalHtmlOverflow;
          (mainContent as HTMLElement).style.overflow = originalMainOverflow;
        };
      } else {
        // Limpar quando o componente desmontar ou modal fechar
        return () => {
          document.body.style.overflow = originalBodyOverflow;
          document.documentElement.style.overflow = originalHtmlOverflow;
        };
      }
    }
  }, [isEditModalOpen]);

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
      
      // Filtrar apenas os campos permitidos pelo DTO do backend
      const allowedFields = [
        'name', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 
        'role', 'isActive', 'cpf', 'workingHours', 'salary', 'position', 'hireDate'
      ];
      
      const filteredData: any = {};
      allowedFields.forEach(field => {
        if (employeeData[field] !== undefined && employeeData[field] !== null) {
          // Remover campos vazios (strings vazias)
          if (typeof employeeData[field] === 'string' && employeeData[field].trim() === '') {
            return; // Não incluir campos vazios
          }
          filteredData[field] = employeeData[field];
        }
      });
      
      await adminAPI.updateEmployee(selectedEmployee.id, filteredData);
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
      
      // Preparar dados do atestado
      const payload = {
        employeeId: certificateData.employeeId,
        startDate: certificateData.startDate,
        endDate: certificateData.endDate,
        type: certificateData.type,
        reason: certificateData.reason,
        doctorName: certificateData.doctorName,
        doctorCrm: certificateData.doctorCrm,
        clinicName: certificateData.clinicName,
        status: certificateData.status || 'APPROVED',
        notes: certificateData.notes || '',
        attachmentUrl: certificateData.attachmentUrl || null
      };

      // Determinar o endpoint baseado no contexto (admin ou manager)
      const { user } = useAppStore.getState();
      const isAdmin = user?.role === 'ADMIN';
      const endpoint = isAdmin 
        ? `http://localhost:3001/api/admin/medical-certificates`
        : `http://localhost:3001/api/manager/medical-certificates`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar atestado');
      }

      const result = await response.json();
      console.log('Atestado registrado com sucesso:', result);
      
      // Recarregar funcionários para atualizar status
      await loadEmployees();
      
      setShowMedicalModal(false);
      setSelectedEmployee(null);
      
      // Mostrar mensagem de sucesso
      alert('Atestado registrado com sucesso! O funcionário foi inativado durante o período do atestado.');
    } catch (error: any) {
      console.error('Erro ao processar atestado:', error);
      alert(`Erro ao registrar atestado: ${error.message || 'Erro desconhecido'}`);
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

  const handlePromotion = async (promotionData: { newPosition?: string; newSalary?: number }) => {
    try {
      setIsProcessingPromotion(true);
      await adminAPI.promoteEmployee(selectedEmployee.id, promotionData);
              alert('Funcionário promovido com sucesso!');
      setShowPromotionModal(false);
      setSelectedEmployee(null);
      setPromotionData({ newPosition: '', newSalary: '' });
      await loadEmployees();
    } catch (error: any) {
      console.error('Erro ao promover funcionário:', error);
      alert(`Erro ao promover funcionário: ${error.message || 'Tente novamente.'}`);
    } finally {
      setIsProcessingPromotion(false);
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

  const handleOpenEditModal = () => {
    if (!store) return;
    
    // Preparar dados do formulário com os dados atuais da loja
    const workingDaysArray = Array.isArray(store.workingDays) 
      ? store.workingDays 
      : (typeof store.workingDays === 'string' ? JSON.parse(store.workingDays || '[]') : []);
    
    // Converter workingDays para formato de workingHours
    const workingHours: any = {
      monday: { open: store.openingTime || '08:00', close: store.closingTime || '18:00', isOpen: workingDaysArray.includes('segunda') },
      tuesday: { open: store.openingTime || '08:00', close: store.closingTime || '18:00', isOpen: workingDaysArray.includes('terca') },
      wednesday: { open: store.openingTime || '08:00', close: store.closingTime || '18:00', isOpen: workingDaysArray.includes('quarta') },
      thursday: { open: store.openingTime || '08:00', close: store.closingTime || '18:00', isOpen: workingDaysArray.includes('quinta') },
      friday: { open: store.openingTime || '08:00', close: store.closingTime || '18:00', isOpen: workingDaysArray.includes('sexta') },
      saturday: { open: store.openingTime || '08:00', close: store.closingTime || '17:00', isOpen: workingDaysArray.includes('sabado') },
      sunday: { open: store.openingTime || '09:00', close: store.closingTime || '15:00', isOpen: workingDaysArray.includes('domingo') }
    };

    setEditFormData({
      name: store.name || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      zipCode: store.zipCode || '',
      phone: store.phone || '',
      email: store.email || '',
      description: store.description || '',
      isActive: store.isActive !== undefined ? store.isActive : true,
      workingHours: workingHours,
      settings: store.settings || {
        allowOnlineOrders: true,
        requireApprovalForOrders: false,
        sendNotifications: true,
        autoAcceptPayments: true,
        lowStockAlert: true,
        customerRegistrationRequired: false
      }
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData(null);
  };

  const handleEditInputChange = (field: string, value: any) => {
    let formattedValue = value;
    switch (field) {
      case 'name':
        formattedValue = formatName(value);
        break;
      case 'email':
        formattedValue = formatEmail(value);
        break;
      case 'phone':
        formattedValue = formatPhone(value);
        break;
      case 'address':
        formattedValue = formatAddress(value);
        break;
      case 'city':
        formattedValue = formatCity(value);
        break;
      case 'state':
        formattedValue = formatState(value);
        break;
      case 'zipCode':
        formattedValue = formatCEP(value);
        break;
      default:
        formattedValue = value;
    }
    
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleEditWorkingHoursChange = (day: string, field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleEditSettingsChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleSaveStore = async () => {
    if (!editFormData) return;
    
    try {
      setIsSaving(true);
      
      // Converter workingHours para formato do backend
      const workingDays: string[] = [];
      const daysMap: { [key: string]: string } = {
        monday: 'segunda',
        tuesday: 'terca',
        wednesday: 'quarta',
        thursday: 'quinta',
        friday: 'sexta',
        saturday: 'sabado',
        sunday: 'domingo'
      };
      
      Object.entries(editFormData.workingHours).forEach(([day, data]: [string, any]) => {
        if (data.isOpen) {
          workingDays.push(daysMap[day]);
        }
      });

      // Pegar horário de abertura e fechamento (usar o primeiro dia aberto)
      const firstOpenDay = Object.values(editFormData.workingHours).find((day: any) => day.isOpen);
      const openingTime = firstOpenDay ? (firstOpenDay as any).open : '08:00';
      const closingTime = firstOpenDay ? (firstOpenDay as any).close : '18:00';

      const updateData = {
        name: editFormData.name,
        address: editFormData.address,
        city: editFormData.city,
        state: editFormData.state,
        zipCode: editFormData.zipCode,
        phone: editFormData.phone,
        email: editFormData.email,
        description: editFormData.description,
        isActive: editFormData.isActive,
        workingDays: workingDays,
        openingTime: openingTime,
        closingTime: closingTime,
        lunchStart: store?.lunchStart || '',
        lunchEnd: store?.lunchEnd || '',
        settings: editFormData.settings
      };

      await adminAPI.updateStore(storeId, updateData);
      
      // Recarregar dados da loja
      await loadStoreDetails();
      
      // Fechar modal
      handleCloseEditModal();
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="mx-auto mb-4" />
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
          <Loader size={48} className="mx-auto mb-4" />
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
      <div className="bg-[#3e2626] text-white py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/stores')}
                className="flex items-center text-white hover:bg-white/20 rounded-xl flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Store className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{store.name}</h1>
                  <p className="text-white/80 text-sm sm:text-base lg:text-lg truncate">{store.city}, {store.state}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                    <div className="flex items-center text-white/80 text-xs sm:text-sm min-w-0">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{store.address}</span>
                    </div>
                    <div className="flex items-center text-white/80 text-xs sm:text-sm">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{store.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="text-left sm:text-right">
                <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                  <div className={`w-3 h-3 rounded-full ${store.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-white/90 font-medium text-sm sm:text-base">
                    {store.isActive ? 'Loja Ativa' : 'Loja Inativa'}
                  </span>
                </div>
                <p className="text-white/70 text-xs sm:text-sm">
                  {store.isActive ? 'Em operação' : 'Fora de operação'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleOpenEditModal}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl w-full sm:w-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Editar Loja</span>
                <span className="sm:hidden">Editar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: Scroll horizontal suave com indicadores */}
          <div className="relative sm:hidden">
            <div className="overflow-x-auto scrollbar-hide scroll-smooth">
              <nav className="flex space-x-2 px-4 py-2 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3 px-4 border-b-2 font-semibold text-xs flex flex-col items-center justify-center space-y-1 rounded-t-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 min-w-[70px] ${
                        activeTab === tab.id
                          ? 'border-[#3e2626] text-[#3e2626] bg-[#3e2626]/10'
                          : 'border-transparent text-gray-500 active:text-[#3e2626] active:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${activeTab === tab.id ? 'text-[#3e2626]' : 'text-gray-400'}`} />
                      <span className="text-[10px] leading-tight text-center">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            {/* Gradientes laterais para indicar scroll */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
          
          {/* Desktop: Layout normal */}
          <nav className="hidden sm:flex space-x-1 px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas Mensais</CardTitle>
                  <CardDescription>Evolução das vendas nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{
                    vendas: { label: "Vendas", color: "#3e2626" },
                    clientes: { label: "Clientes", color: "#8B4513" }
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
                        stroke="#3e2626" 
                        strokeWidth={2}
                        dot={{ fill: "#3e2626" }}
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
                    presenca: { label: "Presença", color: "#3e2626" },
                    atrasos: { label: "Atrasos", color: "#8B4513" }
                  }}>
                    <BarChart data={dashboardData.attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="presenca" fill="#3e2626" />
                      <Bar dataKey="atrasos" fill="#8B4513" />
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
                  vendas: { label: "Vendas", color: "#3e2626" },
                  pontos: { label: "Pontos", color: "#8B4513" }
                }}>
                  <BarChart data={dashboardData.employeePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="vendas" fill="#3e2626" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="font-medium">Endereço:</span>
                      <span className="ml-2 truncate">{store.address}</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Funcionários da Loja</h3>
                <p className="text-sm text-gray-600">Gerencie os funcionários desta filial</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
                <Button 
                  onClick={() => router.push(`/admin/stores/${storeId}/employees`)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Ver Todos
                </Button>
              <Button 
                  onClick={() => router.push(`/admin/stores/${storeId}/employee/new`)}
                className="bg-[#3e2626] hover:bg-[#8B4513] w-full sm:w-auto"
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Funcionário</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
              </div>
            </div>

            {/* Lista de funcionários */}
            <div className="bg-white rounded-lg border">
              {isLoadingEmployees ? (
                <div className="p-6 text-center">
                  <Loader size={32} className="mx-auto mb-4" />
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
                <div className="p-3 sm:p-6">
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <Table className="min-w-[800px] sm:min-w-0">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Funcionário</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Salário</TableHead>
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
                              {employee.name ? employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'N/A'}
                            </span>
                          </div>
                          <div>
                                  <div className="font-medium text-gray-900">{employee.name || 'Nome não disponível'}</div>
                                  <div className="text-sm text-gray-500">ID: {employee.id ? employee.id.slice(0, 8) + '...' : 'N/A'}</div>
                          </div>
                        </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  employee.role === 'STORE_MANAGER'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                }
                              >
                                {getEmployeeDisplayRole(employee)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium text-gray-900">
                                {employee.salary 
                                  ? `R$ ${typeof employee.salary === 'string' ? parseFloat(employee.salary).toFixed(2) : employee.salary.toFixed(2)}`
                                  : 'Não informado'}
                              </div>
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
                              <div className="flex items-center justify-end flex-wrap gap-1 sm:space-x-1">
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
                              onClick={() => router.push(`/admin/stores/${storeId}/medical-certificates?employeeId=${employee.id}`)}
                              title="Atestado médico"
                              className="text-green-600 hover:text-green-700"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Definir funcionário selecionado e preencher dados padrão de promoção
                                setSelectedEmployee(employee);

                                // Mapear role atual para novo cargo (apenas Gerente ou Funcionário)
                                const currentRole =
                                  employee.role === 'STORE_MANAGER'
                                    ? 'STORE_MANAGER'
                                    : 'EMPLOYEE';

                                // Salário atual (se existir)
                                const currentSalary = employee.salary
                                  ? (typeof employee.salary === 'string'
                                      ? parseFloat(employee.salary)
                                      : employee.salary)
                                  : 0;

                                setPromotionData({
                                  newPosition: currentRole,
                                  newSalary: currentSalary > 0 ? currentSalary.toString() : ''
                                });

                                setShowPromotionModal(true);
                              }}
                              title="Promover funcionário"
                              className="text-green-600 hover:text-green-700"
                            >
                              <PromoteIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={async () => {
                                // Carregar dados completos do funcionário antes de abrir o modal
                                try {
                                  const response = await fetch(`http://localhost:3001/api/admin/users/${employee.id}`, {
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json'
                                    }
                                  });
                                  
                                  if (response.ok) {
                                    const fullEmployeeData = await response.json();
                                    console.log('💰 Funcionário carregado para demissão:', fullEmployeeData);
                                    setSelectedEmployee(fullEmployeeData);
                                    setShowTerminationModal(true);
                                  } else {
                                    // Se der erro, usar os dados que já temos
                                    console.warn('⚠️ Erro ao carregar dados completos, usando dados da lista');
                                    setSelectedEmployee(employee);
                                    setShowTerminationModal(true);
                                  }
                                } catch (error) {
                                  console.error('Erro ao carregar dados do funcionário:', error);
                                  // Se der erro, usar os dados que já temos
                                  setSelectedEmployee(employee);
                                  setShowTerminationModal(true);
                                }
                              }}
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
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vendas da Loja</h2>
                <p className="text-sm sm:text-base text-gray-600">Gerencie as vendas desta loja</p>
              </div>
              <Button 
                onClick={() => router.push(`/admin/sales/create?storeId=${storeId}`)}
                className="bg-[#3e2626] hover:bg-[#4a2f2f] text-white w-full sm:w-auto"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

      {/* Modal de Promoção */}
      {showPromotionModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="relative w-full max-w-md mx-3 rounded-xl bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-xl">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Promover Funcionário
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowPromotionModal(false);
                  setSelectedEmployee(null);
                  setPromotionData({ newPosition: '', newSalary: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-200 space-y-1">
              <p className="text-xs sm:text-sm text-gray-800">
                <span className="font-semibold">Funcionário:</span> {selectedEmployee.name}
              </p>
              <p className="text-xs sm:text-sm text-gray-700">
                <span className="font-semibold">Cargo atual:</span>{' '}
                {selectedEmployee.role === 'STORE_MANAGER' ? 'Gerente' : 'Funcionário'}
              </p>
              <p className="text-xs sm:text-sm text-gray-700">
                <span className="font-semibold">Salário atual:</span>{' '}
                {selectedEmployee.salary
                  ? `R$ ${
                      typeof selectedEmployee.salary === 'string'
                        ? parseFloat(selectedEmployee.salary).toFixed(2).replace('.', ',')
                        : selectedEmployee.salary.toFixed(2).replace('.', ',')
                    }`
                  : 'Não informado'}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!promotionData.newPosition || !promotionData.newSalary) {
                  alert('Por favor, preencha todos os campos obrigatórios.');
                  return;
                }
                handlePromotion({
                  newPosition: promotionData.newPosition,
                  newSalary: parseFloat(promotionData.newSalary)
                });
              }}
              className="px-4 py-4 space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="newPosition" className="text-sm font-medium text-gray-800">
                  Novo Cargo *
                </Label>
                <Select 
                  value={promotionData.newPosition} 
                  onValueChange={(value) => setPromotionData(prev => ({ ...prev, newPosition: value }))}
                >
                  <SelectTrigger id="newPosition">
                    <SelectValue placeholder="Selecione o novo cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STORE_MANAGER">Gerente</SelectItem>
                    <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newSalary" className="text-sm font-medium text-gray-800">
                  Novo Salário (R$) *
                </Label>
                <Select 
                  value={promotionData.newSalary} 
                  onValueChange={(value) => setPromotionData(prev => ({ ...prev, newSalary: value }))}
                >
                  <SelectTrigger id="newSalary">
                    <SelectValue placeholder="Selecione o novo salário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1200">R$ 1.200,00</SelectItem>
                    <SelectItem value="1500">R$ 1.500,00</SelectItem>
                    <SelectItem value="1800">R$ 1.800,00</SelectItem>
                    <SelectItem value="2000">R$ 2.000,00</SelectItem>
                    <SelectItem value="2500">R$ 2.500,00</SelectItem>
                    <SelectItem value="3000">R$ 3.000,00</SelectItem>
                    <SelectItem value="3500">R$ 3.500,00</SelectItem>
                    <SelectItem value="4000">R$ 4.000,00</SelectItem>
                    <SelectItem value="4500">R$ 4.500,00</SelectItem>
                    <SelectItem value="5000">R$ 5.000,00</SelectItem>
                    <SelectItem value="6000">R$ 6.000,00</SelectItem>
                    <SelectItem value="7000">R$ 7.000,00</SelectItem>
                    <SelectItem value="8000">R$ 8.000,00</SelectItem>
                    <SelectItem value="10000">R$ 10.000,00</SelectItem>
                    <SelectItem value="12000">R$ 12.000,00</SelectItem>
                    <SelectItem value="15000">R$ 15.000,00</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPromotionModal(false);
                    setSelectedEmployee(null);
                    setPromotionData({ newPosition: '', newSalary: '' });
                  }}
                  disabled={isProcessingPromotion}
                  className="border-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  disabled={isProcessingPromotion}
                >
                  {isProcessingPromotion ? (
                    <>
                      <Loader size={16} className="mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <PromoteIcon className="h-4 w-4 mr-2" />
                      Promover
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Loja - Overlay Fullscreen */}
      {isEditModalOpen && editFormData && (
        <>
          {/* Backdrop para garantir que nada fique visível por trás */}
          <div className="fixed z-40 bg-white lg:left-64 lg:top-20 lg:right-0 lg:bottom-0 top-0 left-0 right-0 bottom-0" />
          {/* Overlay com conteúdo */}
          <div className="fixed z-50 bg-white overflow-y-auto lg:left-64 lg:top-20 lg:right-0 lg:bottom-0 top-0 left-0 right-0 bottom-0">
          {/* Header Fixo */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#3e2626] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Store className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Editar Loja</h2>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Atualize as informações da loja</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseEditModal}
                    disabled={isSaving}
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    <span className="hidden sm:inline">Cancelar</span>
                    <X className="h-4 w-4 sm:hidden" />
                  </Button>
                  <Button
                    onClick={handleSaveStore}
                    disabled={isSaving}
                    className="bg-[#3e2626] hover:bg-[#2a1a1a] text-white flex-1 sm:flex-initial"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                    <span className="sm:hidden">{isSaving ? 'Salvando...' : 'Salvar'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo do Formulário */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
            <form onSubmit={(e) => { e.preventDefault(); handleSaveStore(); }} className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Store className="h-5 w-5 mr-2" />
                    Informações Básicas
                  </CardTitle>
                  <CardDescription>
                    Dados principais da loja
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Nome da Loja *</Label>
                      <Input
                        id="edit-name"
                        value={editFormData.name}
                        onChange={(e) => handleEditInputChange('name', e.target.value)}
                        placeholder="Ex: Loja Centro"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleEditInputChange('email', e.target.value)}
                        placeholder="contato@loja.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-address">Endereço *</Label>
                    <Input
                      id="edit-address"
                      value={editFormData.address}
                      onChange={(e) => handleEditInputChange('address', e.target.value)}
                      placeholder="Rua, número, bairro"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-city">Cidade *</Label>
                      <Input
                        id="edit-city"
                        value={editFormData.city}
                        onChange={(e) => handleEditInputChange('city', e.target.value)}
                        placeholder="São Paulo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-state">Estado *</Label>
                      <Input
                        id="edit-state"
                        value={editFormData.state}
                        onChange={(e) => handleEditInputChange('state', e.target.value)}
                        placeholder="SP"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-zipCode">CEP *</Label>
                      <Input
                        id="edit-zipCode"
                        value={editFormData.zipCode}
                        onChange={(e) => handleEditInputChange('zipCode', e.target.value)}
                        placeholder="01234-567"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-phone">Telefone</Label>
                    <Input
                      id="edit-phone"
                      value={editFormData.phone}
                      onChange={(e) => handleEditInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      value={editFormData.description}
                      onChange={(e) => handleEditInputChange('description', e.target.value)}
                      placeholder="Descreva características especiais desta filial..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-isActive"
                      checked={editFormData.isActive}
                      onCheckedChange={(checked) => handleEditInputChange('isActive', checked)}
                    />
                    <Label htmlFor="edit-isActive">Loja ativa</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Horário de Funcionamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Horário de Funcionamento
                  </CardTitle>
                  <CardDescription>
                    Configure os horários de funcionamento da loja
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {daysOfWeek.map((day) => (
                    <div key={day.key} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4 p-4 border rounded-lg">
                      <div className="w-full sm:w-32 flex-shrink-0">
                        <Label className="text-sm sm:text-base">{day.label}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editFormData.workingHours[day.key].isOpen}
                          onCheckedChange={(checked) => handleEditWorkingHoursChange(day.key, 'isOpen', checked)}
                        />
                        <Label className="text-sm sm:text-base">Aberto</Label>
                      </div>
                      {editFormData.workingHours[day.key].isOpen && (
                        <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                          <Input
                            type="time"
                            value={editFormData.workingHours[day.key].open}
                            onChange={(e) => handleEditWorkingHoursChange(day.key, 'open', e.target.value)}
                            className="w-full sm:w-32"
                          />
                          <span className="text-sm">até</span>
                          <Input
                            type="time"
                            value={editFormData.workingHours[day.key].close}
                            onChange={(e) => handleEditWorkingHoursChange(day.key, 'close', e.target.value)}
                            className="w-full sm:w-32"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Configurações da Loja */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configurações da Loja
                  </CardTitle>
                  <CardDescription>
                    Configurações específicas de funcionamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="edit-allowOnlineOrders">Permitir pedidos online</Label>
                          <p className="text-sm text-gray-500">Clientes podem fazer pedidos pela internet</p>
                        </div>
                        <Switch
                          id="edit-allowOnlineOrders"
                          checked={editFormData.settings.allowOnlineOrders}
                          onCheckedChange={(checked) => handleEditSettingsChange('allowOnlineOrders', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="edit-requireApprovalForOrders">Exigir aprovação para pedidos</Label>
                          <p className="text-sm text-gray-500">Todos os pedidos precisam ser aprovados</p>
                        </div>
                        <Switch
                          id="edit-requireApprovalForOrders"
                          checked={editFormData.settings.requireApprovalForOrders}
                          onCheckedChange={(checked) => handleEditSettingsChange('requireApprovalForOrders', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="edit-sendNotifications">Enviar notificações</Label>
                          <p className="text-sm text-gray-500">Notificar sobre novos pedidos e atualizações</p>
                        </div>
                        <Switch
                          id="edit-sendNotifications"
                          checked={editFormData.settings.sendNotifications}
                          onCheckedChange={(checked) => handleEditSettingsChange('sendNotifications', checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="edit-autoAcceptPayments">Aceitar pagamentos automaticamente</Label>
                          <p className="text-sm text-gray-500">Aprovar pagamentos sem confirmação manual</p>
                        </div>
                        <Switch
                          id="edit-autoAcceptPayments"
                          checked={editFormData.settings.autoAcceptPayments}
                          onCheckedChange={(checked) => handleEditSettingsChange('autoAcceptPayments', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="edit-lowStockAlert">Alerta de estoque baixo</Label>
                          <p className="text-sm text-gray-500">Notificar quando produtos estão com estoque baixo</p>
                        </div>
                        <Switch
                          id="edit-lowStockAlert"
                          checked={editFormData.settings.lowStockAlert}
                          onCheckedChange={(checked) => handleEditSettingsChange('lowStockAlert', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="edit-customerRegistrationRequired">Cadastro obrigatório</Label>
                          <p className="text-sm text-gray-500">Clientes devem se cadastrar para comprar</p>
                        </div>
                        <Switch
                          id="edit-customerRegistrationRequired"
                          checked={editFormData.settings.customerRegistrationRequired}
                          onCheckedChange={(checked) => handleEditSettingsChange('customerRegistrationRequired', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
        </>
      )}

    </div>
  );
}