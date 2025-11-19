import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { User } from '../entities/user.entity';
import { UserRole, CouponAssignmentType } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto, user: User) {
    // Verificar se o usuário tem permissão (ADMIN ou STORE_MANAGER)
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'STORE_MANAGER') {
      throw new ForbiddenException('Apenas administradores e gerentes podem criar cupons');
    }

    // Verificar se o código já existe
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { code: createCouponDto.code.toUpperCase() },
    });

    if (existingCoupon) {
      throw new BadRequestException('Código de cupom já existe');
    }

    // Validar datas
    // Converter para Date, tratando como UTC para evitar problemas de timezone
    const validFrom = new Date(createCouponDto.validFrom);
    const validUntil = new Date(createCouponDto.validUntil);
    const now = new Date();

    if (validUntil <= validFrom) {
      throw new BadRequestException('Data de validade deve ser posterior à data de início');
    }

    // Permitir criar cupons que já estão válidos (validFrom pode ser no passado)
    // Mas validUntil deve ser no futuro
    if (validUntil < now) {
      throw new BadRequestException('Data de validade não pode ser no passado');
    }

    // Validar valores
    if (createCouponDto.discountType === 'PERCENTAGE' && createCouponDto.discountValue > 100) {
      throw new BadRequestException('Desconto percentual não pode ser maior que 100%');
    }

    // Validar campos específicos baseado no tipo de aplicabilidade
    const applicableTo = createCouponDto.applicableTo || 'ALL';
    if (applicableTo === 'CATEGORY' && !createCouponDto.categoryId) {
      throw new BadRequestException('Categoria é obrigatória quando o cupom é aplicável a uma categoria específica');
    }
    if (applicableTo === 'PRODUCT' && !createCouponDto.productId) {
      throw new BadRequestException('Produto é obrigatório quando o cupom é aplicável a um produto específico');
    }
    if (applicableTo === 'STORE' && !createCouponDto.storeId) {
      throw new BadRequestException('Loja é obrigatória quando o cupom é aplicável a uma loja específica');
    }

    // Se for gerente, só pode criar cupons para sua loja
    let storeId = createCouponDto.storeId;
    if (userRole === 'STORE_MANAGER' && user.storeId) {
      if (createCouponDto.storeId && createCouponDto.storeId !== user.storeId) {
        throw new ForbiddenException('Gerente só pode criar cupons para sua própria loja');
      }
      storeId = user.storeId;
    }

    // Criar cupom
    const coupon = await this.prisma.coupon.create({
      data: {
        code: createCouponDto.code.toUpperCase(),
        description: createCouponDto.description,
        discountType: createCouponDto.discountType,
        discountValue: createCouponDto.discountValue,
        minimumPurchase: createCouponDto.minimumPurchase,
        maximumDiscount: createCouponDto.maximumDiscount,
        usageLimit: createCouponDto.usageLimit,
        validFrom,
        validUntil,
        applicableTo: createCouponDto.applicableTo || 'ALL',
        categoryId: createCouponDto.categoryId,
        productId: createCouponDto.productId,
        storeId,
        isActive: createCouponDto.isActive !== undefined ? createCouponDto.isActive : true,
        assignmentType: createCouponDto.assignmentType,
        couponType: createCouponDto.couponType,
        createdBy: user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return coupon;
  }

  async findAll(user: User, storeId?: string) {
    // Se for gerente, só pode ver cupons da sua loja
    let filterStoreId = storeId;
    const userRole = user.role?.toUpperCase();
    if (userRole === 'STORE_MANAGER' && user.storeId) {
      filterStoreId = user.storeId;
    }

    const where: any = {};
    if (filterStoreId) {
      where.storeId = filterStoreId;
    }

    const coupons = await this.prisma.coupon.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            couponUsages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return coupons.map(coupon => ({
      ...coupon,
      usedCount: coupon._count.couponUsages,
    }));
  }

  async findOne(id: string, user: User) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            couponUsages: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    // Se for gerente, só pode ver cupons da sua loja
    const userRole = user.role?.toUpperCase();
    if (userRole === 'STORE_MANAGER' && user.storeId && coupon.storeId !== user.storeId) {
      throw new ForbiddenException('Você não tem permissão para ver este cupom');
    }

    return {
      ...coupon,
      usedCount: coupon._count.couponUsages,
    };
  }

  async validate(validateCouponDto: ValidateCouponDto, userId?: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: validateCouponDto.code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    // Verificar se o usuário já usou este cupom (se fornecido)
    if (userId) {
      const existingUsage = await this.prisma.couponUsage.findFirst({
        where: {
          couponId: coupon.id,
          userId: userId,
        },
      });

      if (existingUsage) {
        throw new BadRequestException('Você já utilizou este cupom');
      }
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Cupom está inativo');
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    // Comparar datas considerando apenas data e hora, ignorando milissegundos
    const nowTime = now.getTime();
    const validFromTime = validFrom.getTime();
    const validUntilTime = validUntil.getTime();
    
    if (validFromTime > nowTime) {
      const diffMs = validFromTime - nowTime;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        throw new BadRequestException(`Cupom ainda não está válido. Válido a partir de ${validFrom.toLocaleString('pt-BR')}`);
      } else {
        throw new BadRequestException(`Cupom ainda não está válido. Válido em ${diffMinutes} minutos`);
      }
    }

    if (validUntilTime < nowTime) {
      throw new BadRequestException(`Cupom expirado em ${validUntil.toLocaleDateString('pt-BR')}`);
    }

    // Verificar limite de uso
    const usageCount = await this.prisma.couponUsage.count({
      where: { couponId: coupon.id },
    });

    if (coupon.usageLimit && usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Cupom atingiu o limite de uso');
    }

    // Verificar valor mínimo
    if (coupon.minimumPurchase && validateCouponDto.totalAmount < Number(coupon.minimumPurchase)) {
      throw new BadRequestException(
        `Valor mínimo da compra deve ser R$ ${Number(coupon.minimumPurchase).toFixed(2)}`
      );
    }

    // Verificar aplicabilidade
    if (coupon.applicableTo === 'PRODUCT' && validateCouponDto.productId !== coupon.productId) {
      throw new BadRequestException('Cupom não é válido para este produto');
    }

    if (coupon.applicableTo === 'CATEGORY' && validateCouponDto.categoryId !== coupon.categoryId) {
      throw new BadRequestException('Cupom não é válido para esta categoria');
    }

    if (coupon.applicableTo === 'STORE' && validateCouponDto.storeId !== coupon.storeId) {
      throw new BadRequestException('Cupom não é válido para esta loja');
    }

    // Verificar se é cupom de primeira compra e se o usuário já fez compras
    if (coupon.assignmentType === CouponAssignmentType.NEW_ACCOUNTS_ONLY && userId) {
      const hasMadePurchase = await this.prisma.sale.count({
        where: { customerId: userId }
      }) > 0;

      if (hasMadePurchase) {
        throw new BadRequestException('Este cupom é válido apenas para primeira compra');
      }
    }

    // Calcular desconto
    let discount = 0;
    
    // Se for cupom de frete, calcular desconto baseado no valor do frete
    if (coupon.couponType === 'SHIPPING') {
      const shippingAmount = validateCouponDto.shippingCost || 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (shippingAmount * Number(coupon.discountValue)) / 100;
        if (coupon.maximumDiscount && discount > Number(coupon.maximumDiscount)) {
          discount = Number(coupon.maximumDiscount);
        }
      } else {
        discount = Number(coupon.discountValue);
      }
      // Garantir que o desconto não seja maior que o valor do frete
      if (discount > shippingAmount) {
        discount = shippingAmount;
      }
    } else {
      // Para cupons de produto, calcular baseado no totalAmount
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (validateCouponDto.totalAmount * Number(coupon.discountValue)) / 100;
        if (coupon.maximumDiscount && discount > Number(coupon.maximumDiscount)) {
          discount = Number(coupon.maximumDiscount);
        }
      } else {
        discount = Number(coupon.discountValue);
      }
      // Garantir que o desconto não seja maior que o total
      if (discount > validateCouponDto.totalAmount) {
        discount = validateCouponDto.totalAmount;
      }
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        couponType: coupon.couponType, // Incluir tipo do cupom
      },
      discount: Math.round(discount * 100) / 100, // Arredondar para 2 casas decimais
      finalAmount: Math.max(0, validateCouponDto.totalAmount - discount),
    };
  }

  async update(id: string, updateData: Partial<CreateCouponDto>, user: User) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    // Verificar permissão
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'STORE_MANAGER') {
      throw new ForbiddenException('Apenas administradores e gerentes podem editar cupons');
    }

    // Se for gerente, só pode editar cupons da sua loja
    if (userRole === 'STORE_MANAGER' && user.storeId && coupon.storeId !== user.storeId) {
      throw new ForbiddenException('Você não tem permissão para editar este cupom');
    }

    const updatePayload: any = {};

    if (updateData.code) {
      const existingCoupon = await this.prisma.coupon.findUnique({
        where: { code: updateData.code.toUpperCase() },
      });
      if (existingCoupon && existingCoupon.id !== id) {
        throw new BadRequestException('Código de cupom já existe');
      }
      updatePayload.code = updateData.code.toUpperCase();
    }

    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.discountType) updatePayload.discountType = updateData.discountType;
    if (updateData.discountValue !== undefined) updatePayload.discountValue = updateData.discountValue;
    if (updateData.minimumPurchase !== undefined) updatePayload.minimumPurchase = updateData.minimumPurchase;
    if (updateData.maximumDiscount !== undefined) updatePayload.maximumDiscount = updateData.maximumDiscount;
    if (updateData.usageLimit !== undefined) updatePayload.usageLimit = updateData.usageLimit;
    if (updateData.validFrom) updatePayload.validFrom = new Date(updateData.validFrom);
    if (updateData.validUntil) updatePayload.validUntil = new Date(updateData.validUntil);
    if (updateData.applicableTo) updatePayload.applicableTo = updateData.applicableTo;
    if (updateData.categoryId !== undefined) updatePayload.categoryId = updateData.categoryId;
    if (updateData.productId !== undefined) updatePayload.productId = updateData.productId;
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
    if (updateData.assignmentType !== undefined) updatePayload.assignmentType = updateData.assignmentType;
    if (updateData.couponType !== undefined) updatePayload.couponType = updateData.couponType;

    return await this.prisma.coupon.update({
      where: { id },
      data: updatePayload,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getCustomerCoupons(customerId: string) {
    // Buscar cupons atribuídos ao cliente
    // Inclui cupons com assignmentType = ALL_ACCOUNTS ou NEW_ACCOUNTS_ONLY
    // Não inclui cupons EXCLUSIVE (esses precisam ser digitados)
    
    const now = new Date();
    
    // Verificar se o cliente já fez alguma compra (primeira compra)
    // Contar todas as vendas onde customerId não é null e está definido
    // Considerar qualquer venda, independente do status (exceto canceladas)
    const purchaseCount = await this.prisma.sale.count({
      where: { 
        customerId: customerId, // Comparação direta - Prisma já trata null automaticamente
        // Não considerar vendas canceladas
        status: {
          not: 'CANCELLED'
        }
      }
    });

    // Buscar algumas vendas para debug (apenas para logs)
    const sampleSales = await this.prisma.sale.findMany({
      where: { 
        customerId: customerId,
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        id: true,
        saleNumber: true,
        status: true,
        customerId: true,
        createdAt: true
      },
      take: 3,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const hasMadePurchase = purchaseCount > 0;
    const isFirstPurchase = !hasMadePurchase;

    console.log('🔍 Verificação de compras do cliente:', {
      customerId,
      purchaseCount,
      hasMadePurchase,
      isFirstPurchase,
      sampleSales: sampleSales.map(s => ({
        id: s.id,
        saleNumber: s.saleNumber,
        status: s.status,
        customerId: s.customerId,
        createdAt: s.createdAt
      }))
    });

    // Construir filtro de assignmentType
    const assignmentTypeFilter: CouponAssignmentType[] = [CouponAssignmentType.ALL_ACCOUNTS];
    if (isFirstPurchase) {
      assignmentTypeFilter.push(CouponAssignmentType.NEW_ACCOUNTS_ONLY);
    }

    console.log('🔍 Buscando cupons para cliente:', {
      customerId,
      isFirstPurchase,
      hasMadePurchase,
      assignmentTypeFilter,
      now: now.toISOString()
    });

    // Buscar cupons com ALL_ACCOUNTS ou NEW_ACCOUNTS_ONLY (se for primeira compra)
    // Não incluir cupons EXCLUSIVE (esses precisam ser digitados)
    // Não incluir cupons com assignmentType NULL (tratá-los como EXCLUSIVE por padrão)
    // Se o cliente já fez compras, buscar apenas ALL_ACCOUNTS
    const whereClause: any = {
      isActive: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
      assignmentType: {
        in: hasMadePurchase 
          ? [CouponAssignmentType.ALL_ACCOUNTS] 
          : assignmentTypeFilter
      }
    };

    console.log('🔍 Query where clause:', JSON.stringify(whereClause, null, 2));

    const coupons = await this.prisma.coupon.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            couponUsages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📋 Cupons encontrados antes do filtro:', coupons.length, coupons.map(c => ({
      code: c.code,
      assignmentType: c.assignmentType,
      isActive: c.isActive,
      validFrom: c.validFrom.toISOString(),
      validUntil: c.validUntil.toISOString(),
      usageLimit: c.usageLimit,
      usedCount: c._count.couponUsages
    })));

    // Filtrar cupons
    const filteredCoupons = coupons
      .filter(coupon => {
        // PROTEÇÃO CRÍTICA: Remover cupons NEW_ACCOUNTS_ONLY se o cliente já fez compras
        // Esta é uma verificação dupla de segurança além da query
        if (coupon.assignmentType === CouponAssignmentType.NEW_ACCOUNTS_ONLY) {
          if (hasMadePurchase || purchaseCount > 0) {
            console.log('🚫 CUPOM NEW_ACCOUNTS_ONLY REMOVIDO - Cliente já fez compras:', {
              couponCode: coupon.code,
              couponId: coupon.id,
              isFirstPurchase,
              hasMadePurchase,
              purchaseCount,
              customerId
            });
            return false;
          } else {
            console.log('✅ Cupom NEW_ACCOUNTS_ONLY permitido - primeira compra:', {
              couponCode: coupon.code,
              purchaseCount
            });
          }
        }
        
        // Filtrar cupons que não atingiram o limite de uso
        if (!coupon.usageLimit) return true;
        const canUse = coupon._count.couponUsages < coupon.usageLimit;
        if (!canUse) {
          console.log('⚠️ Cupom excluído por limite de uso:', coupon.code, {
            used: coupon._count.couponUsages,
            limit: coupon.usageLimit
          });
        }
        return canUse;
      })
      .map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minimumPurchase: coupon.minimumPurchase ? Number(coupon.minimumPurchase) : undefined,
        maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : undefined,
        usageLimit: coupon.usageLimit,
        usedCount: coupon._count.couponUsages,
        isActive: coupon.isActive,
        validFrom: coupon.validFrom.toISOString(),
        validUntil: coupon.validUntil.toISOString(),
        applicableTo: coupon.applicableTo,
        categoryId: coupon.categoryId,
        productId: coupon.productId,
        storeId: coupon.storeId,
        assignmentType: coupon.assignmentType,
        couponType: coupon.couponType,
        createdAt: coupon.createdAt.toISOString(),
      }));

    console.log('✅ Cupons retornados para o cliente:', {
      total: filteredCoupons.length,
      cupons: filteredCoupons.map(c => ({
        code: c.code,
        assignmentType: c.assignmentType,
        description: c.description
      })),
      hasNewAccountsOnly: filteredCoupons.some(c => c.assignmentType === 'NEW_ACCOUNTS_ONLY'),
      customerId,
      purchaseCount,
      hasMadePurchase
    });
    
    // VERIFICAÇÃO FINAL DE SEGURANÇA: Se ainda houver cupons NEW_ACCOUNTS_ONLY e o cliente já fez compras, remover
    const finalCoupons = filteredCoupons.filter(coupon => {
      if (coupon.assignmentType === 'NEW_ACCOUNTS_ONLY' && (hasMadePurchase || purchaseCount > 0)) {
        console.error('❌ ERRO CRÍTICO: Cupom NEW_ACCOUNTS_ONLY ainda presente após filtro!', {
          couponCode: coupon.code,
          purchaseCount,
          hasMadePurchase
        });
        return false;
      }
      return true;
    });
    
    if (finalCoupons.length !== filteredCoupons.length) {
      console.warn('⚠️ Cupons adicionais removidos na verificação final:', {
        antes: filteredCoupons.length,
        depois: finalCoupons.length
      });
    }
    
    return finalCoupons;
  }

  async remove(id: string, user: User) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    // Verificar permissão
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'STORE_MANAGER') {
      throw new ForbiddenException('Apenas administradores e gerentes podem deletar cupons');
    }

    // Se for gerente, só pode deletar cupons da sua loja
    if (userRole === 'STORE_MANAGER' && user.storeId && coupon.storeId !== user.storeId) {
      throw new ForbiddenException('Você não tem permissão para deletar este cupom');
    }

    await this.prisma.coupon.delete({
      where: { id },
    });

    return { message: 'Cupom deletado com sucesso' };
  }

  async markAsUsed(couponId: string, userId: string, saleId?: string) {
    await this.prisma.couponUsage.create({
      data: {
        couponId,
        userId,
        saleId,
      },
    });

    // Atualizar contador de uso
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  }
}

