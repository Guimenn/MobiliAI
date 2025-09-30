const API_BASE_URL = 'http://localhost:3001/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'customer';
  storeId?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
  brand?: string;
  color?: string;
  finish?: string;
  coverage?: string;
  rating?: number;
}

export interface ColorPalette {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  price: number;
  brand: string;
  finish: string;
  coverage: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: CartItem[];
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('loja-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Credenciais inválidas');
    }

    const data = await response.json();
    localStorage.setItem('loja-token', data.token);
    return data;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: 'customer';
  }): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/customer/public/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar conta');
    }

    const data = await response.json();
    localStorage.setItem('loja-token', data.token);
    return data;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/customer/products`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar produtos');
    }

    return response.json();
  }

  async searchProducts(query: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/customer/products/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }

    return response.json();
  }

  // Cart
  async addToCart(productId: string, quantity: number = 1): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customer/cart`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      throw new Error('Erro ao adicionar ao carrinho');
    }
  }

  async getCart(): Promise<CartItem[]> {
    const response = await fetch(`${API_BASE_URL}/customer/cart`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar carrinho');
    }

    return response.json();
  }

  async updateCartItem(itemId: string, quantity: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customer/cart/${itemId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar carrinho');
    }
  }

  async removeFromCart(itemId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customer/cart/${itemId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao remover do carrinho');
    }
  }

  // Sales (for cashier)
  async createSale(saleData: {
    items: CartItem[];
    paymentMethod: string;
    cashAmount?: number;
  }): Promise<Sale> {
    const response = await fetch(`${API_BASE_URL}/employee/sales`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      throw new Error('Erro ao finalizar venda');
    }

    return response.json();
  }

  // Daily Cash (for cashier)
  async openCash(initialAmount: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/employee/cash/open`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ initialAmount }),
    });

    if (!response.ok) {
      throw new Error('Erro ao abrir caixa');
    }
  }

  async closeCash(): Promise<{ totalSales: number; totalAmount: number }> {
    const response = await fetch(`${API_BASE_URL}/employee/cash/close`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao fechar caixa');
    }

    return response.json();
  }

  async getCashStatus(): Promise<{ isOpen: boolean; totalAmount: number }> {
    const response = await fetch(`${API_BASE_URL}/employee/cash/status`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar status do caixa');
    }

    return response.json();
  }

  // Inventory (for cashier)
  async getInventory(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/employee/inventory`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar estoque');
    }

    return response.json();
  }

  async updateStock(productId: string, newStock: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/employee/inventory/${productId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ stock: newStock }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar estoque');
    }
  }

  // AI Color Processing
  async processImageForColors(imageFile: File): Promise<{
    detectedColors: ColorPalette[];
    processedImage: string;
  }> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/ai/process-image`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': undefined, // Let browser set it for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao processar imagem');
    }

    return response.json();
  }

  async applyColorToImage(imageData: string, colorHex: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/ai/apply-color`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ imageData, colorHex }),
    });

    if (!response.ok) {
      throw new Error('Erro ao aplicar cor');
    }

    const data = await response.json();
    return data.processedImage;
  }

  // Color Palette
  async getColorPalette(): Promise<ColorPalette[]> {
    const response = await fetch(`${API_BASE_URL}/customer/colors`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar paleta de cores');
    }

    return response.json();
  }

  async searchColors(query: string): Promise<ColorPalette[]> {
    const response = await fetch(`${API_BASE_URL}/customer/colors/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar cores');
    }

    return response.json();
  }

  // Chatbot
  async sendMessage(message: string): Promise<{
    response: string;
    suggestions?: string[];
    products?: Product[];
  }> {
    const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem');
    }

    return response.json();
  }

  // Reports (for cashier)
  async getSalesReport(period: 'today' | 'week' | 'month' | 'quarter'): Promise<{
    totalSales: number;
    totalOrders: number;
    averageTicket: number;
    topProducts: Array<{
      id: string;
      name: string;
      quantity: number;
      revenue: number;
    }>;
    dailySales: Array<{
      date: string;
      sales: number;
      orders: number;
    }>;
    paymentMethods: Array<{
      method: string;
      count: number;
      amount: number;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/employee/reports/sales?period=${period}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar relatório');
    }

    return response.json();
  }

  async exportReport(period: string, format: 'pdf' | 'excel'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/employee/reports/export?period=${period}&format=${format}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao exportar relatório');
    }

    return response.blob();
  }

  // Customer Orders
  async createOrder(orderData: {
    items: CartItem[];
    paymentMethod: string;
    shippingAddress?: {
      street: string;
      number: string;
      complement: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
  }): Promise<{
    orderId: string;
    status: string;
    total: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/customer/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar pedido');
    }

    return response.json();
  }

  async getOrders(): Promise<Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
    items: CartItem[];
  }>> {
    const response = await fetch(`${API_BASE_URL}/customer/orders`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar pedidos');
    }

    return response.json();
  }

  // Store Settings (for cashier)
  async getStoreSettings(): Promise<{
    name: string;
    address: string;
    phone: string;
    email: string;
    workingHours: string;
    deliveryRadius: number;
    minOrderValue: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/employee/store/settings`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar configurações');
    }

    return response.json();
  }

  async updateStoreSettings(settings: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/employee/store/settings`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar configurações');
    }
  }
}

export const apiService = new ApiService();
