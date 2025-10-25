'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Camera,
  User,
  Calendar,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import NoSSR from '@/components/NoSSR';

interface TimeClockDetails {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  photo?: string;
  clockOutPhoto?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  clockOutAddress?: string;
  totalHours?: number;
  regularHours?: number;
  overtimeHours?: number;
  lunchBreakMinutes?: number;
  minutesLate?: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TimeClockDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.id as string;
  const timeClockId = searchParams.get('timeClockId') as string;
  const { token } = useAppStore();
  
  const [timeClock, setTimeClock] = useState<TimeClockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhoto, setShowPhoto] = useState(false);

  useEffect(() => {
    if (!timeClockId) {
      console.error('TimeClockId não fornecido');
      router.push(`/admin/stores/${storeId}`);
      return;
    }

    fetchTimeClockDetails();
  }, [timeClockId, storeId, token]);

  const fetchTimeClockDetails = async () => {
    if (!timeClockId || !token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/time-clock/${timeClockId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimeClock(data);
      } else {
        console.error('Erro ao carregar detalhes do ponto');
        alert('Erro ao carregar detalhes do ponto');
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do ponto:', error);
      alert('Erro ao carregar detalhes do ponto');
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

  const formatHours = (hours: number) => {
    if (!hours) return '0h 0min';
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    return `${wholeHours}h ${minutes}min`;
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

  const downloadPhoto = (photo: string, filename: string) => {
    const link = document.createElement('a');
    link.href = photo;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes do ponto...</p>
        </div>
      </div>
    );
  }

  if (!timeClock) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Clock className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ponto não encontrado</h2>
          <p className="text-gray-600 mb-4">O ponto solicitado não foi encontrado.</p>
          <Button onClick={() => router.push(`/admin/stores/${storeId}`)}>
            Voltar para a loja
          </Button>
        </div>
      </div>
    );
  }

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
                <Button variant="ghost" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Detalhes do Ponto</h1>
                  <p className="text-sm text-gray-600">
                    {timeClock.employee?.name} - {formatDate(timeClock.date)}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(timeClock.status)}>
                {getStatusText(timeClock.status)}
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Informações do Ponto</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-600">Funcionário</Label>
                      <div className="font-medium">{timeClock.employee?.name}</div>
                      <div className="text-sm text-gray-500">{timeClock.employee?.email}</div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600">Data</Label>
                      <div className="font-medium">{formatDate(timeClock.date)}</div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600">Entrada</Label>
                      <div className="font-medium text-green-600">{formatTime(timeClock.clockIn)}</div>
                    </div>
                    
                    {timeClock.clockOut && (
                      <div>
                        <Label className="text-sm text-gray-600">Saída</Label>
                        <div className="font-medium text-red-600">{formatTime(timeClock.clockOut)}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {timeClock.minutesLate && timeClock.minutesLate > 0 && (
                      <div>
                        <Label className="text-sm text-gray-600">Atraso</Label>
                        <div className="font-medium text-orange-600">
                          {formatLateTime(timeClock.minutesLate)}
                        </div>
                      </div>
                    )}
                    
                    {timeClock.totalHours && (
                      <div>
                        <Label className="text-sm text-gray-600">Total de Horas</Label>
                        <div className="font-medium">{formatHours(timeClock.totalHours)}</div>
                      </div>
                    )}
                    
                    {timeClock.regularHours && (
                      <div>
                        <Label className="text-sm text-gray-600">Horas Normais</Label>
                        <div className="font-medium">{formatHours(timeClock.regularHours)}</div>
                      </div>
                    )}
                    
                    {timeClock.overtimeHours && timeClock.overtimeHours > 0 && (
                      <div>
                        <Label className="text-sm text-gray-600">Horas Extras</Label>
                        <div className="font-medium text-blue-600">{formatHours(timeClock.overtimeHours)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localização */}
            {(timeClock.address || timeClock.clockOutAddress) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Localização</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeClock.address && (
                      <div>
                        <Label className="text-sm text-gray-600">Local da Entrada</Label>
                        <div className="font-medium">{timeClock.address}</div>
                        {timeClock.latitude && timeClock.longitude && (
                          <div className="text-sm text-gray-500 mt-1">
                            Coordenadas: {timeClock.latitude.toFixed(6)}, {timeClock.longitude.toFixed(6)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {timeClock.clockOutAddress && (
                      <div>
                        <Label className="text-sm text-gray-600">Local da Saída</Label>
                        <div className="font-medium">{timeClock.clockOutAddress}</div>
                        {timeClock.clockOutLatitude && timeClock.clockOutLongitude && (
                          <div className="text-sm text-gray-500 mt-1">
                            Coordenadas: {timeClock.clockOutLatitude.toFixed(6)}, {timeClock.clockOutLongitude.toFixed(6)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fotos */}
            {(timeClock.photo || timeClock.clockOutPhoto) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-5 w-5" />
                    <span>Fotos do Ponto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {timeClock.photo && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm text-gray-600">Foto de Entrada</Label>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPhoto(!showPhoto)}
                            >
                              {showPhoto ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                              {showPhoto ? 'Ocultar' : 'Mostrar'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPhoto(timeClock.photo!, `entrada_${timeClock.date}_${timeClock.clockIn.replace(':', '')}.jpg`)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                        {showPhoto && (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={timeClock.photo}
                              alt="Foto de entrada"
                              className="w-full h-64 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {timeClock.clockOutPhoto && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm text-gray-600">Foto de Saída</Label>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPhoto(!showPhoto)}
                            >
                              {showPhoto ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                              {showPhoto ? 'Ocultar' : 'Mostrar'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPhoto(timeClock.clockOutPhoto!, `saida_${timeClock.date}_${timeClock.clockOut?.replace(':', '')}.jpg`)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                        {showPhoto && (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={timeClock.clockOutPhoto}
                              alt="Foto de saída"
                              className="w-full h-64 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            {timeClock.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Observações</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{timeClock.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </NoSSR>
  );
}
