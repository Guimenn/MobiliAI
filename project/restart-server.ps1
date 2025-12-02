# Script para reiniciar o servidor backend
Write-Host "🛑 Parando servidor backend..." -ForegroundColor Yellow

# Tentar parar processos Node relacionados ao backend
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*project*" -or $_.CommandLine -like "*nest*" -or $_.CommandLine -like "*start:dev*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "🧹 Limpando pasta dist..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "🔨 Recompilando projeto..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Compilação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Para iniciar o servidor, execute:" -ForegroundColor Cyan
Write-Host "   npm run start:dev" -ForegroundColor White
Write-Host ""




