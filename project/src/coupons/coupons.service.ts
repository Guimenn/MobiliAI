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

    // Validar se a loja existe (se applicableTo for STORE)
    if (applicableTo === 'STORE' && storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, name: true, isActive: true }
      });

      if (!store) {
        throw new BadRequestException(`Loja com ID "${storeId}" não foi encontrada. Por favor, selecione uma loja válida.`);
      }

      if (!store.isActive) {
        throw new BadRequestException(`A loja "${store.name}" está inativa. Por favor, selecione uma loja ativa.`);
      }

      console.log('✅ Loja validada para cupom:', {
        storeId: store.id,
        storeName: store.name,
        isActive: store.isActive
      });
    }

    // Criar cupom
    console.log('💾 Salvando cupom no banco:', {
      code: createCouponDto.code.toUpperCase(),
      applicableTo: createCouponDto.applicableTo || 'ALL',
      storeId: storeId,
      storeIdType: typeof storeId,
      categoryId: createCouponDto.categoryId,
      productId: createCouponDto.productId
    });

    // Garantir que storeId seja uma string válida ou null
    let finalStoreId: string | null = null;
    if (applicableTo === 'STORE' && storeId) {
      finalStoreId = String(storeId).trim();
      if (finalStoreId === '' || finalStoreId === 'null' || finalStoreId === 'undefined') {
        finalStoreId = null;
      }
    } else if (applicableTo !== 'STORE') {
      finalStoreId = null;
    }

    console.log('💾 Salvando cupom no banco:', {
      code: createCouponDto.code.toUpperCase(),
      applicableTo: createCouponDto.applicableTo || 'ALL',
      storeId: finalStoreId,
      storeIdType: typeof finalStoreId,
      storeIdOriginal: storeId,
      categoryId: createCouponDto.categoryId,
      productId: createCouponDto.productId
    });

    // Se for cupom de primeira compra, garantir que o limite seja 1
    const finalUsageLimit = createCouponDto.assignmentType === 'NEW_ACCOUNTS_ONLY' 
      ? 1 
      : createCouponDto.usageLimit;

    const coupon = await this.prisma.coupon.create({
      data: {
        code: createCouponDto.code.toUpperCase(),
        description: createCouponDto.description,
        discountType: createCouponDto.discountType,
        discountValue: createCouponDto.discountValue,
        minimumPurchase: createCouponDto.minimumPurchase,
        maximumDiscount: createCouponDto.maximumDiscount,
        usageLimit: finalUsageLimit,
        validFrom,
        validUntil,
        applicableTo: createCouponDto.applicableTo || 'ALL',
        categoryId: createCouponDto.categoryId,
        productId: createCouponDto.productId,
        storeId: finalStoreId,
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

    console.log('✅ Cupom criado com sucesso:', {
      id: coupon.id,
      code: coupon.code,
      applicableTo: coupon.applicableTo,
      storeId: coupon.storeId,
      storeName: coupon.store?.name || 'Loja não encontrada',
      storeExists: !!coupon.store
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

    const mappedCoupons = coupons.map(coupon => ({
      ...coupon,
      usedCount: coupon._count.couponUsages,
    }));

    // Log para debug de cupons de loja
    const storeCoupons = mappedCoupons.filter(c => c.applicableTo === 'STORE');
    if (storeCoupons.length > 0) {
      console.log('🏪 Cupons de loja encontrados:', storeCoupons.map(c => ({
        code: c.code,
        storeId: c.storeId,
        storeName: c.store?.name || 'NÃO ENCONTRADA',
        storeExists: !!c.store,
        storeIdType: typeof c.storeId
      })));
    }

    return mappedCoupons;
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

    console.log('🔍 Iniciando validação de cupom:');
    console.log('  - Código:', coupon.code);
    console.log('  - applicableTo:', coupon.applicableTo);
    console.log('  - couponStoreId (raw):', coupon.storeId);
    console.log('  - couponCategoryId:', coupon.categoryId);
    console.log('  - couponProductId:', coupon.productId);
    console.log('  - requestStoreId (raw):', validateCouponDto.storeId);
    console.log('  - requestCategoryId:', validateCouponDto.categoryId);
    console.log('  - requestProductId:', validateCouponDto.productId);

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

    // Verificar limite de uso por cliente (se fornecido)
    if (userId && coupon.usageLimit) {
      const userUsageCount = await this.prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: userId,
        },
      });

      if (userUsageCount >= coupon.usageLimit) {
        throw new BadRequestException(
          `Você já utilizou este cupom o máximo de ${coupon.usageLimit} vez${coupon.usageLimit > 1 ? 'es' : ''} permitida${coupon.usageLimit > 1 ? 's' : ''}`
        );
      }
    }

    // Verificar valor mínimo
    if (coupon.minimumPurchase && validateCouponDto.totalAmount < Number(coupon.minimumPurchase)) {
      throw new BadRequestException(
        `Valor mínimo da compra deve ser R$ ${Number(coupon.minimumPurchase).toFixed(2)}`
      );
    }

    // Verificar aplicabilidade
    // IMPORTANTE: Verificar o tipo de aplicabilidade do cupom primeiro
    console.log('🔍 Verificando aplicabilidade do cupom:', {
      applicableTo: coupon.applicableTo,
      couponProductId: coupon.productId,
      couponCategoryId: coupon.categoryId,
      couponStoreId: coupon.storeId,
      requestProductId: validateCouponDto.productId,
      requestCategoryId: validateCouponDto.categoryId,
      requestStoreId: validateCouponDto.storeId
    });

    if (coupon.applicableTo === 'PRODUCT') {
      if (!validateCouponDto.productId) {
        throw new BadRequestException('Este cupom é válido apenas para um produto específico. Por favor, adicione o produto correto ao carrinho.');
      }
      if (validateCouponDto.productId !== coupon.productId) {
        throw new BadRequestException(`Cupom não é válido para este produto. Este cupom é válido apenas para o produto com ID "${coupon.productId}".`);
      }
    }

    if (coupon.applicableTo === 'CATEGORY') {
      // Normalizar valores para comparação (trim, uppercase, tratar null/undefined)
      const couponCategoryId = coupon.categoryId?.toString().trim().toUpperCase() || '';
      const requestCategoryId = validateCouponDto.categoryId?.toString().trim().toUpperCase() || '';
      
      console.log('🔍 Validação de cupom de categoria:', {
        couponCode: coupon.code,
        couponCategoryId,
        requestCategoryId,
        match: couponCategoryId === requestCategoryId,
        couponApplicableTo: coupon.applicableTo
      });
      
      if (!validateCouponDto.categoryId) {
        throw new BadRequestException('Categoria do produto não foi informada. Este cupom é válido apenas para produtos da categoria específica.');
      }
      
      if (couponCategoryId !== requestCategoryId) {
        throw new BadRequestException(
          `Cupom não é válido para esta categoria. Este cupom é válido apenas para produtos da categoria ${couponCategoryId}, mas o produto selecionado pertence à categoria ${requestCategoryId}.`
        );
      }
    }

    if (coupon.applicableTo === 'STORE') {
      // Normalizar valores para comparação (trim, tratar null/undefined)
      const couponStoreId = coupon.storeId ? String(coupon.storeId).trim() : null;
      const requestStoreId = validateCouponDto.storeId ? String(validateCouponDto.storeId).trim() : null;
      
      console.log('🔍 Validação de cupom de loja:');
      console.log('  - Código do cupom:', coupon.code);
      console.log('  - applicableTo:', coupon.applicableTo);
      console.log('  - couponStoreId (normalizado):', couponStoreId);
      console.log('  - couponStoreId (tipo):', typeof couponStoreId);
      console.log('  - couponStoreId (raw do DB):', coupon.storeId);
      console.log('  - requestStoreId (normalizado):', requestStoreId);
      console.log('  - requestStoreId (tipo):', typeof requestStoreId);
      console.log('  - requestStoreId (raw da requisição):', validateCouponDto.storeId);
      console.log('  - Comparação direta:', coupon.storeId, '===', validateCouponDto.storeId, '?', coupon.storeId === validateCouponDto.storeId);
      console.log('  - Comparação normalizada:', couponStoreId, '===', requestStoreId, '?', couponStoreId === requestStoreId);
      
      if (!couponStoreId || couponStoreId === 'null' || couponStoreId === 'undefined') {
        console.error('❌ ERRO: Cupom de loja sem storeId definido!', {
          couponId: coupon.id,
          couponCode: coupon.code,
          storeId: coupon.storeId,
          storeIdType: typeof coupon.storeId
        });
        throw new BadRequestException('Cupom configurado incorretamente: loja não definida no cupom. Entre em contato com o suporte.');
      }
      
      if (!requestStoreId || requestStoreId === '' || requestStoreId === 'null' || requestStoreId === 'undefined') {
        console.error('❌ ERRO: Loja não foi fornecida na requisição!', {
          couponCode: coupon.code,
          requestStoreId: validateCouponDto.storeId,
          requestStoreIdType: typeof validateCouponDto.storeId
        });
        throw new BadRequestException('Loja não foi selecionada. Este cupom é válido apenas para uma loja específica. Por favor, selecione a loja correta antes de aplicar o cupom.');
      }
      
      // Comparação mais robusta
      const storeIdsMatch = couponStoreId === requestStoreId || 
                           String(coupon.storeId) === String(validateCouponDto.storeId);
      
      if (!storeIdsMatch) {
        console.error('❌ ERRO: IDs de loja não correspondem!', {
          couponCode: coupon.code,
          couponStoreId,
          requestStoreId,
          couponStoreIdRaw: coupon.storeId,
          requestStoreIdRaw: validateCouponDto.storeId
        });
        throw new BadRequestException(
          `Cupom não é válido para esta loja. Este cupom é válido apenas para a loja com ID "${couponStoreId}", mas a loja selecionada tem ID "${requestStoreId}".`
        );
      }
      
      console.log('✅ Validação de loja passou:', {
        couponStoreId,
        requestStoreId,
        match: storeIdsMatch
      });
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
        applicableTo: coupon.applicableTo, // Incluir tipo de aplicabilidade
        storeId: coupon.storeId, // Incluir ID da loja se aplicável
        categoryId: coupon.categoryId, // Incluir ID da categoria se aplicável
        productId: coupon.productId, // Incluir ID do produto se aplicável
        maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : null, // Incluir desconto máximo
      },
      discount: Math.round(discount * 100) / 100, // Arredondar para 2 casas decimais
      finalAmount: Math.max(0, validateCouponDto.totalAmount - discount),
    };
  }

  async update(id: string, updateData: Partial<CreateCouponDto>, user: User) {
    console.log('📝 Iniciando atualização de cupom:', {
      id,
      applicableTo: updateData.applicableTo,
      storeId: updateData.storeId,
      storeIdType: typeof updateData.storeId,
      updateDataKeys: Object.keys(updateData)
    });

    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    console.log('📝 Iniciando atualização de cupom:', {
      id,
      updateDataReceived: {
        ...updateData,
        storeId: updateData.storeId,
        storeIdType: typeof updateData.storeId,
        storeIdIsUndefined: updateData.storeId === undefined,
        storeIdIsNull: updateData.storeId === null,
        storeIdValue: updateData.storeId
      }
    });

    console.log('📋 Cupom atual no banco:', {
      id: coupon.id,
      code: coupon.code,
      applicableTo: coupon.applicableTo,
      storeId: coupon.storeId,
      storeIdType: typeof coupon.storeId
    });

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
    
    // Tratar storeId corretamente
    const applicableTo = updateData.applicableTo || coupon.applicableTo;
    
    // Determinar assignmentType (pode estar sendo atualizado ou usar o atual)
    const finalAssignmentType = updateData.assignmentType || coupon.assignmentType;
    
    // Se for cupom de primeira compra, garantir que o limite seja 1
    if (finalAssignmentType === 'NEW_ACCOUNTS_ONLY') {
      updatePayload.usageLimit = 1;
    } else if (updateData.usageLimit !== undefined) {
      updatePayload.usageLimit = updateData.usageLimit;
    }
    
    if (updateData.validFrom) updatePayload.validFrom = new Date(updateData.validFrom);
    if (updateData.validUntil) updatePayload.validUntil = new Date(updateData.validUntil);
    if (updateData.applicableTo) updatePayload.applicableTo = updateData.applicableTo;
    if (updateData.categoryId !== undefined) updatePayload.categoryId = updateData.categoryId;
    if (updateData.productId !== undefined) updatePayload.productId = updateData.productId;
    
    console.log('🔍 Processando storeId:', {
      updateDataStoreId: updateData.storeId,
      updateDataStoreIdType: typeof updateData.storeId,
      updateDataStoreIdIsUndefined: updateData.storeId === undefined,
      updateDataStoreIdIsNull: updateData.storeId === null,
      updateDataStoreIdIsEmpty: updateData.storeId === '',
      applicableTo,
      currentCouponStoreId: coupon.storeId,
      updateDataKeys: Object.keys(updateData)
    });

    // Tratar storeId baseado no applicableTo
    // IMPORTANTE: Sempre processar storeId quando applicableTo for STORE
    if (applicableTo === 'STORE') {
      // Se storeId foi fornecido explicitamente
      if (updateData.storeId !== undefined && updateData.storeId !== null) {
        const storeIdStr = String(updateData.storeId).trim();
        
        console.log('🔍 Processando storeId fornecido:', {
          storeIdStr,
          isEmpty: storeIdStr === '',
          isNull: storeIdStr === 'null',
          isUndefined: storeIdStr === 'undefined'
        });
        
        if (storeIdStr === '' || storeIdStr === 'null' || storeIdStr === 'undefined') {
          // Se storeId está vazio, usar o storeId atual se existir
          if (coupon.storeId) {
            console.log('⚠️ storeId vazio fornecido, mantendo storeId atual:', coupon.storeId);
            // Não atualizar storeId no payload, manter o existente
          } else {
            throw new BadRequestException('Loja é obrigatória quando o cupom é aplicável a uma loja específica');
          }
        } else {
          // Validar se a loja existe
          const store = await this.prisma.store.findUnique({
            where: { id: storeIdStr },
            select: { id: true, name: true, isActive: true }
          });

          if (!store) {
            throw new BadRequestException(`Loja com ID "${storeIdStr}" não foi encontrada. Por favor, selecione uma loja válida.`);
          }

          if (!store.isActive) {
            throw new BadRequestException(`A loja "${store.name}" está inativa. Por favor, selecione uma loja ativa.`);
          }

          console.log('✅ Loja validada para atualização do cupom:', {
            storeId: store.id,
            storeName: store.name,
            isActive: store.isActive
          });
          
          // CRÍTICO: Sempre adicionar storeId ao payload quando fornecido e válido
          updatePayload.storeId = storeIdStr;
          console.log('💾 storeId ADICIONADO ao payload para salvar:', {
            storeId: updatePayload.storeId,
            storeIdType: typeof updatePayload.storeId,
            payloadKeys: Object.keys(updatePayload)
          });
        }
      } else {
        // Se storeId não foi fornecido, verificar se já existe
        if (!coupon.storeId) {
          throw new BadRequestException('Loja é obrigatória quando o cupom é aplicável a uma loja específica');
        }
        // Se já tem storeId, não fazer nada (manter o existente)
        console.log('ℹ️ storeId não fornecido, mantendo storeId atual:', coupon.storeId);
      }
    } else {
      // Se não for STORE, remover storeId
      if (updateData.applicableTo && updateData.applicableTo !== 'STORE') {
        updatePayload.storeId = null;
        console.log('🗑️ Removendo storeId pois applicableTo não é mais STORE');
      }
    }
    
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
    if (updateData.assignmentType !== undefined) {
      updatePayload.assignmentType = updateData.assignmentType;
      // Se está mudando para NEW_ACCOUNTS_ONLY, forçar usageLimit = 1
      if (updateData.assignmentType === 'NEW_ACCOUNTS_ONLY') {
        updatePayload.usageLimit = 1;
      }
    }
    if (updateData.couponType !== undefined) updatePayload.couponType = updateData.couponType;

    // Verificação final: garantir que storeId está no payload se applicableTo for STORE
    const finalApplicableTo = updatePayload.applicableTo || coupon.applicableTo;
    
    console.log('🔍 Verificação final do payload:', {
      finalApplicableTo,
      updatePayloadStoreId: updatePayload.storeId,
      updatePayloadStoreIdType: typeof updatePayload.storeId,
      updatePayloadStoreIdIsUndefined: updatePayload.storeId === undefined,
      updateDataStoreId: updateData.storeId,
      couponStoreId: coupon.storeId,
      updatePayloadKeys: Object.keys(updatePayload)
    });
    
    if (finalApplicableTo === 'STORE') {
      // Se storeId não está no payload mas foi fornecido, adicionar
      if (updatePayload.storeId === undefined && updateData.storeId !== undefined && updateData.storeId !== null) {
        const storeIdStr = String(updateData.storeId).trim();
        if (storeIdStr && storeIdStr !== 'null' && storeIdStr !== 'undefined' && storeIdStr !== '') {
          updatePayload.storeId = storeIdStr;
          console.log('🔧 Adicionando storeId ao payload (verificação final):', storeIdStr);
        }
      }
      
      // Se storeId não está no payload e não foi fornecido, mas já existe no cupom, manter
      if (updatePayload.storeId === undefined && coupon.storeId) {
        console.log('ℹ️ Mantendo storeId existente (não será alterado):', coupon.storeId);
        // Não adicionar ao payload, o Prisma manterá o valor atual
      }
      
      // Se storeId não está no payload, não foi fornecido e não existe, erro
      if (updatePayload.storeId === undefined && !coupon.storeId) {
        throw new BadRequestException('Loja é obrigatória quando o cupom é aplicável a uma loja específica');
      }
    }

    // VERIFICAÇÃO CRÍTICA: Garantir que storeId está no payload se applicableTo for STORE
    if (finalApplicableTo === 'STORE') {
      // Processar storeId: garantir que seja uma string válida ou null
      let finalStoreId: string | null = null;
      
      // Prioridade 1: storeId fornecido em updateData
      if (updateData.storeId !== undefined && updateData.storeId !== null) {
        const storeIdStr = String(updateData.storeId).trim();
        if (storeIdStr && storeIdStr !== 'null' && storeIdStr !== 'undefined' && storeIdStr !== '') {
          finalStoreId = storeIdStr;
        }
      }
      
      // Prioridade 2: storeId já existente no cupom (se não foi fornecido novo)
      if (!finalStoreId && coupon.storeId) {
        finalStoreId = String(coupon.storeId).trim();
      }
      
      // Se ainda não tem storeId, erro
      if (!finalStoreId) {
        throw new BadRequestException('Loja é obrigatória quando o cupom é aplicável a uma loja específica');
      }
      
      // FORÇAR storeId no payload (sempre, mesmo que já esteja)
      updatePayload.storeId = finalStoreId;
      console.log('🔧 FORÇANDO storeId no payload (última verificação):', {
        finalStoreId,
        storeIdType: typeof finalStoreId,
        wasInPayload: 'storeId' in updatePayload,
        previousValue: updatePayload.storeId
      });
    }

    // Log final antes de salvar
    console.log('💾 Atualizando cupom no banco (FINAL):', {
      id,
      applicableTo: finalApplicableTo,
      storeIdNoPayload: updatePayload.storeId,
      storeIdNoPayloadType: typeof updatePayload.storeId,
      storeIdNoPayloadIsUndefined: updatePayload.storeId === undefined,
      storeIdFinal: updatePayload.storeId !== undefined ? updatePayload.storeId : coupon.storeId,
      updatePayloadKeys: Object.keys(updatePayload),
      updatePayloadStoreId: updatePayload.storeId,
      updatePayloadHasStoreId: 'storeId' in updatePayload,
      updatePayloadJSON: JSON.stringify(updatePayload, null, 2),
      updateDataStoreId: updateData.storeId,
      payloadWillSaveStoreId: updatePayload.storeId !== undefined && updatePayload.storeId !== null
    });

    const updatedCoupon = await this.prisma.coupon.update({
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

    console.log('✅ Cupom atualizado com sucesso:', {
      id: updatedCoupon.id,
      code: updatedCoupon.code,
      applicableTo: updatedCoupon.applicableTo,
      storeId: updatedCoupon.storeId,
      storeIdType: typeof updatedCoupon.storeId,
      storeName: updatedCoupon.store?.name || 'Loja não encontrada',
      storeExists: !!updatedCoupon.store,
      storeIdFromDB: updatedCoupon.storeId,
      storeIdFromPayload: updatePayload.storeId,
      storeIdMatch: updatedCoupon.storeId === updatePayload.storeId
    });

    // Verificação crítica: se applicableTo é STORE, storeId deve estar salvo
    if (updatedCoupon.applicableTo === 'STORE' && !updatedCoupon.storeId) {
      console.error('🚨 ERRO CRÍTICO: Cupom de loja sem storeId salvo!', {
        couponId: updatedCoupon.id,
        applicableTo: updatedCoupon.applicableTo,
        storeId: updatedCoupon.storeId,
        payloadStoreId: updatePayload.storeId
      });
    }

    return updatedCoupon;
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
        
        // Filtrar cupons que não atingiram o limite de uso por cliente
        if (!coupon.usageLimit) return true;
        
        // Contar quantas vezes este cliente específico usou o cupom
        const userUsageCount = await this.prisma.couponUsage.count({
          where: {
            couponId: coupon.id,
            userId: customerId,
          },
        });
        
        const canUse = userUsageCount < coupon.usageLimit;
        if (!canUse) {
          console.log('⚠️ Cupom excluído por limite de uso por cliente:', coupon.code, {
            customerId,
            usedByCustomer: userUsageCount,
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

