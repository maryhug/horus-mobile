# Horus Mobile

Aplicación móvil para la manilla inteligente **Horus Braslet**. Monitoreo de métricas de salud en tiempo real, gestión de contactos de emergencia, asistente con IA y datos del dispositivo NFC. Construida con React Native + Expo y respaldada por una API Express + PostgreSQL (Neon).

---

## Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Prerequisitos](#prerequisitos)
3. [Instalación](#instalación)
4. [Variables de Entorno](#variables-de-entorno)
5. [Cómo Ejecutar](#cómo-ejecutar)
   - [En el navegador (web)](#en-el-navegador-web)
   - [En el celular (tunnel)](#en-el-celular-tunnel)
6. [Estructura del Proyecto](#estructura-del-proyecto)
7. [API Reference](#api-reference)
8. [Base de Datos](#base-de-datos)
9. [Scripts Disponibles](#scripts-disponibles)
10. [Solución de Problemas](#solución-de-problemas)
11. [Roadmap](#roadmap)

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework móvil** | React Native 0.81 + Expo SDK 54 |
| **Navegación** | Expo Router v6 (file-based routing) |
| **Lenguaje** | TypeScript 5.9 |
| **Gestión de estado** | React Context (Auth + Theme) |
| **HTTP Client** | Axios 1.x con interceptores JWT |
| **Almacenamiento seguro** | Expo SecureStore (nativo) / localStorage (web) |
| **Iconos** | Ionicons via @expo/vector-icons |
| **NFC** | react-native-nfc-manager |
| **Backend** | Express.js 4.x + TypeScript |
| **ORM** | Prisma 7 con adapter pg |
| **Base de datos** | PostgreSQL (Neon serverless) |
| **Auth** | JWT (access token, 7 días de expiración) |
| **Hash passwords** | bcryptjs (12 rounds) |
| **Tunnel desarrollo** | LocalTunnel (acceso remoto al backend desde el celular) |
| **Build / Deploy** | Expo Application Services (EAS) |

---

## Prerequisitos

Instala lo siguiente antes de comenzar:

**Node.js 18 o superior**
Descárgalo en [nodejs.org](https://nodejs.org). Incluye npm automáticamente.

**Expo Go en el celular** (solo para modo celular)
- Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

---

## Instalación

Ejecuta estos comandos en orden, en PowerShell, desde la carpeta del proyecto.

### Paso 1 — Instalar dependencias del frontend

```powershell
npm install
```

### Paso 2 — Instalar dependencias del backend

```powershell
cd server
npm install
cd ..
```

### Paso 3 — Configurar el firewall de Windows

> Solo la primera vez. Abre PowerShell **como Administrador** (clic derecho → Ejecutar como administrador).

```powershell
.\firewall-admin.ps1
```

Esto abre los puertos 8081 y 19000–19002 para que Expo funcione correctamente.

### Paso 4 — Aplicar el esquema a la base de datos

> Solo la primera vez, o cuando cambies `server/prisma/schema.prisma`.

```powershell
cd server
npx prisma db push
npx prisma generate
cd ..
```

---

## Variables de Entorno

### Frontend — `.env` (raíz del proyecto)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

> Este archivo **es modificado automáticamente** por los scripts de arranque. No lo edites manualmente.

### Backend — `server/.env`

```env
DATABASE_URL="postgresql://neondb_owner:<password>@ep-dawn-art-api8ynnq-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:<password>@ep-dawn-art-api8ynnq.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_ACCESS_SECRET="<tu-secret>"
JWT_REFRESH_SECRET="<tu-secret>"
PORT=3000
NODE_ENV=development
```

---

## Cómo Ejecutar

### En el navegador (web)

Abre **una sola terminal** en la raíz del proyecto y ejecuta:

```powershell
.\start-web.ps1
```

Eso es todo. El script hace automáticamente:
1. Restaura `.env` a `http://localhost:3000/api`
2. Abre el backend en una ventana separada (puerto 3000)
3. Inicia Expo Web

La app queda disponible en: **`http://localhost:8081`**

Puedes verificar que el backend funciona entrando a: `http://localhost:3000/api/health`

---

### En el celular (tunnel)

Abre **una sola terminal** en la raíz del proyecto y ejecuta:

```powershell
.\start-dev.ps1
```

El script hace automáticamente:
1. Abre el backend en una ventana separada (puerto 3000)
2. Abre el tunnel LocalTunnel en otra ventana (actualiza `.env` con la URL pública)
3. Espera 10 segundos a que el tunnel obtenga su URL
4. Inicia Expo en modo tunnel

Luego **escanea el QR** que aparece en la terminal con la app **Expo Go**.

> **Si aparece una página de "Bypass Tunnel Reminder":** ingresa la IP pública de tu PC (la misma página te la muestra) en el formulario y haz clic en Submit. Ocurre solo la primera conexión.

---

## Estructura del Proyecto

```
horus-mobile/
│
├── app/                          # Pantallas (Expo Router file-based routing)
│   ├── _layout.tsx               # Layout raíz: Stack + RouteGuard (chequeo de auth)
│   ├── index.tsx                 # Redirect a /login
│   ├── login.tsx                 # Pantalla de login
│   ├── register.tsx              # Pantalla de registro
│   ├── settings.tsx              # Configuración
│   ├── emergency.tsx             # Vista de emergencia médica (acceso NFC)
│   └── (tabs)/
│       ├── _layout.tsx           # Bottom tab navigator (5 tabs)
│       ├── dashboard.tsx         # Panel principal: métricas, dispositivo, alertas
│       ├── monitor.tsx           # Monitor del dispositivo
│       ├── assistant.tsx         # Asistente IA (chat)
│       ├── files.tsx             # Gestión de archivos
│       └── profile.tsx           # Perfil de usuario + edición + logout
│
├── contexts/
│   ├── AuthContext.tsx           # Estado de auth: user, login, register, logout, updateUser
│   └── ThemeContext.tsx          # Tema oscuro/claro: isDark, colors, toggleTheme
│
├── services/
│   └── api.ts                    # Axios client: baseURL, token, interceptor 401, getErrorMessage
│
├── hooks/
│   └── useApi.ts                 # Hook genérico: useApi<T>(fn) → {data, loading, error, refetch}
│
├── types/
│   └── api.ts                    # Interfaces TypeScript: User, LoginResponse, ProfileData, etc.
│
├── constants/
│   └── colors.ts                 # Paletas darkColors / lightColors (AppColors type)
│
├── utils/
│   ├── storage.ts                # SecureStore wrapper (nativo: iOS/Android)
│   └── storage.web.ts            # localStorage wrapper (web) — Metro lo selecciona automáticamente
│
├── assets/                       # icon.png, splash-icon.png, adaptive-icon.png, favicon.png
│
├── server/                       # Backend Express + Prisma
│   ├── src/
│   │   ├── index.ts              # App Express: CORS, rutas, health check — puerto 3000
│   │   ├── lib/
│   │   │   └── prisma.ts         # Singleton Prisma Client con pg adapter (Neon)
│   │   ├── middleware/
│   │   │   └── auth.ts           # requireAuth: verifica JWT Bearer → req.userId
│   │   └── routes/
│   │       ├── auth.ts           # POST /auth/register, /auth/login, /auth/logout
│   │       ├── profile.ts        # GET /profile, PUT /profile
│   │       ├── contacts.ts       # GET/POST/DELETE /contacts
│   │       └── dashboard.ts      # GET /dashboard/info
│   ├── prisma/
│   │   └── schema.prisma         # Esquema completo de la base de datos
│   ├── tunnel.js                 # LocalTunnel: crea tunnel → escribe URL en ../.env
│   ├── package.json
│   └── .env                      # DATABASE_URL, JWT secrets, PORT
│
├── .env                          # EXPO_PUBLIC_API_URL (manejado por los scripts)
├── app.json                      # Config Expo: nombre, slug, bundle IDs, plugins NFC
├── eas.json                      # EAS Build: perfiles development/preview/production
├── package.json                  # Dependencias y scripts npm del frontend
├── tsconfig.json                 # TypeScript: strict mode
│
├── start-web.ps1                 # Arranque modo web: localhost + backend + expo web
├── start-dev.ps1                 # Arranque modo tunnel: tunnel + expo --tunnel
└── firewall-admin.ps1            # (Admin) Abre puertos Expo en Windows Firewall
```

---

## API Reference

Base URL en desarrollo: `http://localhost:3000/api`

Los endpoints protegidos requieren el header:
```
Authorization: Bearer <access_token>
```

### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|:----:|-------------|
| `POST` | `/auth/register` | No | Registrar nuevo usuario |
| `POST` | `/auth/login` | No | Login → retorna `accessToken` + datos del usuario |
| `POST` | `/auth/logout` | No | Logout (limpia la sesión local) |

**POST `/auth/register`**
```json
{
  "firstName": "María",
  "lastName": "García",
  "email": "maria@example.com",
  "password": "minimo8caracteres",
  "confirmPassword": "minimo8caracteres"
}
```

**POST `/auth/login`**
```json
{ "email": "maria@example.com", "password": "minimo8caracteres" }
```
Respuesta:
```json
{
  "accessToken": "eyJ...",
  "user": { "id": "uuid", "email": "...", "firstName": "María", "lastName": "García" }
}
```

### Perfil

| Método | Endpoint | Auth | Descripción |
|--------|----------|:----:|-------------|
| `GET` | `/profile` | Sí | Obtener perfil completo del usuario |
| `PUT` | `/profile` | Sí | Actualizar datos personales |

**PUT `/profile`** (todos los campos opcionales):
```json
{
  "firstName": "María",
  "lastName": "García",
  "phone": "+57 300 000 0000",
  "location": "Bogotá, Colombia",
  "dateOfBirth": "1990-05-15",
  "gender": "FEMALE",
  "bloodType": "O+",
  "identificationNumber": "1234567890",
  "identificationType": "CC"
}
```

### Contactos de Emergencia

| Método | Endpoint | Auth | Descripción |
|--------|----------|:----:|-------------|
| `GET` | `/contacts` | Sí | Listar contactos activos por prioridad |
| `POST` | `/contacts` | Sí | Crear contacto |
| `DELETE` | `/contacts/:id` | Sí | Eliminar contacto (soft delete) |

**POST `/contacts`**
```json
{ "name": "Juan García", "phone": "+57 311 000 0000", "relation": "Padre" }
```

### Dashboard y Health

| Método | Endpoint | Auth | Descripción |
|--------|----------|:----:|-------------|
| `GET` | `/dashboard/info` | Sí | Datos del dashboard (id, email, timestamp) |
| `GET` | `/health` | No | Verificar que el servidor está corriendo |

---

## Base de Datos

Esquema en `server/prisma/schema.prisma`. PostgreSQL serverless en Neon.

| Modelo | Descripción |
|--------|-------------|
| `User` | Cuenta: email, passwordHash, nfcTagId, accountStatus |
| `PersonalInformation` | Nombre, fecha de nacimiento, tipo de sangre, identificación |
| `MedicalProfile` | Altura, peso, donante de órganos, seguro médico |
| `Allergy` | Alergias con severidad (MILD → LIFE_THREATENING) |
| `ChronicCondition` | Condiciones crónicas con estado (ACTIVE → RESOLVED) |
| `UserMedication` | Medicamentos actuales: dosis, frecuencia, vía de administración |
| `EmergencyContact` | Contactos de emergencia ordenados por prioridad |
| `MedicalHistory` | Historial: cirugías, hospitalizaciones, vacunas |
| `NfcScan` | Registro de lecturas NFC |
| `EmergencyAlert` | Alertas de emergencia con estado |
| `PrivacySettings` | Control de visibilidad de información en lecturas NFC |
| `Product` | Catálogo: manilla / tarjeta |
| `Order` | Pedidos con estados de envío y pago |
| `Payment` | Transacciones Mercado Pago |
| `Subscription` | Suscripciones activas con auto-renovación |

---

## Scripts Disponibles

### PowerShell (raíz del proyecto)

| Script | Descripción |
|--------|-------------|
| `.\start-web.ps1` | Modo web: restaura `.env` + backend + expo web |
| `.\start-dev.ps1` | Modo celular: backend + tunnel + expo tunnel |
| `.\firewall-admin.ps1` | *(Admin)* Abre puertos Expo en Windows Firewall |

### npm — Frontend (raíz del proyecto)

| Comando | Descripción |
|---------|-------------|
| `npm run web` | Solo inicia Expo Web (requiere backend corriendo manualmente) |
| `npm start` | Expo DevTools interactivo |
| `npm run server` | Solo inicia el backend |
| `npm run server:tunnel` | Solo inicia el tunnel |

### npm — Backend (`server/`)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con hot-reload |
| `npm run tunnel` | LocalTunnel → actualiza `../.env` con la URL pública |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta el build de producción |
| `npm run db:push` | Aplica cambios del schema a la DB |
| `npm run db:generate` | Regenera Prisma Client |

---

## Solución de Problemas

**"Sin conexión. Verifica tu red."**
- Web: confirma que el backend corre en `http://localhost:3000/api/health`
- Celular: el tunnel puede haber expirado. Cierra y vuelve a correr `.\start-dev.ps1`

**El QR de Expo no carga en el celular**
El router probablemente tiene aislamiento de clientes. Usa siempre `.\start-dev.ps1` (modo tunnel), no modo LAN.

**Error `UNABLE_TO_VERIFY_LEAF_SIGNATURE` al instalar paquetes**
```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"; npm install <paquete>
```

**El tunnel se cierra solo / Bad Gateway**
`tunnel.js` tiene reconexión automática (3s en cierre, 5s en error). Espera unos segundos. Si persiste, reinicia `.\start-dev.ps1`.

**Dashboard muestra 401 al cargar**
El token JWT expiró. Cierra sesión e inicia sesión de nuevo.

**Puerto 3000 ya está en uso**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Roadmap

### Implementado

- [x] Autenticación completa (registro, login, logout, JWT)
- [x] Gestión de perfil de usuario
- [x] Contactos de emergencia (CRUD)
- [x] Tema oscuro / claro con persistencia
- [x] Dashboard con layout completo
- [x] Soporte web completo (localStorage nativo/web automático)
- [x] Schema de base de datos médica completo
- [x] Scripts de arranque para web y tunnel

### Pendiente

- [ ] Integración con datos reales del dispositivo NFC (frecuencia cardíaca, pasos, calorías)
- [ ] Gráfica de actividad de 24 horas con datos reales
- [ ] Chat con asistente IA (endpoint + LLM)
- [ ] TTS (texto a voz) para el asistente
- [ ] Pantalla Monitor con datos del dispositivo en tiempo real
- [ ] Pantalla Archivos (subida/descarga de reportes PDF, CSV)
- [ ] Vista de Emergencia NFC (información médica sin login)
- [ ] Gestión de alergias y condiciones crónicas (UI)
- [ ] Alertas de emergencia con notificación a contactos
- [ ] Pagos con Mercado Pago
- [ ] Gestión de suscripciones
- [ ] Pantalla de Configuración y Privacidad NFC
- [ ] Recordatorios de medicamentos
- [ ] Publicación en Play Store / App Store
