import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Store, User, UserRole } from '@prisma/client';

@Injectable()
export class StoresService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createStoreDto: Partial<Store>, currentUser: User): Promise<Store> {
    // Apenas admins podem criar lojas
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.store.create({
      data: createStoreDto as any,
    });
  }

  async findAll(currentUser: User): Promise<Store[]> {
    // Clientes podem ver todas as lojas ativas (para escolher onde retirar pedidos)
    if (currentUser.role === UserRole.CUSTOMER) {
      // Buscar todas as lojas e filtrar no código (mais permissivo)
      const allStores = await this.prisma.store.findMany({
        orderBy: { name: 'asc' },
      });
      // Filtrar apenas lojas que não estão explicitamente inativas
      const stores = allStores.filter(store => store.isActive !== false);
      return stores;
    }

    // Se não for admin, retornar apenas a loja do usuário (MANAGER/EMPLOYEE)
    if (currentUser.role !== UserRole.ADMIN) {
      if (!currentUser.storeId) {
        return [];
      }
      const store = await this.prisma.store.findUnique({
        where: { id: currentUser.storeId },
        include: {
          employees: true,
        },
      });
      return store ? [store] : [];
    }

    // Admin vê todas as lojas
    return this.prisma.store.findMany({
      include: {
        employees: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, currentUser: User): Promise<Store> {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        employees: true,
        products: true,
        sales: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Clientes podem ver qualquer loja ativa
    if (currentUser.role === UserRole.CUSTOMER) {
      if (!store.isActive) {
        throw new ForbiddenException('Loja não está ativa');
      }
      return store;
    }

    // Verificar se o usuário tem acesso à loja (MANAGER/EMPLOYEE só vê sua loja)
    if (currentUser.role !== UserRole.ADMIN && currentUser.storeId !== id) {
      throw new ForbiddenException('Acesso negado');
    }

    return store;
  }

  async update(id: string, updateStoreDto: Partial<Store>, currentUser: User): Promise<Store> {
    // Apenas admins podem editar lojas
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    await this.prisma.store.update({
      where: { id },
      data: updateStoreDto as any,
    });
    return this.findOne(id, currentUser);
  }

  // Método removido - exclusão de lojas agora é feita pelo admin.service.ts
  // async remove(id: string, currentUser: User): Promise<void> {
  //   // Apenas admins podem deletar lojas
  //   if (currentUser.role !== UserRole.ADMIN) {
  //     throw new ForbiddenException('Acesso negado');
  //   }

  //   const store = await this.prisma.store.findUnique({ where: { id } });
  //   if (!store) {
  //     throw new NotFoundException('Loja não encontrada');
  //   }

  //   // Verificar se há funcionários na loja
  //   const employees = await this.prisma.user.count({ where: { storeId: id } });
  //   if (employees > 0) {
  //     throw new ForbiddenException('Não é possível deletar uma loja que possui funcionários');
  //   }

  //   await this.prisma.store.update({
  //     where: { id },
  //     data: { isActive: false },
  //   });
  // }

  async getStoreStats(id: string, currentUser: User): Promise<any> {
    const store = await this.findOne(id, currentUser);

    // Aqui você pode adicionar lógica para calcular estatísticas da loja
    // como total de vendas, produtos mais vendidos, etc.
    
    return {
      store,
      totalEmployees: (store as any).employees?.length || 0,
      totalProducts: (store as any).products?.length || 0,
      totalSales: (store as any).sales?.length || 0,
    };
  }
}
