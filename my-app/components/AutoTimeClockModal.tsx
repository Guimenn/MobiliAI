'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AutoTimeClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (timeClockData: any) => Promise<void>;
  employee: any;
  isLoading?: boolean;
}

export default function AutoTimeClockModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  employee, 
  isLoading = false 
}: AutoTimeClockModalProps) {
  // Estabilizar o employee para evitar re-renders desnecessários
  const stableEmployee = useMemo(() => employee, [employee?.id]);
  
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [location, setLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isEntry, setIsEntry] = useState(true); // true = entrada, false = saída
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isReady, setIsReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (isEntry) {
        setFormData(prev => ({
          ...prev,
          clockIn: now.toTimeString().split(' ')[0].substring(0, 5)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          clockOut: now.toTimeString().split(' ')[0].substring(0, 5)
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isEntry]);

  // useEffect para limpar a câmera quando o componente desmontar
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        console.log('🧹 Câmera limpa no cleanup');
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    clockIn: '',
    clockOut: '',
    breakStart: '',
    breakEnd: '',
    status: 'PRESENT',
    notes: '',
    photo: '',
    latitude: 0,
    longitude: 0,
    address: ''
  });

  // Função para tirar a foto com referências passadas como parâmetros
  const takePhotoWithRefs = async (videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => {
    console.log('📸 Função takePhotoWithRefs chamada');
    console.log('🔍 Video element:', videoElement);
    console.log('🔍 Canvas element:', canvasElement);
    
    if (videoElement && canvasElement) {
      console.log('✅ Video e canvas encontrados');
      
      const context = canvasElement.getContext('2d');
      
      if (context) {
        console.log('🎨 Contexto do canvas obtido');
        console.log('📐 Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
        console.log('🔍 Video readyState:', videoElement.readyState);
        console.log('🔍 Video currentTime:', videoElement.currentTime);
        
        // Verificar se o vídeo tem dados válidos
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
          console.error('❌ Vídeo não tem dimensões válidas');
          alert('Erro: Câmera não está funcionando corretamente. Tente novamente.');
          return;
        }
        
        // Verificar se o vídeo tem dados de imagem válidos
        if (videoElement.readyState < 2) {
          console.error('❌ Vídeo não tem dados suficientes (readyState:', videoElement.readyState, ')');
          alert('Erro: Câmera ainda não carregou completamente. Tente novamente.');
          return;
        }
        
        // Para câmeras de notebook, tentar forçar um frame
        if (videoElement.currentTime === 0) {
          console.log('🔄 Tentando forçar frame para câmera de notebook...');
          try {
            // Tentar pausar e reproduzir novamente
            videoElement.pause();
            await new Promise(resolve => setTimeout(resolve, 100));
            await videoElement.play();
            await new Promise(resolve => setTimeout(resolve, 200));
            console.log('🔄 Frame forçado, currentTime agora:', videoElement.currentTime);
          } catch (error) {
            console.warn('⚠️ Erro ao forçar frame:', error);
          }
        }
        
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        // Aguardar um momento para garantir que o frame está renderizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        context.drawImage(videoElement, 0, 0);
        
        const photoData = canvasElement.toDataURL('image/jpeg', 0.8);
        console.log('📷 Foto capturada, tamanho:', photoData.length);
        
        // Verificar se a foto não está vazia (para câmeras de notebook)
        if (photoData.length < 1000) {
          console.warn('⚠️ Foto muito pequena, pode estar vazia. Tentando novamente...');
          await new Promise(resolve => setTimeout(resolve, 200));
          context.drawImage(videoElement, 0, 0);
          const newPhotoData = canvasElement.toDataURL('image/jpeg', 0.8);
          console.log('📷 Segunda tentativa, tamanho:', newPhotoData.length);
          setCapturedPhoto(newPhotoData);
        } else {
          setCapturedPhoto(photoData);
        }
        
        console.log('✅ Estado capturedPhoto atualizado');
        
        // Parar a câmera
        if (videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          console.log('🛑 Câmera parada');
        }
        
        // Aguardar um momento para mostrar a foto antes de obter localização
        setTimeout(() => {
          console.log('📍 Iniciando obtenção de localização...');
          getCurrentLocation();
        }, 1000);
      } else {
        console.error('❌ Não foi possível obter contexto do canvas');
      }
    } else {
      console.error('❌ Video ou canvas não encontrados');
      console.error('❌ Video element:', videoElement);
      console.error('❌ Canvas element:', canvasElement);
    }
  };

  // Função para tirar a foto (mantida para compatibilidade)
  const takePhoto = () => {
    console.log('📸 Função takePhoto chamada');
    console.log('🔍 Video ref no takePhoto:', videoRef.current);
    console.log('🔍 Canvas ref no takePhoto:', canvasRef.current);
    
    if (videoRef.current && canvasRef.current) {
      takePhotoWithRefs(videoRef.current, canvasRef.current);
    } else {
      console.error('❌ Video ou canvas não encontrados');
      console.error('❌ Video ref:', videoRef.current);
      console.error('❌ Canvas ref:', canvasRef.current);
    }
  };

  // Função para capturar foto automaticamente
  const capturePhoto = async () => {
    try {
      console.log('🎥 Iniciando captura de foto...');
      setIsCapturingPhoto(true);
      
      // Solicitar acesso à câmera
      console.log('📷 Solicitando acesso à câmera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      console.log('✅ Câmera acessada com sucesso');
      
      // Aguardar um momento para o elemento <video> ser renderizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔍 Verificando videoRef.current após delay:', videoRef.current);
      
      if (videoRef.current) {
        console.log('✅ videoRef.current existe! Configurando stream...');
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        console.log('📹 Câmera iniciada, aguardando 2 segundos...');
        
        // Armazenar referências para evitar perda durante re-render
        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        
        // Aguardar o vídeo carregar dados e começar a reproduzir
        const waitForVideoData = async () => {
          try {
            console.log('🎬 Aguardando dados do vídeo...');
            
            // Aguardar o evento onloadeddata para garantir que o vídeo tem dados
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Timeout: Vídeo não carregou em tempo hábil'));
              }, 5000);
              
              videoElement.onloadeddata = () => {
                clearTimeout(timeout);
                console.log('✅ Vídeo carregou dados!');
                resolve();
              };
              
              videoElement.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Erro ao carregar vídeo'));
              };
            });
            
            // Forçar o play do vídeo e aguardar frame válido
            console.log('🎬 Forçando reprodução do vídeo...');
            try {
              await videoElement.play();
              console.log('✅ Vídeo iniciado com sucesso!');
            } catch (playError) {
              console.warn('⚠️ Erro ao reproduzir vídeo automaticamente:', playError);
              // Continuar mesmo com erro de autoplay
            }
            
            // Aguardar um frame válido com timeout
            console.log('🎬 Aguardando frame válido...');
            let frameAttempts = 0;
            const maxFrameAttempts = 30; // 30 tentativas (cerca de 0.5 segundos)
            
            await new Promise<void>((resolve, reject) => {
              const checkFrame = () => {
                frameAttempts++;
                console.log(`🔍 Video currentTime: ${videoElement.currentTime} (tentativa ${frameAttempts}/${maxFrameAttempts})`);
                
                if (videoElement.currentTime > 0) {
                  console.log('✅ Frame válido encontrado!');
                  resolve();
                } else if (frameAttempts >= maxFrameAttempts) {
                  console.warn('⚠️ Timeout aguardando frame, tentando capturar mesmo assim...');
                  resolve(); // Continuar mesmo sem currentTime > 0
                } else {
                  console.log('⏳ Aguardando frame...');
                  requestAnimationFrame(checkFrame);
                }
              };
              checkFrame();
            });
            
            // Capturar a foto
            console.log('📸 Capturando foto...');
            if (canvasElement) {
              takePhotoWithRefs(videoElement, canvasElement);
            } else {
              console.error('❌ Canvas não encontrado');
            }
            
          } catch (error) {
            console.error('❌ Erro ao aguardar vídeo:', error);
            alert('Erro: Câmera não conseguiu iniciar corretamente. Tente novamente.');
          }
        };
        
        // Iniciar o processo
        waitForVideoData();
        
        
      } else {
        console.error('❌ videoRef.current é NULL! O elemento <video> não foi encontrado.');
        console.error('❌ Isso pode ser causado por re-render do componente.');
      }
    } catch (error) {
      console.error('❌ Erro ao acessar câmera:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Permissão para usar a câmera negada. Ative nas configurações do navegador.');
        } else if (error.name === 'NotFoundError') {
          alert('Câmera não encontrada. Verifique se há uma câmera conectada.');
        } else if (error.name === 'NotReadableError') {
          alert('Câmera está sendo usada por outro aplicativo. Feche outros programas que usam a câmera.');
        } else {
          alert(`Erro ao acessar câmera: ${error.message}`);
        }
      } else {
        alert('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  // Função para obter geolocalização
  const getCurrentLocation = async () => {
    try {
      console.log('🌍 Iniciando obtenção de geolocalização...');
      setIsGettingLocation(true);
      
      if (!navigator.geolocation) {
        throw new Error('Geolocalização não suportada');
      }
      
      console.log('📍 Solicitando posição GPS...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      console.log('✅ Coordenadas obtidas:', latitude, longitude);
      
      // Obter endereço usando reverse geocoding
      console.log('🏠 Obtendo endereço...');
      const address = await getAddressFromCoords(latitude, longitude);
      console.log('✅ Endereço obtido:', address);
      
      setLocation({ lat: latitude, lng: longitude, address });
      setIsReady(true);
      
      console.log('🎉 Localização configurada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao obter localização:', error);
      alert('Não foi possível obter a localização. Verifique as permissões.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Função para obter endereço a partir das coordenadas
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      } else {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const validateForm = () => {
    return formData.photo && formData.latitude && formData.longitude;
  };

  const handleSubmit = async () => {
    if (!isReady) return;

    const timeClockData = {
      employeeId: employee.id,
      photo: capturedPhoto,
      latitude: location?.lat,
      longitude: location?.lng,
      address: location?.address,
      notes: `Ponto ${isEntry ? 'entrada' : 'saída'} registrado automaticamente`
    };

    try {
      await onSubmit(timeClockData);
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      alert('Erro ao registrar ponto. Tente novamente.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Ponto Eletrônico Automático
          </h2>
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
          {/* Informações do Funcionário */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Funcionário</h3>
            <p className="text-sm text-gray-600">{stableEmployee?.name}</p>
            <p className="text-xs text-gray-500">{stableEmployee?.email}</p>
          </div>

          {/* Relógio em Tempo Real */}
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-gray-900">
              {currentTime.toLocaleTimeString('pt-BR')}
            </div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleDateString('pt-BR')}
            </div>
          </div>

          {/* Status do Sistema */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Camera className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <div className="text-sm font-medium text-gray-900">Foto</div>
              <div className="text-xs text-gray-500">
                {capturedPhoto ? 'Capturada' : 'Pendente'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <div className="text-sm font-medium text-gray-900">Localização</div>
              <div className="text-xs text-gray-500">
                {location ? 'Obtida' : 'Pendente'}
              </div>
            </div>
          </div>

          {/* Botão de Captura */}
          {!capturedPhoto && (
            <div className="text-center">
              <Button
                onClick={() => {
                  console.log('🖱️ Botão "Tirar Foto" clicado!');
                  capturePhoto();
                }}
                disabled={isCapturingPhoto}
                className="w-full py-4 text-lg"
                size="lg"
              >
                <Camera className="h-6 w-6 mr-2" />
                {isCapturingPhoto ? 'Acessando Câmera...' : 'Tirar Foto'}
              </Button>
            </div>
          )}

          {/* Preview da câmera */}
          {isCapturingPhoto && !capturedPhoto && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                autoPlay
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <div className="text-sm">Preparando câmera...</div>
                </div>
              </div>
            </div>
          )}

          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Foto Capturada */}
          {capturedPhoto && (
            <div className="text-center space-y-4">
              <div className="relative">
                <img 
                  src={capturedPhoto} 
                  alt="Foto capturada" 
                  className="w-full max-w-sm mx-auto rounded-lg border-2 border-green-500 shadow-lg"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  ✓ Capturada
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Foto capturada com sucesso!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Horário: {currentTime.toLocaleTimeString('pt-BR')}
                </p>
              </div>
              
              {/* Botão para tirar nova foto */}
              <Button
                variant="outline"
                onClick={() => {
                  setCapturedPhoto('');
                  setLocation(null);
                  setIsReady(false);
                  capturePhoto();
                }}
                className="text-sm"
                size="sm"
              >
                <Camera className="h-4 w-4 mr-2" />
                Tirar Nova Foto
              </Button>
            </div>
          )}

          {/* Status da Localização */}
          {isGettingLocation && (
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-sm text-blue-700">Obtendo localização...</div>
            </div>
          )}

          {location && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-700 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Localização obtida</span>
              </div>
              <p className="text-sm text-green-600">{location.address}</p>
            </div>
          )}

          {/* Resumo de Segurança */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Resumo de Segurança</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Foto capturada:</span>
                <span className={`text-sm font-medium ${capturedPhoto ? 'text-green-600' : 'text-red-600'}`}>
                  {capturedPhoto ? '✓ Sim' : '✗ Não'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Localização:</span>
                <span className={`text-sm font-medium ${location ? 'text-green-600' : 'text-red-600'}`}>
                  {location ? '✓ Sim' : '✗ Não'}
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Envio */}
          <Button
            onClick={handleSubmit}
            disabled={!isReady || isLoading}
            className="w-full py-3 text-lg"
            size="lg"
          >
            <Clock className="h-5 w-5 mr-2" />
            {isLoading ? 'Registrando...' : 'Registrar Ponto'}
          </Button>

          {/* Mensagens de Erro */}
          {!formData.photo && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Foto é obrigatória</span>
            </div>
          )}

          {!formData.latitude && !formData.longitude && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Localização é obrigatória</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}