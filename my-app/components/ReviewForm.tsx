'use client';

import { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { customerAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';

interface ReviewFormProps {
  productId: string;
  saleId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ productId, saleId, onSuccess, onCancel }: ReviewFormProps) {
  const { user, isAuthenticated } = useAppStore();
  const [ratingState, setRatingState] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Faça login para avaliar produtos');
      return;
    }

    if (ratingState === 0) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }

    if (!comment.trim()) {
      toast.error('Por favor, escreva um comentário');
      return;
    }

    try {
      setSubmitting(true);
      await customerAPI.createReview(
        productId,
        ratingState,
        title.trim() || undefined,
        comment.trim(),
        saleId
      );
      toast.success('Avaliação enviada com sucesso!');
      setRatingState(0);
      setTitle('');
      setComment('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error(
        error?.response?.data?.message ||
        'Erro ao enviar avaliação. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (forRating: number) => {
    return Array.from({ length: 5 }).map((_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= (hoveredRating || ratingState);

      return (
        <button
          key={index}
          type="button"
          onClick={() => setRatingState(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none transition-transform hover:scale-110"
          disabled={submitting}
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              isFilled
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      );
    });
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliar Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">
            Faça login para avaliar este produto
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Avaliar Produto</CardTitle>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-2 block">
              Sua avaliação *
            </Label>
            <div className="flex items-center gap-2" onMouseLeave={() => setHoveredRating(0)}>
              {renderStars(ratingState)}
              {ratingState > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {ratingState === 1 && 'Péssimo'}
                  {ratingState === 2 && 'Ruim'}
                  {ratingState === 3 && 'Regular'}
                  {ratingState === 4 && 'Bom'}
                  {ratingState === 5 && 'Excelente'}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Título da avaliação (opcional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Produto excelente!"
              maxLength={100}
              disabled={submitting}
            />
          </div>

          <div>
            <Label htmlFor="comment">
              Comentário * <span className="text-gray-500 text-sm">(mínimo 10 caracteres)</span>
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Compartilhe sua experiência com este produto..."
              rows={5}
              maxLength={1000}
              disabled={submitting}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 caracteres
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={submitting || ratingState === 0 || comment.trim().length < 10}
              className="flex-1 bg-brand-700 hover:bg-brand-800"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Avaliação
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                Cancelar
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center">
            * Campos obrigatórios. Você só pode avaliar produtos após receber o pedido.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

