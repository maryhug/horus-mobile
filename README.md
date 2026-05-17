# Horus Braslet — Mobile App

Aplicacion movil para la manilla inteligente **Horus Braslet**. Permite monitorear metricas de salud en tiempo real, recibir alertas de seguridad, consultar un asistente con IA y gestionar archivos del dispositivo. Construida con React Native + Expo.

---

## Pantallas

| Pantalla | Descripcion |
|---|---|
| **Login** | Autenticacion con correo y contrasena |
| **Dashboard** | Metricas en tiempo real: frecuencia cardiaca, pasos, calorias, actividad, estado del dispositivo, bateria y alertas |
| **Asistente IA** | Chat para consultar datos de la manilla en lenguaje natural |
| **Archivos** | Subida y gestion de reportes, configuraciones e historiales (PDF, CSV, JSON, PNG) |
| **Emergencia** | Vista de acceso rapido con informacion medica critica del paciente (accesible via NFC) |

---

## Stack tecnologico

- [Expo](https://expo.dev) (SDK 53)
- [React Native](https://reactnative.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Expo Router](https://expo.github.io/router) — enrutamiento basado en archivos
- [react-native-nfc-manager](https://github.com/revtel/react-native-nfc-manager) — lectura NFC
- [@expo/vector-icons](https://icons.expo.fyi) — iconografia (Ionicons)
- [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)

---

## Requisitos previos

- Node.js >= 18
- npm o yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Para dispositivo fisico: app **Expo Go** o build de desarrollo

---

## Instalacion

```bash
git clone https://github.com/<tu-usuario>/horus-mobile.git
cd horus-mobile
npm install
```

---

## Ejecutar en desarrollo

```bash
# Iniciar el servidor de Expo
npx expo start

# Android
npx expo run:android

# iOS
npx expo run:ios
```

---

## Estructura del proyecto

```
horus-mobile/
├── app/
│   ├── _layout.tsx          # Layout raiz (Stack navigator)
│   ├── index.tsx            # Redireccion a /login
│   ├── login.tsx            # Pantalla de autenticacion
│   ├── emergency.tsx        # Vista de emergencia medica (NFC)
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigator
│       ├── dashboard.tsx    # Panel de control principal
│       ├── assistant.tsx    # Asistente IA
│       └── files.tsx        # Gestion de archivos
├── constants/
│   └── colors.ts            # Paleta de colores (tema oscuro + cian)
└── assets/                  # Iconos y splash screen
```

---
