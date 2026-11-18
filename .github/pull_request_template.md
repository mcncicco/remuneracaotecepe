## Validações

- [ ] Os testes locais e o CI foram revisados para o SHA atual.
- [ ] Verifiquei o preview da branch em `/adocao-spec-kit/` e confirmei que a
      raiz continua sendo a versão da `main`.
- [ ] Não incluí CSVs, PDFs de origem, logs brutos ou dados pessoais no pull request.

## Alterações em resultados do concurso

- [ ] Não se aplica: a classificação de mudanças não exige validação local.
- [ ] Executei `node --test js/resultados-concurso.test.js js/resultados-csv.test.js` localmente para o SHA atual.
- [ ] Uma pessoa autorizada revisou e confirmou a validação local para o SHA atual; os CSVs não foram anexados.

Se novos commits forem adicionados, a confirmação local deve ser refeita para o novo SHA.
