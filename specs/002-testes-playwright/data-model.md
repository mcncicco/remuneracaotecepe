# Modelo: testes, preview e publicação

## Cenário de teste

- **Identificador**: nome que não contém dados pessoais.
- **Entrada**: parâmetros de simulação, dados fictícios ou resposta controlada.
- **Resultado esperado**: valores, elementos, estado de filtros ou mensagens.
- **Validação**: não depender de rede externa nem de CSV privado.

## Conjunto fictício de concurso

- **Cargos e fases**: compatíveis com as vagas que o controlador cruza na abertura.
- **Candidatos**: nomes e datas fictícios; incluir situações e resultados
  necessários aos filtros, paginação e reaplicação sem discursiva.
- **Nomeações**: fictícias e coerentes com os candidatos; não copiar registros reais.
- **Validação**: os scripts reais de dados de concurso não podem ser recebidos
  pelo navegador durante os testes; interceptar antes da navegação.

## Revisão candidata

- **SHA candidato**: revisão exata do pull request executada no CI.
- **CI**: aprovado ou falho; aprovação é requisito para integração.
- **Validação local**: confirmação de pessoa autorizada para o SHA atual, exigida
  quando os resultados mudam ou a classificação é desconhecida.
- **Produção**: diretório raiz do artefato Pages, construído da branch `main`.
- **Preview**: diretório `adocao-spec-kit/` no mesmo artefato, construído da
  branch `adocao-spec-kit`.
- **Artefato Pages**: composição da produção e do preview em caminhos separados;
  é publicada após CI aprovado em push para uma das duas branches.

## Estados do fluxo

`pull request` → `CI falhou` ou `CI aprovado` → `aguardando validação local`,
quando aplicável → `aprovado para merge` → `integrado` → CI → artefato Pages
composto → `publicado`.

Falha de CI, ausência da validação local exigida ou falha da validação do
preview impede a aprovação para merge. O Pages continua sendo o host, mas o
GitHub Actions constrói e publica o artefato combinado. A raiz é sempre
originada de `main`; o preview é originado de `adocao-spec-kit`.
