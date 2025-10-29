'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Shield, 
  Calendar,
  Store,
  Edit
} from 'lucide-react';

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  stores: any[];
  onEdit: (user: any) => void;
}

export default function ViewUserModal({ isOpen, onClose, user, stores, onEdit }: ViewUserModalProps) {
  if (!isOpen || !user) return null;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'STORE_MANAGER': return 'Gerente';
      case 'CASHIER': return 'Caixa';
      case 'CUSTOMER': return 'Cliente';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'STORE_MANAGER': return 'bg-blue-100 text-blue-800';
      case 'CASHIER': return 'bg-green-100 text-green-800';
      case 'CUSTOMER': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const store = stores.find((s: any) => s.id === user.storeId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <AvatarFallback className="bg-white text-[#3e2626] text-lg font-semibold">
                    {user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription className="text-white/80">
                  {getRoleLabel(user.role)}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(user)}
                className="text-white hover:bg-white/20"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Status e Função */}
          <div className="flex items-center space-x-4">
            <Badge 
              className={`${getRoleColor(user.role)} px-3 py-1`}
            >
              {getRoleLabel(user.role)}
            </Badge>
            <Badge 
              variant={user.isActive ? 'default' : 'secondary'}
              className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
            >
              {user.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-[#3e2626]" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">E-mail:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Telefone:</span>
                  <span>{user.phone || 'Não informado'}</span>
                </div>
                {user.cpf && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">CPF:</span>
                    <span>{user.cpf}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Criado em:</span>
                  <span>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Atualizado em:</span>
                  <span>{new Date(user.updatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2 text-[#3e2626]" />
              Informações Profissionais
            </h3>
            <div className="space-y-2">
              {store && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Store className="h-4 w-4" />
                  <span className="font-medium">Loja:</span>
                  <span>{store.name}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações Pessoais */}
          {(user.address || user.city || user.state || user.zipCode) && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Informações Pessoais
                </h3>
                <div className="space-y-2">
                  {user.address && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Endereço:</span>
                      <span>{user.address}</span>
                    </div>
                  )}
                  {(user.city || user.state) && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Cidade/Estado:</span>
                      <span>{user.city}{user.city && user.state ? ', ' : ''}{user.state}</span>
                    </div>
                  )}
                  {user.zipCode && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">CEP:</span>
                      <span>{user.zipCode}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Ações */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button 
              onClick={() => onEdit(user)}
              className="bg-[#3e2626] hover:bg-[#4a2f2f]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Usuário
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
