'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  Camera, 
  Settings, 
  Heart, 
  ShoppingBag, 
  Award, 
  ArrowLeft,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Palette,
  Paintbrush,
  Wand2,
  TrendingUp,
  Star,
  Clock,
  Activity,
  Sparkles,
  Target,
  Zap,
  Crown,
  Gift,
  MessageCircle,
  Download,
  Share2
} from 'lucide-react';
import Link from 'next/link';

// Componente do Header do Perfil
const ProfileHeader = ({ user, isEditing, onEditToggle }: any) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#3e2626] via-[#4a2f2f] to-[#5a3a3a] rounded-3xl p-8 text-white shadow-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center space-x-2 text-white/80 hover:text-white transition-all duration-300 hover:scale-105">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar</span>
          </Link>
          <Button 
            onClick={onEditToggle}
            variant="outline" 
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancelar' : 'Editar Perfil'}
          </Button>
        </div>

        <div className="flex items-center space-x-8">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl backdrop-blur-sm">
              <User className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
            {isEditing && (
              <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                <Camera className="h-6 w-6 text-white" />
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {user?.name || 'Usuário'}
              </h1>
              <Crown className="h-6 w-6 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-white/80 mb-3 text-lg">{user?.email}</p>
            <div className="flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-100 border-green-400/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Online
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500/20 to-blue-400/20 text-blue-100 border-blue-400/30 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Estatísticas do Usuário
const UserStats = () => {
  const stats = [
    { label: 'Projetos', value: '12', icon: Palette, color: 'from-purple-500 to-purple-600' },
    { label: 'Favoritos', value: '28', icon: Heart, color: 'from-pink-500 to-pink-600' },
    { label: 'Compras', value: '5', icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
    { label: 'Avaliações', value: '4.8', icon: Star, color: 'from-yellow-500 to-yellow-600' }
  ];

  return (
    <Card className="bg-gradient-to-br from-white via-stone-50/20 to-gray-50/30 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-gray-50/50 to-stone-50/50 border-b border-gray-200/40">
        <CardTitle className="flex items-center space-x-2 text-gray-800">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-stone-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span>Suas Estatísticas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-gradient-to-br from-white/90 to-gray-50/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-gray-100/60">
              <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center shadow-sm`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Ações Rápidas
const QuickActions = () => {
  const actions = [
    { label: 'Novo Projeto', icon: Palette, color: 'bg-gradient-to-r from-purple-500 to-purple-600', hover: 'hover:from-purple-600 hover:to-purple-700' },
    { label: 'Meus Favoritos', icon: Heart, color: 'bg-gradient-to-r from-pink-500 to-pink-600', hover: 'hover:from-pink-600 hover:to-pink-700' },
    { label: 'Histórico', icon: ShoppingBag, color: 'bg-gradient-to-r from-blue-500 to-blue-600', hover: 'hover:from-blue-600 hover:to-blue-700' },
    { label: 'Compartilhar', icon: Share2, color: 'bg-gradient-to-r from-green-500 to-green-600', hover: 'hover:from-green-600 hover:to-green-700' }
  ];

  return (
    <Card className="bg-gradient-to-br from-white via-stone-50/20 to-gray-50/30 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-gray-50/50 to-stone-50/50 border-b border-gray-200/40">
        <CardTitle className="flex items-center space-x-2 text-gray-800">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-stone-600 rounded-lg flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span>Ações Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-6">
        {actions.map((action, index) => (
          <Button 
            key={index}
            className={`w-full justify-start ${action.color} ${action.hover} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl`}
          >
            <action.icon className="h-4 w-4 mr-3" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

// Componente de Informações Pessoais
const PersonalInfo = ({ user, isEditing, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    birthDate: user?.birthDate || ''
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Card className="bg-gradient-to-br from-white via-stone-50/20 to-gray-50/30 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-gray-50/50 to-stone-50/50 border-b border-gray-200/40">
        <CardTitle className="flex items-center space-x-2 text-gray-800">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-stone-600 rounded-lg flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <span>Informações Pessoais</span>
        </CardTitle>
        <CardDescription className="text-gray-600">
          Gerencie suas informações pessoais e preferências
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                <User className="h-3 w-3 text-gray-600" />
              </div>
              Nome Completo
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              disabled={!isEditing}
              className={`transition-all duration-300 ${isEditing ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-500/20 shadow-sm' : 'bg-gray-50/50 border-gray-200'}`}
              placeholder="Digite seu nome completo"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                <Mail className="h-3 w-3 text-gray-600" />
              </div>
              Email
            </label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={!isEditing}
              className={`transition-all duration-300 ${isEditing ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-500/20 shadow-sm' : 'bg-gray-50/50 border-gray-200'}`}
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                <Phone className="h-3 w-3 text-gray-600" />
              </div>
              Telefone
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              disabled={!isEditing}
              className={`transition-all duration-300 ${isEditing ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-500/20 shadow-sm' : 'bg-gray-50/50 border-gray-200'}`}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                <Calendar className="h-3 w-3 text-gray-600" />
              </div>
              Data de Nascimento
            </label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
              disabled={!isEditing}
              className={`transition-all duration-300 ${isEditing ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-500/20 shadow-sm' : 'bg-gray-50/50 border-gray-200'}`}
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 flex items-center">
            <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center mr-3">
              <MapPin className="h-3 w-3 text-gray-600" />
            </div>
            Endereço
          </label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            disabled={!isEditing}
            className={`transition-all duration-300 ${isEditing ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-500/20 shadow-sm' : 'bg-gray-50/50 border-gray-200'}`}
            placeholder="Rua, número, bairro, cidade"
          />
        </div>
        {isEditing && (
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onSave({})}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] hover:from-[#2a1f1f] hover:to-[#3e2626] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente de Atividades Recentes
const RecentActivity = () => {
  const activities = [
    { 
      action: 'Criou novo projeto', 
      description: 'Sala de estar moderna', 
      time: '2 horas atrás', 
      icon: Palette, 
      color: 'text-purple-600' 
    },
    { 
      action: 'Adicionou aos favoritos', 
      description: 'Tinta Coral Suave', 
      time: '1 dia atrás', 
      icon: Heart, 
      color: 'text-pink-600' 
    },
    { 
      action: 'Finalizou compra', 
      description: 'Kit de pintura completo', 
      time: '3 dias atrás', 
      icon: ShoppingBag, 
      color: 'text-blue-600' 
    },
    { 
      action: 'Avaliou produto', 
      description: 'Tinta Branco Gelo', 
      time: '1 semana atrás', 
      icon: Star, 
      color: 'text-yellow-600' 
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-white via-stone-50/20 to-gray-50/30 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-gray-50/50 to-stone-50/50 border-b border-gray-200/40">
        <CardTitle className="flex items-center space-x-2 text-gray-800">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-stone-600 rounded-lg flex items-center justify-center">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span>Atividades Recentes</span>
        </CardTitle>
        <CardDescription className="text-gray-600">
          Suas últimas ações na plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-white/90 to-gray-50/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] border border-gray-100/60">
            <div className={`w-12 h-12 bg-gradient-to-r from-gray-100 to-stone-100 rounded-full flex items-center justify-center shadow-sm ${activity.color}`}>
              <activity.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{activity.action}</div>
              <div className="text-sm text-gray-700 font-medium">{activity.description}</div>
              <div className="text-xs text-gray-500 flex items-center mt-2 font-medium">
                <Clock className="h-3 w-3 mr-1" />
                {activity.time}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Componente de Configurações
const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailMarketing: false,
    darkMode: false,
    compactMode: false,
    fontSize: 'medium'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings({...settings, [key]: value});
    // Salvar no localStorage
    localStorage.setItem('userSettings', JSON.stringify({...settings, [key]: value}));
    console.log(`Configuração ${key} alterada para:`, value);
  };

  const settingOptions = [
    {
      key: 'notifications',
      title: 'Notificações',
      description: 'Receber notificações do sistema',
      icon: Bell,
      color: 'text-blue-600'
    },
    {
      key: 'emailMarketing',
      title: 'Email Marketing',
      description: 'Receber ofertas e novidades por email',
      icon: Mail,
      color: 'text-green-600'
    },
    {
      key: 'compactMode',
      title: 'Modo Compacto',
      description: 'Interface mais compacta e otimizada',
      icon: Target,
      color: 'text-purple-600'
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-white via-stone-50/20 to-gray-50/30 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-gray-50/50 to-stone-50/50 border-b border-gray-200/40">
        <CardTitle className="flex items-center space-x-2 text-gray-800">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-stone-600 rounded-lg flex items-center justify-center">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <span>Configurações</span>
        </CardTitle>
        <CardDescription className="text-gray-600">
          Configure suas preferências e notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {settingOptions.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/90 to-gray-50/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100/60">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 bg-gradient-to-r from-gray-100 to-stone-100 rounded-full flex items-center justify-center shadow-sm ${setting.color}`}>
                <setting.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{setting.title}</div>
                <div className="text-sm text-gray-600">{setting.description}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSettingChange(setting.key, !settings[setting.key as keyof typeof settings])}
              className={`transition-all duration-300 rounded-lg ${
                settings[setting.key as keyof typeof settings] 
                  ? 'bg-gradient-to-r from-gray-600 to-stone-600 text-white border-gray-600 shadow-sm' 
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              {settings[setting.key as keyof typeof settings] ? 'Ativo' : 'Inativo'}
            </Button>
          </div>
        ))}
        
        {/* Tamanho da Fonte */}
        <div className="p-4 bg-gradient-to-r from-white/90 to-gray-50/20 rounded-xl shadow-sm border border-gray-100/60">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-stone-100 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-lg">🔤</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Tamanho da Fonte</div>
              <div className="text-sm text-gray-600">Ajustar tamanho do texto</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {['small', 'medium', 'large'].map((size) => (
              <Button
                key={size}
                variant="outline"
                size="sm"
                onClick={() => handleSettingChange('fontSize', size)}
                className={`transition-all duration-300 rounded-lg ${
                  settings.fontSize === size 
                    ? 'bg-gradient-to-r from-gray-600 to-stone-600 text-white border-gray-600 shadow-sm' 
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                <span className={size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-lg'}>A</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default function ProfilePage() {
  const { user } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = (formData: any) => {
    // Aqui você implementaria a lógica de salvamento
    console.log('Salvando dados:', formData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-stone-50 to-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <ProfileHeader user={user} isEditing={isEditing} onEditToggle={handleEditToggle} />
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-3 space-y-8">
            <PersonalInfo user={user} isEditing={isEditing} onSave={handleSave} />
            <RecentActivity />
          </div>

          {/* Right Column - Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <UserStats />
            <SettingsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
