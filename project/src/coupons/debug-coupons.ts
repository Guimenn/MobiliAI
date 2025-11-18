import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCoupons() {
  try {
    console.log('🔍 Verificando cupons no banco de dados...\n');

    const allCoupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📋 Total de cupons encontrados: ${allCoupons.length}\n`);

    allCoupons.forEach((coupon, index) => {
      console.log(`\n--- Cupom ${index + 1} ---`);
      console.log('Código:', coupon.code);
      console.log('Assignment Type:', coupon.assignmentType || 'NULL/UNDEFINED');
      console.log('Coupon Type:', coupon.couponType || 'NULL/UNDEFINED');
      console.log('Ativo:', coupon.isActive);
      console.log('Válido de:', coupon.validFrom.toISOString());
      console.log('Válido até:', coupon.validUntil.toISOString());
      console.log('Data de criação:', coupon.createdAt.toISOString());
      
      const now = new Date();
      const isActive = coupon.isActive;
      const isValidPeriod = now >= coupon.validFrom && now <= coupon.validUntil;
      console.log('✅ Status:', {
        isActive,
        isValidPeriod,
        canBeUsed: isActive && isValidPeriod
      });
    });

    // Verificar cupons com ALL_ACCOUNTS
    const allAccountsCoupons = await prisma.coupon.findMany({
      where: {
        assignmentType: 'ALL_ACCOUNTS'
      }
    });

    const now = new Date();
    console.log(`\n\n🎯 Cupons com assignmentType = ALL_ACCOUNTS: ${allAccountsCoupons.length}`);
    allAccountsCoupons.forEach(c => {
      const isValidPeriod = now >= c.validFrom && now <= c.validUntil;
      console.log(`  - ${c.code} (Ativo: ${c.isActive}, Válido: ${isValidPeriod})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCoupons();

