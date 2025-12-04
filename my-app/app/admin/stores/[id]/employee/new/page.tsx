'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import WorkingHoursConfig from '@/components/WorkingHoursConfig';

export default function NewEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const { token } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    position: '',
    role: 'EMPLOYEE' as 'ADMIN' | 'STORE_MANAGER' | 'CASHIER' | 'CUSTOMER' | 'EMPLOYEE',
    salary: '',
    hireDate: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    workingHours: null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkingHoursChange = (workingHours: any) => {
    setFormData(prev => ({
      ...prev,
      workingHours
    }));
  };

  // Função para filtrar apenas campos permitidos pelo DTO do backend
  const filterAllowedFields = (data: any) => {
    const allowedFields = [
      'name', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 
      'role', 'isActive', 'cpf', 'workingHours', 'storeId', 'password',
      'salary', 'position', 'hireDate'
    ];
    
    const filtered: any = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null) {
        // Remover campos vazios (strings vazias)
        if (typeof data[field] === 'string' && data[field].trim() === '') {
          return; // Não incluir campos vazios
        }
        // Converter salary para número se fornecido
        if (field === 'salary' && data[field]) {
          filtered[field] = parseFloat(data[field]);
        } else {
          filtered[field] = data[field];
        }
      }
    });
    return filtered;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.name || !formData.email || !formData.password) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Senha).');
      return;
    }

    if (formData.password.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!formData.position) {
      alert('Por favor, selecione o cargo do funcionário.');
      return;
    }
    
    if (!token) {
      alert('Token de autenticação não encontrado');
      return;
    }

    setIsLoading(true);
    
    try {
      // Mapear position para role se necessário
      const roleMap: { [key: string]: 'ADMIN' | 'STORE_MANAGER' | 'CASHIER' | 'CUSTOMER' | 'EMPLOYEE' } = {
        'GERENTE': 'STORE_MANAGER',
        'CAIXA': 'CASHIER',
        'VENDEDOR': 'EMPLOYEE',
        'ESTOQUISTA': 'EMPLOYEE',
        'ATENDENTE': 'EMPLOYEE'
      };

      const employeeData = filterAllowedFields({
        ...formData,
        role: roleMap[formData.position] || formData.role,
        storeId
      });

      await adminAPI.createEmployee(employeeData, token);
      
      alert('Funcionário criado com sucesso!');
      router.push(`/admin/stores/${storeId}`);
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error);
      alert(`Erro ao criar funcionário: ${error.message || 'Tente novamente.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/stores/${storeId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Loja
        </Button>
        
        <div className="flex items-center space-x-2 mb-2">
          <UserPlus className="h-6 w-6 text-[#3e2626]" />
          <h1 className="text-2xl font-bold text-gray-900">Novo Funcionário</h1>
        </div>
        <p className="text-gray-600">Preencha as informações do funcionário</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Funcionário</CardTitle>
          <CardDescription>
            Preencha todos os campos obrigatórios para criar o funcionário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Digite o e-mail"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500">A senha deve ter no mínimo 6 caracteres</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Cargo *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => handleInputChange('position', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                    <SelectItem value="GERENTE">Gerente</SelectItem>
                    <SelectItem value="CAIXA">Caixa</SelectItem>
                    <SelectItem value="ESTOQUISTA">Estoquista</SelectItem>
                    <SelectItem value="ATENDENTE">Atendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="salary">Salário</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hireDate">Data de Admissão *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Digite o endereço completo"
                rows={3}
              />
            </div>

            {/* Contato de Emergência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Contato de Emergência</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Nome do contato"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Horários de Trabalho */}
            <div className="space-y-4">
              <Label>Horários de Trabalho</Label>
              <WorkingHoursConfig
                value={formData.workingHours}
                onChange={handleWorkingHoursChange}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações adicionais sobre o funcionário"
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/stores/${storeId}`)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#3e2626] hover:bg-[#8B4513]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Criar Funcionário
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
