import { PrismaClient, CouponAssignmentType } from '@prisma/client';

const prisma = new PrismaClient();

async function testCustomerCoupons() {
  try {
    // Simular um customerId (você pode substituir por um ID real)
    const customerId = 'cliente-teste-id';
    
    // Buscar um cliente real do banco
    const realCustomer = await prisma.user.findFirst({
      where: {
        role: 'CUSTOMER'
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });

    if (!realCustomer) {
      console.log('❌ Nenhum cliente encontrado no banco');
      await prisma.$disconnect();
      return;
    }

    console.log('👤 Cliente encontrado:', {
      id: realCustomer.id,
      email: realCustomer.email,
      createdAt: realCustomer.createdAt.toISOString()
    });

    const now = new Date();
    const accountAge = now.getTime() - new Date(realCustomer.createdAt).getTime();
    const isNewAccount = accountAge < (30 * 24 * 60 * 60 * 1000);

    console.log('\n📊 Informações do cliente:');
    console.log('  - É conta nova?', isNewAccount);
    console.log('  - Idade da conta (dias):', Math.floor(accountAge / (24 * 60 * 60 * 1000)));

    // Construir filtro de assignmentType
    const assignmentTypeFilter: CouponAssignmentType[] = [CouponAssignmentType.ALL_ACCOUNTS];
    if (isNewAccount) {
      assignmentTypeFilter.push(CouponAssignmentType.NEW_ACCOUNTS_ONLY);
    }

    console.log('\n🔍 Filtro de assignmentType:', assignmentTypeFilter);

    // Buscar todos os cupons ativos e válidos
    const allCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now }
      },
      select: {
        id: true,
        code: true,
        assignmentType: true,
        isActive: true,
        validFrom: true,
        validUntil: true
      }
    });

    console.log('\n📋 Todos os cupons ativos e válidos:', allCoupons.length);
    allCoupons.forEach(c => {
      console.log(`  - ${c.code} (assignmentType: ${c.assignmentType || 'NULL'})`);
    });

    // Buscar cupons com a query usada no serviço
    const whereClause: any = {
      isActive: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
      OR: [
        {
          assignmentType: {
            in: assignmentTypeFilter
          }
        },
        {
          assignmentType: null
        }
      ]
    };

    const matchingCoupons = await prisma.coupon.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            couponUsages: true
          }
        }
      }
    });

    console.log('\n✅ Cupons que correspondem à query:', matchingCoupons.length);
    matchingCoupons.forEach(c => {
      console.log(`  - ${c.code} (assignmentType: ${c.assignmentType || 'NULL'}, usado: ${c._count.couponUsages})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomerCoupons();

