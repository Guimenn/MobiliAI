'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Clock, 
  Filter, 
  Download
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface TimeClockRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: string;
  totalHours?: number;
  minutesLate?: number;
  createdAt: string;
}

export default function ManagerTimeClockHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId') as string;
  const { token } = useAppStore();
  
  const [employee, setEmployee] = useState<any>(null);
  const [records, setRecords] = useState<TimeClockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (!employeeId) {
      console.error('EmployeeId não fornecido');
      router.push('/manager/employees');
      return;
    }

    // Definir período padrão (últimos 30 dias)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, [employeeId, router]);

  useEffect(() => {
    if (employeeId && token) {
      fetchEmployee();
    }
  }, [employeeId, token]);

  useEffect(() => {
    if (startDate && endDate && employeeId && token) {
      fetchHistory();
    }
  }, [startDate, endDate, employeeId, token]);

  const fetchEmployee = async () => {
    if (!employeeId || !token) return;
    
    try {
      setEmployeeLoading(true);
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
    } finally {
      setEmployeeLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!startDate || !endDate || !employeeId || !token) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/time-clock/history/${employeeId}?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
        setTotalRecords(data.records?.length || 0);
      } else {
        console.error('Erro ao carregar histórico');
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatLateTime = (minutesLate: number) => {
    if (minutesLate <= 0) return '-';
    
    const hours = Math.floor(minutesLate / 60);
    const minutes = minutesLate % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800';
      case 'LATE':
        return 'bg-orange-100 text-orange-800';
      case 'ABSENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'Presente';
      case 'LATE':
        return 'Atrasado';
      case 'ABSENT':
        return 'Ausente';
      default:
        return status;
    }
  };

  const handleFilter = () => {
    fetchHistory();
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-3">
        <Button variant="ghost" onClick={() => router.push('/manager/employees')} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Histórico de Pontos</h1>
          <p className="text-xs sm:text-sm text-gray-600 truncate">
            {employee ? `${employee.name} - ${employee.email}` : 'Carregando...'}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-[#3e2626]" />
            <span>Filtros</span>
          </CardTitle>
          <CardDescription>
            Selecione o período para visualizar o histórico de pontos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-gray-700 font-semibold">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-gray-700 font-semibold">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleFilter} 
                className="w-full h-11 bg-[#3e2626] hover:bg-[#2a1f1f] text-white rounded-xl"
              >
                <Filter className="h-4 w-4 mr-2" />
                {loading ? 'Buscando...' : 'Filtrar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="bg-[#3e2626] text-white border-0 shadow-lg rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-1">Resumo do Período</h4>
              <p className="text-white text-sm">
                {totalRecords} registros encontrados
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Registros */}
      <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-[#3e2626]" />
            <span>Registros de Ponto</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626] mx-auto mb-2"></div>
              <p className="text-gray-600">Carregando histórico...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Nenhum registro encontrado para o período selecionado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 sm:space-x-4">
                      <div className="text-center bg-white rounded-lg p-2 sm:p-3 shadow-sm min-w-[80px] sm:min-w-[100px]">
                        <div className="text-xs text-gray-500 font-medium mb-1">Data</div>
                        <div className="font-bold text-gray-900 text-sm sm:text-base">{formatDate(record.date)}</div>
                      </div>
                      <div className="text-center bg-green-50 rounded-lg p-2 sm:p-3 shadow-sm min-w-[80px] sm:min-w-[100px]">
                        <div className="text-xs text-green-600 font-medium mb-1">Entrada</div>
                        <div className="font-bold text-green-700 text-sm sm:text-base">{formatTime(record.clockIn)}</div>
                      </div>
                      {record.clockOut && (
                        <div className="text-center bg-red-50 rounded-lg p-2 sm:p-3 shadow-sm min-w-[80px] sm:min-w-[100px]">
                          <div className="text-xs text-red-600 font-medium mb-1">Saída</div>
                          <div className="font-bold text-red-700 text-sm sm:text-base">{formatTime(record.clockOut)}</div>
                        </div>
                      )}
                      {record.totalHours && (
                        <div className="text-center bg-blue-50 rounded-lg p-2 sm:p-3 shadow-sm min-w-[80px] sm:min-w-[100px]">
                          <div className="text-xs text-blue-600 font-medium mb-1">Horas</div>
                          <div className="font-bold text-blue-700 text-sm sm:text-base">{record.totalHours}h</div>
                        </div>
                      )}
                      {record.minutesLate && record.minutesLate > 0 && (
                        <div className="text-center bg-orange-50 rounded-lg p-2 sm:p-3 shadow-sm min-w-[80px] sm:min-w-[100px]">
                          <div className="text-xs text-orange-600 font-medium mb-1">Atraso</div>
                          <div className="font-bold text-orange-700 text-sm sm:text-base">
                            {formatLateTime(record.minutesLate)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center sm:justify-end">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(record.status)} whitespace-nowrap`}
                      >
                        {getStatusText(record.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

