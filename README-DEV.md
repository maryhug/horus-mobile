# Local Development Guide — Horus Mobile

This guide covers how to run the full Horus Mobile development environment locally, including the Express API server, and how to connect physical Android/iOS devices without cables.

---

## Prerequisites

1. **Install dependencies** in both the app root and the server:

   ```bash
   # App (React Native / Expo)
   npm install

   # Embedded backend
   cd server && npm install
   ```

2. **Environment file** — create `.env` in the project root:

   ```env
   EXPO_PUBLIC_API_URL=https://horus-mobile.onrender.com/api
   ```

   For local development with a tunnel, this file is updated automatically by the startup script (see below).

3. **Firewall ports** (Windows only) — if you plan to test over LAN, open the required ports:
   - Find `firewall-admin.ps1` in the project root
   - Right-click → **Run with PowerShell** (requires admin)
   - Opens ports `8081`, `19000–19002` (Expo Metro) and `3000` (API server)

---

## Quick Start (automated)

Open a PowerShell terminal in the project root and run:

```powershell
.\start-dev.ps1
```

This script does the following in sequence:

1. Starts the Express API server on port `3000`
2. Starts a **LocalTunnel** public tunnel (not blocked by Windows Defender, unlike ngrok on restricted networks)
3. Fetches your public IP and writes the tunnel URL into `.env` as `EXPO_PUBLIC_API_URL` automatically
4. Starts the Expo Metro server with tunnel support

Once running, scan the Expo QR code with **Expo Go** (Android) or the iOS Camera app to launch the app on your device.

---

## LocalTunnel Password Bypass

LocalTunnel shows a gray security warning page the first time any device accesses the tunnel URL. This is a one-time step per device.

**Steps:**

1. In the terminal where the tunnel started, look for the info block:

   ```
   ========================================
     Tunnel active:   https://famous-trees-itch.loca.lt
     .env updated:    https://famous-trees-itch.loca.lt/api
     Tunnel password: 186.XX.XX.XX
   ========================================
   ```

2. Copy the **public IP** shown as the tunnel password (e.g. `186.XX.XX.XX`)
3. Open the tunnel URL (e.g. `https://famous-trees-itch.loca.lt`) in the browser on both your PC and your phone
4. Paste the public IP into the **"Tunnel Password"** field and click **Submit**

> A cookie is saved in the browser. After this, all API requests from the app will pass through the tunnel transparently — no further password prompts.

---

## Running Against Production (Render)

If you don't need to test local server changes, point the app at the deployed backend:

```env
# .env
EXPO_PUBLIC_API_URL=https://horus-mobile.onrender.com/api
```

Then start only the Expo client:

```bash
npx expo start
```

The Render server runs at `https://horus-mobile.onrender.com`. An UptimeRobot monitor pings `GET /api/health` every 5 minutes to prevent the free-tier instance from sleeping.

---

## Running the Server Alone

```bash
cd server
npm run dev       # ts-node-dev with hot reload
# or
npm run build && npm start   # compiled JS
```

The server starts on `http://localhost:3000`. All routes are prefixed with `/api`.

---

## Medical QR ID — Local Testing

The QR generated on the **Medical ID** tab is built from the active `EXPO_PUBLIC_API_URL`. When scanned:

- The camera opens `<tunnel-url>/emergency/<userId>` — the public emergency view served by your local backend
- If you restart the tunnel (new URL), reload the app so Metro picks up the updated `.env`
- To test the full scan flow locally, open `horus-emergency` and point it at the same tunnel URL

---

## Connecting the Watch (Wear OS Emulator)

To test the watch pairing flow during local development:

1. Start an Android Wear OS emulator in Android Studio (`Device Manager → Wear OS`)
2. In the mobile app, go to **Settings → Device → Generate pairing code**
3. Enter the 6-digit code in the watch emulator login screen
4. The watch authenticates against the same backend URL configured in `Constants.kt`:

   ```kotlin
   // horus-watch/app/src/main/java/com/horus/wear/presentation/util/Constants.kt
   const val BASE_URL = "https://horus-mobile.onrender.com"
   ```

   Change this to your local tunnel URL if you need end-to-end local testing.

---

## Push Notifications in Development

- **Expo Go**: push notifications work out of the box — the Expo push token is registered on login
- **Standalone APK**: token is registered on login or session restore; do not run Expo Go simultaneously as it will overwrite the token stored on the server
- **Watch notifications**: require the server to be reachable (Render or tunnel) — FCM delivery goes through Google's servers regardless of local/prod

---

## Common Issues

| Issue | Cause | Fix |
|---|---|---|
| App shows "Recurso no encontrado" | `EXPO_PUBLIC_API_URL` not set or pointing to a dead tunnel | Update `.env` and restart Metro (`r` in terminal) |
| Tunnel URL changes on restart | LocalTunnel assigns a random subdomain each run | Re-run `.\start-dev.ps1` — `.env` is updated automatically |
| NFC / BLE not working in Expo Go | Expo Go does not support native modules | Use `npx expo run:android` for a native build |
| Watch emulator shows no profile data | Watch JWT expired or wrong BASE_URL | Re-login in the watch emulator with a fresh pairing code |
| Server `ValidationError: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` | Rate limiter receives `X-Forwarded-For` without trust proxy | Ensure `app.set('trust proxy', 1)` is in `server/src/index.ts` — already set for Render |
