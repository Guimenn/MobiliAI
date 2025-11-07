"use client";

import { useEffect, useRef, useState } from "react";
import { User, Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProfileAvatarProps {
  avatarUrl?: string;
  username?: string;
  onAvatarChange?: (file: File | null) => void;
  onAvatarSave?: () => Promise<void>;
  onAvatarRemove?: () => void;
  isSaving?: boolean;
}

export default function ProfileAvatar({ 
  avatarUrl, 
  username,
  onAvatarChange,
  onAvatarSave,
  onAvatarRemove,
  isSaving = false,
}: ProfileAvatarProps) {
  const [preview, setPreview] = useState<string | null>(avatarUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasPendingChanges) {
      setPreview(avatarUrl || null);
    }
  }, [avatarUrl, hasPendingChanges]);

  const handleFileSelect = (file: File) => {
    // Validar tamanho (máximo 1 MB)
    if (file.size > 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 1 MB");
      return;
    }

    // Validar extensão
    const validExtensions = [".jpeg", ".jpg", ".png"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExtension)) {
      toast.error("Apenas arquivos .JPEG e .PNG são permitidos");
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Chamar callback
    if (onAvatarChange) {
      onAvatarChange(file);
    }

    setHasPendingChanges(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveAvatar = () => {
    setPreview(avatarUrl || null);
    setHasPendingChanges(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onAvatarChange?.(null);
    onAvatarRemove?.();
  };

  const handleSaveClick = async () => {
    if (!onAvatarSave) return;
    try {
      await onAvatarSave();
      setHasPendingChanges(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      // Erro já tratado pelo callback (se necessário)
      setHasPendingChanges(true);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <div
          className={`
            w-32 h-32 rounded-full flex items-center justify-center
            border-4 border-gray-200 shadow-lg
            transition-all duration-300
            ${isDragging ? "scale-105 border-[#3e2626]" : ""}
            ${preview ? "bg-white" : "bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]"}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="h-16 w-16 text-white" />
          )}
        </div>
        
        {/* Remove button (only if preview exists) */}
        {preview && hasPendingChanges && (
          <button
            onClick={handleRemoveAvatar}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Username */}
      {username && (
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
            {username}
          </p>
        </div>
      )}

      {/* Upload Button */}
      <div className="w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpeg,.jpg,.png"
          onChange={handleFileInputChange}
          className="hidden"
          id="avatar-upload"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#3e2626] hover:bg-[#5a3a3a] text-white"
        >
          <Camera className="h-4 w-4 mr-2" />
          Selecionar A Imagem
        </Button>
      </div>

      {/* File Requirements */}
      <div className="text-center space-y-1">
        <p className="text-xs text-gray-500">
          Tamanho do arquivo: no máximo 1 MB
        </p>
        <p className="text-xs text-gray-500">
          Extensão de arquivo: .JPEG, .PNG
        </p>
      </div>

      {/* Actions */}
      {onAvatarSave && hasPendingChanges && (
        <div className="w-full flex items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={handleSaveClick}
            className="flex-1 bg-[#3e2626] hover:bg-[#5a3a3a] text-white"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              "Salvar avatar"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRemoveAvatar}
            disabled={isSaving}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

