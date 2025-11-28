'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { managerAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import ManagerEmployeeFormModal from '@/components/ManagerEmployeeFormModal';
import ManagerViewEmployeeModal from '@/components/ManagerViewEmployeeModal';
import ManagerEditEmployeeModal from '@/components/ManagerEditEmployeeModal';
import { 
  Users, 
  UserPlus,
  Search,
  Eye,
  Edit,
  Clock,
  Calendar,
  FileText,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Shield,
} from 'lucide-react';

export default function ManagerEmployeesPage() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const storeEmployees = await managerAPI.getStoreUsers(1, 100, '');
      
      if (storeEmployees.users) {
        setEmployees(storeEmployees.users);
      }
    } catch (err: any) {
      console.error('Erro ao buscar funcionários:', err);
      setError(err.response?.data?.message || 'Erro ao carregar funcionários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && user.role === 'STORE_MANAGER') {
      fetchEmployees();
    }
  }, [isAuthenticated, user]);

  const handleCreateEmployee = async (employeeData: any) => {
    await fetchEmployees();
  };

  const handleViewEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleSaveEmployee = async () => {
    await fetchEmployees();
  };

  if (!isAuthenticated || !user || user.role !== 'STORE_MANAGER') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EmployeesSection 
        employees={employees}
        onEmployeesChange={fetchEmployees}
        onViewEmployee={handleViewEmployee}
        onEditEmployee={handleEditEmployee}
        onNewEmployee={() => setIsModalOpen(true)}
        router={router}
      />

      <ManagerEmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEmployee}
        isLoading={false}
      />

      <ManagerViewEmployeeModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        employee={selectedEmployee}
        onEdit={handleEditEmployee}
      />

      <ManagerEditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        employee={selectedEmployee}
        onSave={handleSaveEmployee}
      />
    </div>
  );
}

function EmployeesSection({ employees, onEmployeesChange, onViewEmployee, onEditEmployee, onNewEmployee, router }: any) {
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  const getFilteredEmployees = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    
    return employees
      .filter((employee: any) => {
        if (filters.role !== 'all' && employee.role !== filters.role) {
          return false;
        }
        
        if (filters.status !== 'all') {
          if (filters.status === 'active' && !employee.isActive) return false;
          if (filters.status === 'inactive' && employee.isActive) return false;
        }
        
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          return (
            employee.name?.toLowerCase().includes(searchTerm) ||
            employee.email?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => {
        const roleOrder = { 'STORE_MANAGER': 0, 'CASHIER': 1, 'EMPLOYEE': 2 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 3) - (roleOrder[b.role as keyof typeof roleOrder] || 3);
      });
  }, [employees, filters]);

  const stats = useMemo(() => {
    return {
      total: employees.length,
      managers: employees.filter((e: any) => e.role === 'STORE_MANAGER').length,
      cashiers: employees.filter((e: any) => e.role === 'CASHIER').length,
      employees: employees.filter((e: any) => e.role === 'EMPLOYEE').length,
      active: employees.filter((e: any) => e.isActive).length,
    };
  }, [employees]);

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
              Gestão de Funcionários
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Gerenciar Funcionários
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Gerencie a equipe da sua loja. Controle funcionários, caixas e gerentes com acesso completo às informações e registros.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={onNewEmployee}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
              <Button
                variant="outline"
                className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={onEmployeesChange}
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
                  placeholder="Buscar funcionários por nome ou e-mail..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todas as funções</option>
                <option value="STORE_MANAGER">Gerente</option>
                <option value="CASHIER">Caixa</option>
                <option value="EMPLOYEE">Funcionário</option>
              </select>
            </div>
            <div className="md:w-48">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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

      {/* Employees List */}
      {getFilteredEmployees.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum funcionário encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.search || filters.role !== 'all' || filters.status !== 'all'
                ? 'Tente ajustar os filtros para encontrar funcionários.'
                : 'Comece criando seu primeiro funcionário.'}
            </p>
            {!filters.search && filters.role === 'all' && filters.status === 'all' && (
              <Button onClick={onNewEmployee} className="bg-[#3e2626] hover:bg-[#5a3a3a]">
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Primeiro Funcionário
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {getFilteredEmployees.map((employee: any) => (
            <Card key={employee.id} className="border border-border shadow-sm transition hover:shadow-md">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {employee.avatarUrl ? (
                        <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                      ) : null}
                      <AvatarFallback className="bg-muted text-foreground">
                        {employee.name?.charAt(0) || 'F'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {employee.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {employee.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline" 
                      className="border-border bg-muted/50 text-muted-foreground"
                    >
                      {employee.role === 'STORE_MANAGER' ? 'Gerente' :
                       employee.role === 'CASHIER' ? 'Caixa' :
                       employee.role === 'EMPLOYEE' ? 'Funcionário' : employee.role}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={
                        employee.isActive 
                          ? 'border-border bg-muted/50 text-foreground' 
                          : 'border-border bg-muted/50 text-muted-foreground'
                      }
                    >
                      {employee.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      {new Date(employee.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onViewEmployee(employee)}
                        title="Visualizar funcionário"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEditEmployee(employee)}
                        title="Editar funcionário"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Ações específicas do manager */}
                  <div className="pt-3 border-t border-border">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/manager/employees/time-clock?employeeId=${employee.id}`)}
                        title="Registrar ponto"
                        className="text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Ponto
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/manager/employees/time-clock-history?employeeId=${employee.id}`)}
                        title="Ver histórico"
                        className="text-xs"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Histórico
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/manager/employees/medical-certificates?employeeId=${employee.id}`)}
                        title="Atestado médico"
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Atestado
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/manager/employees/termination?employeeId=${employee.id}`)}
                        title="Processar demissão"
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Demissão
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
