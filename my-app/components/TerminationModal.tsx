'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, Calculator, AlertTriangle } from 'lucide-react';

import { Loader } from '@/components/ui/ai/loader';
interface TerminationData {
  employeeId: string;
  terminationDate: string;
  reason: 'RESIGNATION' | 'DISMISSAL' | 'RETIREMENT' | 'CONTRACT_END' | 'OTHER';
  noticePeriod: number; // dias
  lastWorkingDay: string;
  finalSalary: number;
  vacationDays: number;
  vacationValue: number;
  thirteenthSalary: number;
  fgtsValue: number;
  severancePay: number;
  totalCost: number;
  notes?: string;
}

interface TerminationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (terminationData: any) => Promise<void>;
  employee: any;
  isLoading?: boolean;
}

export default function TerminationModal({
  isOpen,
  onClose,
  onSubmit,
  employee,
  isLoading = false
}: TerminationModalProps) {
  const [formData, setFormData] = useState({
    terminationDate: new Date().toISOString().split('T')[0], // Data atual
    reason: 'RESIGNATION',
    noticePeriod: 30,
    lastWorkingDay: '',
    finalSalary: 0,
    vacationDays: 0,
    vacationValue: 0,
    thirteenthSalary: 0,
    fgtsValue: 0,
    severancePay: 0,
    totalCost: 0,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar salário do funcionário quando o modal abrir
  useEffect(() => {
    if (isOpen && employee) {
      // Carregar salário do funcionário automaticamente
      const employeeSalary = employee.salary 
        ? (typeof employee.salary === 'string' 
          ? parseFloat(employee.salary) 
          : employee.salary)
        : 0;
      
      console.log('💰 Salário do funcionário carregado:', employeeSalary);
      
      // Sempre definir o salário, mesmo que seja 0
      setFormData(prev => ({
        ...prev,
        finalSalary: employeeSalary > 0 ? employeeSalary : 0
      }));
    }
  }, [isOpen, employee]);

  // Calcular custos automaticamente baseado no tempo de trabalho
  useEffect(() => {
    const salary = formData.finalSalary;
    // Usar hireDate se disponível, senão usar createdAt
    const hireDate = employee?.hireDate 
      ? new Date(employee.hireDate) 
      : (employee?.createdAt ? new Date(employee.createdAt) : null);
    const terminationDate = formData.terminationDate ? new Date(formData.terminationDate) : new Date();
    
    if (salary > 0 && hireDate) {
      // Calcular tempo de trabalho em dias
      const daysWorked = Math.floor((terminationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthsWorked = daysWorked / 30.44; // Média de dias por mês
      const yearsWorked = monthsWorked / 12;
      
      // Calcular férias proporcionais (30 dias por ano, 1/12 por mês trabalhado)
      const vacationDays = Math.min(30, Math.floor(monthsWorked * (30 / 12)));
      const vacationValue = (salary / 30) * vacationDays;
      
      // Calcular 13º salário proporcional (1/12 por mês trabalhado no ano)
      const monthsInCurrentYear = Math.min(12, Math.max(0, monthsWorked % 12));
      const thirteenthSalary = (salary / 12) * monthsInCurrentYear;
      
      // Calcular FGTS (8% do salário por mês trabalhado)
      const totalMonths = Math.floor(monthsWorked);
      const fgtsBase = salary * 0.08 * totalMonths;
      
      // Calcular multa do FGTS (40% do FGTS acumulado em caso de demissão sem justa causa)
      const fgtsPenalty = formData.reason !== 'DISMISSAL' ? fgtsBase * 0.40 : 0;
      const fgtsTotal = fgtsBase + fgtsPenalty;
      
      // Calcular aviso prévio (30 dias ou proporcional)
      const noticeDays = formData.reason === 'DISMISSAL' ? 0 : Math.min(30, Math.max(0, 30 - formData.noticePeriod));
      const noticeValue = (salary / 30) * noticeDays;
      
      // Salário proporcional do mês (salário completo do mês de demissão)
      const proportionalSalary = salary;
      
      // Calcular total (salário + todos os benefícios)
      const totalCost = proportionalSalary + vacationValue + thirteenthSalary + fgtsTotal + noticeValue;
      
      console.log('💰 Valores calculados:', {
        proportionalSalary,
        vacationValue,
        thirteenthSalary,
        fgtsTotal,
        noticeValue,
        totalCost
      });
      
      setFormData(prev => ({
        ...prev,
        vacationDays,
        vacationValue,
        thirteenthSalary,
        fgtsValue: fgtsTotal,
        severancePay: noticeValue,
        totalCost
      }));
    } else {
      // Se não tem salário ou data de admissão, zerar os valores
      if (salary <= 0) {
        console.warn('⚠️ Salário não configurado ou igual a zero');
      }
      if (!hireDate) {
        console.warn('⚠️ Data de admissão não disponível');
      }
      
      setFormData(prev => ({
        ...prev,
        vacationDays: 0,
        vacationValue: 0,
        thirteenthSalary: 0,
        fgtsValue: 0,
        severancePay: 0,
        totalCost: 0
      }));
    }
  }, [formData.finalSalary, formData.terminationDate, formData.reason, formData.noticePeriod, employee?.hireDate, employee?.createdAt, employee?.salary]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.terminationDate) {
      newErrors.terminationDate = 'Data de demissão é obrigatória';
    }

    if (!formData.lastWorkingDay) {
      newErrors.lastWorkingDay = 'Último dia de trabalho é obrigatório';
    }

    if (formData.terminationDate && formData.lastWorkingDay && 
        new Date(formData.terminationDate) > new Date(formData.lastWorkingDay)) {
      newErrors.lastWorkingDay = 'Último dia deve ser posterior à data de demissão';
    }

    if (formData.finalSalary <= 0) {
      newErrors.finalSalary = 'Salário do funcionário não está configurado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const terminationData = {
        ...formData,
        employeeId: employee.id
      };
      await onSubmit(terminationData);
      onClose();
    } catch (error) {
      console.error('Erro ao processar demissão:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Processo de Demissão
              </h2>
              <p className="text-sm text-gray-600">
                {employee?.name} - {employee?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações da Demissão */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações da Demissão</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="terminationDate">Data da Demissão *</Label>
                <Input
                  id="terminationDate"
                  type="date"
                  value={formData.terminationDate}
                  onChange={(e) => handleInputChange('terminationDate', e.target.value)}
                  className={errors.terminationDate ? 'border-red-500' : ''}
                />
                {errors.terminationDate && <p className="text-red-500 text-sm mt-1">{errors.terminationDate}</p>}
              </div>

              <div>
                <Label htmlFor="lastWorkingDay">Último Dia de Trabalho *</Label>
                <Input
                  id="lastWorkingDay"
                  type="date"
                  value={formData.lastWorkingDay}
                  onChange={(e) => handleInputChange('lastWorkingDay', e.target.value)}
                  className={errors.lastWorkingDay ? 'border-red-500' : ''}
                />
                {errors.lastWorkingDay && <p className="text-red-500 text-sm mt-1">{errors.lastWorkingDay}</p>}
              </div>

              <div>
                <Label htmlFor="reason">Motivo da Demissão</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => handleInputChange('reason', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIGNATION">Pedido de Demissão</SelectItem>
                    <SelectItem value="DISMISSAL">Demissão por Justa Causa</SelectItem>
                    <SelectItem value="RETIREMENT">Aposentadoria</SelectItem>
                    <SelectItem value="CONTRACT_END">Fim de Contrato</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="noticePeriod">Período de Aviso (dias)</Label>
                <Input
                  id="noticePeriod"
                  type="number"
                  value={formData.noticePeriod}
                  onChange={(e) => handleInputChange('noticePeriod', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Informações do Funcionário */}
          {employee?.createdAt && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-blue-900">Informações do Funcionário</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Data de Admissão:</span>
                  <p className="text-blue-600">
                    {employee?.hireDate 
                      ? new Date(employee.hireDate).toLocaleDateString('pt-BR')
                      : (employee?.createdAt ? new Date(employee.createdAt).toLocaleDateString('pt-BR') : 'Não informado')}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Tempo de Trabalho:</span>
                  <p className="text-blue-600">
                    {(() => {
                      const hireDate = employee?.hireDate 
                        ? new Date(employee.hireDate) 
                        : (employee?.createdAt ? new Date(employee.createdAt) : null);
                      const terminationDate = formData.terminationDate ? new Date(formData.terminationDate) : new Date();
                      
                      if (!hireDate) return 'Data não disponível';
                      
                      const yearsWorked = (terminationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                      const monthsWorked = Math.floor(yearsWorked * 12);
                      const daysWorked = Math.floor((terminationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      if (yearsWorked >= 1) {
                        const years = Math.floor(yearsWorked);
                        const months = Math.floor((yearsWorked - years) * 12);
                        return `${years} ano(s) e ${months} mês(es)`;
                      } else if (monthsWorked >= 1) {
                        return `${monthsWorked} mês(es)`;
                      } else {
                        return `${daysWorked} dia(s)`;
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cálculo de Custos */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Cálculo de Custos</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="finalSalary">Salário Atual (Final) *</Label>
                <Input
                  id="finalSalary"
                  type="text"
                  value={formData.finalSalary > 0 
                    ? `R$ ${formData.finalSalary.toFixed(2).replace('.', ',')}` 
                    : 'R$ 0,00'}
                  readOnly
                  className={`bg-gray-100 cursor-not-allowed font-semibold text-lg ${
                    formData.finalSalary <= 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.finalSalary <= 0 
                    ? '⚠️ Salário não configurado. Configure o salário do funcionário antes de processar a demissão.'
                    : 'Salário atual do funcionário (carregado automaticamente)'}
                </p>
                {formData.finalSalary <= 0 && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    Por favor, configure o salário do funcionário na página de edição antes de continuar.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="vacationDays">Dias de Férias Proporcionais</Label>
                <Input
                  id="vacationDays"
                  type="text"
                  value={formData.vacationDays}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Calculado automaticamente</p>
              </div>
            </div>

            {/* Resumo dos Benefícios e Custos */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Resumo dos Benefícios e Custos</h4>
              
              <div className="space-y-3">
                {/* Salário Proporcional */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Salário Proporcional</span>
                      <p className="text-xs text-gray-500">Salário do mês de demissão</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">R$ {formData.finalSalary.toFixed(2)}</span>
                  </div>
                </div>

                {/* Férias Proporcionais */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Férias Proporcionais</span>
                      <p className="text-xs text-gray-500">{formData.vacationDays} dias proporcionais</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">R$ {formData.vacationValue.toFixed(2)}</span>
                  </div>
                </div>

                {/* 13º Salário */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-900">13º Salário Proporcional</span>
                      <p className="text-xs text-gray-500">Proporcional ao tempo trabalhado no ano</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">R$ {formData.thirteenthSalary.toFixed(2)}</span>
                  </div>
                </div>

                {/* FGTS */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-900">FGTS + Multa</span>
                      <p className="text-xs text-gray-500">
                        {formData.reason === 'DISMISSAL' 
                          ? 'Sem multa (demissão por justa causa)' 
                          : '8% do salário + 40% de multa'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">R$ {formData.fgtsValue.toFixed(2)}</span>
                  </div>
                </div>

                {/* Aviso Prévio */}
                {formData.reason !== 'DISMISSAL' && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-gray-900">Aviso Prévio</span>
                        <p className="text-xs text-gray-500">30 dias ou proporcional</p>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">R$ {formData.severancePay.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total a Pagar:</span>
                    <span className="text-2xl font-bold text-red-600">R$ {formData.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Detalhes do Cálculo */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Detalhes do Cálculo:</h5>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• <strong>Salário:</strong> Salário atual do funcionário</p>
                  <p>• <strong>Férias:</strong> 30 dias por ano, proporcional ao tempo trabalhado</p>
                  <p>• <strong>13º Salário:</strong> Proporcional aos meses trabalhados no ano</p>
                  <p>• <strong>FGTS:</strong> 8% do salário por mês trabalhado {formData.reason !== 'DISMISSAL' && '+ 40% de multa'}</p>
                  {formData.reason !== 'DISMISSAL' && (
                    <p>• <strong>Aviso Prévio:</strong> 30 dias ou proporcional ao período de aviso</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações sobre o processo de demissão"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Confirmar Demissão
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
