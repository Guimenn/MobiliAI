import axios from 'axios';
import { useAppStore } from './store';

import { env } from './env';

const API_BASE_URL = env.API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAppStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não fazer logout automático em rotas de auth
    if (error.response?.status === 401 && 
        !error.config?.url?.includes('/auth/')) {
      // Só fazer logout se não estiver em uma rota de autenticação
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        useAppStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    role?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  checkEmail: async (email: string) => {
    const response = await api.post('/auth/check-email', { email });
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (storeId?: string) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByCategory: async (category: string, storeId?: string) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get(`/products/category/${category}`, { params });
    return response.data;
  },

  getByStyle: async (style: string, storeId?: string) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get(`/products/style/${style}`, { params });
    return response.data;
  },

  create: async (productData: {
    name: string;
    description?: string;
    category: string;
    price: number;
    costPrice?: number;
    stock: number;
    minStock?: number;
    color?: string;
    material?: string;
    brand?: string;
    dimensions?: string;
    weight?: string;
    style?: string;
    imageUrl?: string;
    storeId: string;
  }) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  update: async (id: string, productData: Partial<{
    name: string;
    description: string;
    category: string;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    color: string;
    material: string;
    brand: string;
    dimensions: string;
    weight: string;
    style: string;
    imageUrl: string;
    isActive: boolean;
  }>) => {
    const response = await api.patch(`/products/${id}`, productData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  updateStock: async (id: string, quantity: number) => {
    const response = await api.patch(`/products/${id}/stock`, { quantity });
    return response.data;
  },
};

// Sales API
export const salesAPI = {
  getAll: async (storeId?: string) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get('/sales', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  create: async (saleData: {
    totalAmount: number;
    discount?: number;
    tax?: number;
    paymentMethod: string;
    paymentReference?: string;
    notes?: string;
    customerId: string;
    storeId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
  }) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },

  update: async (id: string, saleData: Partial<{
    status: string;
    paymentReference: string;
    notes: string;
  }>) => {
    const response = await api.patch(`/sales/${id}`, saleData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  },

  getByCustomer: async (customerId: string) => {
    const response = await api.get(`/sales/customer/${customerId}`);
    return response.data;
  },

  getByDateRange: async (startDate: string, endDate: string, storeId?: string) => {
    const params = { startDate, endDate, ...(storeId && { storeId }) };
    const response = await api.get('/sales/date-range', { params });
    return response.data;
  },
};

// Stores API
export const storesAPI = {
  getAll: async () => {
    const response = await api.get('/stores');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/stores/${id}`);
    return response.data;
  },

  create: async (storeData: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
    email?: string;
  }) => {
    const response = await api.post('/stores', storeData);
    return response.data;
  },

  update: async (id: string, storeData: Partial<{
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    isActive: boolean;
  }>) => {
    const response = await api.patch(`/stores/${id}`, storeData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/stores/${id}`);
    return response.data;
  },

  getStats: async (id: string) => {
    const response = await api.get(`/stores/${id}/stats`);
    return response.data;
  },
};

// AI API
export const aiAPI = {
  analyzeFurniture: async (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/ai/analyze-furniture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  addFurniture: async (imageFile: File, space: any, furniture: string) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('space', JSON.stringify(space));
    formData.append('furniture', furniture);
    
    const response = await api.post('/ai/add-furniture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAnalysis: async (id: string) => {
    const response = await api.get(`/ai/analysis/${id}`);
    return response.data;
  },

  getUserAnalyses: async () => {
    const response = await api.get('/ai/my-analyses');
    return response.data;
  },

  // Novas funções baseadas na lógica do projeto testando-nanobanana
  processImageWithUrl: async (data: {
    prompt: string;
    imageUrl: string;
    outputFormat?: string;
  }) => {
    const response = await api.post('/ai/process-url', data);
    return response.data;
  },

  processImageWithUpload: async (data: {
    file: File;
    prompt: string;
    outputFormat?: string;
  }) => {
    const formData = new FormData();
    formData.append('image', data.file);
    formData.append('prompt', data.prompt);
    formData.append('outputFormat', data.outputFormat || 'jpg');
    
    const response = await api.post('/ai/process-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Chatbot API
export const chatbotAPI = {
  createSession: async (title?: string) => {
    const response = await api.post('/chatbot/sessions', { title });
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/chatbot/sessions');
    return response.data;
  },

  getSession: async (sessionId: string) => {
    const response = await api.get(`/chatbot/sessions/${sessionId}`);
    return response.data;
  },

  sendMessage: async (sessionId: string, content: string) => {
    const response = await api.post(`/chatbot/sessions/${sessionId}/messages`, {
      content,
    });
    return response.data;
  },

  deleteSession: async (sessionId: string) => {
    const response = await api.delete(`/chatbot/sessions/${sessionId}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getOverviewStats: async () => {
    const response = await api.get('/admin/stats/overview');
    return response.data;
  },

  getRecentSales: async () => {
    const response = await api.get('/admin/stats/recent-sales');
    return response.data;
  },

  getTopProducts: async () => {
    const response = await api.get('/admin/stats/top-products');
    return response.data;
  },

  // Users
  getAllUsers: async (page = 1, limit = 10, search = '') => {
    const response = await api.get('/admin/users', {
      params: { page, limit, search }
    });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  changeUserPassword: async (id: string, password: string) => {
    const response = await api.put(`/admin/users/${id}/password`, { password });
    return response.data;
  },

  // Stores
  getAllStores: async () => {
    const response = await api.get('/admin/stores');
    return response.data;
  },

  getStoreById: async (id: string) => {
    const response = await api.get(`/admin/stores/${id}`);
    return response.data;
  },

  createStore: async (storeData: any) => {
    const response = await api.post('/admin/stores', storeData);
    return response.data;
  },

  updateStore: async (id: string, storeData: any) => {
    const response = await api.put(`/admin/stores/${id}`, storeData);
    return response.data;
  },

  deleteStore: async (id: string) => {
    const response = await api.delete(`/admin/stores/${id}`);
    return response.data;
  },

  // Products
  getAllProducts: async (page = 1, limit = 10, search = '', category?: string) => {
    const response = await api.get('/admin/products', {
      params: { page, limit, search, category }
    });
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await api.post('/admin/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: any) => {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  // Reports
  getSalesReport: async (startDate?: string, endDate?: string, storeId?: string) => {
    const response = await api.get('/admin/reports/sales', {
      params: { startDate, endDate, storeId }
    });
    return response.data;
  },

  getInventoryReport: async (storeId?: string) => {
    const response = await api.get('/admin/reports/inventory', {
      params: { storeId }
    });
    return response.data;
  },

  getUserActivityReport: async (userId?: string, startDate?: string, endDate?: string) => {
    const response = await api.get('/admin/reports/user-activity', {
      params: { userId, startDate, endDate }
    });
    return response.data;
  },
};

// Manager API
export const managerAPI = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/manager/dashboard');
    return response.data;
  },

  getOverviewStats: async () => {
    const response = await api.get('/manager/stats/overview');
    return response.data;
  },

  getRecentSales: async () => {
    const response = await api.get('/manager/stats/recent-sales');
    return response.data;
  },

  getTopProducts: async () => {
    const response = await api.get('/manager/stats/top-products');
    return response.data;
  },

  getStoreInfo: async () => {
    const response = await api.get('/manager/store');
    return response.data;
  },

  // Users (apenas da loja do gerente)
  getStoreUsers: async (page = 1, limit = 10, search = '') => {
    const response = await api.get('/manager/users', {
      params: { page, limit, search }
    });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/manager/users/${id}`);
    return response.data;
  },

  createStoreUser: async (userData: any) => {
    const response = await api.post('/manager/users', userData);
    return response.data;
  },

  updateStoreUser: async (id: string, userData: any) => {
    const response = await api.put(`/manager/users/${id}`, userData);
    return response.data;
  },

  deleteStoreUser: async (id: string) => {
    const response = await api.delete(`/manager/users/${id}`);
    return response.data;
  },

  changeUserPassword: async (id: string, password: string) => {
    const response = await api.put(`/manager/users/${id}/password`, { password });
    return response.data;
  },

  // Products (apenas da loja do gerente)
  getStoreProducts: async (page = 1, limit = 10, search = '', category?: string) => {
    const response = await api.get('/manager/products', {
      params: { page, limit, search, category }
    });
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await api.get(`/manager/products/${id}`);
    return response.data;
  },

  createStoreProduct: async (productData: any) => {
    const response = await api.post('/manager/products', productData);
    return response.data;
  },

  updateStoreProduct: async (id: string, productData: any) => {
    const response = await api.put(`/manager/products/${id}`, productData);
    return response.data;
  },

  deleteStoreProduct: async (id: string) => {
    const response = await api.delete(`/manager/products/${id}`);
    return response.data;
  },

  // Reports (apenas da loja do gerente)
  getStoreSalesReport: async (startDate?: string, endDate?: string) => {
    const response = await api.get('/manager/reports/sales', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getStoreInventoryReport: async () => {
    const response = await api.get('/manager/reports/inventory');
    return response.data;
  },

  getStoreUserActivityReport: async (userId?: string, startDate?: string, endDate?: string) => {
    const response = await api.get('/manager/reports/user-activity', {
      params: { userId, startDate, endDate }
    });
    return response.data;
  },

  // Inventory
  getInventoryStatus: async () => {
    const response = await api.get('/manager/inventory/status');
    return response.data;
  },

  getInventoryAlerts: async () => {
    const response = await api.get('/manager/inventory/alerts');
    return response.data;
  },

  updateProductStock: async (productId: string, stock: number) => {
    const response = await api.put(`/manager/inventory/products/${productId}/stock`, { stock });
    return response.data;
  },

  adjustInventory: async (productId: string, adjustment: number, reason: string) => {
    const response = await api.post(`/manager/inventory/products/${productId}/adjust`, { 
      adjustment, reason 
    });
    return response.data;
  },

  getInventoryReport: async (category?: string) => {
    const response = await api.get('/manager/inventory/report', {
      params: { category }
    });
    return response.data;
  },

  getStockMovement: async (productId?: string, days = 30) => {
    const response = await api.get('/manager/inventory/movement', {
      params: { productId, days }
    });
    return response.data;
  },
};

export default api;
