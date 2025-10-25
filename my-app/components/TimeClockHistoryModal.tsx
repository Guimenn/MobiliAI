'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Calendar, Clock, Filter, Download } from 'lucide-react';
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

interface TimeClockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
}

export default function TimeClockHistoryModal({ 
  isOpen, 
  onClose, 
  employee 
}: TimeClockHistoryModalProps) {
  const { token } = useAppStore();
  const [records, setRecords] = useState<TimeClockRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  // Definir datas padrão (últimos 30 dias)
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      setEndDate(today.toISOString().split('T')[0]);
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Buscar histórico quando as datas mudarem
  useEffect(() => {
    if (isOpen && employee?.id && startDate && endDate) {
      fetchHistory();
    }
  }, [isOpen, employee?.id, startDate, endDate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      console.log('📊 Buscando histórico do funcionário:', employee.id);
      
      // Get API base URL from environment or use default
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
      console.log('🔑 Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');
      
      const response = await fetch(
        `${API_BASE_URL}/time-clock/history/${employee.id}?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', response.status, response.statusText);
        console.error('❌ Detalhes do erro:', errorText);
        
        if (response.status === 401) {
          throw new Error('Token de autenticação inválido ou expirado. Faça login novamente.');
        }
        
        throw new Error(`Erro ao buscar histórico: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Histórico carregado:', data);
      
      setRecords(data.records || []);
      setTotalRecords(data.totalRecords || 0);
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      alert('Erro ao carregar histórico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchHistory();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'text-green-600 bg-green-50';
      case 'LATE':
        return 'text-orange-600 bg-orange-50';
      case 'ABSENT':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Histórico de Pontos
            </h2>
            <p className="text-sm text-gray-600">{employee?.name}</p>
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

        <div className="p-6 space-y-6">
          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleFilter}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Buscando...' : 'Filtrar'}
                </Button>
              </div>
            </div>
          </div>

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
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Registros de Ponto</h3>
            
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
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
