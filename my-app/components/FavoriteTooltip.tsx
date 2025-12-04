'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { customerAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface FavoriteTooltipProps {
  productId: string;
  className?: string;
}

export default function FavoriteTooltip({ productId, className = '' }: FavoriteTooltipProps) {
  const { isAuthenticated } = useAppStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se está nos favoritos
  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated) {
        setIsFavorite(false);
        return;
      }
      
      try {
        const response = await customerAPI.checkFavorite(productId);
        setIsFavorite(response.isFavorite || false);
      } catch (error: any) {
        // Silenciar todos os erros - apenas mostrar 0 (false)
        // Não logar erros silenciados ou erros 500/401/403
        if (error?.silent || 
            error?.response?.status === 500 || 
            error?.response?.status === 401 || 
            error?.response?.status === 403) {
          setIsFavorite(false);
          return;
        }
        // Logar apenas outros erros inesperados
        console.error('Erro ao verificar favorito:', error);
        setIsFavorite(false);
      }
    };

    // Só verificar se estiver autenticado
    if (isAuthenticated) {
      checkFavorite();
    } else {
      setIsFavorite(false);
    }
  }, [productId, isAuthenticated]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // VERIFICAÇÃO CRÍTICA: Verificar token diretamente
    const store = useAppStore.getState();
    const hasToken = !!store.token;
    const hasUser = !!store.user;
    const isReallyAuthenticated = hasToken && hasUser && store.isAuthenticated;
    
    // Se não estiver autenticado, SEMPRE mostrar mensagem de erro e retornar
    if (!isReallyAuthenticated || !isAuthenticated || !hasToken) {
      toast.error('Faça login para adicionar aos favoritos');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      
      // Verificar novamente antes de fazer qualquer chamada
      const currentStore = useAppStore.getState();
      if (!currentStore.token || !currentStore.user || !currentStore.isAuthenticated) {
        toast.error('Faça login para adicionar aos favoritos');
        return;
      }
      
      if (isFavorite) {
        await customerAPI.removeFromFavorites(productId);
        const checkResponse = await customerAPI.checkFavorite(productId);
        setIsFavorite(checkResponse.isFavorite || false);
        // Verificar novamente autenticação ANTES de mostrar mensagem
        const finalCheck = useAppStore.getState();
        if (!checkResponse.isFavorite && finalCheck.token && finalCheck.user && finalCheck.isAuthenticated) {
          toast.success('Produto removido dos favoritos');
        }
      } else {
        await customerAPI.addToFavorites(productId);
        const checkResponse = await customerAPI.checkFavorite(productId);
        setIsFavorite(checkResponse.isFavorite || false);
        
        // VERIFICAÇÃO FINAL ABSOLUTA: Verificar token, user E isAuthenticated antes de mostrar sucesso
        const finalCheck = useAppStore.getState();
        const canShowSuccess = finalCheck.token && 
                               finalCheck.user && 
                               finalCheck.isAuthenticated && 
                               checkResponse.isFavorite;
        
        if (canShowSuccess) {
          // Disparar evento para atualizar notificações imediatamente
          window.dispatchEvent(new CustomEvent('notification:favorite-added'));
          toast.success('Produto adicionado aos favoritos');
        } else {
          // Se não passou na verificação, mostrar erro
          toast.error('Faça login para adicionar aos favoritos');
        }
      }
    } catch (error: any) {
      console.error('Erro ao alternar favorito:', error);
      // SEMPRE mostrar erro de autenticação se não estiver autenticado
      const errorCheck = useAppStore.getState();
      if (!errorCheck.token || !errorCheck.user || 
          error?.response?.status === 401 || 
          error?.response?.status === 403 || 
          error?.message === 'Usuário não autenticado') {
        toast.error('Faça login para adicionar aos favoritos');
      } else {
        toast.error(error?.response?.data?.message || 'Erro ao atualizar favoritos');
      }
      // Reverter estado em caso de erro
      setIsFavorite(!isFavorite);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`absolute top-2 right-2 z-20 pointer-events-none ${className}`}>
      {/* Tooltip - aparece no hover do card pai */}
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto">
        <button
          type="button"
          onClick={handleToggleFavorite}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          disabled={isLoading}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            shadow-lg transition-all duration-200
            ${isFavorite 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
          `}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart 
            className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}

