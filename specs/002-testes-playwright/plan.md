# Implementation Plan: Testes de interface e publicação por Pages

**Branch**: `adocao-spec-kit` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

## Summary

Adicionar testes Playwright para os fluxos definidos na especificação, mantendo
os testes Node existentes. Executá-los no GitHub Actions em pull requests e na
branch principal e na branch `adocao-spec-kit`. Manter o GitHub Pages como host,
mas publicar por um workflow que, após os testes, compõe a árvore de `main` na
raiz com a árvore de `adocao-spec-kit` em `/adocao-spec-kit/`. A página da
`main` permanece construída independentemente da branch de preview.

## Technical Context

**Language/Version**: JavaScript; Node.js LTS compatível com a versão escolhida do Playwright.

**Primary Dependencies**: `@playwright/test`, Chromium e GitHub Actions para CI
e publicação; adicionar manifesto e lockfile na implementação, sem instalar
dependências nesta fase. GitHub Pages permanece como host.

**Storage**: arquivos estáticos existentes, dados fictícios de teste e metadados
de execuções e revisões no GitHub; sem novo banco de dados.

**Testing**: `node --test` para cálculos e resultados existentes; Playwright
para interface em Chromium desktop e viewport 375 × 812; CSVs privados validados
localmente pelo teste existente.

**Target Platform**: Windows para desenvolvimento e runner Linux do GitHub
Actions; publicação estática no GitHub Pages a partir de artefato composto.

**Project Type**: site estático com scripts locais e serviço externo opcional
de métricas.

**Performance Goals**: sem meta de desempenho do site nesta entrega. Definir
timeout explícito para a suíte e para a esteira sem mascarar falhas.

**Constraints**: não expor dados pessoais ou credenciais em testes, logs e
evidências; não enviar CSVs privados; exigir verificações antes do merge para a
branch publicada; não incluir `specs/`, `.specify/` e `.github/skills/` no
conteúdo do Pages; construir a raiz a partir de `main` e o preview de
`adocao-spec-kit` em diretórios separados.

**Scale/Scope**: quatro fluxos de interface descritos na especificação, um
navegador e dois tamanhos de tela. Não cobre integração real de métricas,
auditoria completa de acessibilidade ou desempenho sob carga.

## Constitution Check

| Princípio | Verificação antes e depois do desenho |
|-----------|----------------------------------------|
| Preservação | Testar resultados atuais e preservar a aplicação; dados fictícios substituem apenas respostas no navegador de teste. |
| Arquitetura | O servidor de teste é temporário; o site continua estático no GitHub Pages. Actions testa e publica um artefato com `main` na raiz e `adocao-spec-kit` no subdiretório, sem mesclar suas árvores. |
| Privacidade | Interceptar dados reais antes do carregamento no navegador; controlar métricas, logs, relatórios e evidências; não enviar CSVs privados. |
| Verificação | Manter os dois testes existentes na esteira, implementar Playwright e manter o teste de CSV local. |
| Transparência | Preservar distinções entre classificação oficial, estimativas e falhas das métricas. |

**Resultado**: desenho compatível com a proposta de constituição. A constituição
ainda depende de aprovação. A integração à branch publicada fica condicionada à
configuração e validação efetiva das proteções no GitHub; adicionar o workflow
de CI, por si só, não configura essas regras.

## Project Structure

### Documentation (this feature)

```text
specs/002-testes-playwright/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── publicacao.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html, css/, js/    # aplicação e testes atuais, preservados
package.json             # a adicionar: dependência e comandos de teste
package-lock.json        # a adicionar para instalação reproduzível
playwright.config.js     # a adicionar: Chromium, viewports e servidor de teste
tests/                   # a adicionar: cenários de interface e dados fictícios
.github/workflows/       # CI e publicação Pages após testes aprovados
_config.yml              # a adicionar: excluir documentação e arquivos locais do Pages
README.md                # documentar comandos e configuração no GitHub
```

**Structure Decision**: manter os arquivos atuais; adicionar somente a
infraestrutura necessária para testes e entrega. A forma exata dos helpers será
definida na implementação, sem criar um servidor de produção.

## Design and verification

1. Criar dados fictícios coerentes com os cargos e vagas que o controlador
   espera. Antes de cada navegação, interceptar os scripts de resultados,
   reaplicação e nomeações, inclusive URLs com parâmetros de versão. Verificar
   que nenhuma resposta real desses scripts chega ao navegador.
2. Bloquear chamadas externas desnecessárias de analytics e fontes; responder
   às métricas com dados controlados ou falha. Cobrir os seis cenários de
   interface, estimativa sem discursiva, métricas e tela reduzida.
3. Executar os testes Node existentes separadamente. Como o teste de resultados
   usa dados reais e pode imprimi-los numa asserção, na esteira capturar ou
   suprimir sua saída de forma que nenhum dado real chegue a logs ou artefatos;
   informar nome do conjunto e resultado, sem ocultar a falha. Não exportar
   saída bruta como artefato. Garantir que o código de saída seja preservado.
4. Em pull requests, executar testes com permissões mínimas, sem segredos de
   produção nem job de publicação. Em pushes para `main` e `adocao-spec-kit`,
   executar os mesmos testes antes do build.
5. Construir a `main` e `adocao-spec-kit` em diretórios distintos e publicar
   um artefato Pages composto somente após os testes passarem. A raiz sempre
   vem da `main`; o preview sempre vem da branch `adocao-spec-kit`.
6. Configurar a branch de produção para exigir pull request e os checks do CI
   antes do merge; desabilitar envios diretos. O Pages publica o artefato
   composto após um push autorizado à `main` ou à branch de preview.
7. Classificar as alterações do pull request para identificar mudanças nos
   resultados. Para essas mudanças ou classificação desconhecida, exigir
   aprovação autorizada após validação local dos CSVs para o SHA atual; descartar
   aprovações obsoletas após novos commits.
8. Configurar `_config.yml` para excluir `specs/`, `.specify/`, `.github/skills/`
   e arquivos locais de cada árvore Jekyll. Verificar os caminhos de preview e
   produção no artefato antes do deploy.
9. Validar o conteúdo na URL
   `https://mcncicco.github.io/remuneracaotecepe/adocao-spec-kit/`, confirmando
   que os recursos do site estão presentes e os arquivos locais ausentes.
10. Fazer preflight das regras de branch, dos checks obrigatórios, da aprovação
   para mudanças de resultados, da configuração do Pages via Actions e da
   publicação das duas árvores. Se as proteções não puderem ser comprovadas, não
   integrar mudanças na branch de produção.

## Complexity Tracking

Uma mudança deliberada de origem de publicação do Pages para GitHub Actions foi
aprovada para suportar o preview em subdiretório. O host e a URL de produção
permanecem; o artefato garante que a raiz continue derivada de `main`.
