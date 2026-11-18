const assert = require('node:assert/strict');
const { scripts: contestScripts } = require('../fixtures/concurso.js');
const { script: statisticsScript } = require('../fixtures/estatisticas.js');

const scripts = {
  ...contestScripts,
  'estatisticas-cargos.js': statisticsScript
};

const scriptNames = Object.keys(scripts).sort();
const scriptPathPattern = /\/js\/(?:resultado-concurso|resultado-reaplicacao|nomeacoes-concurso|vagas-concurso|estatisticas-cargos)\.js(?:\?.*)?$/;

async function installSiteFixtures(page) {
  const servedScripts = new Set();
  await page.route(scriptPathPattern, async route => {
    const fileName = new URL(route.request().url()).pathname.split('/').pop();
    const body = scripts[fileName];
    if (!body) {
      throw new Error(`Fixture ausente para ${fileName}.`);
    }
    servedScripts.add(fileName);
    await route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body });
  });

  return {
    assertServed() {
      assert.deepEqual([...servedScripts].sort(), scriptNames, 'Nem todos os scripts de dados fictícios foram interceptados.');
    }
  };
}

module.exports = { installSiteFixtures };
