'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  ArrowLeft,
  Shield,
  Bell,
  Database,
  Mail,
  Globe,
  Lock,
  Users,
  Store,
  Package,
  DollarSign,
  Bell as NotificationIcon,
  Key,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    company: {
      name: 'PintAI',
      email: 'contato@pintai.com',
      phone: '(11) 99999-9999',
      address: 'Rua das Tintas, 123 - São Paulo, SP',
      cnpj: '12.345.678/0001-90'
    },
    system: {
      maintenanceMode: false,
      autoBackup: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      salesAlerts: true,
      lowStockAlerts: true
    },
    security: {
      twoFactorAuth: false,
      passwordExpiration: 90,
      ipWhitelist: '',
      auditLog: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      // Aqui você implementaria a lógica para salvar as configurações
      console.log('Salvando configurações:', settings);
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Empresa', icon: Store },
    { id: 'system', label: 'Sistema', icon: Settings },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield }
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
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
                <p className="text-sm text-gray-600">Gerencie as configurações do sistema</p>
              </div>
            </div>
            <Button 
              className="bg-[#3e2626] hover:bg-[#8B4513]"
              onClick={saveSettings}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categorias</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-none ${
                          activeTab === tab.id
                            ? 'bg-[#3e2626] text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mr-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Company Settings */}
            {activeTab === 'company' && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Empresa</CardTitle>
                  <CardDescription>Configure os dados da sua empresa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Empresa
                      </label>
                      <Input
                        value={settings.company.name}
                        onChange={(e) => setSettings({
                          ...settings,
                          company: { ...settings.company, name: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CNPJ
                      </label>
                      <Input
                        value={settings.company.cnpj}
                        onChange={(e) => setSettings({
                          ...settings,
                          company: { ...settings.company, cnpj: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      value={settings.company.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        company: { ...settings.company, email: e.target.value }
                      })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <Input
                        value={settings.company.phone}
                        onChange={(e) => setSettings({
                          ...settings,
                          company: { ...settings.company, phone: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço
                      </label>
                      <Input
                        value={settings.company.address}
                        onChange={(e) => setSettings({
                          ...settings,
                          company: { ...settings.company, address: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>Configure o comportamento do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Modo de Manutenção</h3>
                      <p className="text-sm text-gray-500">Ativar modo de manutenção do sistema</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system.maintenanceMode}
                        onChange={(e) => setSettings({
                          ...settings,
                          system: { ...settings.system, maintenanceMode: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Backup Automático</h3>
                      <p className="text-sm text-gray-500">Fazer backup automático dos dados</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system.autoBackup}
                        onChange={(e) => setSettings({
                          ...settings,
                          system: { ...settings.system, autoBackup: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout de Sessão (minutos)
                    </label>
                    <Input
                      type="number"
                      value={settings.system.sessionTimeout}
                      onChange={(e) => setSettings({
                        ...settings,
                        system: { ...settings.system, sessionTimeout: parseInt(e.target.value) }
                      })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Tentativas de Login
                    </label>
                    <Input
                      type="number"
                      value={settings.system.maxLoginAttempts}
                      onChange={(e) => setSettings({
                        ...settings,
                        system: { ...settings.system, maxLoginAttempts: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Notificações</CardTitle>
                  <CardDescription>Configure como receber notificações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Notificações por Email</h3>
                      <p className="text-sm text-gray-500">Receber notificações por email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailNotifications: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Alertas de Vendas</h3>
                      <p className="text-sm text-gray-500">Notificar sobre novas vendas</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.salesAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, salesAlerts: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Alertas de Estoque Baixo</h3>
                      <p className="text-sm text-gray-500">Notificar quando o estoque estiver baixo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.lowStockAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, lowStockAlerts: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Segurança</CardTitle>
                  <CardDescription>Configure as políticas de segurança do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Autenticação de Dois Fatores</h3>
                      <p className="text-sm text-gray-500">Requerer 2FA para todos os usuários</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, twoFactorAuth: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiração de Senha (dias)
                    </label>
                    <Input
                      type="number"
                      value={settings.security.passwordExpiration}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, passwordExpiration: parseInt(e.target.value) }
                      })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lista de IPs Permitidos (separados por vírgula)
                    </label>
                    <Input
                      value={settings.security.ipWhitelist}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, ipWhitelist: e.target.value }
                      })}
                      placeholder="192.168.1.1, 10.0.0.1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Log de Auditoria</h3>
                      <p className="text-sm text-gray-500">Registrar todas as ações dos usuários</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.auditLog}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, auditLog: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
