# Tasks: Testes de interface e publicação por Pages

**Input**: Artefatos de design em `specs/002-testes-playwright/`

**Pré-requisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/publicacao.md` e `quickstart.md`.

**Testes**: Obrigatórios conforme a especificação. Cada grupo inclui critérios
para demonstrar seu comportamento antes de integrar a publicação.

## Fase 1: Setup

**Objetivo**: preparar dependências e execução local, sem alterar a página publicada.

- [x] T001 Criar `package.json` com comandos separados para os testes Playwright e os testes Node existentes; instalar `@playwright/test` como dependência de desenvolvimento e gerar `package-lock.json`.
- [x] T002 Criar `tests/server.mjs`, servidor estático local para os testes que serve apenas os arquivos do site e rejeita caminhos fora da raiz do projeto.
- [x] T003 Criar `playwright.config.js` para Chromium, servidor local, execução reproduzível no CI e testes Playwright em `tests/`.

## Fase 2: Fundação de teste e privacidade

**Objetivo**: garantir que nenhum teste de interface carregue dados reais de candidatos.

- [x] T004 [P] Criar `tests/fixtures/concurso.js` com dados fictícios mínimos para resultado oficial, reaplicação, empate, candidato sem discursiva, filtros de cotas, nomeação e projeção de vagas.
- [x] T005 Criar `tests/fixtures/estatisticas.js` com dados agregados fictícios para filtros, agrupamentos, paginação e totais das tabelas de lotação e funções.
- [x] T006 Criar `tests/helpers/fixtures.js` para interceptar antes da navegação os scripts JavaScript de resultado, reaplicação, nomeações, vagas e estatísticas, incluindo URLs com parâmetros de versão; verificar que os dados usados são os fictícios.
- [x] T007 Criar `tests/helpers/network.js` para responder às métricas com dados controlados ou falha e impedir chamadas de teste a métricas, analytics, fontes ou outros serviços reais.
- [x] T008 Configurar `playwright.config.js` e `tests/` para não guardar traces, vídeos, capturas ou relatórios que exponham dados; documentar evidências seguras de falha.
- [x] T009 Criar `scripts/run-node-tests-safe.mjs` para executar os testes Node da esteira sem emitir a saída bruta que pode conter dados pessoais, informando os conjuntos e seus estados e preservando o código de saída.

**Checkpoint**: a navegação de teste recebe apenas dados fictícios; falha na instalação ou no servidor encerra a execução com erro explícito.

## Fase 3: User Story 1 - Detectar regressões da interface (P1)

**Objetivo**: testar os principais fluxos do simulador e das consultas com resultados observáveis.

**Teste independente**: executar Playwright localmente e verificar cálculos, filtros, agrupamentos, notas de estimativa e resultados vazios apenas com fixtures fictícias.

- [x] T010 [P] [US1] Criar `tests/simulador.spec.js` para verificar os três valores iniciais, alteração de um parâmetro, memória de cálculo e restauração do cenário.
- [x] T011 [P] [US1] Criar `tests/concurso.spec.js` para verificar busca sem diferenciar acentos ou caixa, filtro PCD/Negro que inclui PCD/Negro, ordenação, paginação, lista vazia e as fixtures da reaplicação sem nota discursiva.
- [x] T012 [P] [US1] Criar `tests/estatisticas.spec.js` para verificar filtros antes do agrupamento, dimensões ocultas, totais, funções compatíveis e mensagem quando não há registros.
- [x] T013 [US1] Validar `tests/` contra os seis cenários de aceitação da User Story 1 em Chromium desktop; ajustar as fixtures sem carregar dados reais.

**Checkpoint**: os fluxos de simulação, concurso e estatísticas passam localmente com dados de teste.

## Fase 4: User Story 2 - Receber resultado automático nas alterações (P1)

**Objetivo**: executar verificações nas alterações; publicar o artefato Pages
composto apenas depois dos testes em pushes autorizados.

**Teste independente**: uma alteração aprovada pelos testes retorna sucesso; uma regressão retorna falha identificável e não aciona publicação.

- [x] T014 [P] [US2] Criar `.github/workflows/ci.yml` para executar em pull requests e pushes para `main` e `adocao-spec-kit`, com permissões mínimas, sem secrets de produção e publicação somente após CI aprovado em push.
- [x] T015 [US2] Configurar `.github/workflows/ci.yml` para instalar dependências pelo lockfile, instalar Chromium e executar os testes Playwright com tempo limite explícito.
- [x] T016 [US2] Configurar `.github/workflows/ci.yml` para executar `js/calculadora-remuneracao.test.js` e `js/resultados-concurso.test.js` por `scripts/run-node-tests-safe.mjs`, sem executar nem declarar aprovado o teste local que depende dos CSVs.
- [x] T017 [P] [US2] Criar `tests/run-node-tests-safe.test.mjs` para confirmar que a saída bruta de falha de um teste não é exposta pelo runner.
- [x] T018 [US2] Configurar `.github/workflows/ci.yml` para não enviar saída bruta, dados de candidatos ou evidências de navegador como artefatos; preservar o estado de falha dos testes.
- [ ] T019 [US2] Validar `.github/workflows/ci.yml` em branch de teste com uma execução bem-sucedida e uma regressão intencional; comprovar que pull requests não publicam o site.

**Checkpoint**: pull requests mostram os resultados dos testes e não publicam;
pushes às branches aprovadas só publicam após CI passar.

## Fase 5: User Story 3 - Proteger dados e integração à produção (P1)

**Objetivo**: manter Pages como host, construir `main` na raiz e `adocao-spec-kit`
no respectivo subdiretório, bloquear publicação sem CI aprovado e exigir
validação local autorizada para mudanças nos resultados.

**Teste independente**: falhas de CI bloqueiam o deploy; a URL da branch
permite validar a revisão enquanto o site da `main` permanece na raiz.

- [x] T020 [P] [US3] Criar `scripts/classify-results-changes.mjs` para identificar, de forma conservadora, alterações nos dados, geradores e processamento de resultados entre a base atual da branch de produção e o SHA do pull request; erro ou caminho desconhecido exige validação local.
- [x] T021 [P] [US3] Criar `tests/results-change-classifier.test.mjs` para cobrir alterações sem impacto comprovado, alterações de resultados, caminho desconhecido e falhas na leitura do diff.
- [x] T022 [US3] Criar `_config.yml` para excluir `specs/`, `.specify/`, `.github/skills/`, testes, CSVs, PDFs e demais arquivos locais do site Jekyll publicado pelo Pages, preservando todos os arquivos públicos referenciados por `index.html`.
- [x] T023 [US3] Criar `scripts/verify-pages-staging.mjs` para verificar, sem registrar conteúdo da página, que a URL de preview serve os recursos necessários e não serve as pastas e arquivos locais excluídos.
- [ ] T024 [US3] Configurar a proteção da branch de produção no GitHub para exigir pull request, ao menos uma aprovação autorizada e os checks do CI antes do merge; descartar aprovações obsoletas e desabilitar envios diretos e bypass das regras.
- [x] T025 [US3] Documentar a confirmação de validação local no pull request e exigir aprovação autorizada para mudanças de resultados ou de classificação desconhecida; descartar aprovações obsoletas após novos commits e nunca solicitar CSVs como prova.
- [x] T026 [US3] Configurar Pages via GitHub Actions e publicar o conteúdo da branch `adocao-spec-kit` em `/adocao-spec-kit/`, mantendo a raiz construída da `main`.
- [x] T027 [US3] Validar a URL de preview da branch, incluindo recursos necessários, exclusões do `_config.yml` e preservação da página da `main` na raiz.
- [x] T028 [US3] Atualizar `README.md` e `specs/002-testes-playwright/quickstart.md` para documentar Pages via Actions, raiz construída da `main`, preview em `/adocao-spec-kit/`, proteção da branch e validação local.
- [ ] T029 [US3] Validar em ambiente de teste que uma falha de CI bloqueia o merge, que mudanças em resultados exigem validação local e aprovação autorizada para o SHA atual, e que a publicação de preview mantém o conteúdo da `main` na raiz.
- [ ] T030 [US3] Confirmar no GitHub a origem Actions do Pages, as regras efetivas da branch e a publicação das duas árvores; manter a produção inalterada se testes ou proteções não puderem ser comprovados.

**Checkpoint**: o Pages publica `main` na raiz e o preview em seu subdiretório; apenas revisões verificadas podem chegar à branch publicada; mudanças de resultados exigem validação local e aprovação, sem envio dos CSVs.

## Fase 6: User Story 4 - Verificar uso em tela reduzida (P2)

**Objetivo**: conferir o uso dos fluxos essenciais em computador e em viewport de celular.

**Teste independente**: executar os cenários em Chromium desktop e em 375 × 812; confirmar acesso aos resultados e rolagem das tabelas.

- [x] T031 [P] [US4] Criar `tests/responsivo.spec.js` para verificar atualização da simulação, acesso à memória de cálculo e rolagem horizontal das tabelas em viewport de 375 × 812.
- [x] T032 [US4] Configurar `playwright.config.js` para executar os fluxos responsivos e essenciais em Chromium desktop e os cenários móveis em viewport de 375 × 812.
- [ ] T033 [US4] Validar os cenários de `tests/responsivo.spec.js` localmente e no CI sem alterar o layout publicado; registrar falhas por cenário sem anexar capturas contendo dados reais.

## Fase 7: Polish e verificação transversal

**Objetivo**: documentar os comandos e verificar a compatibilidade das novas ferramentas com o site estático.

- [x] T034 [P] Atualizar `README.md` com comandos locais, pré-requisitos, testes executados no GitHub e testes de CSV que continuam exigindo validação local.
- [x] T035 Executar a parte local do guia `specs/002-testes-playwright/quickstart.md` e registrar as verificações remotas ainda dependentes da configuração do proprietário do repositório.
- [x] T036 Revisar `.github/workflows/ci.yml`, `_config.yml` e `scripts/` para confirmar permissões mínimas, ausência de secrets desnecessários, exclusão de dados pessoais e composição da raiz e do preview.

## Dependências e ordem de execução

### Dependências entre fases

- **Setup**: sem dependências.
- **Fundação**: depende de Setup; bloqueia os testes de interface.
- **US1**: depende da Fundação.
- **US2**: depende de Setup e da Fundação; PRs não publicam, pushes publicam após testes.
- **US3**: depende de US2; configura as proteções da branch, as exclusões Jekyll e a publicação composta do Pages via Actions.
- **US4**: depende da Fundação; pode ocorrer em paralelo com US2, desde que os arquivos sejam distintos.
- **Polish**: depende das histórias e da configuração do repositório necessárias à validação.

### Dependências entre histórias

- **US1**: independente após a Fundação.
- **US2**: independente da US1 para o fluxo de CI; depende da Fundação.
- **US3**: depende da verificação de CI da US2; publicar o preview somente após os testes e não integrar na `main` antes de validar as proteções.
- **US4**: depende da Fundação e é independente de US1–US3.

### Oportunidades de paralelismo

- T004 e T021 podem ser desenvolvidas em paralelo depois do Setup; usam arquivos distintos.
- T010, T011 e T012 podem ser desenvolvidas em paralelo após fixtures e helpers da Fundação.
- T014 pode ser criada em paralelo com T017; T015, T016 e T018 integram-se ao workflow existente e dependem de T014.
- T031 pode ser desenvolvida em paralelo com US2 após a Fundação.
- Não paralelizar tarefas que editam o mesmo workflow ou os mesmos scripts de publicação.

## Estratégia de implementação

1. Entregar primeiro Setup e Fundação, certificando que a suíte de navegador usa
   dados fictícios e que falhas não vazam dados pessoais.
2. Entregar US1 e validar os comportamentos existentes de forma isolada.
3. Entregar US2 e demonstrar CI em sucesso e falha; manter publicação desligada.
4. Entregar US3, configurar Pages via Actions e validar o artefato composto.
   Manter a raiz derivada da `main` e publicar a branch de preview em seu
   subdiretório; proteger a branch de produção antes de merges.
5. Entregar US4 e, por fim, executar o quickstart e a revisão transversal.

**MVP sugerido**: Setup, Fundação e US1 para obter testes de interface locais
úteis. CI e preview são publicados após testes aprovados. A proteção da branch
continua sendo uma configuração separada e deve ser validada antes de merges
na `main`.
