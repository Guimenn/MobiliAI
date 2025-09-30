'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { adminAPI } from '@/lib/api-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Shield,
  Store,
  Calendar
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  store?: {
    id: string;
    name: string;
  };
}

export default function AdminUsers() {
  const { user, isAuthenticated, token, isUserAuthenticated } = useAppStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (!isUserAuthenticated()) {
      router.push('/login');
      return;
    }

    if (user?.role?.toLowerCase() !== 'admin') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [isAuthenticated, user, router, isUserAuthenticated]);

  const fetchUsers = async () => {
    if (!token) {
      console.error('Token não disponível');
      setLoading(false);
      return;
    }

    try {
      const response = await adminAPI.getUsers(token);

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrador', variant: 'default' as const, color: 'bg-red-100 text-red-800' },
      store_manager: { label: 'Gerente', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      cashier: { label: 'Funcionário', variant: 'outline' as const, color: 'bg-green-100 text-green-800' },
      customer: { label: 'Cliente', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.customer;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
              <p className="text-sm text-gray-600">Gerencie todos os usuários do sistema</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/admin/users/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os perfis</option>
              <option value="admin">Administradores</option>
              <option value="store_manager">Gerentes</option>
              <option value="cashier">Funcionários</option>
              <option value="customer">Clientes</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Mais Filtros
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>
              {filteredUsers.length} usuário(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Perfil</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Loja</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Criado em</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-4 px-4">
                        {user.store ? (
                          <div className="flex items-center space-x-2">
                            <Store className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{user.store.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sem loja</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || roleFilter !== 'all' ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || roleFilter !== 'all'
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece criando seu primeiro usuário'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && (
              <Button onClick={() => router.push('/admin/users/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Usuário
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
