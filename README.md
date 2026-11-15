# Simulador de remuneração TCE-PE

Site estático independente para comparar a remuneração estimada de Auditor de Controle Externo, Analista de Controle Externo e Analista de Gestão. Não há servidor, banco de dados ou coleta de informações.

## Executar

Abra `index.html` no navegador. As fontes tipográficas são carregadas do Google Fonts; o site também funciona sem elas.

Para verificar os cálculos com Node.js instalado, execute `node calculator.test.js`.

## Dados e limitações

Os dados e as fórmulas reproduzem a planilha fornecida, “Simulador TCE PE R6 (1).xlsx”, incluindo os valores e tabelas da aba “Dados”. A planilha não contém referências legais ou links de origem. Confira a legislação e os valores vigentes antes de utilizar os resultados para decisões financeiras.

As fórmulas seguem a planilha mesmo onde há particularidades: no regime antigo o abate-teto é exibido, mas não integra o total dos descontos; a contribuição PREVCOM não reduz a base do IR nesse regime. O cálculo utiliza a alíquota fixa de IR e o valor de dedução informados na planilha, sem modelar dependentes ou outras deduções. Os valores editáveis de referência não são atualizados automaticamente.

## Publicar no GitHub Pages

1. Envie os arquivos deste diretório para o repositório `mcncicco/remuneracaotecepe` no GitHub.
2. No repositório, abra **Settings > Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**, escolha a branch principal e a pasta `/ (root)` e salve.
4. Após a publicação, acesse `https://mcncicco.github.io/remuneracaotecepe/`.