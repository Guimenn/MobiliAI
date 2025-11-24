'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus,
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw,
  Shield,
  UserCheck,
  ArrowUpRight,
} from 'lucide-react';
import EditUserModal from '@/components/EditUserModal';
import ViewUserModal from '@/components/ViewUserModal';
import DeleteUserConfirmDialog from '@/components/DeleteUserConfirmDialog';
import UserAvatarUpload from '@/components/UserAvatarUpload';
import { formatCPF, formatCEP, formatPhone, formatState, formatCity, formatAddress, formatName, formatEmail } from '@/lib/input-utils';

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

  const loadUsersData = async () => {
    try {
      setIsLoading(true);
      
      const [usersData, storesData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getStores()
      ]);

      const usersArray = Array.isArray(usersData) ? usersData : (usersData?.users || []);
      
      const filteredUsers = usersArray.filter((user: any) => 
        user.role === 'ADMIN' || 
        user.role === 'STORE_MANAGER' || 
        user.role === 'CASHIER' ||
        user.role === 'EMPLOYEE'
      );
      
      setUsers(filteredUsers);
      
      const storesArray = Array.isArray(storesData) ? storesData : (storesData?.stores || []);
      setStores(storesArray);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
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
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        setIsEditModalOpen(false);
        setEditingUser(null);
        toast.success('Usuário atualizado com sucesso!', {
          description: `${userData.name} foi atualizado.`,
        });
        setTimeout(() => {
          loadUsersData();
        }, 100);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar usuário');
      }
    } catch (error: any) {
      toast.error('Erro ao salvar usuário', {
        description: error.message || 'Tente novamente mais tarde.',
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

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
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
        });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        setTimeout(() => {
          loadUsersData();
        }, 100);
      } else {
        const errorData = await response.json();
        toast.error('Erro ao deletar usuário', {
          description: errorData.message || 'Erro desconhecido',
        });
      }
    } catch (error) {
      toast.error('Erro ao deletar usuário', {
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <UsersSection 
        users={users}
        stores={stores}
        token={token}
        onUsersChange={loadUsersData}
        onViewUser={handleViewUser}
        onEditUser={handleEditUserModal}
        onDeleteUser={handleDeleteUser}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        user={editingUser}
        onSave={handleSaveUser}
      />

      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        user={viewingUser}
        stores={stores}
        onEdit={handleEditFromView}
      />

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

function UsersSection({ users, stores, token, onUsersChange, onViewUser, onEditUser, onDeleteUser }: any) {
  const [userFilters, setUserFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

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

  const handleInputChange = (field: string, value: string) => {
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

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Campos obrigatórios', {
        description: 'Nome, e-mail e senha são obrigatórios.',
      });
      return;
    }

    const validRoles = ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'CUSTOMER', 'EMPLOYEE'];
    if (!newUser.role || !validRoles.includes(newUser.role)) {
      toast.error('Role inválido', {
        description: 'Selecione um role válido.',
      });
      return;
    }

    setIsCreating(true);
    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        isActive: newUser.isActive,
        cpf: newUser.cpf || undefined,
        phone: newUser.phone || undefined,
        address: newUser.address || undefined,
        city: newUser.city || undefined,
        state: newUser.state || undefined,
        zipCode: newUser.zipCode || undefined,
        storeId: newUser.storeId || undefined,
        avatarUrl: newUser.avatarUrl || undefined
      };

      const createdUser = await adminAPI.createUser(userData);
        
      if (userAvatar) {
        try {
          const { uploadUserAvatar } = await import('@/lib/supabase');
          const avatarUrl = await uploadUserAvatar(userAvatar, createdUser.id);
          
          if (avatarUrl) {
            await adminAPI.updateUser(createdUser.id, { avatarUrl });
          }
        } catch (error) {
          console.error('Erro ao fazer upload do avatar:', error);
        }
      }
        
      toast.success('Usuário criado com sucesso!', {
        description: `${createdUser.name} foi adicionado ao sistema.`,
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
        
      setTimeout(() => {
        onUsersChange();
      }, 100);
    } catch (error) {
      toast.error('Erro ao criar usuário', {
        description: 'Verifique os dados e tente novamente.',
      });
    } finally {
      setIsCreating(false);
    }
  };

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

  const handleEditUserById = async (userId: string) => {
    try {
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
      toast.error('Erro ao carregar dados do usuário', {
        description: 'Tente novamente mais tarde.',
      });
    }
  };

  const getFilteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    
    return users
      .filter((user: any, index: number, self: any[]) => 
        index === self.findIndex((u: any) => u.email === user.email)
      )
      .filter((user: any) => {
        if (user.role === 'CUSTOMER') {
          return false;
        }
        
        if (userFilters.role !== 'all' && user.role !== userFilters.role) {
          return false;
        }
        
        if (userFilters.status !== 'all') {
          if (userFilters.status === 'active' && !user.isActive) return false;
          if (userFilters.status === 'inactive' && user.isActive) return false;
        }
        
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
        const roleOrder = { 'ADMIN': 0, 'STORE_MANAGER': 1, 'CASHIER': 2, 'EMPLOYEE': 3 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 4) - (roleOrder[b.role as keyof typeof roleOrder] || 4);
      });
  }, [users, userFilters]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u: any) => u.role === 'ADMIN').length,
      managers: users.filter((u: any) => u.role === 'STORE_MANAGER').length,
      cashiers: users.filter((u: any) => u.role === 'CASHIER').length,
      employees: users.filter((u: any) => u.role === 'EMPLOYEE').length,
      active: users.filter((u: any) => u.isActive).length,
    };
  }, [users]);

  return (
    <>
      {/* Hero Section */}
      <section className="rounded-3xl border border-border bg-[#3e2626] px-8 py-10 text-primary-foreground shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <Badge
              variant="outline"
              className="border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
            >
              Gestão de Usuários
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Gerenciar Usuários
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Gerencie funcionários, gerentes e administradores do sistema. Controle permissões e acesso de cada usuário.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
              <Button
                variant="outline"
                className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={onUsersChange}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-4 sm:grid-cols-3 lg:max-w-2xl">
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.total}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Total</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <Shield className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.admins}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Admins</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <UserCheck className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.managers}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Gerentes</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.cashiers}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Caixas</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.employees}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Funcionários</p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
                <UserCheck className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold leading-tight">{stats.active}</p>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Ativos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <Card className="border border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar usuários por nome ou e-mail..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={userFilters.role}
                onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todas as funções</option>
                <option value="ADMIN">Administrador</option>
                <option value="STORE_MANAGER">Gerente</option>
                <option value="CASHIER">Caixa</option>
                <option value="EMPLOYEE">Funcionário</option>
              </select>
            </div>
            <div className="md:w-48">
              <select
                value={userFilters.status}
                onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {getFilteredUsers.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum usuário encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {userFilters.search || userFilters.role !== 'all' || userFilters.status !== 'all'
                ? 'Tente ajustar os filtros para encontrar usuários.'
                : 'Comece criando seu primeiro usuário.'}
            </p>
            {!userFilters.search && userFilters.role === 'all' && userFilters.status === 'all' && (
              <Button onClick={() => setIsModalOpen(true)} className="bg-[#3e2626] hover:bg-[#5a3a3a]">
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Primeiro Usuário
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {getFilteredUsers.map((user: any) => (
            <Card key={user.id} className="border border-border shadow-sm transition hover:shadow-md">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className="bg-muted text-foreground">
                          {user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {user.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline" 
                      className="border-border bg-muted/50 text-muted-foreground"
                    >
                      {user.role === 'ADMIN' ? 'Admin' :
                       user.role === 'STORE_MANAGER' ? 'Gerente' :
                       user.role === 'CASHIER' ? 'Caixa' :
                       user.role === 'EMPLOYEE' ? 'Funcionário' : user.role}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={
                        user.isActive 
                          ? 'border-border bg-muted/50 text-foreground' 
                          : 'border-border bg-muted/50 text-muted-foreground'
                      }
                    >
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {user.storeId && (
                    <div className="text-sm text-muted-foreground">
                      Loja: {stores.find((s: any) => s.id === user.storeId)?.name || 'N/A'}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onViewUser(user)}
                        title="Visualizar usuário"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
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
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
      )}

      {/* Modal de Novo Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-[#3e2626] text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Novo Usuário</CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    Preencha os dados para criar um novo usuário
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Informações Básicas</h3>
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
                    <Label htmlFor="phone">Telefone</Label>
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Informações Profissionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="CASHIER">Caixa</option>
                      <option value="STORE_MANAGER">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="EMPLOYEE">Funcionário</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeId">Loja</Label>
                    <select
                      id="storeId"
                      value={newUser.storeId}
                      onChange={(e) => setNewUser({ ...newUser, storeId: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Informações Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={newUser.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Avatar e Status</h3>
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
                    className="h-4 w-4"
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
                className="bg-[#3e2626] hover:bg-[#5a3a3a]"
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
    </>
  );
}
