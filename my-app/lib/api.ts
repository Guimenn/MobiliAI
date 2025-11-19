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
    // Silenciar erros 500 em endpoints opcionais (como checkFavorite)
    const isOptionalEndpoint = error.config?.url?.includes('/favorites/check');
    
    if (error.response?.status === 500 && isOptionalEndpoint) {
      // Para endpoints opcionais, criar uma resposta fake em vez de rejeitar
      // Isso evita que o erro apareça no console do navegador
      return Promise.resolve({
        data: { isFavorite: false },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
      });
    }
    
    // Tratar erros de rede (Network Error) em endpoints opcionais de favoritos
    const isNetworkError = !error.response && error.message === 'Network Error';
    const isFavoritesCountEndpoint = error.config?.url?.includes('/favorites/count');
    
    if (isNetworkError && isFavoritesCountEndpoint) {
      // Retornar 0 quando houver erro de rede no endpoint de contagem
      return Promise.resolve({
        data: 0,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
      });
    }
    
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

  loginWithGoogle: async (idToken: string) => {
    const response = await api.post('/auth/google', { idToken });
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

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetCode: async (email: string, code: string) => {
    const response = await api.post('/auth/verify-reset-code', { email, code });
    return response.data;
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', {
      email,
      code,
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
    customerId?: string;
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
    productFiles?: File[];
    prompt: string;
    outputFormat?: string;
  }) => {
    const formData = new FormData();
    // Primeira imagem é sempre o ambiente
    formData.append('images', data.file);
    // Adicionar imagens dos produtos se houver
    if (data.productFiles && data.productFiles.length > 0) {
      data.productFiles.forEach((productFile) => {
        formData.append('images', productFile);
      });
    }
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

// Dashboard API
export const dashboardAPI = {
  getStoreOverview: async (storeId: string) => {
    const response = await api.get(`/dashboard/store/${storeId}/overview`);
    return response.data;
  },
  getStoreSales: async (storeId: string) => {
    const response = await api.get(`/dashboard/store/${storeId}/sales`);
    return response.data;
  },
  getStoreAttendance: async (storeId: string) => {
    const response = await api.get(`/dashboard/store/${storeId}/attendance`);
    return response.data;
  },
  getEmployeePerformance: async (storeId: string) => {
    const response = await api.get(`/dashboard/store/${storeId}/employee-performance`);
    return response.data;
  },
  getRecentActivity: async (storeId: string) => {
    const response = await api.get(`/dashboard/store/${storeId}/recent-activity`);
    return response.data;
  }
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await api.get('/admin/dashboard/summary');
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/admin/notifications');
    return response.data;
  },

  getAlerts: async () => {
    const response = await api.get('/admin/alerts');
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
    try {
      const response = await api.get('/admin/stats/top-products');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Backend indisponível, usando dados mock para topProducts');
      // Dados mock quando backend não está disponível
      return [
        { id: 1, name: 'Tinta Acrílica Branco', sales: 45, revenue: 2250 },
        { id: 2, name: 'Pincel Chato 2"', sales: 32, revenue: 640 },
        { id: 3, name: 'Rolo de Pintura', sales: 28, revenue: 420 },
        { id: 4, name: 'Massa Corrida', sales: 22, revenue: 550 }
      ];
    }
  },

  // Reports
  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },

  createReport: async (reportData: any) => {
    const response = await api.post('/admin/reports', reportData);
    return response.data;
  },

  generateDailyReport: async (date?: string) => {
    const url = date 
      ? `/admin/reports/generate-daily?date=${encodeURIComponent(date)}`
      : '/admin/reports/generate-daily';
    const response = await api.post(url);
    return response.data;
  },

  deleteReport: async (id: string) => {
    const response = await api.delete(`/admin/reports/${id}`);
    return response.data;
  },

  // Sales
  getSales: async () => {
    const response = await api.get('/admin/sales');
    return response.data;
  },

  // Stores
  getStores: async () => {
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

  getStoreSales: async (storeId: string) => {
    const response = await api.get(`/admin/stores/${storeId}/sales`);
    return response.data;
  },

  getStoreSalesStats: async (storeId: string) => {
    const response = await api.get(`/admin/stores/${storeId}/sales/stats`);
    return response.data;
  },

  // Products
  getProducts: async (page: number = 1, limit: number = 50, search?: string, category?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category })
    });
    const response = await api.get(`/admin/products?${params.toString()}`);
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await api.get(`/admin/products/${id}`);
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

  // Users
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

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
    // Validação dos campos obrigatórios antes de enviar
    if (!userData.password || !userData.role) {
      const missingFields = [];
      if (!userData.password) missingFields.push('password');
      if (!userData.role) missingFields.push('role');
      
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}. Por favor, preencha todos os campos obrigatórios antes de criar o usuário.`);
    }

    // Validar role
    const validRoles = ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'CUSTOMER', 'EMPLOYEE'];
    if (!validRoles.includes(userData.role)) {
      throw new Error(`Role inválido: ${userData.role}. Role deve ser um dos seguintes valores: ${validRoles.join(', ')}`);
    }

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

  // Customers
  getCustomers: async (page = 1, limit = 10, search = '') => {
    const response = await api.get('/admin/customers', {
      params: { page, limit, search }
    });
    return response.data;
  },

  getCustomerById: async (id: string) => {
    const response = await api.get(`/admin/customers/${id}`);
    return response.data;
  },

  getCustomerByCpf: async (cpf: string) => {
    // Remove caracteres não numéricos e garante que seja apenas números
    const cleanCpf = cpf.replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11) {
      throw new Error('CPF inválido. Deve conter 11 dígitos.');
    }
    // Encode o CPF para a URL
    const encodedCpf = encodeURIComponent(cleanCpf);
    const response = await api.get(`/admin/customers/cpf/${encodedCpf}`);
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

  // Employees
  createEmployee: async (employeeData: any) => {
    const response = await api.post('/admin/employees', employeeData);
    return response.data;
  },

  updateEmployee: async (employeeId: string, employeeData: any) => {
    const response = await api.put(`/admin/employees/${employeeId}`, employeeData);
    return response.data;
  },

  deleteEmployee: async (employeeId: string) => {
    const response = await api.delete(`/admin/employees/${employeeId}`);
    return response.data;
  },

  getStoreEmployees: async (storeId: string) => {
    const response = await api.get(`/admin/stores/${storeId}/employees`);
    return response.data;
  },

  // Estoque por loja
  getStoreInventory: async (storeId: string) => {
    const response = await api.get(`/admin/stores/${storeId}/inventory`);
    return response.data;
  },

  updateStoreInventory: async (storeId: string, productId: string, inventoryData: {
    quantity?: number;
    minStock?: number;
    maxStock?: number;
    location?: string;
    notes?: string;
  }) => {
    const response = await api.put(`/admin/stores/${storeId}/inventory/${productId}`, inventoryData);
    return response.data;
  },

  addProductToStore: async (storeId: string, productId: string, initialQuantity: number = 0, minStock: number = 0) => {
    const response = await api.post(`/admin/stores/${storeId}/inventory/${productId}`, {
      initialQuantity,
      minStock
    });
    return response.data;
  },

  removeProductFromStore: async (storeId: string, productId: string) => {
    const response = await api.delete(`/admin/stores/${storeId}/inventory/${productId}`);
    return response.data;
  },

  getAvailableProductsForStore: async (storeId: string, search?: string) => {
    const url = search
      ? `/admin/stores/${storeId}/inventory/available-products?search=${encodeURIComponent(search)}`
      : `/admin/stores/${storeId}/inventory/available-products`;
    const response = await api.get(url);
    return response.data;
  },

  getGlobalProductsForCatalog: async (storeId: string, search?: string, page = 1, limit = 50) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (search) {
      params.append('search', search);
    }
    const response = await api.get(`/admin/stores/${storeId}/catalog/global-products?${params.toString()}`);
    return response.data;
  },

  addProductToStoreCatalog: async (storeId: string, productId: string) => {
    const response = await api.post(`/admin/stores/${storeId}/catalog/${productId}`);
    return response.data;
  },

  // Coupons
  getCoupons: async (storeId?: string) => {
    const response = await api.get('/coupons', {
      params: storeId ? { storeId } : {},
    });
    return response.data;
  },

  createCoupon: async (couponData: any) => {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },

  updateCoupon: async (couponId: string, couponData: any) => {
    const response = await api.patch(`/coupons/${couponId}`, couponData);
    return response.data;
  },

  deleteCoupon: async (couponId: string) => {
    const response = await api.delete(`/coupons/${couponId}`);
    return response.data;
  },

  getCoupon: async (couponId: string) => {
    const response = await api.get(`/coupons/${couponId}`);
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

  // Online Orders (apenas da loja do gerente)
  getStoreOnlineOrders: async (page: number = 1, limit: number = 50, status?: string) => {
    const params: any = { page, limit };
    if (status) params.status = status;
    const response = await api.get('/manager/orders-online', { params });
    return response.data;
  },

  getStoreOnlineOrderById: async (orderId: string) => {
    const response = await api.get(`/manager/orders-online/${orderId}`);
    return response.data;
  },

  updateStoreOnlineOrderStatus: async (orderId: string, status: string, trackingCode?: string) => {
    const response = await api.put(`/manager/orders-online/${orderId}/status`, {
      status,
      trackingCode
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

// Customer API - Favoritos
export const customerAPI = {
  // Perfil
  getProfile: async () => {
    const response = await api.get('/customer/profile');
    return response.data;
  },

  // Favoritos
  getFavorites: async (page = 1, limit = 12) => {
    const response = await api.get('/customer/favorites', {
      params: { page, limit }
    });
    return response.data;
  },

  addToFavorites: async (productId: string) => {
    const response = await api.post('/customer/favorites/add', { productId });
    return response.data;
  },

  removeFromFavorites: async (productId: string) => {
    const response = await api.delete('/customer/favorites/remove', {
      data: { productId }
    });
    return response.data;
  },

  checkFavorite: async (productId: string) => {
    // O interceptor já trata erros 500 e retorna { isFavorite: false }
    const response = await api.get(`/customer/favorites/check/${productId}`);
    return response.data;
  },

  getFavoritesCount: async () => {
    try {
      const response = await api.get('/customer/favorites/count');
      return response.data;
    } catch (error: any) {
      // Se for erro de rede ou o backend não estiver disponível, retornar 0
      if (!error.response || error.message === 'Network Error') {
        console.warn('⚠️ Backend indisponível para contagem de favoritos, retornando 0');
        return 0;
      }
      // Para outros erros, relançar o erro
      throw error;
    }
  },

  // Carrinho
  getCart: async () => {
    const response = await api.get('/customer/cart');
    return response.data;
  },

  addToCart: async (productId: string, quantity = 1) => {
    const response = await api.post('/customer/cart/add', { productId, quantity });
    return response.data;
  },

  updateCartItem: async (cartItemId: string, quantity: number) => {
    const response = await api.put(`/customer/cart/items/${cartItemId}`, { quantity });
    return response.data;
  },

  removeFromCart: async (cartItemId: string) => {
    const response = await api.delete(`/customer/cart/items/${cartItemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/customer/cart/clear');
    return response.data;
  },

  // Pedidos
  getOrders: async (page = 1, limit = 10, status?: string) => {
    const params: any = { page, limit };
    if (status) {
      params.status = status;
    }
    const response = await api.get('/customer/orders', {
      params
    });
    return response.data;
  },

  getOrderById: async (orderId: string) => {
    const response = await api.get(`/customer/orders/${orderId}`);
    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await api.put(`/customer/orders/${orderId}/cancel`);
    return response.data;
  },

  // Checkout
  validateCoupon: async (code: string, totalAmount: number, productId?: string, categoryId?: string, storeId?: string, shippingCost?: number) => {
    console.log('📤 Enviando validação de cupom para API:', {
      code,
      totalAmount,
      productId,
      categoryId,
      storeId,
      shippingCost,
    });
    const response = await api.post('/coupons/validate', {
      code,
      totalAmount,
      productId,
      categoryId,
      storeId,
      shippingCost,
    });
    console.log('📥 Resposta da validação:', response.data);
    return response.data;
  },

  checkout: async (checkoutData: {
    storeId: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingZipCode?: string;
    shippingPhone?: string;
    shippingCost?: number;
    insuranceCost?: number;
    tax?: number;
    discount?: number;
    couponCode?: string;
    notes?: string;
  }) => {
    const response = await api.post('/customer/cart/checkout', checkoutData);
    return response.data;
  },

  // Pagamento PIX
  createPixPayment: async (saleId: string, customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
  }) => {
    const response = await api.post('/payment/pix/create', {
      saleId,
      customerInfo,
    });
    return response.data;
  },

  checkPixPaymentStatus: async (saleId: string) => {
    const response = await api.get(`/payment/pix/status/${saleId}`);
    return response.data;
  },

  simulatePixPayment: async (saleId: string) => {
    const response = await api.post('/payment/pix/simulate', { saleId });
    return response.data;
  },

  // Pagamento Cartão (Checkout AbacatePay)
  createCardPayment: async (
    saleId: string,
    data?: {
      customerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        cpf?: string;
      };
      installments?: number;
    },
  ) => {
    const payload: Record<string, any> = { saleId };
    if (data?.customerInfo) {
      payload.customerInfo = data.customerInfo;
    }
    if (data?.installments) {
      payload.installments = data.installments;
    }
    const response = await api.post('/payment/card/create', payload);
    return response.data;
  },

  // Pagamento Stripe
  createStripePaymentIntent: async (
    saleId: string,
    customerInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      cpf?: string;
    }
  ) => {
    const response = await api.post('/payment/stripe/create-intent', {
      saleId,
      customerInfo,
    });
    return response.data;
  },

  confirmStripePayment: async (paymentIntentId: string) => {
    const response = await api.post('/payment/stripe/confirm', {
      paymentIntentId,
    });
    return response.data;
  },

  checkStripePaymentStatus: async (paymentIntentId: string) => {
    const response = await api.get(`/payment/stripe/status/${paymentIntentId}`);
    return response.data;
  },

  // Avaliações
  createReview: async (productId: string, rating: number, title?: string, comment?: string, saleId?: string) => {
    const response = await api.post('/customer/reviews', {
      productId,
      rating,
      title,
      comment,
      saleId
    });
    return response.data;
  },

  updateReview: async (reviewId: string, rating: number, title?: string, comment?: string) => {
    const response = await api.put(`/customer/reviews/${reviewId}`, {
      rating,
      title,
      comment
    });
    return response.data;
  },

  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/customer/reviews/${reviewId}`);
    return response.data;
  },

  getMyReviews: async (page = 1, limit = 10) => {
    const response = await api.get('/customer/reviews/my', {
      params: { page, limit }
    });
    return response.data;
  },

  getProductReviews: async (productId: string, page = 1, limit = 10) => {
    const response = await api.get(`/customer/reviews/product/${productId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  getReviewableProducts: async () => {
    const response = await api.get('/customer/reviews/reviewable');
    return response.data;
  },

  // Perfil
  updateProfile: async (updateData: {
    name?: string;
    phone?: string;
    cpf?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    avatarUrl?: string;
  }) => {
    const response = await api.put('/customer/profile', updateData);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/customer/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Endereços de Entrega
  getShippingAddresses: async () => {
    const response = await api.get('/customer/shipping-addresses');
    return response.data;
  },

  getShippingAddressById: async (addressId: string) => {
    const response = await api.get(`/customer/shipping-addresses/${addressId}`);
    return response.data;
  },

  createShippingAddress: async (addressData: {
    name: string;
    recipientName: string;
    phone: string;
    cpf?: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault?: boolean;
  }) => {
    const response = await api.post('/customer/shipping-addresses', addressData);
    return response.data;
  },

  updateShippingAddress: async (addressId: string, updateData: {
    name?: string;
    recipientName?: string;
    phone?: string;
    cpf?: string;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    isDefault?: boolean;
  }) => {
    const response = await api.put(`/customer/shipping-addresses/${addressId}`, updateData);
    return response.data;
  },

  deleteShippingAddress: async (addressId: string) => {
    const response = await api.delete(`/customer/shipping-addresses/${addressId}`);
    return response.data;
  },

  setDefaultShippingAddress: async (addressId: string) => {
    const response = await api.put(`/customer/shipping-addresses/${addressId}/default`);
    return response.data;
  }
};

// Time Clock API
export const timeClockAPI = {
  getHistory: async (employeeId: string, startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(`/time-clock/history/${employeeId}`, { params });
    return response.data;
  },

  clockIn: async (data: {
    employeeId: string;
    photo?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    notes?: string;
  }) => {
    const response = await api.post('/time-clock/clock-in', data);
    return response.data;
  },

  clockOut: async (data: {
    employeeId: string;
    photo?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    notes?: string;
  }) => {
    const response = await api.post('/time-clock/clock-out', data);
    return response.data;
  },

  register: async (data: {
    employeeId: string;
    photo?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    notes?: string;
  }) => {
    const response = await api.post('/time-clock/register', data);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (page = 1, limit = 20) => {
    const response = await api.get('/notifications', {
      params: { page, limit }
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  delete: async (notificationId: string) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

// Employee API
export const employeeAPI = {
  // Online Orders (apenas da loja do funcionário)
  getStoreOnlineOrders: async (page: number = 1, limit: number = 50, status?: string) => {
    const params: any = { page, limit };
    if (status) params.status = status;
    const response = await api.get('/employee/orders-online', { params });
    return response.data;
  },

  getStoreOnlineOrderById: async (orderId: string) => {
    const response = await api.get(`/employee/orders-online/${orderId}`);
    return response.data;
  },

  updateStoreOnlineOrderStatus: async (orderId: string, status: string, trackingCode?: string) => {
    const response = await api.put(`/employee/orders-online/${orderId}/status`, {
      status,
      trackingCode
    });
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  // Pagamento PIX
  createPixPayment: async (saleId: string, customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
  }) => {
    const response = await api.post('/payment/pix/create', {
      saleId,
      customerInfo,
    });
    return response.data;
  },

  checkPixPaymentStatus: async (saleId: string) => {
    const response = await api.get(`/payment/pix/status/${saleId}`);
    return response.data;
  },

  simulatePixPayment: async (saleId: string) => {
    const response = await api.post('/payment/pix/simulate', { saleId });
    return response.data;
  },

  // Pagamento Cartão (Checkout AbacatePay)
  createCardPayment: async (
    saleId: string,
    data?: {
      customerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        cpf?: string;
      };
      installments?: number;
    },
  ) => {
    const payload: Record<string, any> = { saleId };
    if (data?.customerInfo) {
      payload.customerInfo = data.customerInfo;
    }
    if (data?.installments) {
      payload.installments = data.installments;
    }
    const response = await api.post('/payment/card/create', payload);
    return response.data;
  },

  // Pagamento Stripe
  createStripePaymentIntent: async (
    saleId: string,
    customerInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      cpf?: string;
    }
  ) => {
    const response = await api.post('/payment/stripe/create-intent', {
      saleId,
      customerInfo,
    });
    return response.data;
  },

  confirmStripePayment: async (paymentIntentId: string) => {
    const response = await api.post('/payment/stripe/confirm', {
      paymentIntentId,
    });
    return response.data;
  },

  checkStripePaymentStatus: async (paymentIntentId: string) => {
    const response = await api.get(`/payment/stripe/status/${paymentIntentId}`);
    return response.data;
  },
};

// Financial API
export const financialAPI = {
  // Cash Flow
  createCashFlow: async (cashFlowData: {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    category?: string;
    date?: string;
  }) => {
    const response = await api.post('/financial/cash-flow', cashFlowData);
    return response.data;
  },

  getCashFlow: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/financial/cash-flow', { params });
    return response.data;
  },

  getCashFlowReport: async (startDate: string, endDate: string) => {
    const response = await api.get('/financial/cash-flow/report', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Cash Expenses
  createCashExpense: async (expenseData: {
    amount: number;
    description: string;
    category?: string;
    date?: string;
  }) => {
    const response = await api.post('/financial/expenses', expenseData);
    return response.data;
  },

  getCashExpenses: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/financial/expenses', { params });
    return response.data;
  },
};

export default api;
