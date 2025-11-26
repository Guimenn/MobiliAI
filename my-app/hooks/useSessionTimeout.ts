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
    const loadSessionTimeout = async () => {
      try {
        const savedSettings = localStorage.getItem('app_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const timeoutMinutes = settings?.system?.sessionTimeout || 30;
          localStorage.setItem(SESSION_TIMEOUT_KEY, timeoutMinutes.toString());
        }
      } catch (error) {
        console.error('Erro ao carregar timeout de sessão:', error);
      }
    };

    loadSessionTimeout();

    // Atualizar última atividade
    const updateLastActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };

    // Verificar inatividade periodicamente
    const checkInactivity = () => {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      const timeoutMinutes = parseInt(localStorage.getItem(SESSION_TIMEOUT_KEY) || '30');
      const timeoutMs = timeoutMinutes * 60 * 1000;

      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        
        if (timeSinceLastActivity >= timeoutMs) {
          // Sessão expirada
          toast.warning('Sua sessão expirou por inatividade. Faça login novamente.');
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
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [token, logout, router]);
}

