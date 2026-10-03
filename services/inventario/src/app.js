import { randomUUID } from 'node:crypto';
import { setTimeout as dormir } from 'node:timers/promises';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { asyncHandler, HttpError, manejadorErrores, noEncontrado, validar } from './errors.js';
import { demoraSchema, fallaSchema, paramsProductoSchema, reservaSchema } from './schemas.js';
import { crearAlmacen } from './store.js';
import { openapi } from './openapi.js';

export function createApp({ logger, almacen = crearAlmacen(), habilitarAdmin = true } = {}) {
  // Estado de control usado solo para simular fallas en el laboratorio.
  const estado = { demoraMs: 0, fallar: false, reservasRecibidas: 0 };

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

  // --- Documentación ---
  app.get('/openapi.json', (_req, res) => res.json(openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

  // --- API de negocio ---
  app.get('/health', (_req, res) => res.json({ servicio: 'inventario', estado: 'ok' }));

  app.get('/productos', (_req, res) => res.json(almacen.listar()));

  app.get('/productos/:id', validar(paramsProductoSchema, 'params'), (req, res) => {
    const producto = almacen.obtener(req.params.id);
    if (!producto) throw new HttpError(404, 'PRODUCTO_NO_EXISTE', 'Producto no existe');
    res.json(producto);
  });

  app.post(
    '/reservas',
    validar(reservaSchema),
    asyncHandler(async (req, res) => {
      estado.reservasRecibidas += 1;
      if (estado.demoraMs > 0) await dormir(estado.demoraMs); // lentitud simulada
      if (estado.fallar) throw new HttpError(500, 'ERROR_INTERNO', 'Fallo interno simulado');

      const { producto_id, cantidad } = req.body;
      const r = almacen.reservar(producto_id, cantidad);
      if (!r.ok && r.motivo === 'NO_EXISTE') {
        throw new HttpError(404, 'PRODUCTO_NO_EXISTE', 'Producto no existe');
      }
      if (!r.ok) {
        throw new HttpError(409, 'STOCK_INSUFICIENTE', 'Stock insuficiente', {
          disponible: r.disponible,
          solicitado: cantidad,
        });
      }
      res.json({ reservado: true, producto_id, cantidad, stock_restante: r.stock_restante });
    }),
  );

  // --- Endpoints de administración: solo para simular fallas en pruebas ---
  if (habilitarAdmin) {
    app.post('/admin/demora', validar(demoraSchema), (req, res) => {
      estado.demoraMs = req.body.segundos * 1000;
      res.json({ demora_segundos: req.body.segundos });
    });
    app.post('/admin/falla', validar(fallaSchema), (req, res) => {
      estado.fallar = req.body.activa;
      res.json({ falla_activa: estado.fallar });
    });
    app.post('/admin/reset', (_req, res) => {
      almacen.reset();
      Object.assign(estado, { demoraMs: 0, fallar: false, reservasRecibidas: 0 });
      res.json({ reiniciado: true });
    });
    app.get('/admin/estadisticas', (_req, res) => res.json({ reservas_recibidas: estado.reservasRecibidas }));
  }

  app.use(noEncontrado);
  app.use(manejadorErrores);
  return app;
}
