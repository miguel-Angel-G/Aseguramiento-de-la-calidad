import { z } from 'zod';

export const pedidoSchema = z
  .object({
    producto_id: z
      .string({ required_error: 'producto_id es obligatorio' })
      .regex(/^[A-Z]\d{3}$/, 'formato esperado: una letra mayúscula y tres dígitos (ej. P001)'),
    cantidad: z
      .number({ required_error: 'cantidad es obligatoria', invalid_type_error: 'cantidad debe ser un número' })
      .int('cantidad debe ser un entero')
      .positive('La cantidad debe ser mayor que 0'),
  })
  .strict();

export const paramsPedidoSchema = z.object({ id: z.coerce.number().int().positive() });
