import axios from 'axios';
import { HttpError } from './errors.js';

// Cliente HTTP hacia Inventario. Este es el PUNTO DE INTEGRACIÓN CRÍTICO del laboratorio:
// aquí se define el timeout y se traducen las fallas de red a errores controlados.
export function crearClienteInventario({ baseURL, timeoutMs }) {
  const http = axios.create({
    baseURL,
    timeout: timeoutMs,
    validateStatus: () => true, // las respuestas 4xx/5xx se interpretan en el servicio, no como excepción
  });

  return {
    async reservar({ producto_id, cantidad }, requestId) {
      try {
        const r = await http.post('/reservas', { producto_id, cantidad }, { headers: { 'x-request-id': requestId } });
        return { status: r.status, data: r.data };
      } catch (err) {
        throw traducirFallaDeRed(err);
      }
    },

    async salud() {
      try {
        const r = await http.get('/health', { timeout: 1000 });
        return r.status === 200;
      } catch {
        return false;
      }
    },
  };
}

export function traducirFallaDeRed(err) {
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return new HttpError(504, 'INVENTARIO_TIMEOUT', 'Inventario tardó demasiado en responder');
  }
  // Conexión rechazada, reiniciada, host inalcanzable, etc.
  return new HttpError(503, 'INVENTARIO_NO_DISPONIBLE', 'Inventario no está disponible');
}
