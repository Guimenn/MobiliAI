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
  Camera,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ManagerTimeClockPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId') as string;
  const { token, user } = useAppStore();
  
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
      router.push('/manager/employees');
      return;
    }

    fetchEmployee();
    fetchLastEntry();
    getCurrentLocation();
  }, [employeeId, token]);

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
      
      const options = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          console.log('📍 Localização obtida com sucesso:', {
            latitude,
            longitude,
            accuracy: `${accuracy}m de precisão`,
            timestamp: new Date().toISOString()
          });

          if (accuracy > 100) {
            console.warn('⚠️ Localização com baixa precisão:', accuracy, 'metros');
          }

          try {
            console.log('🔄 Iniciando reverse geocoding...');
            const address = await getAddressFromCoordinates(latitude, longitude);
            
            console.log('📍 Endereço obtido:', address);
            
            setLocation({
              latitude,
              longitude,
              address: address || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
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
      
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📍 BigDataCloud response:', data);
          
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
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📍 OpenStreetMap response:', data);
          
          if (data.display_name) {
            const parts = data.display_name.split(', ');
            const relevantParts = parts.slice(0, 3);
            return relevantParts.join(', ');
          }
        }
      } catch (error) {
        console.log('OpenStreetMap falhou:', error);
      }
      
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  };

  const capturePhoto = async () => {
    // Função auxiliar para criar input de arquivo
    const createFileInput = () => {
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
      
      return input;
    };

    // Verificar se a API de mídia está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('API de mídia não disponível, usando input de arquivo');
      createFileInput().click();
      return;
    }

    // Tentar diferentes configurações de câmera em ordem de preferência
    const cameraConfigs = [
      { facingMode: 'environment' }, // Câmera traseira (preferida)
      { facingMode: 'user' },        // Câmera frontal
      {}                              // Qualquer câmera disponível
    ];

    for (const config of cameraConfigs) {
      try {
        console.log('Tentando acessar câmera com configuração:', config);
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            ...config,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Aguardar o vídeo carregar
        await new Promise<void>((resolve, reject) => {
          video.addEventListener('loadedmetadata', () => {
            try {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              ctx?.drawImage(video, 0, 0);
              
              const dataURL = canvas.toDataURL('image/jpeg', 0.8);
              setPhoto(dataURL);
              
              // Parar a stream
              stream.getTracks().forEach(track => track.stop());
              
              resolve();
            } catch (error) {
              stream.getTracks().forEach(track => track.stop());
              reject(error);
            }
          });
          
          video.addEventListener('error', (error) => {
            stream.getTracks().forEach(track => track.stop());
            reject(error);
          });
          
          // Timeout de segurança
          setTimeout(() => {
            stream.getTracks().forEach(track => track.stop());
            reject(new Error('Timeout ao carregar vídeo'));
          }, 5000);
        });
        
        // Se chegou aqui, a foto foi capturada com sucesso
        return;
        
      } catch (error: any) {
        console.log(`Erro ao acessar câmera com configuração ${JSON.stringify(config)}:`, error);
        
        // Se não é o último, tenta a próxima configuração
        if (config !== cameraConfigs[cameraConfigs.length - 1]) {
          continue;
        }
        
        // Se todas as tentativas falharam, usar input de arquivo
        console.log('Todas as tentativas de câmera falharam, usando input de arquivo');
        const errorMessage = error?.message || 'Erro desconhecido';
        
        if (errorMessage.includes('not found') || errorMessage.includes('device not found')) {
          alert('Câmera não encontrada. Você pode fazer upload de uma foto.');
        } else if (errorMessage.includes('permission') || errorMessage.includes('Permission denied')) {
          alert('Permissão de câmera negada. Você pode fazer upload de uma foto.');
        } else {
          alert('Não foi possível acessar a câmera. Você pode fazer upload de uma foto.');
        }
        
        createFileInput().click();
        return;
      }
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
        
        await fetchLastEntry();
        
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center space-x-3">
        <Button variant="ghost" onClick={() => router.push('/manager/employees')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registro de Ponto</h1>
          <p className="text-sm text-gray-600">
            {employee.name} - {employee.email}
          </p>
        </div>
      </div>

      {/* Clock Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-900" />
            <span>Controle de Ponto</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6 py-4">
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {formatTime(currentTime)}
              </div>
              <div className="text-base text-gray-600 font-medium">
                {formatDate(currentTime)}
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              {hasOpenEntry ? (
                <>
                  <XCircle className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold text-orange-600">Ponto Aberto</span>
                  <span className="text-gray-500">- Entrada: {lastEntry?.clockIn}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-green-600">Ponto Fechado</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Clock Form */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Registrar {hasOpenEntry ? 'Saída' : 'Entrada'}</CardTitle>
          <CardDescription>Registre a presença do funcionário com localização e foto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Localização GPS</span>
            </label>
            
            {gettingLocation ? (
              <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm text-blue-600 font-medium">Obtendo localização...</span>
              </div>
            ) : location ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{location.address}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">Localização não disponível</span>
                </div>
              </div>
            )}
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Foto {hasOpenEntry ? 'de Saída' : 'de Entrada'}</span>
            </label>
            
            {photo ? (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={photo}
                    alt="Foto capturada"
                    className="w-full h-96 object-cover rounded-lg border-2 border-gray-200 shadow-lg"
                  />
                  <button
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={capturePhoto}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar Nova Foto
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={capturePhoto}
                className="w-full p-16 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#8B4513] hover:bg-gray-50 transition-all group"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#8B4513] group-hover:text-white transition-colors shadow-md">
                    <Camera className="h-10 w-10 text-gray-400 group-hover:text-white" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-base font-medium text-gray-700">Clique para capturar foto</p>
                    <p className="text-sm text-gray-500">Ou fazer upload de uma imagem</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-semibold text-gray-700">Observações (opcional)</label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre o ponto..."
            />
          </div>

          {/* Action Button */}
          <Button
            onClick={handleTimeClock}
            disabled={loading || gettingLocation}
            className={`w-full py-6 text-lg font-semibold ${
              hasOpenEntry 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white' 
                : 'bg-gradient-to-r from-[#3e2626] to-[#8B4513] hover:from-[#2a1f1f] hover:to-[#6B3410] text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Processando...</span>
              </div>
            ) : hasOpenEntry ? (
              <>
                <XCircle className="h-5 w-5 mr-2" />
                Registrar Saída
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Registrar Entrada
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Last Entry */}
      {lastEntry && (
        <Card className="bg-gray-50 border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Último Registro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600">Entrada:</span>
                <span className="font-semibold text-green-600">{lastEntry.clockIn}</span>
              </div>
              {lastEntry.clockOut && (
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Saída:</span>
                  <span className="font-semibold text-red-600">{lastEntry.clockOut}</span>
                </div>
              )}
              {lastEntry.totalHours && (
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="font-semibold text-gray-900">{lastEntry.totalHours}h</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

