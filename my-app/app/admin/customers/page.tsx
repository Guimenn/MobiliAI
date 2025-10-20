'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import CustomerViewModal from '@/components/CustomerViewModal';
import { 
  Users, 
  Search, 
  Eye, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
  Filter,
  ShoppingBag,
  Heart,
  Star,
  TrendingUp,
  RefreshCw,
  UserPlus,
  Shield,
  UserCheck,
  Grid3X3,
  Menu,
  X,
  Download,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  cpf?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
  // Dados relacionados que virão da API
  purchases?: any[];
  favorites?: any[];
  cartItems?: any[];
  reviews?: any[];
  _count?: {
    purchases: number;
    favorites: number;
    reviews: number;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para filtros (baseado no design de usuários)
  const [customerFilters, setCustomerFilters] = useState({
    status: 'all',
    search: ''
  });
  
  // Estados para modal de novo cliente
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cpf: '',
    isActive: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      // Buscar clientes usando o endpoint específico
      const data = await adminAPI.getCustomers();
      setCustomers(data.customers || data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      // Dados mock para desenvolvimento
      setCustomers([
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          cpf: '123.456.789-00',
          isActive: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          role: 'CUSTOMER',
          _count: {
            purchases: 5,
            favorites: 12,
            reviews: 3
          }
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '(11) 88888-8888',
          address: 'Av. Paulista, 456',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          isActive: true,
          createdAt: '2024-02-10T14:30:00Z',
          updatedAt: '2024-02-10T14:30:00Z',
          role: 'CUSTOMER',
          _count: {
            purchases: 8,
            favorites: 25,
            reviews: 6
          }
        },
        {
          id: '3',
          name: 'Pedro Costa',
          email: 'pedro@email.com',
          phone: '(11) 77777-7777',
          isActive: false,
          createdAt: '2024-03-05T09:15:00Z',
          updatedAt: '2024-03-05T09:15:00Z',
          role: 'CUSTOMER',
          _count: {
            purchases: 2,
            favorites: 5,
            reviews: 1
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar novo cliente
  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsCreating(true);
    try {
      // Aqui você pode integrar com a API real
      // const response = await adminAPI.createCustomer(newCustomer);
      
      // Simulação de criação de cliente
      console.log('Criando cliente:', newCustomer);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Cliente criado com sucesso!');
      setIsCreateModalOpen(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        cpf: '',
        isActive: true
      });
      
      // Recarregar a página para mostrar o novo cliente
      window.location.reload();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      alert('Erro ao criar cliente. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  // Função para fechar modal
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      cpf: '',
      isActive: true
    });
  };

  // Função para filtrar clientes
  const getFilteredCustomers = () => {
    if (!Array.isArray(customers)) return [];
    
    return customers
      .filter((customer: any, index: number, self: any[]) => 
        index === self.findIndex((c: any) => c.email === customer.email)
      )
      .filter((customer: any) => {
        // Filtro por status
        if (customerFilters.status !== 'all') {
          if (customerFilters.status === 'active' && !customer.isActive) return false;
          if (customerFilters.status === 'inactive' && customer.isActive) return false;
        }
        
        // Filtro por busca
        if (customerFilters.search) {
          const searchTerm = customerFilters.search.toLowerCase();
          return (
            customer.name?.toLowerCase().includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => {
        // Ordenar por nome
        return a.name?.localeCompare(b.name) || 0;
      });
  };

  const handleViewCustomer = async (customer: Customer) => {
    try {
      // Buscar dados detalhados do cliente
      const detailedCustomer = await adminAPI.getCustomerById(customer.id);
      setSelectedCustomer(detailedCustomer);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes do cliente:', error);
      // Usar dados mock para desenvolvimento
      setSelectedCustomer({
        ...customer,
        purchases: [
          {
            id: '1',
            saleNumber: 'VND-001',
            totalAmount: 1250.00,
            status: 'COMPLETED',
            paymentMethod: 'PIX',
            createdAt: '2024-01-20T10:00:00Z',
            items: [
              {
                id: '1',
                quantity: 1,
                unitPrice: 1250.00,
                totalPrice: 1250.00,
                product: {
                  name: 'Sofá 3 Lugares',
                  category: 'SOFA'
                }
              }
            ]
          }
        ],
        favorites: [
          {
            id: '1',
            createdAt: '2024-01-15T10:00:00Z',
            product: {
              name: 'Mesa de Jantar',
              price: 899.90,
              category: 'MESA'
            }
          }
        ],
        reviews: [
          {
            id: '1',
            rating: 5,
            title: 'Excelente produto!',
            comment: 'Muito satisfeito com a compra, produto de ótima qualidade.',
            createdAt: '2024-01-25T10:00:00Z',
            product: {
              name: 'Sofá 3 Lugares'
            }
          }
        ]
      });
      setIsModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"> 
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
                  <p className="text-white/80 text-lg">Gerencie clientes e suas informações do sistema</p>
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
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white text-[#3e2626] hover:bg-white/90 font-semibold px-6 py-2 rounded-xl"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Brand Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total de Clientes</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {customers.length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Cadastrados</p>
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
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Clientes Ativos</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {customers.filter((c: any) => c.isActive).length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Ativos no sistema</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total de Compras</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {customers.reduce((sum, c) => sum + (c._count?.purchases || 0), 0)}
                </p>
                <p className="text-xs text-[#3e2626]/70">Realizadas</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Favoritos</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {customers.reduce((sum, c) => sum + (c._count?.favorites || 0), 0)}
                </p>
                <p className="text-xs text-[#3e2626]/70">Produtos favoritos</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Buscar clientes
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3e2626]/60 h-5 w-5" />
                <Input
                  id="search"
                  placeholder="Digite nome ou email..."
                  value={customerFilters.search}
                  onChange={(e) => setCustomerFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-12 h-12 border-2 border-[#3e2626]/20 rounded-xl focus:border-[#3e2626] focus:ring-0 text-lg bg-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-56">
              <Label htmlFor="status" className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Status
              </Label>
              <select
                id="status"
                value={customerFilters.status}
                onChange={(e) => setCustomerFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-[#3e2626]/20 rounded-xl focus:outline-none focus:ring-0 focus:border-[#3e2626] text-lg font-medium bg-white"
              >
                <option value="all">Todos os status</option>
                <option value="active">Apenas ativos</option>
                <option value="inactive">Apenas inativos</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="lg:w-48">
              <Label className="text-sm font-semibold text-[#3e2626] mb-3 block">
                Visualização
              </Label>
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
                  <Menu className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setCustomerFilters({ status: 'all', search: '' })}
                className="flex items-center space-x-2 h-12 px-6 border-2 border-[#3e2626]/20 rounded-xl hover:border-[#3e2626] hover:text-[#3e2626] text-[#3e2626]/70"
              >
                <X className="h-4 w-4" />
                <span>Limpar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Display Section */}
      <Card className="bg-white border-2 border-[#3e2626]/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl border-b border-[#3e2626]/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#3e2626]">Lista de Clientes</CardTitle>
              <CardDescription className="text-lg text-[#3e2626]/70">
                {getFilteredCustomers().length} cliente(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="border-2 border-[#3e2626]/20 rounded-xl px-4 py-2 text-[#3e2626] hover:bg-[#3e2626] hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {getFilteredCustomers().length > 0 ? (
            viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredCustomers().map((customer: any) => (
                  <div key={customer.id} className="bg-gradient-to-br from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-xl hover:border-[#3e2626] transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] text-white font-bold text-lg">
                              {customer.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${
                            customer.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-[#3e2626] text-lg">{customer.name}</h3>
                          <p className="text-[#3e2626]/70 text-sm">{customer.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20 px-3 py-1 rounded-full text-xs font-semibold">
                          Cliente
                        </Badge>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          customer.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {customer.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-[#3e2626]/10">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/20">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {getFilteredCustomers().map((customer: any) => (
                  <div key={customer.id} className="bg-gradient-to-r from-white to-[#3e2626]/5 border-2 border-[#3e2626]/10 rounded-2xl p-6 hover:shadow-lg hover:border-[#3e2626] transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="w-14 h-14 border-4 border-white shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] text-white font-bold">
                              {customer.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                            customer.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-[#3e2626] text-lg">{customer.name}</h3>
                            <Badge className="bg-[#3e2626]/10 text-[#3e2626] border border-[#3e2626]/20 px-3 py-1 rounded-full text-xs font-semibold">
                              Cliente
                            </Badge>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              customer.isActive 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {customer.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-[#3e2626]/70 text-sm mt-1">{customer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 hover:border-[#3e2626] text-[#3e2626] border-[#3e2626]/20">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl hover:bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/20">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-[#3e2626]/10 to-[#3e2626]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-[#3e2626]/60" />
              </div>
              <h3 className="text-2xl font-bold text-[#3e2626] mb-3">Nenhum cliente encontrado</h3>
              <p className="text-[#3e2626]/70 text-lg mb-6">
                {customerFilters.search || customerFilters.status !== 'all'
                  ? 'Tente ajustar os filtros para encontrar clientes.'
                  : 'Não há clientes cadastrados no sistema.'
                }
              </p>
              {(customerFilters.search || customerFilters.status !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => setCustomerFilters({ status: 'all', search: '' })}
                  className="px-6 py-3 rounded-xl border-2 border-[#3e2626]/20 hover:border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Novo Cliente */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center backdrop-blur-sm"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={handleCloseCreateModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', zIndex: 10000 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Cliente</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome completo"
                  className="mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Digite o email"
                  className="mt-1"
                />
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Digite o telefone"
                  className="mt-1"
                />
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={newCustomer.isActive}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-[#3e2626] focus:ring-[#3e2626] border-gray-300 rounded"
                />
                <Label htmlFor="isActive" className="text-sm text-gray-700">
                  Cliente ativo
                </Label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseCreateModal}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCustomer}
                disabled={isCreating}
                className="bg-[#3e2626] hover:bg-[#2a1a1a] text-white"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Cliente'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customer View Modal */}
      <CustomerViewModal
        customer={selectedCustomer}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(null);
        }}
      />
    </div>
  );
}