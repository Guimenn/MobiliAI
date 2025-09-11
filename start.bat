@echo off
echo ========================================
echo   Loja de Tintas - Iniciando Servicos
echo ========================================
echo.

echo Iniciando backend (porta 3001)...
start "Backend" cmd /k "cd project && npm run start:dev"

echo Aguardando 5 segundos...
timeout /t 5 /nobreak > nul

echo Iniciando frontend (porta 3000)...
start "Frontend" cmd /k "cd my-app && npm run dev"

echo.
echo ========================================
echo   Servicos iniciados!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Pressione qualquer tecla para fechar...
pause > nul
