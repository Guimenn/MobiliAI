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
  Building2, 
  Shield,
  Clock,
  Save,
  X
} from 'lucide-react';
import WorkingHoursConfig from '@/components/WorkingHoursConfig';
import UserAvatarUpload from '@/components/UserAvatarUpload';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSave: (userId: string, userData: any) => Promise<void>;
}

export default function EditUserModal({ isOpen, onClose, user, onSave }: EditUserModalProps) {
  const { token } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    storeId: '',
    address: '',
    isActive: true,
    avatarUrl: ''
  });
  const [workingHours, setWorkingHours] = useState<any>(null);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [userAvatar, setUserAvatar] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        storeId: user.storeId || '',
        address: user.address || '',
        isActive: user.isActive !== false,
        avatarUrl: user.avatarUrl || ''
      });
      setWorkingHours(user.workingHours || null);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchStores();
    }
  }, [isOpen]);

  const fetchStores = async () => {
    try {
      console.log('🔍 Carregando lojas do banco...');
      console.log('🔑 Token:', token ? 'Token presente' : 'Token ausente');
      
      const response = await fetch('http://localhost:3001/api/admin/stores', {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Status OK:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Lojas carregadas do banco:', data);
        setStores(data);
      } else {
        console.error('❌ Erro ao carregar lojas:', response.statusText);
        const errorData = await response.text();
        console.error('❌ Detalhes do erro:', errorData);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar lojas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload do avatar se fornecido
      if (userAvatar && user?.id) {
        try {
          const { uploadUserAvatar } = await import('@/lib/supabase');
          const avatarUrl = await uploadUserAvatar(userAvatar, user.id);
          
          if (avatarUrl) {
            console.log('Avatar enviado com sucesso:', avatarUrl);
            formData.avatarUrl = avatarUrl;
          }
        } catch (error) {
          console.error('Erro ao fazer upload do avatar:', error);
          // Continuar mesmo se o upload falhar
        }
      }

      // Preparar dados para envio, removendo campos vazios
      const userData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.phone && formData.phone.trim() !== '') {
        userData.phone = formData.phone;
      }
      if (formData.address && formData.address.trim() !== '') {
        userData.address = formData.address;
      }
      if (formData.storeId && formData.storeId.trim() !== '') {
        userData.storeId = formData.storeId;
      }
      if (formData.avatarUrl && formData.avatarUrl.trim() !== '') {
        userData.avatarUrl = formData.avatarUrl;
      }
      if (workingHours) {
        userData.workingHours = workingHours;
      }

      await onSave(user.id, userData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Editar Funcionário</span>
          </DialogTitle>
          <DialogDescription>
            Edite as informações do funcionário e configure os horários de expediente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Informações Pessoais</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: João Silva"
                  required
                  disabled
                  className="cursor-not-allowed bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="joao@empresa.com"
                  required
                  disabled
                  className="cursor-not-allowed bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div className="space-y-2">
                <UserAvatarUpload
                  avatar={userAvatar}
                  onAvatarChange={setUserAvatar}
                  existingAvatar={formData.avatarUrl}
                  userId={user?.id}
                  onAvatarUploaded={(url) => {
                    setFormData({ ...formData, avatarUrl: url });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Vínculo com Loja */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Vínculo com Loja</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeId">Loja</Label>
                <select
                  id="storeId"
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma loja</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Perfil de Acesso</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASHIER">Vendedor/Caixa</option>
                  <option value="STORE_MANAGER">Gerente de Loja</option>
                  <option value="EMPLOYEE">Funcionário</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Usuário ativo</Label>
            </div>
          </div>

          {/* Configuração de Horários de Expediente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Horários de Expediente</span>
            </h3>
            
            <WorkingHoursConfig
              workingHours={workingHours}
              onSave={setWorkingHours}
              disabled={loading}
            />
          </div>

          <DialogFooter className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
