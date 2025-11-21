import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Rastrear operações de addToCart em progresso para evitar duplicação
const addToCartInProgress = new Set<string>();

export type CouponStatus = "active" | "used" | "expired";

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumPurchase?: number;
  expiresAt: string;
  status: CouponStatus;
  usageLimit?: number;
  usedCount?: number;
  category?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'ADMIN' | 'store_manager' | 'STORE_MANAGER' | 'cashier' | 'CASHIER' | 'employee' | 'EMPLOYEE' | 'customer' | 'CUSTOMER';
  phone?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  storeId?: string;
  createdAt?: string;
  avatarUrl?: string;
  store?: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: 'sofa' | 'mesa' | 'cadeira' | 'armario' | 'cama' | 'decoracao' | 'iluminacao' | 'mesa_centro';
  price: number;
  stock: number;
  color?: string;
  material?: string;
  brand?: string;
  dimensions?: string;
  weight?: string;
  style?: string;
  imageUrl?: string;
  imageUrls?: string[]; // Array de URLs de imagens
  storeId: string;
  rating?: number;
  reviewCount?: number;
  storeName?: string;
  storeAddress?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  originalPrice?: number;
  // Campos de Oferta Normal
  isOnSale?: boolean;
  salePrice?: number;
  saleDiscountPercent?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  // Campos de Oferta Relâmpago
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleDiscountPercent?: number;
  flashSaleStartDate?: string;
  flashSaleEndDate?: string;
  // Campos para produtos disponíveis em múltiplas lojas
  availableInStores?: Array<{ storeId: string; storeName?: string; stock: number }>;
  totalStock?: number; // Estoque total somado de todas as lojas
  // Estoque por filial (para admin)
  stockByStore?: Array<{ storeId: string; storeName: string; quantity: number }>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  id?: string; // ID do cartItem no backend (opcional para compatibilidade)
}

export interface FurnitureAnalysis {
  id: string;
  imageUrl: string;
  detectedSpaces: {
    type: string;
    area: number;
    position: { x: number; y: number; width: number; height: number };
    confidence: number;
    suggestedFurniture: string[];
  }[];
  suggestedFurniture: {
    name: string;
    category: string;
    confidence: number;
    reason: string;
  }[];
  recommendedProducts: {
    productId: string;
    confidence: number;
    reason: string;
  }[];
  processedImageUrl?: string;
  createdAt: string;
}

const defaultCoupons: Coupon[] = [
  {
    id: 'c1',
    code: 'BEMVINDO10',
    description: '10% de desconto na primeira compra',
    discountType: 'percentage',
    discountValue: 10,
    minimumPurchase: 200,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
    status: 'active',
    category: 'Boas-vindas',
  },
  {
    id: 'c2',
    code: 'FRETEGRATIS',
    description: 'Frete grátis para compras acima de R$ 300',
    discountType: 'fixed',
    discountValue: 25,
    minimumPurchase: 300,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'active',
    category: 'Frete',
  },
  {
    id: 'c3',
    code: 'SUPER15',
    description: '15% OFF em tintas premium selecionadas',
    discountType: 'percentage',
    discountValue: 15,
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'expired',
    category: 'Tintas Premium',
  },
  {
    id: 'c4',
    code: 'RENOVE5',
    description: 'R$ 50 de desconto para pedidos acima de R$ 600',
    discountType: 'fixed',
    discountValue: 50,
    minimumPurchase: 600,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
    status: 'used',
    usedCount: 1,
    category: 'Renovação',
  },
];

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  coupons: Coupon[];
  
  // Cart
  cart: CartItem[];
  cartTotal: number;
  
  // Products
  products: Product[];
  selectedProduct: Product | null;
  
  // Furniture Analysis
  furnitureAnalyses: FurnitureAnalysis[];
  currentAnalysis: FurnitureAnalysis | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setCoupons: (coupons: Coupon[]) => void;
  addCoupon: (coupon: Coupon) => void;
  updateCouponStatus: (couponId: string, status: CouponStatus) => void;
  
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  
  setFurnitureAnalyses: (analyses: FurnitureAnalysis[]) => void;
  setCurrentAnalysis: (analysis: FurnitureAnalysis | null) => void;
  addFurnitureAnalysis: (analysis: FurnitureAnalysis) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Auth helpers
  isUserAuthenticated: () => boolean;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      coupons: defaultCoupons,
      cart: [],
      cartTotal: 0,
      products: [],
      selectedProduct: null,
      furnitureAnalyses: [],
      currentAnalysis: null,
      isLoading: false,
      error: null,

      // Auth actions
      setUser: (user) => {
        console.log('Store setUser called with:', user);
        set({ user, isAuthenticated: !!user });
        
        // Se o usuário fez login, carregar o carrinho do backend (em background)
        // APENAS para CUSTOMER ou ADMIN (outros roles não têm carrinho de customer)
        if (user && typeof window !== 'undefined') {
          const userRole = user.role?.toUpperCase();
          const isCustomer = userRole === 'CUSTOMER' || userRole === 'ADMIN';
          
          // Limpar carrinho local PRIMEIRO para evitar conflitos
          set({ cart: [], cartTotal: 0 });
          
          // Se não for customer/admin, não tentar carregar carrinho
          if (!isCustomer) {
            console.log(`ℹ️ Usuário com role ${userRole} não precisa de carrinho de customer, pulando carregamento.`);
            return;
          }
          
          // Marcar que o setUser vai carregar o carrinho (para evitar que ClientProviders também carregue)
          const cartLoadedKey = `cart_loaded_${user.id}`;
          sessionStorage.setItem(cartLoadedKey, 'true');
          
          // Forçar limpeza do localStorage também
          try {
            const storage = localStorage.getItem('mobili-ai-storage');
            if (storage) {
              const parsed = JSON.parse(storage);
              if (parsed.state?.cart) {
                parsed.state.cart = [];
                parsed.state.cartTotal = 0;
                localStorage.setItem('mobili-ai-storage', JSON.stringify(parsed));
                console.log('🧹 Carrinho limpo do localStorage');
              }
            }
          } catch (e) {
            console.warn('⚠️ Erro ao limpar localStorage:', e);
          }
          
          // Executar em background sem bloquear
          (async () => {
            try {
              // Aguardar um pouco mais para garantir que o token está disponível
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Verificar se o token está disponível antes de buscar o carrinho
              const currentState = get();
              if (!currentState.token) {
                console.warn('⚠️ Token não disponível ainda, aguardando...');
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              const { customerAPI } = await import('./api');
              const cartData = await customerAPI.getCart();
              
              console.log('📦 Dados do carrinho recebidos do backend:', cartData);
              
              // Sempre atualizar o carrinho, mesmo se estiver vazio (para limpar carrinho local se necessário)
              if (cartData?.items && cartData.items.length > 0) {
                // Converter os itens do backend para o formato do store
                const cartItems: CartItem[] = cartData.items.map((item: any) => ({
                  id: item.id, // ID do cartItem no backend
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
                    storeId: item.product.storeId || item.product.store?.id || '',
                    storeName: item.product.store?.name,
                    storeAddress: item.product.store?.address,
                  },
                  quantity: item.quantity,
                }));
                
                const cartTotal = cartItems.reduce(
                  (total, item) => total + (Number(item.product.price) * item.quantity),
                  0
                );
                
                set({ cart: cartItems, cartTotal });
                console.log('✅ Carrinho carregado do backend:', cartItems.length, 'itens');
              } else {
                // Se o carrinho está vazio no backend, garantir que está limpo
                set({ cart: [], cartTotal: 0 });
                console.log('✅ Carrinho vazio no backend, carrinho local limpo');
              }
            } catch (error: any) {
              console.error('❌ Erro ao carregar carrinho do backend:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
              });
              // Continuar mesmo se houver erro, mas manter carrinho vazio
              set({ cart: [], cartTotal: 0 });
            }
          })();
        } else if (!user) {
          // Se não há usuário, limpar o carrinho também (logout)
          set({ cart: [], cartTotal: 0 });
          
          // Limpar flags de carregamento
          if (typeof window !== 'undefined') {
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('cart_loaded_')) {
                sessionStorage.removeItem(key);
              }
            });
          }
        }
      },
      setToken: (token) => {
        console.log('Store setToken called with:', token ? 'Token received' : 'No token');
        set({ token });
      },
      setAuthenticated: (isAuthenticated) => {
        console.log('Store setAuthenticated called with:', isAuthenticated);
        set({ isAuthenticated });
      },

      setCoupons: (coupons) => {
        set({ coupons });
      },

      addCoupon: (coupon) => {
        set((state) => ({
          coupons: [...state.coupons, coupon],
        }));
      },

      updateCouponStatus: (couponId, status) => {
        set((state) => ({
          coupons: state.coupons.map((coupon) =>
            coupon.id === couponId ? { ...coupon, status } : coupon
          ),
        }));
      },

      // Cart actions
      addToCart: async (product, quantity = 1) => {
        const { cart, user, isAuthenticated } = get();

        // Verificar se o usuário tem permissão para usar carrinho de customer
        const userRole = user?.role?.toUpperCase();
        const isCustomer = userRole === 'CUSTOMER' || userRole === 'ADMIN';

        // Se NÃO estiver autenticado, mantém comportamento apenas local
        if (!isAuthenticated || !user) {
          const existingItem = cart.find(item => item.product.id === product.id);
          
          let updatedCart: CartItem[];
          if (existingItem) {
            updatedCart = cart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            updatedCart = [...cart, { product, quantity }];
          }
          
          const cartTotal = updatedCart.reduce(
            (total, item) => total + (Number(item.product.price) * item.quantity),
            0
          );
          set({ cart: updatedCart, cartTotal });
          return;
        }

        // Se não for customer/admin, apenas atualizar localmente
        if (!isCustomer) {
          console.log(`ℹ️ Usuário com role ${userRole} não pode usar carrinho de customer, atualizando apenas localmente.`);
          const existingItem = cart.find(item => item.product.id === product.id);
          
          let updatedCart: CartItem[];
          if (existingItem) {
            updatedCart = cart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            updatedCart = [...cart, { product, quantity }];
          }
          
          const cartTotal = updatedCart.reduce(
            (total, item) => total + (Number(item.product.price) * item.quantity),
            0
          );
          set({ cart: updatedCart, cartTotal });
          return;
        }

        // Usuário autenticado: atualização otimista (imediata) + sincronização em background
        // Proteção contra chamadas duplicadas
        if (addToCartInProgress.has(product.id)) {
          console.warn('⚠️ addToCart já em progresso para este produto, ignorando...');
          return;
        }

        // ATUALIZAÇÃO OTIMISTA: atualizar localmente imediatamente para feedback instantâneo
        const existingItem = cart.find(item => item.product.id === product.id);
        let optimisticCart: CartItem[];
        if (existingItem) {
          optimisticCart = cart.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          optimisticCart = [...cart, { product, quantity }];
        }
        const optimisticTotal = optimisticCart.reduce(
          (total, item) => total + (Number(item.product.price) * item.quantity),
          0
        );
        set({ cart: optimisticCart, cartTotal: optimisticTotal });

        // Sincronizar com backend em background (sem bloquear a UI)
        addToCartInProgress.add(product.id);
        (async () => {
          try {
            const { customerAPI } = await import('./api');

            // Chama backend para adicionar
            await customerAPI.addToCart(product.id, quantity);
            console.log('✅ Item adicionado ao backend');

            // Pequeno delay para garantir que o backend processou
            await new Promise(resolve => setTimeout(resolve, 200));

            // Busca carrinho completo do backend para sincronizar
            const cartData = await customerAPI.getCart();
            const backendItems = cartData?.items || [];

            const cartItems: CartItem[] = backendItems.map((item: any) => ({
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
                storeId: item.product.storeId || item.product.store?.id || '',
                storeName: item.product.store?.name,
                storeAddress: item.product.store?.address,
              },
              quantity: item.quantity,
            }));

            const cartTotal = cartItems.reduce(
              (total, item) => total + (Number(item.product.price) * item.quantity),
              0
            );

            // Atualizar com dados do backend (pode ter diferenças de quantidade, etc)
            set({ cart: cartItems, cartTotal });
            console.log('✅ Carrinho sincronizado com backend:', cartItems.length, 'itens');
          } catch (error) {
            console.error('❌ Erro ao sincronizar com backend:', error);
            // Em caso de erro, manter a atualização otimista (já foi feita)
            // O usuário vê o item imediatamente, mesmo se o backend falhar
          } finally {
            // Sempre remover da lista de operações em progresso
            addToCartInProgress.delete(product.id);
          }
        })();
      },

      removeFromCart: async (productId) => {
        const { cart, user, isAuthenticated } = get();

        // Verificar se o usuário tem permissão para usar carrinho de customer
        const userRole = user?.role?.toUpperCase();
        const isCustomer = userRole === 'CUSTOMER' || userRole === 'ADMIN';

        // Se não estiver autenticado, apenas atualizar local
        if (!isAuthenticated || !user) {
          const updatedCart = cart.filter(item => item.product.id !== productId);
          const cartTotal = updatedCart.reduce(
            (total, item) => total + (item.product.price * item.quantity),
            0
          );
          set({ cart: updatedCart, cartTotal });
          return;
        }

        // Se não for customer/admin, apenas atualizar localmente
        if (!isCustomer) {
          console.log(`ℹ️ Usuário com role ${userRole} não pode usar carrinho de customer, removendo apenas localmente.`);
          const updatedCart = cart.filter(item => item.product.id !== productId);
          const cartTotal = updatedCart.reduce(
            (total, item) => total + (item.product.price * item.quantity),
            0
          );
          set({ cart: updatedCart, cartTotal });
          return;
        }

        try {
          const { customerAPI } = await import('./api');

          // Buscar carrinho atual no backend para descobrir o ID do item
          const cartData = await customerAPI.getCart();
          const backendItems = cartData?.items || [];
          const backendItem = backendItems.find(
            (item: any) => item.product.id === productId
          );

          if (backendItem?.id) {
            await customerAPI.removeFromCart(backendItem.id);
          } else {
            console.warn('⚠️ Item não encontrado no backend para remoção, removendo apenas localmente');
          }

          // Recarregar carrinho completo do backend
          const updatedCartData = await customerAPI.getCart();
          const updatedBackendItems = updatedCartData?.items || [];

          const cartItems: CartItem[] = updatedBackendItems.map((item: any) => ({
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
              storeId: item.product.storeId || '',
            },
            quantity: item.quantity,
          }));

          const cartTotal = cartItems.reduce(
            (total, item) => total + (Number(item.product.price) * item.quantity),
            0
          );

          set({ cart: cartItems, cartTotal });
          console.log('✅ Carrinho recarregado do backend após removeFromCart:', cartItems.length, 'itens');
        } catch (error) {
          console.error('❌ Erro ao remover item do carrinho no backend:', error);

          // Fallback: remover apenas localmente para não quebrar a UX
          const updatedCart = cart.filter(item => item.product.id !== productId);
          const cartTotal = updatedCart.reduce(
            (total, item) => total + (item.product.price * item.quantity),
            0
          );
          set({ cart: updatedCart, cartTotal });
        }
      },

      updateCartItemQuantity: async (productId, quantity) => {
        const { cart, user, isAuthenticated } = get();
        if (quantity <= 0) {
          await get().removeFromCart(productId);
          return;
        }
        
        // Verificar se o usuário tem permissão para usar carrinho de customer
        const userRole = user?.role?.toUpperCase();
        const isCustomer = userRole === 'CUSTOMER' || userRole === 'ADMIN';
        
        const itemToUpdate = cart.find(item => item.product.id === productId);
        const updatedCart = cart.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        );
        const cartTotal = updatedCart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
        set({ cart: updatedCart, cartTotal });
        
        // Sincronizar com o backend se o usuário estiver autenticado E for customer/admin
        if (isAuthenticated && user && isCustomer && itemToUpdate?.id) {
          try {
            const { customerAPI } = await import('./api');
            await customerAPI.updateCartItem(itemToUpdate.id, quantity);
          } catch (error) {
            console.warn('⚠️ Erro ao sincronizar atualização do carrinho com o backend:', error);
            // Continuar mesmo se houver erro
          }
        }
      },

      clearCart: async () => {
        const { user, isAuthenticated } = get();
        
        // Verificar se o usuário tem permissão para usar carrinho de customer
        const userRole = user?.role?.toUpperCase();
        const isCustomer = userRole === 'CUSTOMER' || userRole === 'ADMIN';
        
        // Limpar localmente primeiro
        set({ cart: [], cartTotal: 0 });
        
        // Limpar flag de carregamento para evitar recarregar após limpar
        if (typeof window !== 'undefined' && user) {
          const cartLoadedKey = `cart_loaded_${user.id}`;
          sessionStorage.removeItem(cartLoadedKey);
        }
        
        // Se estiver autenticado E for customer/admin, limpar também no backend
        if (isAuthenticated && user && isCustomer) {
          try {
            const { customerAPI } = await import('./api');
            await customerAPI.clearCart();
            console.log('✅ Carrinho limpo no backend');
          } catch (error) {
            console.error('❌ Erro ao limpar carrinho no backend:', error);
            // Continuar mesmo se houver erro
          }
        }
      },

      // Product actions
      setProducts: (products) => set({ products }),
      setSelectedProduct: (product) => set({ selectedProduct: product }),

      // Furniture analysis actions
      setFurnitureAnalyses: (analyses) => set({ furnitureAnalyses: analyses }),
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      addFurnitureAnalysis: (analysis) => {
        const { furnitureAnalyses } = get();
        set({ furnitureAnalyses: [analysis, ...furnitureAnalyses] });
      },

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Auth helpers
      isUserAuthenticated: () => {
        const state = get();
        return !!(state.user && state.token && state.isAuthenticated);
      },

      // Logout
      logout: () => {
        console.log('🚪 Executando logout...');
        
        // Limpar localStorage completamente
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('mobili-ai-storage');
            localStorage.removeItem('supabase.auth.token');
            // Limpar outros possíveis dados de autenticação
            Object.keys(localStorage).forEach(key => {
              if (key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key);
              }
            });
            sessionStorage.clear();
            console.log('✅ Dados do localStorage limpos');
          } catch (error) {
            console.error('❌ Erro ao limpar localStorage:', error);
          }
        }
        
        // Resetar estado do store (mas manter o carrinho no backend)
        // O carrinho será recuperado quando o usuário fizer login novamente
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          cart: [], // Limpar apenas do estado local, o backend mantém
          cartTotal: 0,
          products: [],
          selectedProduct: null,
          furnitureAnalyses: [],
          currentAnalysis: null,
          isLoading: false,
          error: null,
        });
        
        console.log('✅ Logout concluído - estado resetado (carrinho mantido no backend)');
      },
    }),
    {
      name: 'mobili-ai-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // Não persistir carrinho quando usuário está autenticado (vem sempre do backend)
        cart: state.isAuthenticated ? [] : state.cart,
        cartTotal: state.isAuthenticated ? 0 : state.cartTotal,
        furnitureAnalyses: state.furnitureAnalyses,
      }),
    }
  )
);
