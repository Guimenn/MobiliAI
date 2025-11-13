import { toast } from 'sonner';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * Exibe um alerta padronizado usando toast
 * @param type - Tipo do alerta (success, error, warning, info)
 * @param message - Mensagem a ser exibida
 * @param description - Descrição opcional (aparece abaixo da mensagem)
 * @param duration - Duração em milissegundos (padrão: 4000ms)
 */
export const showAlert = (
  type: AlertType,
  message: string,
  description?: string,
  duration: number = 4000
) => {
  const options = {
    description,
    duration,
  };

  switch (type) {
    case 'success':
      toast.success(message, options);
      break;
    case 'error':
      toast.error(message, options);
      break;
    case 'warning':
      toast.warning(message, options);
      break;
    case 'info':
      toast.info(message, options);
      break;
    default:
      toast(message, options);
  }
};

/**
 * Exibe uma confirmação padronizada usando Dialog customizado
 * @param message - Mensagem de confirmação
 * @param title - Título opcional do diálogo
 * @param confirmText - Texto do botão de confirmação
 * @param cancelText - Texto do botão de cancelamento
 * @param variant - Variante do botão (default ou destructive)
 * @returns Promise<boolean>
 */
export const showConfirm = async (
  message: string,
  title?: string,
  confirmText?: string,
  cancelText?: string,
  variant: 'default' | 'destructive' = 'default'
): Promise<boolean> => {
  // Importação dinâmica para evitar problemas de SSR
  const { useConfirmStore } = await import('./confirm-store');
  return useConfirmStore.getState().show({
    message,
    title,
    confirmText,
    cancelText,
    variant,
  });
};

/**
 * Wrapper para compatibilidade com alert() nativo
 * @param message - Mensagem a ser exibida
 */
export const alert = (message: string) => {
  showAlert('info', message);
};

/**
 * Wrapper para compatibilidade com confirm() nativo
 * @param message - Mensagem de confirmação
 * @returns Promise<boolean>
 */
export const confirm = (message: string): Promise<boolean> => {
  return showConfirm(message);
};

