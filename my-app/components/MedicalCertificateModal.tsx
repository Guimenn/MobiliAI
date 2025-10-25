'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, Loader2, FileText } from 'lucide-react';

interface MedicalCertificate {
  id?: string;
  employeeId: string;
  employeeName?: string;
  startDate: string;
  endDate: string;
  type: 'MEDICAL' | 'DENTAL' | 'PSYCHOLOGICAL' | 'OTHER';
  reason: string;
  doctorName: string;
  doctorCrm: string;
  clinicName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  attachmentUrl?: string;
}

interface MedicalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (certificateData: any) => Promise<void>;
  employee: any;
  isLoading?: boolean;
}

export default function MedicalCertificateModal({
  isOpen,
  onClose,
  onSubmit,
  employee,
  isLoading = false
}: MedicalCertificateModalProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'MEDICAL',
    reason: '',
    doctorName: '',
    doctorCrm: '',
    clinicName: '',
    status: 'PENDING',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Data de fim é obrigatória';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'Data de fim deve ser posterior à data de início';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Motivo é obrigatório';
    }

    if (!formData.doctorName.trim()) {
      newErrors.doctorName = 'Nome do médico é obrigatório';
    }

    if (!formData.doctorCrm.trim()) {
      newErrors.doctorCrm = 'CRM do médico é obrigatório';
    }

    if (!formData.clinicName.trim()) {
      newErrors.clinicName = 'Nome da clínica é obrigatório';
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
      const certificateData = {
        ...formData,
        employeeId: employee.id
      };
      await onSubmit(certificateData);
      onClose();
    } catch (error) {
      console.error('Erro ao criar atestado:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Atestado Médico
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
          {/* Período do Atestado */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Período do Atestado</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <Label htmlFor="endDate">Data de Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          {/* Informações do Atestado */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações do Atestado</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo de Atestado *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEDICAL">Médico</SelectItem>
                    <SelectItem value="DENTAL">Odontológico</SelectItem>
                    <SelectItem value="PSYCHOLOGICAL">Psicológico</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="APPROVED">Aprovado</SelectItem>
                    <SelectItem value="REJECTED">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Motivo do Atestado *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Descreva o motivo do atestado médico"
                rows={3}
                className={errors.reason ? 'border-red-500' : ''}
              />
              {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
            </div>
          </div>

          {/* Informações do Médico */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações do Médico</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctorName">Nome do Médico *</Label>
                <Input
                  id="doctorName"
                  value={formData.doctorName}
                  onChange={(e) => handleInputChange('doctorName', e.target.value)}
                  placeholder="Dr. João Silva"
                  className={errors.doctorName ? 'border-red-500' : ''}
                />
                {errors.doctorName && <p className="text-red-500 text-sm mt-1">{errors.doctorName}</p>}
              </div>

              <div>
                <Label htmlFor="doctorCrm">CRM *</Label>
                <Input
                  id="doctorCrm"
                  value={formData.doctorCrm}
                  onChange={(e) => handleInputChange('doctorCrm', e.target.value)}
                  placeholder="123456"
                  className={errors.doctorCrm ? 'border-red-500' : ''}
                />
                {errors.doctorCrm && <p className="text-red-500 text-sm mt-1">{errors.doctorCrm}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="clinicName">Nome da Clínica/Hospital *</Label>
                <Input
                  id="clinicName"
                  value={formData.clinicName}
                  onChange={(e) => handleInputChange('clinicName', e.target.value)}
                  placeholder="Hospital São Paulo"
                  className={errors.clinicName ? 'border-red-500' : ''}
                />
                {errors.clinicName && <p className="text-red-500 text-sm mt-1">{errors.clinicName}</p>}
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
                placeholder="Observações adicionais sobre o atestado"
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
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Atestado
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
