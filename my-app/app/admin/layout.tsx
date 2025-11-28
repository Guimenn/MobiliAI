'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { notificationsAPI } from '@/lib/api';
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
  Truck,
  Check,
  ArrowRight,
  Ticket,
} from 'lucide-react';

type UserNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string | null;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token } = useAppStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const [notificationPosition, setNotificationPosition] = useState<{ top: number; right: number } | null>(null);

  const notificationDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted || isRedirecting) {
      return;
    }

    if (!isAuthenticated || !user || !token) {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }

    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      setIsRedirecting(true);
      if (userRole === 'STORE_MANAGER') {
        router.push('/manager');
      } else {
        router.push('/');
      }
    }
  }, [isMounted, isAuthenticated, user, token, router, isRedirecting]);

  useEffect(() => {
    if (isAuthenticated && user && token && user.role?.toUpperCase() === 'ADMIN') {
      setIsRedirecting(false);
    }
  }, [isAuthenticated, user, token]);

  const formatTimeAgo = useCallback(
    (date: string) => {
      const now = new Date();
      const target = new Date(date);
      const diff = now.getTime() - target.getTime();

      const seconds = Math.floor(diff / 1000);
      if (seconds < 60) return 'Agora mesmo';

      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} min atrás`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h atrás`;

      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d atrás`;

      const weeks = Math.floor(days / 7);
      if (weeks < 4) return `${weeks} sem atrás`;

      return notificationDateFormatter.format(target);
    },
    [notificationDateFormatter]
  );

  const loadNotifications = useCallback(
    async (silent = false) => {
      // Permitir notificações para ADMIN, STORE_MANAGER e EMPLOYEE
      const allowedRoles = ['ADMIN', 'STORE_MANAGER', 'EMPLOYEE', 'CASHIER'];
      const userRole = user?.role?.toUpperCase();
      
      if (!isAuthenticated || !user || !allowedRoles.includes(userRole || '')) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (!silent) {
        setNotificationsLoading(true);
      }

      try {
        setNotificationsError(null);
        const [listResponse, unreadResponse] = await Promise.all([
          notificationsAPI.getAll(1, 20),
          notificationsAPI.getUnreadCount(),
        ]);

        const formattedNotifications: UserNotification[] =
          listResponse?.notifications?.map((item: any) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            createdAt: item.createdAt,
            isRead: item.isRead,
            actionUrl: item.actionUrl ?? null,
          })) ?? [];

        setNotifications(formattedNotifications);
        const unreadValue =
          typeof unreadResponse === 'number'
            ? unreadResponse
            : (unreadResponse?.count as number | undefined) ?? 0;
        setUnreadCount(unreadValue);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        setNotificationsError('Não foi possível carregar as notificações.');
        if (!silent) {
          setNotifications([]);
        }
      } finally {
        if (!silent) {
          setNotificationsLoading(false);
        }
      }
    },
    [isAuthenticated, user]
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    // Permitir notificações para ADMIN, STORE_MANAGER e EMPLOYEE
    const allowedRoles = ['ADMIN', 'STORE_MANAGER', 'EMPLOYEE', 'CASHIER'];
    const userRole = user?.role?.toUpperCase();
    
    if (!isAuthenticated || !user || !allowedRoles.includes(userRole || '')) {
      return;
    }

    const interval = setInterval(() => {
      void loadNotifications(true);
    }, 30000); // Atualizar a cada 30 segundos para ser mais responsivo

    return () => clearInterval(interval);
  }, [isAuthenticated, user, loadNotifications]);

  // Atualizar posição do dropdown quando necessário
  useEffect(() => {
    if (notificationsOpen && notificationsButtonRef.current) {
      const updatePosition = () => {
        const rect = notificationsButtonRef.current?.getBoundingClientRect();
        if (rect) {
          setNotificationPosition({
            top: rect.bottom + 12,
            right: window.innerWidth - rect.right
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setNotificationPosition(null);
    }
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node) &&
        notificationsButtonRef.current &&
        !notificationsButtonRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  const navigationSections = useMemo(
    () => [
      {
        title: 'Visão geral',
        items: [
          {
            name: 'Dashboard',
            href: '/admin',
            icon: Building2,
            current: pathname === '/admin',
          },
        ],
      },
      {
        title: 'Operações',
        items: [
          {
            name: 'Lojas',
            href: '/admin/stores',
            icon: Store,
            current: pathname.startsWith('/admin/stores'),
          },
          {
            name: 'Usuários',
            href: '/admin/users',
            icon: Users,
            current: pathname.startsWith('/admin/users'),
          },
          {
            name: 'Produtos',
            href: '/admin/products',
            icon: Package,
            current: pathname.startsWith('/admin/products'),
          },
          {
            name: 'Vendas',
            href: '/admin/sales',
            icon: ShoppingCart,
            current: pathname.startsWith('/admin/sales'),
          },
          {
            name: 'Pedidos Online',
            href: '/admin/orders-online',
            icon: Truck,
            current: pathname.startsWith('/admin/orders-online'),
          },
          {
            name: 'Cupons',
            href: '/admin/coupons',
            icon: Ticket,
            current: pathname.startsWith('/admin/coupons'),
          },
        ],
      },
      {
        title: 'Relacionamento',
        items: [
          {
            name: 'Clientes',
            href: '/admin/customers',
            icon: User,
            current: pathname.startsWith('/admin/customers'),
          },
        ],
      },
      {
        title: 'Inteligência',
        items: [
          {
            name: 'Relatórios',
            href: '/admin/reports',
            icon: BarChart3,
            current: pathname.startsWith('/admin/reports'),
          },
          {
            name: 'Configurações',
            href: '/admin/settings',
            icon: Settings,
            current: pathname.startsWith('/admin/settings'),
          },
        ],
      },
    ],
    [pathname]
  );

  const currentNavigationItem = useMemo(
    () =>
      navigationSections
        .flatMap((section) => section.items)
        .find((item) => item.current),
    [navigationSections]
  );

  const handleLogout = useCallback(() => {
    const { logout } = useAppStore.getState();
    logout();
    router.push('/login');
  }, [router]);

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      setSidebarOpen(false);
    },
    [router]
  );

  const handleToggleNotifications = useCallback(() => {
    setNotificationsOpen((prev) => {
      const next = !prev;
      if (!prev) {
        void loadNotifications(false);
        // Calcular posição do dropdown quando abrir
        if (notificationsButtonRef.current) {
          const rect = notificationsButtonRef.current.getBoundingClientRect();
          setNotificationPosition({
            top: rect.bottom + 12,
            right: window.innerWidth - rect.right
          });
        }
      } else {
        setNotificationPosition(null);
      }
      return next;
    });
  }, [loadNotifications]);

  const handleMarkNotificationAsRead = useCallback(
    async (notificationId: string, actionUrl?: string | null) => {
      try {
        await notificationsAPI.markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ? { ...notification, isRead: true } : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        if (actionUrl) {
          router.push(actionUrl);
          setNotificationsOpen(false);
        }
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    },
    [router]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, []);

  const userRoleLabel = useMemo(() => {
    switch (user?.role?.toUpperCase()) {
      case 'ADMIN':
        return 'Administrador';
      case 'STORE_MANAGER':
        return 'Gerente de Loja';
      case 'CASHIER':
        return 'Caixa';
      case 'EMPLOYEE':
        return 'Funcionário';
      default:
        return 'Usuário';
    }
  }, [user?.role]);

  const hasUnreadNotifications = unreadCount > 0;

  if (
    !isMounted ||
    isRedirecting ||
    !isAuthenticated ||
    !user ||
    !token ||
    user.role?.toUpperCase() !== 'ADMIN'
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary/30 border-b-primary" />
          <p className="text-sm text-muted-foreground">
            {isRedirecting ? 'Redirecionando...' : 'Carregando painel...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
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
              onClick={() => router.push('/admin/profile')}
              className="flex w-full items-center gap-3 rounded-2xl bg-muted/40 p-3 transition-colors hover:bg-muted/60"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#3e2626] text-primary-foreground">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {user?.name || 'Administrador'}
                </p>
                <p className="text-xs text-muted-foreground">{userRoleLabel}</p>
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
                        onClick={() => handleNavigate(item.href)}
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

      <div className="lg:ml-64">
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
                  Painel administrativo
                </p>
                <h1 className="text-xl font-semibold text-foreground">
                  {currentNavigationItem?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" ref={notificationsRef}>
                <Button
                  ref={notificationsButtonRef}
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full"
                  onClick={handleToggleNotifications}
                  aria-label="Notificações"
                >
                  <Bell className="h-5 w-5" />
                  {hasUnreadNotifications && (
                    <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </Button>

                {notificationsOpen && isMounted && notificationPosition && createPortal(
                  <div 
                    className="fixed w-96 rounded-2xl border border-border bg-popover p-4 shadow-2xl"
                    style={{
                      top: `${notificationPosition.top}px`,
                      right: `${notificationPosition.right}px`,
                      zIndex: 99999,
                      position: 'fixed',
                    }}
                    ref={notificationsRef}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Notificações</p>
                        {unreadCount > 0 ? (
                          <p className="text-xs text-primary">{unreadCount} não lidas</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Atualizadas automaticamente a cada acesso
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => void loadNotifications()}
                        >
                          Recarregar
                        </Button>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:text-primary"
                            onClick={handleMarkAllAsRead}
                          >
                            Marcar tudo como lido
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                      {notificationsLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
                        </div>
                      ) : notificationsError ? (
                        <p className="text-sm text-destructive">{notificationsError}</p>
                      ) : notifications.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            Nenhuma notificação no momento.
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              handleMarkNotificationAsRead(
                                notification.id,
                                notification.actionUrl
                              )
                            }
                            className={`flex w-full items-start gap-3 rounded-xl border border-border/60 p-3 text-left transition hover:border-primary/40 hover:bg-muted/40 ${
                              notification.isRead ? 'bg-transparent' : 'bg-primary/5'
                            }`}
                          >
                            <span
                              className={`mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full ${
                                notification.isRead ? 'bg-muted-foreground/30' : 'bg-primary'
                              }`}
                            />
                            <div className="flex-1 space-y-1">
                              <p
                                className={`text-sm font-semibold ${
                                  notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="text-[11px] text-muted-foreground/80">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            {notification.isRead && (
                              <Check className="mt-1 h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>

              <button
                onClick={() => router.push('/admin/profile')}
                className="hidden items-center gap-3 rounded-2xl border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50 sm:flex"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#3e2626] text-primary-foreground">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user?.name || 'Administrador'}
                  </p>
                  <p className="text-xs text-muted-foreground">{userRoleLabel}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-6 overflow-x-hidden max-w-full">{children}</main>
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

