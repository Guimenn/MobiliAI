'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Clock, CheckCircle, AlertCircle, Camera, MapPin, User } from 'lucide-react';

import { Loader } from '@/components/ui/ai/loader';
interface TimeClockEntry {
  id?: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  overtimeHours: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY';
  notes?: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  clockInPhoto?: string;
  clockOutPhoto?: string;
}

interface TimeClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (timeClockData: any) => Promise<void>;
  employee: any;
  isLoading?: boolean;
  existingEntry?: TimeClockEntry;
}

export default function TimeClockModal({
  isOpen,
  onClose,
  onSubmit,
  employee,
  isLoading = false,
  existingEntry
}: TimeClockModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Data atual automática
    clockIn: new Date().toTimeString().split(' ')[0].substring(0, 5), // Horário atual automático
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

  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [location, setLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isEntry, setIsEntry] = useState(true); // true = entrada, false = saída
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [calculatedHours, setCalculatedHours] = useState({
    totalHours: 0,
    overtimeHours: 0,
    regularHours: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calcular horas automaticamente
  useEffect(() => {
    if (formData.clockIn && formData.clockOut) {
      const clockInTime = new Date(`2000-01-01T${formData.clockIn}`);
      const clockOutTime = new Date(`2000-01-01T${formData.clockOut}`);
      
      let totalMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60);
      
      // Subtrair tempo de pausa se informado
      if (formData.breakStart && formData.breakEnd) {
        const breakStart = new Date(`2000-01-01T${formData.breakStart}`);
        const breakEnd = new Date(`2000-01-01T${formData.breakEnd}`);
        const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
        totalMinutes -= breakMinutes;
      }
      
      const totalHours = Math.max(0, totalMinutes / 60);
      const regularHours = Math.min(totalHours, 8); // 8 horas regulares
      const overtimeHours = Math.max(0, totalHours - 8);
      
      setCalculatedHours({
        totalHours,
        overtimeHours,
        regularHours
      });
    }
  }, [formData.clockIn, formData.clockOut, formData.breakStart, formData.breakEnd]);

  // Atualizar horário automaticamente a cada segundo
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

  // Função para capturar foto automaticamente
  const capturePhoto = async () => {
    try {
      setIsCapturingPhoto(true);
      
      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Aguardar um momento para a câmera estabilizar
        setTimeout(() => {
          takePhoto();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Não foi possível acessar a câmera. Verifique as permissões.');
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  // Função para tirar a foto
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);
        setFormData(prev => ({ ...prev, photo: photoData }));
        
        // Parar a câmera
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Obter localização automaticamente após tirar a foto
        getCurrentLocation();
      }
    }
  };

  // Função para obter geolocalização
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      if (!navigator.geolocation) {
        throw new Error('Geolocalização não suportada');
      }
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // Obter endereço usando reverse geocoding
      const address = await getAddressFromCoords(latitude, longitude);
      
      setLocation({ lat: latitude, lng: longitude, address });
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude,
        address
      }));
      
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      alert('Não foi possível obter a localização. Verifique as permissões.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Função para obter endereço a partir das coordenadas
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      // Usando OpenStreetMap Nominatim (gratuito)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    if (!formData.clockIn) {
      newErrors.clockIn = 'Horário de entrada é obrigatório';
    }

    if (formData.clockOut && formData.clockIn && formData.clockOut <= formData.clockIn) {
      newErrors.clockOut = 'Horário de saída deve ser posterior ao de entrada';
    }

    if (formData.breakStart && formData.breakEnd && formData.breakEnd <= formData.breakStart) {
      newErrors.breakEnd = 'Fim do intervalo deve ser posterior ao início';
    }

    // Validações de segurança
    if (!formData.photo) {
      newErrors.photo = 'Foto de presença é obrigatória';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Localização é obrigatória';
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
      const timeClockData = {
        ...formData,
        employeeId: employee.id,
        totalHours: calculatedHours.totalHours,
        overtimeHours: calculatedHours.overtimeHours
      };
      await onSubmit(timeClockData);
      onClose();
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'LATE':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'ABSENT':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'HALF_DAY':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {existingEntry ? 'Editar Ponto' : 'Registrar Ponto'}
              </h2>
              <p className="text-sm text-gray-600">
                {employee?.name} - {employee?.email}
              </p>
            </div>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Data e Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações do Ponto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={errors.date ? 'border-red-500' : ''}
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon('PRESENT')}
                        <span>Presente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="LATE">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon('LATE')}
                        <span>Atrasado</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ABSENT">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon('ABSENT')}
                        <span>Faltou</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="HALF_DAY">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon('HALF_DAY')}
                        <span>Meio Período</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Validação de Presença */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Validação de Presença</h3>
            
            {/* Captura de Foto */}
            <div className="space-y-3">
              <Label>Foto de Presença</Label>
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={capturePhoto}
                  disabled={isCapturingPhoto}
                  className="flex items-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>{isCapturingPhoto ? 'Acessando...' : 'Tirar Foto'}</span>
                </Button>
                
                {capturedPhoto && (
                  <div className="flex items-center space-x-2">
                    <img 
                      src={capturedPhoto} 
                      alt="Foto capturada" 
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCapturedPhoto('');
                        setFormData(prev => ({ ...prev, photo: '' }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Preview da câmera */}
              {videoRef.current?.srcObject && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full max-w-md rounded-lg border"
                    autoPlay
                    muted
                    playsInline
                  />
                  <Button
                    type="button"
                    onClick={takePhoto}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black hover:bg-gray-100"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Capturar
                  </Button>
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
              {errors.photo && <p className="text-red-500 text-sm">{errors.photo}</p>}
            </div>
            
            {/* Geolocalização */}
            <div className="space-y-3">
              <Label>Localização</Label>
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="flex items-center space-x-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>{isGettingLocation ? 'Obtendo...' : 'Obter Localização'}</span>
                </Button>
                
                {location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="max-w-xs truncate">{location.address}</span>
                  </div>
                )}
              </div>
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
            </div>
          </div>

          {/* Horários */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Horários</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clockIn">Entrada *</Label>
                <Input
                  id="clockIn"
                  type="time"
                  value={formData.clockIn}
                  onChange={(e) => handleInputChange('clockIn', e.target.value)}
                  className={errors.clockIn ? 'border-red-500' : ''}
                />
                {errors.clockIn && <p className="text-red-500 text-sm mt-1">{errors.clockIn}</p>}
              </div>

              <div>
                <Label htmlFor="clockOut">Saída</Label>
                <Input
                  id="clockOut"
                  type="time"
                  value={formData.clockOut}
                  onChange={(e) => handleInputChange('clockOut', e.target.value)}
                  className={errors.clockOut ? 'border-red-500' : ''}
                />
                {errors.clockOut && <p className="text-red-500 text-sm mt-1">{errors.clockOut}</p>}
              </div>

              <div>
                <Label htmlFor="breakStart">Início do Intervalo</Label>
                <Input
                  id="breakStart"
                  type="time"
                  value={formData.breakStart}
                  onChange={(e) => handleInputChange('breakStart', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="breakEnd">Fim do Intervalo</Label>
                <Input
                  id="breakEnd"
                  type="time"
                  value={formData.breakEnd}
                  onChange={(e) => handleInputChange('breakEnd', e.target.value)}
                  className={errors.breakEnd ? 'border-red-500' : ''}
                />
                {errors.breakEnd && <p className="text-red-500 text-sm mt-1">{errors.breakEnd}</p>}
              </div>
            </div>
          </div>

          {/* Resumo das Horas */}
          {formData.clockIn && formData.clockOut && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Resumo das Horas</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {calculatedHours.totalHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {calculatedHours.regularHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-600">Regulares</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {calculatedHours.overtimeHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-600">Extras</div>
                </div>
              </div>
            </div>
          )}

          {/* Resumo de Segurança */}
          {(capturedPhoto || location) && (
            <div className="bg-green-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-green-900 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Validação de Presença
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  {capturedPhoto ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-700">Foto capturada</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-700">Foto obrigatória</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {location ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-700">Localização obtida</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-700">Localização obrigatória</span>
                    </>
                  )}
                </div>
              </div>
              
              {location && (
                <div className="text-xs text-green-600">
                  <strong>Local:</strong> {location.address}
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações sobre o ponto (opcional)"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  {existingEntry ? 'Atualizar Ponto' : 'Registrar Ponto'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
