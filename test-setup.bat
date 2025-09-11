@echo off
echo ========================================
echo   Testando Configuracao
echo ========================================
echo.

echo [1/4] Testando backend...
cd project
echo Verificando se o backend compila...
call npm run build
if %errorlevel% neq 0 (
    echo ERRO: Backend nao compila!
    pause
    exit /b 1
)
echo ✅ Backend compila com sucesso!

echo.
echo [2/4] Testando frontend...
cd ..\my-app
echo Verificando se o frontend compila...
call npm run build
if %errorlevel% neq 0 (
    echo ERRO: Frontend nao compila!
    pause
    exit /b 1
)
echo ✅ Frontend compila com sucesso!

echo.
echo [3/4] Verificando arquivos de configuracao...
cd ..\project
if not exist .env (
    echo ⚠️  Arquivo .env nao encontrado!
    echo Criando arquivo .env com configuracoes padrao...
    echo # Database > .env
    echo DB_HOST=localhost >> .env
    echo DB_PORT=5432 >> .env
    echo DB_USERNAME=postgres >> .env
    echo DB_PASSWORD=password >> .env
    echo DB_DATABASE=loja_tintas >> .env
    echo. >> .env
    echo # JWT >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production >> .env
    echo JWT_EXPIRES_IN=7d >> .env
    echo. >> .env
    echo # OpenAI >> .env
    echo OPENAI_API_KEY=your-openai-api-key-here >> .env
    echo. >> .env
    echo # AbacatePay (PIX) >> .env
    echo ABACATEPAY_API_KEY=your-abacatepay-api-key-here >> .env
    echo ABACATEPAY_ENVIRONMENT=sandbox >> .env
    echo. >> .env
    echo # App >> .env
    echo PORT=3001 >> .env
    echo NODE_ENV=development >> .env
    echo ✅ Arquivo .env criado!
) else (
    echo ✅ Arquivo .env encontrado!
)

cd ..\my-app
if not exist .env.local (
    echo ⚠️  Arquivo .env.local nao encontrado!
    echo Criando arquivo .env.local...
    echo NEXT_PUBLIC_API_URL=http://localhost:3001/api > .env.local
    echo ✅ Arquivo .env.local criado!
) else (
    echo ✅ Arquivo .env.local encontrado!
)

echo.
echo [4/4] Verificando dependencias...
cd ..\project
echo Verificando dependencias do backend...
call npm list --depth=0 > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Dependencias do backend podem estar incompletas!
) else (
    echo ✅ Dependencias do backend OK!
)

cd ..\my-app
echo Verificando dependencias do frontend...
call npm list --depth=0 > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Dependencias do frontend podem estar incompletas!
) else (
    echo ✅ Dependencias do frontend OK!
)

echo.
echo ========================================
echo   Teste de Configuracao Concluido!
echo ========================================
echo.
echo ✅ Tudo parece estar funcionando!
echo.
echo Proximos passos:
echo 1. Configure o PostgreSQL e crie o banco 'loja_tintas'
echo 2. Configure suas chaves de API no arquivo project\.env
echo 3. Execute: npm run seed (no diretorio project)
echo 4. Execute: npm run start:dev (no diretorio project)
echo 5. Execute: npm run dev (no diretorio my-app)
echo.
echo Acesse: http://localhost:3000
echo.
pause
