const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ContestRanking = require('./classificacao-concurso.js');

const csvDirectory = path.join(__dirname, '..', 'csv');
const csvColumns = {
  career: 'Cargo / Área',
  inscription: 'Inscrição',
  name: 'Nome',
  birth: 'Nascimento',
  situation: 'Situação',
  stageResult: 'Resultado da etapa'
};
const vacancyColumns = [
  'vagas_quadro_total',
  'vagas_quadro_ac',
  'vagas_quadro_pcd',
  'vagas_quadro_ppp',
  'edital_vagas_ac',
  'edital_vagas_pcd',
  'edital_vagas_negros',
  'edital_total_sem_cr',
  'edital_tem_cadastro_reserva'
];
const quotaGroups = [
  { field: 'vagas_quadro_ac', editalField: 'edital_vagas_ac', label: 'Ampla', statuses: new Set(['Aprovado']) },
  { field: 'vagas_quadro_pcd', editalField: 'edital_vagas_pcd', label: 'PCD', statuses: new Set(['Aprovado PCD', 'Aprovado PCD/Negro']) },
  { field: 'vagas_quadro_ppp', editalField: 'edital_vagas_negros', label: 'Negro/PPP', statuses: new Set(['Aprovado Negro', 'Aprovado PCD/Negro']) }
];

function checkEqual(actual, expected, description) {
  if (!Object.is(actual, expected)) throw new Error(`${description} mismatch`);
}

function checkNumber(actual, expected, description) {
  if (expected === null) return checkEqual(actual, null, description);
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-9) {
    throw new Error(`${description} mismatch`);
  }
}

function parseCsv(content, filename) {
  const text = content.replace(/^\uFEFF/, '');
  const rows = [];
  let fields = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ';') {
      fields.push(field);
      field = '';
    } else if (character === '\n') {
      fields.push(field);
      if (fields.some(value => value.length > 0)) rows.push(fields);
      fields = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }

  if (quoted) throw new Error(`Malformed quoted CSV: ${filename}`);
  if (field.length || fields.length) {
    fields.push(field);
    if (fields.some(value => value.length > 0)) rows.push(fields);
  }
  if (rows.length < 2) throw new Error(`CSV is empty or has no data rows: ${filename}`);

  const [headers, ...data] = rows;
  if (new Set(headers).size !== headers.length) throw new Error(`Duplicate CSV headers: ${filename}`);
  return data.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`Malformed CSV row ${index + 2}: ${filename}`);
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
}

function readCsv(filename) {
  const filepath = path.join(csvDirectory, filename);
  assert.ok(fs.existsSync(filepath), `Required local CSV is missing: ${filename}`);
  return parseCsv(fs.readFileSync(filepath, 'utf8'), filename);
}

function readSiteData(filename, expression) {
  const source = fs.readFileSync(path.join(__dirname, filename), 'utf8').replace(/^\uFEFF/, '');
  return vm.runInNewContext(`${source}\n${expression}`);
}

function normalizeText(value) {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('pt-BR')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function candidateKey(career, name, birth) {
  return `${normalizeText(career)}|${normalizeText(name)}|${birth.trim()}`;
}

function indexCandidates(rows, getKey, description) {
  const indexed = new Map();
  rows.forEach(row => {
    const key = getKey(row);
    if (!key || indexed.has(key)) throw new Error(`Missing or duplicate candidate in ${description}`);
    indexed.set(key, row);
  });
  return indexed;
}

function flattenCareers(careers) {
  return careers.flatMap(career => career.resultados.map(result => ({
    career: career.cargo,
    result
  })));
}

function canonicalStatus(value) {
  const status = value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR');
  const pcd = status.includes('PCD');
  const negro = status.includes('NEGRO');
  if (pcd && negro) return 'Aprovado PCD/Negro';
  if (pcd) return 'Aprovado PCD';
  if (negro) return 'Aprovado Negro';
  if (status === 'APROVADO') return 'Aprovado';
  throw new Error('Unsupported candidate situation');
}

function parseNumber(value) {
  if (value.trim() === '') return null;
  const number = Number(value.replace(',', '.'));
  if (!Number.isFinite(number)) throw new Error('Invalid numeric value in result CSV');
  return number;
}

function indexByInscription(rows, filename) {
  return indexCandidates(rows, row => row[csvColumns.inscription], filename);
}

function assertQuotaSources(row, heteroidentification, medicalExamination, filename) {
  const situation = canonicalStatus(row[csvColumns.situation]);
  const inscription = row[csvColumns.inscription];
  if (situation.includes('Negro') && heteroidentification.has(inscription)) {
    checkEqual(heteroidentification.get(inscription)[csvColumns.stageResult], 'Enquadrado', `${filename} heteroidentification eligibility`);
  }
  if (situation.includes('PCD') && medicalExamination.has(inscription)) {
    checkEqual(medicalExamination.get(inscription)[csvColumns.stageResult], 'Enquadrado', `${filename} medical eligibility`);
  }
}

function expectedQuotaObservations(inscription, heteroidentification, medicalExamination) {
  const observations = [];
  if (heteroidentification.get(inscription)?.[csvColumns.stageResult] === 'Não enquadrado') {
    observations.push('Não enquadrado PPP');
  } else if (heteroidentification.get(inscription)?.[csvColumns.stageResult] === 'Ausente') {
    observations.push('Ausente Heteroidentificação');
  }
  if (medicalExamination.get(inscription)?.[csvColumns.stageResult] === 'Não enquadrado') {
    observations.push('Não enquadrado PCD');
  } else if (medicalExamination.get(inscription)?.[csvColumns.stageResult] === 'Ausente') {
    observations.push('Ausente Perícia PCD');
  }
  return observations;
}

test('final contest data displayed by the site matches its consolidated CSV', () => {
  const csvRows = readCsv('resultado-concurso-2025.csv');
  const siteRows = flattenCareers(readSiteData('resultado-concurso.js', 'contestData'));
  const csvByKey = indexCandidates(csvRows, row => candidateKey(row[csvColumns.career], row[csvColumns.name], row[csvColumns.birth]), 'final contest CSV');
  const siteByKey = indexCandidates(siteRows, row => candidateKey(row.career, row.result.nome, row.result.nascimento), 'final contest JavaScript');
  checkEqual(siteByKey.size, csvByKey.size, 'Final contest candidate count');

  csvRows.forEach((row, index) => {
    const displayed = siteByKey.get(candidateKey(row[csvColumns.career], row[csvColumns.name], row[csvColumns.birth]));
    if (!displayed) throw new Error(`Final contest candidate missing from site data at CSV row ${index + 2}`);
    checkEqual(displayed.career, row[csvColumns.career], 'Final contest career');
    checkEqual(displayed.result.nome, row[csvColumns.name], 'Final contest name');
    checkEqual(displayed.result.nascimento, row[csvColumns.birth], 'Final contest birth date');
    checkEqual(displayed.result.classificacao, parseNumber(row.Classificação), 'Final contest rank');
    checkNumber(displayed.result.objetiva, parseNumber(row['Nota objetiva']), 'Final contest objective score');
    checkNumber(displayed.result.discursiva, parseNumber(row['Nota discursiva']), 'Final contest written score');
    checkNumber(displayed.result.titulos, parseNumber(row['Nota de títulos']), 'Final contest title score');
    checkNumber(displayed.result.final, parseNumber(row['Nota final']), 'Final contest total score');
    checkEqual(displayed.result.situacao, canonicalStatus(row[csvColumns.situation]), 'Final contest situation');
  });
});

test('reapplication data displayed by the site matches the CSVs and screening results', () => {
  const objectiveRows = readCsv('resultado-objetiva-reaplicacao-2025.csv');
  const discursiveRows = readCsv('resultado-discursiva-preliminar-reaplicacao-2025.csv');
  const heteroRows = readCsv('resultado-preliminar-heteroidentificacao.csv');
  const medicalRows = readCsv('resultado-preliminar-pericia-medica.csv');
  const objectiveByKey = indexCandidates(objectiveRows, row => candidateKey(row[csvColumns.career], row[csvColumns.name], row[csvColumns.birth]), 'objective CSV');
  const discursiveByKey = indexCandidates(discursiveRows, row => candidateKey(row[csvColumns.career], row[csvColumns.name], row[csvColumns.birth]), 'discursive CSV');
  const heteroidentification = indexByInscription(heteroRows, 'heteroidentification CSV');
  const medicalExamination = indexByInscription(medicalRows, 'medical examination CSV');
  const siteCareers = readSiteData('resultado-reaplicacao.js', 'contestReapplicationData');
  const siteRows = flattenCareers(siteCareers);
  const siteByKey = indexCandidates(siteRows, row => candidateKey(row.career, row.result.nome, row.result.nascimento), 'reapplication JavaScript');
  checkEqual(siteByKey.size, objectiveByKey.size, 'Reapplication candidate count');

  objectiveRows.forEach((row, index) => {
    const key = candidateKey(row[csvColumns.career], row[csvColumns.name], row[csvColumns.birth]);
    const displayed = siteByKey.get(key);
    if (!displayed) throw new Error(`Objective candidate missing from site data at CSV row ${index + 2}`);
    checkEqual(displayed.career, row[csvColumns.career], 'Reapplication career');
    checkEqual(displayed.result.nome, row[csvColumns.name], 'Reapplication name');
    checkEqual(displayed.result.nascimento, row[csvColumns.birth], 'Reapplication birth date');
    checkNumber(displayed.result.objetiva, parseNumber(row['Nota objetiva']), 'Reapplication objective score');
    checkEqual(displayed.result.situacao, canonicalStatus(row[csvColumns.situation]), 'Reapplication situation');
    checkEqual(JSON.stringify(displayed.result.observacoes), JSON.stringify(expectedQuotaObservations(row[csvColumns.inscription], heteroidentification, medicalExamination)), 'Reapplication quota observations');
    assertQuotaSources(row, heteroidentification, medicalExamination, 'Objective CSV');

    const discursive = discursiveByKey.get(key);
    if (discursive) {
      checkEqual(canonicalStatus(row[csvColumns.situation]), canonicalStatus(discursive[csvColumns.situation]), 'Objective/discursive situation');
      checkNumber(displayed.result.discursiva, parseNumber(discursive['Nota discursiva']), 'Reapplication written score');
    } else {
      checkEqual(displayed.result.discursiva, null, 'Missing preliminary written score');
    }
  });

  discursiveRows.forEach((row, index) => {
    const key = candidateKey(row[csvColumns.career], row[csvColumns.name], row[csvColumns.birth]);
    const objective = objectiveByKey.get(key);
    const displayed = siteByKey.get(key);
    if (!objective || !displayed) throw new Error(`Discursive candidate missing from objective/site data at CSV row ${index + 2}`);
    checkNumber(displayed.result.discursiva, parseNumber(row['Nota discursiva']), 'Discursive CSV score');
    checkEqual(displayed.result.situacao, canonicalStatus(row[csvColumns.situation]), 'Discursive site situation');
    assertQuotaSources(row, heteroidentification, medicalExamination, 'Discursive CSV');
  });

  const vacancies = readSiteData('vagas-concurso.js', 'vacancyData');
  const appointments = readSiteData('nomeacoes-concurso.js', 'appointedCandidates');
  const appointmentKey = (phase, career, name) => `${phase}|${career}|${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR')}`;
  const appointed = new Set(appointments.map(item => appointmentKey(item.fase, item.cargo, item.nome)));
  siteCareers.forEach(career => {
    const specialty = vacancies.filter(vacancy => normalizeText(`${vacancy.cargo} ${vacancy.especialidade === '—' ? '' : vacancy.especialidade}`) === normalizeText(career.cargo));
    checkEqual(specialty.length, 1, 'Reapplication vacancy mapping');
    const projected = ContestRanking.assignVacancyTypes(
      ContestRanking.calculate(career.resultados),
      quotaGroups,
      specialty[0],
      result => appointed.has(appointmentKey(career.fase, career.cargo, result.nome))
    );
    if (!projected.size) throw new Error('No reapplication candidates projected into available vacancies');
  });
});

test('vacancy counts used by the site match the CSV and displayed vacancy table', () => {
  const csvRows = readCsv('vagas-concurso.csv');
  const siteRows = readSiteData('vagas-concurso.js', 'vacancyData');
  const csvByKey = indexCandidates(csvRows, row => `${normalizeText(row.cargo)}|${normalizeText(row.especialidade)}`, 'vacancy CSV');
  const siteByKey = indexCandidates(siteRows, row => `${normalizeText(row.cargo)}|${normalizeText(row.especialidade)}`, 'vacancy JavaScript');
  checkEqual(siteByKey.size, csvByKey.size, 'Vacancy specialty count');

  const dataRows = csvRows.map(row => {
    const key = `${normalizeText(row.cargo)}|${normalizeText(row.especialidade)}`;
    const displayed = siteByKey.get(key);
    if (!displayed) throw new Error('Vacancy specialty missing from site data');
    for (const column of vacancyColumns) {
      const expected = column === 'edital_tem_cadastro_reserva' ? row[column] : parseNumber(row[column]);
      checkEqual(displayed[column], expected, `Vacancy data ${column}`);
    }
    return row;
  });

  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const table = html.match(/<table class="vacancies-table">([\s\S]*?)<\/table>/);
  if (!table) throw new Error('Displayed vacancy table was not found');
  const groups = Array.from(table[1].matchAll(/<tbody>([\s\S]*?)<\/tbody>/g), match => match[1]);
  const displayedRows = [];
  groups.forEach(group => {
    const careerMatch = group.match(/<th scope="rowgroup"[^>]*>([^<]+)<\/th>/);
    if (!careerMatch) throw new Error('Vacancy table career group was not found');
    const career = careerMatch[1].trim();
    const rows = Array.from(group.matchAll(/<tr>([\s\S]*?)<\/tr>/g), match => match[1]);
    let careerTotal;
    rows.forEach(row => {
      const cells = Array.from(row.matchAll(/<td(?:\s[^>]*)?>([^<]*)<\/td>/g), match => match[1].trim());
      if (cells.length < 5) throw new Error('Malformed row in displayed vacancy table');
      const specialty = cells[0];
      const csvRow = dataRows.find(item => normalizeText(item.cargo) === normalizeText(career) && normalizeText(item.especialidade) === normalizeText(specialty));
      if (!csvRow) throw new Error('Displayed vacancy specialty is absent from CSV');
      ['vagas_quadro_total', 'vagas_quadro_ac', 'vagas_quadro_pcd', 'vagas_quadro_ppp'].forEach((column, index) => {
        checkNumber(Number(cells[index + 1]), parseNumber(csvRow[column]), `Displayed vacancy ${column}`);
      });
      if (cells.length > 5) careerTotal = Number(cells[5]);
      displayedRows.push(csvRow);
    });
    const expectedCareerTotal = dataRows
      .filter(row => normalizeText(row.cargo) === normalizeText(career))
      .reduce((sum, row) => sum + parseNumber(row.vagas_quadro_total), 0);
    checkNumber(careerTotal, expectedCareerTotal, 'Displayed career vacancy total');
  });
  checkEqual(displayedRows.length, dataRows.length, 'Displayed vacancy row count');

  const totals = [
    'vagas_quadro_total',
    'vagas_quadro_ac',
    'vagas_quadro_pcd',
    'vagas_quadro_ppp'
  ].map(column => dataRows.reduce((sum, row) => sum + parseNumber(row[column]), 0));
  const footer = table[1].match(/<tfoot>([\s\S]*?)<\/tfoot>/);
  if (!footer) throw new Error('Displayed vacancy totals were not found');
  const footerCells = Array.from(footer[1].matchAll(/<td(?:\s[^>]*)?>([^<]*)<\/td>/g), match => Number(match[1].trim()));
  totals.forEach((total, index) => checkNumber(footerCells[index], total, 'Displayed vacancy footer total'));
  const vacancyHeading = html.match(/class="vacancies-total">(\d+) vagas no total/);
  if (!vacancyHeading) throw new Error('Displayed vacancy heading total was not found');
  checkNumber(Number(vacancyHeading[1]), totals[0], 'Displayed vacancy heading total');
});
