'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { 
  Building2, 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  Bell,
  Search
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Aguardar hidratação completa antes de verificar autenticação
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Verificar autenticação e role
  useEffect(() => {
    if (!isMounted || isRedirecting) return;
    
    // Evitar redirecionamentos desnecessários
    if (!isAuthenticated || !user || !token) {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }
    
    // Verificar se o usuário é admin
    if (user.role !== 'ADMIN') {
      setIsRedirecting(true);
      // Redirecionar para o dashboard apropriado baseado no role
      if (user.role === 'STORE_MANAGER') {
        router.push('/manager');
      } else {
        router.push('/');
      }
      return;
    }
  }, [isMounted, isAuthenticated, user?.role, token, router, isRedirecting]);

  // Reset redirecting state when user changes
  useEffect(() => {
    if (isAuthenticated && user && token && user.role === 'ADMIN') {
      setIsRedirecting(false);
    }
  }, [isAuthenticated, user, token]);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Building2, current: pathname === '/admin' },
    { name: 'Lojas', href: '/admin/stores', icon: Store, current: pathname.startsWith('/admin/stores') },
    { name: 'Usuários', href: '/admin/users', icon: Users, current: pathname.startsWith('/admin/users') },
    { name: 'Produtos', href: '/admin/products', icon: Package, current: pathname.startsWith('/admin/products') },
    { name: 'Vendas', href: '/admin/sales', icon: ShoppingCart, current: pathname.startsWith('/admin/sales') },
    { name: 'Clientes', href: '/admin/customers', icon: User, current: pathname.startsWith('/admin/customers') },
    { name: 'Relatórios', href: '/admin/reports', icon: BarChart3, current: pathname.startsWith('/admin/reports') },
    { name: 'Configurações', href: '/admin/settings', icon: Settings, current: pathname.startsWith('/admin/settings') },
  ];

  const handleLogout = () => {
    // Usar o logout da store
    const { logout } = useAppStore.getState();
    logout();
    router.push('/login');
  };

  if (!isMounted || isRedirecting || !isAuthenticated || !user || !token || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRedirecting ? 'Redirecionando...' : 'Carregando...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="w-8 h-8 bg-[#3e2626] rounded-lg flex items-center justify-center mr-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">MobiliAI</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          
          {/* User Profile */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-[#3e2626] text-white">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Administrador'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      item.current 
                        ? 'bg-[#3e2626] text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4 border-t border-gray-200">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigation.find(item => item.current)?.name || 'Admin'}
                </h1>
                <p className="text-sm text-gray-600">Painel Administrativo</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                />
              </div>
              
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </Button>
              
              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
