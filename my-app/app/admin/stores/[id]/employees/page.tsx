'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Users,
  Edit,
  Clock,
  Calendar,
  FileText,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';

export default function EmployeesPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const { token } = useAppStore();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [store, setStore] = useState<any>(null);

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

  const sortedEmployees = employees.sort((a, b) => {
    const orderA = getHierarchyOrder(a.role);
    const orderB = getHierarchyOrder(b.role);
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  useEffect(() => {
    if (storeId && token) {
      loadStoreDetails();
      loadEmployees();
    }
  }, [storeId, token]);

  const loadStoreDetails = async () => {
    try {
      const storeData = await adminAPI.getStore(storeId, token);
      setStore(storeData);
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const employeesData = await adminAPI.getStoreEmployees(storeId, token);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'STORE_MANAGER':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'EMPLOYEE':
      case 'CASHIER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'STORE_MANAGER') return 'Gerente';
    return 'Funcionário';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/stores/${storeId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Loja
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-6 w-6 text-[#3e2626]" />
              <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
            </div>
            <p className="text-gray-600">
              {store ? `Gerencie os funcionários da loja ${store.name}` : 'Gerencie os funcionários desta loja'}
            </p>
          </div>
          
          <Button 
            onClick={() => router.push(`/admin/stores/${storeId}/employee/new`)}
            className="bg-[#3e2626] hover:bg-[#8B4513]"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Funcionário
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
          <CardDescription>
            Funcionários organizados por hierarquia (Gerente → Supervisor → Vendedor → etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando funcionários...</p>
            </div>
          ) : employees.length === 0 ? (
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
          ) : (
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
                        <Badge variant="outline" className={getRoleBadgeStyle(employee.role)}>
                          {getRoleLabel(employee.role)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
