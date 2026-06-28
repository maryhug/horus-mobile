# Horus Mobile

Aplicación móvil de salud personal conectada a la manilla inteligente **Horus Bráslet**. Monitorea métricas vitales en tiempo real, genera un QR médico de emergencia, gestiona archivos clínicos y permite comunicarse con un asistente de IA personalizado.

---

## Índice

1. [¿Qué hace la app?](#1-qué-hace-la-app)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Librerías y dependencias](#3-librerías-y-dependencias)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Archivos principales y su propósito](#5-archivos-principales-y-su-propósito)
6. [Contexts (estado global)](#6-contexts-estado-global)
7. [Hooks personalizados](#7-hooks-personalizados)
8. [Pantallas](#8-pantallas)
9. [Componentes reutilizables](#9-componentes-reutilizables)
10. [Sistema de temas](#10-sistema-de-temas)
11. [Sistema de idiomas (i18n)](#11-sistema-de-idiomas-i18n)
12. [API y backend](#12-api-y-backend)
13. [Cómo correr la aplicación](#13-cómo-correr-la-aplicación)
14. [Variables de entorno](#14-variables-de-entorno)
15. [Notas de desarrollo](#15-notas-de-desarrollo)

---

## 1. ¿Qué hace la app?

| Funcionalidad | Descripción |
|---|---|
| 🏥 **ID Médico QR** | Genera un código QR con información médica escaneable en emergencias, sin necesidad de app |
| 📊 **Dashboard de salud** | Visualiza métricas vitales (ritmo cardíaco, pasos, calorías, actividad) sincronizadas con la manilla |
| 📡 **Monitor NFC/BLE** | Monitorea el estado del dispositivo wearable en tiempo real vía Bluetooth y NFC |
| 🤖 **Asistente IA** | Chat con un asistente médico personalizado (3 personajes: Tinto, Oblea, Bocadillo) |
| 📁 **Archivos clínicos** | Sube, organiza y descarga documentos médicos (PDF, CSV, PNG, JSON) |
| 👤 **Perfil médico** | Gestiona datos personales y médicos con lógica de "llenar una sola vez" para campos sensibles |
| ⚙️ **Configuración** | Tema claro/oscuro, idioma (ES/EN/PT), asistente, notificaciones, privacidad, vincular manilla |
| 🚨 **Emergencia pública** | Pantalla accesible sin autenticación con datos médicos críticos del portador del QR |

---

## 2. Stack tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| **Framework UI** | React Native | 0.81.5 |
| **Entorno** | Expo SDK | ~54.0.33 |
| **Lenguaje** | TypeScript | ~5.9.2 |
| **UI Runtime** | React | 19.1.0 |
| **Routing** | Expo Router (file-based) | ~6.0.23 |
| **HTTP Client** | Axios | ^1.16.1 |
| **Web** | React Native Web | ^0.21.0 |

### Paradigmas de diseño

- **File-based routing** — las rutas se infieren automáticamente de la estructura de carpetas en `app/`
- **Context + Hook pattern** — estado global vía React Context, consumido por hooks tipados
- **Singleton hooks** — `useAssistant` comparte estado entre todas las instancias sin Context extra
- **Lock-once data** — campos médicos en perfil se bloquean permanentemente al ser llenados
- **Theme-reactive styles** — `makeStyles()` recibe tokens de color y devuelve `StyleSheet`, regenerado con `useMemo([isDark])`
- **Cero `any`** — TypeScript estricto en toda la codebase, sin excepciones

---

## 3. Librerías y dependencias

### Navegación y estructura

| Paquete | Uso |
|---|---|
| `expo-router` | Routing file-based; gestiona stack de pantallas y tab navigator |
| `react-native-screens` | Optimización nativa del stack de pantallas |
| `react-native-safe-area-context` | Insets de pantalla (notch, barra de estado, home indicator) |

### Fuentes y UI

| Paquete | Uso |
|---|---|
| `@expo-google-fonts/space-grotesk` | Fuente **display** para títulos y métricas (pesos: 400, 500, 600, 700) |
| `@expo-google-fonts/dm-sans` | Fuente **sans-serif** para etiquetas y textos de UI (pesos: 400, 500, 700) |
| `expo-font` | Cargador de fuentes custom antes de renderizar la app |
| `react-native-svg` | Renderizado vectorial SVG — íconos propios y el HealthRing animado |

### Hardware y sensores

| Paquete | Uso |
|---|---|
| `react-native-ble-plx` | Comunicación Bluetooth Low Energy con la manilla Horus Bráslet |
| `react-native-nfc-manager` | Lectura de tags NFC para identificación de emergencia |
| `react-native-qrcode-svg` | Generación del QR médico en pantalla |
| `react-native-view-shot` | Captura del QR como imagen para guardar o compartir |

### Medios y archivos

| Paquete | Uso |
|---|---|
| `expo-image-picker` | Selección de foto de perfil desde galería o cámara |
| `expo-media-library` | Guardar el QR generado en la galería del dispositivo |
| `expo-file-system` | Manejo de archivos clínicos locales |

### Persistencia

| Paquete | Uso |
|---|---|
| `expo-secure-store` | Almacenamiento **cifrado** en iOS/Android (token JWT, sesión, preferencias) |
| `expo-constants` | Acceso a constantes de la app (IDs, entorno) |

### Red y desarrollo

| Paquete | Uso |
|---|---|
| `axios` | Cliente HTTP con interceptores, manejo de errores 401/408/500 y token Bearer |
| `@expo/ngrok` | Tunnel local para exponer el servidor backend al dispositivo físico |
| `@expo/metro-runtime` | Runtime de Metro para soporte web |

### Íconos

Los íconos de pantalla se renderizan con **SVG custom** (paths de Lucide Icons) definidos inline en cada componente — sin dependencias de librerías de íconos de terceros. Solo los íconos del navbar usan `@expo/vector-icons` (Ionicons), tipados con `IoniconsName = ComponentProps<typeof Ionicons>['name']`.

---

## 4. Estructura de carpetas

```
horus-mobile/
│
├── app/                          # Pantallas — Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout: providers, fuentes, RouteGuard
│   ├── index.tsx                 # Splash / redirect inicial
│   ├── login.tsx                 # Pantalla de inicio de sesión
│   ├── register.tsx              # Pantalla de registro (solo datos básicos)
│   ├── settings.tsx              # Configuración general de la app
│   ├── emergency.tsx             # Vista pública de emergencia (sin autenticación)
│   └── (tabs)/                   # Grupo de tabs (layout compartido con FloatingTabBar)
│       ├── _layout.tsx           # Tab navigator con FloatingTabBar personalizado
│       ├── dashboard.tsx         # Panel principal de salud
│       ├── monitor.tsx           # Monitor del dispositivo wearable
│       ├── qr-medico.tsx         # Generador de ID médico QR
│       ├── assistant.tsx         # Chat con el asistente de IA
│       ├── files.tsx             # Gestión de archivos clínicos
│       └── profile.tsx           # Perfil del usuario (con lock-once en datos médicos)
│
├── components/                   # Componentes reutilizables
│   ├── FloatingTabBar.tsx        # Navbar flotante personalizado con i18n
│   ├── HealthRing.tsx            # Anillo SVG animado de métricas + MetricChips
│   └── EmotionShape.tsx          # Formas decorativas SVG (login/register)
│
├── contexts/                     # Estado global React Context
│   ├── AuthContext.tsx           # Sesión de usuario, login, logout, token JWT
│   ├── ThemeContext.tsx          # Tema claro/oscuro, persistido en SecureStore
│   └── LanguageContext.tsx       # i18n: ES/EN/PT — interfaz T con 300+ claves tipadas
│
├── hooks/                        # Custom hooks
│   ├── useApi.ts                 # Fetcher genérico con loading / error / refetch
│   ├── useAppTheme.ts            # Acceso directo a los tokens de color del tema activo
│   └── useAssistant.ts           # Singleton: asistente seleccionado y persistido
│
├── services/
│   └── api.ts                    # Instancia Axios, interceptores, setAuthToken, getErrorMessage
│
├── types/
│   └── api.ts                    # Interfaces TypeScript de todos los endpoints del backend
│
├── constants/
│   ├── theme.ts                  # Tokens LIGHT / DARK (paleta oficial Horus)
│   ├── colors.ts                 # Paleta extendida AppColors (vibrant + legacy)
│   └── fonts.ts                  # Constantes FONT.displayBold, FONT.sansMedium, etc.
│
├── utils/
│   ├── storage.ts                # Abstracción de persistencia (SecureStore en nativo)
│   └── storage.web.ts            # Implementación web con localStorage
│
├── assets/
│   └── assistants/               # Imágenes PNG de Tinto, Oblea y Bocadillo
│
├── server/                       # Backend Node.js (horus-braslet) — proyecto hermano
│
├── app.json                      # Configuración Expo (nombre, íconos, bundle ID, splash)
├── package.json                  # Dependencias y scripts
└── tsconfig.json                 # Configuración TypeScript
```

---

## 5. Archivos principales y su propósito

### `app/_layout.tsx`
**Root de la aplicación.** Responsabilidades:
- Carga las fuentes custom con `expo-font` antes del primer render
- Envuelve toda la app en la cadena de providers:
  `SafeAreaProvider → ThemeProvider → LanguageProvider → AuthProvider`
- Contiene el componente `RouteGuard` que redirige automáticamente:
  - Si **no está autenticado** y accede a `(tabs)` o `/` → redirige a `/login`
  - Si **está autenticado** y accede a `login`, `register` o `/` → redirige a `/(tabs)/dashboard`
- Define el `Stack` de pantallas con las animaciones de transición

### `app/(tabs)/_layout.tsx`
Define el tab navigator con `<FloatingTabBar>` personalizado en lugar del tab bar nativo de React Navigation.

### `services/api.ts`
Cliente HTTP centralizado:
- Instancia Axios con `baseURL` desde `EXPO_PUBLIC_API_URL`
- **Interceptor de request**: loguea `[API] METHOD /ruta` en consola
- **Interceptor de response**: loguea status; en error 401 invoca el `unauthorizedHandler` para cerrar sesión
- `setAuthToken(token | null)` — inyecta o elimina `Authorization: Bearer ...` en los headers por defecto
- `getErrorMessage(error)` — extrae el mensaje más útil de cualquier respuesta de error del servidor (soporta `errors`, `message`, `error`, `detail`)

### `types/api.ts`
Contratos TypeScript de todos los endpoints:

| Interfaz | Descripción |
|---|---|
| `User` | Datos completos del usuario autenticado |
| `LoginResponse` | Respuesta del POST `/auth/login` |
| `RegisterPayload` / `RegisterResponse` | POST `/auth/register` |
| `ProfileData` / `ProfileUpdatePayload` | GET y PUT `/profile` |
| `DashboardData` | GET `/dashboard/info` |
| `ChatRequest` / `ChatResponse` | POST `/chat` |
| `Contact` / `CreateContactPayload` | Contactos de emergencia |
| `ApiErrorResponse` | Estructura de error estándar del backend |

### `constants/theme.ts`
Define los tokens de la paleta Horus para ambos modos:
- **`LIGHT`**: fondo crema `#F9F6ED`, cards blancas, texto oscuro
- **`DARK`**: fondo casi negro `#1A1510`, cards oscuras, texto crema
- Los colores de acento (GREEN, YELLOW, BLUE, PINK) **son idénticos en ambos modos**

### `utils/storage.ts` + `utils/storage.web.ts`
Abstracción de persistencia multiplataforma:
- **iOS/Android**: `expo-secure-store` (cifrado en el keychain del dispositivo)
- **Web**: `localStorage`
- API unificada: `getItem(key)`, `setItem(key, value)`, `deleteItem(key)`

---

## 6. Contexts (estado global)

### `AuthContext`
Gestiona toda la sesión del usuario.

```typescript
const { user, isAuthenticated, isLoading, login, logout, updateUser } = useAuth();
```

| Propiedad / Método | Tipo | Descripción |
|---|---|---|
| `user` | `User \| null` | Datos del usuario autenticado |
| `isAuthenticated` | `boolean` | `true` si hay sesión activa |
| `isLoading` | `boolean` | `true` mientras se carga la sesión desde storage |
| `login(email, password)` | `Promise<void>` | Llama `/auth/login`, persiste token, redirige al dashboard |
| `logout()` | `Promise<void>` | Llama `/auth/logout`, limpia storage y token, redirige a login |
| `updateUser(partial)` | `void` | Actualiza campos del usuario en memoria y storage sin refetch |

**Flujo de sesión persistida:** al montar, lee token y datos del usuario desde `SecureStore`. Si hay sesión, configura el header de Axios. Si el servidor responde `401`, el interceptor dispara `unauthorizedHandler` → limpia sesión → redirige a login.

---

### `ThemeContext`
Gestiona el tema visual.

```typescript
const { isDark, colors, toggleTheme } = useTheme();

// Acceso simplificado con tokens directos:
const { BG, CARD, PRIMARY, MUTED, GREEN, isDark, toggleTheme } = useAppTheme();
```

- Por defecto: **tema oscuro**
- Se persiste bajo la clave `horus_theme`

---

### `LanguageContext`
Sistema de internacionalización completo sin librerías externas.

```typescript
const { language, setLanguage, t } = useLanguage();

// Uso — t es un objeto, NO una función:
<Text>{t.dashTitle}</Text>
<Text>{t.profileEdit}</Text>
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `language` | `'es' \| 'en' \| 'pt'` | Idioma activo |
| `setLanguage(lang)` | `void` | Cambia y persiste el idioma |
| `t` | `T` (interfaz tipada) | Objeto con 300+ claves de traducción |

**Idiomas disponibles:**
- 🇨🇴 `es` — Español (idioma base del proyecto)
- 🇺🇸 `en` — English
- 🇧🇷 `pt` — Português (Brasil)

---

## 7. Hooks personalizados

### `useAppTheme()`
**Archivo:** `hooks/useAppTheme.ts`

Acceso directo a los tokens de color del tema activo. Combina `useTheme()` con la selección de `LIGHT`/`DARK` para que cada pantalla solo llame a un hook.

```typescript
const {
  BG, CARD, PRIMARY, MUTED, MUTED_BG,
  GREEN, YELLOW, BLUE, PINK, RED, RED_BG,
  isDark, toggleTheme
} = useAppTheme();
```

---

### `useApi<T>(fn, deps?)`
**Archivo:** `hooks/useApi.ts`

Hook genérico para llamadas a la API con gestión automática de loading/error/refetch.

```typescript
const { data, loading, error, refetch } = useApi<DashboardData>(
  () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
);
```

| Retorno | Tipo | Descripción |
|---|---|---|
| `data` | `T \| null` | Resultado tipado de la llamada |
| `loading` | `boolean` | `true` mientras la promesa está pendiente |
| `error` | `string \| null` | Mensaje de error si falló |
| `refetch` | `() => void` | Re-ejecuta la llamada manualmente |

---

### `useAssistant()`
**Archivo:** `hooks/useAssistant.ts`

Hook con **patrón singleton**: todas las instancias comparten el mismo estado global mediante un `Set<listener>` a nivel de módulo, sin necesidad de Context ni prop drilling.

```typescript
const { assistantId, setAssistantId, assistant } = useAssistant();
// assistant = { name, tagline, image }
```

**Asistentes disponibles:**

| ID | Nombre | Personalidad |
|---|---|---|
| `tinto` | Tinto | Alegre, curioso y valiente |
| `oblea` | Oblea | Alegre, cercana y positiva |
| `bocadillo` | Bocadillo | Alegre, curiosa y valiente |

El asistente se persiste en `SecureStore` y cualquier pantalla que use `useAssistant()` se actualiza automáticamente al cambiarlo desde Configuración.

---

## 8. Pantallas

### `app/login.tsx`
Inicio de sesión con email y contraseña. Muestra un banner de éxito si viene del registro (`?registered=1`). Usa `useAuth().login()` para autenticar y redirigir.

---

### `app/register.tsx`
Registro de cuenta nueva. Campos: nombre, apellido, correo, contraseña, confirmación de contraseña y aceptación de términos. Los datos médicos **no se solicitan aquí** — el usuario los completa en su perfil con la lógica lock-once.

---

### `app/(tabs)/dashboard.tsx`
Panel principal. Contiene:
- Saludo contextual (buenos días / tardes / noches) con el nombre del usuario
- Strip del asistente activo — toca para ir al chat
- **HealthRing**: anillo SVG interactivo con las 4 métricas de salud
- Estado del dispositivo: chip, batería, última sincronización
- Gráfico de actividad de las últimas 24h (barras)
- Grid de acciones rápidas: QR, IA, Archivos, Perfil
- Panel de alertas del sistema

---

### `app/(tabs)/monitor.tsx`
Monitor del wearable en tiempo real:
- Pastilla de localización GPS en vivo
- Estado NFC del tag vinculado
- Grid de chips con info del protocolo (frecuencia de monitoreo, rango, ID del tag)
- Centro de notificaciones del dispositivo
- Modal de activación / desactivación del wearable

---

### `app/(tabs)/qr-medico.tsx`
Generador de ID médico de emergencia:
- QR dinámico con los datos del perfil del usuario
- Controles de privacidad por toggle: qué información incluir en el QR (tipo de sangre, alergias, medicamentos, condiciones crónicas, contactos de emergencia, notas)
- Botón de guardar en galería o compartir
- Guía paso a paso de vinculación con el smartwatch

---

### `app/(tabs)/assistant.tsx`
Chat en tiempo real con el asistente de IA:
- Historial de mensajes con burbujas diferenciadas (usuario / asistente)
- Input con envío por Enter o botón
- Avatar del asistente activo
- Integración con el endpoint `/chat` del backend

---

### `app/(tabs)/files.tsx`
Gestión de archivos clínicos:
- Zona de subida visual (borde punteado)
- Barra de progreso de almacenamiento utilizado
- Lista de archivos con tipo (PDF/CSV/PNG/JSON), tamaño y acciones: descargar y eliminar
- Estado vacío con prompt de primer archivo

---

### `app/(tabs)/profile.tsx`
Perfil completo del usuario:
- Avatar con iniciales, nombre y correo
- Vista rápida: correo, tipo de sangre, fecha de nacimiento
- Estado del wearable Horus (NFC, GPS, batería, firmware)
- Modal **Ver perfil**: datos personales, médicos e identificación
- Modal **Editar perfil** con lógica lock-once:
  - `firstName` / `lastName` → siempre editables
  - `bloodType`, `dateOfBirth`, `gender`, `identificationType`, `identificationNumber` → editables solo si están vacíos; una vez guardados se muestran con candado 🔒 y no permiten cambios
- Modal de logout con confirmación

---

### `app/settings.tsx`
Configuración completa:
- **Apariencia**: tema claro/oscuro con segmented control
- **Idioma**: bottom sheet con ES / EN / PT
- **Asistente**: carrusel horizontal con los 3 personajes
- **Notificaciones**: push, alertas de ubicación, alertas de salud
- **Privacidad**: autenticación biométrica, compartir datos anónimos
- **Dispositivo**: versión firmware, sincronizar, generar código de vinculación con la manilla (código de 6 dígitos con temporizador de 2 minutos)
- **Zona de peligro**: eliminar cuenta con confirmación

---

### `app/emergency.tsx`
Pantalla pública accesible sin login, mostrada al escanear el QR médico con cualquier cámara. Muestra los datos médicos críticos del portador del QR.

---

## 9. Componentes reutilizables

### `FloatingTabBar`
**Archivo:** `components/FloatingTabBar.tsx`

Tab bar personalizado que reemplaza el nativo de React Navigation:
- Flota sobre el contenido con `position: absolute`
- `pointerEvents="box-none"` en el View wrapper para no bloquear toques en la pantalla
- Pill amarillo (`#FAD957`) en el ícono activo
- Etiquetas reactivas al idioma con `useLanguage()` y `React.useMemo([t])`
- Colores invertidos respecto al tema: en modo claro el navbar es oscuro y viceversa

---

### `HealthRing` + `MetricChips`
**Archivo:** `components/HealthRing.tsx`

Visualización SVG animada de métricas vitales.

**`HealthRing`** — Anillo interactivo:
- Dibuja 4 arcos SVG de colores (corazón, pasos, calorías, actividad)
- Toque en segmento → selecciona métrica y agranda su ícono
- Anima la selección con `Animated`
- Score de salud centrado

**`MetricChips`** — Grid de 4 cards:
- Muestra ícono, etiqueta, valor y unidad de cada métrica
- Resalta la métrica seleccionada con borde coloreado

**Tipos exportados:**
```typescript
export type MetricIcon = 'heart' | 'footprints' | 'flame' | 'activity';
export type HealthMetric = {
  key: string; label: string; value: string | number;
  unit: string; icon: MetricIcon; color: keyof typeof RING_COLORS;
};
```

---

### `EmotionShape`
**Archivo:** `components/EmotionShape.tsx`

Formas decorativas SVG (corazón, estrella, cruz) usadas en las pantallas de login y registro para reforzar la identidad visual de la marca.

---

## 10. Sistema de temas

La paleta "Horus" está basada en tonos cálidos crema/oscuro que se invierten entre modos:

| Token | Modo Claro | Modo Oscuro | Uso |
|---|---|---|---|
| `BG` | `#F9F6ED` | `#1A1510` | Fondo de pantalla |
| `CARD` | `#FFFFFF` | `#252018` | Fondo de cards |
| `PRIMARY` | `#1A1512` | `#F5EFE6` | Texto principal, elementos destacados |
| `MUTED` | `#8C7F6E` | `#A89880` | Texto secundario, íconos |
| `MUTED_BG` | `#F3EFE7` | `#302820` | Fondo de chips, inputs |
| `GREEN` | `#96C979` | `#96C979` | Salud, éxito — **igual en ambos** |
| `YELLOW` | `#FAD957` | `#FAD957` | Tab activo, alertas — **igual en ambos** |
| `BLUE` | `#A5CCF4` | `#A5CCF4` | Información, GPS — **igual en ambos** |
| `PINK` | `#FAB2D3` | `#FAB2D3` | Corazón, avatar — **igual en ambos** |
| `RED` | `#C0392B` | `#E05050` | Error, logout |
| `RED_BG` | `#FDECEA` | `#3D1A1A` | Fondo de alertas destructivas |

Los estilos de cada pantalla se generan con `makeStyles(...tokens)` dentro de `React.useMemo([isDark])`, garantizando regeneración en un solo render al cambiar de tema.

El navbar tiene colores **invertidos** deliberadamente: en modo claro el fondo del navbar es oscuro (`#191512`) y en modo oscuro es crema (`PRIMARY = #F5EFE6`), creando un contraste visual fuerte.

---

## 11. Sistema de idiomas (i18n)

### Arquitectura
Todas las cadenas de texto viven en `contexts/LanguageContext.tsx` bajo la interfaz `T`. No se usa ninguna librería externa de i18n.

### Uso básico
```typescript
const { t } = useLanguage();

// t es un objeto — acceso directo, nunca función:
<Text>{t.dashTitle}</Text>
<Text>{t.cancel}</Text>
<Text>{t.registerEmail}</Text>
```

### Patrón para arrays de opciones traducibles
Los arrays que dependen del idioma (pickers de género, tipo de ID, meses) se calculan con `useMemo`:
```typescript
const GENDERS_T = React.useMemo(() => [
  { label: t.genderMale,      value: 'MALE'             },
  { label: t.genderFemale,    value: 'FEMALE'           },
  { label: t.genderOther,     value: 'OTHER'            },
  { label: t.genderPreferNot, value: 'PREFER_NOT_TO_SAY'},
], [t]);
```

### Organización de claves

| Prefijo | Pantalla / Sección |
|---|---|
| `dash*` | Dashboard |
| `monitor*` | Monitor |
| `qr*` | QR Médico / ID |
| `files*` | Archivos |
| `profile*` | Perfil |
| `register*` | Registro |
| `settings*` | Configuración |
| `nav*` | Navbar (FloatingTabBar) |
| `login*` | Login |
| Sin prefijo | Comunes: `cancel`, `save`, `months[]`, `years`, `genderMale`... |

---

## 12. API y backend

### Base URL
```
EXPO_PUBLIC_API_URL=https://tu-tunnel.ngrok-free.dev/api
```

El backend es un servidor Node.js/Express separado ubicado en `server/` (proyecto **horus-braslet**).

### Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro de usuario |
| `POST` | `/auth/login` | Login — retorna `accessToken` |
| `POST` | `/auth/logout` | Invalida la sesión en el servidor |
| `POST` | `/auth/device-code/generate` | Genera código temporal de vinculación con la manilla |
| `GET` | `/profile` | Obtiene datos completos del perfil |
| `PUT` | `/profile` | Actualiza campos del perfil (respeta lock-once del lado cliente) |
| `GET` | `/dashboard/info` | Datos del dashboard (timestamp de última sincronización) |
| `POST` | `/chat` | Envía mensaje al asistente IA |

### Autenticación JWT
1. Login exitoso → servidor retorna `accessToken`
2. Se almacena cifrado en `SecureStore` vía `setItem('horus_token', token)`
3. `setAuthToken(token)` lo inyecta en `apiClient.defaults.headers.common['Authorization']`
4. Todos los requests subsiguientes lo incluyen automáticamente
5. Si el servidor responde `401` → el interceptor llama al `unauthorizedHandler` → se limpia sesión → redirige a login

---

## 13. Cómo correr la aplicación

### Requisitos previos
```bash
node >= 18
npm >= 9
```

### Instalación
```bash
git clone https://github.com/maryhug/horus-mobile.git
cd horus-mobile
npm install
```

---

### iOS (simulador o dispositivo físico)

**Simulador** *(requiere macOS + Xcode instalado)*:
```bash
npm run ios
# equivalente a:
npx expo start --ios
```

**Dispositivo físico:**
1. Instalar **Expo Go** desde la App Store
2. Ejecutar `npx expo start`
3. Escanear el QR con la cámara (iOS 16+) o la app Expo Go

> ⚠️ Para usar NFC y BLE en un dispositivo físico se necesita un **build nativo**:
> ```bash
> npx expo run:ios
> ```
> Expo Go no soporta `react-native-nfc-manager` ni `react-native-ble-plx`.

---

### Android (emulador o dispositivo físico)

**Emulador** *(requiere Android Studio con un AVD configurado)*:
```bash
npm run android
# equivalente a:
npx expo start --android
```

**Dispositivo físico:**
1. Instalar **Expo Go** desde Google Play
2. Ejecutar `npx expo start`
3. Escanear el QR con la app Expo Go

> ⚠️ Igual que iOS: para NFC y BLE usar `npx expo run:android`

---

### Web (navegador)
```bash
npm run web
# equivalente a:
npx expo start --web
```

La app corre en `http://localhost:8081`. Funciones de hardware (NFC, BLE, SecureStore) no están disponibles y se degradan con la implementación web.

---

### Modo LAN (dispositivos en la misma red WiFi)
```bash
npm run start:lan
```
Útil cuando el emulador tiene problemas de conexión con el servidor de Metro por NAT o VPN.

---

### Correr el backend junto con la app

El servidor Node.js vive en `server/`:
```bash
# Terminal 1 — App móvil
npx expo start

# Terminal 2 — Servidor backend
npm run server

# O con tunnel ngrok (expone el servidor a internet):
npm run server:tunnel
```

Una vez que ngrok genere la URL, actualiza el `.env` con ella.

---

## 14. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# URL del backend — sin trailing slash, incluye /api
EXPO_PUBLIC_API_URL=https://tu-servidor.ngrok-free.dev/api
```

> Las variables con prefijo `EXPO_PUBLIC_` son accesibles en el bundle del cliente. Sin ese prefijo, solo las lee el servidor.

Si no se define la variable, `services/api.ts` usa el valor hardcodeado del servidor de desarrollo por defecto.

---

## 15. Notas de desarrollo

### Patrón de estilos (todas las pantallas)
```typescript
// 1. makeStyles recibe los tokens de color del tema
function makeStyles(BG: string, CARD: string, PRIMARY: string, ...) {
  return StyleSheet.create({ ... });
}

// 2. Se genera dentro del componente, solo se regenera al cambiar el tema
const s = React.useMemo(
  () => makeStyles(BG, CARD, PRIMARY, ...),
  [isDark]
);
```

### TypeScript estricto — cero `any`
- Nombres de íconos Ionicons: `type IoniconsName = ComponentProps<typeof Ionicons>['name']`
- Rutas de navegación: `type Href` de `expo-router`
- Width porcentual en estilos: `as DimensionValue`
- Payloads de API: interfaces de `types/api.ts` (e.g. `ProfileUpdatePayload`)
- `HealthMetric.icon`: `type MetricIcon = 'heart' | 'footprints' | 'flame' | 'activity'`

### Lógica lock-once de campos médicos
Los campos médicos en perfil (`bloodType`, `dateOfBirth`, `gender`, `identificationType`, `identificationNumber`) siguen estas reglas:

```typescript
// Se calculan al cargar el perfil
const medicalLocked = React.useMemo(() => ({
  bloodType:            !!profile?.bloodType,
  dob:                  !!profile?.dateOfBirth,
  gender:               !!profile?.gender,
  identificationType:   !!profile?.identificationType,
  identificationNumber: !!profile?.identificationNumber,
}), [profile]);

// En handleSave — solo se envían los campos NO bloqueados
if (!medicalLocked.bloodType && draft.bloodType)
  payload.bloodType = draft.bloodType;
```

Una vez que un campo tiene valor en la base de datos, se muestra con `opacity: 0.55` + ícono de candado 🔒 y no puede modificarse desde la app.

### Singleton de asistente
`useAssistant` no usa Context. En su lugar usa variables de módulo compartidas:
```typescript
let globalId: AssistantId = 'tinto';
const listeners = new Set<(id: AssistantId) => void>();

function broadcast(id: AssistantId) {
  globalId = id;
  listeners.forEach(fn => fn(id)); // notifica a todos los componentes suscritos
}
```
Esto evita re-renders de componentes no relacionados y funciona sin Provider.
