const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ENV_PATH = path.join(__dirname, '..', '.env');
// Ruta absoluta por si cloudflared no está en PATH del proceso hijo
const CLOUDFLARED_PATH =
  process.env.CLOUDFLARED_PATH ||
  'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe';

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
  const bin = fs.existsSync(CLOUDFLARED_PATH) ? CLOUDFLARED_PATH : 'cloudflared';
  console.log(`Iniciando Cloudflare tunnel (${bin}) en puerto ${PORT}...`);

  const proc = spawn(bin, ['tunnel', '--url', `http://localhost:${PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let urlFound = false;

  function checkOutput(data) {
    if (urlFound) return;
    const text = data.toString();
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      urlFound = true;
      const apiUrl = updateEnv(match[0]);
      console.log('\n========================================');
      console.log(`  Tunnel activo:  ${match[0]}`);
      console.log(`  .env actualizado: ${apiUrl}`);
      console.log('========================================\n');
    }
  }

  proc.stdout.on('data', checkOutput);
  proc.stderr.on('data', checkOutput);

  proc.on('close', (code) => {
    console.log(`Tunnel cerrado (${code}). Reconectando en 3s...`);
    urlFound = false;
    setTimeout(startTunnel, 3000);
  });

  proc.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error('\nERROR: cloudflared no encontrado en:', bin);
      console.error('Instálalo con:  winget install Cloudflare.cloudflared\n');
      process.exit(1);
    }
    console.error('Error en tunnel:', err.message, '— Reintentando en 5s...');
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();
