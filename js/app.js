const calculator = SalaryCalculator;
const form = document.querySelector('#settings-form');
const formatMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatNumber = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const selectFields = ['time', 'qualification', 'location', 'position'];
const booleanFields = ['prevcom', 'oldRegime', 'field', 'health50', 'inflation'];
const numberFields = ['ceiling', 'rgps', 'taxDeduction', 'fieldAmount'];

function fillSelect(id, items, label) {
  const select = document.getElementById(id);
  items.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = label(item);
    select.append(option);
  });
}

fillSelect('time', calculator.times, item => item);
fillSelect('qualification', calculator.qualifications, item => item[1] ? `${item[0]} (${new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 }).format(item[1])})` : item[0]);
fillSelect('location', calculator.locations, item => item[0]);
fillSelect('position', calculator.functions, item => item[0]);

function resetForm() {
  selectFields.forEach(key => { document.getElementById(key).value = calculator.defaults[key]; });
  booleanFields.forEach(key => { document.getElementById(key).checked = calculator.defaults[key]; });
  numberFields.forEach(key => { document.getElementById(key).value = calculator.defaults[key]; });
  render();
}

function readOptions() {
  const options = {};
  selectFields.forEach(key => { options[key] = Number(document.getElementById(key).value); });
  booleanFields.forEach(key => { options[key] = document.getElementById(key).checked; });
  numberFields.forEach(key => {
    const input = document.getElementById(key);
    options[key] = input.value !== '' && input.validity.valid ? Number(input.value) : calculator.defaults[key];
  });
  return options;
}

function render() {
  const options = readOptions();
  const results = calculator.calculate(options);
  document.querySelector('#result-cards').innerHTML = results.map((result, index) => `
    <article class="result-card card-${index}">
      <div class="card-top"><span class="card-number">0${index + 1}</span><span class="grade">${result.grade}</span></div>
      <h3>${result.name}</h3>
      <div class="card-value"><span>LÍQUIDO ESTIMADO</span><strong>${formatMoney.format(result.net)}</strong></div>
      <div class="card-bottom"><span>Base de remuneração</span><strong>${formatMoney.format(result.gross)}</strong></div>
    </article>`).join('');

  const rows = [
    ['section', 'Base de remuneração', 'gross'],
    ['row', 'Vencimento básico', 'basePay'],
    ['row', 'Gratificação de incentivo', 'incentive'],
    ['row', 'Adicional de qualificação', 'qualification'],
    ['row', 'Função gratificada', 'position'],
    ['section', options.oldRegime ? 'Descontos · Regime antigo' : 'Descontos · FUNAFIN + PREVCOM', 'deductions'],
    ['row', 'Abate teto', 'ceilingReduction'],
    ['row', 'Contribuição previdenciária', 'pension'],
    ['row', 'PREVCOM-PE', 'prevcom'],
    ['row', 'Imposto de renda (IRPF)', 'tax'],
    ['section', 'Rendimentos indenizatórios', 'benefits'],
    ['row', 'Auxílio-saúde', 'health'],
    ['row', 'Auxílio-alimentação', 'food'],
    ['row', 'Verba indenizatória de campo', 'field'],
    ['row', 'Auxílio por local de exercício', 'location'],
    ['total', 'Total líquido a receber', 'net']
  ];
  document.querySelector('#breakdown-body').innerHTML = rows.map(([type, label, key]) => `<tr class="${type}"><th scope="row">${label}</th>${results.map(result => `<td>${formatNumber.format(result[key])}</td>`).join('')}</tr>`).join('');
}

form.addEventListener('input', event => {
  if (event.target.checked && event.target.id === 'oldRegime') {
    document.getElementById('prevcom').checked = false;
  } else if (event.target.checked && event.target.id === 'prevcom') {
    document.getElementById('oldRegime').checked = false;
  }
  render();
});
document.querySelector('#reset').addEventListener('click', resetForm);
resetForm();

const statisticsTabs = Array.from(document.querySelectorAll('.statistics-tab'));

function selectStatisticsTab(selectedTab) {
  statisticsTabs.forEach(tab => {
    const selected = tab === selectedTab;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
}

statisticsTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectStatisticsTab(tab));
  tab.addEventListener('keydown', event => {
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % statisticsTabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + statisticsTabs.length) % statisticsTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = statisticsTabs.length - 1;
    else return;
    event.preventDefault();
    selectStatisticsTab(statisticsTabs[nextIndex]);
    statisticsTabs[nextIndex].focus();
  });
});

const positionsLocation = document.querySelector('#positions-location');
const positionsRole = document.querySelector('#positions-role');
const positionsGrade = document.querySelector('#positions-grade');
const positionsBody = document.querySelector('#positions-body');
const positionsPrev = document.querySelector('#positions-prev');
const positionsNext = document.querySelector('#positions-next');
const positionsPageSize = 10;
let positionsPage = 0;

function createStatisticsSorter(table, columns, initialColumn, onChange, initialDirection = -1) {
  const headers = Array.from(table.querySelectorAll('thead th'));
  const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
  let column = initialColumn;
  let direction = initialDirection;

  function updateHeaders() {
    headers.forEach((header, index) => {
      if (index === column) header.setAttribute('aria-sort', direction === 1 ? 'ascending' : 'descending');
      else header.removeAttribute('aria-sort');
    });
  }

  headers.forEach((header, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'statistics-sort';
    button.textContent = header.textContent;
    button.addEventListener('click', () => {
      direction = column === index ? -direction : (columns[index].numeric ? -1 : 1);
      column = index;
      updateHeaders();
      onChange();
    });
    header.replaceChildren(button);
  });
  updateHeaders();

  const sort = rows => rows.sort((first, second) => {
    const firstValue = columns[column].value(first);
    const secondValue = columns[column].value(second);
    if (firstValue == null || secondValue == null) return firstValue == null ? (secondValue == null ? 0 : 1) : -1;
    return direction * (columns[column].numeric ? firstValue - secondValue : collator.compare(firstValue, secondValue));
  });
  sort.set = (nextColumn, nextDirection) => { column = nextColumn; direction = nextDirection; updateHeaders(); };
  return sort;
}

const vacanciesTable = document.querySelector('.vacancies-table');
const vacanciesData = Array.from(vacanciesTable.tBodies).flatMap(group => {
  const cargo = group.querySelector('th[scope="rowgroup"]').textContent;
  const totalCargo = Number(group.querySelector('.career-total').textContent);
  return Array.from(group.rows).map(row => {
    const specialty = row.querySelector('.specialty');
    const counts = [];
    let cell = specialty.nextElementSibling;
    for (let index = 0; index < 4; index++) {
      counts.push(Number(cell.textContent));
      cell = cell.nextElementSibling;
    }
    return { cargo, especialidade: specialty.textContent, vagas: counts[0], ac: counts[1], pcd: counts[2], ppp: counts[3], totalCargo };
  });
});
Array.from(vacanciesTable.tBodies).forEach(group => group.remove());
const vacanciesBody = document.createElement('tbody');
vacanciesTable.insertBefore(vacanciesBody, vacanciesTable.tFoot);
const sortVacancies = createStatisticsSorter(vacanciesTable, [
  { value: row => row.cargo },
  { value: row => row.especialidade },
  { value: row => row.vagas, numeric: true },
  { value: row => row.ac, numeric: true },
  { value: row => row.pcd, numeric: true },
  { value: row => row.ppp, numeric: true },
  { value: row => row.totalCargo, numeric: true }
], 2, renderVacancies);

function renderVacancies() {
  vacanciesBody.replaceChildren();
  sortVacancies([...vacanciesData]).forEach(item => {
    const row = document.createElement('tr');
    [item.cargo, item.especialidade, item.vagas, item.ac, item.pcd, item.ppp, item.totalCargo].forEach((value, index) => {
      const cell = document.createElement(index === 0 ? 'th' : 'td');
      if (index === 0) cell.scope = 'row';
      if (index === 1) cell.className = 'specialty';
      if (index === 6) cell.className = 'career-total';
      cell.textContent = value;
      row.append(cell);
    });
    vacanciesBody.append(row);
  });
}
renderVacancies();

const sortPositions = createStatisticsSorter(document.querySelector('.positions-table'), [
  { value: row => row.lotacao },
  { value: row => row.cargo },
  { value: row => row.classe || 'Não informada' },
  { value: row => row.quantidade, numeric: true },
  { value: row => row.campo, numeric: true }
], 3, () => { positionsPage = 0; renderPositions(); });

[...new Set(positionsData.map(row => row.lotacao))].sort((first, second) => first.localeCompare(second, 'pt-BR', { numeric: true })).forEach(location => {
  const option = document.createElement('option');
  option.value = location;
  option.textContent = location;
  positionsLocation.append(option);
});

[...new Set(positionsData.map(row => row.cargo))].sort((first, second) => first.localeCompare(second, 'pt-BR')).forEach(role => {
  const option = document.createElement('option');
  option.value = role;
  option.textContent = role;
  positionsRole.append(option);
});

[...new Set(positionsData.map(row => row.classe))].sort((first, second) => first.localeCompare(second, 'pt-BR', { numeric: true })).forEach(grade => {
  const option = document.createElement('option');
  option.value = grade || '__sem_classe__';
  option.textContent = grade || 'Não informada';
  positionsGrade.append(option);
});

function renderPositions() {
  const filtered = sortPositions(positionsData.filter(row => (!positionsLocation.value || row.lotacao === positionsLocation.value) && (!positionsRole.value || row.cargo === positionsRole.value) && (!positionsGrade.value || row.classe === (positionsGrade.value === '__sem_classe__' ? '' : positionsGrade.value))));
  const pages = Math.max(1, Math.ceil(filtered.length / positionsPageSize));
  positionsPage = Math.min(positionsPage, pages - 1);
  positionsBody.replaceChildren();
  filtered.slice(positionsPage * positionsPageSize, (positionsPage + 1) * positionsPageSize).forEach(item => {
    const row = document.createElement('tr');
    [item.lotacao, item.cargo, item.classe || 'Não informada', item.quantidade, item.campo].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    });
    positionsBody.append(row);
  });
  if (!filtered.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Nenhum registro encontrado.';
    row.append(cell);
    positionsBody.append(row);
  }
  document.querySelector('#positions-count').textContent = `${filtered.length} combinações de cargo, classe e lotação`;
  const total = filtered.reduce((sum, item) => sum + item.quantidade, 0);
  const fieldTotal = filtered.reduce((sum, item) => sum + item.campo, 0);
  document.querySelector('#positions-total').textContent = `${total.toLocaleString('pt-BR')} registros · ${fieldTotal.toLocaleString('pt-BR')} com campo estimado`;
  document.querySelector('#positions-page').textContent = `Página ${positionsPage + 1} de ${pages}`;
  positionsPrev.disabled = positionsPage === 0;
  positionsNext.disabled = positionsPage === pages - 1;
}

[positionsLocation, positionsRole, positionsGrade].forEach(input => input.addEventListener('input', () => {
  positionsPage = 0;
  renderPositions();
}));
positionsPrev.addEventListener('click', () => { positionsPage--; renderPositions(); });
positionsNext.addEventListener('click', () => { positionsPage++; renderPositions(); });
renderPositions();

const functionsLocation = document.querySelector('#functions-location');
const functionsType = document.querySelector('#functions-type');
const functionsRole = document.querySelector('#functions-role');
const functionsGrade = document.querySelector('#functions-grade');
const functionsBody = document.querySelector('#functions-body');
const functionsPrev = document.querySelector('#functions-prev');
const functionsNext = document.querySelector('#functions-next');
let functionsPage = 0;

const functionLabels = {
  'TC-FGG': 'Função Gratificada de Gerência',
  'TC-FGS-1 / TC-FGA-3': 'Função Gratificada de Secretaria - 1 ou de Assessoria - 3',
  'TC-FGS-2': 'Função Gratificada de Secretaria - 2',
  'TC-FAG-1': 'Função de Apoio Gratificada - 1',
  'TC-FAG-2': 'Função de Apoio Gratificada - 2',
  'TC-FAG-3': 'Função de Apoio Gratificada - 3',
  'TC-FGA-1': 'Função Gratificada de Assessoria - 1',
  'TC-FGA-2': 'Função Gratificada de Assessoria - 2',
  'TC-FGE-1': 'Função Gratificada Executiva - 1',
  'TC-FGE-2': 'Função Gratificada Executiva - 2',
  'TC-FGE-3': 'Função Gratificada Executiva - 3',
  'TC-FGE-4': 'Função Gratificada Executiva - 4',
  'TC-FGE-5': 'Função Gratificada Executiva - 5',
  'NAO_IDENTIFICADA': 'Valor sem correspondência exata',
  'SEM_VALOR': 'Valor igual a zero'
};

[...new Set(functionData.filter(row => row.codigo !== 'SEM_VALOR').map(row => row.lotacao))].sort((first, second) => first.localeCompare(second, 'pt-BR', { numeric: true })).forEach(location => {
  const option = document.createElement('option');
  option.value = location;
  option.textContent = location;
  functionsLocation.append(option);
});

[...new Set(functionData.filter(row => row.codigo !== 'SEM_VALOR').map(row => row.cargo))].sort((first, second) => first.localeCompare(second, 'pt-BR')).forEach(role => {
  const option = document.createElement('option');
  option.value = role;
  option.textContent = role;
  functionsRole.append(option);
});

[...new Set(functionData.filter(row => row.codigo !== 'SEM_VALOR').map(row => row.classe))].sort((first, second) => first.localeCompare(second, 'pt-BR', { numeric: true })).forEach(grade => {
  const option = document.createElement('option');
  option.value = grade || '__sem_classe__';
  option.textContent = grade || 'Não informada';
  functionsGrade.append(option);
});

Object.keys(functionLabels).filter(code => code !== 'SEM_VALOR').forEach(code => {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = code === 'NAO_IDENTIFICADA' || code === 'SEM_VALOR' ? functionLabels[code] : code;
  functionsType.append(option);
});

const sortFunctions = createStatisticsSorter(document.querySelector('.functions-table'), [
  { value: row => row.lotacao },
  { value: row => row.codigo === 'NAO_IDENTIFICADA' || row.codigo === 'SEM_VALOR' ? '—' : row.codigo },
  { value: row => functionLabels[row.codigo] },
  { value: row => row.quantidade, numeric: true }
], 3, () => { functionsPage = 0; renderFunctions(); });

function renderFunctions() {
  const groups = new Map();
  functionData.filter(row => row.codigo !== 'SEM_VALOR' && (!functionsLocation.value || row.lotacao === functionsLocation.value) && (!functionsType.value || row.codigo === functionsType.value) && (!functionsRole.value || row.cargo === functionsRole.value) && (!functionsGrade.value || row.classe === (functionsGrade.value === '__sem_classe__' ? '' : functionsGrade.value))).forEach(row => {
    const key = JSON.stringify([row.lotacao, row.codigo]);
    if (!groups.has(key)) groups.set(key, { lotacao: row.lotacao, codigo: row.codigo, quantidade: 0 });
    groups.get(key).quantidade += row.quantidade;
  });
  const filtered = sortFunctions([...groups.values()]);
  const pages = Math.max(1, Math.ceil(filtered.length / positionsPageSize));
  functionsPage = Math.min(functionsPage, pages - 1);
  functionsBody.replaceChildren();
  filtered.slice(functionsPage * positionsPageSize, (functionsPage + 1) * positionsPageSize).forEach(item => {
    const row = document.createElement('tr');
    const code = item.codigo === 'NAO_IDENTIFICADA' || item.codigo === 'SEM_VALOR' ? '—' : item.codigo;
    [item.lotacao, code, functionLabels[item.codigo], item.quantidade].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    });
    functionsBody.append(row);
  });
  if (!filtered.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = 'Nenhum registro encontrado.';
    row.append(cell);
    functionsBody.append(row);
  }
  document.querySelector('#functions-count').textContent = `${new Set(filtered.map(item => item.lotacao)).size} códigos de lotação`;
  document.querySelector('#functions-total').textContent = `${filtered.reduce((sum, item) => sum + item.quantidade, 0).toLocaleString('pt-BR')} registros`;
  document.querySelector('#functions-page').textContent = `Página ${functionsPage + 1} de ${pages}`;
  functionsPrev.disabled = functionsPage === 0;
  functionsNext.disabled = functionsPage === pages - 1;
}

[functionsLocation, functionsType, functionsRole, functionsGrade].forEach(input => input.addEventListener('input', () => { functionsPage = 0; renderFunctions(); }));
functionsPrev.addEventListener('click', () => { functionsPage--; renderFunctions(); });
functionsNext.addEventListener('click', () => { functionsPage++; renderFunctions(); });
renderFunctions();

const contestCareer = document.querySelector('#contest-career');
const contestStatus = document.querySelector('#contest-status');
const contestSearch = document.querySelector('#contest-search');
const contestBody = document.querySelector('#contest-body');
const contestPrev = document.querySelector('#contest-prev');
const contestNext = document.querySelector('#contest-next');
const contestScoreFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
let contestPage = 0;
const contestCareers = [
  ...contestData.map(career => ({ ...career, fase: 'concurso', resultados: career.resultados.map(result => ({ ...result })) })),
  ...contestReapplicationData.map(career => ({ ...career, resultados: ContestRanking.calculate(career.resultados) }))
];
const normalizeContestName = name => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR');
const normalizeContestKey = value => normalizeContestName(value).replace(/[^A-Z0-9]+/g, ' ').trim();
const appointmentKey = appointment => `${appointment.fase}|${appointment.cargo}|${normalizeContestName(appointment.nome)}`;
const appointmentsByCandidate = new Map(appointedCandidates.map(appointment => [appointmentKey(appointment), appointment]));
const vacancyPools = [
  { field: 'vagas_quadro_ac', editalField: 'edital_vagas_ac', label: 'Ampla', statuses: new Set(['Aprovado']) },
  { field: 'vagas_quadro_pcd', editalField: 'edital_vagas_pcd', label: 'PCD', statuses: new Set(['Aprovado PCD', 'Aprovado PCD/Negro']) },
  { field: 'vagas_quadro_ppp', editalField: 'edital_vagas_negros', label: 'Negro/PPP', statuses: new Set(['Aprovado Negro', 'Aprovado PCD/Negro']) }
];
contestCareers.forEach(career => {
  const withdrawals = ContestRanking.findWithdrawals(
    career.resultados,
    vacancyPools,
    other => appointmentsByCandidate.has(appointmentKey({ fase: career.fase, cargo: career.cargo, nome: other.nome }))
  );
  career.resultados.forEach(result => { result.desistencia = withdrawals.has(result); });
});
const vacancyTypesByCandidate = new Map();

vacancyData.forEach(vacancy => {
  const specialty = vacancy.especialidade === '—' ? '' : vacancy.especialidade;
  const vacancyCareer = contestCareers.find(career => normalizeContestKey(career.cargo) === normalizeContestKey(`${vacancy.cargo} ${specialty}`));
  if (!vacancyCareer) throw new Error(`Cargo sem correspondencia para as vagas: ${vacancy.cargo} / ${vacancy.especialidade}.`);

  vacancyPools.forEach(pool => {
    const count = vacancy[pool.field];
    const editalCount = vacancy[pool.editalField];
    if (!Number.isInteger(count) || count < 0) throw new Error(`Quantidade invalida de vagas: ${pool.field}.`);
    if (!Number.isInteger(editalCount) || editalCount < 0) throw new Error(`Quantidade invalida de vagas: ${pool.editalField}.`);
    if (!count) return;
    const eligible = vacancyCareer.resultados
      .filter(result => Number.isFinite(result.classificacao) && pool.statuses.has(result.situacao) && !appointmentsByCandidate.has(appointmentKey({ fase: vacancyCareer.fase, cargo: vacancyCareer.cargo, nome: result.nome })))
      .sort((first, second) => first.classificacao - second.classificacao);
    const currentBoundary = eligible[Math.min(count, eligible.length) - 1];
    const editalBoundary = eligible[Math.min(count, editalCount, eligible.length) - 1];
    if (!currentBoundary) return;
    eligible.filter(result => result.classificacao <= currentBoundary.classificacao).forEach(result => {
      const key = appointmentKey({ fase: vacancyCareer.fase, cargo: vacancyCareer.cargo, nome: result.nome });
      if (!vacancyTypesByCandidate.has(key)) vacancyTypesByCandidate.set(key, { types: [], editalTypes: [], additionalTypes: [] });
      const candidateVacancies = vacancyTypesByCandidate.get(key);
      if (!candidateVacancies.types.includes(pool.label)) candidateVacancies.types.push(pool.label);
      const typeGroup = editalBoundary && result.classificacao <= editalBoundary.classificacao
        ? candidateVacancies.editalTypes
        : candidateVacancies.additionalTypes;
      if (!typeGroup.includes(pool.label)) typeGroup.push(pool.label);
    });
  });
});

contestCareers.forEach(career => career.resultados.forEach(result => {
  const key = appointmentKey({ fase: career.fase, cargo: career.cargo, nome: result.nome });
  const candidateVacancies = vacancyTypesByCandidate.get(key);
  result.vaga = candidateVacancies ? candidateVacancies.types.join(' / ') : '';
  result.vagaEdital = candidateVacancies ? candidateVacancies.editalTypes : [];
  result.vagaAdicional = candidateVacancies ? candidateVacancies.additionalTypes : [];
}));

contestCareers.forEach((career, index) => {
  const option = document.createElement('option');
  option.value = index;
  option.textContent = career.fase === 'reaplicacao' ? `${career.cargo} — REAPLICAÇÃO` : career.cargo;
  contestCareer.append(option);
});

const sortContest = createStatisticsSorter(document.querySelector('.competition-table'), [
  { value: row => row.classificacao, numeric: true },
  { value: row => row.nome },
  { value: row => row.nascimento.split('/').reverse().join('-') },
  { value: row => row.objetiva, numeric: true },
  { value: row => row.discursiva, numeric: true },
  { value: row => row.titulos, numeric: true },
  { value: row => row.final, numeric: true },
  { value: row => row.situacao }
], 0, () => { contestPage = 0; renderContest(); }, 1);

function renderContest() {
  const query = contestSearch.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR');
  const career = contestCareers[Number(contestCareer.value)];
  const isReapplication = career.fase === 'reaplicacao';
  const hasTitles = career.cargo === 'PROCURADOR DO TRIBUNAL DE CONTAS';
  const headers = document.querySelectorAll('.competition-table thead th');
  headers[5].hidden = !hasTitles;
  headers[0].querySelector('button').textContent = isReapplication ? 'COLOCAÇÃO ESTIMADA' : 'CLASSIFICAÇÃO';
  headers[3].querySelector('button').textContent = isReapplication ? 'OBJETIVA DEFINITIVA' : 'OBJETIVA';
  headers[4].querySelector('button').textContent = isReapplication ? 'DISCURSIVA PRELIMINAR' : 'DISCURSIVA';
  headers[6].querySelector('button').textContent = isReapplication ? 'NOTA FINAL ESTIMADA' : 'NOTA FINAL';
  document.querySelector('#contest-stage').textContent = isReapplication
    ? 'Reaplicação: nota final e colocação estimadas pela soma das notas, com desempate por idade. Não são classificação oficial, não consideram cotas ou outros critérios e podem mudar após recursos; candidatos sem nota da discursiva não são classificados. A situação exibida vem da lista da objetiva definitiva.'
    : 'Resultado final com homologação parcial, conforme documento fornecido de 1º de setembro de 2026.';
  const selectedStatuses = contestStatus.value === 'Aprovado PCD' || contestStatus.value === 'Aprovado Negro'
    ? [contestStatus.value, 'Aprovado PCD/Negro']
    : contestStatus.value ? [contestStatus.value] : null;
  const filtered = sortContest(career.resultados.filter(row => (!selectedStatuses || selectedStatuses.includes(row.situacao)) && row.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR').includes(query)));
  const pages = Math.max(1, Math.ceil(filtered.length / positionsPageSize));
  contestPage = Math.min(contestPage, pages - 1);
  contestBody.replaceChildren();
  filtered.slice(contestPage * positionsPageSize, (contestPage + 1) * positionsPageSize).forEach(item => {
    const row = document.createElement('tr');
    const appointment = appointmentsByCandidate.get(appointmentKey({ fase: career.fase || 'concurso', cargo: career.cargo, nome: item.nome }));
    if (appointment) {
      row.classList.add('appointed');
      row.title = `Nomeado por ${appointment.portaria}`;
    } else if (item.desistencia) {
      row.classList.add('withdrawal');
      row.title = 'Possível desistência inferida: há pessoa da mesma cota nomeada em colocação posterior.';
    } else if (item.vaga) {
      row.classList.add(item.vagaEdital.length ? 'vacancy-edital' : 'vacancy-eligible');
      const vacancyDetails = [
        item.vagaEdital.length ? `edital: ${item.vagaEdital.join(', ')}` : '',
        item.vagaAdicional.length ? `quadro atual além do edital: ${item.vagaAdicional.join(', ')}` : ''
      ].filter(Boolean).join('; ');
      row.title = `Não nomeado; dentro do quantitativo (${vacancyDetails}).`;
    }
    [item.classificacao === null ? '—' : `${item.classificacao}º`, item.nome, item.nascimento, contestScoreFormat.format(item.objetiva), item.discursiva === null ? '—' : contestScoreFormat.format(item.discursiva), item.titulos === null ? '—' : contestScoreFormat.format(item.titulos), item.final === null ? '—' : contestScoreFormat.format(item.final), item.situacao].forEach((value, index) => {
      const cell = document.createElement('td');
      if (!hasTitles && index === 5) cell.hidden = true;
      cell.textContent = value;
      row.append(cell);
    });
    contestBody.append(row);
  });
  if (!filtered.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = hasTitles ? 8 : 7;
    cell.textContent = 'Nenhum resultado encontrado.';
    row.append(cell);
    contestBody.append(row);
  }
  document.querySelector('#contest-count').textContent = `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`;
  document.querySelector('#contest-page').textContent = `Página ${contestPage + 1} de ${pages}`;
  contestPrev.disabled = contestPage === 0;
  contestNext.disabled = contestPage === pages - 1;
}

contestCareer.addEventListener('input', () => {
  contestPage = 0;
  sortContest.set(0, 1);
  renderContest();
});
contestStatus.addEventListener('input', () => { contestPage = 0; renderContest(); });
contestSearch.addEventListener('input', () => { contestPage = 0; renderContest(); });
contestPrev.addEventListener('click', () => { contestPage--; renderContest(); });
contestNext.addEventListener('click', () => { contestPage++; renderContest(); });
renderContest();