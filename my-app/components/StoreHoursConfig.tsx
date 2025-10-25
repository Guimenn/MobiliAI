'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock, Calendar } from 'lucide-react';

interface StoreHoursConfigProps {
  storeData?: {
    openingTime?: string;
    closingTime?: string;
    workingDays?: string[];
    lunchStart?: string;
    lunchEnd?: string;
  };
  onChange: (data: {
    openingTime?: string;
    closingTime?: string;
    workingDays?: string[];
    lunchStart?: string;
    lunchEnd?: string;
  }) => void;
}

const DAYS_OF_WEEK = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

export default function StoreHoursConfig({ storeData, onChange }: StoreHoursConfigProps) {
  const [openingTime, setOpeningTime] = useState(storeData?.openingTime || '08:00');
  const [closingTime, setClosingTime] = useState(storeData?.closingTime || '18:00');
  const [workingDays, setWorkingDays] = useState<string[]>(storeData?.workingDays || ['segunda', 'terca', 'quarta', 'quinta', 'sexta']);
  const [lunchStart, setLunchStart] = useState(storeData?.lunchStart || '12:00');
  const [lunchEnd, setLunchEnd] = useState(storeData?.lunchEnd || '13:00');
  const [hasLunchBreak, setHasLunchBreak] = useState(!!storeData?.lunchStart);

  useEffect(() => {
    const data = {
      openingTime,
      closingTime,
      workingDays,
      lunchStart: hasLunchBreak ? lunchStart : undefined,
      lunchEnd: hasLunchBreak ? lunchEnd : undefined
    };
    console.log('StoreHoursConfig: Enviando dados:', data);
    onChange(data);
  }, [openingTime, closingTime, workingDays, lunchStart, lunchEnd, hasLunchBreak]);

  const toggleDay = (day: string) => {
    setWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="space-y-6">
      {/* Horário de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Horário de Funcionamento</span>
          </CardTitle>
          <CardDescription>
            Configure os horários de abertura e fechamento da loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openingTime">Horário de Abertura</Label>
              <Input
                id="openingTime"
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingTime">Horário de Fechamento</Label>
              <Input
                id="closingTime"
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dias de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Dias de Funcionamento</span>
          </CardTitle>
          <CardDescription>
            Selecione os dias da semana em que a loja funciona
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.key} className="flex items-center space-x-3">
                <Switch
                  id={day.key}
                  checked={workingDays.includes(day.key)}
                  onCheckedChange={() => toggleDay(day.key)}
                />
                <Label htmlFor={day.key} className="text-sm font-medium">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Horário de Almoço */}
      <Card>
        <CardHeader>
          <CardTitle>Horário de Almoço</CardTitle>
          <CardDescription>
            Configure se a loja tem horário de almoço
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Switch
              id="hasLunchBreak"
              checked={hasLunchBreak}
              onCheckedChange={setHasLunchBreak}
            />
            <Label htmlFor="hasLunchBreak" className="text-sm font-medium">
              Loja tem horário de almoço
            </Label>
          </div>

          {hasLunchBreak && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lunchStart">Início do Almoço</Label>
                <Input
                  id="lunchStart"
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchEnd">Fim do Almoço</Label>
                <Input
                  id="lunchEnd"
                  type="time"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
