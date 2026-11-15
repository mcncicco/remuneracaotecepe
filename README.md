# Simulador de remuneração TCE-PE

Site estático independente para comparar a remuneração estimada de Auditor de Controle Externo, Analista de Controle Externo e Analista de Gestão. Não há servidor, banco de dados ou coleta de informações.

## Executar

Abra `index.html` no navegador. As fontes tipográficas são carregadas do Google Fonts; o site também funciona sem elas.

Para verificar os cálculos com Node.js instalado, execute `node calculator.test.js`.

## Dados e limitações

Os dados e as fórmulas reproduzem a planilha fornecida, “Simulador TCE PE R6 (1).xlsx”, incluindo os valores e tabelas da aba “Dados”. A planilha não contém referências legais ou links de origem. Confira a legislação e os valores vigentes antes de utilizar os resultados para decisões financeiras.

As fórmulas seguem a planilha mesmo onde há particularidades: no regime antigo o abate-teto é exibido, mas não integra o total dos descontos; a contribuição PREVCOM não reduz a base do IR nesse regime. O cálculo utiliza a alíquota fixa de IR e o valor de dedução informados na planilha, sem modelar dependentes ou outras deduções. Os valores editáveis de referência não são atualizados automaticamente.

Os servidores por lotação são agregados a partir dos CSVs de consulta de vencimentos e indenizações fornecidos. O arquivo agregado contém lotação, cargo, classe/faixa e quantidades, sem nomes ou vencimentos individuais. Os totais contam registros dos CSVs e incluem códigos como APOS, DISP e EXON; não indicam necessariamente servidores em exercício ou cargos vagos. A competência dos dados não foi informada nos arquivos. O quantitativo de campo é estimado pela coincidência exata de R$ 2.415,02 em “Outras Indenizações”; essa rubrica não é discriminada e pode incluir outras verbas, e pagamentos somados não são identificados.

A aba de Função por lotação compara exatamente os valores da rubrica do CSV com a tabela de funções fornecida e permite filtrar por cargo e classe/faixa. A correspondência é apenas indicativa, não confirma a função exercida. O valor de R$ 3.119,86 é compartilhado por TC-FGS-1 e TC-FGA-3; valores sem correspondência exata são agrupados separadamente e valores zero não são exibidos. Os valores individuais não são incluídos nos dados agregados.

Para atualizar os quantitativos com dois CSVs UTF-8 no mesmo formato, execute no PowerShell `./gerar-estatisticas.ps1 -CsvPath 'vencimentos.csv' -IndenizacoesCsvPath 'indenizacoes.csv'`. O script verifica a correspondência dos registros e recria `estatisticas-cargos.js`; confira os dados antes de publicá-los. Não inclua os CSVs originais no repositório, pois contêm informações individuais.

## Publicar no GitHub Pages

1. Envie os arquivos deste diretório para o repositório `mcncicco/remuneracaotecepe` no GitHub.
2. No repositório, abra **Settings > Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**, escolha a branch principal e a pasta `/ (root)` e salve.
4. Após a publicação, acesse `https://mcncicco.github.io/remuneracaotecepe/`.