import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const deniedScripts = new Set([
  'nomeacoes-concurso.js',
  'resultado-concurso.js',
  'resultado-reaplicacao.js'
]);
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml']
]);
const port = Number(process.env.PORT || 4173);
const host = '127.0.0.1';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
}

function isAllowed(relativePath) {
  if (relativePath === 'index.html') return true;
  if (/^css\/[A-Za-z0-9._-]+\.css$/.test(relativePath)) return true;
  if (!/^js\/[A-Za-z0-9._-]+\.js$/.test(relativePath)) return false;
  return !deniedScripts.has(path.posix.basename(relativePath));
}

function isWithinRoot(candidatePath) {
  const relativePath = path.relative(projectRoot, candidatePath);
  return relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath);
}

async function handleRequest(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
  } catch (error) {
    if (error instanceof URIError) {
      response.writeHead(400).end('Bad Request');
      return;
    }
    throw error;
  }

  if (pathname.includes('\0') || pathname.includes('\\')) {
    response.writeHead(400).end('Bad Request');
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (relativePath.split('/').includes('..') || !isAllowed(relativePath)) {
    response.writeHead(404).end('Not Found');
    return;
  }

  const candidatePath = path.resolve(projectRoot, relativePath);
  if (!isWithinRoot(candidatePath)) {
    response.writeHead(404).end('Not Found');
    return;
  }

  let resolvedPath;
  try {
    resolvedPath = await realpath(candidatePath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      response.writeHead(404).end('Not Found');
      return;
    }
    throw error;
  }

  if (!isWithinRoot(resolvedPath)) {
    response.writeHead(404).end('Not Found');
    return;
  }

  let fileInfo;
  try {
    fileInfo = await stat(resolvedPath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      response.writeHead(404).end('Not Found');
      return;
    }
    throw error;
  }

  if (!fileInfo.isFile()) {
    response.writeHead(404).end('Not Found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Length': fileInfo.size,
    'Content-Type': contentTypes.get(path.extname(resolvedPath)) || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff'
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(resolvedPath).pipe(response);
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch(error => {
    console.error('Test server request failed:', error.message);
    if (!response.headersSent) response.writeHead(500).end('Internal Server Error');
    else response.destroy(error);
  });
});

server.on('error', error => {
  console.error('Test server failed:', error.message);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Test server listening on http://${host}:${port}`);
});
