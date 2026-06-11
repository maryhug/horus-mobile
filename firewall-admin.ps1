# =============================================
#  EJECUTAR COMO ADMINISTRADOR
#  Click derecho > "Ejecutar con PowerShell"
# =============================================

Write-Host "Abriendo puertos para Expo en el Firewall de Windows..." -ForegroundColor Cyan

$ports = @(
  @{ Name="Expo_Metro_8081"; Port=8081 },
  @{ Name="Expo_Dev_19000";  Port=19000 },
  @{ Name="Expo_Dev_19001";  Port=19001 },
  @{ Name="Expo_Dev_19002";  Port=19002 },
  @{ Name="Horus_API_3000";  Port=3000 }
)

foreach ($p in $ports) {
  Remove-NetFirewallRule -Name $p.Name -ErrorAction SilentlyContinue
  New-NetFirewallRule -Name $p.Name -DisplayName $p.Name -Direction Inbound -Protocol TCP -LocalPort $p.Port -Action Allow -Profile Any | Out-Null
  Write-Host "  Puerto $($p.Port) -> OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "Listo. Ahora 'npx expo start --lan' deberia funcionar." -ForegroundColor Green
Write-Host "Presiona Enter para cerrar..."
Read-Host