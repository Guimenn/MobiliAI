'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Filter, 
  Download,
  User,
  Eye
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import NoSSR from '@/components/NoSSR';

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

export default function TimeClockHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.id as string;
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
      router.push(`/admin/stores/${storeId}`);
      return;
    }

    // Definir período padrão (últimos 30 dias)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, [employeeId, storeId, router]);

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
                <h1 className="text-2xl font-bold text-gray-900">Histórico de Pontos</h1>
                <p className="text-sm text-gray-600">
                  {employee ? `${employee.name} - ${employee.email}` : 'Carregando...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </CardTitle>
              <CardDescription>
                Selecione o período para visualizar o histórico de pontos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleFilter} className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    {loading ? 'Buscando...' : 'Filtrar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Resumo do Período</h4>
                <p className="text-sm text-blue-700">
                  {totalRecords} registros encontrados
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Lista de Registros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Registros de Ponto</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Carregando histórico...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum registro encontrado para o período selecionado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/admin/stores/${storeId}/time-clock-details?timeClockId=${record.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-500">Data</div>
                            <div className="font-medium">{formatDate(record.date)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-500">Entrada</div>
                            <div className="font-medium text-green-600">{formatTime(record.clockIn)}</div>
                          </div>
                          {record.clockOut && (
                            <div className="text-center">
                              <div className="text-sm text-gray-500">Saída</div>
                              <div className="font-medium text-red-600">{formatTime(record.clockOut)}</div>
                            </div>
                          )}
                          {record.totalHours && (
                            <div className="text-center">
                              <div className="text-sm text-gray-500">Horas</div>
                              <div className="font-medium">{record.totalHours}h</div>
                            </div>
                          )}
                          {record.minutesLate && record.minutesLate > 0 && (
                            <div className="text-center">
                              <div className="text-sm text-gray-500">Atraso</div>
                              <div className="font-medium text-orange-600">
                                {formatLateTime(record.minutesLate)}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}
                          >
                            {getStatusText(record.status)}
                          </span>
                          <div className="text-xs text-gray-500">
                            {new Date(record.createdAt).toLocaleTimeString('pt-BR')}
                          </div>
                          <div className="text-blue-600 hover:text-blue-700">
                            <Eye className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      </div>
    </NoSSR>
  );
}
