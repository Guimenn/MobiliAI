-- Adicionar PAYMENT_WARNING ao enum NotificationType se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'NotificationType'
      AND e.enumlabel = 'PAYMENT_WARNING'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_WARNING';
  END IF;
END$$;

