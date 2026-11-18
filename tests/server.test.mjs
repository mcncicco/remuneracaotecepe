import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

test('serves site assets and rejects candidate data and traversal requests', { timeout: 15_000 }, async () => {
  const portProbe = createServer();
  portProbe.listen(0, '127.0.0.1');
  await once(portProbe, 'listening');
  const port = portProbe.address().port;
  await new Promise((resolve, reject) => {
    portProbe.close(error => error ? reject(error) : resolve());
  });

  const serverProcess = spawn(process.execPath, ['tests/server.mjs'], {
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
    windowsHide: true
  });
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    let response;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        response = await fetch(baseUrl);
        break;
      } catch (error) {
        if (!(error instanceof TypeError)) throw error;
        await delay(50);
      }
    }

    assert.ok(response, 'Servidor de teste não iniciou dentro do tempo limite.');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);

    const candidateData = await fetch(`${baseUrl}/js/resultado-concurso.js`);
    assert.equal(candidateData.status, 404);

    const traversal = await fetch(`${baseUrl}/..%2f.gitignore`);
    assert.equal(traversal.status, 404);
  } finally {
    if (serverProcess.exitCode === null && serverProcess.signalCode === null) {
      serverProcess.kill();
      await once(serverProcess, 'exit');
    }
  }
});
