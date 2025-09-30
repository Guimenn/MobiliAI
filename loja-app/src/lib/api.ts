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
}

export const apiService = new ApiService();
