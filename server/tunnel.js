const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ENV_PATH = path.join(__dirname, '..', '.env');

function updateEnv(url) {
  const newUrl = `${url}/api`;
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  if (content.includes('EXPO_PUBLIC_API_URL=')) {
    content = content.replace(/EXPO_PUBLIC_API_URL=.*/, `EXPO_PUBLIC_API_URL=${newUrl}`);
  } else {
    content += `\nEXPO_PUBLIC_API_URL=${newUrl}\n`;
  }
  fs.writeFileSync(ENV_PATH, content);
  return newUrl;
}

function startTunnel() {
  console.log(`Iniciando ngrok tunnel en puerto ${PORT}...`);

  const proc = spawn('ngrok', ['http', PORT.toString()], {
    stdio: 'ignore'
  });

  let urlFound = false;

  async function checkTunnel() {
    if (urlFound) return;
    try {
      const response = await fetch('http://127.0.0.1:4040/api/tunnels');
      const data = await response.json();
      const tunnel = data.tunnels.find(t => t.public_url && t.public_url.startsWith('https://'));
      if (tunnel) {
        urlFound = true;
        const apiUrl = updateEnv(tunnel.public_url);
        console.log('\n========================================');
        console.log(`  Tunnel activo:  ${tunnel.public_url}`);
        console.log(`  .env actualizado: ${apiUrl}`);
        console.log('========================================\n');
      }
    } catch (err) {
      // API not ready yet
    }

    if (!urlFound) {
      setTimeout(checkTunnel, 2000);
    }
  }

  // Start polling
  setTimeout(checkTunnel, 2000);

  proc.on('close', (code) => {
    console.log(`Tunnel cerrado (${code}). Reconectando en 3s...`);
    urlFound = false;
    setTimeout(startTunnel, 3000);
  });

  proc.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error('\nERROR: ngrok no encontrado en el sistema.');
      console.error('Instálalo con: winget install ngrok.ngrok\n');
      process.exit(1);
    }
    console.error('Error en tunnel:', err.message, '— Reintentando en 5s...');
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();
