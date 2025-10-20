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

    if (validSizeFiles.length > 0) {
      // Criar previews
      const newPreviews = validSizeFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);

      // Adicionar aos arquivos
      onImagesChange([...images, ...validSizeFiles]);
    }
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

  const totalImages = existingImages.length + images.length;
  const canAddMore = totalImages < maxImages;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Layout de imagens com destaque para a primeira */}
      <div className="space-y-4">
         {/* Imagem principal (primeira imagem) */}
         {(existingImages.length > 0 || previews.length > 0) && (
           <div className="relative group aspect-video rounded-lg overflow-hidden border-2 border-[#3e2626] bg-gray-100" style={{ minHeight: '200px' }}>
             {existingImages.length > 0 ? (
               <img
                 src={existingImages[0]}
                 alt="Imagem principal"
                 className="w-full h-full object-cover"
               />
             ) : previews.length > 0 ? (
               <img
                 src={previews[0]}
                 alt="Nova imagem principal"
                 className="w-full h-full object-cover"
               />
             ) : null}
            <button
              type="button"
              onClick={() => {
                if (existingImages.length > 0) {
                  handleRemoveExisting(existingImages[0]);
                } else {
                  handleRemoveNew(0);
                }
              }}
              className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

         {/* Imagens adicionais - mostra todas as imagens restantes */}
         {((existingImages.length + previews.length) > 1) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Imagens Adicionais</h4>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Imagens existentes restantes */}
              {existingImages.slice(1).map((url, index) => (
                <div
                  key={`existing-${index + 1}`}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#3e2626] transition-colors"
                >
                  <Image
                    src={url}
                    alt={`Imagem ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                  {onRemoveExisting && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(url)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                    <p className="text-white text-xs font-medium">{index + 2}</p>
                  </div>
                </div>
              ))}

              {/* Novas imagens restantes - só a partir da segunda */}
              {previews.slice(1).map((preview, index) => (
                <div
                  key={`new-${index + 1}`}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-green-200 hover:border-green-500 transition-colors"
                >
                  <Image
                    src={preview}
                    alt={`Nova imagem ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNew(index + 1)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-600/60 to-transparent p-1">
                    <p className="text-white text-xs font-medium">{index + 2}</p>
                  </div>
                  <div className="absolute top-1 left-1 bg-green-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                    NOVA
                  </div>
                </div>
              ))}

              {/* Botão para adicionar mais */}
              {canAddMore && (
                <button
                  type="button"
                  onClick={handleClick}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#3e2626] transition-colors flex flex-col items-center justify-center space-y-1 bg-gray-50 hover:bg-gray-100"
                >
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                  <p className="text-xs text-gray-500 font-medium">+</p>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botão para adicionar primeira imagem adicional */}
        {canAddMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleClick}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-[#3e2626] transition-colors rounded-lg bg-gray-50 hover:bg-gray-100"
            >
              <ImageIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Adicionar Imagem</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}