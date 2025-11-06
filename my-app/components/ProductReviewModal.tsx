'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  saleId: string;
  onReviewSubmitted: () => void;
}

export default function ProductReviewModal({
  isOpen,
  onClose,
  product,
  saleId,
  onReviewSubmitted
}: ProductReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }

    setIsSubmitting(true);
    try {
      const { customerAPI } = await import('@/lib/api');
      await customerAPI.createReview(product.id, rating, title || undefined, comment || undefined, saleId);
      toast.success('Avaliação enviada com sucesso!');
      onReviewSubmitted();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error(error.response?.data?.message || 'Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setTitle('');
    setComment('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-[#3e2626]">Avaliar Produto</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Produto */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
              />
            )}
            <div>
              <p className="font-semibold text-gray-800">{product.name}</p>
              <p className="text-sm text-gray-500">Avalie sua experiência com este produto</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avaliação com Estrelas */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Sua Avaliação *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rating === 1 && 'Péssimo'}
                    {rating === 2 && 'Ruim'}
                    {rating === 3 && 'Regular'}
                    {rating === 4 && 'Bom'}
                    {rating === 5 && 'Excelente'}
                  </span>
                )}
              </div>
            </div>

            {/* Título (Opcional) */}
            <div>
              <Label htmlFor="review-title">Título da Avaliação (Opcional)</Label>
              <Input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Produto excelente!"
                className="mt-1"
                maxLength={100}
              />
            </div>

            {/* Comentário */}
            <div>
              <Label htmlFor="review-comment">Comentário (Opcional)</Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte sua experiência com este produto..."
                className="mt-1 min-h-[120px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 caracteres
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#3e2626] hover:bg-[#5a3a3a]"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

