import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import pino from 'pino';
import { createApp } from '../../services/pedidos/src/app.js';
import { HttpError } from '../../services/pedidos/src/errors.js';

// Pruebas de COMPONENTE: Pedidos real + Inventario SIMULADO (doble de prueba inyectado).
// Son rápidas y no necesitan levantar procesos; complementan las pruebas de integración reales.
function crearAppConDoble() {
  const cliente = { reservar: vi.fn(), salud: vi.fn() };
  const app = createApp({ logger: pino({ level: 'silent' }), cliente });
  return { app, cliente };
}

describe('Pedidos con Inventario simulado', () => {
  it('confirma el pedido cuando Inventario reserva (200)', async () => {
    const { app, cliente } = crearAppConDoble();
    cliente.reservar.mockResolvedValue({ status: 200, data: { reservado: true } });

    const r = await request(app).post('/pedidos').send({ producto_id: 'P001', cantidad: 2 });

    expect(r.status).toBe(201);
    expect(r.body.estado).toBe('CONFIRMADO');
    expect(cliente.reservar).toHaveBeenCalledTimes(1);
  });

  it('traduce un timeout de Inventario a 504 y no guarda el pedido', async () => {
    const { app, cliente } = crearAppConDoble();
    cliente.reservar.mockRejectedValue(new HttpError(504, 'INVENTARIO_TIMEOUT', 'Inventario tardó demasiado en responder'));

    const r = await request(app).post('/pedidos').send({ producto_id: 'P001', cantidad: 1 });

    expect(r.status).toBe(504);
    expect((await request(app).get('/pedidos')).body).toEqual([]);
  });

  it('rechaza datos inválidos sin llamar a Inventario', async () => {
    const { app, cliente } = crearAppConDoble();

    const r = await request(app).post('/pedidos').send({ producto_id: 'P001', cantidad: 0 });

    expect(r.status).toBe(400);
    expect(cliente.reservar).not.toHaveBeenCalled();
  });

  it('rechaza un JSON mal formado con 400', async () => {
    const { app } = crearAppConDoble();

    const r = await request(app).post('/pedidos').set('content-type', 'application/json').send('{"producto_id": ');

    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('JSON_INVALIDO');
  });
});
