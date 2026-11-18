# Constituição do Simulador de Remuneração TCE-PE

## Princípios fundamentais

### I. Preservação do comportamento

Alterações DEVEM preservar os cálculos, dados, filtros e a apresentação existentes,
exceto quando a mudança for explicitamente especificada. Particularidades e
limitações documentadas no README DEVEM ser consideradas no planejamento.

### II. Arquitetura simples

O site DEVE continuar utilizável como aplicação estática, sem servidor ou banco de
dados próprios. Uma mudança nessa arquitetura exige justificativa e aprovação
explícita. Os diretórios e padrões existentes DEVEM ser reutilizados sempre que
possível, sem reorganização apenas para atender ao Spec Kit.

### III. Dados e privacidade

Arquivos locais com dados pessoais e credenciais NÃO DEVEM ser incluídos em
especificações, arquivos gerados ou commits. Dados destinados à publicação DEVEM
ser avaliados antes de sua divulgação. A chave da conta de serviço DEVE permanecer
como secret do Cloudflare Worker.

### IV. Verificação de alterações

Cada alteração DEVE ser acompanhada de testes adequados ao comportamento afetado.
Os testes existentes DEVEM ser executados quando relacionados à mudança;
falhas ou impossibilidade de execução DEVEM ser comunicadas. Mudanças na interface
DEVEM ser verificadas no navegador quando aplicável. O projeto DEVE usar Playwright
para testes automatizados dos fluxos relevantes da interface e executá-los na
esteira do GitHub em alterações propostas. Até que esses testes e a esteira estejam
configurados, sua ausência DEVE ser comunicada; eles não substituem os testes
existentes de cálculos e dados.

### V. Transparência dos resultados

Estimativas, limitações, fontes e distinções entre resultados oficiais e estimados
DEVEM permanecer claras. Mudanças em fórmulas ou dados DEVEM ser verificadas
contra suas fontes e documentadas; não se deve apresentar estimativas como oficiais.

## Restrições do projeto

- Manter a compatibilidade com a publicação existente no GitHub Pages.
- Ao alterar JavaScript ou CSS, atualizar o parâmetro de versão das referências
  correspondentes no `index.html`, conforme o README.
- Não incluir dados pessoais, segredos ou informações privadas nos artefatos do
  Spec Kit; especificações versionadas podem ficar publicamente acessíveis.
- Alterações nos geradores DEVEM preservar suas validações e ser conferidas com
  os arquivos de origem antes de publicar os dados resultantes.

## Fluxo de desenvolvimento

- Para cada alteração delimitada, registrar requisitos e critérios de aceitação
  antes da implementação; revisar especificação, plano e tarefas antes de executar.
- A implementação DEVE respeitar o escopo aprovado e atualizar a documentação
  diretamente afetada.
- Para alterações nos cálculos ou resultados, executar os testes pertinentes
  descritos no README. Antes de publicar resultados, executar também o teste de
  consistência com os CSVs locais.
- Revisar o diff e os dados a publicar antes de integrar a alteração à branch
  principal. Não é necessário reconstituir especificações de todo o sistema.

## Governança

Esta constituição é uma proposta inicial para revisão do responsável pelo projeto.
Alterações posteriores DEVEM registrar o motivo, passar por revisão e atualizar
a versão: MAJOR para remoções ou mudanças incompatíveis de princípios, MINOR para
novos princípios ou ampliações e PATCH para esclarecimentos. Planos e revisões
DEVEM verificar a conformidade com estes princípios; exceções exigem justificativa
e aprovação explícita.

**Versão**: 1.1.0 (proposta) | **Criada**: 2026-11-18 | **Última alteração**: 2026-11-18

TODO(RATIFICATION_DATE): registrar a data após a aprovação da constituição.
