'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Shield,
  Bell,
  Globe,
  AlertCircle
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

interface StoreSettingsProps {
  storeId: string;
  store: any;
  onUpdate: () => void;
}

export default function StoreSettings({ storeId, store, onUpdate }: StoreSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: store?.name || '',
    address: store?.address || '',
    city: store?.city || '',
    state: store?.state || '',
    zipCode: store?.zipCode || '',
    phone: store?.phone || '',
    email: store?.email || '',
    isActive: store?.isActive || true,
    workingHours: store?.workingHours || {
      monday: { open: '08:00', close: '18:00', isOpen: true },
      tuesday: { open: '08:00', close: '18:00', isOpen: true },
      wednesday: { open: '08:00', close: '18:00', isOpen: true },
      thursday: { open: '08:00', close: '18:00', isOpen: true },
      friday: { open: '08:00', close: '18:00', isOpen: true },
      saturday: { open: '08:00', close: '17:00', isOpen: true },
      sunday: { open: '09:00', close: '15:00', isOpen: false }
    },
    settings: store?.settings || {
      allowOnlineOrders: true,
      requireApprovalForOrders: false,
      sendNotifications: true,
      autoAcceptPayments: true,
      lowStockAlert: true,
      customerRegistrationRequired: false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.updateStore(storeId, formData);
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações da Loja</h2>
          <p className="text-gray-600">Gerencie as informações e configurações da filial</p>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="bg-[#3e2626] hover:bg-[#8B4513]"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Dados principais da loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Loja</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Loja ativa</Label>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Horário de Funcionamento
            </CardTitle>
            <CardDescription>
              Configure os horários de funcionamento da loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {daysOfWeek.map((day) => (
              <div key={day.key} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-32">
                  <Label>{day.label}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.workingHours[day.key].isOpen}
                    onCheckedChange={(checked) => handleWorkingHoursChange(day.key, 'isOpen', checked)}
                  />
                  <Label>Aberto</Label>
                </div>
                {formData.workingHours[day.key].isOpen && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={formData.workingHours[day.key].open}
                      onChange={(e) => handleWorkingHoursChange(day.key, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span>até</span>
                    <Input
                      type="time"
                      value={formData.workingHours[day.key].close}
                      onChange={(e) => handleWorkingHoursChange(day.key, 'close', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Store Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Configurações da Loja
            </CardTitle>
            <CardDescription>
              Configurações específicas de funcionamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowOnlineOrders">Permitir pedidos online</Label>
                    <p className="text-sm text-gray-500">Clientes podem fazer pedidos pela internet</p>
                  </div>
                  <Switch
                    id="allowOnlineOrders"
                    checked={formData.settings.allowOnlineOrders}
                    onCheckedChange={(checked) => handleSettingsChange('allowOnlineOrders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireApprovalForOrders">Exigir aprovação para pedidos</Label>
                    <p className="text-sm text-gray-500">Todos os pedidos precisam ser aprovados</p>
                  </div>
                  <Switch
                    id="requireApprovalForOrders"
                    checked={formData.settings.requireApprovalForOrders}
                    onCheckedChange={(checked) => handleSettingsChange('requireApprovalForOrders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sendNotifications">Enviar notificações</Label>
                    <p className="text-sm text-gray-500">Notificar sobre novos pedidos e atualizações</p>
                  </div>
                  <Switch
                    id="sendNotifications"
                    checked={formData.settings.sendNotifications}
                    onCheckedChange={(checked) => handleSettingsChange('sendNotifications', checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoAcceptPayments">Aceitar pagamentos automaticamente</Label>
                    <p className="text-sm text-gray-500">Aprovar pagamentos sem confirmação manual</p>
                  </div>
                  <Switch
                    id="autoAcceptPayments"
                    checked={formData.settings.autoAcceptPayments}
                    onCheckedChange={(checked) => handleSettingsChange('autoAcceptPayments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lowStockAlert">Alerta de estoque baixo</Label>
                    <p className="text-sm text-gray-500">Notificar quando produtos estão com estoque baixo</p>
                  </div>
                  <Switch
                    id="lowStockAlert"
                    checked={formData.settings.lowStockAlert}
                    onCheckedChange={(checked) => handleSettingsChange('lowStockAlert', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="customerRegistrationRequired">Cadastro obrigatório</Label>
                    <p className="text-sm text-gray-500">Clientes devem se cadastrar para comprar</p>
                  </div>
                  <Switch
                    id="customerRegistrationRequired"
                    checked={formData.settings.customerRegistrationRequired}
                    onCheckedChange={(checked) => handleSettingsChange('customerRegistrationRequired', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Configurações Adicionais
            </CardTitle>
            <CardDescription>
              Outras configurações específicas da loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição da Loja</Label>
              <Textarea
                id="description"
                placeholder="Descreva características especiais desta filial..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações Internas</Label>
              <Textarea
                id="notes"
                placeholder="Notas internas sobre a loja..."
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis que afetam a loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-medium text-red-900">Desativar Loja</h4>
                <p className="text-sm text-red-700">A loja não aparecerá para clientes e não aceitará novos pedidos</p>
              </div>
              <Button variant="destructive" size="sm">
                Desativar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-medium text-red-900">Excluir Loja</h4>
                <p className="text-sm text-red-700">Esta ação é irreversível e removerá todos os dados da loja</p>
              </div>
              <Button variant="destructive" size="sm">
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

