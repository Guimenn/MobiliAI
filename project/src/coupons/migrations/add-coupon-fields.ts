import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCouponFields() {
  try {
    console.log('🔄 Adicionando campos assignmentType e couponType à tabela coupons...');

    // Criar enums se não existirem
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
          CREATE TYPE "CouponAssignmentType" AS ENUM ('EXCLUSIVE', 'ALL_ACCOUNTS', 'NEW_ACCOUNTS_ONLY');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
          CREATE TYPE "CouponType" AS ENUM ('PRODUCT', 'SHIPPING');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);

    // Adicionar coluna assignmentType se não existir
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'coupons' AND column_name = 'assignmentType'
          ) THEN
              ALTER TABLE "coupons" ADD COLUMN "assignmentType" "CouponAssignmentType";
          END IF;
      END $$;
    `);

    // Adicionar coluna couponType se não existir
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'coupons' AND column_name = 'couponType'
          ) THEN
              ALTER TABLE "coupons" ADD COLUMN "couponType" "CouponType";
          END IF;
      END $$;
    `);

    console.log('✅ Campos adicionados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar campos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addCouponFields()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

