'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Clock, 
  Camera,
  MapPin,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
import NoSSR from '@/components/NoSSR';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TimeClockPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.id as string;
  const employeeId = searchParams.get('employeeId') as string;
  const { token } = useAppStore();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [hasOpenEntry, setHasOpenEntry] = useState(false);
  const [lastEntry, setLastEntry] = useState<any>(null);

  useEffect(() => {
    if (!employeeId) {
      console.error('EmployeeId não fornecido');
      router.push(`/admin/stores/${storeId}`);
      return;
    }

    fetchEmployee();
    fetchLastEntry();
    getCurrentLocation();
  }, [employeeId, storeId, token]);

  useEffect(() => {
    // Atualizar relógio a cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchEmployee = async () => {
    if (!employeeId || !token) return;
    
    try {
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
    }
  };

  const fetchLastEntry = async () => {
    if (!employeeId || !token) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `http://localhost:3001/api/time-clock/history/${employeeId}?startDate=${today}&endDate=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const todayEntries = data.records || [];
        const openEntry = todayEntries.find((entry: any) => !entry.clockOut);
        
        setHasOpenEntry(!!openEntry);
        setLastEntry(openEntry || todayEntries[todayEntries.length - 1]);
      }
    } catch (error) {
      console.error('Erro ao verificar último registro:', error);
    }
  };

  const getCurrentLocation = () => {
    console.log('🔍 Iniciando obtenção de localização...');
    
    if (navigator.geolocation) {
      setGettingLocation(true);
      
      // Opções para obter localização mais precisa
      const options = {
        enableHighAccuracy: true, // Usar GPS em vez de localização de rede
        timeout: 20000, // Timeout de 20 segundos para dar mais tempo
        maximumAge: 0 // Não usar cache de localização
      };

      console.log('📍 Solicitando localização com opções:', options);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          console.log('📍 Localização obtida com sucesso:', {
            latitude,
            longitude,
            accuracy: `${accuracy}m de precisão`,
            timestamp: new Date().toISOString()
          });

          // Verificar se a precisão é aceitável (menos de 100 metros)
          if (accuracy > 100) {
            console.warn('⚠️ Localização com baixa precisão:', accuracy, 'metros');
          }

          // Fazer reverse geocoding para obter endereço
          try {
            console.log('🔄 Iniciando reverse geocoding...');
            const address = await getAddressFromCoordinates(latitude, longitude);
            
            console.log('📍 Endereço obtido:', address);
            
            setLocation({
              latitude,
              longitude,
              address: address || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
            });
            
            console.log('✅ Localização salva no estado:', {
              latitude,
              longitude,
              address
            });
          } catch (error) {
            console.error('❌ Erro ao obter endereço:', error);
            setLocation({
              latitude,
              longitude,
              address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
            });
          } finally {
            setGettingLocation(false);
          }
        },
        (error) => {
          console.error('❌ Erro ao obter localização:', error);
          let errorMessage = 'Erro ao obter localização';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout ao obter localização';
              break;
          }
          
          console.log('⚠️', errorMessage);
          alert(`⚠️ ${errorMessage}. Você pode continuar sem localização.`);
          setGettingLocation(false);
        },
        options
      );
    } else {
      console.error('❌ Geolocalização não é suportada neste navegador');
      alert('Geolocalização não é suportada neste navegador');
    }
  };

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
    try {
      console.log('🔍 Convertendo coordenadas para endereço:', { lat, lng });
      
      // Usar BigDataCloud para obter cidade, estado e país
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📍 BigDataCloud response:', data);
          
          // Construir endereço simples: cidade, estado, país
          const addressParts = [];
          
          if (data.locality) addressParts.push(data.locality);
          if (data.principalSubdivision) addressParts.push(data.principalSubdivision);
          if (data.countryName) addressParts.push(data.countryName);
          
          if (addressParts.length > 0) {
            return addressParts.join(', ');
          }
        }
      } catch (error) {
        console.log('BigDataCloud falhou, tentando OpenStreetMap...');
      }
      
      // Fallback: OpenStreetMap
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📍 OpenStreetMap response:', data);
          
          if (data.display_name) {
            // Pegar apenas as primeiras partes (cidade, estado, país)
            const parts = data.display_name.split(', ');
            const relevantParts = parts.slice(0, 3); // Cidade, Estado, País
            return relevantParts.join(', ');
          }
        }
      } catch (error) {
        console.log('OpenStreetMap falhou:', error);
      }
      
      // Último fallback: coordenadas
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  };

  const capturePhoto = async () => {
    try {
      // Tentar usar a API de mídia do navegador
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Câmera traseira
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        // Criar elemento de vídeo temporário
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        // Criar canvas para capturar a foto
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Desenhar frame atual no canvas
          ctx?.drawImage(video, 0, 0);
          
          // Converter para base64
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          setPhoto(dataURL);
          
          // Parar a stream
          stream.getTracks().forEach(track => track.stop());
        });
        
      } else {
        // Fallback para input de arquivo
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result as string;
              setPhoto(result);
            };
            reader.readAsDataURL(file);
          }
        };
        
        input.click();
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      
      // Fallback para input de arquivo
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setPhoto(result);
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    }
  };

  const removePhoto = () => {
    setPhoto(null);
  };


  const handleTimeClock = async () => {
    if (!employee) return;

    setLoading(true);

    try {
      const timeClockData = {
        employeeId: employee.id,
        photo: photo,
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.address,
        notes: notes
      };

      const endpoint = hasOpenEntry ? 'clock-out' : 'clock-in';
      const response = await fetch(`http://localhost:3001/api/time-clock/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timeClockData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Ponto registrado:', result);
        
        // Recarregar dados
        await fetchLastEntry();
        
        // Limpar formulário
        setPhoto(null);
        setNotes('');
      } else {
        const errorData = await response.json();
        console.error('Erro ao registrar ponto:', errorData);
        alert(`Erro: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
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
              <Button variant="ghost" onClick={() => router.push(`/admin/stores/${storeId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Registro de Ponto</h1>
                <p className="text-sm text-gray-600">
                  {employee.name} - {employee.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Relógio e Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Status Atual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div>
                  <ClientOnly
                    fallback={
                      <>
                        <div className="text-4xl font-bold text-gray-900">--:--:--</div>
                        <div className="text-lg text-gray-600">Carregando...</div>
                      </>
                    }
                  >
                    <div className="text-4xl font-bold text-gray-900">
                      {formatTime(currentTime)}
                    </div>
                    <div className="text-lg text-gray-600">
                      {formatDate(currentTime)}
                    </div>
                  </ClientOnly>
                </div>
                
                <div className="flex items-center justify-center space-x-4">
                  {hasOpenEntry ? (
                    <div className="flex items-center space-x-2 text-orange-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Ponto aberto - Entrada: {lastEntry?.clockIn}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Pronto para registrar ponto</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Ponto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Registrar Ponto</span>
              </CardTitle>
              <CardDescription>
                {hasOpenEntry 
                  ? 'Registre sua saída do trabalho' 
                  : 'Registre sua entrada no trabalho'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Localização */}
              <div className="space-y-2">
                <Label>Localização GPS</Label>
                
                {gettingLocation ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-600">
                      Obtendo localização precisa...
                    </span>
                  </div>
                ) : location ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">
                        {location.address}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">
                      Coordenadas: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Obtendo localização...
                    </span>
                  </div>
                )}
              </div>

              {/* Foto */}
              <div className="space-y-2">
                <Label>Foto {hasOpenEntry ? 'de Saída' : 'de Entrada'}</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={capturePhoto}
                      className="flex items-center space-x-2"
                    >
                      <Camera className="h-4 w-4" />
                      <span>{photo ? 'Trocar Foto' : 'Capturar Foto'}</span>
                    </Button>
                    {photo && (
                      <div className="text-sm text-green-600 flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>Foto capturada</span>
                      </div>
                    )}
                  </div>
                  
                  {photo && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm text-gray-600">Prévia da foto:</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removePhoto}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={photo}
                          alt="Foto capturada"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre o ponto..."
                />
              </div>

              {/* Botão de Ação */}
              <div className="pt-4">
                <Button
                  onClick={handleTimeClock}
                  disabled={loading}
                  className={`w-full py-3 text-lg ${
                    hasOpenEntry 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? (
                    'Processando...'
                  ) : hasOpenEntry ? (
                    'Registrar Saída'
                  ) : (
                    'Registrar Entrada'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico Rápido */}
          {lastEntry && (
            <Card>
              <CardHeader>
                <CardTitle>Último Registro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">{formatDate(new Date(lastEntry.date))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entrada:</span>
                    <span className="font-medium text-green-600">{lastEntry.clockIn}</span>
                  </div>
                  {lastEntry.clockOut && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saída:</span>
                      <span className="font-medium text-red-600">{lastEntry.clockOut}</span>
                    </div>
                  )}
                  {lastEntry.totalHours && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Horas Trabalhadas:</span>
                      <span className="font-medium">{lastEntry.totalHours}h</span>
                    </div>
                  )}
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
