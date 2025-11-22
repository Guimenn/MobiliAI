'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { managerAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ManagerEmployeeFormModal from '@/components/ManagerEmployeeFormModal';
import ManagerViewEmployeeModal from '@/components/ManagerViewEmployeeModal';
import ManagerEditEmployeeModal from '@/components/ManagerEditEmployeeModal';
import { 
  Users, 
  Plus,
  Eye,
  Edit
} from 'lucide-react';

export default function ManagerEmployeesPage() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
      
      const storeEmployees = await managerAPI.getStoreUsers(1, 50, '');
      
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
    // Recarregar lista de funcionários após criação
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#3e2626]">Gerenciar Funcionários</h2>
          <p className="text-gray-600 mt-1">Gerencie os funcionários da sua loja</p>
        </div>
        <Button 
          className="bg-[#3e2626] hover:bg-[#5a3a3a]"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Funcionários da Loja</CardTitle>
          <CardDescription>Lista de todos os funcionários cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626]"></div>
              </div>
            ) : employees.length > 0 ? employees.map((employee: any) => (
              <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-10 h-10">
                    {employee.avatarUrl ? (
                      <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                    ) : null}
                    <AvatarFallback className="bg-[#3e2626] text-white text-sm">
                      {employee.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-[#3e2626]">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={
                        employee.role === 'STORE_MANAGER' ? 'bg-blue-100 text-blue-800' :
                        employee.role === 'CASHIER' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {employee.role === 'STORE_MANAGER' ? 'Gerente' :
                         employee.role === 'CASHIER' ? 'Funcionário' :
                         employee.role}
                      </Badge>
                      <Badge className={employee.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {employee.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewEmployee(employee)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditEmployee(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum funcionário cadastrado na loja</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Novo Funcionário */}
      <ManagerEmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEmployee}
        isLoading={false}
      />

      {/* Modal de Visualização */}
      <ManagerViewEmployeeModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        employee={selectedEmployee}
        onEdit={handleEditEmployee}
      />

      {/* Modal de Edição */}
      <ManagerEditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        employee={selectedEmployee}
        onSave={handleSaveEmployee}
      />
    </div>
  );
}

