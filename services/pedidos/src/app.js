import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { asyncHandler, HttpError, manejadorErrores, noEncontrado, validar } from './errors.js';
import { paramsPedidoSchema, pedidoSchema } from './schemas.js';
import { crearRepositorioPedidos } from './store.js';
import { crearServicioPedidos } from './pedidos.service.js';
import { openapi } from './openapi.js';

// `cliente` se inyecta: en producción es el cliente HTTP real; en pruebas de componente
// puede reemplazarse por un doble (dependencia simulada).
export function createApp({ logger, cliente, repositorio = crearRepositorioPedidos(), habilitarAdmin = true }) {
  const servicio = crearServicioPedidos({ cliente, repositorio });

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = req.headers['x-request-id'] ?? randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
    }),
  );
  app.use(express.json({ limit: '10kb' }));

  app.get('/openapi.json', (_req, res) => res.json(openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.get('/health', (_req, res) => res.json({ servicio: 'pedidos', estado: 'ok' }));

  // Verifica la comunicación con Inventario (útil en la demo).
  app.get(
    '/health/dependencias',
    asyncHandler(async (_req, res) => {
      const inventarioOk = await cliente.salud();
      res.status(inventarioOk ? 200 : 503).json({
        pedidos: 'ok',
        inventario: inventarioOk ? 'ok' : 'no disponible',
      });
    }),
  );

  app.post(
    '/pedidos',
    validar(pedidoSchema), // 1. validación propia, antes de llamar a nadie
    asyncHandler(async (req, res) => {
      const pedido = await servicio.crear(req.body, req.id); // 2. integración REST con Inventario
      res.status(201).json(pedido);
    }),
  );

  app.get('/pedidos', (_req, res) => res.json(repositorio.listar()));

  app.get('/pedidos/:id', validar(paramsPedidoSchema, 'params'), (req, res) => {
    const pedido = repositorio.obtener(req.params.id);
    if (!pedido) throw new HttpError(404, 'PEDIDO_NO_EXISTE', 'Pedido no existe');
    res.json(pedido);
  });

  if (habilitarAdmin) {
    app.post('/admin/reset', (_req, res) => {
      repositorio.reset();
      res.json({ reiniciado: true });
    });
  }

  app.use(noEncontrado);
  app.use(manejadorErrores);
  return app;
}
