import { z } from 'zod';

export const productoIdSchema = z
  .string({ required_error: 'producto_id es obligatorio' })
  .regex(/^[A-Z]\d{3}$/, 'formato esperado: una letra mayúscula y tres dígitos (ej. P001)');

export const reservaSchema = z
  .object({
    producto_id: productoIdSchema,
    cantidad: z
      .number({ required_error: 'cantidad es obligatoria', invalid_type_error: 'cantidad debe ser un número' })
      .int('cantidad debe ser un entero')
      .positive('La cantidad debe ser mayor que 0'),
  })
  .strict();

export const paramsProductoSchema = z.object({ id: productoIdSchema });
export const demoraSchema = z.object({ segundos: z.number().int().min(0).max(30) }).strict();
export const fallaSchema = z.object({ activa: z.boolean() }).strict();
