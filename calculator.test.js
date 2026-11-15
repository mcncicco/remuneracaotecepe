const assert = require('node:assert/strict');
const { calculate, defaults } = require('./calculator.js');

const results = calculate(defaults);
assert.deepEqual(results.map(result => result.grade), ['ACE-3', 'ACE-1', 'AGE-1']);
assert.deepEqual(results.map(result => result.net.toFixed(2)), ['24494.76', '21818.49', '17534.05']);
const adjusted = calculate({ ...defaults, inflation: true });
adjusted.forEach((result, index) => {
	assert.equal(result.basePay, results[index].basePay * 1.05);
	assert.equal(result.incentive, results[index].incentive * 1.05);
	assert.equal(result.qualification, result.basePay * 0.03);
	assert.equal(result.pension, result.gross * 0.14);
	assert.equal(result.food, results[index].food);
});
assert.equal(adjusted[0].basePay.toFixed(2), '20576.64');
assert.equal(adjusted[0].incentive.toFixed(2), '10288.32');
assert.ok(adjusted[0].net > results[0].net);
const referenceOptions = { ...defaults, qualification: 0, oldRegime: false, health50: false };
const referenceScenarios = [
	[referenceOptions, ['25369.69', '22323.17', '17438.95']],
	[{ ...referenceOptions, prevcom: true, field: true }, ['26495.55', '23707.45', '16823.36']],
	[{ ...referenceOptions, oldRegime: true, field: true, health50: true }, ['26543.24', '23919.25', '17303.80']]
];
referenceScenarios.forEach(([options, expected]) => {
	assert.deepEqual(calculate(options).map(result => result.net.toFixed(2)), expected);
});
const fieldResults = calculate({ ...defaults, field: true });
assert.deepEqual(fieldResults.map(result => (result.field).toFixed(2)), ['2415.03', '2415.03', '0.00']);
const finalResults = calculate({ ...defaults, time: 7, oldRegime: false, prevcom: true });
assert.deepEqual(finalResults.map(result => result.grade), ['ACE-10', 'ACE-8', 'AGE-8']);
assert.ok(finalResults[0].ceilingReduction > 0);
const oldFinal = calculate({ ...defaults, time: 7, prevcom: true })[0];
assert.ok(oldFinal.ceilingReduction > 0);
assert.equal(oldFinal.deductions, oldFinal.pension + oldFinal.prevcom + oldFinal.tax);
assert.equal(oldFinal.tax, (oldFinal.gross - oldFinal.ceilingReduction - oldFinal.pension) * 0.275 - defaults.taxDeduction);
console.log('Cálculos do simulador verificados.');