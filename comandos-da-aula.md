# Comandos da aula — cola de terminal

```
$   terminal          »   prompt para colar no OpenCode
✓   checkpoint        ⟲   se der errado
```

Todo `$` de fora do projeto roda em `flex_ia/`. Todo `$` de dentro roda em
`flex_ia/biblioteca-api/`.

---

## 0. Antes da aula

```bash
$ cd flex_ia
$ ./aula-sdd/instalar.sh limpar biblioteca-api
$ cd biblioteca-api && npm test
```
✓ `pass 19 · fail 0` · `src/servicos/` sem `emprestimos-servico.js`

```bash
$ opencode debug skill | grep '"name"'
```
✓ `grilling` · `to-spec` · `tdd` · `novo-recurso` · `novo-subagente`

```bash
$ ls .opencode/agent/     # tem que dar "não existe"
$ ls spec-*.md            # tem que dar "não existe"
$ git add -A && git commit -m "base da aula" && git status
```
✓ `nothing to commit, working tree clean`

```bash
$ cd .. && ./aula-sdd/juiz.sh biblioteca-api
```
✓ `pass 0 · fail 13` (reprova sem quebrar)

Abrir e **não projetar**: `aula-sdd/requisitos-envolvido-emprestimos.md`

---

## 1. A entrega que passa

```
» Implemente o recurso de empréstimos de livros na Biblioteca API.
  Um leitor pega um livro emprestado e depois devolve.
  Cobre multa por atraso.
```

```bash
$ npm test
```
✓ verde, trinta e poucos testes

```bash
$ cd .. && ./aula-sdd/juiz.sh biblioteca-api
```
✓ maioria vermelha (no ensaio: `pass 4 · fail 9`)

⟲ travou ou passou de 8 min:
```bash
$ ./aula-sdd/instalar.sh passo-1-real biblioteca-api
```
✓ `npm test` 30/30 · juiz `pass 4 · fail 9`

---

## 2. A entrevista

```
» Use a skill grilling. Vamos decidir o recurso de empréstimos de livros desta API
  antes de escrever qualquer código. Não escreva código nesta conversa.
```

Responder pelo documento de requisitos. Se ele começar a codar:
```
» pare, ainda estamos decidindo
```

✓ 2 ou 3 rodadas, fronteira vazia, resumo numerado na tela

⟲ travou: `$ cat aula-sdd/fallbacks/rodadas-grilling.md` e leia como se fosse a saída

---

## 3. A spec

```
» Use a skill to-spec. Escreva a spec de empréstimos a partir do que a gente decidiu.
```

```bash
$ cat spec-emprestimos.md
```
✓ existe seção de regras numeradas (R1, R2, …) e seção "fora de escopo"

**Antes de sair do passo**, se a entrevista não cobriu:
```
» acrescente uma regra: emprestadoEm no futuro é recusado com 422
```

⟲ spec ruim:
```bash
$ cp aula-sdd/spec-emprestimos.md biblioteca-api/
```

---

## 4. TDD — uma fatia, depois o resto

```
» Use a skill tdd. Implemente só a fatia 1 da spec-emprestimos.md.
  Um teste por vez: escreva o teste, mostre ele falhando, e só então o código.
```

```bash
$ npm test
$ cd .. && ./aula-sdd/juiz.sh biblioteca-api "fatia 1"
```
✓ `npm test` verde · juiz da fatia 1 `pass 5 · fail 0`

> Se a spec não carregou os nomes de campo do documento de requisitos
> (`emprestadoEm`, `devolucaoPrevista`, `devolvidoEm`), o juiz para em 3/5.
> Isso é conteúdo, não erro: mostre qual asserção quebrou e diga que o app do balcão
> não conseguiu ler a resposta.

**Só uma fatia foi feita à mão. O resto vai de uma vez:**

```
» Agora implemente as fatias restantes da spec, na ordem, com a mesma skill tdd.
  Não altere nenhum teste que já existe.
```

```bash
$ npm test
$ cd .. && ./aula-sdd/juiz.sh biblioteca-api
```
✓ juiz `pass 13 · fail 0` (se a spec estiver completa)

```bash
$ cd biblioteca-api && git diff verificacoes/
```
✓ só arquivos novos; nenhuma linha removida de teste antigo

⟲ estourou o tempo (9 min na fatia 1, ou 6 min no resto):
```bash
$ ./aula-sdd/instalar.sh gabarito biblioteca-api
$ cd biblioteca-api && npm test          # 33/33
$ cd .. && ./aula-sdd/juiz.sh biblioteca-api   # 13/13
```

---

## 5. O auditor

```
» Use a skill novo-subagente. Crie um subagente chamado auditor que audita a entrega
  de um recurso contra a spec: para cada regra numerada da spec ele procura o teste
  que comprova, e aponta as regras que ficaram sem prova. Ele não conserta nada.
```

```bash
$ cat .opencode/agent/auditor.md
$ opencode debug agent auditor
```
✓ `"mode": "subagent"` · `"write": false` · `"edit": false` · `"task": false`

**Feche e reabra o OpenCode.**

```
» @auditor audite a entrega de empréstimos contra spec-emprestimos.md
```
✓ matriz de rastreabilidade + pelo menos um `SEM PROVA`

⟲ parecer vazio ou elogioso:
```
» liste todas as regras R1..Rn e o arquivo:linha do teste que comprova cada uma
```

⟲ agente saiu errado:
```bash
$ cp aula-sdd/agente/auditor.md biblioteca-api/.opencode/agent/
```

---

## 6. Depois da aula

```bash
$ cd flex_ia
$ ./aula-sdd/instalar.sh limpar biblioteca-api
$ cd biblioteca-api && git checkout -- . && git clean -fd
$ npm test
```
✓ `pass 19 · fail 0` — pronto para a próxima turma

---

## Placares de referência

| estado | `npm test` | juiz |
|---|---|---|
| base sem empréstimos | 19/19 | 0/13 |
| `passo-1-real` (prompt sem spec) | 30/30 | 4/13 |
| `gabarito` | 33/33 | 13/13 |

## Em outra máquina

```bash
$ mkdir flex_ia && cd flex_ia
$ git clone -b aula/estado-inicial https://github.com/gustavo-qss/biblioteca-api.git biblioteca-api
$ git clone -b aula/material-professor https://github.com/gustavo-qss/biblioteca-api.git aula-sdd
$ cd biblioteca-api && npm test
```
✓ `pass 19 · fail 0`
