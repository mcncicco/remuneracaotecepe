const positionsData = [
  { lotacao: 'Recife', cargo: 'Auditor', classe: 'A', quantidade: 2, campo: 1 },
  { lotacao: 'Recife', cargo: 'Analista', classe: 'B', quantidade: 3, campo: 0 },
  { lotacao: 'Olinda', cargo: 'Analista', classe: 'B', quantidade: 4, campo: 2 },
  ...Array.from({ length: 9 }, (_, index) => ({
    lotacao: `Lotação ${index + 1}`,
    cargo: 'Analista',
    classe: 'C',
    quantidade: index + 1,
    campo: 0
  }))
];

const functionData = [
  { lotacao: 'Recife', cargo: 'Auditor', classe: 'A', codigo: 'TC-FGS-1', quantidade: 2 },
  { lotacao: 'Recife', cargo: 'Analista', classe: 'B', codigo: 'TC-FGS-2', quantidade: 3 },
  { lotacao: 'Olinda', cargo: 'Analista', classe: 'B', codigo: 'TC-FGS-1', quantidade: 4 },
  { lotacao: 'Recife', cargo: 'Analista', classe: 'A', codigo: 'SEM_VALOR', quantidade: 7 }
];

const locationLabels = {
  Recife: 'Lotação fictícia do Recife',
  Olinda: 'Lotação fictícia de Olinda',
  ...Object.fromEntries(positionsData
    .filter(row => row.lotacao.startsWith('Lotação '))
    .map(row => [row.lotacao, `Descrição fictícia de ${row.lotacao}`]))
};

const functionLabels = {
  'TC-FGS-1': 'Função fictícia um',
  'TC-FGS-2': 'Função fictícia dois',
  NAO_IDENTIFICADA: 'Não identificada',
  SEM_VALOR: 'Sem valor'
};

const script = [
  `const positionsData = ${JSON.stringify(positionsData)};`,
  `const functionData = ${JSON.stringify(functionData)};`,
  `const locationLabels = ${JSON.stringify(locationLabels)};`,
  `const functionLabels = ${JSON.stringify(functionLabels)};`
].join('\n');

module.exports = { script };
