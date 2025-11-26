'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Save,
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAppStore();
  const customerId = params?.id as string;
  
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cpf: '',
    isActive: true,
  });

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar dados do cliente
      try {
        const customerData = await adminAPI.getCustomerById(customerId);
        setCustomer(customerData);
        setFormData({
          name: customerData.name || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          address: customerData.address || '',
          city: customerData.city || '',
          state: customerData.state || '',
          zipCode: customerData.zipCode || '',
          cpf: customerData.cpf || '',
          isActive: customerData.isActive !== false,
        });
      } catch (error) {
        // Se não encontrar como cliente, tenta buscar como usuário
        try {
          const userData = await adminAPI.getUserById(customerId);
          if (userData && userData.role === 'CUSTOMER') {
            setCustomer(userData);
            setFormData({
              name: userData.name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              address: userData.address || '',
              city: userData.city || '',
              state: userData.state || '',
              zipCode: userData.zipCode || '',
              cpf: userData.cpf || '',
              isActive: userData.isActive !== false,
            });
          } else {
            throw new Error('Cliente não encontrado');
          }
        } catch (userError) {
          throw new Error('Cliente não encontrado');
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados do cliente:', error);
      toast.error('Erro ao carregar dados do cliente', {
        description: error.message || 'Cliente não encontrado',
      });
      router.push('/admin/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Preparar dados apenas com campos permitidos pelo UpdateUserDto
      // Campos permitidos: name, email, phone, address, isActive
      // Campos NÃO permitidos: city, state, zipCode, cpf (causam erro de validação)
      const allowedFields = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        isActive: formData.isActive,
      };

      // Remover campos vazios
      Object.keys(allowedFields).forEach(key => {
        if (allowedFields[key as keyof typeof allowedFields] === '' || allowedFields[key as keyof typeof allowedFields] === undefined) {
          delete allowedFields[key as keyof typeof allowedFields];
        }
      });

      // Tentar atualizar como usuário (endpoint que existe)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/admin/users/${customerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(allowedFields)
      });

      if (response.ok) {
        toast.success('Cliente atualizado com sucesso!', {
          description: `${formData.name} foi atualizado.`,
        });
        router.push(`/admin/customers/${customerId}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar cliente');
      }
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-8">
        <Card className="border border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Cliente não encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              O cliente que você está procurando não foi encontrado.
            </p>
            <Button onClick={() => router.push('/admin/customers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/customers/${customerId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Edit Form */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle>Editar Cliente</CardTitle>
          <CardDescription>
            Atualize as informações do cliente abaixo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className="pl-10 bg-muted cursor-not-allowed"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">Este campo não pode ser editado através desta interface</p>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Rua, número, complemento"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Cidade"
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Este campo não pode ser editado através desta interface</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Estado"
                  maxLength={2}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Este campo não pode ser editado através desta interface</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="00000-000"
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Este campo não pode ser editado através desta interface</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Status</h3>
            <div className="flex items-center gap-4">
              <Label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>Cliente Ativo</span>
              </Label>
              <Badge 
                variant="outline" 
                className={
                  formData.isActive 
                    ? 'border-green-200 bg-green-50 text-green-800' 
                    : 'border-red-200 bg-red-50 text-red-800'
                }
              >
                {formData.isActive ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativo
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Inativo
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

