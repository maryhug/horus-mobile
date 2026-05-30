# =============================================
#  Horus Mobile - Modo Tunnel (celular sin USB)
#  Para cuando el router bloquea conexiones LAN
#  o el celular esta en otra red
#
#  Requiere ngrok instalado:
#  winget install ngrok.ngrok
# =============================================
$ROOT = $PSScriptRoot

# Iniciar servidor API en ventana separada
Write-Host "[1/3] Iniciando servidor API (puerto 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT\server'; npm run dev"

# Iniciar tunnel en ventana separada (actualiza ../.env automaticamente con la URL publica)
Write-Host "[2/3] Iniciando ngrok tunnel..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT\server'; npm run tunnel"

# Esperar a que el tunnel obtenga su URL y actualice el .env
Write-Host "[3/3] Esperando URL del tunnel (15s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Leer la URL que escribio el tunnel
$envContent = Get-Content "$ROOT\.env" -Raw
$match = [regex]::Match($envContent, 'EXPO_PUBLIC_API_URL=(.*)')
if ($match.Success) {
  $apiUrl = $match.Groups[1].Value.Trim()
  Write-Host ""
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host " Tunnel activo!" -ForegroundColor Green
  Write-Host " API URL: $apiUrl" -ForegroundColor White
  Write-Host ""
  Write-Host " Escanea el QR con Expo Go" -ForegroundColor Yellow
  Write-Host "========================================" -ForegroundColor Cyan
} else {
  Write-Host ""
  Write-Host "[ERROR] No se detecto la URL del tunnel en .env." -ForegroundColor Red
  Write-Host "Verifica la ventana del tunnel y reinicia." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Set-Location $ROOT
npx expo start --tunnel
