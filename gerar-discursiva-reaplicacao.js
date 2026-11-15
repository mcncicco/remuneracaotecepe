const fs = require('node:fs');

const document = JSON.parse(fs.readFileSync(0, 'utf8'));
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const rowPattern = /^(\d{12})\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d+(?:,\d+)?)\s+(Aprovado(?:\s+(?:PcD|Negro))*)$/i;
const careers = new Map();
const csvRows = [];

if (document.total !== 14 || document.pages.length !== 14) throw new Error('O documento esperado possui 14 paginas.');

for (const [index, page] of document.pages.entries()) {
  if (page.num !== index + 1) throw new Error('Paginas ausentes ou fora de ordem.');
  const lines = page.text.split('\n').map(line => line.trim()).filter(Boolean);
  const title = lines.find(line => /^(ANALISTA DE CONTROLE EXTERNO|ANALISTA DE GESTAO|AUDITOR DE CONTROLE EXTERNO)/.test(normalize(line)));
  if (!title) throw new Error(`Cargo nao encontrado na pagina ${page.num}.`);
  if (!careers.has(title)) careers.set(title, 0);
  const entries = lines.filter(line => /^\d{12}\s/.test(line));
  if (!entries.length) throw new Error(`Nenhum resultado encontrado na pagina ${page.num}.`);
  for (const entry of entries) {
    const match = entry.match(rowPattern);
    if (!match) throw new Error(`Linha de resultado nao reconhecida na pagina ${page.num}.`);
    csvRows.push([title, page.num, match[1], match[2], match[3], match[4], match[5]]);
    careers.set(title, careers.get(title) + 1);
  }
}

if (careers.size !== 4) throw new Error(`Quantidade inesperada de cargos: ${careers.size}.`);
const headers = ['Cargo / Área', 'Página do PDF', 'Inscrição', 'Nome', 'Nascimento', 'Nota discursiva', 'Situação'];
const escapeCsv = value => `"${String(value).replace(/"/g, '""')}"`;
const csv = [headers, ...csvRows].map(row => row.map(escapeCsv).join(';')).join('\r\n');
fs.writeFileSync('resultado-discursiva-preliminar-reaplicacao-2025.csv', `\uFEFF${csv}\r\n`, { encoding: 'utf8', flag: 'wx' });
console.log(Array.from(careers, ([title, count]) => `${title}: ${count}`).join('\n'));