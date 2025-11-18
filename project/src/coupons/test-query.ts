import { PrismaClient, CouponAssignmentType } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery() {
  try {
    const now = new Date();
    console.log('🔍 Testando query de cupons...\n');
    console.log('Data atual:', now.toISOString());
    console.log('AssignmentType filter:', [CouponAssignmentType.ALL_ACCOUNTS]);
    
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        assignmentType: {
          in: [CouponAssignmentType.ALL_ACCOUNTS]
        }
      },
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

    console.log(`\n✅ Cupons encontrados: ${coupons.length}`);
    coupons.forEach(c => {
      console.log(`  - ${c.code} (${c.assignmentType})`);
    });

    // Testar sem filtro de assignmentType
    const allActiveCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now }
      }
    });

    console.log(`\n📋 Total de cupons ativos e válidos (sem filtro de assignmentType): ${allActiveCoupons.length}`);
    allActiveCoupons.forEach(c => {
      console.log(`  - ${c.code} (assignmentType: ${c.assignmentType || 'NULL'})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();

