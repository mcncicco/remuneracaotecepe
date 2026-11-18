const officialCareer = 'ANALISTA DE CONTROLE EXTERNO-CONTAS PÚBLICAS';
const reapplicationCareer = 'ANALISTA DE GESTÃO-ADMINISTRAÇÃO';

const officialResults = [
    { classificacao: 1, nome: 'Ana Ávila', nascimento: '01/01/1980', objetiva: 80, discursiva: 20, titulos: null, final: 100, situacao: 'Aprovado' },
    { classificacao: 2, nome: 'Ágata Sousa', nascimento: '02/02/1985', objetiva: 78, discursiva: 20, titulos: null, final: 98, situacao: 'Aprovado PCD' },
    { classificacao: 3, nome: 'Bruno Sá', nascimento: '03/03/1990', objetiva: 76, discursiva: 20, titulos: null, final: 96, situacao: 'Aprovado Negro' },
    { classificacao: 4, nome: 'Caio PCD Negro', nascimento: '04/04/1995', objetiva: 74, discursiva: 20, titulos: null, final: 94, situacao: 'Aprovado PCD/Negro' },
    { classificacao: 5, nome: 'Dora Reis', nascimento: '05/05/2000', objetiva: 72, discursiva: 20, titulos: null, final: 92, situacao: 'Aprovado' },
    { classificacao: 6, nome: 'Érica Lima', nascimento: '06/06/2001', objetiva: 70, discursiva: 20, titulos: null, final: 90, situacao: 'Aprovado' },
    { classificacao: 7, nome: 'Fábio Nunes', nascimento: '07/07/2001', objetiva: 69, discursiva: 20, titulos: null, final: 89, situacao: 'Aprovado' },
    { classificacao: 8, nome: 'Gabi Melo', nascimento: '08/08/2001', objetiva: 68, discursiva: 20, titulos: null, final: 88, situacao: 'Aprovado' },
    { classificacao: 9, nome: 'Heitor Cruz', nascimento: '09/09/2001', objetiva: 67, discursiva: 20, titulos: null, final: 87, situacao: 'Aprovado' },
    { classificacao: 10, nome: 'Iara Freitas', nascimento: '10/10/2001', objetiva: 66, discursiva: 20, titulos: null, final: 86, situacao: 'Aprovado' },
    { classificacao: 11, nome: 'João Dias', nascimento: '11/11/2001', objetiva: 65, discursiva: 20, titulos: null, final: 85, situacao: 'Aprovado' },
    { classificacao: 12, nome: 'Kátia Luz', nascimento: '12/12/2001', objetiva: 64, discursiva: 20, titulos: null, final: 84, situacao: 'Aprovado' }
];

const careerNames = [
  officialCareer,
  'ANALISTA DE CONTROLE EXTERNO-OBRAS PÚBLICAS',
  'ANALISTA DE CONTROLE EXTERNO-TECNOLOGIA DA INFORMAÇÃO',
  reapplicationCareer,
  'ANALISTA DE GESTÃO-JULGAMENTO',
  'AUDITOR DE CONTROLE EXTERNO-CONTAS PÚBLICAS',
  'AUDITOR DE CONTROLE EXTERNO-CONTAS PÚBLICAS DE SAÚDE',
  'AUDITOR DE CONTROLE EXTERNO-OBRAS PÚBLICAS',
  'AUDITOR DE CONTROLE EXTERNO-TECNOLOGIA DA INFORMAÇÃO',
  'PROCURADOR DO TRIBUNAL DE CONTAS'
];

const contestData = careerNames
  .filter(cargo => cargo !== reapplicationCareer)
  .map(cargo => ({
    cargo,
    fase: 'concurso',
    resultados: cargo === officialCareer ? officialResults : []
  }));

const contestReapplicationData = [{
  cargo: reapplicationCareer,
  fase: 'reaplicacao',
  resultados: [
    { classificacao: null, nome: 'Zélia sem discursiva', nascimento: '07/07/1990', objetiva: 70, discursiva: null, titulos: null, final: null, situacao: 'Aprovado', observacoes: [] },
    { classificacao: null, nome: 'Ícaro com discursiva', nascimento: '08/08/1992', objetiva: 68, discursiva: 19, titulos: null, final: null, situacao: 'Aprovado PCD', observacoes: [] },
    { classificacao: null, nome: 'Lara com empate', nascimento: '08/08/1992', objetiva: 68, discursiva: 19, titulos: null, final: null, situacao: 'Aprovado', observacoes: [] }
  ]
}];

const vacancyCareers = [
  ['Auditor de Controle Externo', 'Contas Públicas'],
  ['Auditor de Controle Externo', 'Contas Públicas de Saúde'],
  ['Auditor de Controle Externo', 'Obras Públicas'],
  ['Auditor de Controle Externo', 'Tecnologia da Informação'],
  ['Analista de Controle Externo', 'Contas Públicas'],
  ['Analista de Controle Externo', 'Obras Públicas'],
  ['Analista de Controle Externo', 'Tecnologia da Informação'],
  ['Analista de Gestão', 'Julgamento'],
  ['Analista de Gestão', 'Administração'],
  ['Procurador do Tribunal de Contas', '—']
];

const fakeVacancies = vacancyCareers.map(([cargo, especialidade]) => ({
  cargo,
  especialidade,
  vagas_quadro_total: 0,
  vagas_quadro_ac: 0,
  vagas_quadro_pcd: 0,
  vagas_quadro_ppp: 0,
  edital_vagas_ac: 0,
  edital_vagas_pcd: 0,
  edital_vagas_negros: 0
}));

Object.assign(
  fakeVacancies.find(vacancy => vacancy.cargo === 'Analista de Controle Externo' && vacancy.especialidade === 'Contas Públicas'),
  {
    vagas_quadro_total: 4,
    vagas_quadro_ac: 2,
    vagas_quadro_pcd: 1,
    vagas_quadro_ppp: 1,
    edital_vagas_ac: 2,
    edital_vagas_pcd: 1,
    edital_vagas_negros: 1
  }
);

const appointedCandidates = [{
  fase: 'concurso',
  cargo: officialCareer,
  nome: 'Ana Ávila',
  portaria: 'Portaria fictícia'
}];

const scripts = {
  'resultado-concurso.js': `const contestData = ${JSON.stringify(contestData)};`,
  'resultado-reaplicacao.js': `const contestReapplicationData = ${JSON.stringify(contestReapplicationData)};`,
  'nomeacoes-concurso.js': `const appointedCandidates = ${JSON.stringify(appointedCandidates)};`,
  'vagas-concurso.js': `const vacancyData = ${JSON.stringify(fakeVacancies)};`
};

module.exports = { officialCareer, reapplicationCareer, scripts };
