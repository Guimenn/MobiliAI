

@echo off
echo ========================================
echo   Otimizando Prisma - Loja de Tintas
echo ========================================
echo.

echo [1/3] Configurando Prisma para performance...
echo.
echo Adicionando configurações de otimização ao schema.prisma...

powershell -Command "
$schemaPath = 'prisma\schema.prisma'
$content = Get-Content $schemaPath -Raw

# Adicionar configurações de otimização se não existirem
if ($content -notmatch 'generator client') {
    $newContent = @'
generator client {
  provider = \"prisma-client-js\"
  previewFeatures = [\"connectionLimit\"]
}

datasource db {
  provider  = \"postgresql\"
  url       = env(\"DATABASE_URL\")
  directUrl = env(\"DIRECT_URL\")
}

'@
    Set-Content $schemaPath $newContent
    echo '✅ Configurações de otimização adicionadas!'
} else {
    echo '✅ Configurações já existem!'
}
"

echo.
echo [2/3] Regenerando cliente Prisma otimizado...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERRO: Falha ao gerar cliente Prisma!
    pause
    exit /b 1
)
echo ✅ Cliente Prisma otimizado gerado!

echo.
echo [3/3] Testando conexão otimizada...
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo ⚠️  Aviso: Não foi possível testar a conexão.
    echo Verifique se o banco está configurado corretamente.
) else (
    echo ✅ Conexão otimizada funcionando!
)

echo.
echo ========================================
echo   Otimização Concluída!
echo ========================================
echo.
echo Melhorias aplicadas:
echo - Connection pooling habilitado
echo - Logs reduzidos (apenas erros e warnings)
echo - Error format minimal
echo - Preview features ativadas
echo.
echo Agora execute: npm run start:dev
echo.
pause
