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
  salary?: number | string;
  createdAt?: string;
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

  const [calculated, setCalculated] = useState({
    salary: 0,
    vacationDays: 0,
    vacationValue: 0,
    thirteenthSalary: 0,
    fgtsValue: 0,
    noticeValue: 0,
    totalCost: 0
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

        // Inicializar salário no formulário e no estado calculado
        const numericSalary = data.salary
          ? (typeof data.salary === 'string' ? parseFloat(data.salary) : data.salary)
          : 0;

        setFormData(prev => ({
          ...prev,
          finalSalary: numericSalary > 0 ? numericSalary.toString() : ''
        }));

        setCalculated(prev => ({
          ...prev,
          salary: numericSalary > 0 ? numericSalary : 0
        }));
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

  // Calcular automaticamente férias, 13º, FGTS, aviso e total com base no salário e datas
  useEffect(() => {
    if (!employee) return;

    const salary =
      calculated.salary > 0
        ? calculated.salary
        : employee.salary
        ? (typeof employee.salary === 'string'
            ? parseFloat(employee.salary)
            : employee.salary)
        : 0;

    const hireDate = employee.hireDate
      ? new Date(employee.hireDate)
      : employee.createdAt
      ? new Date(employee.createdAt)
      : null;

    const terminationDate = formData.terminationDate
      ? new Date(formData.terminationDate)
      : new Date();

    if (salary > 0 && hireDate) {
      const daysWorked = Math.floor(
        (terminationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const monthsWorked = daysWorked / 30.44;

      // Férias proporcionais (30 dias por ano, 1/12 por mês)
      const vacationDays = Math.min(30, Math.floor(monthsWorked * (30 / 12)));
      const vacationValue = (salary / 30) * vacationDays;

      // 13º proporcional (1/12 por mês trabalhado no ano)
      const monthsInCurrentYear = Math.min(
        12,
        Math.max(0, monthsWorked % 12)
      );
      const thirteenthSalary = (salary / 12) * monthsInCurrentYear;

      // FGTS (8% do salário por mês)
      const totalMonths = Math.floor(monthsWorked);
      const fgtsBase = salary * 0.08 * totalMonths;

      // Motivo: justa causa não tem multa nem aviso
      const isJustCause = formData.reason === 'termination';

      const fgtsPenalty = !isJustCause ? fgtsBase * 0.4 : 0;
      const fgtsTotal = fgtsBase + fgtsPenalty;

      // Aviso prévio (30 dias ou proporcional, exceto justa causa)
      const noticeDays = isJustCause
        ? 0
        : Math.min(
            30,
            Math.max(
              0,
              30 -
                (formData.noticePeriod
                  ? parseInt(formData.noticePeriod) || 0
                  : 0)
            )
          );
      const noticeValue = (salary / 30) * noticeDays;

      // Salário do mês da demissão
      const proportionalSalary = salary;

      const totalCost =
        proportionalSalary +
        vacationValue +
        thirteenthSalary +
        fgtsTotal +
        noticeValue;

      setCalculated({
        salary,
        vacationDays,
        vacationValue,
        thirteenthSalary,
        fgtsValue: fgtsTotal,
        noticeValue,
        totalCost
      });
    } else {
      // Sem salário ou sem data de admissão, zera os valores
      setCalculated(prev => ({
        ...prev,
        vacationDays: 0,
        vacationValue: 0,
        thirteenthSalary: 0,
        fgtsValue: 0,
        noticeValue: 0,
        totalCost: 0
      }));
    }
  }, [employee, formData.terminationDate, formData.noticePeriod, formData.reason, calculated.salary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const terminationData = {
        employeeId,
        terminationDate: formData.terminationDate,
        reason: formData.reason,
        noticePeriod: formData.noticePeriod,
        finalSalary: calculated.salary,
        benefits: formData.benefits || JSON.stringify({
          vacationDays: calculated.vacationDays,
          vacationValue: calculated.vacationValue,
          thirteenthSalary: calculated.thirteenthSalary,
          fgtsValue: calculated.fgtsValue,
          noticeValue: calculated.noticeValue,
          totalCost: calculated.totalCost
        }),
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button variant="ghost" onClick={() => router.push(`/admin/stores/${storeId}`)}>
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
                  type="text"
                  value={
                    calculated.salary > 0
                      ? `R$ ${calculated.salary.toFixed(2).replace('.', ',')}`
                      : 'R$ 0,00'
                  }
                  readOnly
                  className="h-11 border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed font-semibold text-lg"
                />
                {calculated.salary <= 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Salário não configurado para este funcionário. Configure o salário antes de processar a demissão.
                  </p>
                )}
              </div>
            </div>

            {/* Resumo automático dos benefícios calculados */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="bg-white border rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Férias Proporcionais ({calculated.vacationDays} dias)
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      R$ {calculated.vacationValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      13º Salário Proporcional
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      R$ {calculated.thirteenthSalary.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      FGTS + Multa
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      R$ {calculated.fgtsValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Aviso Prévio
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      R$ {calculated.noticeValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Total estimado a pagar na demissão
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Inclui salário do mês, férias proporcionais, 13º, FGTS e aviso prévio (quando aplicável).
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-red-700">
                        R$ {calculated.totalCost.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
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
                onClick={() => router.push(`/admin/stores/${storeId}`)}
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
