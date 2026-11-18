# Pesquisa: testes e publicação

## Navegador e isolamento

**Decisão**: usar Playwright com Chromium para desktop e viewport de celular,
servido localmente durante os testes; interceptar dados de concurso e métricas
antes da navegação.

**Motivo**: a página carrega scripts de dados antes do controlador e exibe
informações de candidatos. A interceptação deve substituir as respostas,
inclusive URLs com versão, sem modificar os arquivos publicados.

**Alternativas**: testar o site público depende da rede e expõe os dados reais
às evidências; reescrever a aplicação só para testar aumenta o escopo.

**Fonte**: [Playwright: interceptação de rede](https://playwright.dev/docs/network)
e [servidor de teste](https://playwright.dev/docs/test-webserver).

## Relatórios e dados reais

**Decisão**: dados fictícios em toda página de teste; desativar por padrão
capturas, vídeos e traces que não tenham sido avaliados. Executar o teste Node
de resultados com saída bruta suprimida na esteira e registrar apenas conjunto
e status, preservando o código de saída. Exibir diagnóstico detalhado apenas
localmente, sem enviar informações individuais.

**Motivo**: os testes existentes verificam registros individuais e uma falha de
asserção pode imprimir nomes ou outros dados em logs. A máscara automática de
segredos não garante proteção de dados pessoais.

**Alternativa**: publicar relatórios completos sem revisão é incompatível com
o requisito de privacidade.

**Fonte**: [GitHub: uso seguro de Actions](https://docs.github.com/en/actions/reference/security/secure-use).

## CI, preview e produção

**Decisão**: o GitHub Pages continua como host, mas a origem de publicação será
GitHub Actions. Em push para `main` ou `adocao-spec-kit`, executar CI antes de
construir um artefato único com a `main` na raiz e o preview da branch em
`/adocao-spec-kit/`. Pull requests só testam e não publicam.

**Motivo**: a publicação legada por branch publica apenas uma árvore como raiz e
não cria automaticamente um diretório por branch. O artefato combinado mantém
as fontes independentes por caminho e evita que o conteúdo do preview substitua
o conteúdo da `main` na raiz.

**Alternativas**: publicar a branch na raiz substituiria a URL atual; manter
Pages em `Deploy from a branch` não fornece o subdiretório pretendido. Um host
separado não atenderia à URL pedida.

**Fontes**: [origens do Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site),
[workflows customizados do Pages](https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[ações oficiais de build e deploy](https://github.com/actions/jekyll-build-pages)
e [workflows do Actions](https://docs.github.com/en/actions).

## Exclusão de arquivos do site

**Decisão**: construir separadamente as árvores da `main` e da branch de preview,
usando Jekyll e o `_config.yml` da árvore correspondente; colocar a saída da
branch dentro do subdiretório de preview.

**Motivo**: sem um artefato customizado de deploy, a configuração do gerador do
Pages deve impedir que documentos do repositório apareçam no site. A exclusão
da publicação não torna os arquivos privados no repositório público.

**Validação**: verificar no artifact que a raiz corresponde à `main`, que o
preview contém os recursos necessários e que arquivos locais estão excluídos;
depois validar a URL de preview.

**Fontes**: [publicação por branch no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
e [opções de configuração Jekyll](https://jekyllrb.com/docs/configuration/options/).

## URL de preview

**Decisão**: usar o caminho de projeto do Pages em
`https://mcncicco.github.io/remuneracaotecepe/adocao-spec-kit/`, mantendo a
produção em `https://mcncicco.github.io/remuneracaotecepe/`.

**Motivo**: a pessoa responsável autorizou a mudança para um artefato composto
e identificou a branch de preview. Essa abordagem não exige outro domínio ou
repositório, mas compartilha a publicação do Pages e deve serializar os deploys.
