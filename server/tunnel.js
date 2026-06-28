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

async function getPublicIp() {
  try {
    const res = await fetch('https://api.ipify.org');
    return await res.text();
  } catch (e) {
    return 'No se pudo obtener la IP pública automáticamente';
  }
}

function startTunnel() {
  console.log(`Iniciando LocalTunnel en puerto ${PORT}...`);

  const proc = spawn('npx', ['localtunnel', '--port', PORT.toString(), '--local-host', '127.0.0.1'], {
    shell: true
  });

  let urlFound = false;

  proc.stdout.on('data', async (data) => {
    const text = data.toString();
    const match = text.match(/your url is:\s*(https:\/\/\S+)/);
    if (match && !urlFound) {
      urlFound = true;
      const url = match[1];
      const apiUrl = updateEnv(url);
      const ip = await getPublicIp();
      
      console.log('\n========================================');
      console.log(`  Tunnel activo:  ${url}`);
      console.log(`  .env actualizado: ${apiUrl}`);
      console.log(`  Contraseña del túnel (IP Pública): ${ip}`);
      console.log('========================================\n');
    }
  });

  proc.stderr.on('data', (data) => {
    // Ignore harmless warnings from localtunnel/npx
    const errText = data.toString().trim();
    if (errText && !errText.includes('npm WARN') && !errText.includes('npx: installed')) {
      console.error('Error de tunnel:', errText);
    }
  });

  proc.on('close', (code) => {
    console.log(`Tunnel cerrado (${code}). Reconectando en 3s...`);
    urlFound = false;
    setTimeout(startTunnel, 3000);
  });

  proc.on('error', (err) => {
    console.error('Error al iniciar tunnel:', err.message, '— Reintentando en 5s...');
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();
