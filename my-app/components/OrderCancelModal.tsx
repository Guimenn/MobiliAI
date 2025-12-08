'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { X, AlertTriangle, ShoppingCart, Package, MessageSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface OrderCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    saleNumber: string;
    totalAmount: number;
    items: Array<{
      id: string;
      productId: string;
      product?: {
        name: string;
        imageUrls?: string[];
      };
      quantity: number;
      unitPrice: number;
    }>;
  };
  onOrderCancelled: () => void;
}

export default function OrderCancelModal({
  isOpen,
  onClose,
  order,
  onOrderCancelled
}: OrderCancelModalProps) {
  const [cancelReason, setCancelReason] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [returnToCart, setReturnToCart] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cancelReasons = [
    { value: 'price', label: 'Preço muito alto' },
    { value: 'delivery', label: 'Prazo de entrega muito longo' },
    { value: 'product', label: 'Produto não atende às expectativas' },
    { value: 'change_mind', label: 'Arrependimento da compra' },
    { value: 'payment', label: 'Problemas com pagamento' },
    { value: 'other', label: 'Outro motivo' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cancelReason) {
      toast.error('Por favor, selecione um motivo para o cancelamento');
      return;
    }

    setIsSubmitting(true);
    try {
      const { customerAPI } = await import('@/lib/api');

      // Cancelar o pedido
      await customerAPI.cancelOrder(order.id, {
        reason: cancelReason,
        comments: additionalComments || undefined,
        returnToCart
      });

      // O backend já adiciona os produtos ao carrinho se returnToCart for true
      if (returnToCart) {
        toast.success('Pedido cancelado! Os produtos foram adicionados ao carrinho.');
      } else {
        toast.success('Pedido cancelado com sucesso.');
      }

      onOrderCancelled();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao cancelar pedido:', error);
      toast.error(error.response?.data?.message || 'Erro ao cancelar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCancelReason('');
    setAdditionalComments('');
    setReturnToCart(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gray-200">
        <div className="sticky top-0 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white px-6 py-5 border-b-2 border-[#5a3a3a] shadow-md rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border-2 border-white/30">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white drop-shadow-sm">Cancelar Pedido</h2>
                <p className="text-sm text-white/80 mt-0.5">Confirme os detalhes do cancelamento</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Informações do Pedido */}
          <Card className="mb-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#3e2626]">Pedido #{order.saleNumber}</p>
                    <p className="text-sm text-gray-600">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'} no pedido</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                  <p className="font-bold text-2xl text-[#3e2626] bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] bg-clip-text text-transparent">
                    R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Motivo do Cancelamento */}
            <Card className="shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  Por que você deseja cancelar este pedido? *
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <RadioGroup value={cancelReason} onValueChange={setCancelReason}>
                  <div className="space-y-4">
                    {cancelReasons.map((reason) => (
                      <div key={reason.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-transparent hover:border-gray-200">
                        <RadioGroupItem value={reason.value} id={reason.value} className="border-2" />
                        <Label htmlFor={reason.value} className="cursor-pointer font-medium text-gray-700 flex-1">
                          {reason.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Comentários Adicionais */}
            <Card className="shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  Comentários adicionais (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea
                  id="comments"
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Conte-nos mais sobre o motivo do cancelamento..."
                  className="min-h-[120px] border-2 border-gray-200 focus:border-[#3e2626] transition-colors duration-200"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Ajude-nos a melhorar nosso serviço
                  </p>
                  <p className="text-xs text-gray-500">
                    {additionalComments.length}/500 caracteres
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Opção de voltar ao carrinho */}
            <Card className="shadow-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start space-x-4">
                  <div className="pt-1">
                    <Checkbox
                      id="return-to-cart"
                      checked={returnToCart}
                      onCheckedChange={(checked) => setReturnToCart(checked as boolean)}
                      className="h-5 w-5 border-2 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="return-to-cart" className="cursor-pointer flex items-center gap-3 font-bold text-lg text-blue-900 mb-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      Adicionar produtos ao carrinho novamente
                    </Label>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Os produtos deste pedido serão adicionados ao seu carrinho para futuras compras.
                      Você poderá continuar comprando normalmente.
                    </p>
                    <div className="mt-4 p-3 bg-white/70 rounded-lg border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-2">Produtos que serão adicionados:</p>
                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm text-blue-800">
                            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                              <Package className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="font-medium">{item.quantity}x {item.product?.name || 'Produto'}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-blue-700 font-medium">
                            +{order.items.length - 3} outros itens
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aviso Importante */}
            <Card className="shadow-lg border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shadow-md border-2 border-red-200">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-red-900 mb-2">Atenção Importante</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-red-800 leading-relaxed">
                        • Esta ação <strong>não pode ser desfeita</strong>
                      </p>
                      <p className="text-sm text-red-800 leading-relaxed">
                        • O pedido será <strong>cancelado permanentemente</strong>
                      </p>
                      {!returnToCart && (
                        <p className="text-sm text-red-800 leading-relaxed">
                          • Os produtos <strong>não serão adicionados ao carrinho</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botões */}
            <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Manter Pedido
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-red-600"
                disabled={isSubmitting || !cancelReason}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Cancelando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Confirmar Cancelamento
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}