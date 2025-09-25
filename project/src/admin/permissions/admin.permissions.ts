export const ADMIN_PERMISSIONS = {
  // Usuários
  USERS: {
    VIEW: 'users:view',
    CREATE: 'users:create',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    CHANGE_PASSWORD: 'users:change_password',
    ASSIGN_ROLE: 'users:assign_role',
    ASSIGN_STORE: 'users:assign_store',
  },
  
  // Lojas
  STORES: {
    VIEW: 'stores:view',
    CREATE: 'stores:create',
    UPDATE: 'stores:update',
    DELETE: 'stores:delete',
    ACTIVATE: 'stores:activate',
    DEACTIVATE: 'stores:deactivate',
  },
  
  // Produtos
  PRODUCTS: {
    VIEW: 'products:view',
    CREATE: 'products:create',
    UPDATE: 'products:update',
    DELETE: 'products:delete',
    MANAGE_INVENTORY: 'products:manage_inventory',
    SET_FEATURED: 'products:set_featured',
    SET_CATEGORIES: 'products:set_categories',
  },
  
  // Vendas
  SALES: {
    VIEW_ALL: 'sales:view_all',
    VIEW_STORE: 'sales:view_store',
    CANCEL: 'sales:cancel',
    REFUND: 'sales:refund',
  },
  
  // Relatórios
  REPORTS: {
    VIEW_SALES: 'reports:view_sales',
    VIEW_INVENTORY: 'reports:view_inventory',
    VIEW_FINANCIAL: 'reports:view_financial',
    VIEW_USER_ACTIVITY: 'reports:view_user_activity',
    EXPORT_DATA: 'reports:export_data',
  },
  
  // Dashboard
  DASHBOARD: {
    VIEW_OVERVIEW: 'dashboard:view_overview',
    VIEW_STATS: 'dashboard:view_stats',
    VIEW_ANALYTICS: 'dashboard:view_analytics',
  },
  
  // Sistema
  SYSTEM: {
    MANAGE_SETTINGS: 'system:manage_settings',
    VIEW_LOGS: 'system:view_logs',
    MANAGE_BACKUPS: 'system:manage_backups',
    MANAGE_INTEGRATIONS: 'system:manage_integrations',
  }
};

export const ROLE_PERMISSIONS = {
  ADMIN: Object.values(ADMIN_PERMISSIONS).flat(),
  
  STORE_MANAGER: [
    ADMIN_PERMISSIONS.USERS.VIEW,
    ADMIN_PERMISSIONS.USERS.CREATE,
    ADMIN_PERMISSIONS.USERS.UPDATE,
    ADMIN_PERMISSIONS.PRODUCTS.VIEW,
    ADMIN_PERMISSIONS.PRODUCTS.CREATE,
    ADMIN_PERMISSIONS.PRODUCTS.UPDATE,
    ADMIN_PERMISSIONS.PRODUCTS.MANAGE_INVENTORY,
    ADMIN_PERMISSIONS.SALES.VIEW_STORE,
    ADMIN_PERMISSIONS.REPORTS.VIEW_SALES,
    ADMIN_PERMISSIONS.REPORTS.VIEW_INVENTORY,
    ADMIN_PERMISSIONS.DASHBOARD.VIEW_OVERVIEW,
  ],
  
  CASHIER: [
    ADMIN_PERMISSIONS.PRODUCTS.VIEW,
    ADMIN_PERMISSIONS.SALES.VIEW_STORE,
    ADMIN_PERMISSIONS.DASHBOARD.VIEW_OVERVIEW,
  ],
  
  CUSTOMER: []
};
