'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { notificationsAPI } from '@/lib/api';
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
  Bell,
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

  // Notificações (ícone no header, similar ao admin)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = async (silent = false) => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (!silent) {
      setNotificationsLoading(true);
    }

    try {
      const [listResponse, unreadResponse] = await Promise.all([
        notificationsAPI.getAll(1, 20),
        notificationsAPI.getUnreadCount(),
      ]);

      const list = Array.isArray(listResponse?.notifications)
        ? listResponse.notifications
        : [];
      setNotifications(list);

      const unreadValue =
        typeof unreadResponse === 'number'
          ? unreadResponse
          : (unreadResponse?.count as number | undefined) ?? 0;
      setUnreadCount(unreadValue);
    } catch (error) {
      console.error('Erro ao carregar notificações do gerente:', error);
    } finally {
      if (!silent) {
        setNotificationsLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Carregar notificações periodicamente
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    void loadNotifications();

    const interval = setInterval(() => {
      void loadNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!notificationsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

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
          name: 'Vendas da Loja',
          href: '/manager/sales',
          icon: Receipt,
          current: pathname.startsWith('/manager/sales'),
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
              onClick={() => router.push('/manager/profile')}
              className="flex w-full items-center gap-3 rounded-2xl bg-muted/40 p-3 transition-colors hover:bg-muted/60"
            >
              <Avatar className="h-10 w-10">
                {user?.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.name || 'Gerente'} />
                )}
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
              {/* Notificações - ícone ao lado do perfil */}
              <div className="relative hidden sm:block" ref={notificationsRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full"
                  onClick={() => setNotificationsOpen(prev => !prev)}
                  aria-label="Notificações"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </Button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-border bg-popover p-3 shadow-2xl z-50">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Notificações
                        </p>
                        {unreadCount > 0 ? (
                          <p className="text-xs text-primary">
                            {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Atualizadas automaticamente
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                      {notificationsLoading ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Carregando notificações...
                        </p>
                      ) : notifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Nenhuma notificação recente.
                        </p>
                      ) : (
                        notifications.map((notification: any) => (
                          <div
                            key={notification.id}
                            className="rounded-xl border border-border bg-background/80 p-3 text-xs text-foreground"
                          >
                            <p className="font-medium text-sm">
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="mt-1 text-muted-foreground">
                                {notification.message}
                              </p>
                            )}
                            {notification.createdAt && (
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleString(
                                  'pt-BR',
                                  {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push('/manager/profile')}
                className="hidden items-center gap-3 rounded-2xl border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50 sm:flex"
              >
                <Avatar className="h-8 w-8">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.name || 'Gerente'} />
                  )}
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

