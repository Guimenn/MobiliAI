'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Database,
  Mail,
  Lock,
  Key,
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
      console.log('Salvando configurações:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

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
            onClick={saveSettings}
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
                    Ativar modo de manutenção do sistema
                  </p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings.system.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    system: { ...settings.system, maintenanceMode: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup">Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Fazer backup automático dos dados
                  </p>
                </div>
                <Switch
                  id="auto-backup"
                  checked={settings.system.autoBackup}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    system: { ...settings.system, autoBackup: checked }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.system.sessionTimeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    system: { ...settings.system, sessionTimeout: parseInt(e.target.value) || 30 }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">Máximo de Tentativas de Login</Label>
                <Input
                  id="max-login-attempts"
                  type="number"
                  value={settings.system.maxLoginAttempts}
                  onChange={(e) => setSettings({
                    ...settings,
                    system: { ...settings.system, maxLoginAttempts: parseInt(e.target.value) || 5 }
                  })}
                />
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
                Configure como receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações por email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailNotifications: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-notifications">Notificações por SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações por SMS
                  </p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.notifications.smsNotifications}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, smsNotifications: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações push no navegador
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, pushNotifications: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sales-alerts">Alertas de Vendas</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre novas vendas
                  </p>
                </div>
                <Switch
                  id="sales-alerts"
                  checked={settings.notifications.salesAlerts}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, salesAlerts: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="low-stock-alerts">Alertas de Estoque Baixo</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando o estoque estiver baixo
                  </p>
                </div>
                <Switch
                  id="low-stock-alerts"
                  checked={settings.notifications.lowStockAlerts}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, lowStockAlerts: checked }
                  })}
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor-auth">Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Requerer 2FA para todos os usuários
                  </p>
                </div>
                <Switch
                  id="two-factor-auth"
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: { ...settings.security, twoFactorAuth: checked }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-expiration">Expiração de Senha (dias)</Label>
                <Input
                  id="password-expiration"
                  type="number"
                  value={settings.security.passwordExpiration}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, passwordExpiration: parseInt(e.target.value) || 90 }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ip-whitelist">Lista de IPs Permitidos (separados por vírgula)</Label>
                <Input
                  id="ip-whitelist"
                  value={settings.security.ipWhitelist}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, ipWhitelist: e.target.value }
                  })}
                  placeholder="192.168.1.1, 10.0.0.1"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="audit-log">Log de Auditoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas as ações dos usuários
                  </p>
                </div>
                <Switch
                  id="audit-log"
                  checked={settings.security.auditLog}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: { ...settings.security, auditLog: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
