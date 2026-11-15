const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const expectedCounts = new Map([
  [754, 6], [755, 2], [756, 1], [757, 2], [758, 1],
  [759, 9], [760, 1], [761, 2], [762, 7], [763, 2],
  [764, 1], [765, 4], [766, 1], [767, 1], [768, 1]
]);
const contestData = vm.runInNewContext(`${fs.readFileSync(path.join(__dirname, 'resultado-concurso.js'), 'utf8')}\ncontestData`);
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const acts = new Map();

function formatDate(day, year) {
  return `${String(day).padStart(2, '0')}/10/${year}`;
}

function findContestCareer(cargo, area) {
  const contestArea = area.replace(/^Auditoria\s+de\s+/i, '');
  const key = normalize(`${cargo} ${contestArea}`);
  const matches = contestData.filter(career => normalize(career.cargo) === key);
  if (matches.length !== 1) throw new Error(`Cargo do concurso nao encontrado: ${cargo} / ${area}.`);
  return matches[0];
}

function parseCsvRow(line) {
  const cells = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (quoted && character === '"' && line[index + 1] === '"') {
      value += '"';
      index++;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ';' && !quoted) {
      cells.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  cells.push(value);
  return cells;
}

function readCsv(fileName) {
  const filePath = path.join(__dirname, '..', 'csv', fileName);
  const lines = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/);
  const headers = parseCsvRow(lines.shift());
  return lines.map((line, index) => {
    const cells = parseCsvRow(line);
    if (cells.length !== headers.length) throw new Error(`Quantidade inesperada de colunas na linha ${index + 2} de ${filePath}.`);
    return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]]));
  });
}

function buildSiteData(appointments) {
  const seen = new Set();
  return appointments.map(appointment => {
    const career = findContestCareer(appointment.Cargo, appointment['Área']);
    const candidate = career.resultados.find(result => normalize(result.nome) === normalize(appointment.Nome));
    if (!candidate) throw new Error(`Candidato nao encontrado na classificacao: ${appointment.Nome}.`);
    const key = `${career.cargo}|${normalize(candidate.nome)}`;
    if (seen.has(key)) throw new Error(`Nomeacao duplicada: ${appointment.Nome}.`);
    seen.add(key);
    return { fase: 'concurso', cargo: career.cargo, nome: candidate.nome, portaria: appointment.Portaria };
  });
}

function writeSiteData(data) {
  fs.writeFileSync(path.join(__dirname, 'nomeacoes-concurso.js'), `const appointedCandidates = ${JSON.stringify(data)};\n`, 'utf8');
}

function writeVacancyData() {
  const vacancyData = readCsv('vagas-concurso.csv');
  const numericColumns = ['vagas_quadro_total', 'vagas_quadro_ac', 'vagas_quadro_pcd', 'vagas_quadro_ppp', 'edital_vagas_ac', 'edital_vagas_pcd', 'edital_vagas_negros', 'edital_total_sem_cr'];
  if (vacancyData.length !== 10) throw new Error(`Quantidade inesperada de especialidades com vagas: ${vacancyData.length}.`);
  vacancyData.forEach(row => numericColumns.forEach(column => {
    const value = Number(row[column]);
    if (!Number.isInteger(value) || value < 0) throw new Error(`Valor invalido em ${column}.`);
    row[column] = value;
  }));
  fs.writeFileSync(path.join(__dirname, 'vagas-concurso.js'), `const vacancyData = ${JSON.stringify(vacancyData)};\n`, 'utf8');
}

if (process.argv.includes('--site-data-only')) {
  const data = buildSiteData(readCsv('nomeacoes-concurso.csv'));
  if (data.length !== 41) throw new Error(`Quantidade inesperada de nomeados: ${data.length}.`);
  writeSiteData(data);
  writeVacancyData();
  console.log(`Dados de nomeacao para o site: ${data.length}.`);
  process.exit(0);
}

const document = JSON.parse(fs.readFileSync(0, 'utf8'));

for (const page of document.pages) {
  if (page.num < 86 || page.num > 91) continue;
  const lines = page.text.split('\n').map(line => line.trim()).filter(Boolean);
  const publicationMatch = page.text.match(/Recife,\s*(\d{2}) de outubro de (\d{4})/i);
  if (!publicationMatch) throw new Error(`Data de publicacao nao encontrada na pagina ${page.num}.`);
  const publicationDate = formatDate(publicationMatch[1], publicationMatch[2]);

  for (let index = 0; index < lines.length; index++) {
    const start = lines[index].match(/^Portaria\s+n(?:º|o)\s+(\d+)\/2026\s+[–-]\s+nomear\s+/i);
    if (!start || !expectedCounts.has(Number(start[1]))) continue;

    const block = [lines[index]];
    for (let cursor = index + 1; cursor < lines.length; cursor++) {
      if (/^Portaria\s+n(?:º|o)\s+\d+\/2026\s+[–-]\s+nomear\s+/i.test(lines[cursor])) break;
      block.push(lines[cursor]);
      if (/^Tribunal de Contas do Estado de Pernambuco,\s+em \d+ de outubro de \d{4}\./i.test(lines[cursor])) break;
      if (/^Di[aá]rio Eletr[oô]nico/i.test(lines[cursor])) break;
    }

    const portaria = Number(start[1]);
    const text = block.join(' ').replace(/\s+/g, ' ');
    const normalizedText = normalize(text);
    const appointment = text.match(/\bcargo de\s+(.+?),\s*(padr[aã]o|s[ií]mbolo)\s+([A-Z0-9-]+)/i);
    if (!appointment) throw new Error(`Cargo nao encontrado na Portaria ${portaria}.`);
    const fullRole = appointment[1].trim();
    const area = fullRole.match(/\s+-\s+Área de\s+(.+)$/i);
    const cargo = area ? fullRole.slice(0, area.index).trim() : fullRole;
    const areaName = area ? area[1].trim() : '';
    const contestCareer = findContestCareer(cargo, areaName);
    const matchedCandidates = contestCareer.resultados
      .map(result => result.nome)
      .filter(name => normalizedText.includes(normalize(name)))
      .sort((first, second) => normalizedText.indexOf(normalize(first)) - normalizedText.indexOf(normalize(second)));
    if (matchedCandidates.length !== expectedCounts.get(portaria)) {
      throw new Error(`Quantidade inesperada de nomeados na Portaria ${portaria}: ${matchedCandidates.length}.`);
    }

    const date = text.match(/Tribunal de Contas do Estado de Pernambuco,\s+em (\d+) de outubro de (\d{4})\./i);
    const record = {
      portaria: `Portaria nº ${portaria}/2026`,
      data_ato: date ? formatDate(date[1], date[2]) : null,
      data_publicacao: publicationDate,
      cargo,
      area: areaName,
      cargo_concurso: contestCareer.cargo,
      padrao_simbolo: `${appointment[2].toLowerCase().startsWith('padr') ? 'Padrão' : 'Símbolo'} ${appointment[3]}`,
      pagina_pdf: page.num,
      nomes: matchedCandidates
    };

    const previous = acts.get(portaria);
    if (!previous || (!previous.data_ato && record.data_ato)) {
      acts.set(portaria, record);
    } else if (JSON.stringify(previous.nomes) !== JSON.stringify(record.nomes) || previous.cargo !== record.cargo || previous.area !== record.area) {
      throw new Error(`Conteudo divergente para a Portaria ${portaria}.`);
    }
  }
}

if (acts.size !== expectedCounts.size) throw new Error(`Quantidade inesperada de portarias: ${acts.size}.`);
const rows = Array.from(acts.values()).sort((first, second) => Number(first.portaria.match(/\d+/)[0]) - Number(second.portaria.match(/\d+/)[0])).flatMap(act => {
  if (!act.data_ato) throw new Error(`Data do ato ausente na ${act.portaria}.`);
  return act.nomes.map(nome => [act.portaria, act.data_ato, act.data_publicacao, nome, act.cargo, act.area, act.padrao_simbolo, act.pagina_pdf]);
});
if (rows.length !== 41) throw new Error(`Quantidade inesperada de nomeados: ${rows.length}.`);

const headers = ['Portaria', 'Data do ato', 'Data de publicação', 'Nome', 'Cargo', 'Área', 'Padrão / símbolo', 'Página do PDF'];
const escapeCsv = value => `"${String(value).replace(/"/g, '""')}"`;
const csv = [headers, ...rows].map(row => row.map(escapeCsv).join(';')).join('\r\n');
fs.writeFileSync(path.join(__dirname, '..', 'csv', 'nomeacoes-concurso.csv'), `\uFEFF${csv}\r\n`, { encoding: 'utf8', flag: 'wx' });
writeSiteData(buildSiteData(Array.from(acts.values()).flatMap(act => act.nomes.map(nome => ({
  Cargo: act.cargo,
  'Área': act.area,
  Nome: nome,
  Portaria: act.portaria
})))));
writeVacancyData();
console.log(`Portarias: ${acts.size}; nomeados: ${rows.length}.`);
