# Horus Mobile

App de salud React Native + Expo SDK 54. UI en español, tema oscuro/claro, backend `horus-braslet` en puerto 3000.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar |
|-------------|---------------|-----------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Expo Go (celular) | última | App Store / Play Store |
| ADB (Android) | cualquiera | `adb version` |

Instalar ADB si no está:
```powershell
winget install Google.PlatformTools
# Cierra y vuelve a abrir PowerShell después
```

---

## Levantar el entorno

### 1 — Backend (horus-braslet)
Abre una terminal y déjala corriendo:
```powershell
cd C:\Users\ASUS\WebstormProjects\Horus-Mobile\server
npm run dev
```
El backend queda en `http://localhost:3000`

### 2 — Frontend (esta app)
Abre **otra terminal**:
```powershell
cd C:\Users\ASUS\WebstormProjects\Horus-Mobile
.\start.ps1
```
El script detecta automáticamente si hay Android por USB y configura ADB.

---

## Probar en Android (Oppo A40 / cualquier Android)

### Setup único (primera vez)
1. En el celular: **Ajustes → Acerca del teléfono → Número de compilación** — toca 7 veces
2. **Ajustes → Opciones de desarrollador → Depuración USB** → activar
3. Conecta el cable USB a la PC
4. En el popup del celular: **"Permitir siempre"**

### Cada vez que quieras probar
```powershell
# Terminal 1 — backend
cd C:\Users\ASUS\WebstormProjects\Horus-Mobile\server
npm run dev

# Terminal 2 — frontend
cd C:\Users\ASUS\WebstormProjects\Horus-Mobile
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3000 tcp:3000
adb reverse tcp:19000 tcp:19000
npx expo start --lan
```

En **Expo Go** → toca **"Enter URL manually"** → escribe:
```
exp://localhost:8081
```

> **Nota:** El cable USB debe estar conectado antes de correr los `adb reverse`.

---

## Probar en iOS (iPhone)

No requiere cable. Solo necesitas estar en el **mismo WiFi** que la PC.

```powershell
# Terminal 1 — backend
cd C:\Users\ASUS\WebstormProjects\Horus-Mobile\server
npm run dev

# Terminal 2 — frontend
cd C:\Users\ASUS\WebstormProjects\Horus-Mobile
npx expo start --lan
```

En el iPhone:
- Abre la **cámara** y apunta al QR que aparece en la terminal, **o**
- Abre **Expo Go** → toca el ícono `+` → **"Scan QR code"**

> **Nota:** Si la app no carga, verifica que iPhone y PC estén en el **mismo WiFi** (no datos móviles).

---

## Probar en PC (navegador web)

```powershell
cd C:\Users\ASUS\WebstormProjects\Horus-Mobile
npx expo start --web
```

Abre automáticamente `http://localhost:8081` en el navegador.

> Algunas funciones nativas (cámara, sensores) no funcionan en web.

---

## Variables de entorno

Archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

> Si cambias esta variable, **reinicia Expo** (Ctrl+C y vuelve a correr).

---

## Errores comunes y soluciones

### `adb: command not found` o `adb no se reconoce`
ADB no está instalado o no está en el PATH.
```powershell
winget install Google.PlatformTools
# Cierra y vuelve a abrir PowerShell
adb version
```

---

### `adb devices` muestra lista vacía
El celular no está autorizado.
1. Desconecta y reconecta el USB
2. Revisa el celular — debe aparecer popup **"¿Permitir depuración USB?"**
3. Toca **"Permitir siempre"**
4. Corre `adb devices` de nuevo

Si sigue vacío:
```powershell
adb kill-server
adb start-server
adb devices
```

---

### `adb reverse` se queda colgado (no regresa al prompt)
El celular perdió la conexión ADB o espera autorización.
```powershell
# Presiona Ctrl+C para cancelar, luego:
adb kill-server
adb start-server
adb devices
# Revisa el popup en el celular y acepta
```

---

### `ERROR 404` con URL de ngrok en los logs
El `.env` tiene una URL vieja de ngrok en caché.
```powershell
# Verifica que el .env tenga esto:
cat .env
# Debe mostrar: EXPO_PUBLIC_API_URL=http://localhost:3000/api
```
Si no, edita el `.env` y reinicia Expo (Ctrl+C y vuelve a correr).

---

### Expo Go en iPhone no carga / "Network request failed"
- Verifica que iPhone y PC estén en el **mismo WiFi** (no datos móviles)
- Verifica que el backend esté corriendo en el puerto 3000
- Agrega reglas de firewall si faltan:
```powershell
netsh advfirewall firewall add rule name="Expo 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Expo 3000" dir=in action=allow protocol=TCP localport=3000
```

---

### La app muestra pantalla blanca al abrir
Error de compilación. Revisa la terminal de Expo para ver el error exacto, luego:
```powershell
npx expo start --lan --clear
```

---

### Cambios en el código no se reflejan en el celular
El hot reload falló. Opciones:
- Sacude el celular → menú de desarrollo → **"Reload"**
- Presiona `r` en la terminal de Expo

---

## Estructura del proyecto

```
Horus-Mobile/
├── app/
│   ├── (tabs)/
│   │   ├── dashboard.tsx
│   │   ├── assistant.tsx
│   │   ├── files.tsx
│   │   ├── profile.tsx
│   │   ├── monitor.tsx
│   │   └── qr-medico.tsx
│   ├── settings.tsx
│   └── _layout.tsx
├── components/
│   ├── FloatingTabBar.tsx
│   ├── HealthRing.tsx
│   └── EmotionShape.tsx
├── constants/
│   ├── theme.ts          # Paletas LIGHT / DARK
│   └── fonts.ts          # Constantes de tipografía
├── contexts/
│   └── ThemeContext.tsx
├── hooks/
│   └── useAppTheme.ts    # Hook: colores + toggleTheme
├── services/
│   └── api.ts            # Axios client → localhost:3000
├── server/               # Backend horus-braslet
├── .env                  # EXPO_PUBLIC_API_URL
├── start.ps1             # Script de inicio rápido
└── README.md
```

---

## Flujo rápido

```
# Android con USB:
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3000 tcp:3000
adb reverse tcp:19000 tcp:19000
npx expo start --lan
→ Expo Go: exp://localhost:8081

# iOS (mismo WiFi):
npx expo start --lan
→ Escanea el QR con la cámara

# Web:
npx expo start --web
→ http://localhost:8081
```
