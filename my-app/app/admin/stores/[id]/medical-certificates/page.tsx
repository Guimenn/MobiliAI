'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MedicalCertificateModal from '@/components/MedicalCertificateModal';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, FileText, Plus } from 'lucide-react';

import { Loader } from '@/components/ui/ai/loader';
type Certificate = {
  id: string;
  employeeId: string;
  employee?: { id: string; name: string; email: string };
  startDate: string;
  endDate: string;
  type: 'MEDICAL' | 'DENTAL' | 'PSYCHOLOGICAL' | 'OTHER';
  reason: string;
  doctorName: string;
  doctorCrm: string;
  clinicName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
};

export default function EmployeeMedicalCertificatesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.id as string;
  const employeeId = searchParams.get('employeeId') || '';
  const { token, user } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const apiBase = useMemo(() => {
    const isAdmin = user?.role === 'ADMIN';
    return isAdmin ? 'http://localhost:3001/api/admin' : 'http://localhost:3001/api/manager';
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      if (!token || !employeeId) return;
      setIsLoading(true);
      try {
        // Buscar funcionário (para cabeçalho)
        const employeeRes = await fetch(`${apiBase}/users/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (employeeRes.ok) {
          const emp = await employeeRes.json();
          setEmployee(emp);
        }

        // Buscar atestados do funcionário
        const res = await fetch(`${apiBase}/medical-certificates?employeeId=${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.ok ? await res.json() : [];
        setCertificates(Array.isArray(data) ? data : (data?.items || []));
      } catch (err) {
        console.error('Erro ao carregar atestados:', err);
        setCertificates([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [apiBase, employeeId, token]);

  const handleCreate = async (certificateData: any) => {
    if (!token) return;
    setIsCreating(true);
    try {
      const payload = {
        employeeId,
        startDate: certificateData.startDate,
        endDate: certificateData.endDate,
        type: certificateData.type,
        reason: certificateData.reason,
        doctorName: certificateData.doctorName,
        doctorCrm: certificateData.doctorCrm,
        clinicName: certificateData.clinicName,
        status: certificateData.status || 'APPROVED',
        notes: certificateData.notes || '',
        attachmentUrl: certificateData.attachmentUrl || null,
      };

      const res = await fetch(`${apiBase}/medical-certificates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao criar atestado');
      }

      // Recarregar lista
      const list = await fetch(`${apiBase}/medical-certificates?employeeId=${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = list.ok ? await list.json() : [];
      setCertificates(Array.isArray(data) ? data : (data?.items || []));
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const statusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Formata datas ISO (yyyy-mm-dd ou yyyy-mm-ddTHH:mm:ssZ) para dd/mm/aaaa sem aplicar timezone
  const formatISODate = (value: string | Date) => {
    if (!value) return '';
    const str = typeof value === 'string' ? value : value.toISOString();
    // Pega somente a parte da data
    const isoDate = str.length >= 10 ? str.slice(0, 10) : str;
    const [yyyy, mm, dd] = isoDate.split('-');
    if (!yyyy || !mm || !dd) return isoDate;
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={() => router.push(`/admin/stores/${storeId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#3e2626]" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Atestados do Funcionário</h1>
              <p className="text-sm text-gray-600">
                {employee ? `${employee.name} - ${employee.email}` : 'Carregando...'}
              </p>
            </div>
          </div>
        </div>
        <Button 
          className="bg-[#3e2626] hover:bg-[#2a1f1f] text-white rounded-xl shadow-lg" 
          onClick={() => setShowModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Atestado
        </Button>
      </div>

      <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
        <CardHeader className="bg-[#3e2626] text-white rounded-t-2xl">
          <CardTitle className="text-2xl flex items-center">
            <FileText className="h-6 w-6 mr-3" />
            {employee ? employee.name : 'Funcionário'}
          </CardTitle>
          <CardDescription className="text-white/80">
            Histórico de atestados do usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader size={32} className="mr-2 text-[#3e2626]" />
              <span className="text-lg">Carregando...</span>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">Nenhum atestado encontrado</p>
              <p className="text-gray-500 text-sm mt-2">Clique em "Novo Atestado" para adicionar um</p>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((c) => (
                <div
                  key={c.id}
                  className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <div className="text-xs text-gray-500 font-medium mb-1">Período</div>
                      <div className="font-bold text-gray-900">
                        {formatISODate(c.startDate)} - {formatISODate(c.endDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Tipo</div>
                      <div className="font-semibold text-gray-700">{c.type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Médico</div>
                      <div className="font-semibold text-gray-700 text-sm">
                        {c.doctorName}
                      </div>
                      <div className="text-xs text-gray-500">CRM: {c.doctorCrm}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Clínica</div>
                      <div className="font-semibold text-gray-700 text-sm">{c.clinicName}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge className={`${statusColor(c.status)} font-semibold mb-2`}>
                        {c.status}
                      </Badge>
                      <div className="text-xs text-gray-500 max-w-[200px] truncate" title={c.reason}>
                        {c.reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MedicalCertificateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        employee={employee || { id: employeeId, name: '', email: '' }}
        isLoading={isCreating}
      />
    </div>
  );
}


