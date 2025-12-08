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

  async addToCart(
    customerId: string,
    productId: string,
    quantity: number = 1,
    displayStoreInfo?: {
      storeId?: string;
      storeName?: string;
      storeAddress?: string;
    }
  ) {
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
        data: {
          quantity: newQuantity,
          // Atualizar informações de display da loja se fornecidas
          ...(displayStoreInfo && {
            displayStoreId: displayStoreInfo.storeId,
            displayStoreName: displayStoreInfo.storeName,
            displayStoreAddress: displayStoreInfo.storeAddress,
          })
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
    } else {
      // Adicionar novo item ao carrinho
      cartItem = await this.prisma.cartItem.create({
        data: {
          customerId,
          productId,
          quantity,
          // Incluir informações de display da loja se fornecidas
          ...(displayStoreInfo && {
            displayStoreId: displayStoreInfo.storeId,
            displayStoreName: displayStoreInfo.storeName,
            displayStoreAddress: displayStoreInfo.storeAddress,
          })
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
      select: {
        id: true,
        quantity: true,
        displayStoreId: true,
        displayStoreName: true,
        displayStoreAddress: true,
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
            // Campos de Oferta Normal
            isOnSale: true,
            salePrice: true,
            saleDiscountPercent: true,
            saleStartDate: true,
            saleEndDate: true,
            // Campos de Oferta Relâmpago
            isFlashSale: true,
            flashSalePrice: true,
            flashSaleDiscountPercent: true,
            flashSaleStartDate: true,
            flashSaleEndDate: true,
            store: {
              select: {
                id: true,
                name: true,
                address: true,
                zipCode: true,
                city: true,
                state: true,
              },
            },
            storeInventory: {
              select: {
                storeId: true,
                quantity: true,
                store: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    zipCode: true,
                    city: true,
                    state: true,
                    isActive: true,
                  },
                },
              },
            },
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

    // Para itens que não têm informações de display da loja, determinar automaticamente
    const updatedCartItems = await Promise.all(
      cartItems.map(async (cartItem) => {
        // Se já tem informações de display válidas, retornar como está
        if (cartItem.displayStoreId && cartItem.displayStoreName && cartItem.displayStoreId.trim() !== '' && cartItem.displayStoreName.trim() !== '') {
          console.log(`🛒 [getCart] Item ${cartItem.product.id} já tem displayStore: ${cartItem.displayStoreName}`);
          return cartItem;
        }

        console.log(`🛒 [getCart] Item ${cartItem.product.id} não tem displayStore válido, determinando automaticamente`);

        console.log(`🛒 [getCart] Item ${cartItem.product.id} não tem displayStore, determinando automaticamente`);

        // Determinar loja automaticamente baseada no storeInventory
        let storeInfo = null;

        if (cartItem.product.storeInventory && Array.isArray(cartItem.product.storeInventory) && cartItem.product.storeInventory.length > 0) {
          // Filtrar lojas ativas com estoque suficiente
          const availableStores = cartItem.product.storeInventory
            .filter((inv: any) => inv.store?.isActive && inv.quantity >= cartItem.quantity && inv.store?.name)
            .sort((a: any, b: any) => b.quantity - a.quantity); // Priorizar lojas com mais estoque

          if (availableStores.length > 0) {
            const selectedStore = availableStores[0];
            storeInfo = {
              storeId: selectedStore.storeId,
              storeName: selectedStore.store?.name,
              storeAddress: selectedStore.store?.address
            };
          } else {
            // Fallback: primeira loja ativa disponível
            const anyStore = cartItem.product.storeInventory.find((inv: any) => inv.store?.isActive && inv.store?.name);
            if (anyStore) {
              storeInfo = {
                storeId: anyStore.storeId,
                storeName: anyStore.store?.name,
                storeAddress: anyStore.store?.address
              };
            }
          }
        }

        // Se encontrou informações da loja, atualizar o item no banco
        if (storeInfo) {
          console.log(`🛒 [getCart] Atualizando item ${cartItem.id} com loja:`, storeInfo);

          await this.prisma.cartItem.update({
            where: { id: cartItem.id },
            data: {
              displayStoreId: storeInfo.storeId,
              displayStoreName: storeInfo.storeName,
              displayStoreAddress: storeInfo.storeAddress,
            }
          });

          // Retornar item atualizado
          return {
            ...cartItem,
            displayStoreId: storeInfo.storeId,
            displayStoreName: storeInfo.storeName,
            displayStoreAddress: storeInfo.storeAddress,
          };
        }

        return cartItem;
      })
    );

    // Recalcular totais com os itens atualizados
    const finalCartItems = updatedCartItems;
    const finalTotalItems = finalCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const finalTotalPrice = finalCartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

    // Log para debug - verificar se storeInventory está sendo retornado
    finalCartItems.forEach((item) => {
      console.log(`🛒 Produto ${item.product.id}: storeId=${item.product.storeId}, storeInventory.length=${item.product.storeInventory?.length || 0}, displayStoreId=${item.displayStoreId}`);
      if (item.product.storeInventory && item.product.storeInventory.length > 0) {
        item.product.storeInventory.forEach((inv: any) => {
          console.log(`  └─ Loja ${inv.storeId}: estoque=${inv.quantity}, ativa=${inv.store?.isActive}`);
        });
      }
    });

    return {
      items: finalCartItems,
      summary: {
        totalItems: finalTotalItems,
        totalPrice: finalTotalPrice,
        itemCount: finalCartItems.length
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

  // ==================== FUNÇÃO AUXILIAR PARA CALCULAR PREÇO ATUAL ====================
  
  /**
   * Calcula o preço atual do produto considerando ofertas relâmpago e ofertas normais
   */
  private calculateCurrentPrice(product: any): number {
    const originalPrice = Number(product.price);
    const now = new Date();

    // Prioridade para oferta relâmpago - verificar se está ativa
    if (product.isFlashSale && product.flashSaleStartDate && product.flashSaleEndDate) {
      try {
        const flashStart = new Date(product.flashSaleStartDate);
        const flashEnd = new Date(product.flashSaleEndDate);
        
        // Verificar se a oferta relâmpago está ativa (já começou e ainda não expirou)
        if (now >= flashStart && now <= flashEnd) {
          // Se tem flashSalePrice, usar ele
          if (product.flashSalePrice !== undefined && product.flashSalePrice !== null) {
            return Number(product.flashSalePrice);
          }
          // Se não tem flashSalePrice mas tem flashSaleDiscountPercent, calcular
          if (product.flashSaleDiscountPercent !== undefined && product.flashSaleDiscountPercent !== null && originalPrice) {
            const discount = (originalPrice * Number(product.flashSaleDiscountPercent)) / 100;
            return originalPrice - discount;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar oferta relâmpago:', error);
        // Continuar com outras verificações se houver erro
      }
    }

    // Depois verificar oferta normal - apenas se estiver ativa
    if (product.isOnSale && product.saleStartDate && product.saleEndDate) {
      try {
        const saleStart = new Date(product.saleStartDate);
        const saleEnd = new Date(product.saleEndDate);
        
        if (now >= saleStart && now <= saleEnd) {
          // Se tem salePrice, usar ele
          if (product.salePrice !== undefined && product.salePrice !== null) {
            return Number(product.salePrice);
          }
          // Se não tem salePrice mas tem saleDiscountPercent, calcular
          if (product.saleDiscountPercent !== undefined && product.saleDiscountPercent !== null && originalPrice) {
            const discount = (originalPrice * Number(product.saleDiscountPercent)) / 100;
            return originalPrice - discount;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar oferta normal:', error);
        // Continuar com preço original se houver erro
      }
    }

    return originalPrice;
  }

  // ==================== VALIDAÇÃO DO CARRINHO ====================

  async validateCart(customerId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { customerId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isAvailable: true,
            costPrice: true,
            // Campos de Oferta Normal
            isOnSale: true,
            salePrice: true,
            saleDiscountPercent: true,
            saleStartDate: true,
            saleEndDate: true,
            // Campos de Oferta Relâmpago
            isFlashSale: true,
            flashSalePrice: true,
            flashSaleDiscountPercent: true,
            flashSaleStartDate: true,
            flashSaleEndDate: true,
          }
        }
      }
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

    // Calcular totalPrice usando preços com desconto de ofertas
    const totalPrice = validItems.reduce((sum, item) => {
      const currentPrice = this.calculateCurrentPrice(item.product);
      return sum + (currentPrice * item.quantity);
    }, 0);

    return {
      valid: issues.length === 0,
      issues,
      validItems,
      totalItems: validItems.length,
      totalPrice
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
      frontendSubtotal?: number; // Subtotal calculado no frontend para garantir consistência
      productIds?: string[]; // Produtos selecionados no checkout
      storeInfo?: { // Informações da loja como exibidas no carrinho
        name?: string;
        address?: string;
      };
    }
  ) {
    console.log('[Checkout Debug] Iniciando checkout com dados:', {
      customerId,
      storeId,
      storeInfo: additionalCosts?.storeInfo,
      productIds: additionalCosts?.productIds
    });

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

    // Filtrar apenas os produtos selecionados (se fornecido)
    let selectedItems = validation.validItems;
    if (additionalCosts?.productIds && additionalCosts.productIds.length > 0) {
      const selectedSet = new Set(additionalCosts.productIds);
      selectedItems = validation.validItems.filter(item => selectedSet.has(item.productId));

      if (selectedItems.length === 0) {
        throw new BadRequestException('Nenhum produto selecionado encontrado no carrinho.');
      }
    }

    // Guardar snapshot dos itens NÃO selecionados para garantir que permaneçam no carrinho
    const nonSelectedItems = validation.validItems.filter(
      item => !selectedItems.some(si => si.productId === item.productId)
    );

    // Subtotal original apenas dos produtos selecionados (para logs/validações)
    const selectedSubtotalOriginal = selectedItems.reduce((sum, item) => {
      const currentPrice = this.calculateCurrentPrice(item.product);
      return sum + (currentPrice * item.quantity);
    }, 0);

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

    // Validar cupom se fornecido (apenas para validação, não para recalcular desconto)
    let couponId: string | undefined;
    const frontendDiscount = additionalCosts?.discount || 0;
    
    if (additionalCosts?.couponCode) {
      try {
        // Validar o cupom para garantir que é válido
        // IMPORTANTE: Não vamos recalcular o desconto aqui, vamos usar o que o frontend passou
        const firstProduct = validation.validItems[0]?.product;
        const categoryId = firstProduct?.category;
        
        const couponValidation = await this.couponsService.validate({
          code: additionalCosts.couponCode,
          totalAmount: selectedSubtotalOriginal,
          productId: selectedItems.length === 1 ? selectedItems[0].productId : undefined,
          categoryId: categoryId,
          storeId: validStoreId,
        }, customerId);
        
        couponId = couponValidation.coupon.id;
        // Não usar couponValidation.discount - usar o desconto do frontend que já foi calculado corretamente
      } catch (error: any) {
        throw new BadRequestException(`Erro ao validar cupom: ${error.message}`);
      }
    }
    
    const shippingCost = additionalCosts?.shippingCost || 0;
    const insuranceCost = additionalCosts?.insuranceCost || 0;
    const tax = Math.round((additionalCosts?.tax || 0) * 100) / 100; // Arredondar tax para 2 casas decimais
    
    // IMPORTANTE: Se há cupom, o desconto já foi calculado e passado pelo frontend
    // Não devemos recalcular ou somar novamente
    // Se não há cupom mas há desconto manual, usar esse desconto
    let discount = 0;
    if (additionalCosts?.couponCode) {
      // Se há cupom, usar o desconto do frontend (já calculado corretamente)
      // O frontend já calculou o desconto baseado no subtotal correto
      discount = frontendDiscount;
      console.log('[Checkout] Usando desconto do frontend para cupom:', {
        couponCode: additionalCosts.couponCode,
        frontendDiscount,
        discount,
      });
    } else if (additionalCosts?.discount) {
      // Se não há cupom mas há desconto manual, usar esse desconto
      discount = additionalCosts.discount;
      console.log('[Checkout] Usando desconto manual:', discount);
    } else {
      console.log('[Checkout] Nenhum desconto aplicado');
    }
    
    const isOnlineOrder = !!shippingInfo;
    
    // Buscar produtos atualizados do banco antes de criar a venda para garantir dados de oferta relâmpago atualizados
    const itemsData = await Promise.all(selectedItems.map(async (item) => {
      // Buscar produto novamente do banco para garantir dados atualizados (incluindo oferta relâmpago)
      const freshProduct = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          price: true,
          costPrice: true,
          isOnSale: true,
          salePrice: true,
          saleDiscountPercent: true,
          saleStartDate: true,
          saleEndDate: true,
          isFlashSale: true,
          flashSalePrice: true,
          flashSaleDiscountPercent: true,
          flashSaleStartDate: true,
          flashSaleEndDate: true,
        }
      });
      
      // Usar produto atualizado do banco se disponível, senão usar o da validação
      const productToUse = freshProduct || item.product;
      
      // Usar preço atual considerando ofertas relâmpago e ofertas normais
      const unitPrice = this.calculateCurrentPrice(productToUse);
      const costPrice = productToUse.costPrice ? Number(productToUse.costPrice) : null;
      const totalPrice = unitPrice * item.quantity;
      const profit = costPrice !== null ? (unitPrice - costPrice) * item.quantity : null;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        costPrice: costPrice,
        profit: profit,
      };
    }));
    
    // Recalcular subtotal usando os preços atualizados dos produtos buscados do banco
    const subtotalRecalculado = itemsData.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // IMPORTANTE: Se o frontend passou um subtotal, usar esse valor para garantir consistência
    // Isso evita diferenças causadas por recálculo de preços (ofertas relâmpago, etc)
    // O desconto foi calculado baseado no subtotal do frontend, então devemos usar esse subtotal
    const subtotal = additionalCosts?.frontendSubtotal || subtotalRecalculado;
    
    // Preparar itens para criar na venda (sem propriedades extras)
    const itemsToCreate = itemsData.map(item => ({
      product: { connect: { id: item.productId } },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      costPrice: item.costPrice,
      profit: item.profit,
    }));
    
    // Calcular total incluindo custos adicionais
    // IMPORTANTE: O desconto já foi calculado e passado pelo frontend
    // Não devemos recalcular ou aplicar novamente aqui
    const totalAmount = subtotal + shippingCost + insuranceCost + tax - discount;
    
    // Calcular o total esperado do frontend para comparação
    const totalEsperadoFrontend = (additionalCosts?.frontendSubtotal || subtotal) + shippingCost + insuranceCost + tax - frontendDiscount;
    
    // Log detalhado para depuração
    console.log('[Checkout] Cálculo do total - DETALHADO:', {
      'selectedSubtotalOriginal': selectedSubtotalOriginal,
      'frontendSubtotal recebido': additionalCosts?.frontendSubtotal,
      'subtotal recalculado': subtotalRecalculado,
      'subtotal usado no cálculo': subtotal,
      'diferença subtotal vs original': subtotal - selectedSubtotalOriginal,
      shippingCost,
      insuranceCost,
      tax,
      'discount aplicado': discount,
      'frontendDiscount recebido': frontendDiscount,
      'totalAmount calculado': totalAmount,
      'totalAmount esperado (frontend)': totalEsperadoFrontend,
      'diferença entre calculado e esperado': totalAmount - totalEsperadoFrontend,
      couponCode: additionalCosts?.couponCode,
      hasCoupon: !!additionalCosts?.couponCode,
      'itens selecionados': selectedItems.length,
    });
    
    // Verificar se há diferença significativa e alertar
    if (Math.abs(totalAmount - totalEsperadoFrontend) > 0.01) {
      console.error('[Checkout] ⚠️ ATENÇÃO: Diferença entre total calculado e esperado!', {
        totalAmount,
        totalEsperadoFrontend,
        diferenca: totalAmount - totalEsperadoFrontend,
      });
    }
    

    // Criar venda com retry para garantir que seja criada mesmo se houver problemas de conexão
    const sale = await this.prisma.executeWithRetry(async () => {
      return await this.prisma.sale.create({
        data: {
          store: { connect: { id: validStoreId } },
          customer: { connect: { id: customerId } },
          employee: { connect: { id: customerId } }, // Cliente é o próprio vendedor
          saleNumber: `SALE-${Date.now()}`,
          totalAmount: Number(totalAmount.toFixed(2)), // Garantir 2 casas decimais
          discount: Number(discount.toFixed(2)), // Garantir 2 casas decimais
          tax: Number(tax.toFixed(2)), // Garantir 2 casas decimais
          status: isOnlineOrder ? 'PENDING' : 'PENDING',
          paymentMethod: 'PIX',
          isOnlineOrder,
          shippingAddress: shippingInfo?.address,
          shippingCity: shippingInfo?.city,
          shippingState: shippingInfo?.state,
          shippingZipCode: shippingInfo?.zipCode,
          shippingPhone: shippingInfo?.phone,
          notes: additionalCosts?.notes,
          // Salvar informações da loja como exibidas no carrinho para consistência
          storeDisplayName: additionalCosts?.storeInfo?.name,
          storeDisplayAddress: additionalCosts?.storeInfo?.address,
          items: {
            create: itemsToCreate
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

    // Enviar notificação de pagamento pendente se o pedido está PENDING
    if (sale.status === 'PENDING') {
      try {
        await this.notificationsService.notifyPaymentPending(
          customerId,
          sale.id,
          sale.saleNumber,
          Number(sale.totalAmount),
        );
      } catch (error) {
        console.error('Erro ao enviar notificação de pagamento pendente:', error);
        // Não falhar o checkout se houver erro ao enviar notificação
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

    // Remover apenas os produtos que foram incluídos no pedido do carrinho
    // Isso preserva os produtos não selecionados que ainda estão no carrinho
    // validation.validItems contém apenas os produtos que foram processados no pedido
    const productIdsInOrder = new Set(selectedItems.map(item => item.productId));
    
    // Buscar todos os itens do carrinho para verificar quais remover
    const allCartItems = await this.prisma.cartItem.findMany({
      where: { customerId },
      include: { product: { select: { id: true } } }
    });
    
    // Remover apenas os itens que foram incluídos no pedido
    for (const cartItem of allCartItems) {
      if (productIdsInOrder.has(cartItem.productId)) {
        // Verificar se a quantidade do item no carrinho foi totalmente usada no pedido
        const orderItem = selectedItems.find(item => item.productId === cartItem.productId);
        if (orderItem) {
          // Se a quantidade do pedido é maior ou igual à do carrinho, remover o item
          // Se for menor, reduzir a quantidade
          if (orderItem.quantity >= cartItem.quantity) {
            await this.prisma.cartItem.delete({
              where: { id: cartItem.id }
            });
          } else {
            // Reduzir quantidade do item no carrinho
            await this.prisma.cartItem.update({
              where: { id: cartItem.id },
              data: { quantity: cartItem.quantity - orderItem.quantity }
            });
          }
        }
      }
    }

    // Garantir que os itens não selecionados permaneçam (repor se necessário)
    for (const item of nonSelectedItems) {
      // Tentar encontrar novamente no carrinho (pode ter sido removido por engano)
      const existing = await this.prisma.cartItem.findFirst({
        where: { customerId, productId: item.productId }
      });

      if (existing) {
        // Atualizar quantidade para a original se tiver sido alterada
        if (existing.quantity !== item.quantity) {
          await this.prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: item.quantity }
          });
        }
      } else {
        // Recriar item não selecionado
        await this.prisma.cartItem.create({
          data: {
            customerId,
            productId: item.productId,
            quantity: item.quantity
          }
        });
      }
    }

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
