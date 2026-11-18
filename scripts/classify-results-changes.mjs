import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const safeChangePatterns = [
  /^\.github\/pull_request_template\.md$/,
  /^\.github\/skills\//,
  /^\.github\/workflows\/ci\.yml$/,
  /^\.gitignore$/,
  /^README\.md$/,
  /^_config\.yml$/,
  /^package(?:-lock)?\.json$/,
  /^playwright\.config\.js$/,
  /^js\/[^/]+\.test\.js$/,
  /^scripts\/(?:classify-results-changes|run-node-tests-safe|verify-pages-staging)\.mjs$/,
  /^specs\//,
  /^tests\//,
  /^\.specify\//
];
const resultChangePattern = /^(?:csv\/|js\/(?:resultado-concurso|resultado-reaplicacao|nomeacoes-concurso|vagas-concurso|classificacao-concurso|controlador-site|gerar-[^/]+)\.js$|ps1\/)/;

export function classifyPaths(changedPaths) {
  const normalizedPaths = changedPaths.map(filePath => filePath.replace(/\\/g, '/'));
  const requiringValidation = normalizedPaths.filter(filePath =>
    resultChangePattern.test(filePath) || !safeChangePatterns.some(pattern => pattern.test(filePath))
  );
  return {
    requiresLocalValidation: requiringValidation.length > 0,
    changedPaths: normalizedPaths,
    requiringValidation
  };
}

function isCommitSha(value) {
  return /^[a-f\d]{40}$|^[a-f\d]{64}$/i.test(value);
}

function main() {
  const [, , baseSha, headSha] = process.argv;
  if (!isCommitSha(baseSha || '') || !isCommitSha(headSha || '')) {
    console.error('Uso: node scripts/classify-results-changes.mjs <base-SHA> <head-SHA>.');
    process.exitCode = 2;
    return;
  }

  let changedPaths;
  try {
    const output = execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', `${baseSha}...${headSha}`], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024
    });
    changedPaths = output.split('\0').filter(Boolean);
  } catch {
    console.error('Não foi possível classificar o diff; a validação local de resultados é obrigatória.');
    process.exitCode = 2;
    return;
  }

  const result = classifyPaths(changedPaths);
  console.log(JSON.stringify({
    requiresLocalValidation: result.requiresLocalValidation,
    reason: result.requiresLocalValidation ? 'result-or-unknown-change' : 'no-result-impact-detected',
    affectedPathCount: result.requiringValidation.length
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
