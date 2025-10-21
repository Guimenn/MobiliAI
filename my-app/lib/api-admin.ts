import { env } from './env';

const API_BASE_URL = env.API_URL;

// Helper para chamadas da API administrativa
export const adminAPI = {
  // Stores
  getStores: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/stores`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  createStore: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/admin/stores`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response;
  },

  getStoreStatus: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/stores/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  // Users
  getUsers: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  createUser: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response;
  },

  getUserRoles: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  // Products
  getProducts: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  createProduct: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response;
  },

  updateProduct: async (id: string, data: any) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar produto: ${response.statusText}`);
    }
    
    return response.json();
  },

  deleteProduct: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao excluir produto: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Sales
  getSales: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/sales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  createSale: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/admin/sales`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response;
  },

  // Financial
  getFinancialData: async (token: string, startDate: string, endDate: string) => {
    const response = await fetch(`${API_BASE_URL}/financial/consolidated-report?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  // Suppliers
  getSuppliers: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/suppliers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  createSupplier: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/admin/suppliers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response;
  },

  // Reports
  getReports: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/reports`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  getSalesReport: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/reports/sales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  },

  getFinancialReport: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/reports/financial`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response;
  }
};
