// Ejecuta todas las pruebas y luego genera el informe, aunque alguna falle.
import { spawnSync } from 'node:child_process';

const vitest = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run'], { stdio: 'inherit' });
const informe = spawnSync(process.execPath, ['scripts/informe.js'], { stdio: 'inherit' });
process.exit(vitest.status || informe.status || 0);
