// Repositorio de pedidos en memoria.
export function crearRepositorioPedidos() {
  const pedidos = new Map();
  return {
    guardar({ producto_id, cantidad }) {
      const id = pedidos.size + 1;
      const pedido = { id, producto_id, cantidad, estado: 'CONFIRMADO', creado_en: new Date().toISOString() };
      pedidos.set(id, pedido);
      return pedido;
    },
    obtener: (id) => pedidos.get(id) ?? null,
    listar: () => [...pedidos.values()],
    reset: () => pedidos.clear(),
  };
}
