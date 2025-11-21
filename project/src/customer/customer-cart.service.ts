import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class CustomerCartService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private couponsService: CouponsService,
  ) {}

  // ==================== CARRINHO DE COMPRAS ====================

  async addToCart(customerId: string, productId: string, quantity: number = 1) {
    // Verificar se o produto existe e está disponível
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (!product.isAvailable) {
      throw new BadRequestException('Produto não está disponível');
    }

    // Verificar se o produto já está no carrinho
    const existingCartItem = await this.prisma.cartItem.findFirst({
      where: {
        customerId,
        productId
      }
    });

    let cartItem;
    if (existingCartItem) {
      // Atualizar quantidade (sem verificação de estoque)
      const newQuantity = existingCartItem.quantity + quantity;

      cartItem = await this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrls: true,
              stock: true
            }
          }
        }
      });
    } else {
      // Adicionar novo item ao carrinho
      cartItem = await this.prisma.cartItem.create({
        data: {
          customerId,
          productId,
          quantity
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrls: true,
              stock: true
            }
          }
        }
      });
    }

    // Criar notificação apenas quando for um novo item (não quando atualizar quantidade)
    if (!existingCartItem) {
      try {
        await this.notificationsService.notifyCartAdded(
          customerId,
          product.id,
          product.name,
        );
      } catch (error) {
        console.error('Erro ao criar notificação de carrinho:', error);
        // Não falhar a operação se a notificação falhar
      }
    }

    return cartItem;
  }

  async getCart(customerId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { customerId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrls: true,
            stock: true,
            category: true,
            brand: true,
            colorName: true,
            colorHex: true,
            storeId: true,
            store: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

    return {
      items: cartItems,
      summary: {
        totalItems,
        totalPrice,
        itemCount: cartItems.length
      }
    };
  }

  async updateCartItem(customerId: string, cartItemId: string, quantity: number) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        customerId
      },
      include: { product: true }
    });

    if (!cartItem) {
      throw new NotFoundException('Item do carrinho não encontrado');
    }

    if (quantity <= 0) {
      // Remover item do carrinho
      await this.prisma.cartItem.delete({
        where: { id: cartItemId }
      });
      return { message: 'Item removido do carrinho' };
    }

    // Permitir qualquer quantidade sem verificar estoque
    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrls: true,
            stock: true
          }
        }
      }
    });
  }

  async removeFromCart(customerId: string, cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        customerId
      }
    });

    if (!cartItem) {
      throw new NotFoundException('Item do carrinho não encontrado');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    return { message: 'Item removido do carrinho' };
  }

  async clearCart(customerId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { customerId }
    });

    return { message: 'Carrinho limpo' };
  }

  // ==================== VALIDAÇÃO DO CARRINHO ====================

  async validateCart(customerId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { customerId },
      include: { product: true }
    });

    const issues = [];
    const validItems = [];

    for (const item of cartItems) {
      if (!item.product.isAvailable) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: 'Produto não está mais disponível'
        });
      } else {
        // Não verificar estoque - permitir qualquer quantidade
        validItems.push(item);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      validItems,
      totalItems: validItems.length,
      totalPrice: validItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0)
    };
  }

  // ==================== FINALIZAÇÃO DO CARRINHO ====================

  async checkout(
    customerId: string, 
    storeId: string,
    shippingInfo?: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      phone?: string;
    },
    additionalCosts?: {
      shippingCost?: number;
      insuranceCost?: number;
      tax?: number;
      discount?: number;
      couponCode?: string;
      notes?: string;
    }
  ) {
    // Garantir conexão com o banco antes de processar checkout
    await this.prisma.ensureConnection();

    // Verificar se há itens no carrinho antes de validar (com retry)
    const cartCount = await this.prisma.executeWithRetry(async () => {
      return await this.prisma.cartItem.count({
        where: { customerId }
      });
    });

    if (cartCount === 0) {
      throw new BadRequestException('Carrinho está vazio. Adicione produtos ao carrinho antes de finalizar o pedido.');
    }

    // Validar carrinho
    const validation = await this.validateCart(customerId);
    
    if (!validation.valid) {
      const issuesText = validation.issues.map(i => `${i.productName}: ${i.issue}`).join(', ');
      throw new BadRequestException(`Carrinho contém itens inválidos: ${issuesText}`);
    }

    if (validation.validItems.length === 0) {
      throw new BadRequestException('Carrinho está vazio. Adicione produtos ao carrinho antes de finalizar o pedido.');
    }

    // Validar se a loja existe
    let validStoreId = storeId;
    if (!storeId || storeId === 'default') {
      // Buscar a primeira loja ativa
      const firstStore = await this.prisma.store.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      
      if (!firstStore) {
        throw new BadRequestException('Nenhuma loja disponível. Entre em contato com o suporte.');
      }
      
      validStoreId = firstStore.id;
    } else {
      // Verificar se a loja existe e está ativa
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, isActive: true }
      });
      
      if (!store) {
        throw new BadRequestException(`Loja com ID ${storeId} não encontrada`);
      }
      
      if (!store.isActive) {
        throw new BadRequestException(`Loja com ID ${storeId} está inativa`);
      }
    }

    // Validar e aplicar cupom se fornecido
    let couponDiscount = 0;
    let couponId: string | undefined;
    
    if (additionalCosts?.couponCode) {
      try {
        // Buscar informações dos produtos para validação do cupom
        const firstProduct = validation.validItems[0]?.product;
        const categoryId = firstProduct?.category;
        
        const couponValidation = await this.couponsService.validate({
          code: additionalCosts.couponCode,
          totalAmount: validation.totalPrice,
          productId: validation.validItems.length === 1 ? validation.validItems[0].productId : undefined,
          categoryId: categoryId,
          storeId: validStoreId,
        }, customerId);
        
        couponDiscount = couponValidation.discount;
        couponId = couponValidation.coupon.id;
      } catch (error: any) {
        throw new BadRequestException(`Erro ao validar cupom: ${error.message}`);
      }
    }
    
    // Calcular total incluindo custos adicionais
    const subtotal = validation.totalPrice;
    const shippingCost = additionalCosts?.shippingCost || 0;
    const insuranceCost = additionalCosts?.insuranceCost || 0;
    const tax = additionalCosts?.tax || 0;
    const manualDiscount = additionalCosts?.discount || 0;
    const discount = couponDiscount + manualDiscount;
    const totalAmount = subtotal + shippingCost + insuranceCost + tax - discount;
    
    const isOnlineOrder = !!shippingInfo;
    
    // Criar venda com retry para garantir que seja criada mesmo se houver problemas de conexão
    const sale = await this.prisma.executeWithRetry(async () => {
      return await this.prisma.sale.create({
        data: {
          store: { connect: { id: validStoreId } },
          customer: { connect: { id: customerId } },
          employee: { connect: { id: customerId } }, // Cliente é o próprio vendedor
          saleNumber: `SALE-${Date.now()}`,
          totalAmount,
          discount: discount,
          tax: tax,
          status: isOnlineOrder ? 'PENDING' : 'PENDING',
          paymentMethod: 'PIX',
          isOnlineOrder,
          shippingAddress: shippingInfo?.address,
          shippingCity: shippingInfo?.city,
          shippingState: shippingInfo?.state,
          shippingZipCode: shippingInfo?.zipCode,
          shippingPhone: shippingInfo?.phone,
          notes: additionalCosts?.notes,
          items: {
            create: validation.validItems.map(item => ({
              product: { connect: { id: item.productId } },
              quantity: item.quantity,
              unitPrice: item.product.price,
              totalPrice: Number(item.product.price) * item.quantity
            }))
          }
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, price: true } }
            }
          },
          store: { select: { name: true, address: true } }
        }
      });
    });

    // Marcar cupom como usado se foi aplicado
    if (couponId) {
      try {
        await this.couponsService.markAsUsed(couponId, customerId, sale.id);
      } catch (error) {
        console.error('Erro ao marcar cupom como usado:', error);
        // Não falhar o checkout se houver erro ao marcar cupom como usado
      }
    }

    // Armazenar informações dos produtos para verificação posterior
    const productsToCheck: Array<{ id: string; name: string; stock: number; minStock: number; storeName?: string }> = [];

    // Atualizar estoque dos produtos (com retry)
    for (const item of validation.validItems) {
      await this.prisma.executeWithRetry(async () => {
        // Buscar produto antes de atualizar
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { 
            store: { select: { name: true } },
            storeInventory: {
              select: {
                id: true,
                quantity: true,
                storeId: true,
                store: {
                  select: {
                    id: true,
                    name: true,
                    isActive: true
                  }
                }
              }
            }
          }
        });

        if (!product) {
          return;
        }

        // Determinar de qual loja será tirado o estoque
        let targetStoreId = validStoreId;
        
        // Se for venda online, escolher a loja mais próxima do cliente
        if (isOnlineOrder && product.storeInventory && product.storeInventory.length > 0 && shippingInfo) {
          // Buscar todas as lojas de uma vez (mais eficiente)
          const storeIds = product.storeInventory
            .filter(inv => inv.store?.isActive)
            .map(inv => inv.storeId);
          
          const stores = await this.prisma.store.findMany({
            where: {
              id: { in: storeIds },
              isActive: true
            },
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              zipCode: true,
              address: true
            }
          });

          // Combinar inventário com dados da loja
          const storesWithAddress = product.storeInventory
            .filter(inv => inv.store?.isActive)
            .map(inv => {
              const store = stores.find(s => s.id === inv.storeId);
              return {
                inventory: inv,
                store: store
              };
            })
            .filter(item => item.store); // Remover lojas não encontradas

          // Função para calcular prioridade de proximidade
          const calculateProximityScore = (store: any) => {
            if (!store) return 999; // Prioridade baixa se não tiver dados
            
            let score = 0;
            
            // Prioridade 1: Mesma cidade E mesmo estado
            if (store.city?.toLowerCase() === shippingInfo.city?.toLowerCase() &&
                store.state?.toUpperCase() === shippingInfo.state?.toUpperCase()) {
              score = 1;
            }
            // Prioridade 2: Mesmo estado (diferente cidade)
            else if (store.state?.toUpperCase() === shippingInfo.state?.toUpperCase()) {
              score = 2;
            }
            // Prioridade 3: Estados diferentes
            else {
              score = 3;
            }
            
            return score;
          };

          // Filtrar lojas com estoque suficiente
          const storesWithStock = storesWithAddress
            .filter(storeItem => storeItem.inventory.quantity >= item.quantity)
            .map(storeItem => ({
              ...storeItem,
              proximityScore: calculateProximityScore(storeItem.store)
            }))
            .sort((a, b) => {
              // Ordenar por proximidade primeiro, depois por estoque
              if (a.proximityScore !== b.proximityScore) {
                return a.proximityScore - b.proximityScore;
              }
              return b.inventory.quantity - a.inventory.quantity;
            });

          if (storesWithStock.length > 0) {
            // Usar a loja mais próxima (mesma cidade > mesmo estado > qualquer outra)
            targetStoreId = storesWithStock[0].store?.id || storesWithStock[0].inventory.storeId;
            await this.prisma.sale.update({
              where: { id: sale.id },
              data: { storeId: targetStoreId }
            });
          } else {
            // Se nenhuma loja tem estoque suficiente, usar a mais próxima disponível
            const anyStore = storesWithAddress
              .map(storeItem => ({
                ...storeItem,
                proximityScore: calculateProximityScore(storeItem.store)
              }))
              .sort((a, b) => {
                if (a.proximityScore !== b.proximityScore) {
                  return a.proximityScore - b.proximityScore;
                }
                return b.inventory.quantity - a.inventory.quantity;
              })[0];
            
            if (anyStore) {
              targetStoreId = anyStore.store?.id || anyStore.inventory.storeId;
              await this.prisma.sale.update({
                where: { id: sale.id },
                data: { storeId: targetStoreId }
              });
            }
          }
        } else if (isOnlineOrder && product.storeInventory && product.storeInventory.length > 0) {
          // Fallback: se não tiver shippingInfo, usar loja com mais estoque
          const availableStores = product.storeInventory
            .filter(inv => inv.store?.isActive && inv.quantity >= item.quantity)
            .sort((a, b) => b.quantity - a.quantity);
          
          if (availableStores.length > 0) {
            targetStoreId = availableStores[0].storeId;
            await this.prisma.sale.update({
              where: { id: sale.id },
              data: { storeId: targetStoreId }
            });
          }
        }

        // Atualizar estoque no StoreInventory se o produto tiver
        if (product.storeInventory && product.storeInventory.length > 0) {
          const inventory = product.storeInventory.find(inv => inv.storeId === targetStoreId);
          
          if (inventory) {
            // Atualizar StoreInventory da loja específica
            const newQuantity = inventory.quantity - item.quantity;
            
            await this.prisma.storeInventory.update({
              where: { id: inventory.id },
              data: { quantity: Math.max(0, newQuantity) } // Não permitir negativo
            });

            // Atualizar também o estoque total do produto (soma de todas as lojas)
            const totalStock = product.storeInventory.reduce((sum, inv) => {
              if (inv.id === inventory.id) {
                return sum + Math.max(0, newQuantity);
              }
              return sum + inv.quantity;
            }, 0);

            await this.prisma.product.update({
              where: { id: item.productId },
              data: { stock: totalStock }
            });

            const targetStore = product.storeInventory.find(inv => inv.storeId === targetStoreId)?.store;
            
            productsToCheck.push({
              id: product.id,
              name: product.name,
              stock: Math.max(0, newQuantity),
              minStock: product.minStock || 0,
              storeName: targetStore?.name || 'Loja desconhecida'
            });
          } else {
            // Se não encontrou inventory para a loja, usar estoque do produto (fallback)
            const newStock = product.stock - item.quantity;
            await this.prisma.product.update({
              where: { id: item.productId },
              data: { stock: Math.max(0, newStock) }
            });

            productsToCheck.push({
              id: product.id,
              name: product.name,
              stock: Math.max(0, newStock),
              minStock: product.minStock || 0,
              storeName: product.store?.name
            });
          }
        } else {
          // Produto antigo sem StoreInventory - usar estoque direto
          const newStock = product.stock - item.quantity;
          await this.prisma.product.update({
            where: { id: item.productId },
            data: { stock: Math.max(0, newStock) }
          });

          productsToCheck.push({
            id: product.id,
            name: product.name,
            stock: Math.max(0, newStock),
            minStock: product.minStock || 0,
            storeName: product.store?.name
          });
        }
      });
    }

    // Limpar carrinho
    await this.clearCart(customerId);

    // Criar notificação de pedido criado para o cliente
    try {
      await this.notificationsService.notifyOrderCreated(
        customerId,
        sale.id,
        sale.saleNumber,
        Number(sale.totalAmount),
      );
    } catch (error) {
      console.error('Erro ao criar notificação de pedido:', error);
      // Não falhar a operação se a notificação falhar
    }

    // Se for pedido online, notificar usuários relevantes (assíncrono, não bloqueia a resposta)
    if (isOnlineOrder) {
      const customer = await this.prisma.user.findUnique({
        where: { id: customerId },
        select: { name: true }
      });

      this.notificationsService.notifyRelevantUsersNewOrderOnline(
        sale.id,
        sale.saleNumber,
        Number(sale.totalAmount),
        validStoreId,
        customer?.name,
        sale.store?.name
      ).catch(error => {
        console.error('Erro ao notificar usuários sobre novo pedido online:', error);
      });
    }

    // Verificar estoque dos produtos após a venda e notificar usuários relevantes se necessário (assíncrono)
    setImmediate(async () => {
      try {
        for (const productInfo of productsToCheck) {
          // Se o estoque zerou após a venda
          if (productInfo.stock === 0) {
            await this.notificationsService.notifyRelevantUsersOutOfStock(
              productInfo.id,
              productInfo.name,
              validStoreId,
              productInfo.storeName
            );
          }
          // Se o estoque está abaixo do mínimo
          else if (productInfo.stock > 0 && productInfo.stock <= productInfo.minStock) {
            await this.notificationsService.notifyRelevantUsersLowStock(
              productInfo.id,
              productInfo.name,
              productInfo.stock,
              productInfo.minStock,
              validStoreId,
              productInfo.storeName
            );
          }
        }
      } catch (error) {
        console.error('Erro ao verificar estoque após checkout:', error);
      }
    });

    return sale;
  }
}
