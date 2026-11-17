const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ContestRanking = require('./classificacao-concurso.js');
const { calculate, findWithdrawals } = ContestRanking;
const readProjectFile = fileName => fs.readFileSync(path.join(__dirname, fileName), 'utf8');
const statuses = new Set(['Aprovado', 'Aprovado PCD', 'Aprovado PCD/Negro', 'Aprovado Negro']);
const countStatuses = results => results.reduce((counts, result) => {
  counts[result.situacao] = (counts[result.situacao] || 0) + 1;
  return counts;
}, {});

const sample = [
  { nascimento: '01/01/2000', objetiva: 60, discursiva: 18.5 },
  { nascimento: '01/01/1980', objetiva: 59, discursiva: 19.5 },
  { nascimento: '01/01/1980', objetiva: 58, discursiva: 20.5 },
  { nascimento: '01/01/1990', objetiva: 70, discursiva: 8 },
  { nascimento: '01/01/1970', objetiva: 90, discursiva: null }
];
const ranked = calculate(sample);
assert.deepEqual(ranked.map(result => result.classificacao), [3, 1, 1, 4, null]);
assert.deepEqual(ranked.map(result => result.final), [78.5, 78.5, 78.5, 78, null]);
assert.equal(sample[0].classificacao, undefined);
const quotaGroups = [
  { field: 'vagas_quadro_ac', editalField: 'edital_vagas_ac', label: 'Ampla', statuses: new Set(['Aprovado']) },
  { field: 'vagas_quadro_pcd', editalField: 'edital_vagas_pcd', label: 'PCD', statuses: new Set(['Aprovado PCD', 'Aprovado PCD/Negro']) },
  { field: 'vagas_quadro_ppp', editalField: 'edital_vagas_negros', label: 'Negro/PPP', statuses: new Set(['Aprovado Negro', 'Aprovado PCD/Negro']) }
];
const withdrawalCandidates = [
  { classificacao: 1, situacao: 'Aprovado' },
  { classificacao: 2, situacao: 'Aprovado PCD/Negro' },
  { classificacao: 3, situacao: 'Aprovado Negro' },
  { classificacao: 4, situacao: 'Aprovado PCD' },
  { classificacao: 5, situacao: 'Aprovado' },
  { classificacao: 5, situacao: 'Aprovado' }
];
const appointedForWithdrawal = new Set([withdrawalCandidates[2], withdrawalCandidates[4]]);
const isAppointedForWithdrawal = candidate => appointedForWithdrawal.has(candidate);
const withdrawals = findWithdrawals(withdrawalCandidates, quotaGroups, isAppointedForWithdrawal);
assert.ok(withdrawals.has(withdrawalCandidates[0]));
assert.ok(withdrawals.has(withdrawalCandidates[1]));
assert.ok(!withdrawals.has(withdrawalCandidates[3]));
assert.ok(!withdrawals.has(withdrawalCandidates[4]));
assert.ok(!withdrawals.has(withdrawalCandidates[5]));
assert.ok(!findWithdrawals([{ classificacao: null, situacao: 'Aprovado' }], quotaGroups, () => false).size);

const vacancyCandidates = [
  { classificacao: 1, situacao: 'Aprovado' },
  { classificacao: 2, situacao: 'Aprovado PCD/Negro' },
  { classificacao: 3, situacao: 'Aprovado PCD' },
  { classificacao: 4, situacao: 'Aprovado Negro' }
];
const projectedVacancies = ContestRanking.assignVacancyTypes(vacancyCandidates, quotaGroups, {
  vagas_quadro_ac: 1,
  edital_vagas_ac: 1,
  vagas_quadro_pcd: 2,
  edital_vagas_pcd: 1,
  vagas_quadro_ppp: 1,
  edital_vagas_negros: 1
}, () => false);
assert.deepEqual(projectedVacancies.get(vacancyCandidates[0]), {
  types: ['Ampla'],
  editalTypes: ['Ampla'],
  additionalTypes: []
});
assert.deepEqual(projectedVacancies.get(vacancyCandidates[1]), {
  types: ['PCD', 'Negro/PPP'],
  editalTypes: ['PCD', 'Negro/PPP'],
  additionalTypes: []
});
assert.deepEqual(projectedVacancies.get(vacancyCandidates[2]), {
  types: ['PCD'],
  editalTypes: [],
  additionalTypes: ['PCD']
});
assert.equal(projectedVacancies.has(vacancyCandidates[3]), false);

const data = vm.runInNewContext(`${readProjectFile('resultado-concurso.js')}\ncontestData`);
assert.deepEqual(Array.from(data, career => career.resultados.length), [135, 87, 73, 34, 155, 25]);
for (const career of data) {
  career.resultados.forEach((result, index) => {
    assert.equal(result.classificacao, index + 1);
    assert.ok(result.nome && Number.isFinite(result.objetiva) && Number.isFinite(result.discursiva) && Number.isFinite(result.final));
    assert.match(result.nascimento, /^\d{2}\/\d{2}\/\d{4}$/);
    assert.ok(statuses.has(result.situacao));
    assert.deepEqual(Object.keys(result).sort(), ['classificacao', 'discursiva', 'final', 'nascimento', 'nome', 'objetiva', 'situacao', 'titulos']);
    assert.equal(result.titulos === null, !career.cargo.startsWith('PROCURADOR'));
  });
}
assert.deepEqual(countStatuses(data.flatMap(career => career.resultados)), {
  Aprovado: 433,
  'Aprovado Negro': 47,
  'Aprovado PCD': 27,
  'Aprovado PCD/Negro': 2
});
assert.equal(data[0].resultados[0].nome, 'Washington Luis Galdina de Souza');
assert.equal(data[0].resultados[0].final, 80);
assert.equal(data[5].resultados[0].nome, 'Roberta Gouveia de Rezende Pereira');
assert.equal(data[5].resultados[0].titulos, 3);
assert.equal(data[5].resultados[0].final, 102.5);

const reapplication = vm.runInNewContext(`${readProjectFile('resultado-reaplicacao.js')}\ncontestReapplicationData`);
const expected = new Map([
  ['ANALISTA DE CONTROLE EXTERNO-CONTAS PÚBLICAS', [765, 306]],
  ['ANALISTA DE GESTÃO-ADMINISTRAÇÃO', [1533, 66]],
  ['AUDITOR DE CONTROLE EXTERNO-CONTAS PÚBLICAS', [862, 227]],
  ['AUDITOR DE CONTROLE EXTERNO-TECNOLOGIA DA INFORMAÇÃO', [245, 131]]
]);
assert.equal(reapplication.length, expected.size);
for (const career of reapplication) {
  assert.ok(expected.has(career.cargo));
  assert.equal(career.fase, 'reaplicacao');
  assert.deepEqual([career.resultados.length, career.resultados.filter(result => result.discursiva !== null).length], expected.get(career.cargo));
  career.resultados.forEach(result => {
    assert.ok(result.nome && Number.isFinite(result.objetiva));
    assert.ok(result.discursiva === null || Number.isFinite(result.discursiva));
    assert.equal(result.classificacao, null);
    assert.equal(result.titulos, null);
    assert.equal(result.final, null);
    assert.match(result.nascimento, /^\d{2}\/\d{2}\/\d{4}$/);
    assert.ok(statuses.has(result.situacao));
    assert.ok(Array.isArray(result.observacoes));
    assert.ok(result.observacoes.every(observation => ['Não enquadrado PPP', 'Não enquadrado PCD', 'Ausente Heteroidentificação', 'Ausente Perícia PCD'].includes(observation)));
    assert.deepEqual(Object.keys(result).sort(), ['classificacao', 'discursiva', 'final', 'nascimento', 'nome', 'objetiva', 'observacoes', 'situacao', 'titulos']);
  });
  const calculated = calculate(career.resultados);
  const scored = calculated.filter(result => result.discursiva !== null);
  calculated.forEach(result => {
    if (result.discursiva === null) {
      assert.equal(result.final, null);
      assert.equal(result.classificacao, null);
      return;
    }
    assert.equal(result.final, (Math.round(result.objetiva * 100) + Math.round(result.discursiva * 100)) / 100);
    const birth = result.nascimento.split('/').reverse().join('-');
    const ahead = scored.filter(other => other.final > result.final || (other.final === result.final && other.nascimento.split('/').reverse().join('-') < birth)).length;
    assert.equal(result.classificacao, ahead + 1);
  });
  expected.delete(career.cargo);
}
assert.deepEqual(countStatuses(reapplication.flatMap(career => career.resultados)), {
  Aprovado: 2783,
  'Aprovado Negro': 479,
  'Aprovado PCD': 123,
  'Aprovado PCD/Negro': 20
});
assert.equal(expected.size, 0);

const contestRankingBrowser = vm.runInNewContext(`${readProjectFile('classificacao-concurso.js')}\nContestRanking`);
assert.equal(typeof contestRankingBrowser.findWithdrawals, 'function');
const appointments = vm.runInNewContext(`${readProjectFile('nomeacoes-concurso.js')}\nappointedCandidates`);
const officialCandidates = new Set(data.flatMap(career => career.resultados.map(result => `${career.cargo}|${result.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR')}`)));
assert.equal(appointments.length, 41);
assert.equal(new Set(appointments.map(appointment => `${appointment.cargo}|${appointment.nome}`)).size, appointments.length);
appointments.forEach(appointment => {
  assert.equal(appointment.fase, 'concurso');
  assert.ok(appointment.portaria);
  assert.ok(officialCandidates.has(`${appointment.cargo}|${appointment.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR')}`));
});
const vacancies = vm.runInNewContext(`${readProjectFile('vagas-concurso.js')}\nvacancyData`);
assert.equal(vacancies.length, 10);
assert.deepEqual(vacancies.reduce((totals, vacancy) => ({
  total: totals.total + vacancy.vagas_quadro_total,
  ampla: totals.ampla + vacancy.vagas_quadro_ac,
  pcd: totals.pcd + vacancy.vagas_quadro_pcd,
  negro: totals.negro + vacancy.vagas_quadro_ppp
}), { total: 0, ampla: 0, pcd: 0, negro: 0 }), { total: 61, ampla: 43, pcd: 6, negro: 12 });
assert.deepEqual(vacancies.reduce((totals, vacancy) => ({
  total: totals.total + vacancy.edital_total_sem_cr,
  ampla: totals.ampla + vacancy.edital_vagas_ac,
  pcd: totals.pcd + vacancy.edital_vagas_pcd,
  negro: totals.negro + vacancy.edital_vagas_negros
}), { total: 0, ampla: 0, pcd: 0, negro: 0 }), { total: 59, ampla: 36, pcd: 10, negro: 13 });
console.log('Resultados do concurso verificados.');