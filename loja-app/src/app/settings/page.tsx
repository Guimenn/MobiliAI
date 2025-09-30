'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { 
  Settings, 
  User, 
  Store, 
  Bell, 
  Shield, 
  Save,
  Eye,
  EyeOff,
  CreditCard,
  Truck,
  Palette,
  Database
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'customer';
  storeId?: string;
}

interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  deliveryRadius: number;
  minOrderValue: number;
}

interface UserSettings {
  name: string;
  email: string;
  phone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
  };
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: '',
    email: '',
    phone: '',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    privacy: {
      showEmail: true,
      showPhone: false
    }
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'PintAi - Loja Central',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 99999-9999',
    email: 'contato@pintai.com.br',
    workingHours: 'Segunda a Sexta: 8h às 18h',
    deliveryRadius: 15,
    minOrderValue: 50
  });

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('loja-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Carregar dados do usuário
        setUserSettings({
          name: userData.name,
          email: userData.email,
          phone: '(11) 99999-9999',
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          privacy: {
            showEmail: true,
            showPhone: false
          }
        });
      }
    };
    
    checkAuth();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('loja-user');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar dados do usuário no localStorage
      if (user) {
        const updatedUser = {
          ...user,
          name: userSettings.name,
          email: userSettings.email
        };
        localStorage.setItem('loja-user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'store', name: 'Loja', icon: Store },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'privacy', name: 'Privacidade', icon: Shield }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa fazer login para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user}
      onLogout={handleLogout}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-3 h-8 w-8" />
            Configurações
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-none ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="mr-3 h-4 w-4" />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo
                      </label>
                      <Input
                        value={userSettings.name}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="seu@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <Input
                        value={userSettings.phone}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nova Senha
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Deixe em branco para manter atual"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary">
                      {user?.role === 'cashier' ? 'Funcionário' : 'Cliente'}
                    </Badge>
                    {user?.storeId && (
                      <Badge variant="outline">
                        Loja: {user.storeId}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'store' && user?.role === 'cashier' && (
              <Card>
                <CardHeader>
                  <CardTitle>Configurações da Loja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Loja
                      </label>
                      <Input
                        value={storeSettings.name}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome da loja"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço
                      </label>
                      <Input
                        value={storeSettings.address}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Endereço completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <Input
                        value={storeSettings.phone}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={storeSettings.email}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@loja.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horário de Funcionamento
                      </label>
                      <Input
                        value={storeSettings.workingHours}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, workingHours: e.target.value }))}
                        placeholder="Segunda a Sexta: 8h às 18h"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Raio de Entrega (km)
                      </label>
                      <Input
                        type="number"
                        value={storeSettings.deliveryRadius}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, deliveryRadius: Number(e.target.value) }))}
                        placeholder="15"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor Mínimo do Pedido
                      </label>
                      <Input
                        type="number"
                        value={storeSettings.minOrderValue}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, minOrderValue: Number(e.target.value) }))}
                        placeholder="50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Notificação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Notificações por Email</h3>
                        <p className="text-sm text-gray-600">
                          Receba atualizações sobre pedidos e promoções
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userSettings.notifications.email}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, email: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Notificações por SMS</h3>
                        <p className="text-sm text-gray-600">
                          Receba mensagens importantes no seu celular
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userSettings.notifications.sms}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, sms: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Notificações Push</h3>
                        <p className="text-sm text-gray-600">
                          Receba notificações diretas no navegador
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userSettings.notifications.push}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, push: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Privacidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Mostrar Email</h3>
                        <p className="text-sm text-gray-600">
                          Permitir que outros usuários vejam seu email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userSettings.privacy.showEmail}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showEmail: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Mostrar Telefone</h3>
                        <p className="text-sm text-gray-600">
                          Permitir que outros usuários vejam seu telefone
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userSettings.privacy.showPhone}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showPhone: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <Shield className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">
                          Proteção de Dados
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Seus dados pessoais são protegidos e nunca serão compartilhados com terceiros sem sua autorização.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
