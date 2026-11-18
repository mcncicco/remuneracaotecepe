# Contrato: CI, preview e publicação

## Pull request

- Entrada: revisão proposta e SHA atual.
- Executar testes de interface com dados fictícios e os testes Node previstos.
- Informar sucesso apenas se todos os testes previstos passarem.
- Não usar segredos de produção nem publicar qualquer atualização do Pages.
- Para alterações nos resultados ou de classificação desconhecida, exigir
  confirmação autorizada de que a validação local passou para o SHA atual.
- Uma aprovação anterior não vale após novos commits na revisão.

## Preview da branch

- Entrada: push da branch `adocao-spec-kit` após CI aprovado.
- Construir o conteúdo da branch em
  `https://mcncicco.github.io/remuneracaotecepe/adocao-spec-kit/`.
- Não copiar arquivos privados, especificações, testes ou ferramentas locais
  para o artefato público.
- Verificar os recursos do site e a ausência das pastas e arquivos locais
  excluídos da publicação.
- Preview e produção compartilham um artefato Pages, mas ocupam diretórios
  diferentes; cada diretório deve ser construído de sua branch de origem.

## Produção na raiz do GitHub Pages

- A URL de produção `https://mcncicco.github.io/remuneracaotecepe/` deve conter
  o site construído a partir da branch `main`.
- Em pushes para `main` ou `adocao-spec-kit`, o workflow deve testar primeiro e
  só então construir e publicar o artefato Pages combinado.
- Pull requests não publicam. O Pages continua sendo o host, mas a origem passa
  de publicação por branch para GitHub Actions.
- A branch publicada exige pull request, checks obrigatórios aprovados e
  aprovação necessária para mudanças de resultados. Envios diretos e bypass
  das regras não podem contornar essas verificações.
- O build da raiz deve usar a revisão mais recente de `main`; o preview deve
  usar a revisão mais recente de `adocao-spec-kit`.
- Falha de CI impede a execução do job de publicação.

## Validação local de resultados

- A pessoa autorizada executa a validação local indicada no README para a
  revisão candidata com os CSVs de origem disponíveis.
- Somente após sucesso, confirma no pull request a revisão específica.
- Os CSVs e os dados pessoais não são enviados como prova.
- Mudanças posteriores invalidam a confirmação anterior.

## Exclusões e limites

- A configuração Jekyll deve excluir `specs/`, `.specify/` e
  `.github/skills/` do conteúdo servido pelo Pages, além dos dados locais
  privados.
- A validação local é uma confirmação humana, não uma execução dos CSVs na
  esteira. A esteira deve informar essa distinção.
- A proteção da branch depende das permissões e configurações do repositório;
  confirmar sua efetividade antes de integrar mudanças à `main`.
