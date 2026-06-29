# Horus Mobile

> The central hub of the Horus health ecosystem — a React Native / Expo application that unifies medical identity, real-time vitals monitoring, AI-assisted health guidance, and emergency response into a single cross-platform experience.

---

## Table of Contents

1. [Ecosystem Overview](#1-ecosystem-overview)
2. [What Horus Mobile Does](#2-what-horus-mobile-does)
3. [Architecture](#3-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [Core Modules](#6-core-modules)
7. [Embedded Backend](#7-embedded-backend)
8. [API Reference](#8-api-reference)
9. [Design System](#9-design-system)
10. [Internationalization](#10-internationalization)
11. [Running the App](#11-running-the-app)
12. [Environment Variables](#12-environment-variables)
13. [Building for Production](#13-building-for-production)

---

## 1. Ecosystem Overview

Horus is a personal medical identity and emergency response ecosystem composed of five interconnected products:

```
┌─────────────────────────────────────────────────────────────────┐
│                        HORUS ECOSYSTEM                          │
│                                                                 │
│   ┌──────────────┐      ┌──────────────┐     ┌──────────────┐  │
│   │ horus-mobile │◄────►│horus-braslet │     │  horus-watch │  │
│   │  (this repo) │      │  (wristband) │     │  (Wear OS)   │  │
│   │  React Native│      │  Next.js PWA │     │   Kotlin     │  │
│   └──────┬───────┘      └──────────────┘     └──────┬───────┘  │
│          │                                           │          │
│          │            ┌──────────────┐              │          │
│          └───────────►│horus-emergency│◄─────────────┘          │
│                       │  QR Scanner  │                          │
│                       │  Next.js     │                          │
│                       └──────────────┘                          │
│                                                                 │
│                    Firebase (FCM + Firestore)                   │
│                    PostgreSQL · Cloudinary · Render             │
└─────────────────────────────────────────────────────────────────┘
```

| Product | Role |
|---|---|
| **horus-mobile** | Central app — health dashboard, AI assistant, medical QR ID, file manager |
| **horus-braslet** | Next.js PWA displayed on the smart wristband; reads OCR'd clinical files |
| **horus-watch** | Wear OS companion app; receives FCM push alerts when the user's QR is scanned |
| **horus-emergency** | Public Next.js scanner; reads QR codes and triggers notifications to phone + watch |
| **horus-mobile/server** | Express.js REST API embedded in this repo; serves all clients |

### How the products connect

1. The user registers in **horus-mobile** and completes their medical profile.
2. The app generates a **medical QR ID** encoding the user's server ID.
3. A first responder scans the QR with **horus-emergency** — which pulls the medical profile, saves a notification to Firestore, and sends push alerts to the user's phone (Expo) and watch (FCM).
4. The **horus-watch** receives the FCM alert via its registered token, stored in Firestore by the mobile server after login.
5. **horus-braslet** connects to the same backend to display clinical files and OCR data on the wristband screen.

---

## 2. What Horus Mobile Does

| Feature | Description |
|---|---|
| **Medical QR ID** | Generates a personal emergency QR code readable by any camera — no app required on the scanner side |
| **Health Dashboard** | Displays real-time vitals (heart rate, steps, calories, activity) synced from the wearable |
| **Wearable Monitor** | Tracks BLE/NFC wristband status, battery, GPS, firmware version and last sync |
| **AI Health Assistant** | Context-aware chat with three selectable assistant personas (Tinto, Oblea, Bocadillo) |
| **Clinical File Manager** | Upload, organize, and download medical documents (PDF, CSV, PNG, JSON) via Cloudinary |
| **Medical Profile** | One-time lock on sensitive fields (blood type, DOB, ID number) to prevent accidental overwrite |
| **Watch Pairing** | Generates a 6-digit OTP device code for secure Wear OS companion login |
| **Push Notifications** | Receives alerts when QR is scanned — delivered via Expo Push on phone and FCM on watch |
| **Public Emergency View** | Unauthenticated screen shown to first responders with critical medical data |
| **Theming & i18n** | Light / dark mode, Spanish / English / Portuguese — all persisted per device |

---

## 3. Architecture

### Client

```
React Native (Expo SDK 54)
│
├── Expo Router (file-based routing)           → app/ directory maps to URL paths
├── React Context + custom hooks               → global auth, theme, language state
├── Singleton module pattern                   → useAssistant() — no Provider needed
├── makeStyles + useMemo([isDark])             → theme-reactive StyleSheets
├── SecureStore                                → encrypted JWT + session persistence
└── Axios with interceptors                    → auth token injection, 401 auto-logout
```

### Server (`server/`)

```
Express.js (TypeScript)
│
├── JWT authentication (jsonwebtoken + bcryptjs)
├── express-rate-limit (trust proxy = 1 for Render)
├── Prisma ORM → PostgreSQL (Supabase / Neon)
├── Firebase Admin SDK → FCM messaging + Firestore token storage
├── Cloudinary SDK → clinical file upload/download
└── expo-server-sdk → Expo push notification delivery
```

### Data flow

```
horus-mobile app
    │
    ▼
POST /api/auth/login
    │
    ├─► PostgreSQL (user record, medical profile, clinical files)
    ├─► Firestore horus-64e3b (watch FCM token saved on login)
    └─► Cloudinary (clinical file storage)

horus-emergency scans QR
    │
    ▼
POST /api/scan/:userId  (horus-emergency → horus-mobile server)
    │
    ├─► Expo Push → phone notification
    ├─► FCM → Firestore horus-64e3b → watch FCM token → watch notification
    └─► Firestore → saves notification record for in-app display
```

---

## 4. Tech Stack

### Mobile client

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native | 0.81.5 |
| Runtime | Expo SDK | ~54.0.33 |
| Language | TypeScript | ~5.9.2 |
| UI engine | React | 19.1.0 |
| Routing | Expo Router (file-based) | ~6.0.23 |
| HTTP client | Axios | ^1.16.1 |
| Web support | React Native Web | ^0.21.0 |

### Mobile client — key packages

| Package | Purpose |
|---|---|
| `expo-secure-store` | Encrypted JWT and session storage (iOS Keychain / Android Keystore) |
| `expo-notifications` | Expo push token registration and foreground notification handler |
| `expo-av` | Audio playback for AI voice mode responses |
| `expo-document-picker` | Clinical file selection |
| `expo-local-authentication` | Biometric authentication (FaceID / fingerprint) |
| `expo-location` | GPS coordinates for wearable monitor |
| `react-native-ble-plx` | Bluetooth Low Energy communication with Horus Bráslet |
| `react-native-nfc-manager` | NFC tag reading for emergency identification |
| `react-native-qrcode-svg` | Medical QR ID generation |
| `react-native-svg` | Custom SVG icons and the animated HealthRing |
| `expo-linear-gradient` | Gradient accents throughout the UI |

### Embedded server

| Layer | Technology |
|---|---|
| Runtime | Node.js / Express.js (TypeScript) |
| ORM | Prisma with PostgreSQL adapter |
| Database | PostgreSQL (Supabase / Neon compatible) |
| Push (phone) | expo-server-sdk |
| Push (watch) | Firebase Admin SDK — FCM |
| Realtime tokens | Firebase Admin SDK — Firestore (`horus-64e3b`) |
| File storage | Cloudinary |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Rate limiting | express-rate-limit (trust proxy enabled for Render) |
| Deployment | Render (free tier + UptimeRobot keep-alive) |

---

## 5. Project Structure

```
horus-mobile/
│
├── app/                              # Screens — Expo Router file-based routing
│   ├── _layout.tsx                   # Root layout: providers, fonts, RouteGuard
│   ├── index.tsx                     # Splash / initial redirect
│   ├── login.tsx                     # Login screen
│   ├── register.tsx                  # Registration (basic info only)
│   ├── settings.tsx                  # App settings (theme, language, assistant, device)
│   ├── emergency.tsx                 # Public emergency view (no auth required)
│   └── (tabs)/
│       ├── _layout.tsx               # Tab navigator with custom FloatingTabBar
│       ├── dashboard.tsx             # Main health dashboard
│       ├── monitor.tsx               # Wearable device monitor
│       ├── qr-medico.tsx             # Medical QR ID generator
│       ├── assistant.tsx             # AI chat assistant
│       ├── files.tsx                 # Clinical file manager
│       └── profile.tsx               # User medical profile (lock-once fields)
│
├── components/
│   ├── FloatingTabBar.tsx            # Custom floating tab bar (i18n-aware)
│   ├── HealthRing.tsx                # Animated SVG health ring + MetricChips
│   └── EmotionShape.tsx             # Decorative SVG shapes (login / register)
│
├── contexts/
│   ├── AuthContext.tsx               # User session, JWT, login/logout, token refresh
│   ├── ThemeContext.tsx              # Light/dark theme, persisted in SecureStore
│   └── LanguageContext.tsx           # i18n — ES / EN / PT, 300+ typed keys
│
├── hooks/
│   ├── useApi.ts                     # Generic data fetcher with loading/error/refetch
│   ├── useAppTheme.ts                # Direct access to active theme color tokens
│   └── useAssistant.ts              # Singleton pattern — selected AI assistant
│
├── services/
│   └── api.ts                        # Axios instance, interceptors, auth token helpers
│
├── types/
│   └── api.ts                        # TypeScript interfaces for all API contracts
│
├── constants/
│   ├── theme.ts                      # LIGHT / DARK color token palettes
│   ├── colors.ts                     # Extended AppColors palette
│   └── fonts.ts                      # FONT.displayBold, FONT.sansMedium, etc.
│
├── utils/
│   ├── storage.ts                    # SecureStore abstraction (native)
│   └── storage.web.ts               # localStorage implementation (web)
│
├── assets/
│   └── assistants/                   # PNG images for Tinto, Oblea, Bocadillo
│
├── server/                           # Embedded Express.js backend
│   └── src/
│       ├── index.ts                  # Entry point, trust proxy, middleware
│       ├── routes/                   # auth, profile, dashboard, chat, wearable, files
│       ├── services/                 # notification.ts (push + FCM), cloudinary
│       ├── lib/                      # firebase.ts, firestore.ts, prisma
│       └── middleware/               # requireAuth, error handler
│
├── app.json                          # Expo config (bundle ID, icons, splash, EAS project)
├── eas.json                          # EAS Build profiles (preview, production)
└── server/render.yaml                # Render deployment manifest
```

---

## 6. Core Modules

### RouteGuard (`app/_layout.tsx`)

Wraps the entire navigation tree. Automatically redirects:
- Unauthenticated user trying to access `(tabs)` → `/login`
- Authenticated user accessing `/login`, `/register`, or `/` → `/(tabs)/dashboard`

### AuthContext

```typescript
const { user, isAuthenticated, isLoading, login, logout, updateUser } = useAuth();
```

On mount, restores session from `SecureStore`. On `401` response, the Axios interceptor triggers `unauthorizedHandler` → clears session → redirects to login. On login, silently registers the Expo push token and syncs remote preferences in the background.

### Medical QR ID

The QR encodes the user's server UUID. When scanned by `horus-emergency`, that UUID is used to call `GET /api/public/profile/:userId` — no sensitive data is embedded in the QR itself. Privacy toggles control which fields are surfaced to the scanner.

### Watch Pairing (OTP device code)

The mobile app calls `POST /api/auth/device-code/generate` which returns a 6-digit code valid for 2 minutes (bcrypt-hashed, single-use, max 3 attempts). The Wear OS companion inputs this code to authenticate and receive a JWT — after which it registers its FCM token with the server so the watch can receive scan notifications.

### Lock-once Medical Fields

`bloodType`, `dateOfBirth`, `gender`, `identificationType`, and `identificationNumber` can only be set once. Once a value exists in the database, the field renders with reduced opacity and a lock icon — the save handler filters locked fields out of the `PUT /api/profile` payload entirely.

### AI Assistant — singleton pattern

`useAssistant()` shares state across all components via module-level variables, with no Context Provider:

```typescript
let globalId: AssistantId = 'tinto';
const listeners = new Set<(id: AssistantId) => void>();
```

All subscribers re-render when the assistant changes from Settings, without triggering unrelated components.

### Voice Mode

The AI assistant includes a voice interaction mode powered by `expo-av`. A race condition between audio playback completion and `stopAll()` is resolved by clearing `sound.current = null` synchronously before async stop/unload operations, so the playback status callback sees null and skips re-triggering the microphone.

---

## 7. Embedded Backend

The `server/` directory contains a full Express.js REST API that ships alongside the app. It is deployed independently to **Render**.

### Key design decisions

| Decision | Reason |
|---|---|
| `app.set('trust proxy', 1)` | Render uses a reverse proxy; required for `express-rate-limit` to read `X-Forwarded-For` correctly |
| Two Firebase projects | `horus-98edf` — FCM message sending. `horus-64e3b` — Firestore data (notifications, watch tokens). Kept separate to isolate messaging credentials from application data |
| Watch token in Firestore | Watch FCM tokens are written to `horus-64e3b` Firestore by the server (not by the watch directly) so `horus-emergency` can always read from a single authoritative source |
| `expo-server-sdk` for phone push | Phone tokens are Expo push tokens (`ExponentPushToken[...]`); watch tokens are raw FCM tokens — handled by separate code paths |
| Cloudinary for files | Binary file storage offloaded from the database; the DB stores only metadata and Cloudinary public IDs |

### Deployment

```
Build:   npm install --include=dev && npm run build
Start:   npm start
Health:  GET /api/health  →  { ok: true }
```

UptimeRobot pings `/api/health` every 5 minutes to prevent the free-tier instance from sleeping.

---

## 8. API Reference

All routes require `Authorization: Bearer <token>` unless marked public.

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create a new account |
| `POST` | `/api/auth/login` | — | Login — returns `accessToken` |
| `POST` | `/api/auth/logout` | ✓ | Invalidate server-side session |
| `POST` | `/api/auth/device-code/generate` | ✓ | Generate 6-digit OTP for watch pairing |
| `POST` | `/api/auth/device-code/verify` | — | Verify OTP — returns watch JWT |

### Profile

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profile` | ✓ | Full user profile |
| `PUT` | `/api/profile` | ✓ | Update profile fields |
| `POST` | `/api/profile/push-token` | ✓ | Register Expo push token (phone) |
| `POST` | `/api/profile/watch-token` | ✓ | Register FCM token (watch) |
| `DELETE` | `/api/profile/watch-token` | ✓ | Remove watch FCM token on logout |
| `GET` | `/api/public/profile/:userId` | — | Public medical data (QR scan) |

### Dashboard & Health

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/info` | ✓ | Dashboard summary and last sync timestamp |
| `POST` | `/api/wearable/readings` | ✓ | Ingest vitals from watch (heart rate, steps, calories, activity, battery) |

### AI Assistant

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat` | ✓ | Send message — returns assistant reply |

### Files

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/files` | ✓ | List clinical files |
| `POST` | `/api/files/upload` | ✓ | Upload file to Cloudinary |
| `GET` | `/api/files/:id/download` | ✓ | Download file |
| `DELETE` | `/api/files/:id` | ✓ | Delete file |

### Emergency

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/scan/:userId` | — | Called by horus-emergency after QR scan — logs scan, sends push to phone + watch |

---

## 9. Design System

### Color palette

Horus uses a warm cream / dark-brown palette. Accent colors are **identical in both themes** to maintain consistent health metric association.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `BG` | `#F9F6ED` | `#1A1510` | Screen background |
| `CARD` | `#FFFFFF` | `#252018` | Card / sheet background |
| `PRIMARY` | `#1A1512` | `#F5EFE6` | Body text, primary elements |
| `MUTED` | `#8C7F6E` | `#A89880` | Secondary text, icons |
| `MUTED_BG` | `#F3EFE7` | `#302820` | Input backgrounds, chips |
| `GREEN` | `#96C979` | `#96C979` | Health positive, success |
| `YELLOW` | `#FAD957` | `#FAD957` | Active tab indicator, warnings |
| `BLUE` | `#A5CCF4` | `#A5CCF4` | Info, GPS, connectivity |
| `PINK` | `#FAB2D3` | `#FAB2D3` | Heart rate, avatar accents |
| `RED` | `#C0392B` | `#E05050` | Errors, destructive actions |

### Typography

| Constant | Font | Weight | Usage |
|---|---|---|---|
| `FONT.displayBold` | Space Grotesk | 700 | Titles, metric values, scores |
| `FONT.displaySemiBold` | Space Grotesk | 600 | Section headers |
| `FONT.sansBold` | DM Sans | 700 | Button labels, card titles |
| `FONT.sansMedium` | DM Sans | 500 | Body text, labels |
| `FONT.sansRegular` | DM Sans | 400 | Secondary text, captions |

### Style pattern

All screens use the `makeStyles` + `useMemo` pattern to regenerate `StyleSheet` only when the theme changes:

```typescript
function makeStyles(BG: string, CARD: string, PRIMARY: string, MUTED: string) {
  return StyleSheet.create({ container: { flex: 1, backgroundColor: BG }, ... });
}

// Inside component:
const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED), [isDark]);
```

### Floating Tab Bar

The tab bar is a fully custom component (`FloatingTabBar.tsx`) that replaces React Navigation's default:
- Floats over content with `position: 'absolute'`
- `pointerEvents="box-none"` prevents blocking touches on the screen behind it
- `overflow: 'hidden'` on the active icon wrapper clips the yellow circular indicator correctly on Android
- Colors intentionally inverted vs the screen: light theme → dark navbar; dark theme → cream navbar

---

## 10. Internationalization

Built-in i18n with zero external dependencies. All strings live in `contexts/LanguageContext.tsx` under the typed `T` interface.

```typescript
const { language, setLanguage, t } = useLanguage();

// t is an object — direct property access, never a function call:
<Text>{t.dashTitle}</Text>
<Text>{t.navProfile}</Text>
```

**Supported languages:**

| Code | Language |
|---|---|
| `es` | Spanish (base language) |
| `en` | English |
| `pt` | Portuguese (Brazil) |

**Key naming convention:**

| Prefix | Screen / Section |
|---|---|
| `dash*` | Dashboard |
| `monitor*` | Device monitor |
| `qr*` | Medical QR ID |
| `files*` | Clinical files |
| `profile*` | User profile |
| `settings*` | Settings |
| `nav*` | Tab bar labels |
| `register*` | Registration |
| `login*` | Login |
| *(none)* | Shared: `cancel`, `save`, `months`, `genderMale`, … |

---

## 11. Running the App

### Prerequisites

```
Node.js >= 18
npm >= 9
```

### Install

```bash
git clone <repo-url>
cd horus-mobile
npm install
```

### Android (emulator or physical device)

```bash
# Emulator — requires Android Studio with an AVD
npm run android

# Physical device via Expo Go (no NFC/BLE support)
npx expo start
# Scan QR with Expo Go app
```

### iOS (simulator or physical device)

```bash
# Simulator — requires macOS + Xcode
npm run ios

# Physical device via Expo Go
npx expo start
# Scan QR with iPhone camera or Expo Go app
```

> **Note:** NFC (`react-native-nfc-manager`) and BLE (`react-native-ble-plx`) require a native build. They are not available in Expo Go.
>
> ```bash
> npx expo run:android   # or run:ios
> ```

### Web

```bash
npm run web
# Opens at http://localhost:8081
```

Hardware features (NFC, BLE, SecureStore) gracefully degrade on web.

### Run the backend alongside the app

```bash
# Terminal 1 — Mobile app
npx expo start

# Terminal 2 — Backend server
cd server
npm run dev
```

---

## 12. Environment Variables

Create `.env` in the project root:

```env
# Backend URL — no trailing slash, include /api
EXPO_PUBLIC_API_URL=https://horus-mobile.onrender.com/api
```

Variables prefixed with `EXPO_PUBLIC_` are bundled into the client at build time. The server reads its own environment variables from `server/.env` (or from Render's environment in production).

**Server environment variables** (set in Render dashboard or `server/.env`):

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FIREBASE_FCM_JSON={"type":"service_account",...}      # horus-98edf credentials
FIREBASE_FIRESTORE_JSON={"type":"service_account",...} # horus-64e3b credentials
```

---

## 13. Building for Production

Horus Mobile uses **EAS Build** (Expo Application Services) for production APK/IPA generation.

### Android APK (preview)

```bash
eas build --platform android --profile preview
```

### Android AAB (production — Google Play)

```bash
eas build --platform android --profile production
```

The `EXPO_PUBLIC_API_URL` variable is read from the local `.env` file at build time and baked into the bundle. Update it to the Render production URL before building.

### Server deployment (Render)

The backend deploys automatically from the `server/` directory via `server/render.yaml`:

```
Build command:  npm install --include=dev && npm run build
Start command:  npm start
Health check:   GET /api/health
```

`--include=dev` is required because TypeScript and type packages live in `devDependencies` but are needed to compile the server.
