'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { adminAPI } from '@/lib/api';
import { ArrowLeft, User, Mail, Building2, Shield, Calendar, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, token, setUser } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      router.push('/login');
      return;
    }

    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      if (userRole === 'STORE_MANAGER') {
        router.push('/manager');
      } else {
        router.push('/');
      }
      return;
    }

    // Inicializar dados do formulário
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });

    setIsLoading(false);
  }, [isAuthenticated, user, token, router]);

  const handleOpenEditModal = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    // Resetar dados do formulário
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast.error('Erro ao identificar usuário');
      return;
    }

    // Validação básica
    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('O e-mail é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      // Preparar dados para atualização
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      if (formData.phone.trim()) {
        updateData.phone = formData.phone.trim();
      }

      // Atualizar usuário via API
      const updatedUser = await adminAPI.updateUser(user.id, updateData);

      // Atualizar o store com os dados atualizados
      const updatedUserData = {
        ...user,
        name: updatedUser.name || updatedUser.user?.name || formData.name.trim(),
        email: updatedUser.email || updatedUser.user?.email || formData.email.trim(),
        phone: updatedUser.phone || updatedUser.user?.phone || (formData.phone.trim() || undefined),
      };

      setUser(updatedUserData);

      toast.success('Perfil atualizado com sucesso!');
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao atualizar perfil';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const userRoleLabel = () => {
    switch (user?.role?.toUpperCase()) {
      case 'ADMIN':
        return 'Administrador';
      case 'STORE_MANAGER':
        return 'Gerente de Loja';
      case 'CASHIER':
        return 'Caixa';
      case 'EMPLOYEE':
        return 'Funcionário';
      default:
        return 'Usuário';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary/30 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Perfil do Usuário</h1>
          <p className="text-sm text-muted-foreground">Visualize e gerencie suas informações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarFallback className="bg-[#3e2626] text-primary-foreground text-2xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{user?.name || 'Administrador'}</CardTitle>
            <CardDescription>{userRoleLabel()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={handleOpenEditModal}>
              Editar Perfil
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Detalhes da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-muted p-3">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="text-base font-semibold text-foreground">{user?.name || 'Não informado'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                <p className="text-base font-semibold text-foreground">{user?.email || 'Não informado'}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="text-base font-semibold text-foreground">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Função</p>
                <p className="text-base font-semibold text-foreground">{userRoleLabel()}</p>
              </div>
            </div>

            {user?.createdAt && (
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Membro desde</p>
                  <p className="text-base font-semibold text-foreground">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
          <CardDescription>Gerencie as configurações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full sm:w-auto">
            Alterar Senha
          </Button>
          <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-2">
            Preferências de Notificação
          </Button>
        </CardContent>
      </Card>

      {/* Modal de Editar Perfil */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          handleCloseEditModal();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
                disabled={isSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                disabled={isSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-[#3e2626] hover:bg-[#3e2626]/90"
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

