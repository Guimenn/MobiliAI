'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (files: File[]) => void;
  maxImages?: number;
  existingImages?: string[];
  onRemoveExisting?: (url: string) => void;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  existingImages = [],
  onRemoveExisting
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + existingImages.length + files.length;

    if (totalImages > maxImages) {
      alert(`Você pode adicionar no máximo ${maxImages} imagens`);
      return;
    }

    // Validar tipo de arquivo
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        alert(`${file.name} não é uma imagem válida`);
      }
      return isValid;
    });

    // Validar tamanho (máximo 5MB por imagem)
    const validSizeFiles = validFiles.filter(file => {
      const isValid = file.size <= 5 * 1024 * 1024;
      if (!isValid) {
        alert(`${file.name} é muito grande. Máximo 5MB por imagem.`);
      }
      return isValid;
    });

    if (validSizeFiles.length === 0) return;

    // Criar previews
    const newPreviews: string[] = [];
    validSizeFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validSizeFiles.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    onImagesChange([...images, ...validSizeFiles]);
  };

  const handleRemoveNew = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setPreviews(newPreviews);
  };

  const handleRemoveExisting = (url: string) => {
    if (onRemoveExisting) {
      onRemoveExisting(url);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const totalImages = images.length + existingImages.length;
  const canAddMore = totalImages < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Imagens do Produto
          <span className="text-xs text-gray-500 ml-2">
            ({totalImages}/{maxImages} imagens)
          </span>
        </label>
        {canAddMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Adicionar Imagens</span>
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Grid de imagens */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Imagens existentes */}
        {existingImages.map((url, index) => (
          <div
            key={`existing-${index}`}
            className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#3e2626] transition-colors"
          >
            <Image
              src={url}
              alt={`Imagem ${index + 1}`}
              fill
              className="object-cover"
            />
            {onRemoveExisting && (
              <button
                type="button"
                onClick={() => handleRemoveExisting(url)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs font-medium">Imagem {index + 1}</p>
            </div>
          </div>
        ))}

        {/* Novas imagens (previews) */}
        {previews.map((preview, index) => (
          <div
            key={`new-${index}`}
            className="relative group aspect-square rounded-lg overflow-hidden border-2 border-green-200 hover:border-green-500 transition-colors"
          >
            <Image
              src={preview}
              alt={`Nova imagem ${index + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemoveNew(index)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-600/60 to-transparent p-2">
              <p className="text-white text-xs font-medium">Nova - {images[index]?.name}</p>
            </div>
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
              NOVA
            </div>
          </div>
        ))}

        {/* Placeholder para adicionar mais */}
        {canAddMore && (
          <button
            type="button"
            onClick={handleClick}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#3e2626] transition-colors flex flex-col items-center justify-center space-y-2 bg-gray-50 hover:bg-gray-100"
          >
            <ImageIcon className="h-8 w-8 text-gray-400" />
            <p className="text-xs text-gray-500 font-medium">Adicionar</p>
            <p className="text-xs text-gray-400">até {maxImages - totalImages} mais</p>
          </button>
        )}
      </div>

      {/* Dicas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Dicas:</strong> Formatos aceitos: JPG, PNG, GIF, WebP. Tamanho máximo: 5MB por imagem.
          A primeira imagem será a capa do produto.
        </p>
      </div>
    </div>
  );
}
