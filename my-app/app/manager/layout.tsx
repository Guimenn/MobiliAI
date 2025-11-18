'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { 
  Package, 
  ShoppingCart,
  Clock, 
  LogOut, 
  Menu,
  User,
  Home,
  Receipt,
  Store,
  BarChart3,
  Users,
  Wallet,
  Monitor,
  ArrowRight,
} from 'lucide-react';

export default function ManagerLayout({
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
    
    // Verificar se o usuário é gerente (STORE_MANAGER)
    const isManager = user.role === 'STORE_MANAGER' || user.role === 'store_manager' ||
                      user.role === 'ADMIN' || user.role === 'admin';

    if (!isManager) {
      setIsRedirecting(true);
      router.push('/');
      return;
    }
  }, [isMounted, isAuthenticated, user?.role, token, router, isRedirecting]);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      const isManager = user.role === 'STORE_MANAGER' || user.role === 'store_manager' ||
                        user.role === 'ADMIN' || user.role === 'admin';
      
      if (isManager) {
        setIsRedirecting(false);
      }
    }
  }, [isAuthenticated, user, token]);

  const navigationSections = [
    {
      title: 'Visão geral',
      items: [
        {
          name: 'Dashboard',
          href: '/manager',
          icon: Home,
          current: pathname === '/manager',
        },
      ],
    },
    {
      title: 'Operações',
      items: [
        {
          name: 'PDV',
          href: '/manager/pdv',
          icon: ShoppingCart,
          current: pathname.startsWith('/manager/pdv'),
        },
        {
          name: 'Funcionários',
          href: '/manager/employees',
          icon: Users,
          current: pathname.startsWith('/manager/employees'),
        },
        {
          name: 'Estoque',
          href: '/manager/products',
          icon: Package,
          current: pathname.startsWith('/manager/products'),
        },
      ],
    },
    {
      title: 'Financeiro',
      items: [
        {
          name: 'Fluxo de Caixa',
          href: '/manager/cashflow',
          icon: Wallet,
          current: pathname.startsWith('/manager/cashflow'),
        },
        {
          name: 'Relatórios',
          href: '/manager/reports',
          icon: BarChart3,
          current: pathname.startsWith('/manager/reports'),
        },
      ],
    },
  ];

  const currentNavigationItem = navigationSections
    .flatMap((section) => section.items)
    .find((item) => item.current);

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
    <div className="min-h-screen bg-muted/40 text-foreground">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-4">
            <div className="relative h-[54px] w-full flex items-center justify-center">
              <Image
                src="/logotipos/8.svg"
                alt="MobiliAI Logo"
                width={300}
                height={100}
                className="object-contain"
              />
            </div>
          </div>

          <div className="border-b border-sidebar-border px-6 py-5">
            <button
              onClick={() => router.push('/manager')}
              className="flex w-full items-center gap-3 rounded-2xl bg-muted/40 p-3 transition-colors hover:bg-muted/60"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#3e2626] text-primary-foreground">
                  {user?.name?.charAt(0)?.toUpperCase() || 'G'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {user?.name || 'Gerente'}
                </p>
                <p className="text-xs text-muted-foreground">Gerente de Loja</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.current;

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          router.push(item.href);
                          setSidebarOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-[#3e2626] text-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-sidebar-border px-4 py-5">
            <Button
              variant="ghost"
              className="flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/70"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen((prev) => !prev)}
                aria-label="Abrir menu lateral"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Painel gerente
                </p>
                <h1 className="text-xl font-semibold text-foreground">
                  {currentNavigationItem?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/manager')}
                className="hidden items-center gap-3 rounded-2xl border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50 sm:flex"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#3e2626] text-primary-foreground">
                    {user?.name?.charAt(0)?.toUpperCase() || 'G'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user?.name || 'Gerente'}
                  </p>
                  <p className="text-xs text-muted-foreground">Gerente de Loja</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`${pathname.startsWith('/manager/pdv') ? 'p-0 bg-white overflow-hidden h-screen' : 'p-6'}`}>
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

