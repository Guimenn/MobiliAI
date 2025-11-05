'use client';

import { useEffect, useState } from 'react';
import { Star, MessageCircle, ThumbsUp, User, Verified } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { env } from '@/lib/env';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
}

interface ProductReviewsProps {
  productId: string;
  onReviewAdded?: () => void;
}

export default function ProductReviews({ productId, onReviewAdded }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      const response = await fetch(
        `${apiBaseUrl}/public/products/${productId}/reviews?page=${pageNum}&limit=10`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError('Erro ao carregar avaliações');
      }
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err);
      setError('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews(page);
    }
  }, [productId, page]);

  useEffect(() => {
    if (onReviewAdded) {
      fetchReviews(page);
    }
  }, [onReviewAdded]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading && reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-brand-700/20 border-t-brand-700 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Carregando avaliações...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fetchReviews(page)}
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Avaliações ({reviews.length > 0 ? reviews.length : 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Ainda não há avaliações para este produto.</p>
            <p className="text-sm text-gray-500 mt-2">
              Seja o primeiro a avaliar!
            </p>
          </div>
        ) : (
          <>
            {reviews.map((review, index) => (
              <div key={review.id}>
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.user.avatarUrl} alt={review.user.name} />
                      <AvatarFallback className="bg-brand-100 text-brand-700">
                        {getInitials(review.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{review.user.name}</p>
                        {review.isVerified && (
                          <Verified className="h-4 w-4 text-blue-500" title="Compra verificada" />
                        )}
                        <span className="text-xs text-gray-500">
                          {format(new Date(review.createdAt), "d 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                      </div>
                      {review.title && (
                        <h4 className="font-semibold text-gray-900">{review.title}</h4>
                      )}
                      {review.comment && (
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-gray-600 hover:text-gray-900"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Útil ({review.helpful})
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {index < reviews.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

