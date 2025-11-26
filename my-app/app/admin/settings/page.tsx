'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Settings, 
  Save, 
  Shield,
  Bell,
  Store,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { env } from '@/lib/env';

const API_BASE_URL = env.API_URL;
const SETTINGS_STORAGE_KEY = 'app_settings';

// Valores padrão
const defaultSettings = {
  company: {
    name: 'PintAI',
    email: 'contato@pintai.com',
    phone: '(11) 99999-9999',
    address: 'Rua das Tintas, 123 - São Paulo, SP',
    cnpj: '12.345.678/0001-90'
  },
  system: {
    maintenanceMode: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  },
  notifications: {
    salesAlerts: true,
    lowStockAlerts: true
  },
  security: {
    passwordExpiration: 90,
    ipWhitelist: '',
    auditLog: true
  }
};

// Função para carregar do localStorage primeiro (mais rápido)
const loadSettingsFromStorage = () => {
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Merge com valores padrão para garantir que todas as propriedades existam
      return {
        company: { ...defaultSettings.company, ...(parsed.company || {}) },
        system: { ...defaultSettings.system, ...(parsed.system || {}) },
        notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) },
        security: { ...defaultSettings.security, ...(parsed.security || {}) }
      };
    }
  } catch (error) {
    console.error('Erro ao carregar configurações do localStorage:', error);
  }
  
  return defaultSettings;
};

export default function SettingsPage() {
  const { token } = useAppStore();
  // Carregar do localStorage imediatamente para evitar flash
  const [settings, setSettings] = useState(loadSettingsFromStorage);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('company');

  // Carregar configurações do backend ao montar o componente
  useEffect(() => {
    const loadSettings = async () => {
      setIsInitialLoading(true);
      try {
        if (token) {
          // Tentar carregar do backend
          const response = await fetch(`${API_BASE_URL}/admin/system/settings`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const backendSettings = await response.json();
            console.log('Configurações carregadas do backend:', backendSettings);
            
            // Garantir que todas as propriedades estejam presentes
            const mergedSettings = {
              company: { 
                name: backendSettings.company?.name || defaultSettings.company.name,
                email: backendSettings.company?.email || defaultSettings.company.email,
                phone: backendSettings.company?.phone || defaultSettings.company.phone,
                address: backendSettings.company?.address || defaultSettings.company.address,
                cnpj: backendSettings.company?.cnpj || defaultSettings.company.cnpj
              },
              system: { 
                maintenanceMode: backendSettings.system?.maintenanceMode ?? defaultSettings.system.maintenanceMode,
                sessionTimeout: backendSettings.system?.sessionTimeout ?? defaultSettings.system.sessionTimeout,
                maxLoginAttempts: backendSettings.system?.maxLoginAttempts ?? defaultSettings.system.maxLoginAttempts
              },
              notifications: { 
                salesAlerts: backendSettings.notifications?.salesAlerts ?? defaultSettings.notifications.salesAlerts,
                lowStockAlerts: backendSettings.notifications?.lowStockAlerts ?? defaultSettings.notifications.lowStockAlerts
              },
              security: { 
                passwordExpiration: backendSettings.security?.passwordExpiration ?? defaultSettings.security.passwordExpiration,
                ipWhitelist: backendSettings.security?.ipWhitelist ?? defaultSettings.security.ipWhitelist,
                auditLog: backendSettings.security?.auditLog ?? defaultSettings.security.auditLog
              }
            };
            
            setSettings(mergedSettings);
            // Atualizar localStorage com dados do backend
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(mergedSettings));
            setIsInitialLoading(false);
            return;
          } else {
            const errorText = await response.text();
            console.error('Erro ao carregar configurações:', response.status, response.statusText, errorText);
          }
        }
        
        // Se não conseguiu carregar do backend, manter o que já está no estado (do localStorage)
        setIsInitialLoading(false);
      } catch (error) {
        console.error('Erro ao carregar configurações do servidor:', error);
        // Manter o que já está no estado (do localStorage)
        setIsInitialLoading(false);
      }
    };

    loadSettings();
  }, [token]);

  const saveSettings = async (showToast = true) => {
    try {
      setIsLoading(true);
      
      // Salvar no localStorage
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      
      // Tentar salvar no backend se houver token
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/admin/system/settings`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao salvar no servidor');
          }
          
          const result = await response.json();
          
          if (showToast) {
            toast.success('Configurações salvas com sucesso!');
          }
          
          return true;
        } catch (error: any) {
          console.error('Erro ao salvar no servidor:', error);
          if (showToast) {
            toast.error(error.message || 'Erro ao salvar configurações no servidor');
          }
          return false;
        }
      } else {
        if (showToast) {
          toast.success('Configurações salvas localmente!');
        }
        return true;
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      if (showToast) {
        toast.error('Erro ao salvar configurações');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaintenanceModeChange = async (checked: boolean) => {
    // Confirmar ação antes de mudar
    if (checked) {
      const confirmed = window.confirm(
        '⚠️ ATENÇÃO: Ao ativar o modo de manutenção, todos os usuários não-admin serão bloqueados.\n\n' +
        'Você tem certeza que deseja ativar o modo de manutenção?'
      );
      
      if (!confirmed) {
        return; // Não fazer nada se cancelado
      }
    }

    // Atualizar estado local
    const newSettings = {
      ...settings,
      system: { ...settings.system, maintenanceMode: checked }
    };
    setSettings(newSettings);

    // Salvar automaticamente
    setIsLoading(true);
    try {
      // Salvar no localStorage primeiro
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      
      // Tentar salvar no backend
      if (token) {
        const response = await fetch(`${API_BASE_URL}/admin/system/settings`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newSettings)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Modo de manutenção salvo:', result);
          
          if (checked) {
            toast.success('✅ Modo de manutenção ATIVADO. Usuários não-admin serão bloqueados.');
          } else {
            toast.success('✅ Modo de manutenção DESATIVADO. Sistema normalizado.');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Erro ao salvar no servidor:', response.status, errorData);
          toast.warning('⚠️ Configuração salva localmente, mas houve erro ao salvar no servidor.');
        }
      } else {
        toast.success('✅ Configuração salva localmente!');
      }
    } catch (error: any) {
      console.error('Erro ao salvar modo de manutenção:', error);
      toast.error('❌ Erro ao alterar modo de manutenção. Tente novamente.');
      // Reverter se falhou
      setSettings(settings);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading apenas na primeira carga
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-3xl border border-border bg-[#3e2626] px-8 py-10 text-primary-foreground shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <Badge
              variant="outline"
              className="border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
            >
              Configurações
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Configurações do Sistema
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Gerencie as configurações da empresa, sistema, notificações e segurança.
              </p>
            </div>
          </div>
          <Button 
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            onClick={() => saveSettings(true)}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </section>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company" className="mt-6">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>
                Configure os dados da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={settings.company.name}
                    onChange={(e) => setSettings({
                      ...settings,
                      company: { ...settings.company, name: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-cnpj">CNPJ</Label>
                  <Input
                    id="company-cnpj"
                    value={settings.company.cnpj}
                    onChange={(e) => setSettings({
                      ...settings,
                      company: { ...settings.company, cnpj: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={settings.company.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    company: { ...settings.company, email: e.target.value }
                  })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Telefone</Label>
                  <Input
                    id="company-phone"
                    value={settings.company.phone}
                    onChange={(e) => setSettings({
                      ...settings,
                      company: { ...settings.company, phone: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Endereço</Label>
                  <Input
                    id="company-address"
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
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="mt-6">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configure o comportamento do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode">Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar modo de manutenção do sistema (bloqueia acesso de usuários não-admin)
                  </p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings.system.maintenanceMode}
                  onCheckedChange={handleMaintenanceModeChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  min="5"
                  max="480"
                  value={settings.system.sessionTimeout}
                  onChange={async (e) => {
                    const newValue = parseInt(e.target.value) || 30;
                    const clampedValue = Math.max(5, Math.min(480, newValue));
                    const newSettings = {
                      ...settings,
                      system: { ...settings.system, sessionTimeout: clampedValue }
                    };
                    setSettings(newSettings);
                    
                    // Salvar automaticamente
                    try {
                      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
                      if (token) {
                        await fetch(`${API_BASE_URL}/admin/system/settings`, {
                          method: 'PUT',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(newSettings)
                        });
                      }
                      toast.success(`Timeout de sessão atualizado para ${clampedValue} minutos`);
                    } catch (error) {
                      console.error('Erro ao salvar timeout:', error);
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Tempo de inatividade antes de desconectar o usuário (5-480 minutos)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">Máximo de Tentativas de Login</Label>
                <Input
                  id="max-login-attempts"
                  type="number"
                  min="3"
                  max="10"
                  value={settings.system.maxLoginAttempts}
                  onChange={async (e) => {
                    const newValue = parseInt(e.target.value) || 5;
                    const clampedValue = Math.max(3, Math.min(10, newValue));
                    const newSettings = {
                      ...settings,
                      system: { ...settings.system, maxLoginAttempts: clampedValue }
                    };
                    setSettings(newSettings);
                    
                    // Salvar automaticamente
                    try {
                      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
                      if (token) {
                        await fetch(`${API_BASE_URL}/admin/system/settings`, {
                          method: 'PUT',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(newSettings)
                        });
                      }
                      toast.success(`Máximo de tentativas atualizado para ${clampedValue}`);
                    } catch (error) {
                      console.error('Erro ao salvar máximo de tentativas:', error);
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Número máximo de tentativas de login antes de bloquear (3-10)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificações
              </CardTitle>
              <CardDescription>
                Configure as preferências de alertas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sales-alerts">Alertas de Vendas</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir notificações quando novas vendas forem registradas
                  </p>
                </div>
                <Switch
                  id="sales-alerts"
                  checked={settings.notifications.salesAlerts}
                  onCheckedChange={async (checked) => {
                    const newSettings = {
                      ...settings,
                      notifications: { ...settings.notifications, salesAlerts: checked }
                    };
                    setSettings(newSettings);
                    
                    // Salvar automaticamente
                    try {
                      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
                      if (token) {
                        await fetch(`${API_BASE_URL}/admin/system/settings`, {
                          method: 'PUT',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(newSettings)
                        });
                      }
                      toast.success(checked ? '✅ Alertas de vendas ATIVADOS' : '✅ Alertas de vendas DESATIVADOS');
                    } catch (error) {
                      console.error('Erro ao salvar configuração:', error);
                      toast.error('Erro ao salvar configuração');
                    }
                  }}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="low-stock-alerts">Alertas de Estoque Baixo</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir notificações quando produtos estiverem com estoque baixo
                  </p>
                </div>
                <Switch
                  id="low-stock-alerts"
                  checked={settings.notifications.lowStockAlerts}
                  onCheckedChange={async (checked) => {
                    const newSettings = {
                      ...settings,
                      notifications: { ...settings.notifications, lowStockAlerts: checked }
                    };
                    setSettings(newSettings);
                    
                    // Salvar automaticamente
                    try {
                      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
                      if (token) {
                        await fetch(`${API_BASE_URL}/admin/system/settings`, {
                          method: 'PUT',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(newSettings)
                        });
                      }
                      toast.success(checked ? '✅ Alertas de estoque baixo ATIVADOS' : '✅ Alertas de estoque baixo DESATIVADOS');
                    } catch (error) {
                      console.error('Erro ao salvar configuração:', error);
                      toast.error('Erro ao salvar configuração');
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Configure as políticas de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password-expiration">Expiração de Senha (dias)</Label>
                <Input
                  id="password-expiration"
                  type="number"
                  min="30"
                  max="365"
                  value={settings.security.passwordExpiration}
                  onChange={async (e) => {
                    const newValue = parseInt(e.target.value) || 90;
                    const clampedValue = Math.max(30, Math.min(365, newValue));
                    const newSettings = {
                      ...settings,
                      security: { ...settings.security, passwordExpiration: clampedValue }
                    };
                    setSettings(newSettings);
                    
                    // Salvar automaticamente
                    try {
                      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
                      if (token) {
                        await fetch(`${API_BASE_URL}/admin/system/settings`, {
                          method: 'PUT',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(newSettings)
                        });
                      }
                      toast.success(`Expiração de senha atualizada para ${clampedValue} dias`);
                    } catch (error) {
                      console.error('Erro ao salvar configuração:', error);
                      toast.error('Erro ao salvar configuração');
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Número de dias antes de exigir alteração de senha (30-365 dias)
                </p>
              </div>

            

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="audit-log">Log de Auditoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas as ações importantes dos usuários no sistema
                  </p>
                </div>
                <Switch
                  id="audit-log"
                  checked={settings.security.auditLog}
                  onCheckedChange={async (checked) => {
                    const newSettings = {
                      ...settings,
                      security: { ...settings.security, auditLog: checked }
                    };
                    setSettings(newSettings);
                    
                    // Salvar automaticamente
                    try {
                      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
                      if (token) {
                        await fetch(`${API_BASE_URL}/admin/system/settings`, {
                          method: 'PUT',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(newSettings)
                        });
                      }
                      toast.success(checked ? '✅ Log de auditoria ATIVADO' : '✅ Log de auditoria DESATIVADO');
                    } catch (error) {
                      console.error('Erro ao salvar configuração:', error);
                      toast.error('Erro ao salvar configuração');
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
