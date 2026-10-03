import { describe, expect, it } from 'vitest';
import { pedidoSchema } from '../../services/pedidos/src/schemas.js';
import { reservaSchema } from '../../services/inventario/src/schemas.js';
import { traducirFallaDeRed } from '../../services/pedidos/src/inventarioClient.js';

describe('Validadores (zod)', () => {
  it.each([
    [{ producto_id: 'P001', cantidad: 2 }, true],
    [{ producto_id: 'P001', cantidad: 0 }, false],
    [{ producto_id: 'P001', cantidad: -5 }, false],
    [{ producto_id: 'P001', cantidad: 1.5 }, false],
    [{ producto_id: 'P001', cantidad: '2' }, false],
    [{ producto_id: 'p001', cantidad: 1 }, false],
    [{ producto_id: 'P001' }, false],
    [{ cantidad: 1 }, false],
    [{ producto_id: 'P001', cantidad: 1, extra: 'x' }, false],
  ])('pedidoSchema %j -> válido=%s', (entrada, valido) => {
    expect(pedidoSchema.safeParse(entrada).success).toBe(valido);
    expect(reservaSchema.safeParse(entrada).success).toBe(valido); // mismas reglas en ambos servicios
  });
});

describe('Traducción de fallas de red', () => {
  it('timeout -> 504', () => {
    expect(traducirFallaDeRed({ code: 'ECONNABORTED' }).status).toBe(504);
  });
  it('conexión rechazada -> 503', () => {
    expect(traducirFallaDeRed({ code: 'ECONNREFUSED' }).status).toBe(503);
  });
});
