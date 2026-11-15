const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { calculate } = require('./classificacao-concurso.js');

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

const data = vm.runInNewContext(`${fs.readFileSync('resultado-concurso.js', 'utf8')}\ncontestData`);
assert.deepEqual(Array.from(data, career => career.resultados.length), [135, 87, 73, 34, 155, 25]);
for (const career of data) {
  career.resultados.forEach((result, index) => {
    assert.equal(result.classificacao, index + 1);
    assert.ok(result.nome && Number.isFinite(result.objetiva) && Number.isFinite(result.discursiva) && Number.isFinite(result.final));
    assert.match(result.nascimento, /^\d{2}\/\d{2}\/\d{4}$/);
    assert.deepEqual(Object.keys(result).sort(), ['classificacao', 'discursiva', 'final', 'nascimento', 'nome', 'objetiva', 'titulos']);
    assert.equal(result.titulos === null, !career.cargo.startsWith('PROCURADOR'));
  });
}
assert.equal(data[0].resultados[0].nome, 'Washington Luis Galdina de Souza');
assert.equal(data[0].resultados[0].final, 80);
assert.equal(data[5].resultados[0].nome, 'Roberta Gouveia de Rezende Pereira');
assert.equal(data[5].resultados[0].titulos, 3);
assert.equal(data[5].resultados[0].final, 102.5);

const reapplication = vm.runInNewContext(`${fs.readFileSync('resultado-reaplicacao.js', 'utf8')}\ncontestReapplicationData`);
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
    assert.deepEqual(Object.keys(result).sort(), ['classificacao', 'discursiva', 'final', 'nascimento', 'nome', 'objetiva', 'titulos']);
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
assert.equal(expected.size, 0);
console.log('Resultados do concurso verificados.');