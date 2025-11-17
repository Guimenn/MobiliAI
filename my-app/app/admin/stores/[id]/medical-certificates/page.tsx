'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import MedicalCertificateModal from '@/components/MedicalCertificateModal';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, FileText, Loader2, Plus } from 'lucide-react';

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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push(`/admin/stores/${storeId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Loja
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#3e2626]" />
            <h1 className="text-2xl font-bold text-gray-900">Atestados do Funcionário</h1>
          </div>
        </div>
        <Button className="bg-[#3e2626] hover:bg-[#8B4513]" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Atestado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{employee ? employee.name : 'Funcionário'}</CardTitle>
          <CardDescription>Histórico de atestados do usuário</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Carregando...
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum atestado encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {formatISODate(c.startDate)} - {formatISODate(c.endDate)}
                    </TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>{c.doctorName} ({c.doctorCrm})</TableCell>
                    <TableCell>{c.clinicName}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate" title={c.reason}>
                      {c.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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


