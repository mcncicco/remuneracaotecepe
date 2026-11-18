import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testFiles = [
  'js/calculadora-remuneracao.test.js',
  'js/resultados-concurso.test.js',
  'tests/results-change-classifier.test.mjs',
  'tests/server.test.mjs',
  'tests/run-node-tests-safe.test.mjs'
];

export function runTests(files = testFiles) {
  let exitCode = 0;
  for (const testFile of files) {
    const result = spawnSync(process.execPath, ['--test', testFile], {
      cwd: projectRoot,
      stdio: 'ignore',
      windowsHide: true
    });

    if (result.error) {
      console.error(`FAIL ${testFile}: não foi possível iniciar o processo de teste (${result.error.message}).`);
      exitCode ||= 1;
      continue;
    }

    if (result.signal) {
      console.error(`FAIL ${testFile}: processo encerrado pelo sinal ${result.signal}.`);
      exitCode ||= 1;
      continue;
    }

    if (result.status !== 0) {
      console.error(`FAIL ${testFile}: processo terminou com código ${result.status}.`);
      exitCode ||= result.status || 1;
      continue;
    }

    console.log(`PASS ${testFile}`);
  }

  return exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runTests();
}
