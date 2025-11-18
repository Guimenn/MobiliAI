-- Adicionar enums se não existirem
DO $$ BEGIN
    CREATE TYPE "CouponAssignmentType" AS ENUM ('EXCLUSIVE', 'ALL_ACCOUNTS', 'NEW_ACCOUNTS_ONLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CouponType" AS ENUM ('PRODUCT', 'SHIPPING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'assignmentType'
    ) THEN
        ALTER TABLE "coupons" ADD COLUMN "assignmentType" "CouponAssignmentType";
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'couponType'
    ) THEN
        ALTER TABLE "coupons" ADD COLUMN "couponType" "CouponType";
    END IF;
END $$;

