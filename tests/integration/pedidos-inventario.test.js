import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { get, INVENTARIO, iniciarLaboratorio, PEDIDOS, post } from '../helpers/laboratorio.js';
import { guardarObservaciones, registrar } from '../helpers/evidencia.js';

// Pruebas de integración REAL: dos procesos Node (Pedidos e Inventario) hablando por HTTP.
// IMPORTANTE: CP-05 apaga Inventario, por eso debe ser la ÚLTIMA prueba de este archivo.
describe('Integración Pedidos <-> Inventario', () => {
  let lab;

  beforeAll(async () => {
    lab = await iniciarLaboratorio();
  });

  afterAll(async () => {
    await lab?.detener();
    guardarObservaciones();
  });

  // Estado limpio antes de cada caso (stock P001=10, P002=3, sin pedidos).
  beforeEach(async () => {
    await post(`${INVENTARIO}/admin/reset`);
    await post(`${PEDIDOS}/admin/reset`);
  });

  it('CP-01 [integración] Pedido exitoso: stock baja de 10 a 8', async () => {
    const r = await post(`${PEDIDOS}/pedidos`, { producto_id: 'P001', cantidad: 2 });

    expect(r.status).toBe(2);
    expect(r.body).toMatchObject({ producto_id: 'P001', cantidad: 2, estado: 'CONFIRMADO' });
    expect(r.headers.get('x-request-id')).toBeTruthy();

    const stock = (await get(`${INVENTARIO}/productos/P001`)).body.stock;
    expect(stock).toBe(8);
    registrar('CP-01', `HTTP 201, estado ${r.body.estado}, stock de P001 pasó de 10 a ${stock}`);
  });

  it('CP-02 [integración] Cantidad inválida: 400 sin llamar a Inventario', async () => {
    const r = await post(`${PEDIDOS}/pedidos`, { producto_id: 'P001', cantidad: -5 });

    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDACION');
    expect(r.body.error.details[0]).toMatchObject({ campo: 'cantidad', mensaje: 'La cantidad debe ser mayor que 0' });

    const stats = (await get(`${INVENTARIO}/admin/estadisticas`)).body;
    expect(stats.reservas_recibidas).toBe(0); // Pedidos NO llamó a Inventario
    expect((await get(`${INVENTARIO}/productos/P001`)).body.stock).toBe(10);
    registrar('CP-02', `HTTP 400 VALIDACION ("${r.body.error.details[0].mensaje}"); Inventario recibió 0 reservas; stock sin cambios (10)`);
  });

  it('CP-03 [integración] Producto inexistente: 404 propagado', async () => {
    const r = await post(`${PEDIDOS}/pedidos`, { producto_id: 'X999', cantidad: 1 });

    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe('PRODUCTO_NO_EXISTE');
    expect((await get(`${PEDIDOS}/pedidos/1`)).status).toBe(404); // no se creó pedido
    registrar('CP-03', `HTTP 404 ${r.body.error.code} propagado desde Inventario; no se creó ningún pedido`);
  });

  it('CP-04 [integración] Stock insuficiente: 409 y no se crea pedido', async () => {
    const r = await post(`${PEDIDOS}/pedidos`, { producto_id: 'P002', cantidad: 999 });

    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('STOCK_INSUFICIENTE');
    expect(r.body.error.details).toEqual({ disponible: 3, solicitado: 999 });
    expect((await get(`${INVENTARIO}/productos/P002`)).body.stock).toBe(3);
    expect((await get(`${PEDIDOS}/pedidos/1`)).status).toBe(404);
    registrar('CP-04', 'HTTP 409 STOCK_INSUFICIENTE (disponible 3, solicitado 999); stock intacto; no se creó pedido');
  });

  it('CP-06 [integración] Inventario lento: 504 a los ~2 s sin colgarse', async () => {
    await post(`${INVENTARIO}/admin/demora`, { segundos: 5 });
    try {
      const r = await post(`${PEDIDOS}/pedidos`, { producto_id: 'P001', cantidad: 1 }, { timeoutMs: 10000 });

      expect(r.status).toBe(504);
      expect(r.body.error.code).toBe('INVENTARIO_TIMEOUT');
      expect(r.ms).toBeGreaterThanOrEqual(1800);
      expect(r.ms).toBeLessThan(4500); // respondió antes de los 5 s de la demora
      registrar('CP-06', `HTTP 504 INVENTARIO_TIMEOUT en ${r.ms} ms (timeout 2000 ms, Inventario tardaba 5000 ms)`);
    } finally {
      await post(`${INVENTARIO}/admin/demora`, { segundos: 0 });
    }
  });

  it('CP-07 [sistema] Flujo completo: crear, consultar pedido y verificar stock', async () => {
    const creado = await post(`${PEDIDOS}/pedidos`, { producto_id: 'P002', cantidad: 1 });
    expect(creado.status).toBe(201);

    const consultado = await get(`${PEDIDOS}/pedidos/${creado.body.id}`);
    expect(consultado.status).toBe(200);
    expect(consultado.body.estado).toBe('CONFIRMADO');

    const stock = (await get(`${INVENTARIO}/productos/P002`)).body.stock;
    expect(stock).toBe(2);
    registrar('CP-07', `Pedido #${creado.body.id} creado (201), consultable como CONFIRMADO (200) y stock de P002 pasó de 3 a ${stock}`);
  });

  it('CP-08 [integración] Inventario responde 500: 502 controlado', async () => {
    await post(`${INVENTARIO}/admin/falla`, { activa: true });
    try {
      const r = await post(`${PEDIDOS}/pedidos`, { producto_id: 'P001', cantidad: 1 });

      expect(r.status).toBe(502);
      expect(r.body.error.code).toBe('INVENTARIO_RESPUESTA_INESPERADA');
      expect((await get(`${PEDIDOS}/pedidos/1`)).status).toBe(404);
      registrar('CP-08', `HTTP 502 ${r.body.error.code}; no se creó pedido`);
    } finally {
      await post(`${INVENTARIO}/admin/falla`, { activa: false });
    }
  });

  // ÚLTIMA: apaga Inventario de verdad (falla técnica real, no simulada).
  it('CP-05 [integración] Inventario caído: 503 controlado y Pedidos sigue vivo', async () => {
    await lab.detenerInventario();

    const r = await post(`${PEDIDOS}/pedidos`, { producto_id: 'P001', cantidad: 1 });
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe('INVENTARIO_NO_DISPONIBLE');
    expect(r.body.error.message).toBe('Inventario no está disponible');

    expect((await get(`${PEDIDOS}/health`)).status).toBe(200); // Pedidos sigue respondiendo
    const dep = await get(`${PEDIDOS}/health/dependencias`);
    expect(dep.status).toBe(503);
    expect(dep.body.inventario).toBe('no disponible');
    expect((await get(`${PEDIDOS}/pedidos/1`)).status).toBe(404); // no quedó pedido a medias
    registrar('CP-05', `HTTP 503 ${r.body.error.code} ("${r.body.error.message}"); /health de Pedidos sigue en 200; no se creó pedido`);
  });
});
