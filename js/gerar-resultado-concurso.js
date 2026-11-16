const fs = require('node:fs');
const path = require('node:path');

const document = JSON.parse(fs.readFileSync(0, 'utf8'));
const careers = new Map();
const csvRows = [];
const rowPattern = /^(\d{12})\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+((?:\d+(?:,\d+)?\s+){3,4})(Aprovado(?:\s+(?:PCD|Negro))*)\s+(\d+)º$/;
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const normalizeStatus = status => {
  const normalized = status.trim().replace(/\s+/g, ' ').toUpperCase();
  if (normalized === 'APROVADO') return 'Aprovado';
  if (normalized === 'APROVADO PCD') return 'Aprovado PCD';
  if (normalized === 'APROVADO NEGRO') return 'Aprovado Negro';
  if (normalized === 'APROVADO PCD NEGRO') return 'Aprovado PCD/Negro';
  throw new Error(`Situacao nao reconhecida: ${status}.`);
};

if (document.pages.length !== 12 || document.total !== 14) throw new Error('O anexo esperado possui 12 paginas de resultados.');

for (const page of document.pages) {
  const lines = page.text.split('\n').map(line => line.trim()).filter(Boolean);
  const title = lines.find(line => /^(ANALISTA DE CONTROLE EXTERNO|ANALISTA DE GESTAO|AUDITOR DE CONTROLE EXTERNO|PROCURADOR DO TRIBUNAL DE CONTAS)/.test(normalize(line)));
  if (!title) throw new Error(`Cargo nao encontrado na pagina ${page.num}.`);
  if (!careers.has(title)) careers.set(title, []);
  const results = careers.get(title);
  const rows = lines.filter(line => /^\d{12}\s/.test(line));
  if (!rows.length) throw new Error(`Nenhum resultado encontrado na pagina ${page.num}.`);
  for (const row of rows) {
    const match = row.match(rowPattern);
    if (!match) throw new Error(`Linha de resultado nao reconhecida na pagina ${page.num}.`);
    const rawScores = match[4].trim().split(/\s+/);
    const scores = rawScores.map(value => Number(value.replace(',', '.')));
    const isAttorney = normalize(title).startsWith('PROCURADOR');
    if (scores.length !== (isAttorney ? 4 : 3)) throw new Error(`Quantidade inesperada de notas na pagina ${page.num}.`);
    const rank = Number(match[6]);
    if (rank !== results.length + 1) throw new Error(`Classificacao inesperada na pagina ${page.num}: ${rank}.`);
    results.push({ classificacao: rank, nome: match[2], nascimento: match[3], objetiva: scores[0], discursiva: scores[1], titulos: isAttorney ? scores[2] : null, final: scores[scores.length - 1], situacao: normalizeStatus(match[5]) });
    csvRows.push([title, rank, match[1], match[2], match[3], rawScores[0], rawScores[1], isAttorney ? rawScores[2] : '', rawScores[rawScores.length - 1], match[5]]);
  }
}

if (careers.size !== 6) throw new Error(`Quantidade inesperada de cargos: ${careers.size}.`);
const data = Array.from(careers, ([cargo, resultados]) => ({ cargo, resultados }));
if (process.argv.includes('--csv')) {
  const headers = ['Cargo / Área', 'Classificação', 'Inscrição', 'Nome', 'Nascimento', 'Nota objetiva', 'Nota discursiva', 'Nota de títulos', 'Nota final', 'Situação'];
  const escapeCsv = value => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...csvRows].map(row => row.map(escapeCsv).join(';')).join('\r\n');
  fs.writeFileSync(path.join(__dirname, '..', 'csv', 'resultado-concurso-2025.csv'), `\uFEFF${csv}\r\n`, { encoding: 'utf8', flag: 'wx' });
} else {
  fs.writeFileSync(path.join(__dirname, 'resultado-concurso.js'), `const contestData = ${JSON.stringify(data)};\n`, 'utf8');
}
console.log(data.map(item => `${item.cargo}: ${item.resultados.length}`).join('\n'));