# Feature Specification: Referência do comportamento existente

**Feature Branch**: `adocao-spec-kit`

**Created**: 2026-11-18

**Status**: Rascunho para revisão

**Input**: Levantar os comportamentos existentes a partir dos arquivos do projeto.

Esta é uma referência inicial para orientar futuras alterações, não uma solicitação
de reimplementar o site. Registra o comportamento identificado nas fontes abaixo;
não é uma validação jurídica nem uma garantia de atualização dos dados.

## Clarifications

### Session 2026-11-18

- Q: Como esta especificação deve ser mantida quando o site mudar? → A: Atualizá-la
  junto com cada mudança aprovada.

## User Scenarios & Testing

### User Story 1 - Comparar remunerações (Priority: P1)

Uma pessoa interessada nas carreiras compara as remunerações estimadas e ajusta o
cenário para entender seus componentes.

**Why this priority**: A simulação comparativa é a finalidade principal do site.

**Independent Test**: Abrir o simulador, comparar os três resultados iniciais,
alterar um parâmetro e restaurar os valores originais.

**Acceptance Scenarios**:

1. **Dado** o cenário inicial, **quando** a página é aberta, **então** são
   apresentados os líquidos estimados de R$ 23.612,91 para Auditor, R$ 20.939,73
   para Analista de Controle Externo e R$ 16.655,30 para Analista de Gestão.
2. **Dado** que a verba de campo foi ativada, **quando** os resultados são
   recalculados, **então** ela aparece para Auditor e Analista de Controle
   Externo, mas não para Analista de Gestão.
3. **Dado** um cenário modificado, **quando** a pessoa restaura os parâmetros,
   **então** os controles e os resultados retornam ao cenário inicial.

### User Story 2 - Consultar o concurso (Priority: P1)

Uma pessoa consulta resultados do concurso por cargo, situação ou nome e
distingue os resultados oficiais das estimativas da reaplicação.

**Why this priority**: A origem e o caráter provisório dos dados influenciam a
interpretação da classificação e das vagas.

**Independent Test**: Selecionar um cargo de cada fase, pesquisar e filtrar os
resultados e conferir as notas sobre a origem e os destaques.

**Acceptance Scenarios**:

1. **Dado** um cargo com resultado final disponível, **quando** a pessoa o
   seleciona, **então** vê classificação, notas, situação e identificação de
   homologação parcial, conforme os dados fornecidos.
2. **Dado** um cargo da reaplicação, **quando** a pessoa consulta a lista,
   **então** vê que a nota final e a colocação são estimativas e não uma
   classificação oficial.
3. **Dado** o filtro de aprovados PCD ou aprovados Negro, **quando** é aplicado,
   **então** a lista também inclui candidatos na situação Aprovado PCD/Negro.
4. **Dado** um resultado sem nota discursiva na reaplicação, **quando** é
   apresentado, **então** a nota final e a colocação permanecem sem valor.

### User Story 3 - Explorar estatísticas (Priority: P2)

Uma pessoa consulta vagas e dados agregados de servidores e funções para entender
o quadro de pessoal, sem confundir estimativas com confirmações individuais.

**Why this priority**: As estatísticas dão contexto à simulação e ao concurso.

**Independent Test**: Abrir cada uma das três abas de estatísticas, aplicar
filtros e agrupamentos e conferir os totais e as notas de origem.

**Acceptance Scenarios**:

1. **Dado** o quadro de vagas carregado, **quando** a pessoa consulta a tabela,
   **então** vê os quantitativos por cargo, especialidade e modalidade.
2. **Dado** um filtro na tabela de servidores por lotação, **quando** a pessoa
   agrupa uma dimensão, **então** a dimensão agrupada é ocultada e os totais
   refletem os registros filtrados.
3. **Dado** um valor de função sem correspondência exata, **quando** a tabela de
   funções é consultada, **então** o registro aparece como não identificado,
   sem afirmar qual função a pessoa exerce.

### User Story 4 - Interpretar métricas e limitações (Priority: P3)

Uma pessoa consulta as métricas agregadas e os avisos para compreender o alcance
e as limitações das informações apresentadas.

**Why this priority**: Os avisos evitam confundir simulações e indicadores com
dados oficiais ou contagens instantâneas.

**Independent Test**: Consultar a seção sobre os dados e verificar o indicador
quando a contagem estiver disponível e quando estiver indisponível.

**Acceptance Scenarios**:

1. **Dado** um retorno válido das métricas, **quando** o indicador é exibido,
   **então** informa usuários ativos e visualizações nos últimos 30 minutos.
2. **Dada** uma falha na consulta de métricas, **quando** o indicador é
   atualizado, **então** informa que a contagem está temporariamente indisponível.
3. **Dado** o simulador, **quando** a pessoa consulta suas limitações, **então**
   encontra o aviso de que os valores são informativos, podem estar desatualizados
   e não substituem a consulta às normas e à folha de pagamento.

### Edge Cases

- Um parâmetro numérico vazio ou inválido é calculado usando o valor padrão
  correspondente; restaurar parâmetros também repõe esses valores nos controles.
- Ao ativar o regime antigo, a opção PREVCOM é desativada; ao ativar PREVCOM,
  o regime antigo é desativado.
- Uma pesquisa ou combinação de filtros sem correspondência apresenta uma
  mensagem de ausência de resultados.
- Na reaplicação, notas finais e datas de nascimento iguais compartilham a
  colocação; a ausência da discursiva não significa, por si só, reprovação.
- A estimativa de campo depende de uma correspondência exata de valor e pode
  deixar de identificar pagamentos somados a outras indenizações.
- Uma correspondência de função pode ser ambígua: R$ 3.119,86 é compartilhado
  por TC-FGS-1 e TC-FGA-3; valores zero não aparecem na tabela de funções.

## Requirements

### Functional Requirements

- **FR-001**: O simulador DEVE comparar Auditor de Controle Externo, Analista
  de Controle Externo e Analista de Gestão no mesmo cenário.
- **FR-002**: O simulador DEVE permitir alterar tempo de carreira, qualificação,
  local, função, opções previdenciárias, campo, auxílio-saúde, inflação e os
  quatro valores de referência editáveis; mudanças DEVEM atualizar os resultados.
- **FR-003**: O simulador DEVE apresentar líquido estimado, base de remuneração
  e memória de cálculo com remuneração, descontos e rendimentos indenizatórios.
- **FR-004**: A simulação DEVE reproduzir as particularidades documentadas da
  planilha: no regime antigo, o abate-teto é exibido sem integrar o total de
  descontos, e PREVCOM não reduz a base do IR.
- **FR-005**: A área de concurso DEVE permitir selecionar cargo e fase, filtrar
  por situação e nome, ordenar resultados e navegar entre páginas de 10, 50 ou
  100 linhas.
- **FR-006**: A consulta por nome DEVE ignorar diferenças de acentuação e de
  maiúsculas e minúsculas.
- **FR-007**: A área de concurso DEVE identificar resultados finais com
  homologação parcial e distinguir a reaplicação como estimativa sujeita a
  alterações após recursos.
- **FR-008**: Na reaplicação, a nota final estimada DEVE ser a soma da objetiva
  definitiva com a discursiva preliminar; o desempate por idade favorece a pessoa
  mais velha e não substitui outros critérios oficiais não modelados.
- **FR-009**: Os destaques DEVEM distinguir nomeações, possíveis desistências
  inferidas e projeções de vagas do edital e do quadro atual. Uma inferência ou
  projeção NÃO DEVE ser apresentada como confirmação de desistência ou nomeação.
- **FR-010**: O quadro de vagas DEVE apresentar cargo, especialidade, total e
  modalidades ampla concorrência, PCD e PPP.
- **FR-011**: A tabela de servidores DEVE permitir filtrar e agrupar por lotação,
  cargo e classe/faixa; os filtros são aplicados antes do agrupamento e os totais
  são recalculados a partir dos registros selecionados.
- **FR-012**: A tabela de funções DEVE permitir filtrar e agrupar por lotação,
  cargo, classe/faixa e função compatível. Ao agrupar cargo ou classe/faixa,
  o respectivo filtro é ignorado, conforme o comportamento existente.
- **FR-013**: As estatísticas DEVEM identificar a contagem de campo e a
  correspondência de função como estimativas e informar suas limitações.
- **FR-014**: Quando configurado, o indicador DEVE apresentar usuários ativos e
  visualizações agregadas dos últimos 30 minutos e informar indisponibilidade
  quando a consulta falhar ou retornar dados inválidos.
- **FR-015**: A página DEVE identificar a simulação como independente,
  informativa e sem valor legal, e informar a origem e as limitações dos dados.
- **FR-016**: Dados pessoais de arquivos locais e credenciais NÃO DEVEM ser
  copiados para esta especificação; dados destinados à publicação DEVEM ser
  avaliados antes de sua divulgação.

### Key Entities

- **Cenário de remuneração**: conjunto de escolhas e valores de referência
  compartilhados pelas três carreiras.
- **Resultado de remuneração**: valores estimados de base, descontos,
  indenizações e líquido para uma carreira e um cenário.
- **Resultado de concurso**: registro associado a cargo e fase, com classificação,
  notas, situação e eventuais observações e destaques.
- **Vaga**: quantitativo associado a cargo, especialidade e modalidade, com
  distinção entre o edital e o quadro atual.
- **Registro agregado**: quantidade associada a dimensões de lotação, cargo,
  classe/faixa e, quando aplicável, função compatível.
- **Métrica agregada**: usuários ativos e visualizações em uma janela de 30 minutos.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Os três líquidos do cenário inicial coincidem, em centavos, com
  os valores do cenário 1 da história de comparação.
- **SC-002**: Nos três cenários de consulta do concurso com filtros PCD, Negro e
  sem discursiva, os resultados seguem as regras descritas nas histórias 2.3 e 2.4.
- **SC-003**: Nas três abas de estatísticas, é possível consultar os dados e
  suas limitações; nas duas abas com agrupamento, os totais correspondem aos
  registros considerados após filtros e regras de agrupamento aplicáveis.
- **SC-004**: Nos dois cenários de métricas, válido e indisponível, o indicador
  apresenta respectivamente os dois totais de 30 minutos ou a mensagem de falha.
- **SC-005**: Todas as funcionalidades descritas nas quatro histórias podem
  ser revisadas sem incluir nesta especificação nomes, datas de nascimento,
  inscrições ou outros dados pessoais de candidatos.

## Assumptions

- Esta referência cobre os fluxos identificados nas fontes consultadas, não
  garante o levantamento exaustivo de todos os detalhes da aplicação.
- Esta especificação deve acompanhar cada mudança aprovada que afete os
  comportamentos registrados, incluindo seus cenários, valores e fontes.
- Os valores e resultados refletem os disponíveis no projeto na última
  atualização da referência; não há garantia de que estejam atuais ou
  correspondam à legislação vigente.
- Os dados individuais já exibidos pelo site não foram reproduzidos aqui;
  esta especificação não autoriza ampliar sua divulgação.
- A disponibilidade do indicador depende de um serviço externo configurado.
- A constituição do projeto permanece proposta, pendente de aprovação.

### Fontes consultadas

- [Descrição, dados e limitações](../../README.md).
- [Página e textos exibidos](../../index.html).
- [Cálculos](../../js/calculadora-remuneracao.js) e
  [cenários de teste](../../js/calculadora-remuneracao.test.js).
- [Interações da página](../../js/controlador-site.js),
  [classificação do concurso](../../js/classificacao-concurso.js) e
  [testes do concurso](../../js/resultados-concurso.test.js).
- [Métricas agregadas](../../js/metricas-tempo-real.js).
