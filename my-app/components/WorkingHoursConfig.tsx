'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Save,
  Calendar,
  Timer
} from 'lucide-react';

interface WorkingHoursConfigProps {
  workingHours?: any;
  onSave: (workingHours: any) => void;
  disabled?: boolean;
}

interface DayConfig {
  startTime: string;
  endTime: string;
  lunchBreakMinutes: number;
  regularHours: number;
  enabled: boolean;
}

const defaultDayConfig: DayConfig = {
  startTime: '08:00',
  endTime: '17:00',
  lunchBreakMinutes: 60,
  regularHours: 8,
  enabled: true
};

const daysOfWeek = [
  { key: 'segunda-feira', label: 'Segunda-feira' },
  { key: 'terça-feira', label: 'Terça-feira' },
  { key: 'quarta-feira', label: 'Quarta-feira' },
  { key: 'quinta-feira', label: 'Quinta-feira' },
  { key: 'sexta-feira', label: 'Sexta-feira' },
  { key: 'sábado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

export default function WorkingHoursConfig({ workingHours, onSave, disabled = false }: WorkingHoursConfigProps) {
  const [config, setConfig] = useState<any>({
    default: { ...defaultDayConfig },
    ...workingHours
  });

  const [useDefaultForAll, setUseDefaultForAll] = useState(true);

  useEffect(() => {
    if (workingHours) {
      setConfig(workingHours);
      // Verificar se todos os dias usam a configuração padrão
      const hasCustomDays = daysOfWeek.some(day => 
        workingHours[day.key] && 
        (workingHours[day.key].startTime !== workingHours.default?.startTime ||
         workingHours[day.key].endTime !== workingHours.default?.endTime ||
         workingHours[day.key].lunchBreakMinutes !== workingHours.default?.lunchBreakMinutes ||
         workingHours[day.key].regularHours !== workingHours.default?.regularHours)
      );
      setUseDefaultForAll(!hasCustomDays);
    }
  }, [workingHours]);

  const handleDefaultChange = (field: keyof DayConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      default: {
        ...prev.default,
        [field]: value
      }
    }));
  };

  const handleDayChange = (dayKey: string, field: keyof DayConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    // Se usar padrão para todos, remover configurações específicas dos dias
    if (useDefaultForAll) {
      const cleanConfig = { default: config.default };
      onSave(cleanConfig);
    } else {
      onSave(config);
    }
  };

  const calculateTotalHours = (startTime: string, endTime: string, lunchBreakMinutes: number) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const totalMinutes = endMinutes - startMinutes - lunchBreakMinutes;
    return Math.max(0, totalMinutes / 60);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Configuração de Horários de Expediente</span>
        </CardTitle>
        <CardDescription>
          Configure os horários de trabalho para este funcionário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuração Padrão */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Timer className="h-4 w-4" />
            <span>Configuração Padrão</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-startTime">Horário de Início</Label>
              <Input
                id="default-startTime"
                type="time"
                value={config.default?.startTime || '08:00'}
                onChange={(e) => handleDefaultChange('startTime', e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-endTime">Horário de Fim</Label>
              <Input
                id="default-endTime"
                type="time"
                value={config.default?.endTime || '17:00'}
                onChange={(e) => handleDefaultChange('endTime', e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-lunchBreak">Intervalo (min)</Label>
              <Input
                id="default-lunchBreak"
                type="number"
                min="0"
                max="180"
                value={config.default?.lunchBreakMinutes || 60}
                onChange={(e) => handleDefaultChange('lunchBreakMinutes', parseInt(e.target.value) || 0)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-regularHours">Horas Regulares</Label>
              <Input
                id="default-regularHours"
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={config.default?.regularHours || 8}
                onChange={(e) => handleDefaultChange('regularHours', parseFloat(e.target.value) || 0)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Total de horas:</strong> {calculateTotalHours(
                config.default?.startTime || '08:00',
                config.default?.endTime || '17:00',
                config.default?.lunchBreakMinutes || 60
              ).toFixed(1)} horas
            </p>
          </div>
        </div>

        {/* Configuração por Dia */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Configuração por Dia da Semana</span>
            </h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="use-default"
                checked={useDefaultForAll}
                onCheckedChange={setUseDefaultForAll}
                disabled={disabled}
              />
              <Label htmlFor="use-default">Usar padrão para todos os dias</Label>
            </div>
          </div>

          {!useDefaultForAll && (
            <div className="space-y-4">
              {daysOfWeek.map((day) => (
                <Card key={day.key} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{day.label}</h4>
                    <Switch
                      checked={config[day.key]?.enabled !== false}
                      onCheckedChange={(enabled) => handleDayChange(day.key, 'enabled', enabled)}
                      disabled={disabled}
                    />
                  </div>

                  {config[day.key]?.enabled !== false && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Início</Label>
                        <Input
                          type="time"
                          value={config[day.key]?.startTime || config.default?.startTime || '08:00'}
                          onChange={(e) => handleDayChange(day.key, 'startTime', e.target.value)}
                          disabled={disabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Fim</Label>
                        <Input
                          type="time"
                          value={config[day.key]?.endTime || config.default?.endTime || '17:00'}
                          onChange={(e) => handleDayChange(day.key, 'endTime', e.target.value)}
                          disabled={disabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Intervalo (min)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="180"
                          value={config[day.key]?.lunchBreakMinutes || config.default?.lunchBreakMinutes || 60}
                          onChange={(e) => handleDayChange(day.key, 'lunchBreakMinutes', parseInt(e.target.value) || 0)}
                          disabled={disabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Horas Regulares</Label>
                        <Input
                          type="number"
                          min="0"
                          max="12"
                          step="0.5"
                          value={config[day.key]?.regularHours || config.default?.regularHours || 8}
                          onChange={(e) => handleDayChange(day.key, 'regularHours', parseFloat(e.target.value) || 0)}
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {!disabled && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Salvar Configuração</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
