import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Sale, SaleStatus, SaleItem, Product, User, UserRole } from '@prisma/client';
import { CreateSaleDto, UpdateSaleDto } from '../dto/sale.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(createSaleDto: CreateSaleDto, currentUser: User): Promise<Sale> {
    // Apenas funcionários podem criar vendas
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    // Verificar se o cliente existe (se fornecido)
    if (createSaleDto.customerId) {
      const customer = await this.prisma.user.findUnique({ where: { id: createSaleDto.customerId } });
      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }
    }

    // Verificar se todos os produtos existem e têm estoque suficiente
    for (const item of createSaleDto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException(`Produto ${item.productId} não encontrado`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para o produto ${product.name}`);
      }
    }

    // Gerar número da venda
    const saleNumber = await this.generateSaleNumber();

    // Mapear paymentMethod (DTO usa minúsculo; Prisma enum usa MAIÚSCULO)
    const paymentMethodMap: Record<string, any> = {
      pix: 'PIX',
      credit_card: 'CREDIT_CARD',
      debit_card: 'DEBIT_CARD',
      cash: 'CASH',
      pending: 'PENDING',
    };
    const prismaPaymentMethod = paymentMethodMap[String(createSaleDto.paymentMethod)] || 'CASH';

    // Criar a venda com transação (timeout aumentado para 15 segundos)
    return this.prisma.$transaction(async (tx) => {
      // Preparar dados da venda
      const saleData: any = {
        saleNumber,
        totalAmount: createSaleDto.totalAmount,
        discount: createSaleDto.discount || 0,
        tax: createSaleDto.tax || 0,
        status: 'PENDING' as any,
        paymentMethod: prismaPaymentMethod as any,
        paymentReference: createSaleDto.paymentReference,
        notes: createSaleDto.notes,
        employeeId: currentUser.id,
        storeId: createSaleDto.storeId,
      };

      // Adicionar customerId apenas se fornecido e não for null/undefined
      if (createSaleDto.customerId && createSaleDto.customerId !== null && createSaleDto.customerId !== undefined) {
        saleData.customerId = createSaleDto.customerId;
      }

      // Criar a venda
      const sale = await tx.sale.create({
        data: saleData,
      });

      // Criar os itens da venda e atualizar estoque
      const productsToCheck: Array<{ id: string; name: string; stock: number; minStock: number; storeName?: string }> = [];
      
      // Determinar loja da venda (vendas diretas usam a loja do funcionário)
      const targetStoreId = currentUser.storeId || sale.storeId;
      
      for (const item of createSaleDto.items) {
        const product = await tx.product.findUnique({ 
          where: { id: item.productId },
          include: { 
            store: { select: { name: true } },
            storeInventory: {
              where: targetStoreId ? { storeId: targetStoreId } : undefined,
              select: {
                id: true,
                quantity: true,
                storeId: true,
                store: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });
        
        if (!product) {
          throw new NotFoundException(`Produto ${item.productId} não encontrado`);
        }

        // Calcular lucro se costPrice estiver disponível
        const costPrice = product.costPrice ? Number(product.costPrice) : null;
        const profit = costPrice !== null ? (item.unitPrice - costPrice) * item.quantity : null;
        
        await tx.saleItem.create({
          data: {
            ...item,
            saleId: sale.id,
            totalPrice: item.quantity * item.unitPrice,
            costPrice: costPrice,
            profit: profit,
          },
        });

        // Atualizar estoque no StoreInventory se disponível
        if (product.storeInventory && product.storeInventory.length > 0 && targetStoreId) {
          const inventory = product.storeInventory[0]; // Já filtrado por storeId
          
          if (inventory) {
            const newQuantity = inventory.quantity - item.quantity;
            
            await tx.storeInventory.update({
              where: { id: inventory.id },
              data: { quantity: Math.max(0, newQuantity) }
            });

            // Atualizar estoque total do produto (somar todos os inventários)
            const allInventories = await tx.storeInventory.findMany({
              where: { productId: item.productId }
            });
            const totalStock = allInventories.reduce((sum, inv) => {
              if (inv.id === inventory.id) {
                return sum + Math.max(0, newQuantity);
              }
              return sum + inv.quantity;
            }, 0);
            
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: totalStock }
            });

            productsToCheck.push({
              id: product.id,
              name: product.name,
              stock: Math.max(0, newQuantity),
              minStock: product.minStock || 0,
              storeName: inventory.store?.name || product.store?.name
            });
          } else {
            // Fallback: atualizar estoque direto
            const newStock = product.stock - item.quantity;
            await tx.product.update({
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
          // Produto sem StoreInventory ou sem loja específica - usar estoque direto
          const newStock = product.stock - item.quantity;
          await tx.product.update({
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
      }

      // Retornar a venda completa
      const saleWithDetails = await tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          employee: true,
          store: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Notificar usuários relevantes sobre nova venda (fora da transação, assíncrono)
      if (saleWithDetails) {
        // Usar setImmediate para executar fora da transação
        setImmediate(async () => {
          try {
            // Notificar ADMINs, MANAGERs e EMPLOYEEs relevantes
            await this.notificationsService.notifyRelevantUsersNewSale(
              saleWithDetails.id,
              saleWithDetails.saleNumber,
              Number(saleWithDetails.totalAmount),
              saleWithDetails.storeId,
              saleWithDetails.employeeId,
              saleWithDetails.customer?.name,
              saleWithDetails.store?.name
            );

            // Verificar estoque dos produtos vendidos e notificar se necessário
            for (const productInfo of productsToCheck) {
              // Se o estoque zerou após a venda
              if (productInfo.stock === 0) {
                await this.notificationsService.notifyRelevantUsersOutOfStock(
                  productInfo.id,
                  productInfo.name,
                  saleWithDetails.storeId,
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
                  saleWithDetails.storeId,
                  productInfo.storeName
                );
              }
            }
          } catch (error) {
            console.error('Erro ao notificar usuários sobre nova venda:', error);
          }
        });
      }

      return saleWithDetails;
    }, {
      timeout: 15000, // 15 segundos (aumentado de 5 segundos padrão)
      maxWait: 10000, // 10 segundos para esperar iniciar a transação
    });
  }

  async findAll(currentUser: User, storeId?: string): Promise<Sale[]> {
    const whereCondition: any = {};

    // Se não for admin, filtrar por loja
    if (currentUser.role !== UserRole.ADMIN) {
      whereCondition.storeId = currentUser.storeId;
    } else if (storeId) {
      whereCondition.storeId = storeId;
    }

    return this.prisma.sale.findMany({
      where: whereCondition,
      include: {
        customer: true,
        employee: true,
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: User): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        employee: true,
        store: true,
        items: {
          include: {
            product: true,
          },
          // Todos os campos de SaleItem são retornados automaticamente, incluindo profit e costPrice
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    // Verificar se o usuário tem acesso à venda
    if (currentUser.role !== UserRole.ADMIN && sale.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    return sale;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto, currentUser: User): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    // Verificar se o usuário tem acesso à venda
    if (currentUser.role !== UserRole.ADMIN && sale.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Apenas funcionários podem editar vendas
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    const oldStatus = String(sale.status).toUpperCase();
    
    // Preparar dados para atualização
    const updateData: any = {};
    
    // Converter status de minúsculas (DTO) para maiúsculas (Prisma enum)
    if (updateSaleDto.status) {
      const statusMap: Record<string, SaleStatus> = {
        pending: 'PENDING' as SaleStatus,
        completed: 'COMPLETED' as SaleStatus,
        cancelled: 'CANCELLED' as SaleStatus,
        refunded: 'REFUNDED' as SaleStatus,
        delivered: 'DELIVERED' as SaleStatus,
        preparing: 'PREPARING' as SaleStatus,
        shipped: 'SHIPPED' as SaleStatus,
      };
      
      const statusLower = String(updateSaleDto.status).toLowerCase();
      updateData.status = statusMap[statusLower];
      
      if (!updateData.status) {
        throw new BadRequestException(`Status inválido: ${updateSaleDto.status}`);
      }
    }
    
    // Adicionar outros campos apenas se não forem undefined
    if (updateSaleDto.paymentReference !== undefined) {
      updateData.paymentReference = updateSaleDto.paymentReference;
    }
    
    if (updateSaleDto.notes !== undefined) {
      updateData.notes = updateSaleDto.notes;
    }
    
    // Se está marcando como COMPLETED e é pedido online, definir deliveredAt
    if (updateData.status === 'COMPLETED' && sale.isOnlineOrder) {
      updateData.deliveredAt = new Date();
    }
    
    await this.prisma.sale.update({
      where: { id },
      data: updateData,
    });

    const updatedSale = await this.findOne(id, currentUser);

    // Criar notificação se o status mudou e houver cliente
    // Converter o status do DTO (que pode ser do TypeORM) para o formato do Prisma
    if (updatedSale.customerId && updateSaleDto.status) {
      // Converter ambos os status para uppercase para comparação
      const newStatusString = String(updateSaleDto.status).toUpperCase();
      const oldStatusString = oldStatus;
      
      if (newStatusString !== oldStatusString) {
        try {
          // Notificações específicas por status
          if (newStatusString === 'COMPLETED') {
            await this.notificationsService.notifyOrderStatusChanged(
              updatedSale.customerId,
              updatedSale.id,
              updatedSale.saleNumber,
              'COMPLETED',
            );
          } else if (newStatusString === 'DELIVERED') {
            await this.notificationsService.notifyOrderDelivered(
              updatedSale.customerId,
              updatedSale.id,
              updatedSale.saleNumber,
            );
          } else {
            await this.notificationsService.notifyOrderStatusChanged(
              updatedSale.customerId,
              updatedSale.id,
              updatedSale.saleNumber,
              newStatusString,
            );
          }
        } catch (error) {
          console.error('Erro ao criar notificação de status:', error);
          // Não falhar a operação se a notificação falhar
        }
      }
    }

    return updatedSale;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    // Verificar se o usuário tem acesso à venda
    if (currentUser.role !== UserRole.ADMIN && sale.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Apenas admins podem deletar vendas
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    // Restaurar estoque dos produtos
    for (const item of sale.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: product.stock + item.quantity,
          },
        });
      }
    }

    await this.prisma.sale.update({
      where: { id },
      data: { status: 'CANCELLED' as SaleStatus },
    });
  }

  async getSalesByCustomer(customerId: string, currentUser: User): Promise<Sale[]> {
    // Verificar se o usuário tem acesso aos dados do cliente
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== customerId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.sale.findMany({
      where: { customerId },
      include: {
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSalesByDateRange(startDate: Date, endDate: Date, currentUser: User, storeId?: string): Promise<Sale[]> {
    const whereCondition: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Se não for admin, filtrar por loja
    if (currentUser.role !== UserRole.ADMIN) {
      whereCondition.storeId = currentUser.storeId;
    } else if (storeId) {
      whereCondition.storeId = storeId;
    }

    return this.prisma.sale.findMany({
      where: whereCondition,
      include: {
        customer: true,
        employee: true,
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const prefix = `${year}${month}${day}`;
    
    // Buscar a última venda do dia
    const lastSale = await this.prisma.sale.findFirst({
      where: {
        saleNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { saleNumber: 'desc' },
    });

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}