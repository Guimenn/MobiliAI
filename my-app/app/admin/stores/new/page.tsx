'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Save, 
  Store, 
  MapPin, 
  Phone, 
  Mail,
  Settings
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

export default function NewStorePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    description: '',
    isActive: true,
    workingHours: {
      monday: { open: '08:00', close: '18:00', isOpen: true },
      tuesday: { open: '08:00', close: '18:00', isOpen: true },
      wednesday: { open: '08:00', close: '18:00', isOpen: true },
      thursday: { open: '08:00', close: '18:00', isOpen: true },
      friday: { open: '08:00', close: '18:00', isOpen: true },
      saturday: { open: '08:00', close: '17:00', isOpen: true },
      sunday: { open: '09:00', close: '15:00', isOpen: false }
    },
    settings: {
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
      const newStore = await adminAPI.createStore(formData);
      router.push(`/admin/stores/${newStore.id}`);
    } catch (error) {
      console.error('Erro ao criar loja:', error);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/stores')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#3e2626] rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Nova Loja</h1>
                  <p className="text-sm text-gray-600">Cadastre uma nova filial</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="bg-[#3e2626] hover:bg-[#8B4513]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Criando...' : 'Criar Loja'}
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                Dados principais da nova loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Loja *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Loja Centro"
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
                    placeholder="contato@loja.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="SP"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">CEP *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="01234-567"
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
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva características especiais desta filial..."
                  rows={3}
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
                <Settings className="h-5 w-5 mr-2" />
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
                <Settings className="h-5 w-5 mr-2" />
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

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/admin/stores')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-[#3e2626] hover:bg-[#8B4513]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Criando Loja...' : 'Criar Loja'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}