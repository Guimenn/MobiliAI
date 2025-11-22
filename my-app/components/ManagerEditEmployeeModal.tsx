'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  Shield,
  MapPin,
  Save,
  X
} from 'lucide-react';
import UserAvatarUpload from '@/components/UserAvatarUpload';
import { managerAPI } from '@/lib/api';
import { uploadUserAvatar } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatPhone, formatName, formatEmail } from '@/lib/input-utils';

interface ManagerEditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onSave: () => void;
}

export default function ManagerEditEmployeeModal({ 
  isOpen, 
  onClose, 
  employee, 
  onSave 
}: ManagerEditEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    address: '',
    isActive: true,
    avatarUrl: ''
  });
  const [userAvatar, setUserAvatar] = useState<File | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || '',
        address: employee.address || '',
        isActive: employee.isActive !== false,
        avatarUrl: employee.avatarUrl || ''
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload do avatar se fornecido
      if (userAvatar && employee?.id) {
        try {
          const avatarUrl = await uploadUserAvatar(userAvatar, employee.id);
          
          if (avatarUrl) {
            formData.avatarUrl = avatarUrl;
            toast.success('Avatar atualizado com sucesso!');
          }
        } catch (error) {
          console.error('Erro ao fazer upload do avatar:', error);
          toast.warning('Avatar não foi atualizado', {
            description: 'Os outros dados foram salvos, mas o avatar não pôde ser atualizado.',
          });
        }
      }

      // Preparar dados para envio (apenas campos permitidos pelo DTO do manager)
      const userData: any = {};
      
      if (formData.name) userData.name = formData.name;
      if (formData.email) userData.email = formData.email;
      if (formData.phone && formData.phone.trim() !== '') userData.phone = formData.phone;
      if (formData.address && formData.address.trim() !== '') userData.address = formData.address;
      if (formData.role) userData.role = formData.role;
      userData.isActive = formData.isActive;

      await managerAPI.updateStoreUser(employee.id, userData);
      
      toast.success('Funcionário atualizado com sucesso!');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error);
      toast.error('Erro ao atualizar funcionário', {
        description: error.response?.data?.message || error.message || 'Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
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
      default:
        formattedValue = value;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Editar Funcionário</span>
          </DialogTitle>
          <DialogDescription>
            Edite as informações do funcionário
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                >
                  <option value="CASHIER">Caixa</option>
                  <option value="EMPLOYEE">Funcionário</option>
                </select>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-[#3e2626]" />
              Endereço
            </h3>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Avatar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-[#3e2626]" />
              Foto do Perfil
            </h3>
            <UserAvatarUpload
              avatar={userAvatar}
              onAvatarChange={setUserAvatar}
              existingAvatar={formData.avatarUrl || undefined}
              userId={employee.id}
              onAvatarUploaded={(url) => {
                setFormData({ ...formData, avatarUrl: url });
              }}
            />
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3e2626] focus:ring-[#3e2626]"
            />
            <Label htmlFor="isActive" className="text-sm">
              Funcionário ativo
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-[#3e2626] hover:bg-[#4a2f2f]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

