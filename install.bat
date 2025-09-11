@echo off
echo ========================================
echo   Loja de Tintas - Instalacao
echo ========================================
echo.

echo [1/4] Instalando dependencias do backend...
cd project
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias do backend!
    pause
    exit /b 1
)

echo.
echo [2/4] Instalando dependencias do frontend...
cd ..\my-app
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias do frontend!
    pause
    exit /b 1
)

echo.
echo [3/4] Criando arquivo de configuracao do backend...
cd ..\project
if not exist .env (
    echo # Database > .env
    echo DB_HOST=localhost >> .env
    echo DB_PORT=5432 >> .env
    echo DB_USERNAME=postgres >> .env
    echo DB_PASSWORD=password >> .env
    echo DB_DATABASE=loja_tintas >> .env
    echo. >> .env
    echo # JWT >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-here >> .env
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
    echo Arquivo .env criado! Configure suas chaves de API.
) else (
    echo Arquivo .env ja existe.
)

echo.
echo [4/4] Criando arquivo de configuracao do frontend...
cd ..\my-app
if not exist .env.local (
    echo NEXT_PUBLIC_API_URL=http://localhost:3001/api > .env.local
    echo Arquivo .env.local criado!
) else (
    echo Arquivo .env.local ja existe.
)

echo.
echo ========================================
echo   Instalacao concluida com sucesso!
echo ========================================
echo.
echo Proximos passos:
echo 1. Configure o PostgreSQL e crie o banco 'loja_tintas'
echo 2. Configure suas chaves de API no arquivo project\.env
echo 3. Execute o backend: cd project ^&^& npm run start:dev
echo 4. Execute o frontend: cd my-app ^&^& npm run dev
echo.
echo Acesse: http://localhost:3000
echo.
pause
