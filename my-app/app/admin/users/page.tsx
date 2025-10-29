'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
import HydrationBoundary from '@/components/HydrationBoundary';
import NoSSR from '@/components/NoSSR';
import UserAvatarUpload from '@/components/UserAvatarUpload';
import { 
  Users, 
  Store,      
  Building,
  UserCheck,
  Search, 
  UserPlus,
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw,
  X,
  FileText,
  User,
  Grid3X3,
  Shield,
  MapPin,
  Phone,
  Settings
} from 'lucide-react';
import EditUserModal from '@/components/EditUserModal';
import ViewUserModal from '@/components/ViewUserModal';
import DeleteUserConfirmDialog from '@/components/DeleteUserConfirmDialog';
import { formatCPF, formatCEP, formatPhone, formatState, formatCity, formatAddress, formatName, formatEmail } from '@/lib/input-utils';
import { toast } from 'sonner';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUsersData();
  }, []);

  // Atualizar dados a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadUsersData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadUsersData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Carregando dados de usuários do banco...');
      
      // Carregar dados reais da API
      const [usersData, storesData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getStores()
      ]);

          console.log('Dados de usuários recebidos:', usersData);
      console.log('Dados de lojas recebidos:', storesData);
          
          // Verificar se os dados estão em usersData.users ou se é um array direto
      const usersArray = Array.isArray(usersData) ? usersData : (usersData?.users || []);
      setUsers(usersArray);
          
          // Verificar se os dados estão em storesData.stores ou se é um array direto
      const storesArray = Array.isArray(storesData) ? storesData : (storesData?.stores || []);
      setStores(storesArray);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleEditUserModal = (user: any) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (userId: string, userData: any) => {
    try {
      // Usar fetch direto para atualizar usuário
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        await loadUsersData(); // Recarregar a lista
        setIsEditModalOpen(false);
        setEditingUser(null);
        toast.success('Usuário atualizado com sucesso!', {
          description: `${userData.name} foi atualizado.`,
          duration: 4000,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário', {
        description: error.message || 'Tente novamente mais tarde.',
        duration: 4000,
      });
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleViewUser = (user: any) => {
    setViewingUser(user);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingUser(null);
  };

  const handleEditFromView = (user: any) => {
    setViewingUser(null);
    setIsViewModalOpen(false);
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  // Abrir modal de confirmação de exclusão
  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      console.log('Deletando usuário:', userToDelete.id);
      const response = await fetch(`http://localhost:3001/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Usuário deletado com sucesso!', {
          description: `${userToDelete.name} foi removido do sistema.`,
          duration: 4000,
        });
        loadUsersData();
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        const errorData = await response.json();
        toast.error('Erro ao deletar usuário', {
          description: errorData.message || 'Erro desconhecido',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao deletar usuário', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancelar exclusão
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6">
            <UsersSection 
              users={users}
              isLoading={isLoading}
              stores={stores}
              token={token}
              onUsersChange={loadUsersData}
              onViewUser={handleViewUser}
              onEditUser={handleEditUserModal}
              onDeleteUser={handleDeleteUser}
          />

      {/* Modal de Edição */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        user={editingUser}
        onSave={handleSaveUser}
      />

      {/* Modal de Visualização */}
      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        user={viewingUser}
        stores={stores}
        onEdit={handleEditFromView}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteUserConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        userName={userToDelete?.name || ''}
        userRole={userToDelete?.role}
        isLoading={isDeleting}
      />
    </div>
  );
}

// Componente da seção de usuários - código exato do dashboard
function UsersSection({ users, isLoading, stores, token, onUsersChange, onViewUser, onEditUser, onDeleteUser }: any) {
  // Estados para filtros
  const [userFilters, setUserFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });


  // Estados para modal de novo usuário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
    isActive: true,
    cpf: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    storeId: '',
    avatarUrl: ''
  });
  const [userAvatar, setUserAvatar] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Função para lidar com mudanças nos inputs com formatação
  const handleInputChange = (field: string, value: string) => {
    // Formatar valor baseado no campo
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
      case 'cpf':
        formattedValue = formatCPF(value);
        break;
      default:
        formattedValue = value;
    }
    
    setNewUser({ ...newUser, [field]: formattedValue });
  };

  // Função para criar novo usuário
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Campos obrigatórios', {
        description: 'Nome, e-mail e senha são obrigatórios.',
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      console.log('Criando usuário no banco:', newUser);
      
       // Preparar dados para envio
       const userData = {
         name: newUser.name,
         email: newUser.email,
         password: newUser.password,
         role: newUser.role,
         isActive: newUser.isActive,
         cpf: newUser.cpf,
         phone: newUser.phone,
         address: newUser.address,
         city: newUser.city,
         state: newUser.state,
         zipCode: newUser.zipCode,
         storeId: newUser.storeId || null,
         avatarUrl: newUser.avatarUrl
       };

      console.log('Dados do usuário a serem enviados:', userData);

       // Chamar API para criar usuário
       const createdUser = await adminAPI.createUser(userData);
         console.log('Usuário criado com sucesso:', createdUser);
         
         // Upload do avatar se fornecido
         if (userAvatar) {
           console.log('Enviando avatar:', userAvatar.name);
           try {
             const { uploadUserAvatar } = await import('@/lib/supabase');
             const avatarUrl = await uploadUserAvatar(userAvatar, createdUser.id);
             
             if (avatarUrl) {
               console.log('Avatar enviado com sucesso:', avatarUrl);
               // Atualizar o usuário com a URL do avatar
               await adminAPI.updateUser(createdUser.id, { avatarUrl });
               console.log('Usuário atualizado com avatar');
             }
           } catch (error) {
             console.error('Erro ao fazer upload do avatar:', error);
             // Não falhar a criação do usuário por causa do avatar
           }
         }
        
        toast.success('Usuário criado com sucesso!', {
          description: `${createdUser.name} foi adicionado ao sistema.`,
          duration: 4000,
        });
        setIsModalOpen(false);
         setNewUser({
           name: '',
           email: '',
           password: '',
           role: 'CASHIER',
           isActive: true,
           cpf: '',
           phone: '',
           address: '',
           city: '',
           state: '',
           zipCode: '',
           storeId: '',
           avatarUrl: ''
         });
        setUserAvatar(null);
        
        // Recarregar dados do banco
        onUsersChange();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário', {
        description: 'Verifique os dados e tente novamente.',
        duration: 4000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
         setNewUser({
           name: '',
           email: '',
           password: '',
           role: 'CASHIER',
           isActive: true,
           cpf: '',
           phone: '',
           address: '',
           city: '',
           state: '',
           zipCode: '',
           storeId: '',
           avatarUrl: ''
         });
    setUserAvatar(null);
  };

  // Função para editar usuário
  const handleEditUserById = async (userId: string) => {
    try {
      console.log('Editando usuário:', userId);
      
      // Buscar dados completos do usuário
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        onEditUser(userData);
      } else {
        throw new Error('Erro ao buscar dados do usuário');
      }
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      toast.error('Erro ao carregar dados do usuário', {
        description: 'Tente novamente mais tarde.',
        duration: 3000,
      });
    }
  };


  // Função para filtrar usuários
  const getFilteredUsers = () => {
    if (!Array.isArray(users)) return [];
    
    return users
      .filter((user: any, index: number, self: any[]) => 
        index === self.findIndex((u: any) => u.email === user.email)
      )
      .filter((user: any) => {
        // Filtro por role
        if (userFilters.role !== 'all' && user.role !== userFilters.role) {
          return false;
        }
        
        // Filtro por status
        if (userFilters.status !== 'all') {
          if (userFilters.status === 'active' && !user.isActive) return false;
          if (userFilters.status === 'inactive' && user.isActive) return false;
        }
        
        // Filtro por busca
        if (userFilters.search) {
          const searchTerm = userFilters.search.toLowerCase();
          return (
            user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => {
        const roleOrder = { 'ADMIN': 0, 'STORE_MANAGER': 1, 'CASHIER': 2, 'CUSTOMER': 3 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 4) - (roleOrder[b.role as keyof typeof roleOrder] || 4);
      });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
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
                  <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
                  <p className="text-white/80 text-lg">Gerencie funcionários, gerentes e clientes do sistema</p>
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
                <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
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
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Administradores</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {users.filter((u: any) => u.role === 'ADMIN').length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Acesso total</p>
                </div>
              <div className="w-12 h-12 bg-[#3e2626]/10 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-[#3e2626]" />
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-2 border-blue-500/20 shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Gerentes</p>
                <p className="text-3xl font-bold text-blue-600">
                  {users.filter((u: any) => u.role === 'STORE_MANAGER').length}
                </p>
                <p className="text-xs text-blue-600/70">Por loja</p>
                </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/20 shadow-lg hover:shadow-xl hover:border-green-500/30 transition-all duration-300">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Caixas</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter((u: any) => u.role === 'CASHIER').length}
                </p>
                <p className="text-xs text-green-600/70">Ativos</p>
                </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-2 border-purple-500/20 shadow-lg hover:shadow-xl hover:border-purple-500/30 transition-all duration-300">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Clientes</p>
                <p className="text-3xl font-bold text-purple-600">
                  {users.filter((u: any) => u.role === 'CUSTOMER').length}
                </p>
                <p className="text-xs text-purple-600/70">Cadastrados</p>
                </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600" />
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
                <Label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
                  Função:
                </Label>
                <select
                  id="role-filter"
                  value={userFilters.role}
                  onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                >
                  <option value="all">Todas</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="STORE_MANAGER">Gerente</option>
                  <option value="CASHIER">Caixa</option>
                  <option value="CUSTOMER">Cliente</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                  Status:
                </Label>
                <select
                  id="status-filter"
                  value={userFilters.status}
                  onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuários..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
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

      {/* Lista de Usuários */}
      <div className="space-y-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredUsers().map((user: any) => (
              <Card key={user.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 p-6">
                   <div className="flex items-center space-x-4">
                       <Avatar className="h-12 w-12">
                         {user.avatarUrl ? (
                           <img 
                             src={user.avatarUrl} 
                             alt={user.name}
                             className="w-full h-full object-cover rounded-full"
                           />
                         ) : (
                           <AvatarFallback className="bg-[#3e2626] text-white text-lg font-semibold">
                             {user.name?.charAt(0) || 'U'}
                           </AvatarFallback>
                         )}
                       </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={user.role === 'ADMIN' ? 'default' : 
                                   user.role === 'STORE_MANAGER' ? 'secondary' : 
                                   user.role === 'CASHIER' ? 'outline' : 'destructive'}
                            className="text-xs"
                          >
                            {user.role === 'ADMIN' ? 'Admin' :
                             user.role === 'STORE_MANAGER' ? 'Gerente' :
                             user.role === 'CASHIER' ? 'Caixa' : 'Cliente'}
                        </Badge>
                          <Badge 
                            variant={user.isActive ? 'default' : 'secondary'}
                            className={`text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      </div>
                    </div>
                        </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{user.phone || 'Não informado'}</span>
                          </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{user.city}, {user.state}</span>
                      </div>
                      {user.storeId && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Store className="h-4 w-4" />
                          <span>Loja: {stores.find((s: any) => s.id === user.storeId)?.name || 'N/A'}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                   <div className="flex items-center space-x-2">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                           onClick={() => onViewUser(user)}
                           title="Visualizar usuário"
                         >
                       <Eye className="h-4 w-4" />
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => handleEditUserById(user.id)}
                       title="Editar usuário"
                     >
                       <Edit className="h-4 w-4" />
                     </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                           onClick={() => onDeleteUser(user.id)}
                           title="Deletar usuário"
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
                        Usuário
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Função
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loja
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredUsers().map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center">
                             <Avatar className="h-10 w-10">
                               {user.avatarUrl ? (
                                 <img 
                                   src={user.avatarUrl} 
                                   alt={user.name}
                                   className="w-full h-full object-cover rounded-full"
                                 />
                               ) : (
                                 <AvatarFallback className="bg-[#3e2626] text-white">
                                   {user.name?.charAt(0) || 'U'}
                                 </AvatarFallback>
                               )}
                             </Avatar>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={user.role === 'ADMIN' ? 'default' : 
                                   user.role === 'STORE_MANAGER' ? 'secondary' : 
                                   user.role === 'CASHIER' ? 'outline' : 'destructive'}
                          >
                            {user.role === 'ADMIN' ? 'Admin' :
                             user.role === 'STORE_MANAGER' ? 'Gerente' :
                             user.role === 'CASHIER' ? 'Caixa' : 'Cliente'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={user.isActive ? 'default' : 'secondary'}
                            className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.storeId ? stores.find((s: any) => s.id === user.storeId)?.name || 'N/A' : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   <div className="flex items-center space-x-2">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                               onClick={() => onViewUser(user)}
                               title="Visualizar usuário"
                             >
                       <Eye className="h-4 w-4" />
                     </Button>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-8 w-8 p-0"
                               onClick={() => handleEditUserById(user.id)}
                               title="Editar usuário"
                             >
                       <Edit className="h-4 w-4" />
                     </Button>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                               onClick={() => onDeleteUser(user.id)}
                               title="Deletar usuário"
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

      {/* Modal de Novo Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Novo Usuário</CardTitle>
                  <CardDescription className="text-white/80">
                    Preencha os dados para criar um novo usuário
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
            <CardContent className="p-6 space-y-8">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="joao@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={newUser.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
              </div>

              {/* Informações Profissionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Informações Profissionais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                    >
                      <option value="CASHIER">Caixa</option>
                      <option value="STORE_MANAGER">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="CUSTOMER">Cliente</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeId">Loja</Label>
                    <select
                      id="storeId"
                      value={newUser.storeId}
                      onChange={(e) => setNewUser({ ...newUser, storeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                    >
                      <option value="">Selecione uma loja</option>
                      {stores.map((store: any) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Informações Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={newUser.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={newUser.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Rua, número"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={newUser.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={newUser.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="SP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={newUser.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="01234-567"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar e Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Avatar e Status
                </h3>
                <div className="space-y-2">
                  <UserAvatarUpload
                    onAvatarChange={setUserAvatar}
                    avatar={userAvatar}
                    onAvatarUploaded={(url) => {
                      setNewUser({ ...newUser, avatarUrl: url });
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newUser.isActive}
                    onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-[#3e2626] focus:ring-[#3e2626]"
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    Usuário ativo
                  </Label>
                </div>
              </div>
            </CardContent>
            <div className="flex items-center justify-end space-x-3 p-6 border-t">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateUser}
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
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </div>
        </Card>
      </div>
      )}

    </div>
  );
}