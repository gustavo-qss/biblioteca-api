# Comandos da aula — cola de terminal

```
$   terminal          »   prompt para colar no OpenCode
✓   checkpoint        ⟲   se der errado        ⏱   hora de cortar
```

Duas pastas lado a lado: o OpenCode abre em `biblioteca-api/` (terminal 1, projetado);
`juiz.sh` e `passo.sh` rodam de `flex_ia/` (terminal 2). Todo `$` de fora do projeto
roda em `flex_ia/`; todo `$` de dentro, em `flex_ia/biblioteca-api/`.

**Pare o agente (Esc) antes de qualquer `passo.sh`.**

---

## Modo demonstração — um script por passo, sem prompt

Para mostrar a aula sem depender do agente, ou ensaiar em dez minutos: o script leva
o projeto até o **fim** de cada passo e mostra o que apareceria na tela, com
`npm test` e juiz rodados de verdade.

```bash
$ ./aula-sdd/passo.sh 0     # antes da aula
$ ./aula-sdd/passo.sh 1     # a entrega que passa
$ ./aula-sdd/passo.sh 2     # a entrevista — nenhum arquivo muda; mostra o resumo
$ ./aula-sdd/passo.sh 3     # a spec
$ ./aula-sdd/passo.sh 4a    # TDD, só a fatia 1
$ ./aula-sdd/passo.sh 4     # TDD, as fatias restantes
$ ./aula-sdd/passo.sh 5     # o auditor
```

Cada estado é absoluto: dá para pular, voltar e repetir em qualquer ordem. O passo 5
não mostra o parecer do `@auditor` — isso exige o agente —, mostra a rastreabilidade
por nome de teste, que já expõe a R10 sem prova.

---

## 0. Antes da aula

```bash
$ cd flex_ia
$ ./aula-sdd/passo.sh 0
```
✓ `npm test pass 19 · fail 0` · `juiz pass 0 · fail 13` · as cinco skills na lista

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

Abrir e **não projetar**: `aula-sdd/requisitos-envolvido-emprestimos.md`

---

## 1. A entrega que passa · minuto 0–18

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

⏱ aos 8 min, terminando ou não:
```bash
$ ./aula-sdd/passo.sh 1
```
✓ `npm test` 30/30 · juiz `pass 4 · fail 9`

---

## 2. A entrevista · minuto 18–43

```
» Use a skill grilling. Vamos decidir o recurso de empréstimos de livros desta API
  antes de escrever qualquer código. Não escreva código nesta conversa.
```

Responder pelo documento de requisitos. Se ele começar a codar:
```
» pare, ainda estamos decidindo
```

✓ 2 ou 3 rodadas, fronteira vazia, resumo numerado na tela

⏱ aos 36 min encerre a entrevista, fronteira vazia ou não

⟲ travou: `$ cat aula-sdd/fallbacks/rodadas-grilling.md` e leia como se fosse a saída
⟲ só o resumo, formatado: `$ ./aula-sdd/passo.sh 2` (não mexe em arquivo nenhum)

---

## 3. A spec · minuto 43–51

```
» Use a skill to-spec. Escreva a spec de empréstimos a partir do que a gente decidiu.
```

```bash
$ cat spec-emprestimos.md
```
✓ existe seção de regras numeradas (R1, R2, …) e seção "fora de escopo"

**Antes de sair do passo:**
```bash
$ grep -c 'emprestadoEm\|devolucaoPrevista\|devolvidoEm' biblioteca-api/spec-emprestimos.md
```
✓ maior que zero · **zero** = o juiz vai parar em 3/5 no passo 4 (isso é conteúdo)

E, se a entrevista não cobriu a data no futuro:
```
» acrescente uma regra: emprestadoEm no futuro é recusado com 422
```

⏱ aos 47 min, ou spec ruim:
```bash
$ ./aula-sdd/passo.sh 3
```

---

## 4. TDD — uma fatia, depois o resto · minuto 51–67

**Primeiro jogue fora o código do passo 1** (a spec fica):
```bash
$ ./aula-sdd/instalar.sh limpar biblioteca-api
$ cd biblioteca-api && npm test
```
✓ `pass 19 · fail 0`

```
» Use a skill tdd. Implemente só a fatia 1 da spec-emprestimos.md.
  Um teste por vez: escreva o teste, mostre ele falhando, e só então o código.
```

```bash
$ npm test
$ cd .. && ./aula-sdd/juiz.sh biblioteca-api "fatia 1"
```
✓ `npm test` verde · juiz da fatia 1 `pass 5 · fail 0`

⏱ aos 60 min: `$ ./aula-sdd/passo.sh 4a`

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

**Feche sempre com a entrega de referência** — ⏱ aos 65 min, terminando ou não —
para toda turma auditar a mesma coisa:
```bash
$ ./aula-sdd/passo.sh 4
```
✓ 33/33 e 13/13 — sem isso, o `SEM PROVA` da R10 no passo 5 não é garantido

---

## 5. O auditor · minuto 67–85

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

⏱ aos 77 min, ou agente saiu errado:
```bash
$ ./aula-sdd/passo.sh 5
```
⟲ o auditor não rodou: a saída do `passo.sh 5` traz a rastreabilidade por grep, com a
R10 `SEM PROVA` — diga que é um grep, não o parecer, e faça a mesma pergunta

---

## 6. Depois da aula · minuto 85–90

```bash
$ cd flex_ia
$ ./aula-sdd/passo.sh 0
$ cd biblioteca-api && git checkout -- . && git clean -fd
```
✓ `pass 19 · fail 0` — pronto para a próxima turma

---

## Placares de referência

| estado | `npm test` | juiz |
|---|---|---|
| base sem empréstimos | 19/19 | 0/13 |
| `passo-1-real` (prompt sem spec) | 30/30 | 4/13 |
| `fatia-1` (TDD, só a fatia 1) | 25/25 | 5/13 · `"fatia 1"` 5/5 |
| `gabarito` | 33/33 | 13/13 |

## Em outra máquina

```bash
$ mkdir flex_ia && cd flex_ia
$ git clone -b aula/estado-inicial https://github.com/gustavo-qss/biblioteca-api.git biblioteca-api
$ git clone -b aula/material-professor https://github.com/gustavo-qss/biblioteca-api.git aula-sdd
$ cd biblioteca-api && npm test
```
✓ `pass 19 · fail 0`
