'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  User, 
  Mail,
  MapPin,
  Building2,
  Shield,
  Save,
  Edit,
  Clock,
  Calendar
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import NoSSR from '@/components/NoSSR';
import WorkingHoursConfig from '@/components/WorkingHoursConfig';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  role: string;
  isActive: boolean;
  department?: string;
  position?: string;
  salary?: number | string;
  hireDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  workingHours?: any;
  storeId?: string;
  createdAt?: string;
  store?: {
    id: string;
    name: string;
  };
}

export default function EmployeePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.id as string;
  const employeeId = searchParams.get('employeeId') as string;
  const { token } = useAppStore();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    role: '',
    storeId: '',
    salary: '',
    isActive: true,
    notes: ''
  });
  const [workingHours, setWorkingHours] = useState<any>(null);

  useEffect(() => {
    if (!employeeId) {
      console.error('EmployeeId não fornecido');
      router.push(`/admin/stores/${storeId}`);
      return;
    }

    fetchStores();
    fetchEmployee();
  }, [employeeId, storeId, token]);

  const fetchStores = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/stores', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const storesData = await response.json();
        setStores(storesData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    }
  };

  const fetchStoreName = async (storeIdToFetch: string) => {
    if (!storeIdToFetch || !token) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/stores/${storeIdToFetch}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const storeData = await response.json();
        setStoreName(storeData.name || '');
      }
    } catch (error) {
      console.error('Erro ao buscar nome da loja:', error);
    }
  };

  const fetchEmployee = async () => {
    if (!employeeId || !token) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dados do funcionário carregados:', data);
        console.log('💰 Salário do funcionário:', data.salary);
        setEmployee(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          role: data.role || '',
          storeId: data.storeId || data.store?.id || '',
          salary: data.salary 
            ? (typeof data.salary === 'string' ? data.salary : data.salary.toString())
            : '',
          isActive: data.isActive ?? true,
          notes: data.notes || ''
        });
        console.log('📝 FormData configurado com salário:', data.salary 
          ? (typeof data.salary === 'string' ? data.salary : data.salary.toString())
          : '');
        setWorkingHours(data.workingHours || null);
        
        // Buscar nome da loja se não vier no employee
        if (data.store?.name) {
          setStoreName(data.store.name);
        } else if (data.storeId) {
          fetchStoreName(data.storeId);
        } else if (storeId) {
          fetchStoreName(storeId);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!employee) return;

    setLoading(true);

    try {
      // Preparar dados para envio - apenas campos permitidos pelo UpdateUserDto
      const employeeData: any = {};
      
      // Adicionar apenas campos que têm valor
      if (formData.phone) employeeData.phone = formData.phone;
      if (formData.address) employeeData.address = formData.address;
      if (formData.role) employeeData.role = formData.role;
      if (formData.storeId) employeeData.storeId = formData.storeId;
      if (formData.salary && formData.salary !== '') {
        employeeData.salary = parseFloat(formData.salary);
      }
      if (formData.isActive !== undefined) employeeData.isActive = formData.isActive;
      if (workingHours) employeeData.workingHours = workingHours;

      const response = await fetch(`http://localhost:3001/api/admin/users/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      if (response.ok) {
        const updatedEmployee = await response.json();
        console.log('✅ Funcionário atualizado:', updatedEmployee);
        setEmployee(updatedEmployee);
        
        // Atualizar formData com os dados retornados
        setFormData(prev => ({
          ...prev,
          salary: updatedEmployee.salary 
            ? (typeof updatedEmployee.salary === 'string' ? updatedEmployee.salary : updatedEmployee.salary.toString())
            : '',
          phone: updatedEmployee.phone || prev.phone,
          address: updatedEmployee.address || prev.address,
          role: updatedEmployee.role || prev.role,
          isActive: updatedEmployee.isActive ?? prev.isActive
        }));
        
        // Atualizar nome da loja após salvar
        if (updatedEmployee.storeId) {
          const selectedStore = stores.find(s => s.id === updatedEmployee.storeId);
          if (selectedStore) {
            setStoreName(selectedStore.name);
          } else {
            fetchStoreName(updatedEmployee.storeId);
          }
        }
        
        setIsEditing(false);
        alert('Funcionário atualizado com sucesso!');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error('❌ Erro ao atualizar funcionário:', errorData);
        alert(`Erro: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      alert('Erro ao salvar funcionário');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <NoSSR
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={() => router.push(`/admin/stores/${storeId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEditing ? 'Editar Funcionário' : 'Visualizar Funcionário'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {employee.name} - {employee.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled
                        className="cursor-not-allowed bg-gray-100"
                      />
                    ) : (
                      <div className="font-medium">{employee.name}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled
                        className="cursor-not-allowed bg-gray-100"
                      />
                    ) : (
                      <div className="font-medium">{employee.email}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    ) : (
                      <div className="font-medium">{employee.phone || 'Não informado'}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Endereço</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    ) : (
                      <div className="font-medium">{employee.address || 'Não informado'}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    {isEditing ? (
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    ) : (
                      <div className="font-medium">{employee.city || 'Não informado'}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    {isEditing ? (
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    ) : (
                      <div className="font-medium">{employee.state || 'Não informado'}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    {isEditing ? (
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      />
                    ) : (
                      <div className="font-medium">{employee.zipCode || 'Não informado'}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Profissionais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Informações Profissionais</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    {isEditing ? (
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="CASHIER">Vendedor/Caixa</option>
                        <option value="STORE_MANAGER">Gerente de Loja</option>
                        <option value="EMPLOYEE">Funcionário</option>
                      </select>
                    ) : (
                      <div className="font-medium">{employee.role}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeId">Nome da Loja</Label>
                    {isEditing ? (
                      <select
                        id="storeId"
                        value={formData.storeId}
                        onChange={(e) => handleInputChange('storeId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione uma loja</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="font-medium">
                        {employee.store?.name || storeName || stores.find(s => s.id === employee.storeId)?.name || 'Não informado'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary" className="font-semibold">Salário (R$)</Label>
                    {isEditing ? (
                      <Input
                        id="salary"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.salary}
                        onChange={(e) => handleInputChange('salary', e.target.value)}
                        placeholder="0.00"
                        className="text-lg font-medium"
                      />
                    ) : (
                      <div className="font-semibold text-lg text-blue-600">
                        {employee.salary 
                          ? `R$ ${typeof employee.salary === 'string' ? parseFloat(employee.salary).toFixed(2).replace('.', ',') : employee.salary.toFixed(2).replace('.', ',')}`
                          : <span className="text-gray-500">Não informado</span>}
                      </div>
                    )}
                    {!isEditing && employee.salary && (
                      <p className="text-xs text-gray-500">Clique em "Editar" para alterar o salário</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Data de Admissão</Label>
                    <div className="font-medium">
                      {formatDate(employee.createdAt || employee.hireDate || '')}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                        />
                        <span className="text-sm text-gray-600">
                          {formData.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    ) : (
                      <div className="font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          employee.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Horários de Expediente */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Horários de Expediente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkingHoursConfig
                    workingHours={workingHours}
                    onSave={setWorkingHours}
                    disabled={loading}
                  />
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Observações</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Observações adicionais sobre o funcionário"
                    rows={4}
                  />
                ) : (
                  <div className="font-medium">
                    {employee.notes || 'Nenhuma observação'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </NoSSR>
  );
}
