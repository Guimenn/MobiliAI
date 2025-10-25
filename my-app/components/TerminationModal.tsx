'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, Loader2, Calculator, AlertTriangle } from 'lucide-react';

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

  // Calcular custos automaticamente baseado no tempo de trabalho
  useEffect(() => {
    const salary = formData.finalSalary;
    const hireDate = employee?.createdAt ? new Date(employee.createdAt) : null;
    const terminationDate = formData.terminationDate ? new Date(formData.terminationDate) : new Date();
    
    if (salary > 0 && hireDate) {
      // Calcular tempo de trabalho em anos
      const yearsWorked = (terminationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const monthsWorked = yearsWorked * 12;
      
      // Calcular férias proporcionais (1/12 por mês trabalhado)
      const vacationDays = Math.floor(monthsWorked);
      const vacationValue = (salary / 30) * vacationDays;
      
      // Calcular 13º salário proporcional
      const thirteenthSalary = (salary / 12) * Math.min(monthsWorked, 12);
      
      // Calcular FGTS (8% do salário por mês trabalhado)
      const fgtsValue = salary * 0.08 * Math.min(monthsWorked, 12);
      
      // Calcular multa do FGTS (40% do FGTS acumulado)
      const fgtsPenalty = fgtsValue * 0.40;
      
      // Calcular aviso prévio (30 dias ou proporcional)
      const noticePeriod = Math.min(30, Math.max(0, 30 - formData.noticePeriod));
      const noticeValue = (salary / 30) * noticePeriod;
      
      // Calcular total
      const totalCost = vacationValue + thirteenthSalary + fgtsValue + fgtsPenalty + noticeValue;
      
      setFormData(prev => ({
        ...prev,
        vacationDays,
        vacationValue,
        thirteenthSalary,
        fgtsValue: fgtsValue + fgtsPenalty,
        severancePay: noticeValue,
        totalCost
      }));
    }
  }, [formData.finalSalary, formData.terminationDate, employee?.createdAt]);

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
      newErrors.finalSalary = 'Salário deve ser maior que zero';
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
                  <p className="text-blue-600">{new Date(employee.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Tempo de Trabalho:</span>
                  <p className="text-blue-600">
                    {(() => {
                      const hireDate = new Date(employee.createdAt);
                      const terminationDate = formData.terminationDate ? new Date(formData.terminationDate) : new Date();
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
                <Label htmlFor="finalSalary">Salário Final *</Label>
                <Input
                  id="finalSalary"
                  type="number"
                  step="0.01"
                  value={formData.finalSalary}
                  onChange={(e) => handleInputChange('finalSalary', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.finalSalary ? 'border-red-500' : ''}
                />
                {errors.finalSalary && <p className="text-red-500 text-sm mt-1">{errors.finalSalary}</p>}
              </div>

              <div>
                <Label htmlFor="vacationDays">Dias de Férias</Label>
                <Input
                  id="vacationDays"
                  type="number"
                  value={formData.vacationDays}
                  onChange={(e) => handleInputChange('vacationDays', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>

            {/* Resumo dos Custos */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Resumo dos Custos</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Férias Proporcionais ({formData.vacationDays} dias):</span>
                    <span className="text-sm font-medium">R$ {formData.vacationValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">13º Salário Proporcional:</span>
                    <span className="text-sm font-medium">R$ {formData.thirteenthSalary.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">FGTS + Multa (40%):</span>
                    <span className="text-sm font-medium">R$ {formData.fgtsValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Aviso Prévio:</span>
                    <span className="text-sm font-medium">R$ {formData.severancePay.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-red-600">R$ {formData.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Detalhes do Cálculo */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Detalhes do Cálculo:</h5>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• <strong>Férias:</strong> 1/12 por mês trabalhado</p>
                  <p>• <strong>13º Salário:</strong> Proporcional ao tempo trabalhado</p>
                  <p>• <strong>FGTS:</strong> 8% do salário por mês + 40% de multa</p>
                  <p>• <strong>Aviso Prévio:</strong> 30 dias ou proporcional</p>
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
