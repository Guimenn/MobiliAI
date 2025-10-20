'use client';

import { useState, useRef } from 'react';
import { Upload, X, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { uploadUserAvatar } from '@/lib/supabase';

interface UserAvatarUploadProps {
  avatar: File | null;
  onAvatarChange: (file: File | null) => void;
  existingAvatar?: string;
  onRemoveExisting?: () => void;
  userId?: string;
  onAvatarUploaded?: (url: string) => void;
}

export default function UserAvatarUpload({
  avatar,
  onAvatarChange,
  existingAvatar,
  onRemoveExisting,
  userId,
  onAvatarUploaded
}: UserAvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 2MB para avatar)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onAvatarChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatar || !userId) {
      console.warn('⚠️ Avatar ou userId não disponível para upload');
      return;
    }

    setIsUploading(true);
    try {
      console.log('📤 Fazendo upload do avatar para o usuário:', userId);
      const avatarUrl = await uploadUserAvatar(avatar, userId);
      
      if (avatarUrl) {
        console.log('✅ Avatar enviado com sucesso:', avatarUrl);
        if (onAvatarUploaded) {
          onAvatarUploaded(avatarUrl);
        }
      } else {
        console.error('❌ Falha no upload do avatar');
        alert('Erro ao fazer upload do avatar. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro no upload do avatar:', error);
      alert('Erro ao fazer upload do avatar. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveExisting = () => {
    if (onRemoveExisting) {
      onRemoveExisting();
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const hasImage = preview || existingAvatar || avatar;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Foto do Usuário
        </label>
        <div className="flex space-x-2">
          {hasImage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          )}
          {avatar && userId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadAvatar}
              disabled={isUploading}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Upload className="h-4 w-4 mr-1" />
              {isUploading ? 'Enviando...' : 'Enviar Avatar'}
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Avatar Display */}
      <div className="flex items-center space-x-4">
        {/* Avatar Preview */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 hover:border-[#3e2626] transition-colors bg-gray-100 flex items-center justify-center">
            {preview ? (
              <Image
                src={preview}
                alt="Preview do avatar"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : existingAvatar ? (
              <Image
                src={existingAvatar}
                alt="Avatar existente"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <UserIcon className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          {/* Botão de remoção no hover */}
          {hasImage && (
            <button
              type="button"
              onClick={existingAvatar ? handleRemoveExisting : handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {hasImage ? 'Alterar Foto' : 'Adicionar Foto'}
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG ou GIF. Máximo 2MB.
          </p>
        </div>
      </div>

      {/* Dicas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Dica:</strong> Use uma foto clara e profissional. A imagem será exibida como avatar do usuário no sistema.
        </p>
      </div>
    </div>
  );
}
