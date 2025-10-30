'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store'; // Import with updated User interface
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Clock,
  Save,
  Calendar
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    admissionYear: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Preencher o formulário com dados do usuário
    const admissionYear = user.createdAt ? new Date(user.createdAt).getFullYear().toString() : '';
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      admissionYear,
    });
  }, [user, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implementar atualização de perfil
      console.log('Atualizando perfil:', formData);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-2">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Informações Pessoais */}
        <div className="space-y-6">
          <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] text-white">
              <CardTitle className="text-2xl flex items-center">
                <User className="h-6 w-6 mr-3" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-white/80">
                Atualize suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-semibold">
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-semibold">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                        placeholder="seu@email.com"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-semibold">
                      Telefone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10 h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admissionYear" className="text-gray-700 font-semibold">
                      Ano de entrada na empresa
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="admissionYear"
                        type="number"
                        min={1980}
                        max={new Date().getFullYear()}
                        value={formData.admissionYear}
                        onChange={(e) => setFormData({ ...formData, admissionYear: e.target.value })}
                        className="pl-10 h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                        placeholder={`${new Date().getFullYear()}`}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700 font-semibold">
                    Endereço
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="pl-10 h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-700 font-semibold">
                      Cidade
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                      placeholder="Sua cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-700 font-semibold">
                      Estado
                    </Label>
                    <Input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const admissionYear = user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '';
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        address: user?.address || '',
                        city: user?.city || '',
                        state: user?.state || '',
                        admissionYear,
                      });
                    }}
                    className="px-8 h-11 border-gray-300 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 h-11 bg-gradient-to-r from-[#3e2626] to-[#8B4513] hover:from-[#8B4513] hover:to-[#3e2626] rounded-xl shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          
        </div>

        {/* Sidebar - Informações da Empresa */}
        <div className="space-y-6">
          <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-[#A0522D] to-[#D2691E] text-white">
              <CardTitle className="text-2xl flex items-center">
                <Building className="h-6 w-6 mr-3" />
                Empresa
              </CardTitle>
              <CardDescription className="text-white/80">
                Informações da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-28 w-28 mb-4 ring-4 ring-[#8B4513]/20">
                    <AvatarFallback className="bg-gradient-to-br from-[#3e2626] to-[#8B4513] text-white text-4xl font-bold">
                      {user?.name?.charAt(0) || 'F'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold text-gray-900">{user?.name || 'Funcionário'}</h3>
                  <p className="text-sm text-gray-600">{user?.store?.name || 'Loja'}</p>
                </div>

                <Separator />

                {/* Informações da Loja */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-[#8B4513] mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.store?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600">Loja</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-[#8B4513] mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.store?.address || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600">Endereço</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-[#8B4513] mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.role || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600">Função</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
