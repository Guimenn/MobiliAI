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
    // Não fazer logout automático em rotas de auth ou manager
    if (error.response?.status === 401 && 
        !error.config?.url?.includes('/auth/') &&
        !window.location.pathname.includes('/manager')) {
      useAppStore.getState().logout();
      window.location.href = '/login';
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

export default api;
