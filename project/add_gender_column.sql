-- Adicionar coluna gender à tabela users
-- Execute este script no seu banco de dados PostgreSQL

ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "gender" TEXT;

