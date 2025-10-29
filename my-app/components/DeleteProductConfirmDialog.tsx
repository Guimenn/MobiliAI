'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Package, AlertCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DeleteProductConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  productCategory?: string;
  isLoading: boolean;
}

export default function DeleteProductConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  productName,
  productCategory,
  isLoading,
}: DeleteProductConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md p-6">
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="relative w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <AlertDialogTitle className="text-2xl font-bold text-gray-900">
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-2">
            Você tem certeza que deseja deletar o produto{' '}
            <span className="font-semibold text-red-700">{productName}</span>?
            Esta ação é irreversível.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col items-center space-y-3 mt-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800">{productName}</p>
          {productCategory && (
            <Badge variant="outline" className="bg-gray-100 text-gray-700">
              {productCategory}
            </Badge>
          )}
        </div>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Produto
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
