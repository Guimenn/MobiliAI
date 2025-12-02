'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { customerAPI } from '@/lib/api';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, token, cart } = useAppStore();

  useEffect(() => {
    // Carregar carrinho do backend quando a página inicia e o usuário está autenticado
    // Mas apenas para clientes (CUSTOMER role), não para funcionários ou gerentes
    if (isAuthenticated && user && token && typeof window !== 'undefined') {
      // Verificar se o usuário é um cliente
      const isCustomer = user.role === 'CUSTOMER' || user.role === 'customer';
      
      if (!isCustomer) {
        // Se não é cliente, não tentar carregar carrinho
        return;
      }

      // Verificar se o carrinho já foi carregado (tem itens com IDs do backend)
      const hasBackendItems = cart.some(item => item.id);
      
      // Só carregar se:
      // 1. Não tem itens do backend E
      // 2. O carrinho está vazio (não foi limpo intencionalmente)
      // 3. Não há flag de "já carregou" no sessionStorage
      const cartLoadedKey = `cart_loaded_${user.id}`;
      const alreadyLoaded = sessionStorage.getItem(cartLoadedKey);
      
      if (!hasBackendItems && cart.length === 0 && !alreadyLoaded) {
        (async () => {
          try {
            console.log('🔄 Carregando carrinho do backend na inicialização...');
            const cartData = await customerAPI.getCart();
            
            // Marcar como carregado
            sessionStorage.setItem(cartLoadedKey, 'true');
            
            if (cartData?.items && cartData.items.length > 0) {
              // Obter carrinho atual para preservar dados locais dos produtos
              const currentCart = useAppStore.getState().cart;
              
              const cartItems = cartData.items.map((item: any) => {
                // Tentar encontrar produto correspondente no carrinho local para preservar dados
                const localItem = currentCart.find(ci => ci.product.id === item.product.id);
                const localProduct = localItem?.product;

                // Mesclar dados do backend com dados locais, preservando campos de oferta relâmpago
                return {
                  id: item.id,
                  product: {
                    id: item.product.id,
                    name: item.product.name,
                    description: item.product.description,
                    category: item.product.category?.toLowerCase() || 'sofa',
                    price: Number(item.product.price),
                    stock: item.product.stock || 0,
                    imageUrl: item.product.imageUrls?.[0] || item.product.imageUrl,
                    imageUrls: item.product.imageUrls || [],
                    colorName: item.product.colorName,
                    colorHex: item.product.colorHex,
                    brand: item.product.brand,
                    // Campos de Oferta Normal - usar dados do backend se disponíveis, senão preservar do local
                    isOnSale: item.product.isOnSale !== undefined ? item.product.isOnSale : (localProduct?.isOnSale || false),
                    salePrice: item.product.salePrice ? Number(item.product.salePrice) : localProduct?.salePrice,
                    saleDiscountPercent: item.product.saleDiscountPercent ? Number(item.product.saleDiscountPercent) : localProduct?.saleDiscountPercent,
                    saleStartDate: item.product.saleStartDate || localProduct?.saleStartDate,
                    saleEndDate: item.product.saleEndDate || localProduct?.saleEndDate,
                    // Campos de Oferta Relâmpago - priorizar dados locais se existirem, senão usar do backend
                    isFlashSale: localProduct?.isFlashSale !== undefined ? localProduct.isFlashSale : (item.product.isFlashSale !== undefined ? item.product.isFlashSale : false),
                    flashSalePrice: localProduct?.flashSalePrice !== undefined ? localProduct.flashSalePrice : (item.product.flashSalePrice ? Number(item.product.flashSalePrice) : undefined),
                    flashSaleDiscountPercent: localProduct?.flashSaleDiscountPercent !== undefined ? localProduct.flashSaleDiscountPercent : (item.product.flashSaleDiscountPercent ? Number(item.product.flashSaleDiscountPercent) : undefined),
                    flashSaleStartDate: localProduct?.flashSaleStartDate || item.product.flashSaleStartDate || undefined,
                    flashSaleEndDate: localProduct?.flashSaleEndDate || item.product.flashSaleEndDate || undefined,
                    storeId: item.product.storeId || item.product.store?.id || '',
                    storeName: item.product.store?.name,
                    storeAddress: item.product.store?.address,
                    store: item.product.store ? {
                      id: item.product.store.id,
                      name: item.product.store.name,
                      address: item.product.store.address,
                      zipCode: item.product.store.zipCode,
                      city: item.product.store.city,
                      state: item.product.store.state,
                    } : undefined,
                    storeInventory: item.product.storeInventory ? item.product.storeInventory.map((inv: any) => ({
                      storeId: inv.storeId,
                      quantity: inv.quantity,
                      store: inv.store ? {
                        id: inv.store.id,
                        name: inv.store.name,
                        address: inv.store.address,
                        zipCode: inv.store.zipCode,
                        city: inv.store.city,
                        state: inv.store.state,
                        isActive: inv.store.isActive,
                      } : undefined,
                    })) : undefined,
                  },
                  quantity: item.quantity,
                };
              });
              
              const cartTotal = cartItems.reduce(
                (total: number, item: any) => total + (Number(item.product.price) * item.quantity),
                0
              );
              
              useAppStore.setState({ cart: cartItems, cartTotal });
              console.log('✅ Carrinho carregado na inicialização:', cartItems.length, 'itens');
            } else {
              // Se o carrinho está vazio no backend, garantir que está limpo localmente
              useAppStore.setState({ cart: [], cartTotal: 0 });
              console.log('✅ Carrinho vazio no backend');
            }
          } catch (error: any) {
            console.error('❌ Erro ao carregar carrinho na inicialização:', {
              error: error.message,
              response: error.response?.data,
              status: error.response?.status
            });
          }
        })();
      }
    } else if (!isAuthenticated) {
      // Se não está autenticado, limpar flags
      if (typeof window !== 'undefined') {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('cart_loaded_')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    }
  }, [isAuthenticated, user, token]); // Executar quando auth mudar

  return <>{children}</>;
}

