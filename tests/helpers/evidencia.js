import fs from 'node:fs';

// Cada prueba registra qué observó realmente; scripts/informe.js lo usa para
// llenar el campo "Resultado obtenido" de la matriz de casos.
const observaciones = {};

export function registrar(idCaso, obtenido) {
  observaciones[idCaso] = { obtenido };
}

export function guardarObservaciones() {
  fs.mkdirSync('evidencias', { recursive: true });
  fs.writeFileSync('evidencias/observaciones.json', JSON.stringify(observaciones, null, 2));
}
