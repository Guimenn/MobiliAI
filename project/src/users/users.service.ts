import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async findAll(currentUser: User): Promise<User[]> {
    // Apenas admins podem ver todos os usuários
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.user.findMany({
      include: {
        store: true,
      },
    });
  }

  async findOne(id: string, currentUser: User): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        store: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Usuários só podem ver seus próprios dados, exceto admins
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Acesso negado');
    }

    return user as User;
  }

  async update(id: string, updateData: Partial<User>, currentUser: User): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Apenas admins podem editar outros usuários
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Acesso negado');
    }

    // Usuários comuns não podem alterar seu próprio role
    if (currentUser.role !== UserRole.ADMIN && updateData.role) {
      delete updateData.role;
    }

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return this.findOne(id, currentUser);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    // Apenas admins podem deletar usuários
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Não permitir deletar o próprio usuário
    if (currentUser.id === id) {
      throw new ForbiddenException('Não é possível deletar seu próprio usuário');
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getUsersByStore(storeId: string, currentUser: User): Promise<User[]> {
    // Verificar se o usuário tem acesso à loja
    if (currentUser.role !== UserRole.ADMIN && currentUser.storeId !== storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.user.findMany({
      where: { storeId },
      include: {
        store: true,
      },
    });
  }
}
