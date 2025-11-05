"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Palette,
  Heart,
  ShoppingBag,
  Star,
  Camera,
  Sparkles
} from "lucide-react";
import Link from "next/link";

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

      {/* Content */}
      <div className="relative z-10">
        {/* Back Button */}
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Link>
        </div>

        {/* Profile Info */}
        <div className="flex items-center space-x-6">
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
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-white/80 text-lg mb-4">{user?.email}</p>
            <div className="flex space-x-3">
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Online
              </Badge>
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex space-x-3">
            <Button
              onClick={onEditToggle}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar Perfil
                </>
              )}
            </Button>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Suas Estatísticas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Informações Pessoais
const PersonalInfo = ({ user, isEditing, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    birthDate: '',
    address: ''
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Pessoais</CardTitle>
        <CardDescription>
          Gerencie suas informações pessoais e preferências
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nome Completo</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite seu nome completo"
              disabled={!isEditing}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@email.com"
              disabled={!isEditing}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Telefone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              disabled={!isEditing}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
            <Input
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              placeholder="dd/mm/aaaa"
              disabled={!isEditing}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Endereço</label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Rua, número, bairro, cidade"
            disabled={!isEditing}
          />
        </div>
        
        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button onClick={handleSave} className="bg-[#3e2626] hover:bg-[#5a3a3a]">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        )}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-stone-50 to-neutral-100 page-with-fixed-header">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <ProfileHeader user={user} isEditing={isEditing} onEditToggle={handleEditToggle} />
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-3 space-y-8">
            <PersonalInfo user={user} isEditing={isEditing} onSave={handleSave} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <UserStats />
          </div>
        </div>
      </div>
    </div>
  );
}