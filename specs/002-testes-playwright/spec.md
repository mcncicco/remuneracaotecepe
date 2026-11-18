# Feature Specification: Testes de interface e esteira

**Feature Branch**: `adocao-spec-kit`

**Created**: 2026-11-18

**Status**: Rascunho para revisão

**Input**: Criar especificações para testes com Playwright e execução na esteira
do GitHub, preservando o site e protegendo os dados pessoais.

Esta especificação define os resultados esperados dos testes e da publicação de
preview; a implementação local está concluída e a publicação remota está sendo
configurada.

## Clarifications

### Session 2026-11-18

- Q: Se os testes falharem, o site deve deixar de ser publicado automaticamente?
  → A: Não publicar até os testes passarem.
- Q: Quais navegadores a primeira versão dos testes deve cobrir? → A: Chromium
  em computador e tela de celular.
- Q: Como validar alterações nos resultados antes da publicação? → A: Exigir
  confirmação após a validação local, sem enviar os CSVs.
- Q: Os arquivos de especificação devem ficar acessíveis pelo endereço do site
  publicado? → A: Não publicar as especificações no site.
- Q: É necessário migrar a publicação do GitHub Pages para GitHub Actions?
  → A: Não. Manter a origem atual do Pages; Actions executa os testes, sem
  publicar a produção. **Decisão supersedida em 2026-11-18**: para publicar o
  preview de branch no subdiretório do mesmo Pages, o Actions passa também a
  montar e publicar o artefato; o Pages continua sendo o host.
- Q: Como publicar a branch sem substituir o que está na `main`?
  → A: Construir `main` na raiz e `adocao-spec-kit` em
  `/adocao-spec-kit/`, em árvores independentes dentro de um único artefato
  Pages. Pull requests não publicam; pushes publicam apenas após CI aprovado.

## User Scenarios & Testing

### User Story 1 - Detectar regressões da interface (Priority: P1)

Como responsável pelo site, quero verificar automaticamente os principais fluxos
no navegador para identificar mudanças que quebrem comportamentos existentes.

**Why this priority**: Cálculos, filtros e estatísticas são funcionalidades
essenciais para quem usa o site.

**Independent Test**: Executar os testes de interface contra uma cópia local
do site e conferir que cada fluxo abaixo é exercitado com resultados verificáveis.

**Acceptance Scenarios**:

1. **Dado** o cenário inicial do simulador, **quando** a página é carregada,
   **então** os três valores líquidos coincidem com os valores de referência da
   especificação de comportamento existente.
2. **Dado** um cenário de remuneração, **quando** um parâmetro é alterado e depois
   restaurado, **então** os resultados são atualizados e retornam aos valores
   iniciais; a memória de cálculo acompanha o cenário.
3. **Dada** uma lista fictícia de candidatos, **quando** se pesquisa por nome,
   filtra por situação ou navega entre páginas, **então** os resultados, o
   contador e a página exibida correspondem à seleção.
4. **Dada** uma lista fictícia com candidatos PCD, Negro e PCD/Negro, **quando**
   se seleciona o filtro PCD ou Negro, **então** também são exibidos os candidatos
   PCD/Negro; uma pesquisa sem correspondência exibe a mensagem de lista vazia.
5. **Dada** uma tabela de servidores por lotação, **quando** se aplica um filtro
   e se agrupa uma dimensão, **então** a dimensão agrupada fica oculta e os
   totais correspondem aos registros filtrados.
6. **Dada** uma tabela de funções, **quando** se filtra e agrupa cargo ou
   classe/faixa, **então** o respectivo filtro é ignorado conforme o comportamento
   existente e os totais refletem os registros considerados.

### User Story 2 - Receber resultado automático nas alterações (Priority: P1)

Como responsável pelo projeto, quero ver o resultado dos testes nas alterações
propostas para revisar falhas antes da integração.

**Why this priority**: A execução automática torna as verificações repetíveis
e visíveis durante a revisão.

**Independent Test**: Abrir uma alteração proposta com os testes configurados e
verificar o resultado; repetir com uma regressão intencional em cópia isolada.

**Acceptance Scenarios**:

1. **Dada** uma alteração proposta, **quando** a esteira é executada, **então**
   informa sucesso somente se os testes de interface e os testes existentes de
   cálculos e resultados previstos para a esteira forem aprovados.
2. **Dada** uma regressão intencional em um fluxo coberto, **quando** a esteira
   verifica essa alteração em ambiente isolado, **então** apresenta falha e
   identifica o teste afetado.
3. **Dada** uma execução local dos testes, **quando** o responsável os executa
   conforme a documentação, **então** consegue identificar aprovação ou falha
   sem publicar o site.
4. **Dada** uma alteração proposta com testes falhos, **quando** a revisão é
   avaliada, **então** a proteção da branch impede sua integração na branch que
   publica o Pages.
5. **Dada** uma alteração proposta com testes aprovados e, quando aplicável,
   confirmação da validação local, **quando** ela é aprovada e integrada,
   **então** o GitHub Pages publica a raiz a partir de `main`; pull requests
   não publicam.
6. **Dada** uma revisão com especificações do projeto, **quando** a versão
   aprovada é preparada para publicação, **então** os arquivos de especificação
   e da infraestrutura do Spec Kit não são incluídos no site publicado.
7. **Dada** uma revisão candidata à validação na internet, **quando** ela é
   enviada para a branch `adocao-spec-kit`, **então** fica disponível em
   `/adocao-spec-kit/`, sem substituir o conteúdo da `main` na raiz.

### User Story 3 - Proteger dados e reduzir dependências externas (Priority: P1)

Como responsável pelo projeto, quero testes reproduzíveis que não exponham dados
pessoais ou credenciais e não dependam da disponibilidade de serviços externos.

**Why this priority**: O projeto possui arquivos locais privados e apresenta
dados de candidatos; relatórios e evidências não devem ampliar sua divulgação.

**Independent Test**: Executar os cenários com dados fictícios e respostas
controladas, inspecionando os resultados e artefatos produzidos.

**Acceptance Scenarios**:

1. **Dado** um ambiente sem os CSVs locais privados, **quando** a esteira de
   interface é executada, **então** os testes de navegador usam dados fictícios
   e não dependem desses arquivos.
2. **Dadas** respostas controladas válidas e de falha para as métricas, **quando**
   o indicador é consultado, **então** os testes verificam respectivamente os
   totais dos últimos 30 minutos e a mensagem de indisponibilidade, sem consultar
   o serviço real.
3. **Dada** uma execução de testes, **quando** resultados e evidências são
   gerados, **então** não contêm dados pessoais reais nem credenciais.
4. **Dada** a indisponibilidade dos CSVs privados na esteira, **quando** seus
   resultados são revisados, **então** fica explícito que a validação de
   consistência com esses arquivos não foi executada ali.
5. **Dada** uma alteração que afeta os resultados do concurso, **quando** os
   testes da esteira passam, **então** a publicação aguarda confirmação de
   pessoa autorizada de que a validação local passou para a revisão a publicar.
6. **Dada** uma alteração que afeta os resultados do concurso, **quando** a
   confirmação estiver ausente ou for rejeitada, **então** o site publicado
   permanece na última versão publicada.

### User Story 4 - Verificar uso em tela reduzida (Priority: P2)

Como pessoa que acessa o site pelo celular, quero conseguir utilizar os fluxos
principais em uma tela reduzida.

**Why this priority**: A comparação e as tabelas precisam continuar acessíveis
em diferentes tamanhos de tela.

**Independent Test**: Executar os fluxos de simulação e consulta em uma janela
de celular e conferir os resultados e o acesso às tabelas.

**Acceptance Scenarios**:

1. **Dada** uma janela de 375 × 812 pixels, **quando** se altera um parâmetro,
   **então** os resultados atualizam e a pessoa consegue acessar a memória de cálculo.
2. **Dada** a mesma janela, **quando** se consulta uma tabela mais larga que a
   tela, **então** é possível acessar suas colunas por rolagem horizontal.

### Edge Cases

- Uma pesquisa sem correspondência apresenta mensagem de ausência de resultados.
- Um resultado da reaplicação sem nota discursiva não apresenta nota final nem
  colocação; a ausência não é tratada como reprovação.
- Uma resposta inválida ou falha do serviço de métricas resulta em indicação de
  indisponibilidade, sem impedir os demais testes.
- Falhas de instalação, inicialização do site ou execução dos testes resultam
  em falha explícita da etapa correspondente, não em sucesso ou publicação.
- Uma execução antiga não deve substituir uma versão mais recente da branch
  principal que já tenha sido publicada.
- Se faltarem CSVs privados, a validação que depende deles continua sendo
  obrigatória localmente antes de publicar resultados, conforme o README.
- Se não for possível determinar se a revisão afeta resultados do concurso,
  a publicação aguarda confirmação da validação local.
- A confirmação de uma revisão não autoriza publicar outra revisão.

## Requirements

### Functional Requirements

- **FR-001**: Os testes de interface DEVEM usar Playwright e exercitar o site
  sem alterar a página publicada.
- **FR-002**: Os testes DEVEM cobrir cenário inicial, mudança e restauração de
  parâmetros e memória de cálculo, com valores esperados verificáveis.
- **FR-003**: Os testes DEVEM cobrir pesquisa, filtros de situação, paginação,
  lista vazia e a regra de inclusão PCD/Negro na consulta de concurso.
- **FR-004**: Os testes DEVEM verificar o aviso de estimativa da reaplicação e
  a ausência de nota final e colocação quando não houver nota discursiva.
- **FR-005**: Os testes DEVEM verificar os filtros, agrupamentos e totais das
  tabelas de servidores e funções, incluindo a diferença de comportamento ao
  agrupar cargo ou classe/faixa.
- **FR-006**: Os testes DEVEM verificar o indicador de métricas em respostas
  válidas e em falha ou resposta inválida, sem depender do serviço real.
- **FR-007**: Os testes DEVEM usar Chromium para verificar os cenários de tela
  reduzida descritos na história 4 e os fluxos essenciais em tela de computador.
- **FR-008**: A esteira do GitHub DEVE executar os testes de interface e os
  testes existentes de cálculos e resultados em alterações propostas e em
  atualizações da branch principal, apresentando sucesso ou falha.
- **FR-009**: Os testes de interface e sua esteira NÃO DEVEM depender dos CSVs
  privados nem copiar dados pessoais reais ou credenciais para dados de teste,
  registros, relatórios ou evidências.
- **FR-010**: Todos os testes de interface DEVEM utilizar dados fictícios de
  concurso desde o carregamento da página, para evitar que relatórios ou
  capturas exponham dados reais já presentes nos arquivos do site.
- **FR-011**: A documentação DEVE explicar como executar os testes localmente,
  consultar o resultado na esteira e quais validações continuam locais por
  dependerem de CSVs privados.
- **FR-012**: A validação local de consistência dos CSVs existentes NÃO DEVE ser
  eliminada, substituída por dados fictícios ou declarada aprovada na esteira
  sem ter sido executada com seus arquivos de origem.
- **FR-013**: Dependências externas necessárias aos cenários testados DEVEM ser
  controladas, de modo que a indisponibilidade de métricas ou fontes externas
  não determine o resultado dos testes de funcionalidades independentes.
- **FR-014**: Falhas DEVEM identificar o cenário afetado; evidências de falha,
  se disponibilizadas, DEVEM respeitar as restrições de privacidade.
- **FR-015**: GitHub Actions DEVE executar os testes em pull requests e em pushes
  para `main` e `adocao-spec-kit`. Em pushes, a publicação Pages DEVE depender
  dos testes aprovados. O artefato DEVE conter a `main` na raiz e a branch
  `adocao-spec-kit` em `/adocao-spec-kit/`. Pull requests NÃO DEVEM publicar.
- **FR-016**: A branch de produção DEVE exigir pull request e verificações
  obrigatórias e NÃO DEVE permitir envios diretos que contornem os testes.
  Bypass das regras também DEVE ser desabilitado. Pull requests e testes de
  staging NÃO DEVEM alterar a publicação de produção.
- **FR-017**: A documentação DEVE explicar a proteção necessária da branch e
  distinguir testes e publicação. A origem do Pages DEVE usar GitHub Actions
  para permitir o artefato combinado; o Pages continua sendo o host.
- **FR-018**: Antes de publicar mudanças nos dados do concurso ou no
  processamento que determina os resultados exibidos, a revisão DEVE exigir
  aprovação autorizada após a confirmação de que a validação local dos CSVs de
  origem passou para a revisão candidata. A confirmação NÃO DEVE incluir os
  CSVs e deve deixar de valer se a revisão candidata mudar.
- **FR-019**: A avaliação de necessidade de confirmação DEVE considerar todas
  as alterações desde a última versão publicada. Quando não for possível
  determinar se elas afetam resultados do concurso, DEVE exigir confirmação.
  A confirmação é válida somente para a revisão validada.
- **FR-020**: A documentação DEVE explicar como executar a validação local e
  confirmar seu resultado antes da integração na branch de produção, sem enviar
  os arquivos de origem.
- **FR-021**: A publicação do site NÃO DEVE incluir os arquivos de `specs/`,
  `.specify/` ou `.github/skills/`. Como Pages continuará publicando da raiz da
  branch, a configuração Jekyll do site DEVE excluí-los do conteúdo publicado.
  Essa exclusão não torna privados arquivos eventualmente enviados a um
  repositório público.
- **FR-022**: A validação pública da branch DEVE usar o caminho
  `/adocao-spec-kit/` no mesmo Pages. A raiz e o conteúdo de produção DEVEM ser
  construídos da `main` e permanecer independentes do conteúdo de preview.

### Key Entities

- **Cenário de teste**: fluxo, dados de entrada e resultado esperado observável.
- **Dados fictícios**: registros criados para verificação sem identificar pessoas reais.
- **Execução de testes**: resultado local ou da esteira, com identificação de
  cenários aprovados e falhos.
- **Evidência de falha**: informação produzida para diagnóstico, sujeita às
  mesmas restrições de privacidade dos resultados.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Os seis cenários de aceitação da história 1 passam em uma execução
  sobre o comportamento existente, com dados de concurso fictícios.
- **SC-002**: Uma regressão intencional em um fluxo coberto produz pelo menos
  uma falha identificável; removida a regressão, a verificação volta a passar.
- **SC-003**: A esteira informa o resultado dos testes de interface e dos dois
  conjuntos existentes de cálculos e resultados em cada alteração proposta e
  atualização da branch principal.
- **SC-004**: Os dois cenários de métricas controladas e os dois cenários de
  tela reduzida passam sem depender do serviço de métricas real.
- **SC-005**: Nenhum arquivo privado de entrada, dado pessoal real ou credencial
  aparece nos dados de teste, registros, relatórios ou evidências inspecionados.
- **SC-006**: O resultado da esteira e a documentação distinguem explicitamente
  os testes executados da validação local de CSVs privados não executada nela.
- **SC-007**: Em duas alterações propostas, uma com testes falhos e outra com
  testes aprovados, a primeira não pode ser integrada à branch de produção; a
  segunda somente é publicada pelo Pages após aprovação e integração da mesma
  revisão verificada.
- **SC-008**: Para uma alteração controlada nos resultados com testes aprovados,
  a branch de produção permanece protegida sem confirmação autorizada de
  validação local; a aprovação não vale para commits posteriores.
- **SC-009**: O conteúdo preparado para publicação não contém arquivos das três
  pastas identificadas em FR-021 e mantém os arquivos necessários ao site.
- **SC-010**: A branch pode ser validada em
  `https://mcncicco.github.io/remuneracaotecepe/adocao-spec-kit/` enquanto a
  raiz continua sendo construída da `main`.

## Assumptions

- O escopo inicial é verificar fluxos essenciais, não automatizar todos os
  comportamentos nem certificar exatidão legal, acessibilidade integral ou
  desempenho sob carga.
- A primeira configuração usa Chromium em janelas de computador e celular;
  compatibilidade com outros navegadores pode ser especificada posteriormente.
- O GitHub Pages continua como host, com origem GitHub Actions. A branch de
  produção deve ser protegida para exigir verificações antes do merge.
- O artefato combinado tem uma publicação Pages, mas a raiz e o subdiretório
  são construídos de branches independentes; publicação de preview não altera
  arquivos da `main` na raiz.
- A consulta de métricas usa respostas controladas nos testes; a integração real
  com o serviço não é validada por essa suíte.
- A especificação do comportamento existente é a referência para os resultados
  funcionais e deve ser atualizada quando uma mudança de comportamento for aprovada.
- A constituição permanece proposta, pendente de aprovação.

### Referências

- [Comportamento existente](../001-comportamento-existente/spec.md).
- [Execução e cuidados com dados locais](../../README.md).
- [Constituição proposta](../../.specify/memory/constitution.md).
