'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
import NoSSR from '@/components/NoSSR';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  hireDate?: string;
}

export default function TerminationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.id as string;
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
      router.push(`/admin/stores/${storeId}`);
      return;
    }

    fetchEmployee();
    // Definir data de demissão como hoje
    setFormData(prev => ({
      ...prev,
      terminationDate: new Date().toISOString().split('T')[0]
    }));
  }, [employeeId, storeId, token]);

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
      router.push(`/admin/stores/${storeId}`);
      
    } catch (error) {
      console.error('Erro ao processar demissão:', error);
      alert('Erro ao processar demissão');
    } finally {
      setLoading(false);
    }
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
                  <h1 className="text-2xl font-bold text-gray-900">Processo de Demissão</h1>
                  <p className="text-sm text-gray-600">
                    {employee.name} - {employee.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Informações do Funcionário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações do Funcionário</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Nome</Label>
                    <div className="font-medium">{employee.name}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Email</Label>
                    <div className="font-medium">{employee.email}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Cargo</Label>
                    <div className="font-medium">{employee.role}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Data de Admissão</Label>
                    <div className="font-medium">
                      {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('pt-BR') : 'Não informado'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulário de Demissão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Dados da Demissão</span>
                </CardTitle>
                <CardDescription>
                  Preencha as informações do processo de demissão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="terminationDate">Data de Demissão *</Label>
                      <Input
                        id="terminationDate"
                        type="date"
                        value={formData.terminationDate}
                        onChange={(e) => handleInputChange('terminationDate', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Motivo da Demissão *</Label>
                      <select
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="noticePeriod">Período de Aviso (dias)</Label>
                      <Input
                        id="noticePeriod"
                        type="number"
                        min="0"
                        value={formData.noticePeriod}
                        onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                        placeholder="30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="finalSalary">Salário Final</Label>
                      <Input
                        id="finalSalary"
                        type="number"
                        step="0.01"
                        value={formData.finalSalary}
                        onChange={(e) => handleInputChange('finalSalary', e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="benefits">Benefícios a Resgatar</Label>
                    <Textarea
                      id="benefits"
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      placeholder="FGTS, férias proporcionais, 13º salário, etc."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Observações adicionais sobre o processo de demissão"
                      rows={4}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/admin/stores/${storeId}`)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Processando...' : 'Iniciar Demissão'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </NoSSR>
  );
}
