@echo off
echo ========================================
echo   Setup Prisma - Loja de Tintas
echo ========================================
echo.

echo [1/4] Configurando banco de dados...
echo DATABASE_URL="postgresql://postgres:password@localhost:5432/loja_tintas?schema=public" > .env
echo ✅ Arquivo .env criado!

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
echo [3/4] Aplicando schema ao banco...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ⚠️  Aviso: Não foi possível conectar ao banco de dados.
    echo Certifique-se de que o PostgreSQL está rodando e o banco 'loja_tintas' existe.
    echo.
    echo Para criar o banco, execute no PostgreSQL:
    echo CREATE DATABASE loja_tintas;
    echo.
    pause
    exit /b 1
)
echo ✅ Schema aplicado ao banco!

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
echo   Setup Prisma Concluído!
echo ========================================
echo.
echo Próximos passos:
echo 1. Configure suas chaves de API no arquivo .env
echo 2. Execute: npm run start:dev
echo 3. Acesse: http://localhost:3001
echo.
echo Comandos úteis do Prisma:
echo - npx prisma studio (interface visual do banco)
echo - npx prisma db push (aplicar mudanças no schema)
echo - npx prisma generate (gerar cliente)
echo.
pause
