import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Dados mockados como fallback
const mockTransformations = [
  {
    title: 'Sala Moderna',
    description: 'Transformação realizada com IA aplicando paleta terracota',
    src: '/IAsection/ImagemIA1.png',
  },
  {
    title: 'Quarto Elegante',
    description: 'Ambiente transformado com móveis da coleção Oslo',
    src: '/IAsection/ImagemIA2.png',
  },
  {
    title: 'Cozinha Contemporânea',
    description: 'Visualização realista com produtos do catálogo',
    src: '/IAsection/ImagemIA3.png',
  },
  {
    title: 'Escritório Minimalista',
    description: 'Renderização com IA usando cores da marca',
    src: '/IAsection/ImagemIA1.png',
  },
];

export async function GET() {
  try {
    // Tentar buscar do backend
    const response = await axios.get(`${API_BASE_URL}/customer/products/featured?limit=8`, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // Timeout de 5 segundos
    });

    const products = response.data || [];

    if (products.length > 0) {
      // Transformar produtos em formato de transformation gallery
      const transformations = products.slice(0, 4).map((product: any, index: number) => ({
        title: product.name || `Transformação ${index + 1}`,
        description: product.description || product.shortDescription || 'Transformação realizada com IA',
        src: product.imageUrls?.[0] || product.imageUrl || '/placeholder-image.jpg',
      }));

      return NextResponse.json(transformations);
    }

    // Se não houver produtos, retornar dados mockados
    return NextResponse.json(mockTransformations);
  } catch (error: any) {
    console.error('Erro ao buscar transformações:', error.message);
    // Retornar dados mockados em caso de erro
    return NextResponse.json(mockTransformations);
  }
}

