"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { customerAPI, notificationsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PromotionalSection from "@/components/PromotionalSection";
import Footer from "@/components/Footer";
import { 
    Search,
    ShoppingCart,
    Heart,
    User,
    Menu,
    X,
    Star,
    Truck,
    Shield,
    CreditCard,
    Tag,
    ArrowRight,
    ArrowLeft,
    Play,
    Instagram,
    Facebook,
    Twitter,
    Mail,
    Phone,
    MapPin,
    Clock,
    CheckCircle,
    Sparkles,
    Palette,
    Camera,
    Home,
    Paintbrush,
    Wand2,
    Users,
    Table,
    Plus,
    Minus,
    Filter,
    Grid,
    List,
    LogOut,
    ChevronDown,
    Upload,
    Eye,
    Download,
    Award,
    Zap,
    Target,
    Lightbulb,
    Brush,
    Droplets,
    Layers,
    Scissors,
    Sofa,
    Lamp,
    BookOpen,
    Package,
    Archive,
    Frame,
    Link as LinkIcon,
    MessageCircle,
    Bell,
    Check,
    RotateCw,
    Store,
    Undo2,
} from "lucide-react";


export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout, cart } = useAppStore();
    
    // Verifica se está na home page
    const isHomePage = pathname === '/';
    
    // Estados locais para favoritos e carrinho
    const [favoritesCount, setFavoritesCount] = useState(0);
    
    // Calcular total de itens no carrinho (soma das quantidades)
    const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Estados locais
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchOpening, setSearchOpening] = useState(false);
    const [searchClosing, setSearchClosing] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    
    // Estados para controle de scroll do header
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    
    // Estados para notificações
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    
    // Refs para os dropdowns
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const notificationsDropdownRef = useRef<HTMLDivElement>(null);

    // Handlers
    const handleOpenSearch = () => {
        setSearchOpening(true);
        setSearchOpen(true);
        setTimeout(() => setSearchOpening(false), 300);
    };

    const handleCloseSearch = () => {
        setSearchClosing(true);
        setTimeout(() => {
            setSearchOpen(false);
            setSearchClosing(false);
        }, 300);
    };

    const handleUserClick = () => {
        setUserDropdownOpen(!userDropdownOpen);
        setNotificationsOpen(false); // Fechar notificações se estiver aberto
    };

    const handleNotificationsClick = () => {
        setNotificationsOpen(!notificationsOpen);
        setUserDropdownOpen(false); // Fechar dropdown do usuário se estiver aberto
    };

    const markNotificationAsRead = async (id: string) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === id ? { ...notif, isRead: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
        }
    };

    // Função para formatar tempo relativo
    const formatTimeAgo = (date: Date | string) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Agora';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutos atrás`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`;
        return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
    };

    const handleLogout = async () => {
        try {
            // Fechar dropdown
            setUserDropdownOpen(false);
            
            // Executar logout do store
            logout();
            
            // Limpar dados do localStorage manualmente para garantir
            if (typeof window !== 'undefined') {
                localStorage.removeItem('mobili-ai-storage');
                // Limpar outros possíveis dados de sessão
                localStorage.removeItem('supabase.auth.token');
                sessionStorage.clear();
            }
            
            // Redirecionar para home
            router.push('/');
            
            // Forçar reload da página para garantir limpeza completa
            setTimeout(() => {
                window.location.reload();
            }, 100);
            
        } catch (error) {
            console.error('Erro durante logout:', error);
            // Mesmo com erro, tentar limpar e redirecionar
            logout();
            router.push('/');
        }
    };

    const handleCartClick = () => {
        router.push('/cart');
    };

    const goToFavorites = () => {
        router.push('/favorites');
    };

    const goToFAQ = () => {
        router.push('/faq');
    };

    // Buscar total de favoritos quando usuário estiver autenticado
    useEffect(() => {
        const fetchFavoritesCount = async () => {
            if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
                try {
                    const response = await customerAPI.getFavoritesCount();
                    console.log('🔍 Response completa da API:', response);
                    
                    // A API retorna um número direto do Prisma
                    let count = 0;
                    if (typeof response === 'number') {
                        count = response;
                    } else if (response?.data !== undefined && typeof response.data === 'number') {
                        count = response.data;
                    } else if (response?.count !== undefined && typeof response.count === 'number') {
                        count = response.count;
                    } else if (typeof response === 'object' && response !== null) {
                        // Tenta pegar o primeiro valor numérico que encontrar
                        const values = Object.values(response);
                        const numValue = values.find(v => typeof v === 'number');
                        if (numValue !== undefined) {
                            count = numValue as number;
                        }
                    }
                    
                    console.log('✅ Favoritos count processado:', count, '| User:', user?.name, '| Role:', user?.role);
                    setFavoritesCount(count);
                } catch (error: any) {
                    console.error('❌ Erro ao buscar contador de favoritos:', error);
                    console.error('Erro detalhes:', error?.response?.data || error?.message);
                    setFavoritesCount(0);
                }
            } else {
                console.log('⚠️ Usuário não autenticado como CUSTOMER. Auth:', isAuthenticated, 'Role:', user?.role);
                setFavoritesCount(0);
            }
        };

        fetchFavoritesCount();
        
        // Atualizar contador quando a rota mudar (caso o usuário adicione/remova favoritos)
        const interval = setInterval(() => {
            if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
                fetchFavoritesCount();
            }
        }, 5000); // Atualiza a cada 5 segundos

        return () => clearInterval(interval);
    }, [isAuthenticated, user, pathname]);

    // Função para buscar notificações (pode ser chamada externamente)
    const fetchNotifications = async (silent = false) => {
        if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
            if (!silent) setLoadingNotifications(true);
            try {
                const [notificationsResponse, unreadCountResponse] = await Promise.all([
                    notificationsAPI.getAll(1, 20),
                    notificationsAPI.getUnreadCount(),
                ]);
                
                setNotifications(notificationsResponse.notifications || []);
                setUnreadCount(unreadCountResponse.count || 0);
            } catch (error: any) {
                console.error('❌ Erro ao buscar notificações:', error);
                setNotifications([]);
                setUnreadCount(0);
            } finally {
                if (!silent) setLoadingNotifications(false);
            }
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    // Buscar notificações quando usuário estiver autenticado
    useEffect(() => {
        fetchNotifications();
        
        // Atualizar notificações a cada 1 segundo para ser mais instantâneo
        const interval = setInterval(() => {
            if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
                fetchNotifications(true); // Silent mode para não mostrar loading
            }
        }, 1000); // Atualiza a cada 1 segundo

        return () => clearInterval(interval);
    }, [isAuthenticated, user, pathname]);

    // Escutar eventos customizados para atualizar notificações imediatamente
    useEffect(() => {
        const handleNotificationUpdate = () => {
            // Pequeno delay para garantir que a notificação foi criada no backend
            setTimeout(() => {
                fetchNotifications(true);
            }, 300);
        };

        // Escutar eventos de ações que geram notificações
        window.addEventListener('notification:cart-added', handleNotificationUpdate);
        window.addEventListener('notification:favorite-added', handleNotificationUpdate);
        window.addEventListener('notification:order-created', handleNotificationUpdate);
        window.addEventListener('notification:order-status-changed', handleNotificationUpdate);

        return () => {
            window.removeEventListener('notification:cart-added', handleNotificationUpdate);
            window.removeEventListener('notification:favorite-added', handleNotificationUpdate);
            window.removeEventListener('notification:order-created', handleNotificationUpdate);
            window.removeEventListener('notification:order-status-changed', handleNotificationUpdate);
        };
    }, [isAuthenticated, user]);

    // Fechar dropdowns quando clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setUserDropdownOpen(false);
            }
            if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };

        if (userDropdownOpen || notificationsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userDropdownOpen, notificationsOpen]);

    // Detectar scroll e mostrar/ocultar header
    useEffect(() => {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    
                    // Se estiver no topo da página, sempre mostrar o header
                    if (currentScrollY < 10) {
                        setIsHeaderVisible(true);
                    } else {
                        // Se rolar para cima (scrollY diminui), mostrar header
                        // Se rolar para baixo (scrollY aumenta), ocultar header
                        if (currentScrollY < lastScrollY) {
                            // Rolando para cima
                            setIsHeaderVisible(true);
                        } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                            // Rolando para baixo (apenas se já passou 100px)
                            setIsHeaderVisible(false);
                        }
                    }
                    
                    setLastScrollY(currentScrollY);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    return (
     
        <header className={`w-full fixed top-0 left-0 right-0 transition-all duration-500 ease-in-out z-40 transform mb-10  ${
            isHeaderVisible 
                ? 'translate-y-0 opacity-100 visible' 
                : '-translate-y-full opacity-0 invisible pointer-events-none'
        } ${
            isHomePage 
                ? 'bg-black/20 backdrop-blur-sm' 
                : 'bg-[#3e2626] border-b border-[#2a1f1f] shadow-md'
        }`}>
          {/* Fita de Benefícios estilo SHEIN com Animação */}
          <div className="bg-[#f5f5f0] border-b border-gray-200 py-1.5 overflow-hidden relative w-full">
            <div className="flex items-center animate-scroll-banner" style={{ width: '200%' }}>
              {/* Primeira cópia (visível inicialmente) */}
              <div className="flex items-center space-x-8 px-8 sm:px-12 lg:px-16 flex-shrink-0" style={{ width: '50%' }}>
                {/* Seção 1: Venda na MobiliAI */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="flex-shrink-0">
                    <Store className="h-3.5 w-3.5 text-[#3e2626]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#3e2626] leading-tight whitespace-nowrap">
                      VENDA NA MOBILIAI
                    </p>
                    <p className="text-[10px] text-[#5a3a3a] font-normal leading-tight whitespace-nowrap">
                      CADASTRE-SE AGORA
                    </p>
                  </div>
                </div>

                {/* Divisor */}
                <div className="h-6 w-px bg-gray-300 flex-shrink-0"></div>

                {/* Seção 2: Frete Grátis */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="flex-shrink-0">
                    <Truck className="h-3.5 w-3.5 text-[#3e2626]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#3e2626] leading-tight whitespace-nowrap">
                      FRETE GRÁTIS
                    </p>
                    <p className="text-[10px] text-[#5a3a3a] font-normal leading-tight whitespace-nowrap">
                      VEJA CONDIÇÕES
                    </p>
                  </div>
                </div>

                {/* Divisor */}
                <div className="h-6 w-px bg-gray-300 flex-shrink-0"></div>

                {/* Seção 3: Devolução Grátis */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="flex-shrink-0">
                    <RotateCw className="h-3.5 w-3.5 text-[#3e2626]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#3e2626] leading-tight whitespace-nowrap">
                      DEVOLUÇÃO GRÁTIS
                    </p>
                    <p className="text-[10px] text-[#5a3a3a] font-normal leading-tight whitespace-nowrap">
                      CONFIRA POLÍTICA DE DEVOLUÇÃO
                    </p>
                  </div>
                </div>
              </div>

              {/* Segunda cópia (para loop infinito) */}
              <div className="flex items-center space-x-8 px-8 sm:px-12 lg:px-16 flex-shrink-0" style={{ width: '50%' }}>
                {/* Seção 1: Venda na MobiliAI */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="flex-shrink-0">
                    <Store className="h-3.5 w-3.5 text-[#3e2626]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#3e2626] leading-tight whitespace-nowrap">
                      VENDA NA MOBILIAI
                    </p>
                    <p className="text-[10px] text-[#5a3a3a] font-normal leading-tight whitespace-nowrap">
                      CADASTRE-SE AGORA
                    </p>
                  </div>
                </div>

                {/* Divisor */}
                <div className="h-6 w-px bg-gray-300 flex-shrink-0"></div>

                {/* Seção 2: Frete Grátis */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="flex-shrink-0">
                    <Truck className="h-3.5 w-3.5 text-[#3e2626]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#3e2626] leading-tight whitespace-nowrap">
                      FRETE GRÁTIS
                    </p>
                    <p className="text-[10px] text-[#5a3a3a] font-normal leading-tight whitespace-nowrap">
                      VEJA CONDIÇÕES
                    </p>
                  </div>
                </div>

                {/* Divisor */}
                <div className="h-6 w-px bg-gray-300 flex-shrink-0"></div>

                {/* Seção 3: Devolução Grátis */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="flex-shrink-0">
                    <RotateCw className="h-3.5 w-3.5 text-[#3e2626]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#3e2626] leading-tight whitespace-nowrap">
                      DEVOLUÇÃO GRÁTIS
                    </p>
                    <p className="text-[10px] text-[#5a3a3a] font-normal leading-tight whitespace-nowrap">
                      CONFIRA POLÍTICA DE DEVOLUÇÃO
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="container mx-auto px-4 h-30 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src="/logotipos/11.svg"
                alt="MobiliAI"
                width={100}
                height={40}
                className={`h-16 md:h-24 w-auto max-w-none transition-all duration-300 ${
                  isHomePage ? '' : 'brightness-0 invert drop-shadow-lg'
                }`}
              />
            </Link>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-6">
               {/* Search Icon with Animation */}
               <div className="relative search-icon-container">
                 {!searchOpen ? (
                   <button 
                     onClick={handleOpenSearch}
                     className={`p-2 transition-colors ${
                       isHomePage 
                         ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                         : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                     }`}
                   >
                     <Search className="h-6 w-6" />
                   </button>
                ) : (
                  <div className="flex items-center">
                    <div className={`${
                      isHomePage 
                        ? 'bg-white/10 backdrop-blur-sm border-2 border-white/30' 
                        : 'bg-white/95 backdrop-blur-md border-2 border-white/30 shadow-lg'
                    } rounded-xl px-4 py-2 flex items-center space-x-3 transition-all duration-300 ${searchClosing ? 'opacity-0 scale-95 translate-x-4' : searchOpening ? 'opacity-100 scale-100 translate-x-0 animate-in slide-in-from-right' : 'opacity-100 scale-100 translate-x-0'}`}>
                      <Search className={`h-5 w-5 ${isHomePage ? 'text-white/60' : 'text-[#3e2626]'}`} />
                      <input
                        type="text"
                        placeholder="Buscar móveis..."
                        className={`bg-transparent focus:outline-none w-64 ${
                          isHomePage 
                            ? 'text-white placeholder:text-white/60' 
                            : 'text-[#3e2626] placeholder:text-gray-500'
                        }`}
                        autoFocus
                      />
                      <button 
                        onClick={handleCloseSearch}
                        className={`transition-colors ${
                          isHomePage 
                            ? 'text-white/60 hover:text-white' 
                            : 'text-gray-400 hover:text-[#3e2626]'
                        }`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
               {/* Favorites Icon */}
               <button 
                 onClick={goToFavorites}
                 className={`p-2 transition-colors relative ${
                   isHomePage 
                     ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                     : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                 }`}
               >
                 <Heart className="h-6 w-6" />
                 {favoritesCount > 0 && (
                   <span 
                     className="absolute top-0 right-0 text-white text-xs font-bold pointer-events-none"
                     style={{ 
                       fontSize: favoritesCount > 99 ? '10px' : '13px',
                       fontWeight: '800',
                       textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.7)',
                       transform: 'translate(25%, -25%)'
                     }}
                   >
                     {favoritesCount > 99 ? '99+' : favoritesCount}
                   </span>
                 )}
              </button>
              
               {/* Notifications Icon */}
               <div className="relative" ref={notificationsDropdownRef}>
                 <button 
                   onClick={handleNotificationsClick}
                   className={`p-2 transition-colors relative ${
                     isHomePage 
                       ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                       : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                   }`}
                 >
                   <Bell className="h-6 w-6" />
                   {unreadCount > 0 && (
                     <span 
                       className="absolute top-0 right-0 text-white text-xs font-bold pointer-events-none"
                       style={{ 
                         fontSize: unreadCount > 99 ? '10px' : '13px',
                         fontWeight: '800',
                         textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.7)',
                         transform: 'translate(25%, -25%)'
                       }}
                     >
                       {unreadCount > 99 ? '99+' : unreadCount}
                     </span>
                   )}
                 </button>
                 
                 {/* Notifications Dropdown */}
                 {notificationsOpen && (
                   <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[999] animate-in slide-in-from-top-2 duration-200 max-h-[500px] flex flex-col">
                                           {/* Header */}
                      <div className="px-4 py-3 bg-[#3e2626] rounded-t-2xl flex items-center justify-between">
                       <div>
                         <h3 className="text-sm font-bold text-white">Notificações</h3>
                         {unreadCount > 0 && (
                           <p className="text-xs text-white/80">{unreadCount} não lidas</p>
                         )}
                       </div>
                       {unreadCount > 0 && (
                         <button
                           onClick={markAllAsRead}
                           className="text-xs text-white/90 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
                         >
                           Marcar todas como lidas
                         </button>
                       )}
                     </div>
                     
                     {/* Notifications List */}
                     <div className="overflow-y-auto flex-1">
                       {loadingNotifications ? (
                         <div className="px-4 py-8 text-center">
                           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626] mx-auto"></div>
                           <p className="text-sm text-gray-500 mt-2">Carregando notificações...</p>
                         </div>
                       ) : notifications.length === 0 ? (
                         <div className="px-4 py-8 text-center">
                           <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                           <p className="text-sm text-gray-500">Nenhuma notificação</p>
                         </div>
                       ) : (
                         <div className="divide-y divide-gray-100">
                           {notifications.map((notification) => (
                             <div
                               key={notification.id}
                               onClick={() => markNotificationAsRead(notification.id)}
                               className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                                 !notification.isRead ? 'bg-blue-50/50' : ''
                               }`}
                             >
                               <div className="flex items-start space-x-3">
                                 <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                   !notification.isRead ? 'bg-blue-500' : 'bg-transparent'
                                 }`} />
                                 <div className="flex-1 min-w-0">
                                   <p className={`text-sm font-semibold ${
                                     !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                   }`}>
                                     {notification.title}
                                   </p>
                                   <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                     {notification.message}
                                   </p>
                                   <p className="text-xs text-gray-400 mt-1">
                                     {formatTimeAgo(notification.createdAt)}
                                   </p>
                                 </div>
                                 {notification.isRead && (
                                   <Check className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                                 )}
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>
              
               {/* FAQ Icon */}
               <button 
                 onClick={goToFAQ}
                 className={`p-2 transition-colors ${
                   isHomePage 
                     ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                     : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                 }`}
                 title="Perguntas Frequentes"
               >
                 <MessageCircle className="h-6 w-6" />
               </button>
              
               {/* Account Icon - Sempre visível */}
               <div className="relative user-dropdown-container" ref={userDropdownRef}>
                 <button 
                   onClick={handleUserClick}
                   className={`p-2 transition-colors ${
                     isHomePage 
                       ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                       : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                   }`}
                 >
                   <User className="h-6 w-6" />
                 </button>
                
                {/* Dropdown - Diferente para usuário autenticado vs não autenticado */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-[999] animate-in slide-in-from-top-2 duration-200">
                    {isAuthenticated ? (
                      <>
                        {/* Header com informações do usuário */}
                        <div className="px-4 py-3 bg-gray-50 rounded-t-2xl">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626] to-[#5a3a3a] rounded-full flex items-center justify-center shadow-lg">
                                <User className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">{user?.name || 'Usuário'}</p>
                              <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Botões de ação para usuário autenticado */}
                        <div className="px-1 py-1">
                          <Link 
                            href="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#3e2626]/5 hover:to-[#5a3a3a]/5 rounded-lg transition-all duration-200 group"
                          >
                            <div className="w-7 h-7 bg-[#3e2626]/10 rounded-lg flex items-center justify-center group-hover:bg-[#3e2626]/20 transition-colors">
                              <User className="h-4 w-4 text-[#3e2626]" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">Meu Perfil</p>
                              <p className="text-xs text-gray-500">Editar informações</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3e2626] transition-colors" />
                          </Link>
                          
                          <Link 
                            href="/favorites"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#3e2626]/5 hover:to-[#5a3a3a]/5 rounded-lg transition-all duration-200 group"
                          >
                            <div className="w-7 h-7 bg-[#3e2626]/10 rounded-lg flex items-center justify-center group-hover:bg-[#3e2626]/20 transition-colors">
                              <Heart className="h-4 w-4 text-[#3e2626]" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">Meus Favoritos</p>
                              <p className="text-xs text-gray-500">{favoritesCount} produtos salvos</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3e2626] transition-colors" />
                          </Link>
                          
                          <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                          
                          <button 
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-lg transition-all duration-200 w-full text-left group"
                          >
                            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                              <LogOut className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">Sair</p>
                              <p className="text-xs text-red-500">Fazer logout</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Header para usuário não autenticado */}
                        <div className="px-4 py-3 bg-gradient-to-r from-[#3e2626]/5 to-[#5a3a3a]/5 rounded-t-2xl">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626]/20 to-[#5a3a3a]/20 rounded-full flex items-center justify-center shadow-lg">
                                <User className="h-5 w-5 text-[#3e2626]" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">Olá! 👋</p>
                              <p className="text-xs text-gray-500">Faça login para continuar</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Conteúdo para usuário não autenticado */}
                        <div className="px-1 py-1">
                          <div className="px-3 py-4 text-center">
                            <p className="text-sm text-gray-600 mb-4">
                              Entre na sua conta para acessar seus favoritos, histórico de compras e muito mais!
                            </p>
                            <Link 
                              href="/login"
                              onClick={() => setUserDropdownOpen(false)}
                              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3e2626] hover:bg-[#5a3a3a] text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              <User className="h-4 w-4" />
                              <span>Entrar</span>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
               </div>
              
               {/* Cart Icon */}
               <button 
                 onClick={handleCartClick}
                 className={`p-2 transition-colors relative ${
                   isHomePage 
                     ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full' 
                     : 'text-white hover:text-white/90 hover:bg-white/15 backdrop-blur-sm rounded-full'
                 }`}
               >
                 <ShoppingCart className="h-6 w-6" />
                 {cartItemsCount > 0 && (
                   <span 
                     className="absolute top-0 right-0 text-white text-xs font-bold pointer-events-none"
                     style={{ 
                       fontSize: cartItemsCount > 99 ? '10px' : '13px',
                       fontWeight: '800',
                       textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.7)',
                       transform: 'translate(25%, -25%)'
                     }}
                   >
                     {cartItemsCount > 99 ? '99+' : cartItemsCount}
                   </span>
                 )}
              </button>
            </div>
          </div>


          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className={`md:hidden border-t py-4 rounded-lg mt-2 ${
              isHomePage 
                ? 'border-white/20 bg-black/20 backdrop-blur-sm' 
                : 'border-white/20 bg-white/10 backdrop-blur-sm'
            }`}>
              <nav className="flex flex-col space-y-4">
                <Link href="/" className={`font-medium ${isHomePage ? 'text-white' : 'text-white'}`}>Início</Link>
                <Link href="/products" className={`hover:opacity-90 ${isHomePage ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'}`}>Produtos</Link>
                <Link href="/furniture-visualizer" className={`hover:opacity-90 ${isHomePage ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'}`}>Visualizador IA</Link>
                <Link href="/about" className={`hover:opacity-90 ${isHomePage ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'}`}>Sobre</Link>
                <Link href="/contact" className={`hover:opacity-90 ${isHomePage ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'}`}>Contato</Link>
              </nav>
              <div className={`mt-4 pt-4 border-t ${isHomePage ? 'border-white/20' : 'border-white/20'}`}>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isHomePage ? 'text-white/60' : 'text-white/60'}`} />
                  <Input
                    placeholder="Buscar móveis..."
                    className={`pl-10 backdrop-blur-sm border text-white placeholder:text-white/60 ${
                      isHomePage 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-white/10 border-white/20'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
          </div>
        </header>
    );
}