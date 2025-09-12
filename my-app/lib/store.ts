import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee' | 'customer';
  storeId?: string;
  store?: {
    id: string;
    name: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: 'tinta' | 'pincel' | 'rolo' | 'fita' | 'kit' | 'outros';
  price: number;
  stock: number;
  color?: string;
  colorCode?: string;
  brand?: string;
  imageUrl?: string;
  storeId: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ColorAnalysis {
  id: string;
  imageUrl: string;
  detectedColors: {
    hex: string;
    rgb: { r: number; g: number; b: number };
    percentage: number;
    position: { x: number; y: number };
  }[];
  suggestedPalettes: {
    name: string;
    colors: string[];
    harmony: string;
  }[];
  recommendedProducts: {
    productId: string;
    confidence: number;
    reason: string;
  }[];
  processedImageUrl?: string;
  createdAt: string;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Cart
  cart: CartItem[];
  cartTotal: number;
  
  // Products
  products: Product[];
  selectedProduct: Product | null;
  
  // Color Analysis
  colorAnalyses: ColorAnalysis[];
  currentAnalysis: ColorAnalysis | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  
  setColorAnalyses: (analyses: ColorAnalysis[]) => void;
  setCurrentAnalysis: (analysis: ColorAnalysis | null) => void;
  addColorAnalysis: (analysis: ColorAnalysis) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      cart: [],
      cartTotal: 0,
      products: [],
      selectedProduct: null,
      colorAnalyses: [],
      currentAnalysis: null,
      isLoading: false,
      error: null,

      // Auth actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

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

      // Color analysis actions
      setColorAnalyses: (analyses) => set({ colorAnalyses: analyses }),
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      addColorAnalysis: (analysis) => {
        const { colorAnalyses } = get();
        set({ colorAnalyses: [analysis, ...colorAnalyses] });
      },

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Logout
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        cart: [],
        cartTotal: 0,
        products: [],
        selectedProduct: null,
        colorAnalyses: [],
        currentAnalysis: null,
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'loja-tintas-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        cart: state.cart,
        cartTotal: state.cartTotal,
        colorAnalyses: state.colorAnalyses,
      }),
    }
  )
);
