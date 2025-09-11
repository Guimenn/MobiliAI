@echo off
echo Atualizando arquivo .env com configurações do Supabase...

(
echo # Database - Supabase
echo DATABASE_URL="postgresql://postgres.duvgptwzoodyyjbdhepa:9lwERuw16V26DhQd@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
echo DIRECT_URL="postgresql://postgres.duvgptwzoodyyjbdhepa:9lwERuw16V26DhQd@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
echo.
echo # Database Local ^(alternativa^)
echo # DATABASE_URL="postgresql://postgres:password@localhost:5432/loja_tintas?schema=public"
echo # DIRECT_URL="postgresql://postgres:password@localhost:5432/loja_tintas"
echo.
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_USERNAME=postgres
echo DB_PASSWORD=password
echo DB_DATABASE=loja_tintas
echo.
echo # JWT
echo JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
echo JWT_EXPIRES_IN=7d
echo.
echo # OpenAI
echo OPENAI_API_KEY=your-openai-api-key-here
echo.
echo # AbacatePay ^(PIX^)
echo ABACATEPAY_API_KEY=your-abacatepay-api-key-here
echo ABACATEPAY_ENVIRONMENT=sandbox
echo.
echo # App
echo PORT=3001
echo NODE_ENV=development
) > .env

echo ✅ Arquivo .env atualizado com configurações do Supabase!
echo.
echo Agora você pode executar:
echo npx prisma generate
echo npx prisma db push
echo npm run seed
echo.
pause
