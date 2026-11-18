const productionUrlText = process.env.PRODUCTION_URL;
const stagingUrlText = process.env.STAGING_URL;

if (!productionUrlText || !stagingUrlText) {
  throw new Error('Defina PRODUCTION_URL e STAGING_URL antes de verificar o staging.');
}

const productionUrl = new URL(productionUrlText);
const stagingUrl = new URL(stagingUrlText);
if (stagingUrl.username || stagingUrl.password || productionUrl.username || productionUrl.password) {
  throw new Error('As URLs não podem conter credenciais.');
}
if (!['http:', 'https:'].includes(stagingUrl.protocol) || !['http:', 'https:'].includes(productionUrl.protocol)) {
  throw new Error('PRODUCTION_URL e STAGING_URL devem usar HTTP ou HTTPS.');
}
if (stagingUrl.search || stagingUrl.hash || productionUrl.search || productionUrl.hash) {
  throw new Error('PRODUCTION_URL e STAGING_URL não podem conter query string ou fragmento.');
}

function normalizedLocation(url) {
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

if (normalizedLocation(stagingUrl) === normalizedLocation(productionUrl)) {
  throw new Error('STAGING_URL deve ser diferente de PRODUCTION_URL.');
}

const checks = [
  { path: 'index.html', expectedStatus: 200 },
  { path: 'css/styles.css', expectedStatus: 200 },
  { path: 'js/calculadora-remuneracao.js', expectedStatus: 200 },
  { path: 'js/estatisticas-cargos.js', expectedStatus: 200 },
  { path: 'js/resultado-concurso.js', expectedStatus: 200 },
  { path: 'js/resultado-reaplicacao.js', expectedStatus: 200 },
  { path: 'js/nomeacoes-concurso.js', expectedStatus: 200 },
  { path: 'js/vagas-concurso.js', expectedStatus: 200 },
  { path: 'js/classificacao-concurso.js', expectedStatus: 200 },
  { path: 'js/controlador-site.js', expectedStatus: 200 },
  { path: 'js/metricas-tempo-real.js', expectedStatus: 200 },
  { path: 'specs/', expectedStatus: 404 },
  { path: '.specify/memory/constitution.md', expectedStatus: 404 },
  { path: '.github/skills/speckit-implement/SKILL.md', expectedStatus: 404 },
  { path: 'tests/', expectedStatus: 404 },
  { path: 'csv/', expectedStatus: 404 },
  { path: 'pdf/', expectedStatus: 404 }
];
let hasFailure = false;

for (const check of checks) {
  const baseUrl = new URL(stagingUrl.href);
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/`;
  const url = new URL(check.path, baseUrl);
  let response;
  try {
    response = await fetch(url, { method: 'HEAD', redirect: 'manual' });
  } catch (error) {
    console.error(`FAIL ${check.path}: a requisição HEAD falhou (${error.message}).`);
    hasFailure = true;
    continue;
  }

  if (response.status !== check.expectedStatus) {
    console.error(`FAIL ${check.path}: status ${response.status}; esperado ${check.expectedStatus}.`);
    hasFailure = true;
    continue;
  }
  console.log(`PASS ${check.path}`);
}

if (hasFailure) process.exitCode = 1;
