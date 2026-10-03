// Combina docs/casos.json (diseño) + evidencias/resultado.json (vitest) +
// evidencias/observaciones.json (lo que vio cada prueba) -> matriz completa de 12 campos.
import fs from 'node:fs';

const leer = (ruta, porDefecto) => (fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : porDefecto);

const resultado = leer('evidencias/resultado.json', null);
if (!resultado) {
  console.error('No existe evidencias/resultado.json. Ejecute primero: npm test');
  process.exit(1);
}
const observaciones = leer('evidencias/observaciones.json', {});
const casos = leer('docs/casos.json', []);

const estados = {};
for (const archivo of resultado.testResults) {
  for (const t of archivo.assertionResults) {
    const m = t.title.match(/^(CP-\d+)/);
    if (m) estados[m[1]] = { aprobado: t.status === 'passed', ms: Math.round(t.duration ?? 0) };
  }
}

const EVIDENCIA = 'evidencias/junit.xml, evidencias/resultado.json, evidencias/logs/pedidos.log, evidencias/logs/inventario.log';
const filas = casos.map((c) => {
  const e = estados[c.id];
  return {
    Identificador: c.id,
    Nombre: c.nombre,
    'Tipo de prueba': c.tipo,
    Objetivo: c.objetivo,
    'Componentes involucrados': c.componentes,
    Precondiciones: c.precondiciones,
    'Datos de entrada': c.datos,
    Procedimiento: c.procedimiento,
    'Resultado esperado': c.esperado,
    'Resultado obtenido': observaciones[c.id]?.obtenido ?? '(no ejecutado)',
    Evidencia: EVIDENCIA,
    Estado: e ? (e.aprobado ? 'Aprobado' : 'Fallido') : 'No ejecutado',
  };
});

const columnas = Object.keys(filas[0]);
const csvCelda = (v) => `"${String(v).replaceAll('"', '""')}"`;
const csv = [columnas.map(csvCelda).join(','), ...filas.map((f) => columnas.map((c) => csvCelda(f[c])).join(','))].join('\r\n');
fs.writeFileSync('evidencias/matriz-casos-prueba.csv', '\uFEFF' + csv, 'utf8'); // BOM para que Excel lea las tildes

const aprobados = filas.filter((f) => f.Estado === 'Aprobado').length;
const md = [
  '# Informe de ejecución de casos de prueba',
  '',
  `Generado: ${new Date().toLocaleString('es-CO')}`,
  '',
  `**Resultado: ${aprobados} aprobados de ${filas.length} casos.**`,
  '',
  '| ID | Nombre | Tipo | Estado | Resultado obtenido |',
  '|----|--------|------|--------|--------------------|',
  ...filas.map((f) => `| ${f.Identificador} | ${f.Nombre} | ${f['Tipo de prueba']} | ${f.Estado} | ${f['Resultado obtenido']} |`),
  '',
].join('\n');
fs.writeFileSync('evidencias/informe-casos.md', md, 'utf8');

console.log(`\nInforme generado: ${aprobados}/${filas.length} casos aprobados`);
console.log(' - evidencias/informe-casos.md');
console.log(' - evidencias/matriz-casos-prueba.csv (abrir con Excel)');
