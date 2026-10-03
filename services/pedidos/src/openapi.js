const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const json = (schema) => ({ 'application/json': { schema } });
const respuesta = (descripcion, schema) => ({ description: descripcion, ...(schema && { content: json(schema) }) });

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Servicio de Pedidos',
    version: '1.0.0',
    description:
      'Microservicio que recibe pedidos y, antes de confirmarlos, reserva el stock llamando por HTTP ' +
      'al Servicio de Inventario (integración síncrona, timeout de 2 s por defecto).',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Pedidos' }, { name: 'Salud' }, { name: 'Admin (laboratorio)' }],
  paths: {
    '/health': { get: { tags: ['Salud'], summary: 'Estado del servicio', responses: { 200: respuesta('Servicio activo') } } },
    '/health/dependencias': {
      get: {
        tags: ['Salud'],
        summary: 'Estado de Pedidos y de su dependencia (Inventario)',
        responses: { 200: respuesta('Ambos servicios activos'), 503: respuesta('Inventario no disponible') },
      },
    },
    '/pedidos': {
      post: {
        tags: ['Pedidos'],
        summary: 'Crear un pedido (reserva stock en Inventario)',
        requestBody: { required: true, content: json(ref('PedidoRequest')) },
        responses: {
          201: respuesta('Pedido confirmado', ref('Pedido')),
          400: respuesta('Datos inválidos (no se llama a Inventario)', ref('Error')),
          404: respuesta('Producto no existe (propagado desde Inventario)', ref('Error')),
          409: respuesta('Stock insuficiente (propagado desde Inventario)', ref('Error')),
          502: respuesta('Inventario respondió algo inesperado', ref('Error')),
          503: respuesta('Inventario no está disponible', ref('Error')),
          504: respuesta('Inventario tardó más del timeout', ref('Error')),
        },
      },
      get: { tags: ['Pedidos'], summary: 'Listar pedidos', responses: { 200: respuesta('Lista', { type: 'array', items: ref('Pedido') }) } },
    },
    '/pedidos/{id}': {
      get: {
        tags: ['Pedidos'],
        summary: 'Consultar un pedido',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } }],
        responses: {
          200: respuesta('Pedido', ref('Pedido')),
          400: respuesta('Identificador inválido', ref('Error')),
          404: respuesta('Pedido no existe', ref('Error')),
        },
      },
    },
    '/admin/reset': {
      post: { tags: ['Admin (laboratorio)'], summary: 'Borrar todos los pedidos', responses: { 200: respuesta('Reiniciado') } },
    },
  },
  components: {
    schemas: {
      PedidoRequest: {
        type: 'object',
        required: ['producto_id', 'cantidad'],
        properties: {
          producto_id: { type: 'string', pattern: '^[A-Z]\\d{3}$', example: 'P001' },
          cantidad: { type: 'integer', minimum: 1, example: 2 },
        },
      },
      Pedido: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          producto_id: { type: 'string', example: 'P001' },
          cantidad: { type: 'integer', example: 2 },
          estado: { type: 'string', example: 'CONFIRMADO' },
          creado_en: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'INVENTARIO_NO_DISPONIBLE' },
              message: { type: 'string', example: 'Inventario no está disponible' },
              details: {},
            },
          },
        },
      },
    },
  },
};
