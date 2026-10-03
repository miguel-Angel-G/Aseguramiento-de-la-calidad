// "Base de datos" en memoria. Los datos son ficticios.
const SEMILLA = {
  P001: { nombre: 'Cuaderno', stock: 10 },
  P002: { nombre: 'Lapicero', stock: 3 },
};

export function crearAlmacen() {
  let datos;
  const reset = () => {
    datos = structuredClone(SEMILLA);
  };
  reset();

  return {
    reset,
    listar: () => Object.entries(datos).map(([id, p]) => ({ id, ...p })),
    obtener: (id) => (datos[id] ? { id, ...datos[id] } : null),
    reservar(id, cantidad) {
      const producto = datos[id];
      if (!producto) return { ok: false, motivo: 'NO_EXISTE' };
      if (producto.stock < cantidad) return { ok: false, motivo: 'STOCK_INSUFICIENTE', disponible: producto.stock };
      producto.stock -= cantidad;
      return { ok: true, stock_restante: producto.stock };
    },
  };
}
