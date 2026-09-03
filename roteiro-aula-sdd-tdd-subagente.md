# Roteiro — Da conversa ao contrato: entrevista, spec, teste e um agente que audita

**Duração:** 1h30 · **Formato:** demonstração ao vivo, sem slides · **Projeto:** `biblioteca-api`

---

## Objetivo

Ao fim da aula o aluno sabe **aceitar ou recusar** uma entrega do agente sem abrir o
código-fonte — e sabe que esse trabalho começa **antes** do prompt.

| momento | ferramenta | pergunta que responde |
|---|---|---|
| **Entrevista** | skill `grilling` | o que ainda não foi decidido? |
| **Spec (SDD)** | skill `to-spec` | o que "pronto" significa? |
| **Teste (TDD)** | skill `tdd` | o contrato foi cumprido? |
| **Auditoria** | subagente `auditor` | o que o contrato esqueceu de cobrar? |

Não são quatro assuntos. São quatro momentos do mesmo ciclo, e a aula percorre ele
uma vez inteira.

---

## A pergunta que abre a aula

O arco das aulas anteriores foi todo sobre **o que entra no contexto**:

- `AGENTS.md` — o que o agente não descobre sozinho
- Skills — o que é longo demais para caber sempre na tela
- A dieta do contexto — o que **tirar**

Hoje o eixo muda:

> **Você mandou. Ele entregou. A suíte inteira está verde.
> Como você sabe se aceita?**

E o combinado: **ninguém abre um arquivo de `src/` hoje.** Nem eu.
(Vamos abrir `verificacoes/`. Ler teste não é ler código — é ler contrato.)

---

## Preparação do professor

Tudo isto **antes** da aula, na máquina que vai projetar.

### 1. Estado inicial — **sem empréstimos**

```bash
cd flex_ia
./aula-sdd/instalar.sh limpar biblioteca-api
cd biblioteca-api && npm test
```

Esperado: **19 testes, 19 passam** (livros + leitores). `src/servicos/` **não pode**
ter `emprestimos-servico.js` — o Passo 1 é gerar ele ao vivo.

> **A rede:** se a geração ao vivo travar ou demorar demais,
> `./aula-sdd/instalar.sh passo-1-real biblioteca-api` põe na hora a entrega que o
> agente já fez neste projeto (30/30 no `npm test`, 4/13 no juiz) e a aula segue igual
> do 1.2 em diante. Ensaie com ela pelo menos uma vez.

### 2. Confirme o juiz

```bash
cd flex_ia
./aula-sdd/juiz.sh biblioteca-api
```

Esperado agora: **0 passam, 13 falham.** Treze vermelhos numa base sem empréstimos é o
**correto** — o juiz fala só HTTP e todas as rotas respondem 404. Ele não quebra, ele
reprova.

Confira também o outro placar, para você saber de cor os dois números da aula:

```bash
./aula-sdd/instalar.sh passo-1-real biblioteca-api
./aula-sdd/juiz.sh biblioteca-api          # 4 passam, 9 falham
./aula-sdd/instalar.sh limpar biblioteca-api
```

### 3. Confirme as skills

```bash
cd flex_ia/biblioteca-api
opencode debug skill | grep '"name"'
```

Tem que listar `grilling`, `to-spec`, `tdd`, `novo-recurso`, `novo-subagente`.
Esse comando **não gasta token**.

> Skill mora em `.opencode/skills/<nome>/SKILL.md`. Arquivo `.md` solto na pasta
> `skills/` o OpenCode **ignora em silêncio** — sem erro, sem aviso. Se um aluno disser
> que a skill "não está funcionando", é isto em nove de cada dez vezes.

### 4. O auditor NÃO pode existir ainda

```bash
ls flex_ia/biblioteca-api/.opencode/agent/    # tem que dar "não existe"
```

O Passo 5 é criar ele. Se sobrou de um ensaio, apague — a cópia de segurança está em
`aula-sdd/agente/auditor.md`.

### 5. A spec também não

```bash
ls flex_ia/biblioteca-api/spec-*.md           # tem que dar "não existe"
```

Se a spec estiver dentro do projeto no Passo 1, o agente lê e a aula inteira desanda.

### 6. Marco no git (não pule — o Passo 4 depende dele)

Feche o estado **sem empréstimos** antes da aula:

```bash
cd flex_ia/biblioteca-api
git status --short
git add -A && git commit -m "base da aula: livros, leitores e as skills"
git status            # tem que dizer "nothing to commit, working tree clean"
```

Assim tudo o que aparecer no `git diff` durante a aula foi o agente que fez, na frente
da turma. Se a árvore já estiver suja quando a aula começar, o `git diff verificacoes/`
do Passo 4 não prova nada.


### 7. O documento de requisitos — **não projete**

Abra `aula-sdd/requisitos-envolvido-emprestimos.md` numa aba **que a turma não vê**
(celular, papel, segunda tela). É um documento de solicitações do envolvido no formato
que eles já viram em análise de requisitos: necessidades NE-01..NE-04, regras de
negócio RN-01..RN-13, restrições e fora de escopo.

No Passo 2 você não é professor, é a coordenadora da biblioteca — e esse documento é
tudo o que ela sabe. A nota de uso está no rodapé dele.

### 8. As redes de segurança, já abertas em abas

- `aula-sdd/fallbacks/rodadas-grilling.md` — se a entrevista ao vivo travar
- `aula-sdd/spec-emprestimos.md` — se o `to-spec` sair ruim
- `aula-sdd/agente/auditor.md` — se o `novo-subagente` sair ruim
- `./aula-sdd/instalar.sh gabarito biblioteca-api` — se o TDD estourar o tempo

---

# Passo 1 — A entrega que passa (18 min)

> **Projetar:** terminal com o OpenCode aberto em `biblioteca-api/`.

## 1.1 O prompt (colar exatamente assim)

```
Implemente o recurso de empréstimos de livros na Biblioteca API.
Um leitor pega um livro emprestado e depois devolve.
Cobre multa por atraso.
```

**Fale antes de dar Enter:**

> "Esse prompt é honesto. Não é preguiçoso, não é malicioso, tem contexto, tem verbo.
> É o prompt que 90% de vocês mandaria. Guardem ele."

E deixe uma coisa marcada, porque ela volta em quinze minutos:

> "Reparem que aqui não tem **nenhum número**. Nem prazo, nem valor de multa, nem
> limite. Nenhum."

**Enquanto roda, aponte o que ele está acertando:** os arquivos nas cinco pastas
certas, a rota como objeto com regex, o controlador sem `try/catch`, o
`enviarJson(res, 204, null)`.

> "As **convenções** ele acerta — vocês entregaram, no `AGENTS.md` e na skill. As
> **regras** ele vai inventar, porque ninguém entregou."

**Se travar ou passar de 8 minutos:** `./aula-sdd/instalar.sh passo-1-real biblioteca-api`
em outra aba e siga. A entrega é a mesma; só não foi feita na frente deles.

## 1.2 O verde

```bash
npm test
```

Tudo verde, trinta e poucos testes. Deixe na tela e peça mão levantada:

> "Quem aceita essa entrega?"

Vai ter mão levantada. É para ter.

## 1.3 Agora o cliente testa

```bash
cd flex_ia
./aula-sdd/juiz.sh biblioteca-api
```

No ensaio deu **4 passam, 9 falham**. A sua rodada pode dar outro número — o argumento
não depende disso. Deixe a lista dos vermelhos na tela e leia três em voz alta:

```
✖ 1. abre com 201, id emp_, status ativo e prazo de 14 dias
✖ 8. cobra 1,50 por dia inteiro de atraso
✖ 11. renova uma vez somando 14 dias à previsão e recusa a segunda
```

> "Mesma pasta. Mesmo segundo. Trinta verdes aqui, nove vermelhos ali.
> Alguém mentiu?"

## 1.4 Ache as decisões — com a turma

Aqui você abre `verificacoes/`, não `src/`. E faz **uma** pergunta:

> "Eu não escrevi nenhum número no prompt. Vamos achar os números que ele escreveu."

Peça para alguém ler em voz alta o teste da multa e o teste do prazo. Cada número que
aparecer ali e não estiver no prompt é uma decisão que ele tomou sozinho. Anote na
lousa em duas colunas: **o que ele decidiu** × **o que o cliente queria** (essa segunda
coluna sai da lista de vermelhos do juiz).

Isso funciona com qualquer saída que ele te der. Você não precisa que ele erre de um
jeito específico — precisa só que ele tenha decidido, e ele sempre decide.

## 1.5 O que apareceu no meu ensaio

Se a sua rodada saiu parecida, estes quatro estão lá. Se saiu diferente, o argumento é
o mesmo com outros exemplos.

| o que o cliente queria | o que o agente decidiu |
|---|---|
| prazo de 14 dias | **7 dias** |
| multa de R$ 1,50/dia | **R$ 2,00/dia** |
| teto de R$ 30 | **sem teto** |
| no máximo 3 ativos por leitor | **sem limite** |
| leitor em atraso não leva mais nada | **leva** |
| renovação, uma vez | **não existe** |
| devolver duas vezes → 409 | **422** |
| campos `emprestadoEm`, `devolucaoPrevista` | **`dataEmprestimo`, `dataDevolucaoPrevista`** |
| ninguém pediu apagar empréstimo | **`DELETE /emprestimos/:id`** |

E três coisas dentro de `verificacoes/emprestimos.spec.js` que valem o passo inteiro:

**O teste que carimba a decisão errada:**

```js
it('recusa devolver empréstimo já devolvido com 422', ...)
```

> "O cliente disse 409. Ele escolheu 422 — e escreveu um teste que **prova** que é 422.
> Verde. A suíte concorda com ele. A suíte sempre concorda com quem a escreveu."

**O teste frouxo:**

```js
assert.ok(corpo.multa > 0);
```

> "Multa maior que zero. R$ 2,00 passa. R$ 1,50 passa. R$ 900 passa.
> Esse teste não testa a multa. Testa que existe uma."

E, no mesmo teste, olhe o que ele manda no POST: `dataEmprestimo` **e**
`dataDevolucaoPrevista`. O teste entrega a data prevista de presente.

> "Ele nunca testou o prazo. Ele **informou** o prazo pro próprio teste.
> A regra dos 7 dias não é testada em lugar nenhum desta suíte."

**O hedge**, em `src/rotas/emprestimos-rotas.js`:

```js
{ metodo: 'POST', padrao: /\/devolver$/,   manipulador: controlador.devolver },
{ metodo: 'POST', padrao: /\/devolucao$/,  manipulador: controlador.devolver },
```

> "Duas rotas para a mesma coisa. Ele não sabia se o cliente chama de `devolver` ou de
> `devolucao`, então fez as duas. Isso é um chute com seguro. Custou o dobro de código
> para não resolver a dúvida — porque a dúvida não era dele para resolver."

## 1.6 A frase do passo

> **"Ele não errou. Ele decidiu.
> E decidiu sozinho porque ninguém decidiu antes."**

Feche perguntando:

> "Quantas dessas dava para adivinhar lendo o repositório?"

Nenhuma. Não está no código, não está no `AGENTS.md`, não está na internet. Está na
cabeça de uma pessoa. E existe um jeito de tirar de lá.

---

# Passo 2 — A entrevista (25 min) ← **o coração da aula**

## 2.1 A skill (3 min)

```bash
opencode debug skill | grep '"name"'
```

Abra `.opencode/skills/grilling/SKILL.md` e leia **só** estes três trechos:

> *"Toda vez que você adivinha, você decide sozinho uma regra de negócio que não é sua."*

> *"Fatos são seu problema, decisões são do usuário."* — se está no repositório, ele
> procura; só pergunta o que ele não teria como saber.

> *"Regra que não dá para verificar não é regra, é desejo."*

Diga de onde ela veio, em uma frase:

> "Baixei do repositório do Matt Pocock com `npx skills add`. E **reescrevi**. A
> original mandava abrir subagente para cada dúvida — com a cota de vocês isso estoura
> em dois minutos. Skill baixada da internet não é skill sua até você ler."

*(Se quiser mostrar, o original está em `flex_ia/.agents/skills/`.)*

## 2.2 Rode (15 min)

Cole:

```
Use a skill grilling. Vamos decidir o recurso de empréstimos de livros desta API
antes de escrever qualquer código. Não escreva código nesta conversa.
```

**Daqui em diante você não é o professor. Você é a bibliotecária-chefe.**
Colinha na mão, respostas curtas, sem explicar demais.

Como conduzir:

- Ele numera as perguntas e **recomenda** uma resposta em cada. Quando a recomendação
  bate com o documento, responda `"P1 e P3 como você sugeriu; P2 são 14 dias"` e a rodada
  anda em vinte segundos.
- Duas ou três rodadas bastam. Pare quando a fronteira esvaziar **ou** aos 15 minutos.
- Se ele começar a escrever código, corte: `pare, ainda estamos decidindo`.

## 2.3 O momento de ouro (não deixe passar)

Na primeira vez que ele perguntar sobre **prazo**, **multa** ou **limite** — pare tudo.
Volte para a lista de vermelhos do Passo 1 na outra aba:

> "Olhem a pergunta. `Qual o prazo de devolução?`
> Agora olhem o vermelho número 1 do juiz: `prazo de 14 dias`.
>
> Essa pergunta, que custou oito segundos, vale três casos de aceitação.
> Foi exatamente ela que ninguém fez há vinte minutos."

Esse é o instante em que a aula acontece. Tudo antes é preparação e tudo depois é
consequência.

## 2.4 Duas coisas para observar em voz alta

**Se ele perguntar sobre nomes de campo ou status HTTP** — entregue o contrato de
integração da seção 6, com a fala do cliente: *"o app do balcão já está em produção,
os nomes não são negociáveis."*

**Se ele NÃO perguntar** — não corrija. Deixe passar de propósito e anote. No Passo 4 o
juiz vai reprovar por nome de campo, e aí você diz:

> "Ele não perguntou, e eu não ofereci. Buraco de informação não se fecha sozinho —
> nem com o agente perguntando, se ele esquecer de perguntar. Por isso o próximo passo
> existe: a spec é onde a gente **lê** o que foi decidido e vê o que faltou."

**Se travar ao vivo:** `cat aula-sdd/fallbacks/rodadas-grilling.md` e siga a leitura
como se fosse a saída. O conteúdo é o mesmo.

---

# Passo 3 — A conversa vira contrato (8 min)

## 3.1 Rode

```
Use a skill to-spec. Escreva a spec de empréstimos a partir do que a gente decidiu.
```

Ele grava `spec-emprestimos.md` na raiz do projeto.

## 3.2 Leia só duas seções

**Seção 5 — Regras.** Projete e leia em voz alta as três primeiras:

```
R1. O prazo de devolução é de 14 dias corridos a partir de emprestadoEm.
R4. Um leitor pode ter no máximo 3 empréstimos ativos. O quarto responde 409 CONFLITO.
R7. Devolução em atraso cobra R$ 1,50 por dia inteiro, com teto de R$ 30,00.
```

> "Isto tem número, tem status HTTP e dá para conferir de fora. É por isso que eu
> troquei o modelo da skill original: a versão do Matt gera *user story* —
> `como leitor, quero renovar meu empréstimo`. Bonito, e impossível de reprovar.
> Regra tem número. História tem enredo."

**Seção 2 — Fora de escopo.** Essa é a seção que ninguém escreve e todo mundo devia:

> "Está escrito aqui que empréstimo não se apaga. Lembram do `DELETE` que ele inventou
> no Passo 1? Agora ele está proibido **por escrito**. Não porque o código não faz —
> porque o contrato diz que não é para fazer."

## 3.3 A conta

> "Nove decisões que ele tomou sozinho no Passo 1. Quantas regras numeradas tem aqui?"

Conte na tela. São mais que nove — porque a entrevista descobre coisa que nem você
tinha pensado. Essa diferença é o valor do passo.

**Rede:** se a spec sair pobre, `cp aula-sdd/spec-emprestimos.md biblioteca-api/` e siga.

> **Antes de sair do Passo 3:** confira se existe uma regra sobre **data de retirada no
> futuro**. Se a entrevista não cobriu, peça agora:
> `acrescente uma regra: emprestadoEm no futuro é recusado com 422`.
> O Passo 5 depende dela.

---

# Passo 4 — Teste primeiro (16 min)

## 4.1 A skill em uma frase

Abra `.opencode/skills/tdd/SKILL.md` e leia só o título da seção:

> **"Quando o teste falha, o suspeito é o código."**

E a linha abaixo:

> *"Se você mudar um teste para ele passar, você trocou o contrato pela sua
> implementação e o verde virou enfeite."*

## 4.2 Rode (9 min, cronometrado)

```
Use a skill tdd. Implemente só a fatia 1 da spec-emprestimos.md.
Um teste por vez: escreva o teste, mostre ele falhando, e só então o código.
```

O que observar **em voz alta** enquanto roda:

- **Ele mostrou o vermelho?** Se pulou direto para o verde, corte:
  `você não me mostrou o teste falhando. Rode antes de implementar.`
  Teste que passa antes do código existir não está testando nada.
- **O nome do teste é a regra?** `it('recusa o quarto empréstimo ativo do mesmo leitor')`
  é legível para o cliente. `it('deve funcionar corretamente')` não é teste, é enfeite.

## 4.3 A armadilha do verde

Quando a fatia fechar:

```bash
git diff verificacoes/
```

> "Eu não pedi para ele mexer nos testes antigos. Se aparecer alguma coisa aqui, a
> pergunta é uma só: **mudou a spec, ou ele mudou o teste para o código dele passar?**"

É por isso que o marco no git foi feito antes da aula.

## 4.4 Feche com o gabarito

Aos 9 minutos, com ou sem fatia pronta:

```bash
cd flex_ia
./aula-sdd/instalar.sh gabarito biblioteca-api
cd biblioteca-api && npm test
cd .. && ./aula-sdd/juiz.sh biblioteca-api
```

```
npm test → 33 pass / 0 fail
juiz     → 13 pass / 0 fail
```

Lado a lado com o Passo 1, na lousa:

```
sem spec:   npm test 30/30   ·   juiz  4/13
com spec:   npm test 33/33   ·   juiz 13/13
```

> "As duas colunas da esquerda estão verdes. Verde não prova valor — prova contrato.
> No Passo 1 não tinha contrato, então o verde não provava nada."

---

# Passo 5 — O auditor (18 min)

## 5.1 A pergunta que sobrou (2 min)

> "Treze de treze. Aceita?"
>
> "Cuidado. O juiz confere **treze critérios**. A spec tem mais regras que isso.
> Quem confere se toda regra da spec tem alguém provando ela?"

Não pode ser quem escreveu — nem o agente, que vai defender o próprio trabalho, nem
você, que não vai ler 400 linhas.

> "Quem escreveu não assina o próprio aceite. É por isso que a próxima coisa que a
> gente cria não é código. É um funcionário."

## 5.2 A skill (2 min)

```bash
opencode debug skill | grep novo-subagente
```

> "Vocês já viram a `novo-recurso`, que ensina a criar um CRUD aqui dentro. Essa é a
> mesma ideia aplicada a **criar um agente**. O fluxo é o mesmo da aula inteira: em vez
> de eu escrever o agente na mão, eu escrevo as regras de como se escreve um agente."

## 5.3 Rode (6 min)

```
Use a skill novo-subagente. Crie um subagente chamado auditor que audita a entrega
de um recurso contra a spec: para cada regra numerada da spec ele procura o teste que
comprova, e aponta as regras que ficaram sem prova. Ele não conserta nada.
```

## 5.4 Revise o frontmatter na tela (5 min) ← a parte que ensina

Abra `.opencode/agent/auditor.md` e leia campo por campo:

```yaml
mode: subagent          # não aparece no seletor; só roda quando chamado
temperature: 0.1        # auditoria não é hora de ser criativo
tools:
  write: false          # ← o campo que faz ele valer alguma coisa
  edit: false
  task: false           # não abre outros agentes: sua cota agradece
  bash: true            # mas roda npm test
  read: true
```

> "`write: false`. Se o auditor pudesse escrever, ele consertaria o que achou — e o
> relatório viria 'estava tudo bem, depois que eu ajustei'. Você perde o achado.
> **Tire a ferramenta. Não peça educadamente no prompt.**"

E o motivo de ser um agente separado, e não mais uma instrução no mesmo chat:

```
   agente principal              auditor
   ┌──────────────────┐     ┌──────────────────┐
   │ a entrevista     │     │                  │
   │ a spec           │ ──► │  a spec (lê)     │
   │ os testes        │     │  os testes (lê)  │
   │ o código         │     │  npm test (roda) │
   │ "ficou ótimo"    │     │                  │
   └──────────────────┘     └──────────────────┘
      contexto cheio          contexto vazio
      e comprometido          e sem lealdade
```

> "Ele não estava na conversa. Não sabe o que a gente combinou, não sabe o que foi
> difícil, não tem apreço nenhum pelo código. Só tem a spec, os testes e o `npm test`.
> Por isso o parecer dele vale."

## 5.5 Confira sem gastar token

```bash
opencode debug agent auditor
```

Mostre as ferramentas resolvidas na saída: `"write": false`, `"edit": false`,
`"task": false`.

> "Isto aqui é o reflexo que eu quero que vocês levem: **conferir configuração é de
> graça**. Um campo escrito errado no frontmatter o OpenCode ignora **em silêncio** —
> escreveu `tool:` no lugar de `tools:` e o seu auditor ganha permissão de escrita sem
> avisar ninguém."

Feche o OpenCode e abra de novo — config só é lida na inicialização.

## 5.6 O parecer (3 min)

```
@auditor audite a entrega de empréstimos contra spec-emprestimos.md
```

Esperado: a matriz de rastreabilidade, e pelo menos um **SEM PROVA** — a regra da data
de retirada no futuro. Ela está implementada, o `npm test` está verde, o juiz está
13/13, e **nenhum dos dois testa ela**.

> "Verde em tudo. E existe uma regra da spec que ninguém prova.
> Essas são duas perguntas diferentes:
> *o contrato foi cumprido?* é a suíte.
> *o contrato cobra tudo o que devia?* é o auditor."

**Se o parecer vier vazio ou elogioso:** peça a matriz completa —
`liste todas as regras R1..Rn e o arquivo:linha do teste que comprova cada uma`.
Com a matriz na tela, a lacuna aparece sozinha.

---

# Passo 6 — Fechamento e atividade (5 min)

## 6.1 O ciclo

```
   ┌── entrevista ──► spec ──► teste ──► código ──► auditor ──┐
   │      quem            o que      a prova     a entrega    │
   │     decide         significa      do        de quem      │
   │                     "pronto"    contrato   não escreveu  │
   └──────────────────────────◄──────────────────────────────┘
              achado do auditor volta como regra na spec
```

## 6.2 As três frases

> **Ele não erra. Ele decide.** Toda ambiguidade que você deixa passar vira uma
> decisão de negócio tomada por quem não conhece o seu negócio.

> **Verde não prova valor, prova contrato.** Sem contrato, o verde prova só que o
> agente concorda com ele mesmo.

> **Quem escreveu não assina o próprio aceite.**

## 6.3 Passe a atividade

`aula-sdd-enunciado-classroom.txt` — recurso `reservas`, em dupla.

Diga só o essencial e deixe o resto para o Classroom:

> "Vocês vão entrevistar **um ao outro** e escrever a spec de `reservas`. Aí vocês
> **trocam**: cada um implementa a spec do colega, sem poder perguntar nada. O teste da
> sua spec não é você gostar dela — é outra cabeça chegar no mesmo software."

---

## Checklist de fechamento

- [ ] A turma viu 30 verdes e 9 vermelhos na mesma pasta
- [ ] A turma viu `assert.ok(corpo.multa > 0)` e entendeu por que não vale
- [ ] A turma viu o agente **perguntando** um número que ele tinha inventado antes
- [ ] A turma viu a conversa virar arquivo com regras numeradas
- [ ] A turma viu um teste vermelho antes do verde
- [ ] A turma viu `write: false` e ouviu por quê
- [ ] A turma viu um achado com tudo verde
- [ ] A atividade foi passada

## Plano B de tempo

O relógio: 18 + 25 + 8 + 16 + 18 + 5 = 90. Corte nesta ordem, e só nesta:

1. **A geração ao vivo do Passo 1** (−6 min) — instale `passo-1-real` antes da aula e
   comece direto no 1.2, dizendo que o prompt do 1.1 foi rodado ontem. Perde-se ver o
   agente trabalhando; não se perde nada do argumento.
2. **Passo 4 inteiro** (−14 min) — instale o gabarito, mostre os dois placares lado a
   lado e siga. O TDD ao vivo é o mais caro e o mais fácil de recontar.
3. **Passo 3.3** (a conta das regras).
4. **Passo 1.5** — fique só no `assert.ok(multa > 0)`, corte o hedge das duas rotas.

**Nunca corte o Passo 2.** Sem ele a aula vira a mesma demonstração de sempre — "olha o
agente errando". Com ele, a aula é sobre o que fazer a respeito.

**Nunca corte o 5.4.** É o único momento em que eles veem o que é, por dentro, um agente.

## Gancho para a próxima aula

> "O auditor rodou aqui na sua máquina, lendo os seus arquivos. Da próxima vez ele vai
> precisar ler coisa que não está no disco — o Jira, o banco, a documentação da API do
> cliente. Isso tem nome, e é a próxima aula."
