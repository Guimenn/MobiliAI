-- Renomeia o valor do enum ProductCategory no PostgreSQL
-- Seguro para Postgres >= 10
DO $$
BEGIN
  -- Verifica se o valor antigo existe antes de renomear
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ProductCategory'
      AND e.enumlabel = 'OUTROS'
  ) THEN
    ALTER TYPE "ProductCategory" RENAME VALUE 'OUTROS' TO 'MESA_CENTRO';
  END IF;
END$$;

-- Caso seu banco não suporte RENAME VALUE, alternativa:
-- 1) Adicionar valor novo
-- ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'MESA_CENTRO';
-- 2) Atualizar linhas existentes
-- UPDATE "products" SET "category" = 'MESA_CENTRO' WHERE "category" = 'OUTROS';








