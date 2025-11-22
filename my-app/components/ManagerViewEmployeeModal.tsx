'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Calendar,
  Edit
} from 'lucide-react';

interface ManagerViewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onEdit: (employee: any) => void;
}

export default function ManagerViewEmployeeModal({ 
  isOpen, 
  onClose, 
  employee, 
  onEdit 
}: ManagerViewEmployeeModalProps) {
  if (!isOpen || !employee) return null;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'STORE_MANAGER': return 'Gerente';
      case 'CASHIER': return 'Caixa';
      case 'EMPLOYEE': return 'Funcionário';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STORE_MANAGER': return 'bg-blue-100 text-blue-800';
      case 'CASHIER': return 'bg-orange-100 text-orange-800';
      case 'EMPLOYEE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                {employee.avatarUrl && (
                  <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                )}
                <AvatarFallback className="bg-white text-[#3e2626] text-lg font-semibold">
                  {employee.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{employee.name}</CardTitle>
                <CardDescription className="text-white/80">
                  {getRoleLabel(employee.role)}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(employee)}
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
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-[#3e2626]" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Nome Completo</p>
                <p className="text-base font-medium">{employee.name || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">E-mail</p>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-base">{employee.email || 'Não informado'}</p>
                </div>
              </div>
              {employee.phone && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Telefone</p>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-base">{employee.phone}</p>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={employee.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {employee.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-[#3e2626]" />
              Informações Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Cargo</p>
                <Badge className={getRoleColor(employee.role)}>
                  {getRoleLabel(employee.role)}
                </Badge>
              </div>
              {employee.createdAt && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Data de Cadastro</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-base">
                      {new Date(employee.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {employee.address && (
            <>
              <Separator />
              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Endereço
                </h3>
                <div className="space-y-1">
                  <p className="text-base">{employee.address}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

