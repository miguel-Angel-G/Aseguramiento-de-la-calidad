import { config } from './config.js';
import { crearLogger } from './logger.js';
import { createApp } from './app.js';

const logger = crearLogger('inventario');
const app = createApp({ logger, habilitarAdmin: config.ENABLE_ADMIN });

const server = app.listen(config.PORT, () => {
  logger.info(`Inventario escuchando en http://localhost:${config.PORT} (documentación en /docs)`);
});

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    logger.info(`Recibido ${senal}, apagando Inventario`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  });
}
