const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ENV_PATH = path.join(__dirname, '..', '.env');

function updateEnv(url) {
  const newUrl = `${url}/api`;
  let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  if (envContent.includes('EXPO_PUBLIC_API_URL=')) {
    envContent = envContent.replace(/EXPO_PUBLIC_API_URL=.*/, `EXPO_PUBLIC_API_URL=${newUrl}`);
  } else {
    envContent += `\nEXPO_PUBLIC_API_URL=${newUrl}\n`;
  }
  fs.writeFileSync(ENV_PATH, envContent);
  return newUrl;
}

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: PORT });
    const newUrl = updateEnv(tunnel.url);

    console.log('\n========================================');
    console.log(`  Tunnel activo:  ${tunnel.url}`);
    console.log(`  .env actualizado: ${newUrl}`);
    console.log('========================================\n');

    tunnel.on('close', () => {
      console.log('Tunnel cerrado. Reconectando en 3 segundos...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Error en el tunnel:', err.message, '— Reconectando...');
      tunnel.close();
    });
  } catch (err) {
    console.error('No se pudo iniciar el tunnel:', err.message, '— Reintentando en 5 segundos...');
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
