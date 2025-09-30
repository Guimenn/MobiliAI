import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService, User, Product, CartItem } from './api';

interface LojaState {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  
  // Products
  products: Product[];
  filteredProducts: Product[];
  
  // Cart
  cart: CartItem[];
  cartTotal: number;
  
  // Cash (for cashier)
  cashOpen: boolean;
  cashAmount: number;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setProducts: (products: Product[]) => void;
  setFilteredProducts: (products: Product[]) => void;
  setCart: (cart: CartItem[]) => void;
  setCashOpen: (open: boolean) => void;
  setCashAmount: (amount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  
  // Product actions
  loadProducts: () => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  
  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  
  // Cash actions (for cashier)
  openCash: (initialAmount: number) => Promise<void>;
  closeCash: () => Promise<void>;
  loadCashStatus: () => Promise<void>;
  
  // Utility
  calculateCartTotal: () => number;
}

export const useLojaStore = create<LojaState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      token: null,
      products: [],
      filteredProducts: [],
      cart: [],
      cartTotal: 0,
      cashOpen: false,
      cashAmount: 0,
      isLoading: false,
      error: null,

      // Setters
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setProducts: (products) => set({ products }),
      setFilteredProducts: (filteredProducts) => set({ filteredProducts }),
      setCart: (cart) => set({ cart, cartTotal: get().calculateCartTotal() }),
      setCashOpen: (cashOpen) => set({ cashOpen }),
      setCashAmount: (cashAmount) => set({ cashAmount }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Auth actions
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          const { user, token } = await apiService.login(email, password);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          const { user, token } = await apiService.register({
            ...userData,
            role: 'customer'
          });
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('loja-token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          cart: [],
          cartTotal: 0,
          cashOpen: false,
          cashAmount: 0,
          error: null
        });
      },

      // Product actions
      loadProducts: async () => {
        try {
          set({ isLoading: true, error: null });
          const products = await apiService.getProducts();
          set({ products, filteredProducts: products, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      searchProducts: async (query) => {
        try {
          set({ isLoading: true, error: null });
          const products = await apiService.searchProducts(query);
          set({ filteredProducts: products, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      // Cart actions
      addToCart: (product, quantity = 1) => {
        const { cart } = get();
        const existingItem = cart.find(item => item.id === product.id);
        
        let newCart;
        if (existingItem) {
          newCart = cart.map(item =>
            item.id === product.id 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newCart = [...cart, { ...product, quantity }];
        }
        
        set({ cart: newCart, cartTotal: get().calculateCartTotal() });
      },

      updateCartItem: (itemId, quantity) => {
        const { cart } = get();
        let newCart;
        
        if (quantity <= 0) {
          newCart = cart.filter(item => item.id !== itemId);
        } else {
          newCart = cart.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          );
        }
        
        set({ cart: newCart, cartTotal: get().calculateCartTotal() });
      },

      removeFromCart: (itemId) => {
        const { cart } = get();
        const newCart = cart.filter(item => item.id !== itemId);
        set({ cart: newCart, cartTotal: get().calculateCartTotal() });
      },

      clearCart: () => {
        set({ cart: [], cartTotal: 0 });
      },

      // Cash actions
      openCash: async (initialAmount) => {
        try {
          set({ isLoading: true, error: null });
          await apiService.openCash(initialAmount);
          set({ cashOpen: true, cashAmount: initialAmount, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      closeCash: async () => {
        try {
          set({ isLoading: true, error: null });
          await apiService.closeCash();
          set({ cashOpen: false, cashAmount: 0, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      loadCashStatus: async () => {
        try {
          const { isOpen, totalAmount } = await apiService.getCashStatus();
          set({ cashOpen: isOpen, cashAmount: totalAmount });
        } catch (error) {
          console.error('Erro ao carregar status do caixa:', error);
        }
      },

      // Utility
      calculateCartTotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'loja-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        cashOpen: state.cashOpen,
        cashAmount: state.cashAmount,
      }),
    }
  )
);
