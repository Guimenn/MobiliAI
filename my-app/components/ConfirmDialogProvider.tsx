'use client';

import { useConfirmStore } from '@/lib/confirm-store';
import ConfirmDialog from './ConfirmDialog';

export default function ConfirmDialogProvider() {
  const {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    variant,
    onConfirm,
    onCancel,
    close,
  } = useConfirmStore();

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      onConfirm={onConfirm || (() => {})}
      onCancel={onCancel || undefined}
    />
  );
}

