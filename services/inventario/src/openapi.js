const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const json = (schema) => ({ 'application/json': { schema } });
const respuesta = (descripcion, schema) => ({ description: descripcion, ...(schema && { content: json(schema) }) });

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Servicio de Inventario',
    version: '1.0.0',
    description:
      'Microservicio que guarda el stock y atiende las reservas que solicita el Servicio de Pedidos. ' +
      'Los endpoints /admin existen solo para simular fallas en el laboratorio.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Productos' }, { name: 'Reservas' }, { name: 'Admin (laboratorio)' }, { name: 'Salud' }],
  paths: {
    '/health': {
      get: { tags: ['Salud'], summary: 'Estado del servicio', responses: { 200: respuesta('Servicio activo') } },
    },
    '/productos': {
      get: {
        tags: ['Productos'],
        summary: 'Listar productos',
        responses: { 200: respuesta('Lista de productos', { type: 'array', items: ref('Producto') }) },
      },
    },
    '/productos/{id}': {
      get: {
        tags: ['Productos'],
        summary: 'Consultar un producto y su stock',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'P001' } }],
        responses: {
          200: respuesta('Producto', ref('Producto')),
          400: respuesta('Identificador con formato inválido', ref('Error')),
          404: respuesta('Producto no existe', ref('Error')),
        },
      },
    },
    '/reservas': {
      post: {
        tags: ['Reservas'],
        summary: 'Reservar (descontar) unidades de un producto',
        requestBody: { required: true, content: json(ref('ReservaRequest')) },
        responses: {
          200: respuesta('Reserva realizada', ref('ReservaResponse')),
          400: respuesta('Datos inválidos', ref('Error')),
          404: respuesta('Producto no existe', ref('Error')),
          409: respuesta('Stock insuficiente', ref('Error')),
          500: respuesta('Fallo interno (simulable con /admin/falla)', ref('Error')),
        },
      },
    },
    '/admin/demora': {
      post: {
        tags: ['Admin (laboratorio)'],
        summary: 'Simular lentitud en /reservas',
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['segundos'], properties: { segundos: { type: 'integer', minimum: 0, maximum: 30, example: 5 } } }),
        },
        responses: { 200: respuesta('Demora configurada'), 400: respuesta('Datos inválidos', ref('Error')) },
      },
    },
    '/admin/falla': {
      post: {
        tags: ['Admin (laboratorio)'],
        summary: 'Activar/desactivar un error 500 simulado en /reservas',
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['activa'], properties: { activa: { type: 'boolean', example: true } } }),
        },
        responses: { 200: respuesta('Falla configurada') },
      },
    },
    '/admin/reset': {
      post: { tags: ['Admin (laboratorio)'], summary: 'Restaurar stock y estado inicial', responses: { 200: respuesta('Reiniciado') } },
    },
    '/admin/estadisticas': {
      get: {
        tags: ['Admin (laboratorio)'],
        summary: 'Cuántas reservas válidas ha recibido (prueba que Pedidos no llamó)',
        responses: { 200: respuesta('Estadísticas') },
      },
    },
  },
  components: {
    schemas: {
      Producto: {
        type: 'object',
        properties: { id: { type: 'string', example: 'P001' }, nombre: { type: 'string', example: 'Cuaderno' }, stock: { type: 'integer', example: 10 } },
      },
      ReservaRequest: {
        type: 'object',
        required: ['producto_id', 'cantidad'],
        properties: {
          producto_id: { type: 'string', pattern: '^[A-Z]\\d{3}$', example: 'P001' },
          cantidad: { type: 'integer', minimum: 1, example: 2 },
        },
      },
      ReservaResponse: {
        type: 'object',
        properties: {
          reservado: { type: 'boolean', example: true },
          producto_id: { type: 'string' },
          cantidad: { type: 'integer' },
          stock_restante: { type: 'integer', example: 8 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'STOCK_INSUFICIENTE' },
              message: { type: 'string', example: 'Stock insuficiente' },
              details: {},
            },
          },
        },
      },
    },
  },
};
