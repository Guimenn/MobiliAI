import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Dados mockados como fallback
const mockTrends = [
  {
    title: 'Terracota em Alta',
    tag: 'TREND',
    image: '/IAsection/ImagemIA1.png',
    bulletPoints: [
      'Cores terracota dominam as vendas este mês',
      'Aumento de 40% nas buscas por paletas quentes',
      'Recomendado para ambientes modernos e aconchegantes',
    ],
  },
  {
    title: 'Minimalismo Sustentável',
    tag: 'NOVO',
    image: '/IAsection/ImagemIA2.png',
    bulletPoints: [
      'Tendência crescente em design de interiores',
      'Produtos com certificação sustentável em destaque',
      'Cliente busca qualidade e consciência ambiental',
    ],
  },
  {
    title: 'Cores Neutras Clássicas',
    tag: 'TOP',
    image: '/IAsection/ImagemIA3.png',
    bulletPoints: [
      'Bege e cinza continuam sendo preferência',
      'Versatilidade para diferentes estilos',
      'Alta taxa de aprovação em projetos',
    ],
  },
];

export async function GET() {
  try {
    // Tentar buscar do backend
    const response = await axios.get(`${API_BASE_URL}/customer/products/bestsellers?limit=3`, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    const products = response.data || [];

    if (products.length > 0) {
      // Transformar produtos em formato de tendências
      const trends = products.slice(0, 3).map((product: any, index: number) => ({
        title: product.name || `Tendência ${index + 1}`,
        tag: product.category || 'NOVO',
        image: product.imageUrls?.[0] || product.imageUrl || '/placeholder-image.jpg',
        bulletPoints: [
          product.description?.substring(0, 50) || product.shortDescription?.substring(0, 50) || 'Item em alta demanda',
          `Categoria: ${product.category || 'Geral'}`,
          `Avaliação: ${product.rating || '4.5'}/5`,
        ],
      }));

      return NextResponse.json(trends);
    }

    // Se não houver produtos, retornar dados mockados
    return NextResponse.json(mockTrends);
  } catch (error: any) {
    console.error('Erro ao buscar tendências:', error.message);
    // Retornar dados mockados em caso de erro
    return NextResponse.json(mockTrends);
  }
}

