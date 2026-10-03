import pino from 'pino';

// En una terminal interactiva se muestran logs legibles; si la salida va a un
// archivo (como en las pruebas) se escriben en JSON, que es lo ideal como evidencia.
export function crearLogger(nombre) {
  const bonito =
    process.stdout.isTTY && process.env.NODE_ENV !== 'test' && process.env.LOG_PRETTY !== 'false';
  return pino(
    { name: nombre, level: process.env.LOG_LEVEL ?? 'info' },
    bonito ? pino.transport({ target: 'pino-pretty', options: { colorize: true } }) : undefined,
  );
}
