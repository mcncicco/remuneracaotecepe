# Simulador de remuneração

Site estático independente para comparar a remuneração estimada de Auditor de Controle Externo, Analista de Controle Externo e Analista de Gestão. Não há servidor, banco de dados ou coleta de informações.

## Executar

Abra `index.html` no navegador. As fontes tipográficas são carregadas do Google Fonts; o site também funciona sem elas.

Para instalar as ferramentas e executar os testes de interface, use Node.js LTS:

```powershell
npm ci
npx playwright install chromium
npm run test:e2e
```

O Playwright roda Chromium em desktop e em viewport móvel, com dados fictícios e
serviços externos interceptados. O servidor local de teste não serve os arquivos
reais de candidatos nem arquivos fora da lista pública do site.

Para executar os testes Node localmente, use `npm run test:node`. Ele inclui os
testes de cálculo, resultados, classificação de alterações e servidor de teste.
O teste que valida CSVs de origem continua sendo uma verificação local separada:
antes de publicar atualizações dos resultados, execute
`node --test js/resultados-concurso.test.js js/resultados-csv.test.js`. Esses CSVs
contêm dados pessoais, são ignorados pelo Git e precisam estar disponíveis
localmente; não os anexe nem compartilhe saídas brutas de falhas.

No GitHub Actions, `npm run test:ci` executa os testes Node com saída bruta
suprimida e a suíte Playwright. Pull requests executam testes, mas não publicam.
Em pushes para `main` ou `adocao-spec-kit`, depois dos testes, o workflow publica
um artefato combinado no GitHub Pages: `main` permanece na raiz e a branch
`adocao-spec-kit` fica em `/adocao-spec-kit/`. A página da raiz é construída
separadamente a partir de `main`.

Em pull requests, a esteira também informa se a alteração exige validação local
dos resultados. A classificação é conservadora e não imprime os caminhos
alterados; mudanças nos dados, geradores ou caminhos desconhecidos devem ser
validadas localmente e confirmadas por pessoa autorizada para o SHA revisado.
Essa indicação ainda depende da configuração de proteção da branch no GitHub
para bloquear merges sem a aprovação necessária.

O teste de CSV compara os dados JavaScript com os CSVs locais de resultados e
vagas e valida as situações de cota contra as listas de heteroidentificação e
perícia médica; ele falha se algum arquivo estiver faltando.

## Estrutura do projeto

- `index.html`, `README.md` e `.gitignore` ficam na raiz.
- `js/` contém os códigos JavaScript, dados do site, geradores e testes.
- `css/` contém as folhas de estilo.
- `ps1/` contém os scripts do PowerShell.
- `tests/` contém os testes de navegador e fixtures fictícias.
- `scripts/` contém utilitários seguros para CI e validação de staging.
- `package.json` e `package-lock.json` declaram as ferramentas de teste.
- `csv/` contém os CSVs de dados utilizados pelo projeto.
- `pdf/` contém os PDFs de origem locais; os PDFs e CSVs com dados pessoais são ignorados pelo Git e não são publicados.
- `.specify/` contém a configuração, os modelos e a constituição do Spec Kit.
- `.github/skills/` contém as instruções do Spec Kit para o GitHub Copilot.

## Desenvolvimento orientado por especificações

O projeto usa o [Spec Kit](https://github.com/github/spec-kit) com GitHub
Copilot. A constituição inicial em `.specify/memory/constitution.md` é uma
proposta para revisão e registra os cuidados com cálculos, dados e publicação.
A configuração não altera o funcionamento do site nem exige reorganizar seu código.

Para uma nova alteração, abra o projeto no VS Code e execute no chat do Copilot,
revisando cada etapa antes da seguinte:

1. `/speckit-specify` — descrever a mudança e seus critérios de aceitação.
2. `/speckit-clarify` — esclarecer dúvidas, quando necessário.
3. `/speckit-plan` e `/speckit-tasks` — planejar e dividir a implementação.
4. `/speckit-analyze` — conferir a consistência dos artefatos.
5. `/speckit-implement` e `/speckit-converge` — implementar e verificar.

Repita implementação e convergência se forem identificadas tarefas pendentes.
As especificações de funcionalidades são criadas em `specs/`; não é necessário
documentar retroativamente todo o sistema. Não inclua dados pessoais ou segredos
nesses arquivos: eles podem ser publicados junto com o repositório ou o site.
Após alterações, execute os testes aplicáveis descritos em **Executar** e revise
o diff antes de publicar.

O projeto foi inicializado com scripts Python para evitar depender da política de
execução de scripts PowerShell do Windows. O Spec Kit exige Python 3.11 ou superior
para sua CLI; os comandos gerados usam `python3` para executar seus scripts. Se as
skills não aparecerem no Copilot, reabra o projeto ou reinicie o VS Code.

## Dados e limitações

Os dados e as fórmulas reproduzem a planilha fornecida, “Simulador TCE PE R6 (1).xlsx”, incluindo os valores e tabelas da aba “Dados”. A planilha não contém referências legais ou links de origem. Confira a legislação e os valores vigentes antes de utilizar os resultados para decisões financeiras.

As fórmulas seguem a planilha mesmo onde há particularidades: no regime antigo o abate-teto é exibido, mas não integra o total dos descontos; a contribuição PREVCOM não reduz a base do IR nesse regime. O cálculo utiliza a alíquota fixa de IR e o valor de dedução informados na planilha, sem modelar dependentes ou outras deduções. O teto constitucional padrão está configurado em R$ 41.845,48 (90,25% do STF); os valores editáveis de referência não são atualizados automaticamente.

Os servidores por lotação são agregados a partir dos CSVs de consulta de vencimentos e indenizações fornecidos. O arquivo agregado contém lotação, cargo, classe/faixa e quantidades, sem nomes ou vencimentos individuais. Os totais contam registros dos CSVs e incluem códigos como APOS, DISP e EXON; não indicam necessariamente servidores em exercício ou cargos vagos. A competência dos dados não foi informada nos arquivos. O quantitativo de campo é estimado pela coincidência exata de R$ 2.415,02 em “Outras Indenizações”; essa rubrica não é discriminada e pode incluir outras verbas, e pagamentos somados não são identificados.

O arquivo `csv/legendas-lotacoes.csv` lista os códigos de lotação e as descrições completas. Quando preenchidas, as descrições aparecem como tooltip nas siglas e no ícone de informação das tabelas Servidores por lotação e Função por lotação. O gerador de estatísticas lê esse arquivo junto dos CSVs de origem.

O arquivo `csv/legendas-funcoes.csv` relaciona os códigos das funções compatíveis às suas descrições. Na tabela Função por lotação, a descrição aparece como tooltip e no ícone de informação ao lado do símbolo compatível.

Na aba Servidores por lotação, as opções Agrupar ocultam a dimensão selecionada e somam os registros pelas demais dimensões. Os filtros são aplicados antes do agrupamento, e os totais são recalculados conforme os registros exibidos.

A aba de Função por lotação compara exatamente os valores da rubrica do CSV com a tabela de funções fornecida e permite filtrar por cargo e classe/faixa. A tabela mostra lotação, cargo, classe/faixa, símbolo compatível e quantidade de registros; a descrição da função foi omitida para manter essas informações visíveis. A correspondência é apenas indicativa, não confirma a função exercida. O valor de R$ 3.119,86 é compartilhado por TC-FGS-1 e TC-FGA-3; valores sem correspondência exata são agrupados separadamente e valores zero não são exibidos. Os valores individuais não são incluídos nos dados agregados. A opção Agrupar oculta a dimensão selecionada e recalcula a tabela; Cargo e Classe/Faixa ignoram a seleção do respectivo filtro enquanto agrupados.

O arquivo `csv/vagas-concurso.csv` reúne, por cargo e especialidade, os quantitativos de cargos vagos exibidos no site e, em colunas separadas, as vagas originalmente ofertadas no quadro do item 3.1 do edital de abertura de 2025, conforme imagem fornecida. `edital_total_sem_cr` é a soma das vagas numéricas por modalidade; o edital também prevê cadastro de reserva em todas as especialidades, sem quantidade numérica definida.

Para atualizar os quantitativos com os CSVs UTF-8 locais, execute no PowerShell `./ps1/gerar-estatisticas.ps1 -CsvPath 'csv/vencimentos-servidores.csv' -IndenizacoesCsvPath 'csv/indenizacoes-servidores.csv'`. O script verifica a correspondência dos registros, lê as legendas de lotações e funções e recria `js/estatisticas-cargos.js`; confira os dados antes de publicá-los. Não inclua os CSVs originais no repositório, pois contêm informações individuais.

Os resultados finais do concurso vêm do PDF fornecido, com homologação parcial datada de 1º de setembro de 2026, abrangendo seis cargos e áreas. O site exibe e filtra a situação dos candidatos como Aprovado, Aprovado PCD, Aprovado PCD/Negro ou Aprovado Negro. Os filtros Aprovado PCD e Aprovado Negro também incluem candidatos Aprovado PCD/Negro. Para os outros quatro cargos, a soma da objetiva definitiva com a discursiva preliminar e a colocação são estimativas, não resultados oficiais; a situação exibida nesses casos vem da lista da objetiva definitiva. O desempate usa a data de nascimento, com o candidato mais velho à frente; com nota e nascimento iguais, a posição é compartilhada. A estimativa não considera outros critérios ou listas de cotas e pode mudar após recursos. Quem não consta na lista fornecida da discursiva permanece sem total ou colocação, o que não significa, por si só, reprovação. Os dados exibidos incluem nomes, datas de nascimento e notas, mas omitem inscrições e marcadores individuais de cotas; consulte os documentos originais para as listas completas.

Para regenerar os dados deste PDF específico, use Node.js e, no PowerShell, ajuste a sessão para UTF-8 com `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()` e `$OutputEncoding = [System.Text.UTF8Encoding]::new()`. Em seguida, execute `npx --yes pdf-parse@2.4.5 text 'pdf/tcepe-resultado-final-de-aprovados.pdf' --pages 3-14 --format json | node js/gerar-resultado-concurso.js`. O script valida as páginas e classificações antes de criar `js/resultado-concurso.js`; confira os dados contra o documento antes de publicá-los.

Para exportar o resultado completo em CSV local, acrescente `--csv` ao comando do extrator. A saída `csv/resultado-concurso-2025.csv` inclui inscrições, datas de nascimento e situações de cotas; não a publique sem avaliar esses dados pessoais. O extrator não sobrescreve um CSV existente.

Para extrair o resultado definitivo da objetiva da reaplicação, com o PowerShell configurado para UTF-8 como acima, execute `npx --yes pdf-parse@2.4.5 text 'pdf/tcepe-resultado-definitivo-objetiva-tce-reaplicacao-1.pdf' --pages 1-55 --format json | node js/gerar-objetiva-reaplicacao.js`. O CSV gerado em `csv/` contém dados pessoais, preserva a ordem e as abreviações do PDF e não é sobrescrito se já existir.

Para extrair o resultado preliminar da discursiva da reaplicação, execute `npx --yes pdf-parse@2.4.5 text 'pdf/tcepe_rea_discursiva_preliminar-reaplicacao--1.pdf' --pages 1-14 --format json | node js/gerar-discursiva-reaplicacao.js`. O CSV gerado em `csv/` contém dados pessoais, preserva a ordem do PDF e não é sobrescrito se já existir.

Para atualizar os dados da reaplicação no site a partir dos CSVs, execute `./ps1/gerar-dados-reaplicacao.ps1 -ObjetivaCsv 'csv/resultado-objetiva-reaplicacao-2025.csv' -DiscursivaCsv 'csv/resultado-discursiva-preliminar-reaplicacao-2025.csv' -HeteroidentificacaoCsv 'csv/resultado-preliminar-heteroidentificacao.csv' -PericiaCsv 'csv/resultado-preliminar-pericia-medica.csv'`. O script confere as inscrições, inclui as datas de nascimento para o desempate e acrescenta ao candidato a observação da cota em que não foi enquadrado; não inclui os números de inscrição no arquivo gerado em `js/resultado-reaplicacao.js`.

Para extrair os nomeados do diário oficial fornecido, com o PowerShell configurado para UTF-8 como acima, execute `npx --yes pdf-parse@2.4.5 text 'pdf/doe_nomeacao.pdf' --format json | node js/gerar-nomeacoes.js`. O script cruza os nomes com a lista de resultados do concurso, valida as portarias e gera `csv/nomeacoes-concurso.csv` e os dados JavaScript usados pelo site. Para reconstruir esses dados a partir dos CSVs existentes, execute `node js/gerar-nomeacoes.js --site-data-only`.

Na seção do concurso, nomeados são destacados em azul. Candidatos não nomeados com alguém da mesma cota nomeado em colocação posterior recebem destaque vermelho-claro como possível desistência inferida; isso não comprova desistência individual. Os demais destaques verdes são separados por modalidade e classificação: verde mais escuro para quem está dentro do quantitativo de vagas originalmente ofertadas no edital, e verde-claro para vagas do quadro atual que excedem o quantitativo do edital. O total atual limita os destaques; se houver menos vagas atuais que vagas ofertadas no edital, as vagas atuais ficam no grupo do edital. Aprovado concorre à ampla concorrência, Aprovado PCD ou PCD/Negro às vagas PCD, e Aprovado Negro ou PCD/Negro às vagas Negro/PPP. Um candidato PCD/Negro pode se enquadrar nas duas modalidades reservadas. Resultados da reaplicação que ainda dependem da nota discursiva usam colocação estimada e não são classificação oficial.

## Publicar no GitHub Pages

Ao alterar os arquivos JavaScript ou CSS, atualize também o valor de `v` nas respectivas referências em `index.html`, para que navegadores não reutilizem versões antigas em cache.

1. No repositório `mcncicco/remuneracaotecepe`, abra **Settings > Pages**.
2. Em **Build and deployment > Source**, selecione **GitHub Actions**.
3. O workflow executa os testes antes de publicar. Em pushes para `main`, a
   raiz continua sendo construída a partir de `main`; em pushes para
   `adocao-spec-kit`, o preview é atualizado em
   `https://mcncicco.github.io/remuneracaotecepe/adocao-spec-kit/`.
4. A URL existente `https://mcncicco.github.io/remuneracaotecepe/` continua
   sendo a versão da `main`. O artefato de Pages é compartilhado, mas os dois
   diretórios são construídos de fontes distintas.

Pull requests não publicam. Antes de integrar alterações à branch publicada,
a proteção da branch ainda deverá exigir pull request e checks aprovados, sem
permitir envios diretos ou bypass que contornem a esteira. O Pages permanece
como hospedagem, mas sua origem de publicação passa de branch para o workflow
do Actions para permitir a raiz da `main` e o preview em um subdiretório.
`scripts/verify-pages-staging.mjs` verifica os recursos e exclusões do preview
depois que ele estiver publicado.

## Usuários ativos em tempo real

O site pode exibir a quantidade de usuários ativos nos últimos 30 minutos usando a API de tempo real do GA4. O navegador consulta somente o endpoint público agregado; a chave da conta de serviço do Google deve ficar como secret do Cloudflare Worker e nunca ser incluída no repositório.

Para configurar:

1. No Google Cloud, habilite a **Google Analytics Data API** e crie uma conta de serviço com uma chave JSON. No GA4, adicione o e-mail da conta de serviço ao acesso da propriedade com a função **Leitor**. O ID numérico da propriedade mostrado durante a configuração é `564408155`; confirme em **Administrador → Detalhes da propriedade**.
2. No Cloudflare, crie um Worker e use `cloudflare/worker-metricas-tempo-real.js` como código. Configure as variáveis `GA4_PROPERTY_ID=564408155` e `ALLOWED_ORIGIN=https://mcncicco.github.io`. Adicione `GOOGLE_SERVICE_ACCOUNT_JSON` como **secret**, com o conteúdo integral do JSON da conta de serviço, e publique o Worker.
3. Configure `meta[name="analytics-realtime-endpoint"]` em `index.html` com a URL pública do Worker acrescida de `/api/realtime`. A URL configurada atualmente é `https://remuneracao-tcepe-realtime.marcelocicco.workers.dev/api/realtime`; ela é pública, não uma credencial.
4. Publique o site no GitHub Pages. O indicador consulta o Worker a cada 15 segundos; o Worker mantém a resposta em cache pelo mesmo período e solicita ao GA4 apenas as métricas agregadas `activeUsers` e `screenPageViews`, sem dimensões ou dados individuais.

O GA4 padrão apresenta usuários ativos e visualizações em uma janela móvel de até 30 minutos; a quantidade de visualizações conta páginas vistas repetidas vezes. Os valores não representam visitantes simultâneos no mesmo segundo. Se o endpoint falhar, o indicador informa indisponibilidade e o erro detalhado fica no log do Worker.