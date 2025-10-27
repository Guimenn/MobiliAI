'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Store, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Phone, 
  Mail,
  Users,
  Package,
  DollarSign,
  Calendar,
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
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'status' | 'created'>('name');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setIsLoading(true);
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
        storesArray.map(async (store: any) => {
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
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && store.isActive) ||
                         (filterStatus === 'inactive' && !store.isActive);
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircle : AlertCircle;
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
              <Plus className="h-4 w-4 mr-2" />
              Nova Loja
            </Button>
          </div>
        </div>
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
    </div>
  );
}