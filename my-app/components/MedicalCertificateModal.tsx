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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Atestado Médico
                </h2>
                <p className="text-sm text-white/80 mt-0.5">
                  {employee?.name} - {employee?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white">
          {/* Período do Atestado */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Período do Atestado</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-gray-700 font-semibold">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513] ${errors.startDate ? 'border-red-500' : ''}`}
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <Label htmlFor="endDate" className="text-gray-700 font-semibold">Data de Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513] ${errors.endDate ? 'border-red-500' : ''}`}
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
                <Label htmlFor="type" className="text-gray-700 font-semibold">Tipo de Atestado *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]">
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
                <Label htmlFor="status" className="text-gray-700 font-semibold">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]">
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
              <Label htmlFor="reason" className="text-gray-700 font-semibold">Motivo do Atestado *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Descreva o motivo do atestado médico"
                rows={3}
                className={`border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513] ${errors.reason ? 'border-red-500' : ''}`}
              />
              {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
            </div>
          </div>

          {/* Informações do Médico */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações do Médico</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctorName" className="text-gray-700 font-semibold">Nome do Médico *</Label>
                <Input
                  id="doctorName"
                  value={formData.doctorName}
                  onChange={(e) => handleInputChange('doctorName', e.target.value)}
                  placeholder="Dr. João Silva"
                  className={`h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513] ${errors.doctorName ? 'border-red-500' : ''}`}
                />
                {errors.doctorName && <p className="text-red-500 text-sm mt-1">{errors.doctorName}</p>}
              </div>

              <div>
                <Label htmlFor="doctorCrm" className="text-gray-700 font-semibold">CRM *</Label>
                <Input
                  id="doctorCrm"
                  value={formData.doctorCrm}
                  onChange={(e) => handleInputChange('doctorCrm', e.target.value)}
                  placeholder="123456"
                  className={`h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513] ${errors.doctorCrm ? 'border-red-500' : ''}`}
                />
                {errors.doctorCrm && <p className="text-red-500 text-sm mt-1">{errors.doctorCrm}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="clinicName" className="text-gray-700 font-semibold">Nome da Clínica/Hospital *</Label>
                <Input
                  id="clinicName"
                  value={formData.clinicName}
                  onChange={(e) => handleInputChange('clinicName', e.target.value)}
                  placeholder="Hospital São Paulo"
                  className={`h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513] ${errors.clinicName ? 'border-red-500' : ''}`}
                />
                {errors.clinicName && <p className="text-red-500 text-sm mt-1">{errors.clinicName}</p>}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes" className="text-gray-700 font-semibold">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações adicionais sobre o atestado"
                rows={3}
                className="border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 rounded-xl border-gray-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] hover:from-[#2a1f1f] hover:to-[#6B3410] text-white h-11 rounded-xl shadow-lg"
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
