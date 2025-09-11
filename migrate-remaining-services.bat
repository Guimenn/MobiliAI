@echo off
echo Migrando services restantes para Prisma...

echo.
echo [1/4] Migrando ProductsService...
powershell -Command "(Get-Content 'src\products\products.service.ts') -replace 'this\.productRepository\.create\(', 'this.prisma.product.create({ data: ' -replace 'this\.productRepository\.save\(', 'this.prisma.product.create({ data: ' -replace 'this\.productRepository\.find\(', 'this.prisma.product.findMany(' -replace 'this\.productRepository\.findOne\(', 'this.prisma.product.findUnique(' -replace 'this\.productRepository\.update\(', 'this.prisma.product.update({ where: { id }, data: ' -replace 'this\.productRepository\.softDelete\(', 'this.prisma.product.update({ where: { id }, data: { isActive: false } }' | Set-Content 'src\products\products.service.ts'"

echo.
echo [2/4] Migrando SalesService...
powershell -Command "(Get-Content 'src\sales\sales.service.ts') -replace 'this\.saleRepository\.create\(', 'this.prisma.sale.create({ data: ' -replace 'this\.saleRepository\.save\(', 'this.prisma.sale.create({ data: ' -replace 'this\.saleRepository\.find\(', 'this.prisma.sale.findMany(' -replace 'this\.saleRepository\.findOne\(', 'this.prisma.sale.findUnique(' -replace 'this\.saleRepository\.update\(', 'this.prisma.sale.update({ where: { id }, data: ' | Set-Content 'src\sales\sales.service.ts'"

echo.
echo [3/4] Migrando AIService...
powershell -Command "(Get-Content 'src\ai\ai.service.ts') -replace 'this\.colorAnalysisRepository\.create\(', 'this.prisma.colorAnalysis.create({ data: ' -replace 'this\.colorAnalysisRepository\.save\(', 'this.prisma.colorAnalysis.create({ data: ' -replace 'this\.colorAnalysisRepository\.find\(', 'this.prisma.colorAnalysis.findMany(' -replace 'this\.colorAnalysisRepository\.findOne\(', 'this.prisma.colorAnalysis.findUnique(' | Set-Content 'src\ai\ai.service.ts'"

echo.
echo [4/4] Migrando ChatbotService...
powershell -Command "(Get-Content 'src\chatbot\chatbot.service.ts') -replace 'this\.chatSessionRepository\.create\(', 'this.prisma.chatSession.create({ data: ' -replace 'this\.chatSessionRepository\.save\(', 'this.prisma.chatSession.create({ data: ' -replace 'this\.chatSessionRepository\.find\(', 'this.prisma.chatSession.findMany(' -replace 'this\.chatSessionRepository\.findOne\(', 'this.prisma.chatSession.findUnique(' | Set-Content 'src\chatbot\chatbot.service.ts'"

echo.
echo ✅ Migração concluída!
echo.
echo Agora execute:
echo npm run build
echo npm start
echo.
pause
