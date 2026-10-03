import { z } from 'zod';

const esquema = z.object({
  PORT: z.coerce.number().int().positive().default(8001),
  INVENTARIO_URL: z.string().url().default('http://127.0.0.1:8002'),
  INVENTARIO_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  ENABLE_ADMIN: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
});

export const config = esquema.parse(process.env);
