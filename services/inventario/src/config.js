import { z } from 'zod';

const esquema = z.object({
  PORT: z.coerce.number().int().positive().default(8002),
  ENABLE_ADMIN: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
});

// Falla al arrancar si la configuración es inválida (mejor fallar rápido).
export const config = esquema.parse(process.env);
