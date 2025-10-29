'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  UserPlus, 
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  MapPin,
  Clock
} from 'lucide-react';
import WorkingHoursConfig from '@/components/WorkingHoursConfig';
import { formatCPF, formatCEP, formatPhone, formatState, formatCity, formatAddress, formatName, formatEmail } from '@/lib/input-utils';

export default function NewUserPage() {
  const { user, isAuthenticated, token, isUserAuthenticated } = useAppStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string; email: string; storeId: string }[]>([]);
  const [selectedManager, setSelectedManager] = useState<{ id: string; name: string; email: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CASHIER',
    storeId: '',
    address: ''
  });
  const [workingHours, setWorkingHours] = useState<any>(null);

  useEffect(() => {
    if (!isUserAuthenticated()) {
      router.push('/login');
      return;
    }

    if (user?.role?.toLowerCase() !== 'admin') {
      router.push('/');
      return;
    }

    fetchStores();
    fetchManagers();
  }, []); // Remover dependências desnecessárias para evitar re-renders

  const fetchStores = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/stores', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data);
      } else {
        // Mock data para demonstração
        setStores([
          { id: '1', name: 'Loja Centro' },
          { id: '2', name: 'Loja Shopping' },
          { id: '3', name: 'Loja Norte' }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users?role=STORE_MANAGER', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setManagers(data.users || []);
      } else {
        // Mock data para demonstração
        setManagers([
          { id: '1', name: 'Maria Santos', email: 'maria@loja.com', storeId: '1' },
          { id: '2', name: 'João Silva', email: 'joao@loja.com', storeId: '2' },
          { id: '3', name: 'Ana Costa', email: 'ana@loja.com', storeId: '3' }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar gerentes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Preparar dados para envio
    const userData = {
      ...formData,
      ...(workingHours && { workingHours })
    };

    // Debug: mostrar dados que serão enviados
    console.log('Dados do formulário:', userData);
    console.log('Token:', token);

    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      console.log('Status da resposta:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Usuário criado com sucesso:', result);
        router.push('/admin/users');
      } else {
        const errorData = await response.json();
        console.error('Erro ao criar usuário:', errorData);
        alert(`Erro: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Formatar valor baseado no campo
    let formattedValue = value;
    switch (name) {
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
      default:
        formattedValue = value;
    }
    
    // Evitar atualizações desnecessárias
    if (formData[name as keyof typeof formData] === formattedValue) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Se a loja foi alterada, buscar o gerente correspondente
    if (name === 'storeId') {
      const manager = managers.find(m => m.storeId === value);
      setSelectedManager(manager || null);
    }
  };

  if (!isUserAuthenticated()) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => router.push('/admin/users')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Novo Funcionário</h1>
                <p className="text-sm text-gray-600">Cadastrar novo funcionário</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Dados do Funcionário</span>
            </CardTitle>
            <CardDescription>
              Preencha os dados do novo funcionário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Informações Pessoais</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: João Silva"
                      required
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Mínimo 6 caracteres"
                      required
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeId">Loja *</Label>
                    <select
                      id="storeId"
                      name="storeId"
                      value={formData.storeId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
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
                    <Label htmlFor="role">Perfil de Acesso *</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="CASHIER">Vendedor/Caixa</option>
                      <option value="STORE_MANAGER">Gerente de Loja</option>
                    </select>
                  </div>
                </div>

                {/* Informações do Gerente */}
                {selectedManager && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Gerente da Loja
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-blue-700">Nome do Gerente</Label>
                        <div className="text-sm font-medium text-blue-900 bg-white px-3 py-2 border border-blue-200 rounded">
                          {selectedManager.name}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-blue-700">Email do Gerente</Label>
                        <div className="text-sm font-medium text-blue-900 bg-white px-3 py-2 border border-blue-200 rounded">
                          {selectedManager.email}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/users')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Salvando...' : 'Salvar Funcionário'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
