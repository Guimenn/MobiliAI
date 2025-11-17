import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicSupportService {
  constructor(private prisma: PrismaService) {}

  async handleWebhook(body: any) {
    // Endpoint genérico para o n8n consultar dados
    // O n8n pode enviar diferentes tipos de requisições aqui
    const { action, data } = body;

    switch (action) {
      case 'search_products':
        return this.searchProducts(data?.query || '');
      case 'get_stores':
        return this.getStores();
      case 'get_product':
        return this.getProductById(data?.productId);
      case 'get_store_info':
        return this.getStoreInfo(data?.storeId);
      default:
        return { success: true, message: 'Webhook recebido', data: body };
    }
  }

  async getStores() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        email: true,
        openingHours: true,
      },
    });

    return {
      success: true,
      stores,
    };
  }

  async searchProducts(query: string) {
    if (!query) {
      return { success: true, products: [] };
    }

    const searchTerms = query.toLowerCase().split(' ');

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: searchTerms.map(term => ({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { brand: { contains: term, mode: 'insensitive' } },
            { colorName: { contains: term, mode: 'insensitive' } },
          ],
        })),
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        brand: true,
        colorName: true,
        category: true,
        stock: true,
      },
      take: 10,
    });

    return {
      success: true,
      products,
    };
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        brand: true,
        colorName: true,
        category: true,
        stock: true,
      },
    });

    return {
      success: true,
      product: product || null,
    };
  }

  async getStoreInfo(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId, isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        email: true,
        openingHours: true,
      },
    });

    return {
      success: true,
      store: store || null,
    };
  }
}

