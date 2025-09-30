'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ArrowLeft,
  User,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isActive: boolean;
}

export default function UserRolesPage() {
  const { user, isAuthenticated, token } = useAppStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchRoles();
  }, [isAuthenticated, user, router]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        // Mock data para demonstração
        setRoles([
          {
            id: '1',
            name: 'Administrador',
            description: 'Acesso total ao sistema',
            permissions: ['all'],
            userCount: 1,
            isActive: true
          },
          {
            id: '2',
            name: 'Gerente de Loja',
            description: 'Gerencia uma loja específica',
            permissions: ['store_management', 'employee_management', 'sales_view'],
            userCount: 3,
            isActive: true
          },
          {
            id: '3',
            name: 'Vendedor/Caixa',
            description: 'Opera o PDV e vende produtos',
            permissions: ['sales_management', 'product_view'],
            userCount: 8,
            isActive: true
          }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionBadge = (permission: string) => {
    const permissionMap: { [key: string]: { label: string; color: string } } = {
      'all': { label: 'Todos', color: 'bg-red-100 text-red-800' },
      'store_management': { label: 'Gestão de Lojas', color: 'bg-blue-100 text-blue-800' },
      'employee_management': { label: 'Gestão de Funcionários', color: 'bg-green-100 text-green-800' },
      'sales_view': { label: 'Visualizar Vendas', color: 'bg-purple-100 text-purple-800' },
      'sales_management': { label: 'Gerenciar Vendas', color: 'bg-orange-100 text-orange-800' },
      'product_view': { label: 'Visualizar Produtos', color: 'bg-yellow-100 text-yellow-800' }
    };

    const perm = permissionMap[permission] || { label: permission, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={perm.color}>{perm.label}</Badge>;
  };

  if (!isAuthenticated || !user) {
    return <div>Carregando...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p>Carregando perfis de acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => router.push('/admin/users')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Perfis de Acesso</h1>
                <p className="text-sm text-gray-600">Gerenciar perfis e permissões</p>
              </div>
            </div>
            <Button onClick={() => router.push('/admin/users/roles/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Perfil
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>{role.name}</span>
                  </CardTitle>
                  <Badge variant={role.isActive ? "default" : "secondary"}>
                    {role.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Permissões */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Permissões:</h4>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission, index) => (
                        <div key={index}>
                          {getPermissionBadge(permission)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center space-x-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{role.userCount}</p>
                        <p className="text-xs text-gray-500">Usuários</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/users/roles/${role.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/users/roles/${role.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumo */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resumo dos Perfis</CardTitle>
            <CardDescription>Estatísticas dos perfis de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{roles.length}</p>
                <p className="text-sm text-gray-500">Total de Perfis</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {roles.filter(r => r.isActive).length}
                </p>
                <p className="text-sm text-gray-500">Perfis Ativos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {roles.reduce((sum, role) => sum + role.userCount, 0)}
                </p>
                <p className="text-sm text-gray-500">Total de Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
