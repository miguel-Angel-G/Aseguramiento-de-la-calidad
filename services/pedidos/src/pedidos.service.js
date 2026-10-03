import { HttpError } from './errors.js';

// Lógica de negocio: reservar en Inventario y, solo si sale bien, guardar el pedido.
export function crearServicioPedidos({ cliente, repositorio }) {
  return {
    async crear(datos, requestId) {
      const r = await cliente.reservar(datos, requestId);

      if (r.status === 200) return repositorio.guardar(datos);

      if (r.status === 404 || r.status === 409) {
        const e = r.data?.error ?? {};
        throw new HttpError(
          r.status,
          e.code ?? 'ERROR_INVENTARIO',
          e.message ?? 'Inventario rechazó la reserva',
          e.details,
        );
      }

      throw new HttpError(502, 'INVENTARIO_RESPUESTA_INESPERADA', `Inventario respondió con estado ${r.status}`);
    },
  };
}
