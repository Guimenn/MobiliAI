@echo off
echo ========================================
echo   Corrigindo Dependencias
echo ========================================
echo.

echo [1/3] Removendo node_modules e package-lock.json...
cd project
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo [2/3] Instalando dependencias com --legacy-peer-deps...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [3/3] Instalando dependencias do frontend...
cd ..\my-app
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias do frontend!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Dependencias corrigidas com sucesso!
echo ========================================
echo.
echo Agora voce pode executar:
echo 1. cd project ^&^& npm run start:dev
echo 2. cd my-app ^&^& npm run dev
echo.
pause
