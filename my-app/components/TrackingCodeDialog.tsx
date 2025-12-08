'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Package } from 'lucide-react';

interface TrackingCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (trackingCode: string) => void;
  orderNumber: string;
  isLoading?: boolean;
}

export default function TrackingCodeDialog({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  isLoading = false
}: TrackingCodeDialogProps) {
  const [trackingCode, setTrackingCode] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const trimmedCode = trackingCode.trim();

    if (!trimmedCode) {
      setError('Código de rastreamento é obrigatório');
      return;
    }

    if (trimmedCode.length < 3) {
      setError('Código deve ter pelo menos 3 caracteres');
      return;
    }

    setError('');
    onConfirm(trimmedCode);
    setTrackingCode('');
  };

  const handleClose = () => {
    setTrackingCode('');
    setError('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <Truck className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Código de Rastreamento</DialogTitle>
              <DialogDescription className="text-sm">
                Pedido #{orderNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tracking-code" className="text-sm font-medium">
              Digite o código de rastreamento
            </Label>
            <Input
              id="tracking-code"
              type="text"
              placeholder="Ex: BR123456789BR"
              value={trackingCode}
              onChange={(e) => {
                setTrackingCode(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              className={`text-sm ${error ? 'border-red-500 focus:border-red-500' : ''}`}
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span className="text-red-500">⚠️</span>
                {error}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Importante:</p>
                <p>O cliente receberá uma notificação com este código para acompanhar o envio.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !trackingCode.trim()}
            className="flex-1 "
          >
            {isLoading ? 'Enviando...' : 'Confirmar Envio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}