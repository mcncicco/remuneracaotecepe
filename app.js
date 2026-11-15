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