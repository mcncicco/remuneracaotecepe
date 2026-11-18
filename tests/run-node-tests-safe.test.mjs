import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runTests } from '../scripts/run-node-tests-safe.mjs';

test('suppresses raw output from a failing test process', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'safe-node-tests-'));
  const testFile = path.join(directory, 'privacy-probe.test.mjs');
  const marker = 'RAW-PRIVATE-TEST-OUTPUT';
  writeFileSync(testFile, `
    import test from 'node:test';
    test('deliberately fails after printing a private marker', () => {
      console.error('${marker}');
      throw new Error('${marker}');
    });
  `);

  const output = [];
  const originalLog = console.log;
  const originalError = console.error;
  const testContext = process.env.NODE_TEST_CONTEXT;
  let exitCode;
  try {
    delete process.env.NODE_TEST_CONTEXT;
    console.log = (...values) => output.push(values.join(' '));
    console.error = (...values) => output.push(values.join(' '));
    exitCode = runTests([testFile]);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    if (testContext !== undefined) process.env.NODE_TEST_CONTEXT = testContext;
    rmSync(directory, { recursive: true, force: true });
  }

  assert.equal(exitCode, 1);
  assert.match(output.join('\n'), /FAIL .*privacy-probe\.test\.mjs/);
  assert.equal(output.join('\n').includes(marker), false);
});
