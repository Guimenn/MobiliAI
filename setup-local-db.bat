@echo off
echo ========================================
echo   Setup Banco Local - Loja de Tintas
echo ========================================
echo.

echo [1/4] Configurando banco local...
echo DATABASE_URL="postgresql://postgres:password@localhost:5432/loja_tintas?schema=public" > .env
echo DIRECT_URL="postgresql://postgres:password@localhost:5432/loja_tintas" >> .env
echo.
echo DB_HOST=localhost >> .env
echo DB_PORT=5432 >> .env
echo DB_USERNAME=postgres >> .env
echo DB_PASSWORD=password >> .env
echo DB_DATABASE=loja_tintas >> .env
echo.
echo # JWT >> .env
echo JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production >> .env
echo JWT_EXPIRES_IN=7d >> .env
echo.
echo # OpenAI >> .env
echo OPENAI_API_KEY=your-openai-api-key-here >> .env
echo.
echo # AbacatePay ^(PIX^) >> .env
echo ABACATEPAY_API_KEY=your-abacatepay-api-key-here >> .env
echo ABACATEPAY_ENVIRONMENT=sandbox >> .env
echo.
echo # App >> .env
echo PORT=3001 >> .env
echo NODE_ENV=development >> .env
echo ✅ Arquivo .env configurado para banco local!

echo.
echo [2/4] Gerando cliente Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERRO: Falha ao gerar cliente Prisma!
    pause
    exit /b 1
)
echo ✅ Cliente Prisma gerado!

echo.
echo [3/4] Aplicando schema ao banco local...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ⚠️  Aviso: Não foi possível conectar ao banco local.
    echo.
    echo Para configurar PostgreSQL local:
    echo 1. Instale PostgreSQL
    echo 2. Crie o banco: CREATE DATABASE loja_tintas;
    echo 3. Configure usuário: postgres / password
    echo 4. Execute este script novamente
    echo.
    pause
    exit /b 1
)
echo ✅ Schema aplicado ao banco local!

echo.
echo [4/4] Executando seed...
call npm run seed
if %errorlevel% neq 0 (
    echo ⚠️  Aviso: Falha ao executar seed.
    echo Certifique-se de que o banco está configurado corretamente.
) else (
    echo ✅ Seed executado com sucesso!
)

echo.
echo ========================================
echo   Setup Banco Local Concluído!
echo ========================================
echo.
echo Próximos passos:
echo 1. Execute: npm run start:dev
echo 2. Acesse: http://localhost:3001
echo.
echo Comandos úteis:
echo - npx prisma studio (interface visual do banco)
echo - npx prisma db push (aplicar mudanças no schema)
echo - npx prisma generate (gerar cliente)
echo.
pause
