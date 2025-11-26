import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const SESSION_TIMEOUT_KEY = 'session_timeout';
const LAST_ACTIVITY_KEY = 'last_activity';

export function useSessionTimeout() {
  const { logout, token } = useAppStore();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) {
      // Limpar timeouts se não houver token
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      return;
    }

    // Carregar timeout de sessão das configurações
    const loadSessionTimeout = () => {
      try {
        const savedSettings = localStorage.getItem('app_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const timeoutMinutes = settings?.system?.sessionTimeout || 30;
          localStorage.setItem(SESSION_TIMEOUT_KEY, timeoutMinutes.toString());
          return timeoutMinutes;
        }
      } catch (error) {
        console.error('Erro ao carregar timeout de sessão:', error);
      }
      return 30; // Valor padrão
    };

    // Observar mudanças no localStorage para atualizar timeout em tempo real
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app_settings' && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          const timeoutMinutes = settings?.system?.sessionTimeout || 30;
          localStorage.setItem(SESSION_TIMEOUT_KEY, timeoutMinutes.toString());
        } catch (error) {
          console.error('Erro ao atualizar timeout de sessão:', error);
        }
      }
    };

    // Observar mudanças no mesmo tab (quando localStorage é atualizado)
    const handleLocalStorageChange = () => {
      const savedSettings = localStorage.getItem('app_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          const timeoutMinutes = settings?.system?.sessionTimeout || 30;
          localStorage.setItem(SESSION_TIMEOUT_KEY, timeoutMinutes.toString());
        } catch (error) {
          console.error('Erro ao atualizar timeout de sessão:', error);
        }
      }
    };

    // Carregar inicialmente
    loadSessionTimeout();

    // Adicionar listeners
    window.addEventListener('storage', handleStorageChange);
    
    // Observar mudanças no mesmo tab (usando um intervalo para verificar)
    storageCheckIntervalRef.current = setInterval(() => {
      handleLocalStorageChange();
    }, 5000); // Verificar a cada 5 segundos

    // Atualizar última atividade
    const updateLastActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };

    // Verificar inatividade periodicamente
    const checkInactivity = () => {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      // Recarregar timeout das configurações a cada verificação (para pegar mudanças)
      const savedSettings = localStorage.getItem('app_settings');
      let timeoutMinutes = 30;
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          timeoutMinutes = settings?.system?.sessionTimeout || 30;
        } catch (error) {
          console.error('Erro ao ler timeout:', error);
        }
      } else {
        timeoutMinutes = parseInt(localStorage.getItem(SESSION_TIMEOUT_KEY) || '30');
      }
      
      const timeoutMs = timeoutMinutes * 60 * 1000;

      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        
        if (timeSinceLastActivity >= timeoutMs) {
          // Sessão expirada
          toast.warning(`Sua sessão expirou por inatividade (${timeoutMinutes} minutos). Faça login novamente.`);
          logout();
          router.push('/login');
        }
      } else {
        updateLastActivity();
      }
    };

    // Eventos de atividade do usuário
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateLastActivity();
    };

    // Adicionar listeners de atividade
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Verificar inatividade a cada minuto
    checkIntervalRef.current = setInterval(checkInactivity, 60000);

    // Inicializar última atividade
    updateLastActivity();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      window.removeEventListener('storage', handleStorageChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (storageCheckIntervalRef.current) {
        clearInterval(storageCheckIntervalRef.current);
      }
    };
  }, [token, logout, router]);
}

