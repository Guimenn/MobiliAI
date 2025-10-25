'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
<<<<<<< Updated upstream
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api-admin';
import { useAppStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
import HydrationBoundary from '@/components/HydrationBoundary';
import NoSSR from '@/components/NoSSR';
=======
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
>>>>>>> Stashed changes
import { 
  Building2, 
  Bell, 
  LogOut, 
  Users, 
  Store, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  BarChart3,
  Building,
  CheckCircle,
  Zap, 
  Plus, 
  UserCheck,
  Download, 
  Settings,
  ArrowUp,
  Search, 
  Menu,
  ChevronDown,
  UserPlus,
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw,
  X,
  Filter,
  MoreHorizontal,
  Home,
  FileText,
  User,
  Users2,
  Grid3X3,
  ShoppingCart,
  Shield,
  BookOpen,
  Layers,
  History,
  MapPin, 
  Phone, 
  Mail,
  Heart,
  Star,
  Clock,
  Calendar,
<<<<<<< Updated upstream
  TrendingDown
=======
  ArrowLeft,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  RefreshCw,
  Download,
  Building2,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Star
>>>>>>> Stashed changes
} from 'lucide-react';

export default function StoresPage() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
<<<<<<< Updated upstream
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filtros para lojas
  const [storeFilters, setStoreFilters] = useState({
    status: 'all',
    search: ''
  });
=======
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'status' | 'created'>('name');
>>>>>>> Stashed changes

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simular usuário admin para demonstração
        const mockUser = {
          id: 1,
          name: 'Administrador',
          email: 'admin@mobiliai.com',
          role: 'ADMIN'
        };
        
        setUser(mockUser);
        setLastUpdated(new Date());
        await loadStoresData();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    // Usar setTimeout para evitar problemas de hidratação
    const timer = setTimeout(checkAuth, 0);
    return () => clearTimeout(timer);
  }, []);

  // Atualizar dados a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadStoresData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadStoresData = async () => {
    try {
      setIsLoading(true);
<<<<<<< Updated upstream
      
      console.log('Carregando dados de lojas do banco...');
      
      // Carregar dados reais da API
      const storesResponse = await adminAPI.getStores(token || '');

      console.log('Resposta da API de lojas:', storesResponse);

      if (storesResponse && storesResponse.ok) {
        try {
          const storesData = await storesResponse.json();
          console.log('Dados de lojas recebidos:', storesData);
          
          // Verificar se os dados estão em storesData.stores ou se é um array direto
          const storesArray = storesData?.stores || storesData;
          setStores(Array.isArray(storesArray) ? storesArray : []);
        } catch (jsonError) {
          console.error('Erro ao fazer parse do JSON de lojas:', jsonError);
          setStores([]);
        }
      } else {
        console.error('Erro na API de lojas:', storesResponse?.status || 'No status', storesResponse?.statusText || 'No status text');
        setStores([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do banco:', error);
=======
      const data = await adminAPI.getStores();
      console.log('Dados recebidos da API:', data);
      
      // Verificar se os dados são um array ou se estão dentro de uma propriedade
      let storesArray = [];
      if (Array.isArray(data)) {
        storesArray = data;
      } else if (data && Array.isArray(data.stores)) {
        storesArray = data.stores;
      } else if (data && Array.isArray(data.data)) {
        storesArray = data.data;
      } else {
        console.warn('Formato de dados inesperado:', data);
        storesArray = [];
      }
      
      // Buscar funcionários para cada loja
      const storesWithEmployees = await Promise.all(
        storesArray.map(async (store) => {
          try {
            const employeesData = await adminAPI.getStoreEmployees(store.id);
            console.log(`Funcionários da loja ${store.name}:`, employeesData);
            
            // Verificar se os dados são um array ou se estão dentro de uma propriedade
            let employeesArray = [];
            if (Array.isArray(employeesData)) {
              employeesArray = employeesData;
            } else if (employeesData && Array.isArray(employeesData.employees)) {
              employeesArray = employeesData.employees;
            } else if (employeesData && Array.isArray(employeesData.data)) {
              employeesArray = employeesData.data;
            } else if (employeesData && Array.isArray(employeesData.users)) {
              employeesArray = employeesData.users;
            }
            
            return {
              ...store,
              _count: {
                ...store._count,
                users: employeesArray.length
              }
            };
          } catch (error) {
            console.error(`Erro ao carregar funcionários da loja ${store.name}:`, error);
            return {
              ...store,
              _count: {
                ...store._count,
                users: 0
              }
            };
          }
        })
      );
      
      console.log('Array de lojas processado com funcionários:', storesWithEmployees);
      setStores(storesWithEmployees);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
>>>>>>> Stashed changes
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <NoSSR>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#3e2626]">MobiliAI</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* User Profile */}
            <div className="p-6 border-b">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#3e2626] text-white">
                    {user?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'Administrador'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.role || 'Administrador'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  onClick={() => router.push('/admin/dashboard')}
                >
                  <Home className="h-4 w-4 mr-3" />
                  Dashboard
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </div>

              <div className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  GESTÃO
                </p>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-[#3e2626] bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/stores')}
                  >
                    <Store className="h-4 w-4 mr-3" />
                    Lojas
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/users')}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Usuários
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/products')}
                  >
                    <Package className="h-4 w-4 mr-3" />
                    Produtos
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/sales')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-3" />
                    Vendas
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/reports')}
                  >
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Relatórios
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/customers')}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Clientes
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/settings')}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configurações
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  SISTEMA
                </p>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  >
                    <Activity className="h-4 w-4 mr-3" />
                    Atividade
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    Segurança
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Logs
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </div>
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">N</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-[#3e2626]">Gestão de Lojas</h1>
                  <p className="text-sm text-gray-600">Gerencie todas as lojas da empresa</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search here"
                    className="pl-10 w-64"
                  />
                </div>
            
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">9</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            <StoresSection 
              stores={stores}
              isLoading={isLoading}
              token={token}
              onStoresChange={loadStoresData}
            />
          </main>
        </div>
      </div>
    </NoSSR>
  );
}

// Componente da seção de lojas
function StoresSection({ stores, isLoading, token, onStoresChange }: any) {
  // Estados para filtros
  const [storeFilters, setStoreFilters] = useState({
    status: 'all',
    search: ''
  });

<<<<<<< Updated upstream
  // Estados para modal de nova loja
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    managerName: '',
    managerEmail: '',
    isActive: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Função para criar nova loja
  const handleCreateStore = async () => {
    if (!newStore.name || !newStore.address || !newStore.city) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Criando loja no banco:', newStore);
      
      // Preparar dados para envio
      const storeData = {
        name: newStore.name,
        address: newStore.address,
        city: newStore.city,
        state: newStore.state,
        zipCode: newStore.zipCode,
        phone: newStore.phone,
        email: newStore.email,
        managerName: newStore.managerName,
        managerEmail: newStore.managerEmail,
        isActive: newStore.isActive
      };

      console.log('Dados da loja a serem enviados:', storeData);

      // Chamar API para criar loja
      const response = await adminAPI.createStore(token || '', storeData);
      
      if (response.ok) {
        const createdStore = await response.json();
        console.log('Loja criada com sucesso:', createdStore);
        
        alert('Loja criada com sucesso!');
        setIsModalOpen(false);
        setNewStore({
          name: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
          email: '',
          managerName: '',
          managerEmail: '',
          isActive: true
        });
        
        // Recarregar dados do banco
        onStoresChange();
      } else {
        const errorData = await response.json();
        console.error('Erro na API:', errorData);
        alert(`Erro ao criar loja: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao criar loja:', error);
      alert('Erro ao criar loja. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewStore({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      managerName: '',
      managerEmail: '',
      isActive: true
    });
  };

  // Função para editar loja
  const handleEditStore = async (storeId: string) => {
    try {
      console.log('Editando loja:', storeId);
      // TODO: Implementar modal de edição
      alert('Funcionalidade de edição será implementada em breve');
    } catch (error) {
      console.error('Erro ao editar loja:', error);
      alert('Erro ao editar loja');
    }
  };

  // Função para deletar loja
  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta loja?')) {
      return;
    }

    try {
      console.log('Deletando loja:', storeId);
      
      // Usar fetch direto para deletar loja
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('Loja deletada com sucesso');
        alert('Loja deletada com sucesso!');
        
        // Recarregar dados do banco
        onStoresChange();
      } else {
        const errorData = await response.json();
        console.error('Erro na API:', errorData);
        alert(`Erro ao deletar loja: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao deletar loja:', error);
      alert('Erro ao deletar loja');
    }
  };

  // Função para filtrar lojas
  const getFilteredStores = () => {
    if (!Array.isArray(stores)) return [];
    
    return stores
      .filter((store: any) => {
        // Filtro por status
        if (storeFilters.status !== 'all') {
          if (storeFilters.status === 'active' && !store.isActive) return false;
          if (storeFilters.status === 'inactive' && store.isActive) return false;
        }
        
        // Filtro por busca
        if (storeFilters.search) {
          const searchTerm = storeFilters.search.toLowerCase();
          return (
            store.name?.toLowerCase().includes(searchTerm) ||
            store.address?.toLowerCase().includes(searchTerm) ||
            store.city?.toLowerCase().includes(searchTerm) ||
            store.managerName?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
=======
  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircle : AlertCircle;
>>>>>>> Stashed changes
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando lojas...</p>
        </div>
      </div>
    );
  }

  return (
<<<<<<< Updated upstream
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"> 
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold">Gestão de Lojas</h1>
                  <p className="text-white/80 text-lg">Gerencie todas as lojas da empresa</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.location.reload()}
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-[#3e2626] hover:bg-white/90 font-semibold px-6 py-2 rounded-xl"
              >
=======
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-6 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold">Gestão de Lojas</h1>
                <p className="text-white/80 text-lg">Gerencie todas as lojas da empresa</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => loadStores()}
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              onClick={() => router.push('/admin/stores/new')}
              className="bg-white text-[#3e2626] hover:bg-white/90 font-semibold px-6 py-2 rounded-xl"
            >
>>>>>>> Stashed changes
              <Plus className="h-4 w-4 mr-2" />
              Nova Loja
            </Button>
          </div>
        </div>
<<<<<<< Updated upstream
          </div>
        </div>

      {/* Stats Cards - Brand Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {stores.length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Lojas cadastradas</p>
                </div>
              <div className="w-12 h-12 bg-[#3e2626]/10 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-[#3e2626]" />
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/20 shadow-lg hover:shadow-xl hover:border-green-500/30 transition-all duration-300">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Ativas</p>
                <p className="text-3xl font-bold text-green-600">
                  {stores.filter((s: any) => s.isActive).length}
                </p>
                <p className="text-xs text-green-600/70">Em funcionamento</p>
                </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-2 border-blue-500/20 shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Funcionários</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stores.reduce((sum: number, s: any) => sum + (s._count?.users || 0), 0)}
                </p>
                <p className="text-xs text-blue-600/70">Total de funcionários</p>
                </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-2 border-purple-500/20 shadow-lg hover:shadow-xl hover:border-purple-500/30 transition-all duration-300">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Produtos</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stores.reduce((sum: number, s: any) => sum + (s._count?.products || 0), 0)}
                </p>
                <p className="text-xs text-purple-600/70">Em estoque</p>
                </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Filtros e Controles */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                  Status:
                </Label>
                <select
                  id="status-filter"
                  value={storeFilters.status}
                  onChange={(e) => setStoreFilters({ ...storeFilters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                >
                  <option value="all">Todas</option>
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar lojas..."
                  value={storeFilters.search}
                  onChange={(e) => setStoreFilters({ ...storeFilters, search: e.target.value })}
                  className="w-64"
                />
              </div>
                    </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center space-x-2"
              >
                <Grid3X3 className="h-4 w-4" />
                <span>Grade</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Lista</span>
              </Button>
                    </div>
                  </div>
        </CardContent>
      </Card>

      {/* Lista de Lojas */}
      <div className="space-y-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredStores().map((store: any) => (
              <Card key={store.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#3e2626] rounded-xl flex items-center justify-center">
                        <Store className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {store.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {store.city}, {store.state}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={store.isActive ? 'default' : 'secondary'}
                            className={`text-xs ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                    {store.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                  </div>
                  </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{store.address}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{store.phone || 'Sem telefone'}</span>
                    </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{store.managerName || 'Sem gerente'}</span>
                    </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>{store._count?.users || 0} funcionários</span>
                          <span>{store._count?.products || 0} produtos</span>
                  </div>
                </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                  </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditStore(store.id)}
                        >
                          <Edit className="h-4 w-4" />
                  </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteStore(store.id)}
                        >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
                  </div>
                </CardContent>
            </Card>
          ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loja
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localização
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gerente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Funcionários
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredStores().map((store: any) => (
                      <tr key={store.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#3e2626] rounded-lg flex items-center justify-center mr-3">
                              <Store className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {store.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {store.phone || 'Sem telefone'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{store.city}, {store.state}</div>
                          <div className="text-sm text-gray-500">{store.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{store.managerName || 'Sem gerente'}</div>
                          <div className="text-sm text-gray-500">{store.managerEmail || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{store._count?.users || 0}</div>
                          <div className="text-sm text-gray-500">funcionários</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={store.isActive ? 'default' : 'secondary'}
                            className={store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {store.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditStore(store.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteStore(store.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Nova Loja */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Nova Loja</CardTitle>
                  <CardDescription className="text-white/80">
                    Preencha os dados para criar uma nova loja
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Loja *</Label>
                  <Input
                    id="name"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    placeholder="Digite o nome da loja"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newStore.phone}
                    onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço *</Label>
                  <Input
                    id="address"
                    value={newStore.address}
                    onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={newStore.city}
                    onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                    placeholder="Nome da cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={newStore.state}
                    onChange={(e) => setNewStore({ ...newStore, state: e.target.value })}
                    placeholder="SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={newStore.zipCode}
                    onChange={(e) => setNewStore({ ...newStore, zipCode: e.target.value })}
                    placeholder="01234-567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email da Loja</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStore.email}
                    onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                    placeholder="loja@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerName">Nome do Gerente</Label>
                  <Input
                    id="managerName"
                    value={newStore.managerName}
                    onChange={(e) => setNewStore({ ...newStore, managerName: e.target.value })}
                    placeholder="Nome do gerente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerEmail">Email do Gerente</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={newStore.managerEmail}
                    onChange={(e) => setNewStore({ ...newStore, managerEmail: e.target.value })}
                    placeholder="gerente@empresa.com"
                  />
                </div>
        </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newStore.isActive}
                  onChange={(e) => setNewStore({ ...newStore, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-[#3e2626] focus:ring-[#3e2626]"
                />
                <Label htmlFor="isActive" className="text-sm">
                  Loja ativa
                </Label>
              </div>
            </CardContent>
            <div className="flex items-center justify-end space-x-3 p-6 border-t">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateStore}
                disabled={isCreating}
                className="bg-[#3e2626] hover:bg-[#4a2f2f]"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Loja
                  </>
                )}
              </Button>
            </div>
          </Card>
          </div>
        )}
=======
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-[#3e2626]">{stores.length}</p>
                <p className="text-xs text-[#3e2626]/70">Lojas cadastradas</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Store className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Ativas</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {stores.filter(s => s.isActive).length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Em operação</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Funcionários</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {stores.reduce((sum, store) => sum + (store._count?.users || 0), 0)}
                </p>
                <p className="text-xs text-[#3e2626]/70">Total de colaboradores</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Produtos</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {stores.reduce((sum, store) => sum + (store._count?.products || 0), 0)}
                </p>
                <p className="text-xs text-[#3e2626]/70">Em estoque</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <label className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Buscar lojas
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3e2626]/60 h-5 w-5" />
                <Input
                  placeholder="Digite nome ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-2 border-[#3e2626]/20 rounded-xl focus:border-[#3e2626] focus:ring-0 text-lg bg-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-56">
              <label className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
              >
                <option value="all">Todas as lojas</option>
                <option value="active">Apenas ativas</option>
                <option value="inactive">Apenas inativas</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="lg:w-48">
              <label className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Visualização
              </label>
              <div className="flex bg-[#3e2626]/5 rounded-xl p-1 border border-[#3e2626]/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-[#3e2626] text-white shadow-sm' 
                      : 'text-[#3e2626]/70 hover:text-[#3e2626]'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-[#3e2626] text-white shadow-sm' 
                      : 'text-[#3e2626]/70 hover:text-[#3e2626]'
                  }`}
                >
                  <List className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <Button
                variant="outline"
                className="flex items-center space-x-2 h-12 px-6 border-2 border-[#3e2626]/20 rounded-xl hover:border-[#3e2626] hover:text-[#3e2626] text-[#3e2626]/70"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores Display */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#3e2626]">Lista de Lojas</CardTitle>
              <CardDescription className="text-lg text-[#3e2626]/70">
                {filteredStores.length} loja(s) encontrada(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {filteredStores.length > 0 ? (
            viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map((store) => {
                  const StatusIcon = getStatusIcon(store.isActive);
                  return (
                    <div key={store.id} className="bg-gradient-to-br from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-xl hover:border-[#3e2626] transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                            <Store className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#3e2626] text-lg">{store.name}</h3>
                            <p className="text-[#3e2626]/70 text-sm">{store.city}, {store.state}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-[#3e2626]/70">
                          <MapPin className="h-4 w-4 mr-2" />
                          {store.address}
                        </div>
                        
                        <div className="flex items-center text-sm text-[#3e2626]/70">
                          <Phone className="h-4 w-4 mr-2" />
                          {store.phone}
                        </div>
                        
                        {store.email && (
                          <div className="flex items-center text-sm text-[#3e2626]/70">
                            <Mail className="h-4 w-4 mr-2" />
                            {store.email}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#3e2626]/10">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-[#3e2626]">{store._count?.users || 0}</p>
                            <p className="text-xs text-[#3e2626]/70">Funcionários</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-[#3e2626]">{store._count?.products || 0}</p>
                            <p className="text-xs text-[#3e2626]/70">Produtos</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-[#3e2626]/10">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className={`h-4 w-4 ${store.isActive ? 'text-green-500' : 'text-red-500'}`} />
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(store.isActive)}`}>
                              {store.isActive ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              console.log('Navegando para loja:', store.id);
                              router.push(`/admin/stores/${store.id}`);
                            }}
                            className="rounded-xl hover:bg-[#3e2626] hover:text-white text-[#3e2626] border-[#3e2626]/20"
                          >
                            Gerenciar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {filteredStores.map((store) => {
                  const StatusIcon = getStatusIcon(store.isActive);
                  return (
                    <div key={store.id} className="bg-gradient-to-r from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-lg hover:border-[#3e2626] transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                            <Store className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-bold text-[#3e2626] text-lg">{store.name}</h3>
                              <div className="flex items-center space-x-2">
                                <StatusIcon className={`h-4 w-4 ${store.isActive ? 'text-green-500' : 'text-red-500'}`} />
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(store.isActive)}`}>
                                  {store.isActive ? 'Ativa' : 'Inativa'}
                                </span>
                              </div>
                            </div>
                            <p className="text-[#3e2626]/70 text-sm mt-1">{store.city}, {store.state}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center text-sm text-[#3e2626]/70">
                                <MapPin className="h-4 w-4 mr-1" />
                                {store.address}
                              </div>
                              <div className="flex items-center text-sm text-[#3e2626]/70">
                                <Phone className="h-4 w-4 mr-1" />
                                {store.phone}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-[#3e2626]">{store._count?.users || 0}</p>
                            <p className="text-xs text-[#3e2626]/70">Funcionários</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-[#3e2626]">{store._count?.products || 0}</p>
                            <p className="text-xs text-[#3e2626]/70">Produtos</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              console.log('Navegando para loja:', store.id);
                              router.push(`/admin/stores/${store.id}`);
                            }}
                            className="rounded-xl hover:bg-[#3e2626] hover:text-white text-[#3e2626] border-[#3e2626]/20"
                          >
                            Gerenciar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-[#3e2626]/10 to-[#3e2626]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="h-12 w-12 text-[#3e2626]/60" />
              </div>
              <h3 className="text-2xl font-bold text-[#3e2626] mb-3">Nenhuma loja encontrada</h3>
              <p className="text-[#3e2626]/70 text-lg mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Tente ajustar os filtros para encontrar lojas.'
                  : 'Não há lojas cadastradas no sistema.'
                }
              </p>
              <Button
                onClick={() => router.push('/admin/stores/new')}
                className="bg-[#3e2626] hover:bg-[#2a1a1a] text-white px-6 py-3 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira loja
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
>>>>>>> Stashed changes
    </div>
  );
}