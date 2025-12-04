'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Store,
  Save,
} from 'lucide-react';

export default function ManagerProfilePage() {
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
    storeName: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Apenas gerente/admin podem acessar esta página
    const role = user.role?.toUpperCase();
    if (role !== 'STORE_MANAGER' && role !== 'ADMIN') {
      router.push('/');
      return;
    }

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      storeName: (user as any)?.store?.name || '',
    });
  }, [user, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: integrar com endpoint específico para atualização de perfil do gerente
      // Por enquanto, apenas loga os dados para futura integração
      console.log('Atualizando perfil do gerente:', formData);
      alert('Perfil atualizado (simulação). Integração com backend pendente.');
    } catch (error) {
      console.error('Erro ao atualizar perfil do gerente:', error);
      alert('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas informações pessoais e dados da loja
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Informações Pessoais */}
        <div className="space-y-6">
          <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden h-full">
            <CardHeader className="bg-[#3e2626] text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <User className="h-6 w-6" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-white/80">
                Atualize seus dados de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-gray-700 font-semibold"
                    >
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="pl-10 h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-700 font-semibold"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="pl-10 h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                        placeholder="seu@email.com"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-gray-700 font-semibold"
                    >
                      Telefone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="pl-10 h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-gray-700 font-semibold"
                  >
                    Endereço
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="pl-10 h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className="text-gray-700 font-semibold"
                    >
                      Cidade
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="h-11 border-gray-300 rounded-xl focus:border-[#8B4513] focus:ring-[#8B4513]"
                      placeholder="Sua cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="state"
                      className="text-gray-700 font-semibold"
                    >
                      Estado
                    </Label>
                    <Input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
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
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        address: user.address || '',
                        city: user.city || '',
                        state: user.state || '',
                        storeName: (user as any)?.store?.name || '',
                      });
                    }}
                    className="px-8 h-11 border-gray-300 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 h-11 bg-[#3e2626] hover:bg-[#2a1f1f] rounded-xl shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Informações da Loja / Perfil Rápido */}
        <div className="space-y-6">
          <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden h-full">
            <CardHeader className="bg-[#3e2626] text-white flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-3">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name || ''} />
                ) : (
                  <AvatarFallback className="bg-white/10 text-primary-foreground text-2xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'G'}
                  </AvatarFallback>
                )}
              </Avatar>
              <CardTitle className="text-xl">
                {user?.name || 'Gerente de Loja'}
              </CardTitle>
              <CardDescription className="text-white/80">
                {user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-[#3e2626]" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Loja atual
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.storeName || 'Loja não definida'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-[#3e2626]" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Função
                  </p>
                  <p className="text-sm text-gray-600">Gerente de Loja</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


