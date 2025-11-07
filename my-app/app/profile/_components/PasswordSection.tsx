"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PasswordSectionProps {
  onSubmit?: (payload: { currentPassword: string; newPassword: string }) => Promise<void> | void;
  isLoading?: boolean;
}

export default function PasswordSection({ onSubmit, isLoading = false }: PasswordSectionProps) {
  const [formValues, setFormValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);

  const toggleVisibility = (field: "current" | "next" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field: keyof typeof formValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validateForm = () => {
    if (!formValues.currentPassword || !formValues.newPassword || !formValues.confirmPassword) {
      return "Preencha todos os campos.";
    }

    if (formValues.newPassword.length < 8) {
      return "A nova senha deve ter pelo menos 8 caracteres.";
    }

    if (!/[A-Z]/.test(formValues.newPassword) || !/[0-9]/.test(formValues.newPassword)) {
      return "A senha deve conter ao menos uma letra maiúscula e um número.";
    }

    if (formValues.newPassword !== formValues.confirmPassword) {
      return "As senhas novas não conferem.";
    }

    if (formValues.newPassword === formValues.currentPassword) {
      return "A nova senha deve ser diferente da senha atual.";
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(null);

    const validationError = validateForm();
    if (validationError) {
      setErrors(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit({
          currentPassword: formValues.currentPassword,
          newPassword: formValues.newPassword,
        });
      } else {
        // Placeholder mock
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      toast.success("Senha atualizada com sucesso!");
      setFormValues({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível atualizar a senha.";
      toast.error(message);
      setErrors(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPasswordField = (
    id: string,
    label: string,
    value: string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    isVisible: boolean,
    onToggle: () => void,
    helper?: string,
    autoComplete?: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="pr-12"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
          aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {helper && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
      <div className="border-b border-gray-200 px-6 py-4 flex items-center space-x-3">
        <div className="rounded-full bg-[#3e2626]/10 p-2 text-[#3e2626]">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Trocar Senha</h1>
          <p className="text-sm text-gray-500">
            Mantenha sua conta protegida criando senhas fortes e únicas.
          </p>
        </div>
      </div>

      <form className="space-y-6 p-6" onSubmit={handleSubmit}>
        {renderPasswordField(
          "currentPassword",
          "Senha atual",
          formValues.currentPassword,
          handleChange("currentPassword"),
          showPasswords.current,
          () => toggleVisibility("current"),
          "Informe a senha que você usa atualmente para entrar na plataforma.",
          "current-password"
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderPasswordField(
            "newPassword",
            "Nova senha",
            formValues.newPassword,
            handleChange("newPassword"),
            showPasswords.next,
            () => toggleVisibility("next"),
            "Use ao menos 8 caracteres, com números, letras maiúsculas e símbolos.",
            "new-password"
          )}

          {renderPasswordField(
            "confirmPassword",
            "Confirmar nova senha",
            formValues.confirmPassword,
            handleChange("confirmPassword"),
            showPasswords.confirm,
            () => toggleVisibility("confirm"),
            "Repita a nova senha para confirmar.",
            "new-password"
          )}
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600 space-y-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-[#3e2626]" />
            <span className="font-medium text-gray-800">Recomendações de segurança</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Evite reutilizar senhas de outros serviços.</li>
            <li>Não compartilhe sua senha com outras pessoas.</li>
          </ul>
        </div>

        {errors && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errors}
          </div>
        )}

        <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
              setErrors(null);
            }}
            className="border-gray-300"
            disabled={submitting}
          >
            Limpar
          </Button>
          <Button
            type="submit"
            className="bg-[#3e2626] hover:bg-[#5a3a3a] text-white"
            disabled={submitting || isLoading}
          >
            {submitting || isLoading ? "Salvando..." : "Atualizar Senha"}
          </Button>
        </div>
      </form>
    </div>
  );
}

