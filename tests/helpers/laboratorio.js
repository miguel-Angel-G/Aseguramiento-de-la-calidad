import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as dormir } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Puertos distintos a los de la demo (8001/8002) para no chocar si ya están corriendo.
const PUERTO_PEDIDOS = Number(process.env.TEST_PUERTO_PEDIDOS ?? 9001);
const PUERTO_INVENTARIO = Number(process.env.TEST_PUERTO_INVENTARIO ?? 9002);
export const PEDIDOS = `http://127.0.0.1:${PUERTO_PEDIDOS}`;
export const INVENTARIO = `http://127.0.0.1:${PUERTO_INVENTARIO}`;

function lanzar(nombre, script, env) {
  const carpeta = path.join(RAIZ, 'evidencias', 'logs');
  fs.mkdirSync(carpeta, { recursive: true });
  const fd = fs.openSync(path.join(carpeta, `${nombre}.log`), 'w'); // los logs quedan como evidencia
  const proceso = spawn(process.execPath, [path.join(RAIZ, script)], {
    cwd: RAIZ,
    env: { ...process.env, ...env, NODE_ENV: 'test' },
    stdio: ['ignore', fd, fd],
  });
  fs.closeSync(fd);
  proceso.terminado = new Promise((resolver) => proceso.once('exit', resolver));
  return proceso;
}

async function esperarListo(url, intentos = 60) {
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (r.ok) return;
    } catch {
      /* aún no arranca */
    }
    await dormir(200);
  }
  throw new Error(`No arrancó ${url}`);
}

// Levanta los DOS servicios reales como procesos independientes.
export async function iniciarLaboratorio() {
  const inventario = lanzar('inventario', 'services/inventario/src/server.js', { PORT: PUERTO_INVENTARIO });
  const pedidos = lanzar('pedidos', 'services/pedidos/src/server.js', {
    PORT: PUERTO_PEDIDOS,
    INVENTARIO_URL: INVENTARIO,
    INVENTARIO_TIMEOUT_MS: 2000,
  });
  await Promise.all([esperarListo(`${INVENTARIO}/health`), esperarListo(`${PEDIDOS}/health`)]);

  return {
    async detenerInventario() {
      inventario.kill();
      await inventario.terminado;
    },
    async detener() {
      inventario.kill();
      pedidos.kill();
      await Promise.all([inventario.terminado, pedidos.terminado]);
    },
  };
}

export async function http(metodo, url, cuerpo, { timeoutMs = 10000 } = {}) {
  const inicio = performance.now();
  const r = await fetch(url, {
    method: metodo,
    headers: cuerpo ? { 'content-type': 'application/json' } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const texto = await r.text();
  let body;
  try {
    body = JSON.parse(texto);
  } catch {
    body = texto;
  }
  return { status: r.status, body, headers: r.headers, ms: Math.round(performance.now() - inicio) };
}
export const get = (url, opciones) => http('GET', url, undefined, opciones);
export const post = (url, cuerpo, opciones) => http('POST', url, cuerpo, opciones);
