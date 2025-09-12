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
    // Se não for admin, retornar apenas a loja do usuário
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

    // Verificar se o usuário tem acesso à loja
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

  async remove(id: string, currentUser: User): Promise<void> {
    // Apenas admins podem deletar lojas
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Verificar se há funcionários na loja
    const employees = await this.prisma.user.count({ where: { storeId: id } });
    if (employees > 0) {
      throw new ForbiddenException('Não é possível deletar uma loja que possui funcionários');
    }

    await this.prisma.store.update({
      where: { id },
      data: { isActive: false },
    });
  }

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
