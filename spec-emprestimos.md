# Spec — Empréstimos

> Contrato do recurso `emprestimos` da Biblioteca API.
> Escrito **antes** do código. É o que define "pronto".

## 1. Objetivo

Permitir que um leitor pegue um livro do acervo emprestado, renove o prazo uma vez
e devolva o livro, com cobrança de multa por atraso.

## 2. Fora de escopo

Não faça nada disto — mesmo que pareça natural:

- **Não** crie `PUT /emprestimos/:id` nem `DELETE /emprestimos/:id`.
  Empréstimo não se edita nem se apaga: ele se movimenta (devolução, renovação).
- **Não** crie cadastro de reservas, fila de espera ou notificação de vencimento.
- **Não** persista nada em disco nem instale biblioteca alguma.
- **Não** guarde no leitor um campo `bloqueado` nem no livro um campo `multa`.
  Bloqueio e multa são **derivados** dos empréstimos, nunca armazenados no leitor.

## 3. Modelo

Um empréstimo é um objeto com exatamente estes campos:

| campo | tipo | descrição |
|---|---|---|
| `id` | string | prefixo `emp_` + 8 hexadecimais |
| `leitorId` | string | identificador do leitor |
| `livroId` | string | identificador do livro |
| `emprestadoEm` | string ISO 8601 | quando saiu |
| `devolucaoPrevista` | string ISO 8601 | ver R1 |
| `devolvidoEm` | string ISO 8601 ou `null` | `null` enquanto ativo |
| `renovacoes` | inteiro | começa em `0` |
| `status` | `"ativo"` \| `"devolvido"` | |
| `multa` | número | reais, no máximo duas casas. `0` enquanto ativo |

## 4. Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/emprestimos` | abre um empréstimo |
| GET | `/emprestimos` | lista. Aceita `?leitorId=` e `?status=` |
| GET | `/emprestimos/:id` | busca um empréstimo |
| POST | `/emprestimos/:id/devolucao` | devolve o livro |
| POST | `/emprestimos/:id/renovacao` | estende o prazo |

Corpo do POST de abertura: `{ "leitorId": "...", "livroId": "...", "emprestadoEm": "..." }`
— `emprestadoEm` é opcional (ver R10).

## 5. Regras

**R1 — Prazo.** `devolucaoPrevista` = `emprestadoEm` + 14 dias corridos. Exatamente 14,
não 7 nem 15, e contados do empréstimo, não da resposta.

**R2 — Existência.** Leitor e livro precisam existir. Se algum não existir, `404`
com código `NAO_ENCONTRADO`.

**R3 — Livro único.** Um livro com empréstimo ativo não pode ser emprestado de novo:
`409` com código `CONFLITO`. Enquanto o empréstimo está ativo, o livro fica com
`emprestado: true`; na devolução volta a `false`.

**R4 — Limite de três.** Um leitor pode ter no máximo **3** empréstimos ativos.
O quarto pedido responde `409` `CONFLITO`.

**R5 — Leitor em atraso não pega livro.** Se o leitor tem **qualquer** empréstimo
ativo com `devolucaoPrevista` no passado, ele não abre novo empréstimo: `409`
`CONFLITO` — mesmo que tenha menos de 3 ativos. Esta regra vem **antes** da R4.

**R6 — Devolução.** `POST /emprestimos/:id/devolucao` responde `200` com o empréstimo
atualizado: `status` = `"devolvido"`, `devolvidoEm` preenchido, livro liberado.
Devolver um empréstimo já devolvido responde `409` `CONFLITO`.

**R7 — Multa.** Calculada **no momento da devolução**, sobre `devolvidoEm`:

- `R$ 1,50` por **dia inteiro** de atraso (dias completos; sobra de horas não conta).
- Teto de `R$ 30,00`. Atraso maior que 20 dias continua cobrando 30,00.
- Devolução dentro do prazo: `multa` = `0`.

**R8 — Renovação.** `POST /emprestimos/:id/renovacao` responde `200` e soma **14 dias
à `devolucaoPrevista` atual** (não à data de hoje), incrementando `renovacoes`. Recusa
com `409` `CONFLITO` quando:

- o empréstimo já foi renovado uma vez (`renovacoes` = 1 é o máximo);
- o empréstimo está em atraso;
- o empréstimo já foi devolvido.

**R9 — Consulta.** `GET /emprestimos` aceita `?leitorId=` e `?status=`, combináveis.
Sem filtro, devolve tudo.

**R10 — Carga histórica.** `emprestadoEm` é opcional no POST de abertura. Quando vier,
é uma data ISO 8601 no passado e é ela que vale para R1 e R7 — serve para registrar
empréstimos antigos na migração do acervo de papel. Quando não vier, vale o instante
da requisição. Data no futuro responde `422` `DADOS_INVALIDOS`.

## 6. Critérios de aceite

O recurso está pronto quando existir um teste que comprove cada linha abaixo, e
todos passarem:

| # | Critério | Regra |
|---|---|---|
| 1 | abre empréstimo com `201`, id `emp_`, status ativo, multa 0, renovacoes 0 e prazo de 14 dias | R1 |
| 2 | o livro emprestado fica com `emprestado: true` | R3 |
| 3 | emprestar livro já emprestado responde `409` | R3 |
| 4 | leitor ou livro inexistente responde `404` | R2 |
| 5 | o quarto empréstimo ativo do mesmo leitor responde `409` | R4 |
| 6 | leitor com empréstimo atrasado é recusado com `409` mesmo tendo 1 ativo | R5 |
| 7 | devolução no prazo responde `200`, libera o livro e deixa multa 0 | R6 |
| 8 | devolução com 6 dias de atraso cobra `9` de multa | R7 |
| 9 | atraso longo cobra o teto de `30` | R7 |
| 10 | devolver empréstimo já devolvido responde `409` | R6 |
| 11 | renova uma vez somando 14 dias à previsão e recusa a segunda com `409` | R8 |
| 12 | renovar empréstimo atrasado responde `409` | R8 |
| 13 | a listagem filtra por `leitorId` e por `status` | R9 |

## 7. Como isto será verificado

A suíte de aceitação conversa com a API **só por HTTP** — ela não importa nenhum
arquivo de `src/` além de `criarServidor()`. Ela não sabe (e não quer saber) como o
recurso foi implementado por dentro.

Para poder montar cenários de atraso sem esperar duas semanas, ela usa `emprestadoEm`
(R10) com datas no passado. **Sem a R10 a metade das regras é impossível de comprovar.**
Uma regra que não dá para verificar não está no contrato — está no desejo.

## 8. Fatias de entrega

Implemente e feche uma fatia por vez, com verde antes de passar para a próxima:

1. **Abrir empréstimo** — R1, R2, R3, R4, R10 → critérios 1 a 5
2. **Bloqueio por atraso** — R5 → critério 6
3. **Devolução e multa** — R6, R7 → critérios 7 a 10
4. **Renovação** — R8 → critérios 11 e 12
5. **Consulta** — R9 → critério 13
