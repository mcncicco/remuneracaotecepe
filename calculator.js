const SalaryCalculator = (() => {
  const careers = [
    { name: 'Auditor de Controle Externo', short: 'Auditor', prefix: 'ACE', start: 3, salaries: [[19596.80, 9798.40], [21164.58, 10582.29], [22857.72, 11428.86], [24686.35, 12343.17], [26661.25, 13330.62], [28794.17, 14397.08], [31097.72, 15548.86], [33585.53, 16792.76]] },
    { name: 'Analista de Controle Externo', short: 'Analista', prefix: 'ACE', start: 1, salaries: [[16801.10, 8400.55], [18145.18, 9072.59], [19596.80, 9798.40], [21164.58, 10582.29], [22857.72, 11428.86], [24686.35, 12343.17], [26661.25, 13330.62], [28794.17, 14397.08]] },
    { name: 'Analista de Gestão', short: 'Gestão', prefix: 'AGE', start: 1, salaries: [[12309.87, 6154.93], [13417.75, 6708.87], [14625.37, 7312.68], [15941.65, 7970.82], [17376.39, 8688.19], [18940.28, 9470.14], [20644.90, 10322.45], [22502.94, 11251.47]] }
  ];
  const times = ['0 anos (início)', '3 anos', '4,5 anos', '6 anos', '7,5 anos', '9 anos', '10,5 anos', '12 anos ou mais'];
  const qualifications = [['Nenhuma', 0], ['Especialização', 0.03], ['Mestrado', 0.05], ['Doutorado', 0.07]];
  const functions = [['Nenhuma', 0], ['TC-FGG', 9104.48], ['TC-FGS-1', 3119.86], ['TC-FGS-2', 2227.12], ['TC-FAG-1', 1968.57], ['TC-FAG-2', 1554.14], ['TC-FAG-3', 1243.22], ['TC-FGA-1', 7997.56], ['TC-FGA-2', 6239.82], ['TC-FGA-3', 3119.86], ['TC-FGE-1', 18176.36], ['TC-FGE-2', 15449.95], ['TC-FGE-3', 14541.08], ['TC-FGE-4', 13632.23], ['TC-FGE-5', 13329.28]];
  const locations = [['Sede (Recife / Outros)', 0, 0], ['Insp. Bezerros e Surubim', 0.25, 5180.24], ['Insp. Arcoverde, Garanhuns e Palmares', 0.30, 6679.78], ['Insp. Petrolina', 0.35, 6952.43]];
  const defaults = { time: 0, qualification: 1, location: 0, position: 0, prevcom: false, oldRegime: true, field: false, health50: true, ceiling: 46366.19, rgps: 8475.55, taxDeduction: 908.73, fieldAmount: 2415.03 };

  function calculate(options) {
    return careers.map((career, index) => {
      const [basePay, incentive] = career.salaries[options.time];
      const qualification = basePay * qualifications[options.qualification][1];
      const position = functions[options.position][1];
      const gross = basePay + incentive + qualification + position;
      const ceilingReduction = Math.max(0, gross - options.ceiling);
      const prevcom = options.prevcom ? (gross - ceilingReduction - options.rgps) * 0.085 : 0;
      const pension = options.oldRegime ? gross * 0.14 : options.rgps * 0.14;
      const tax = (gross - ceilingReduction - pension - (options.oldRegime ? 0 : prevcom)) * 0.275 - options.taxDeduction;
      const deductions = pension + prevcom + tax + (options.oldRegime ? 0 : ceilingReduction);
      const healthNominal = Math.max((basePay + incentive) * 0.06, options.ceiling * 0.9025 * 0.042);
      const health = Math.max(healthNominal * (options.health50 ? 1.5 : 1), 1757.51);
      const food = 2246;
      const field = options.field && index !== 2 ? options.fieldAmount : 0;
      const location = Math.min(locations[options.location][2], locations[options.location][1] * basePay);
      const benefits = health + food + field + location;
      return { ...career, grade: `${career.prefix}-${career.start + options.time}`, basePay, incentive, qualification, position, gross, ceilingReduction, pension, prevcom, tax, deductions, health, food, field, location, benefits, net: gross + benefits - deductions };
    });
  }
  return { careers, times, qualifications, functions, locations, defaults, calculate };
})();

if (typeof module !== 'undefined') module.exports = SalaryCalculator;