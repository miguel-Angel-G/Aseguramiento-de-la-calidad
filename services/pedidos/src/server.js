import { config } from './config.js';
import { crearLogger } from './logger.js';
import { createApp } from './app.js';
import { crearClienteInventario } from './inventarioClient.js';

const logger = crearLogger('pedidos');
const cliente = crearClienteInventario({ baseURL: config.INVENTARIO_URL, timeoutMs: config.INVENTARIO_TIMEOUT_MS });
const app = createApp({ logger, cliente, habilitarAdmin: config.ENABLE_ADMIN });

const server = app.listen(config.PORT, () => {
  logger.info(
    `Pedidos escuchando en http://localhost:${config.PORT} (docs en /docs) -> Inventario: ${config.INVENTARIO_URL}, timeout ${config.INVENTARIO_TIMEOUT_MS} ms`,
  );
});

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    logger.info(`Recibido ${senal}, apagando Pedidos`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  });
}
