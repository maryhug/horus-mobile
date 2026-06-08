# Horus Mobile — Dev Launcher
# Uso: .\start.ps1
# Android (USB): conecta el cable → adb reverse automático
# iPhone:        mismo WiFi → escanea el QR con la cámara

$adbPath = (Get-Command adb -ErrorAction SilentlyContinue)?.Source

if ($adbPath) {
    $devices = adb devices 2>$null | Select-String "device$"
    if ($devices) {
        Write-Host "📱 Android detectado por USB — configurando ADB reverse..." -ForegroundColor Cyan
        adb reverse tcp:8081 tcp:8081   | Out-Null
        adb reverse tcp:3000 tcp:3000   | Out-Null
        adb reverse tcp:19000 tcp:19000 | Out-Null
        adb reverse tcp:19001 tcp:19001 | Out-Null
        Write-Host "✅ Android listo → En Expo Go escribe: exp://localhost:8081" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Sin Android por USB." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🍎 iPhone → asegúrate de estar en el mismo WiFi y escanea el QR" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Iniciando Expo (LAN mode)..." -ForegroundColor Cyan
npx expo start --lan
