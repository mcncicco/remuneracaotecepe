# Guia de validação

Os testes locais e fixtures fictícias estão implementados. O workflow publica
no GitHub Pages somente depois de os testes passarem; pull requests não
publicam.

## Preparação local

1. Use Node.js 24 ou compatível com o `package.json`.
2. Instale as dependências e o Chromium:

   ```powershell
   npm ci
   npx playwright install chromium
   ```

3. Execute a validação completa:

   ```powershell
   npm run test:ci
   ```

   Para rodar somente uma suíte, use `npm run test:node` ou
   `npm run test:e2e`. Playwright roda Chromium desktop e viewport móvel; usa
   dados fictícios de resultados, vagas e estatísticas, e bloqueia serviços
   externos. Os CSVs locais de candidatos não são carregados pelo servidor de
   teste.

4. Antes de publicar mudanças em resultados, rode localmente, com os arquivos
   de origem disponíveis:

   ```powershell
   node --test js/resultados-concurso.test.js js/resultados-csv.test.js
   ```

   Não envie os CSVs nem compartilhe saídas brutas de falhas. O workflow de CI
   não executa nem declara aprovado esse teste local.

## CI e proteção da produção

O workflow `.github/workflows/ci.yml` roda em pull requests destinados a `main`
e em pushes para `main` ou `adocao-spec-kit`. Ele instala dependências e
Chromium, executa a suíte Node sem exibir sua saída bruta e executa Playwright.
Pull requests apenas testam. Em pushes, a publicação só ocorre depois que os
testes passam.

Em pull requests, a classificação de mudanças informa apenas se é necessária
validação local; caminhos alterados não são impressos. Mudanças em dados,
geradores e caminhos desconhecidos exigem a validação local de CSVs e a
confirmação de pessoa autorizada para o SHA atual.

Antes de integrar à branch publicada, o proprietário ainda precisa configurar
as regras do GitHub para exigir pull request, checks aprovados e aprovação
autorizada. Sem essas regras, o workflow por si só não impede envios diretos
nem bloqueia merges.

## GitHub Pages: produção e preview da branch

No repositório, configure **Settings > Pages > Build and deployment > Source**
como **GitHub Actions**. O workflow publica um artefato combinado: constrói o
conteúdo da `main` para a raiz e constrói `adocao-spec-kit` em
`/adocao-spec-kit/`. Cada diretório vem de sua própria branch; atualizar o
preview não substitui os arquivos da `main` na raiz.

```powershell
$env:PRODUCTION_URL = 'https://mcncicco.github.io/remuneracaotecepe/'
$env:STAGING_URL = 'https://mcncicco.github.io/remuneracaotecepe/adocao-spec-kit/'
node scripts/verify-pages-staging.mjs
```

O verificador envia requisições `HEAD` e confere os recursos públicos e os
caminhos que devem estar excluídos; não registra conteúdo de páginas. As URLs
representam caminhos diferentes do mesmo Pages.

Cada publicação recompõe o artefato a partir da `main` atual e da branch de
preview. A URL raiz permanece publicada a partir da `main`; o preview recebe
somente os arquivos públicos da branch. A proteção da branch de produção ainda
precisa ser configurada para exigir checks e aprovação antes de merges.
