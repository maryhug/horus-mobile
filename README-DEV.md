# Guía de Desarrollo Local — Horus Mobile (LocalTunnel)

Esta guía explica cómo levantar el entorno de desarrollo local para la aplicación móvil y la API, permitiendo la conexión desde dispositivos físicos (celulares) sin cables y saltando las restricciones de Windows Defender y cortafuegos.

---

## 🛠️ Requisitos Previos

1. **Dependencias del Proyecto**: Asegúrate de instalar los módulos en el cliente y en el servidor:
   * **Raíz (App Móvil)**: `npm install`
   * **Carpeta `/server` (API)**: `cd server && npm install`

2. **Puertos del Firewall**: Si vas a probar usando la IP local, abre los puertos en tu PC:
   * Busca el archivo `firewall-admin.ps1` en la raíz.
   * Haz clic derecho sobre él y selecciona **"Ejecutar con PowerShell"** (solicitará permisos de administrador). Esto abrirá los puertos `8081`, `19000-19002` y el `3000` de la API.

---

## 🚀 Cómo Iniciar el Entorno (Automático)

Para iniciar todo el ecosistema con un solo comando, abre una terminal de PowerShell en la raíz del proyecto y ejecuta:

```powershell
.\start-dev.ps1
```

Este script automatiza los siguientes pasos:
1. Inicia el servidor de la API en el puerto `3000`.
2. Levanta un túnel público seguro usando **LocalTunnel** (que no es bloqueado por Windows Defender).
3. Obtiene tu IP pública y actualiza el archivo `.env` (`EXPO_PUBLIC_API_URL`) de forma automática con la URL del túnel.
4. Levanta el servidor de Expo con soporte de túnel para Metro.

---

## 🔑 Paso Crítico: Contraseña de LocalTunnel (Bypass)

Debido a medidas de seguridad contra phishing, la primera vez que accedas al enlace del túnel desde cualquier dispositivo (PC o móvil), verás una pantalla gris de advertencia de LocalTunnel.

### Instrucciones para saltarlo:
1. En la consola donde se inició el túnel, verás un bloque informativo como este:
   ```text
   ========================================
     Tunnel activo:  https://famous-trees-itch.loca.lt
     .env actualizado: https://famous-trees-itch.loca.lt/api
     Contraseña del túnel (IP Pública): 186.XX.XX.XX
   ========================================
   ```
2. Copia la **IP Pública** que se muestra como contraseña (ej. `186.XX.XX.XX`).
3. Abre la URL del túnel (ej: `https://famous-trees-itch.loca.lt`) en el navegador de tu PC y en tu celular.
4. Pega la IP pública en el campo **"Tunnel Password"** y haz clic en **"Submit"**.

> [!NOTE]
> Una vez hecho esto, se guardará una cookie en tu navegador y el túnel funcionará de forma transparente para todas las peticiones del proyecto sin volver a pedir la contraseña.

---

## 📲 Ficha Médica QR

El código QR generado en la pestaña **"ID Médico"** dentro de la aplicación móvil se construye dinámicamente utilizando la URL activa en tu archivo `.env`.

* Al escanear el QR desde la cámara de tu celular, el enlace te redirigirá a la vista de emergencia (`https://xxxx.loca.lt/emergency/ID_DEL_USUARIO`) servida por tu backend local.
* Asegúrate de recargar/refrescar la app web (`Ctrl + F5`) si reinicias el túnel para que tome la nueva dirección del archivo `.env`.
