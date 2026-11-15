# Simulador de remuneração TCE-PE

Site estático independente para comparar a remuneração estimada de Auditor de Controle Externo, Analista de Controle Externo e Analista de Gestão. Não há servidor, banco de dados ou coleta de informações.

## Executar

Abra `index.html` no navegador. As fontes tipográficas são carregadas do Google Fonts; o site também funciona sem elas.

Para verificar os cálculos e os resultados com Node.js instalado, execute `node calculator.test.js` e `node concurso.test.js`.

## Dados e limitações

Os dados e as fórmulas reproduzem a planilha fornecida, “Simulador TCE PE R6 (1).xlsx”, incluindo os valores e tabelas da aba “Dados”. A planilha não contém referências legais ou links de origem. Confira a legislação e os valores vigentes antes de utilizar os resultados para decisões financeiras.

As fórmulas seguem a planilha mesmo onde há particularidades: no regime antigo o abate-teto é exibido, mas não integra o total dos descontos; a contribuição PREVCOM não reduz a base do IR nesse regime. O cálculo utiliza a alíquota fixa de IR e o valor de dedução informados na planilha, sem modelar dependentes ou outras deduções. Os valores editáveis de referência não são atualizados automaticamente.

Os servidores por lotação são agregados a partir dos CSVs de consulta de vencimentos e indenizações fornecidos. O arquivo agregado contém lotação, cargo, classe/faixa e quantidades, sem nomes ou vencimentos individuais. Os totais contam registros dos CSVs e incluem códigos como APOS, DISP e EXON; não indicam necessariamente servidores em exercício ou cargos vagos. A competência dos dados não foi informada nos arquivos. O quantitativo de campo é estimado pela coincidência exata de R$ 2.415,02 em “Outras Indenizações”; essa rubrica não é discriminada e pode incluir outras verbas, e pagamentos somados não são identificados.

A aba de Função por lotação compara exatamente os valores da rubrica do CSV com a tabela de funções fornecida e permite filtrar por cargo e classe/faixa. A correspondência é apenas indicativa, não confirma a função exercida. O valor de R$ 3.119,86 é compartilhado por TC-FGS-1 e TC-FGA-3; valores sem correspondência exata são agrupados separadamente e valores zero não são exibidos. Os valores individuais não são incluídos nos dados agregados.

Para atualizar os quantitativos com dois CSVs UTF-8 no mesmo formato, execute no PowerShell `./gerar-estatisticas.ps1 -CsvPath 'vencimentos.csv' -IndenizacoesCsvPath 'indenizacoes.csv'`. O script verifica a correspondência dos registros e recria `estatisticas-cargos.js`; confira os dados antes de publicá-los. Não inclua os CSVs originais no repositório, pois contêm informações individuais.

Os resultados finais do concurso vêm do PDF fornecido, com homologação parcial datada de 1º de setembro de 2026, abrangendo seis cargos e áreas. Para os outros quatro cargos, a soma da objetiva definitiva com a discursiva preliminar e a colocação são estimativas, não resultados oficiais. O desempate usa a data de nascimento, com o candidato mais velho à frente; com nota e nascimento iguais, a posição é compartilhada. A estimativa não considera outros critérios ou listas de cotas e pode mudar após recursos. Quem não consta na lista fornecida da discursiva permanece sem total ou colocação, o que não significa, por si só, reprovação. Os dados exibidos incluem nomes, datas de nascimento e notas, mas omitem inscrições e marcadores individuais de cotas; consulte os documentos originais para as listas completas.

Para regenerar os dados deste PDF específico, use Node.js e, no PowerShell, ajuste a sessão para UTF-8 com `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()` e `$OutputEncoding = [System.Text.UTF8Encoding]::new()`. Em seguida, execute `npx --yes pdf-parse@2.4.5 text 'tcepe-resultado-final-de-aprovados.pdf' --pages 3-14 --format json | node gerar-concurso.js`. O script valida as páginas e classificações antes de criar `resultado-concurso.js`; confira os dados contra o documento antes de publicá-los.

Para exportar o resultado completo em CSV local, acrescente `--csv` ao comando do extrator. A saída `resultado-concurso-2025.csv` inclui inscrições, datas de nascimento e situações de cotas; não a publique sem avaliar esses dados pessoais. O extrator não sobrescreve um CSV existente.

Para extrair o resultado definitivo da objetiva da reaplicação, com o PowerShell configurado para UTF-8 como acima, execute `npx --yes pdf-parse@2.4.5 text 'tcepe-resultado-definitivo-objetiva-tce-reaplicacao-1.pdf' --pages 1-55 --format json | node gerar-objetiva-reaplicacao.js`. O CSV gerado contém dados pessoais, preserva a ordem e as abreviações do PDF e não é sobrescrito se já existir.

Para extrair o resultado preliminar da discursiva da reaplicação, execute `npx --yes pdf-parse@2.4.5 text 'tcepe_rea_discursiva_preliminar-reaplicacao--1.pdf' --pages 1-14 --format json | node gerar-discursiva-reaplicacao.js`. O CSV gerado contém dados pessoais, preserva a ordem do PDF e não é sobrescrito se já existir.

Para atualizar os dados da reaplicação no site a partir dos CSVs, execute `./gerar-dados-reaplicacao.ps1 -ObjetivaCsv 'resultado-objetiva-reaplicacao-2025.csv' -DiscursivaCsv 'resultado-discursiva-preliminar-reaplicacao-2025.csv'`. O script confere as inscrições, inclui as datas de nascimento para o desempate e não inclui os números de inscrição no arquivo gerado.

## Publicar no GitHub Pages

Ao alterar os arquivos JavaScript ou CSS, atualize também o valor de `v` nas respectivas referências em `index.html`, para que navegadores não reutilizem versões antigas em cache.

1. Envie os arquivos deste diretório para o repositório `mcncicco/remuneracaotecepe` no GitHub.
2. No repositório, abra **Settings > Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**, escolha a branch principal e a pasta `/ (root)` e salve.
4. Após a publicação, acesse `https://mcncicco.github.io/remuneracaotecepe/`.