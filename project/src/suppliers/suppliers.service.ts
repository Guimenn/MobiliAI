import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto, userRole: UserRole) {
    // Apenas ADMIN pode criar fornecedores
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem criar fornecedores');
    }

    return this.prisma.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAll(userRole: UserRole, userStoreId?: string) {
    // ADMIN vê todos os fornecedores
    if (userRole === UserRole.ADMIN) {
      return this.prisma.supplier.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    // Outros usuários não têm acesso a fornecedores
    throw new ForbiddenException('Acesso negado');
  }

  async findOne(id: string, userRole: UserRole) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Apenas ADMIN pode ver detalhes de fornecedores
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto, userRole: UserRole) {
    // Apenas ADMIN pode atualizar fornecedores
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem atualizar fornecedores');
    }

    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async remove(id: string, userRole: UserRole) {
    // Apenas ADMIN pode desativar fornecedores
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem desativar fornecedores');
    }

    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

