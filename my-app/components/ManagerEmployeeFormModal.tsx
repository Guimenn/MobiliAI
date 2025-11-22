'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UserAvatarUpload from '@/components/UserAvatarUpload';
import { 
  User, 
  Building, 
  MapPin, 
  Settings,
  X,
  UserPlus
} from 'lucide-react';
import { formatCPF, formatCEP, formatPhone, formatState, formatCity, formatAddress, formatName, formatEmail } from '@/lib/input-utils';
import { managerAPI } from '@/lib/api';
import { uploadUserAvatar } from '@/lib/supabase';
import { toast } from 'sonner';

interface ManagerEmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function ManagerEmployeeFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: ManagerEmployeeFormModalProps) {
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
    isActive: true,
    cpf: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    avatarUrl: ''
  });
  const [userAvatar, setUserAvatar] = useState<File | null>(null);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  // Resetar formulário quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'CASHIER',
        isActive: true,
        cpf: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        avatarUrl: ''
      });
      setUserAvatar(null);
      setCreatedUserId(null);
    }
  }, [isOpen]);

  // Função para lidar com mudanças nos inputs com formatação
  const handleInputChange = (field: string, value: string) => {
    // Formatar valor baseado no campo
    let formattedValue = value;
    switch (field) {
      case 'name':
        formattedValue = formatName(value);
        break;
      case 'email':
        formattedValue = formatEmail(value);
        break;
      case 'phone':
        formattedValue = formatPhone(value);
        break;
      case 'address':
        formattedValue = formatAddress(value);
        break;
      case 'city':
        formattedValue = formatCity(value);
        break;
      case 'state':
        formattedValue = formatState(value);
        break;
      case 'zipCode':
        formattedValue = formatCEP(value);
        break;
      case 'cpf':
        formattedValue = formatCPF(value);
        break;
      default:
        formattedValue = value;
    }
    
    setNewUser({ ...newUser, [field]: formattedValue });
  };

  const handleCreateUser = async () => {
    // Validar campos obrigatórios
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Campos obrigatórios', {
        description: 'Nome, e-mail e senha são obrigatórios.',
        duration: 3000,
      });
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('Senha inválida', {
        description: 'A senha deve ter no mínimo 6 caracteres.',
        duration: 3000,
      });
      return;
    }

    try {
      // Preparar dados para envio (apenas campos permitidos pelo DTO do manager)
      const userData: any = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (newUser.phone && newUser.phone.trim() !== '') {
        userData.phone = newUser.phone;
      }

      if (newUser.address && newUser.address.trim() !== '') {
        userData.address = newUser.address;
      }

      // Criar usuário
      const createdUser = await managerAPI.createStoreUser(userData);
      setCreatedUserId(createdUser.id);
      
      // Upload do avatar se fornecido
      if (userAvatar && createdUser.id) {
        try {
          const avatarUrl = await uploadUserAvatar(userAvatar, createdUser.id);
          if (avatarUrl) {
            setNewUser({ ...newUser, avatarUrl });
            toast.success('Avatar enviado com sucesso!', {
              description: 'A foto foi salva no sistema.',
              duration: 3000,
            });
          }
        } catch (error) {
          console.error('Erro ao fazer upload do avatar:', error);
          toast.warning('Avatar não foi enviado', {
            description: 'O funcionário foi criado, mas o avatar não pôde ser enviado. Você pode adicioná-lo depois.',
            duration: 4000,
          });
          // Não falhar a criação do usuário por causa do avatar
        }
      }
      
      toast.success('Funcionário criado com sucesso!', {
        description: `${createdUser.name} foi adicionado à loja.`,
        duration: 4000,
      });
      
      onSubmit(createdUser);
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error);
      toast.error('Erro ao criar funcionário', {
        description: error.response?.data?.message || error.message || 'Verifique os dados e tente novamente.',
        duration: 4000,
      });
    }
  };

  const handleCloseModal = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(62, 38, 38, 0.5)' }}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Novo Funcionário</CardTitle>
              <CardDescription className="text-white/80">
                Preencha os dados para criar um novo funcionário
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseModal}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-[#3e2626]" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="joao@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2 text-[#3e2626]" />
              Informações Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                >
                  <option value="CASHIER">Caixa</option>
                  <option value="EMPLOYEE">Funcionário</option>
                </select>
              </div>
            </div>
          </div>

          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-[#3e2626]" />
              Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={newUser.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newUser.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Rua, número"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={newUser.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={newUser.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="SP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={newUser.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="01234-567"
                />
              </div>
            </div>
          </div>

          {/* Avatar e Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-[#3e2626]" />
              Avatar e Status
            </h3>
            <div className="space-y-2">
              <UserAvatarUpload
                onAvatarChange={setUserAvatar}
                avatar={userAvatar}
                existingAvatar={newUser.avatarUrl || undefined}
                userId={createdUserId || undefined}
                onAvatarUploaded={(url) => {
                  setNewUser({ ...newUser, avatarUrl: url });
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={newUser.isActive}
                onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                className="rounded border-gray-300 text-[#3e2626] focus:ring-[#3e2626]"
              />
              <Label htmlFor="isActive" className="text-sm">
                Usuário ativo
              </Label>
            </div>
          </div>
        </CardContent>
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <Button variant="outline" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateUser}
            disabled={isLoading}
            className="bg-[#3e2626] hover:bg-[#4a2f2f]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Funcionário
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
