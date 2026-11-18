import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { classifyPaths } from '../scripts/classify-results-changes.mjs';

test('does not require CSV validation for explicitly safe documentation and tests', () => {
  const result = classifyPaths([
    'README.md',
    'specs/002-testes-playwright/spec.md',
    'tests/concurso.spec.js',
    'js/resultados-concurso.test.js',
    '.github/workflows/ci.yml'
  ]);
  assert.equal(result.requiresLocalValidation, false);
  assert.deepEqual(result.requiringValidation, []);
});

test('requires local validation for result data and processing changes', () => {
  const result = classifyPaths([
    'js/resultado-concurso.js',
    'js/controlador-site.js',
    'csv/resultado-concurso-2025.csv'
  ]);
  assert.equal(result.requiresLocalValidation, true);
  assert.deepEqual(result.requiringValidation, result.changedPaths);
});

test('treats unknown paths as requiring local validation', () => {
  const result = classifyPaths(['new-folder/unknown-file.txt']);
  assert.equal(result.requiresLocalValidation, true);
  assert.deepEqual(result.requiringValidation, ['new-folder/unknown-file.txt']);
});

test('reports invalid command arguments without a success-shaped result', () => {
  const processResult = spawnSync(process.execPath, ['scripts/classify-results-changes.mjs'], {
    encoding: 'utf8'
  });
  assert.equal(processResult.status, 2);
  assert.match(processResult.stderr, /Uso:/);
  assert.equal(processResult.stdout, '');
});

test('requires a hold when the git diff cannot be read', () => {
  const missingBaseSha = '0'.repeat(40);
  const missingHeadSha = 'f'.repeat(40);
  const processResult = spawnSync(process.execPath, [
    'scripts/classify-results-changes.mjs',
    missingBaseSha,
    missingHeadSha
  ], { encoding: 'utf8' });
  assert.equal(processResult.status, 2);
  assert.match(processResult.stderr, /validação local de resultados é obrigatória/);
  assert.equal(processResult.stdout, '');
});
