"use client";

import { useState, useEffect } from "react";
import { Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ProfileInfoProps {
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    cpf?: string;
    birthDate?: string;
    username?: string;
  };
  onSave?: (data: any) => Promise<void> | void;
  isSaving?: boolean;
}

export default function ProfileInfo({ user, onSave, isSaving = false }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    cpf: user?.cpf || "",
  });

  // Atualizar formData quando user mudar
  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      gender: user?.gender || "",
      cpf: user?.cpf || "",
    });
  }, [user]);

  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave(formData);
        setIsEditing(false);
      } catch (error) {
        // Erro tratado pelo componente pai
        console.error("Erro ao salvar perfil:", error);
      }
      return;
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      gender: user?.gender || "",
      cpf: user?.cpf || "",
    });
    setIsEditing(false);
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!localPart || !domain) return email;
    
    const visibleChars = Math.max(2, Math.floor(localPart.length * 0.3));
    const masked = localPart.substring(0, visibleChars) + "*".repeat(localPart.length - visibleChars);
    return `${masked}@${domain}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Meu Perfil</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gerenciar e proteger sua conta
          </p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        )}
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            Nome de usuário
          </Label>
          <Input
            id="username"
            value={user?.username || ""}
            disabled
            className="bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-500">
            Nome do usuário pode ser alterado apenas uma vez.
          </p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Nome
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing || isSaving}
            placeholder="Digite seu nome"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <div className="flex items-center space-x-3">
            <Input
              id="email"
              value={isEditing ? formData.email : maskEmail(formData.email)}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing || isSaving}
              type={isEditing ? "email" : "text"}
              className="flex-1"
            />
            {!isEditing && (
              <Button
                type="button"
                variant="link"
                className="text-[#3e2626] hover:text-[#5a3a3a] px-0"
              >
                Trocar
              </Button>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Número de telefone
          </Label>
          {formData.phone ? (
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing || isSaving}
              placeholder="(11) 99999-9999"
            />
          ) : (
            <Button
              type="button"
              variant="link"
              className="text-[#3e2626] hover:text-[#5a3a3a] px-0"
              onClick={() => setIsEditing(true)}
            >
              Inserir
            </Button>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Sexo</Label>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
            disabled={!isEditing || isSaving}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="masculino" id="masculino" />
              <Label htmlFor="masculino" className="font-normal cursor-pointer">
                masculino
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="feminino" id="feminino" />
              <Label htmlFor="feminino" className="font-normal cursor-pointer">
                feminino
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outros" id="outros" />
              <Label htmlFor="outros" className="font-normal cursor-pointer">
                Outros
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* CPF */}
        <div className="space-y-2">
          <Label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
            CPF
          </Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            disabled={!isEditing || isSaving}
            placeholder="000.000.000-00"
            className="max-w-xs"
          />
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-gray-300"
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Gravar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

