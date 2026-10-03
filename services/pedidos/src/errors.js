// Utilidades de errores y validación compartidas por las rutas del servicio.
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Middleware de validación con zod. Reemplaza req[fuente] por el dato ya parseado.
export function validar(schema, fuente = 'body') {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req[fuente]);
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((i) => ({
        campo: i.path.join('.') || fuente,
        mensaje: i.message,
      }));
      return next(new HttpError(400, 'VALIDACION', 'Datos de entrada inválidos', detalles));
    }
    req[fuente] = resultado.data;
    next();
  };
}

export function noEncontrado(req, _res, next) {
  next(new HttpError(404, 'RUTA_NO_ENCONTRADA', `No existe ${req.method} ${req.path}`));
}

// Formato único de error: { error: { code, message, details? } }
// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, req, res, _next) {
  let status = 500;
  let code = 'ERROR_INTERNO';
  let message = 'Error interno del servidor';
  let details;

  if (err instanceof HttpError) {
    ({ status, code, message, details } = err);
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'JSON_INVALIDO';
    message = 'El cuerpo de la petición no es un JSON válido';
  } else {
    req.log?.error({ err }, 'error no controlado');
  }

  req.log?.[status >= 500 ? 'error' : 'warn']({ code, status }, message);
  res.status(status).json({ error: { code, message, ...(details && { details }) } });
}
