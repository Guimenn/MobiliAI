import { env } from './env';
import { useAppStore } from './store';

const API_BASE_URL = env.API_URL;

// Helper para chamadas da API administrativa
export const adminAPI = {
  // Stores
  getStores: async () => {
    const token = useAppStore.getState().token;
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar lojas: ${response.statusText}`);
    }
    
    return response.json();
  },

  getStoreById: async (storeId: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar loja: ${response.statusText}`);
    }
    
    return response.json();
  },

  createStore: async (data: any) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao criar loja: ${response.statusText}`);
    }
    
    return response.json();
  },

  updateStore: async (storeId: string, data: any) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar loja: ${response.statusText}`);
    }
    
    return response.json();
  },

  deleteStore: async (storeId: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao excluir loja: ${response.statusText}`);
    }
    
    return response.json();
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

  // Store Employees
  getStoreEmployees: async (storeId: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar funcionários: ${response.statusText}`);
    }
    
    return response.json();
  },

  createEmployee: async (data: any) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/employees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao criar funcionário: ${response.statusText}`);
    }
    
    return response.json();
  },

  promoteEmployee: async (employeeId: string, promotionData: { newPosition?: string; newSalary?: number }) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}/promote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(promotionData)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Erro ao promover funcionário: ${response.statusText}`);
    }
    
    return response.json();
  },

  updateEmployee: async (employeeId: string, data: any) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar funcionário: ${response.statusText}`);
    }
    
    return response.json();
  },

  deleteEmployee: async (employeeId: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao excluir funcionário: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Store Sales
  getStoreSales: async (storeId: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/sales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar vendas: ${response.statusText}`);
    }
    
    return response.json();
  },

  getStoreSalesStats: async (storeId: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/sales/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar estatísticas: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Store Analytics
  getStoreAnalytics: async (storeId: string, period: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/analytics?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar análises: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Store Reports
  getStoreReport: async (storeId: string, options: any) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const queryParams = new URLSearchParams(options).toString();
    const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/reports?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar relatório: ${response.statusText}`);
    }
    
    return response.json();
  },

  exportStoreReport: async (storeId: string, options: any) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/reports/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao exportar relatório: ${response.statusText}`);
    }
    
    return response.blob();
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
  getProducts: async (token?: string, page: number = 1, limit: number = 10, search?: string, category?: string) => {
    const tokenValue = token || localStorage.getItem('token');
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category })
    });
    
    const response = await fetch(`${API_BASE_URL}/admin/products?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${tokenValue}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar produtos: ${response.statusText}`);
    }
    
    return response.json();
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
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
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
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
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
  },

  // Online Orders
  getOnlineOrders: async (page: number = 1, limit: number = 50, status?: string, storeId?: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(storeId && { storeId })
    });
    
    const response = await fetch(`${API_BASE_URL}/admin/orders-online?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar pedidos online: ${response.statusText}`);
    }
    
    return response.json();
  },

  getOnlineOrderById: async (orderId: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/orders-online/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar pedido: ${response.statusText}`);
    }
    
    return response.json();
  },

  updateOrderStatus: async (orderId: string, status: string, trackingCode?: string) => {
    const token = useAppStore.getState().token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await fetch(`${API_BASE_URL}/admin/orders-online/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, trackingCode })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar status: ${response.statusText}`);
    }
    
    return response.json();
  }
};
