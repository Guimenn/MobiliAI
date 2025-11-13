'use client';

import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'destructive';
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  resolve: ((value: boolean) => void) | null;
  show: (params: {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  }) => Promise<boolean>;
  close: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  title: 'Confirmar ação',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'default',
  onConfirm: null,
  onCancel: null,
  resolve: null,
  show: (params) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        message: params.message,
        title: params.title || 'Confirmar ação',
        confirmText: params.confirmText || 'Confirmar',
        cancelText: params.cancelText || 'Cancelar',
        variant: params.variant || 'default',
        resolve,
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  },
  close: () => {
    set((state) => {
      if (state.resolve) {
        state.resolve(false);
      }
      return {
        isOpen: false,
        resolve: null,
        onConfirm: null,
        onCancel: null,
      };
    });
  },
}));

