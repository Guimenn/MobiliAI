'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  User, 
  Calendar,
  FileText,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  hireDate?: string;
}

export default function ManagerTerminationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId') as string;
  const { token } = useAppStore();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    terminationDate: '',
    reason: '',
    noticePeriod: '',
    finalSalary: '',
    benefits: '',
    notes: ''
  });

  useEffect(() => {
    if (!employeeId) {
      console.error('EmployeeId não fornecido');
      router.push('/manager/employees');
      return;
    }

    fetchEmployee();
    // Definir data de demissão como hoje
    setFormData(prev => ({
      ...prev,
      terminationDate: new Date().toISOString().split('T')[0]
    }));
  }, [employeeId, token]);

  const fetchEmployee = async () => {
    if (!employeeId || !token) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/manager/users/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployee(data);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const terminationData = {
        employeeId,
        terminationDate: formData.terminationDate,
        reason: formData.reason,
        noticePeriod: formData.noticePeriod,
        finalSalary: formData.finalSalary,
        benefits: formData.benefits,
        notes: formData.notes
      };

      // Aqui você implementaria a chamada para a API de demissão
      console.log('Dados de demissão:', terminationData);
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Processo de demissão iniciado com sucesso!');
      router.push('/manager/employees');
      
    } catch (error) {
      console.error('Erro ao processar demissão:', error);
      alert('Erro ao processar demissão');
    } finally {
      setLoading(false);
    }
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button variant="ghost" onClick={() => router.push('/manager/employees')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Processo de Demissão</h1>
          <p className="text-sm text-gray-600">
            {employee.name} - {employee.email}
          </p>
        </div>
      </div>

      {/* Informações do Funcionário */}
      <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
        <CardHeader className="bg-[#3e2626] text-white rounded-t-2xl">
          <CardTitle className="text-2xl flex items-center">
            <User className="h-6 w-6 mr-3" />
            Informações do Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 font-semibold">Nome</Label>
              <div className="font-bold text-gray-900 text-lg">{employee.name}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 font-semibold">Email</Label>
              <div className="font-bold text-gray-900 text-lg">{employee.email}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 font-semibold">Cargo</Label>
              <div className="font-bold text-gray-900 text-lg">{employee.role}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 font-semibold">Data de Admissão</Label>
              <div className="font-bold text-gray-900 text-lg">
                {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('pt-BR') : 'Não informado'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Demissão */}
      <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-2xl">
          <CardTitle className="text-2xl flex items-center">
            <AlertTriangle className="h-6 w-6 mr-3" />
            Dados da Demissão
          </CardTitle>
          <CardDescription className="text-white/80">
            Preencha as informações do processo de demissão
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="terminationDate" className="text-gray-700 font-semibold">Data de Demissão *</Label>
                <Input
                  id="terminationDate"
                  type="date"
                  value={formData.terminationDate}
                  onChange={(e) => handleInputChange('terminationDate', e.target.value)}
                  className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-gray-700 font-semibold">Motivo da Demissão *</Label>
                <select
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  className="w-full h-11 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white"
                  required
                >
                  <option value="">Selecione o motivo</option>
                  <option value="resignation">Pedido de demissão</option>
                  <option value="termination">Demissão por justa causa</option>
                  <option value="layoff">Demissão sem justa causa</option>
                  <option value="contract_end">Fim de contrato</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="noticePeriod" className="text-gray-700 font-semibold">Período de Aviso (dias)</Label>
                <Input
                  id="noticePeriod"
                  type="number"
                  min="0"
                  value={formData.noticePeriod}
                  onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                  placeholder="30"
                  className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalSalary" className="text-gray-700 font-semibold">Salário Final</Label>
                <Input
                  id="finalSalary"
                  type="number"
                  step="0.01"
                  value={formData.finalSalary}
                  onChange={(e) => handleInputChange('finalSalary', e.target.value)}
                  placeholder="0,00"
                  className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits" className="text-gray-700 font-semibold">Benefícios a Resgatar</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => handleInputChange('benefits', e.target.value)}
                placeholder="FGTS, férias proporcionais, 13º salário, etc."
                rows={3}
                className="border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700 font-semibold">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações adicionais sobre o processo de demissão"
                rows={4}
                className="border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/manager/employees')}
                disabled={loading}
                className="h-11 rounded-xl border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-11 rounded-xl shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Processando...' : 'Iniciar Demissão'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

