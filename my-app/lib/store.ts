import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

export interface CartItem {
  product: Product;
  quantity: number;
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
      addToCart: (product, quantity = 1) => {
        const { cart } = get();
        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
          const updatedCart = cart.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          set({ 
            cart: updatedCart,
            cartTotal: updatedCart.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0)
          });
        } else {
          const updatedCart = [...cart, { product, quantity }];
          set({ 
            cart: updatedCart,
            cartTotal: updatedCart.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0)
          });
        }
      },

      removeFromCart: (productId) => {
        const { cart } = get();
        const updatedCart = cart.filter(item => item.product.id !== productId);
        set({ 
          cart: updatedCart,
          cartTotal: updatedCart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
        });
      },

      updateCartItemQuantity: (productId, quantity) => {
        const { cart } = get();
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        const updatedCart = cart.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        );
        set({ 
          cart: updatedCart,
          cartTotal: updatedCart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
        });
      },

      clearCart: () => set({ cart: [], cartTotal: 0 }),

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
        
        // Resetar estado do store
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          cart: [],
          cartTotal: 0,
          products: [],
          selectedProduct: null,
          furnitureAnalyses: [],
          currentAnalysis: null,
          isLoading: false,
          error: null,
        });
        
        console.log('✅ Logout concluído - estado resetado');
      },
    }),
    {
      name: 'mobili-ai-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        cart: state.cart,
        cartTotal: state.cartTotal,
        furnitureAnalyses: state.furnitureAnalyses,
      }),
    }
  )
);
