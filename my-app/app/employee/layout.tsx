'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { useProductsHeader } from '@/components/products-header-context';
import { ProductsHeaderProvider } from '@/components/products-header-context';
import { 
  Package, 
  ShoppingCart,
  Clock, 
  LogOut, 
  Menu,
  User,
  Home,
  Sparkles,
  Search,
  Grid3x3,
  List,
  Receipt,
  Monitor,
} from 'lucide-react';

function ProductsHeaderComponent({ 
  pathname, 
  sidebarOpen, 
  setSidebarOpen, 
  user, 
  router 
}: { 
  pathname: string; 
  sidebarOpen: boolean; 
  setSidebarOpen: (open: boolean) => void; 
  user: any; 
  router: any;
}) {
  const isProductsPage = pathname.startsWith('/employee/products');
  const { searchTerm, setSearchTerm, viewMode, setViewMode } = useProductsHeader();

  if (!isProductsPage) {
    return (
      <header className="bg-[#3e2626] border-b border-[#3e2626]/20 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-3 text-white hover:bg-white/20"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {pathname.startsWith('/employee/pdv') ? 'Ponto de Venda' : pathname === '/employee/sales' ? 'Vendas' : pathname === '/employee/timeclock' ? 'Ponto' : 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/employee/profile')}
              className="hidden md:flex items-center space-x-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 cursor-pointer"
            >
              <Avatar className="h-10 w-10 ring-2 ring-white/30 flex-shrink-0">
                <AvatarImage 
                  src={user?.avatarUrl || ''} 
                  alt={user?.name || 'Usuário'}
                  className="object-cover"
                />
                <AvatarFallback className="bg-white/30 text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'F'}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-white/80">Funcionário</p>
              </div>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] border-b border-[#3e2626]/20 sticky top-0 z-30 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden mr-3 text-white hover:bg-white/20"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Produtos</h1>
            <p className="text-sm text-white/90">Gerencie o catálogo de produtos da loja</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 md:justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 bg-white border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
            />
          </div>
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#3e2626] shadow-md'
                  : 'text-white hover:bg-white/20'
              }`}
              title="Visualização em Grid"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#3e2626] shadow-md'
                  : 'text-white hover:bg-white/20'
              }`}
              title="Visualização em Lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => router.push('/employee/profile')}
            className="hidden md:flex items-center space-x-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 cursor-pointer ml-4"
          >
            <Avatar className="h-10 w-10 ring-2 ring-white/30 flex-shrink-0">
              <AvatarImage 
                src={user?.avatarUrl || ''} 
                alt={user?.name || 'Usuário'}
                className="object-cover"
              />
              <AvatarFallback className="bg-white/30 text-white font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'F'}
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-white/80">Funcionário</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default function EmployeeLayout({
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
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
      const timeStr = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      setCurrentDate(dateStr);
      setCurrentTime(timeStr);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000); // Atualizar a cada segundo

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Verificar autenticação e role
  useEffect(() => {
    if (!isMounted || isRedirecting) return;
    
    if (!isAuthenticated || !user || !token) {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }
    
    // Verificar se o usuário é funcionário (EMPLOYEE ou CASHIER)
    const isEmployee = user.role === 'EMPLOYEE' || user.role === 'employee' || 
                       user.role === 'CASHIER' || user.role === 'cashier' ||
                       user.role === 'STORE_MANAGER' || user.role === 'store_manager' ||
                       user.role === 'ADMIN' || user.role === 'admin';

    if (!isEmployee) {
      setIsRedirecting(true);
      router.push('/');
      return;
    }
  }, [isMounted, isAuthenticated, user?.role, token, router, isRedirecting]);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      const isEmployee = user.role === 'EMPLOYEE' || user.role === 'employee' || 
                         user.role === 'CASHIER' || user.role === 'cashier' ||
                         user.role === 'STORE_MANAGER' || user.role === 'store_manager' ||
                         user.role === 'ADMIN' || user.role === 'admin';
      
      if (isEmployee) {
        setIsRedirecting(false);
      }
    }
  }, [isAuthenticated, user, token]);

  // Log para debug
  useEffect(() => {
    if (user) {
      console.log('👤 Usuário logado:', {
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        store: user.store
      });
    }
  }, [user]);

  const navigation = [
    { name: 'Início', href: '/employee', icon: Home, current: pathname === '/employee' },
    { name: 'PDV', href: '/employee/pdv', icon: ShoppingCart, current: pathname.startsWith('/employee/pdv') },
    { name: 'Produtos', href: '/employee/products', icon: Package, current: pathname.startsWith('/employee/products') },
    { name: 'Vendas', href: '/employee/sales', icon: Receipt, current: pathname.startsWith('/employee/sales') },
    { name: 'Ponto', href: '/employee/timeclock', icon: Clock, current: pathname.startsWith('/employee/timeclock') },
  ];

  const handleLogout = () => {
    const { logout } = useAppStore.getState();
    logout();
    router.push('/login');
  };

  if (!isMounted || isRedirecting || !isAuthenticated || !user || !token) {
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
    <ProductsHeaderProvider>
      <div className="min-h-screen bg-white">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl border-r border-gray-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-8 border-b border-[#8B4513]/30 bg-[#3e2626]">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 relative flex items-center justify-center bg-white rounded-xl p-2 border border-white/30 shadow-lg">
                <Image
                  src="/logo.png"
                  alt="MobiliAI Logo"
                  width={56}
                  height={56}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MobiliAI</h1>
                <p className="text-xs text-white/80 font-medium">Painel Funcionário</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      item.current 
                        ? 'bg-[#3e2626] text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
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
              className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600"
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
        {pathname === '/employee' ? (
          <div className="bg-[#3e2626] relative overflow-hidden">
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 30px 30px, rgba(255,255,255,0.1) 2px, transparent 2px)`,
                backgroundSize: '60px 60px'
              }}></div>
            </div>
            {/* Content */}
            <div className="relative z-10 px-6 py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden mb-2 text-white hover:bg-white/20"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="text-3xl font-bold text-white">Bem-vindo, {user?.name || 'Funcionário'}!</h1>
                  </div>
                  <p className="text-sm text-white/90">{currentDate}</p>
                  <p className="text-xs text-white/80">{currentTime}</p>
                </div>
                <button
                  onClick={() => router.push('/employee/profile')}
                  className="hidden lg:flex items-center space-x-3 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all duration-300 cursor-pointer"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-white/30 flex-shrink-0">
                    <AvatarImage 
                      src={user?.avatarUrl || ''} 
                      alt={user?.name || 'Usuário'}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-white/30 text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'F'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-white/80">Funcionário</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          pathname === '/employee/profile' ? null : (
            <ProductsHeaderComponent 
              pathname={pathname}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              user={user}
              router={router}
            />
          )
        )}

        {/* Page Content */}
        <main className={`${pathname === '/employee' ? 'p-8 bg-white' : pathname.startsWith('/employee/pdv') ? 'p-0 bg-white overflow-hidden' : 'p-8 bg-gray-50'} ${pathname.startsWith('/employee/pdv') ? 'h-screen' : 'min-h-screen'}`}>
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      </div>
    </ProductsHeaderProvider>
  )
}
