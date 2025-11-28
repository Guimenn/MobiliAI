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
    try {
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
          workingHours: true,
          openingTime: true,
          closingTime: true,
          workingDays: true,
          isActive: true,
          inventory: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                },
              },
            },
            where: {
              product: {
                isActive: true,
              },
            },
          },
        },
      });

      // Processar estoque para cada loja
      const storesWithInventory = stores.map((store) => {
        const storeInventory = store.inventory
          .filter((inv) => inv.product?.isActive)
          .map((inv) => ({
            productId: inv.productId,
            productName: inv.product?.name || 'Produto desconhecido',
            quantity: inv.quantity || 0,
          }));

        return {
          id: store.id,
          name: store.name,
          address: store.address,
          city: store.city,
          state: store.state,
          zipCode: store.zipCode,
          phone: store.phone,
          email: store.email,
          workingHours: store.workingHours,
          openingTime: store.openingTime,
          closingTime: store.closingTime,
          workingDays: store.workingDays,
          isActive: store.isActive,
          storeInventory,
        };
      });

      console.log(`📦 [PublicSupportService] Encontradas ${storesWithInventory.length} lojas ativas`);

      return {
        success: true,
        stores: storesWithInventory,
      };
    } catch (error: any) {
      console.error('❌ [PublicSupportService] Erro ao buscar lojas:', error);
      return {
        success: false,
        stores: [],
        error: error.message,
      };
    }
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
        workingHours: true,
        openingTime: true,
        closingTime: true,
        workingDays: true,
      },
    });

    return {
      success: true,
      store: store || null,
    };
  }
}

