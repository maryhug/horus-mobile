# =============================================
#  Horus Mobile - Modo Web (navegador)
#  No requiere celular ni configuracion extra
# =============================================
$ROOT = "C:\Users\ASUS\WebstormProjects\Horus-Mobile"

# Restaurar URL de API a localhost (por si el tunnel la habia cambiado)
Write-Host "[1/3] Restaurando .env -> localhost:3000..." -ForegroundColor Cyan
Set-Content -Path "$ROOT\.env" -Value "EXPO_PUBLIC_API_URL=http://localhost:3000/api" -Encoding UTF8
Write-Host "      EXPO_PUBLIC_API_URL=http://localhost:3000/api" -ForegroundColor DarkGray

# Iniciar servidor API en ventana separada
Write-Host "[2/3] Iniciando servidor API (puerto 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"Set-Location '$ROOT\server'; npm run dev`""
Start-Sleep -Seconds 3

Write-Host "[3/3] Iniciando Expo Web..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Abre en el navegador:" -ForegroundColor White
Write-Host " http://localhost:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host " Backend corriendo en:" -ForegroundColor White
Write-Host " http://localhost:3000/api/health" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Set-Location $ROOT
npx expo start --web
