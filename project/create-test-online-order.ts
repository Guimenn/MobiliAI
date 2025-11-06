import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestOnlineOrder() {
  try {
    console.log('🛒 Criando pedido online de teste...');

    // 1. Buscar uma loja
    const store = await prisma.store.findFirst({
      where: { isActive: true }
    });

    if (!store) {
      throw new Error('Nenhuma loja ativa encontrada');
    }

    console.log(`📍 Loja selecionada: ${store.name}`);

    // 2. Buscar ou criar um cliente
    let customer = await prisma.user.findFirst({
      where: {
        role: 'CUSTOMER',
        storeId: store.id
      }
    });

    if (!customer) {
      // Criar cliente de teste
      customer = await prisma.user.create({
        data: {
          name: 'Cliente Teste Online',
          email: `teste-online-${Date.now()}@teste.com`,
          password: '123456', // Senha em hash seria necessário, mas para teste...
          role: 'CUSTOMER',
          storeId: store.id,
          isActive: true
        }
      });
      console.log(`👤 Cliente criado: ${customer.name}`);
    } else {
      console.log(`👤 Cliente usado: ${customer.name}`);
    }

    // 3. Buscar produtos disponíveis na loja
    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
        stock: {
          gt: 0
        }
      },
      take: 3
    });

    if (products.length === 0) {
      throw new Error('Nenhum produto disponível na loja');
    }

    console.log(`📦 Produtos selecionados: ${products.length}`);

    // 4. Calcular total
    const items = products.map((product, index) => ({
      productId: product.id,
      quantity: index + 1, // 1, 2, 3
      unitPrice: Number(product.price),
      totalPrice: Number(product.price) * (index + 1)
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // 5. Criar o pedido online
    const saleNumber = `SALE-${Date.now()}`;
    
    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        storeId: store.id,
        customerId: customer.id,
        employeeId: customer.id, // Cliente é o próprio vendedor em pedidos online
        totalAmount,
        discount: 0,
        tax: 0,
        status: 'PENDING',
        paymentMethod: 'PIX',
        isOnlineOrder: true,
        shippingAddress: 'Rua Teste, 123',
        shippingCity: 'São Paulo',
        shippingState: 'SP',
        shippingZipCode: '01234-567',
        shippingPhone: '(11) 98765-4321',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      }
    });

    console.log('\n✅ Pedido online criado com sucesso!');
    console.log('\n📋 Detalhes do pedido:');
    console.log(`   Número: ${sale.saleNumber}`);
    console.log(`   Cliente: ${sale.customer.name}`);
    console.log(`   Loja: ${sale.store.name}`);
    console.log(`   Total: R$ ${sale.totalAmount.toFixed(2)}`);
    console.log(`   Status: ${sale.status}`);
    console.log(`   É pedido online: ${sale.isOnlineOrder}`);
    console.log(`   Endereço de entrega: ${sale.shippingAddress}, ${sale.shippingCity} - ${sale.shippingState}`);
    console.log(`\n📦 Itens (${sale.items.length}):`);
    sale.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.product.name} - Qtd: ${item.quantity} x R$ ${item.unitPrice.toFixed(2)} = R$ ${item.totalPrice.toFixed(2)}`);
    });
    console.log(`\n🔗 ID do pedido: ${sale.id}`);
    console.log(`\n🌐 Você pode ver este pedido em:`);
    console.log(`   - Admin: /admin/orders-online`);
    console.log(`   - Manager: /manager/orders-online`);
    console.log(`   - Employee: /employee/orders-online`);
    
    return sale;
  } catch (error) {
    console.error('❌ Erro ao criar pedido online:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestOnlineOrder()
  .then(() => {
    console.log('\n✨ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

