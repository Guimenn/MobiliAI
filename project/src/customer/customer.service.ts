import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  // ==================== REGISTRO E PERFIL ====================

  async register(customerData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) {
    // Verificar se email já existe
    const existingCustomer = await this.prisma.user.findUnique({
      where: { email: customerData.email }
    });

    if (existingCustomer) {
      throw new BadRequestException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(customerData.password, 10);

    const customer = await this.prisma.user.create({
      data: {
        name: customerData.name,
        email: customerData.email,
        password: hashedPassword,
        role: 'CUSTOMER',
        phone: customerData.phone,
        address: customerData.address,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return customer;
  }

  async getProfile(customerId: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        cpf: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  async updateProfile(customerId: string, updateData: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    cpf?: string;
  }) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.prisma.user.update({
      where: { id: customerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        cpf: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });
  }

  async changePassword(customerId: string, currentPassword: string, newPassword: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: customerId },
      data: { password: hashedNewPassword }
    });

    return { message: 'Senha alterada com sucesso' };
  }

  // ==================== DASHBOARD DO CLIENTE ====================

  async getCustomerDashboard(customerId: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const [
      totalOrders,
      totalSpent,
      recentOrders,
      favoriteProducts
    ] = await Promise.all([
      this.getTotalOrders(customerId),
      this.getTotalSpent(customerId),
      this.getRecentOrders(customerId),
      this.getFavoriteProducts(customerId)
    ]);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      },
      stats: {
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      },
      recentOrders,
      favoriteProducts
    };
  }

  private async getTotalOrders(customerId: string) {
    return this.prisma.sale.count({
      where: { customerId }
    });
  }

  private async getTotalSpent(customerId: string) {
    const sales = await this.prisma.sale.findMany({
      where: { customerId },
      include: { items: true }
    });

    return sales.reduce((total, sale) => {
      const saleTotal = sale.items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);
      return total + saleTotal;
    }, 0);
  }

  private async getRecentOrders(customerId: string) {
    return this.prisma.sale.findMany({
      where: { customerId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrls: true } }
          }
        },
        store: { select: { name: true } }
      }
    });
  }

  private async getFavoriteProducts(customerId: string) {
    // Buscar produtos mais comprados pelo cliente
    const sales = await this.prisma.sale.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrls: true,
                category: true,
                brand: true
              }
            }
          }
        }
      }
    });

    // Contar produtos mais comprados
    const productCounts = new Map();
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product.id;
        if (productCounts.has(productId)) {
          productCounts.set(productId, productCounts.get(productId) + item.quantity);
        } else {
          productCounts.set(productId, item.quantity);
        }
      });
    });

    // Retornar top 5 produtos mais comprados
    return Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, count]) => {
        const product = sales
          .flatMap(sale => sale.items)
          .find(item => item.product.id === productId)?.product;
        return { ...product, purchaseCount: count };
      });
  }

  // ==================== HISTÓRICO DE COMPRAS ====================

  async getOrderHistory(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.sale.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { name: true, imageUrls: true } }
            }
          },
          store: { select: { name: true, address: true } }
        }
      }),
      this.prisma.sale.count({ where: { customerId } })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderById(customerId: string, orderId: string) {
    const order = await this.prisma.sale.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrls: true, category: true } }
          }
        },
        store: { select: { name: true, address: true, phone: true } }
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o pedido pertence ao cliente
    if (order.customerId !== customerId) {
      throw new ForbiddenException('Você só pode visualizar seus próprios pedidos');
    }

    return order;
  }

  // ==================== ENDEREÇOS DE ENTREGA ====================

  async getShippingAddresses(customerId: string) {
    return this.prisma.shippingAddress.findMany({
      where: { userId: customerId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async getShippingAddressById(customerId: string, addressId: string) {
    const address = await this.prisma.shippingAddress.findUnique({
      where: { id: addressId }
    });

    if (!address) {
      throw new NotFoundException('Endereço não encontrado');
    }

    if (address.userId !== customerId) {
      throw new ForbiddenException('Você só pode acessar seus próprios endereços');
    }

    return address;
  }

  async createShippingAddress(customerId: string, addressData: {
    name: string;
    recipientName: string;
    phone: string;
    cpf?: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault?: boolean;
  }) {
    // Se for o primeiro endereço ou se marcar como padrão, definir como padrão
    const existingAddresses = await this.prisma.shippingAddress.findMany({
      where: { userId: customerId }
    });

    const shouldBeDefault = addressData.isDefault || existingAddresses.length === 0;

    // Se marcar como padrão, remover padrão dos outros
    if (shouldBeDefault) {
      await this.prisma.shippingAddress.updateMany({
        where: { userId: customerId, isDefault: true },
        data: { isDefault: false }
      });
    }

    return this.prisma.shippingAddress.create({
      data: {
        ...addressData,
        userId: customerId,
        isDefault: shouldBeDefault
      }
    });
  }

  async updateShippingAddress(customerId: string, addressId: string, updateData: {
    name?: string;
    recipientName?: string;
    phone?: string;
    cpf?: string;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    isDefault?: boolean;
  }) {
    const address = await this.prisma.shippingAddress.findUnique({
      where: { id: addressId }
    });

    if (!address) {
      throw new NotFoundException('Endereço não encontrado');
    }

    if (address.userId !== customerId) {
      throw new ForbiddenException('Você só pode editar seus próprios endereços');
    }

    // Se marcar como padrão, remover padrão dos outros
    if (updateData.isDefault) {
      await this.prisma.shippingAddress.updateMany({
        where: { userId: customerId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false }
      });
    }

    return this.prisma.shippingAddress.update({
      where: { id: addressId },
      data: updateData
    });
  }

  async deleteShippingAddress(customerId: string, addressId: string) {
    const address = await this.prisma.shippingAddress.findUnique({
      where: { id: addressId }
    });

    if (!address) {
      throw new NotFoundException('Endereço não encontrado');
    }

    if (address.userId !== customerId) {
      throw new ForbiddenException('Você só pode deletar seus próprios endereços');
    }

    await this.prisma.shippingAddress.delete({
      where: { id: addressId }
    });

    return { message: 'Endereço deletado com sucesso' };
  }

  async setDefaultShippingAddress(customerId: string, addressId: string) {
    const address = await this.prisma.shippingAddress.findUnique({
      where: { id: addressId }
    });

    if (!address) {
      throw new NotFoundException('Endereço não encontrado');
    }

    if (address.userId !== customerId) {
      throw new ForbiddenException('Você só pode definir seus próprios endereços como padrão');
    }

    // Remover padrão dos outros
    await this.prisma.shippingAddress.updateMany({
      where: { userId: customerId, isDefault: true },
      data: { isDefault: false }
    });

    // Definir este como padrão
    return this.prisma.shippingAddress.update({
      where: { id: addressId },
      data: { isDefault: true }
    });
  }
}
