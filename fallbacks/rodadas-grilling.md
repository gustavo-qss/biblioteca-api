# Rede de segurança — a entrevista, se ela travar ao vivo

Use só se o `grilling` não rodar (cota, rede, resposta ruim). Leia como se fosse a
saída na tela, fazendo as perguntas em voz alta e respondendo você mesmo pelo documento
de requisitos.
A turma não perde nada: o conteúdo é o mesmo, só não é ao vivo.

---

## Rodada 1

❓ **P1 — Prazo de devolução**: quantos dias o leitor fica com o livro? Vi que a API não
tem nenhuma configuração de prazo hoje, então isso precisa ser decidido aqui.

➡️ 14 dias corridos, contados da retirada.

---

❓ **P2 — Limite por leitor**: um leitor pode ter quantos empréstimos ativos ao mesmo
tempo? Sem limite, ou um teto?

➡️ Um teto. Sugiro 3.

---

❓ **P3 — Exemplar único**: o acervo tem um exemplar por título (`livros` não tem campo
de quantidade). Confirmo que um livro emprestado não pode ser emprestado de novo?

➡️ Sim. Um exemplar, um leitor. A segunda tentativa é recusada.

---

❓ **P4 — Fronteira do escopo**: reserva, fila de espera, histórico do leitor e
pagamento de multa entram nesta entrega?

➡️ Nenhum dos quatro. Só empréstimo, devolução e consulta.

---

❓ **P5 — Contrato de saída**: existe algum cliente já consumindo esta API? Se existir,
os nomes de campo e os códigos de status não são minha escolha.

➡️ *(aqui você entrega o contrato de integração — seção 6 do documento de requisitos)*

---

## Rodada 2

*Estas dependiam do prazo e do limite estarem definidos.*

❓ **P6 — Atraso**: devolver depois da data prevista gera multa? Qual valor por dia?

➡️ R$ 1,50 por dia de atraso.

---

❓ **P7 — Dia quebrado**: 6 dias e meio de atraso conta como 6 ou 7?

➡️ 6. Só dia inteiro conta.

---

❓ **P8 — Teto**: a multa cresce para sempre? Um livro esquecido dois anos gera R$ 1.095.

➡️ Teto de R$ 30,00. Acima disso é conversa no balcão, não é mais o sistema.

---

❓ **P9 — Leitor em atraso**: um leitor com empréstimo atrasado pode abrir um novo,
mesmo estando abaixo do limite de 3?

➡️ Não. Em atraso, não leva mais nada até devolver.

---

❓ **P10 — Precedência**: se um leitor está em atraso **e** já tem 3 ativos, qual erro
ele recebe? Isso muda a mensagem que o balcão lê na tela.

➡️ O atraso vem primeiro. É o problema que ele precisa resolver.

---

❓ **P11 — Renovação**: existe renovação? Quantas vezes, e a partir de qual data?

➡️ Uma vez só, somando 14 dias à data prevista atual.

---

❓ **P12 — Renovar fora de dia**: quem está atrasado pode renovar? E quem já devolveu?

➡️ Nenhum dos dois. Renovação é para quem está em dia.

---

## Rodada 3

❓ **P13 — Lançamento retroativo**: a data de retirada é sempre "agora", ou o balcão
precisa lançar empréstimo de ontem?

➡️ Precisa. Aceite data de retirada no passado.

---

❓ **P14 — Data no futuro**: e uma data de retirada no futuro, faz sentido?

➡️ Não existe. Recuse com 422.

---

❓ **P15 — Estado derivado**: "leitor bloqueado" e "multa" ficam gravados no
empréstimo, ou são calculados na hora a partir das datas? Guardar é mais rápido de ler,
mas fica errado assim que o relógio anda.

➡️ Calcule na hora. Não guarde nem bloqueio nem multa.

---

❓ **P16 — Consultas**: quais filtros a listagem precisa ter?

➡️ Por leitor e por situação (ativo/devolvido), e os dois combinados.

---

## Fronteira vazia — resumo para confirmar

1. Prazo: 14 dias corridos a partir da retirada
2. Máximo de 3 empréstimos ativos por leitor
3. Livro emprestado não empresta de novo → 409
4. Leitor ou livro inexistente → 404
5. Leitor em atraso não abre novo empréstimo → 409, e essa checagem vem **antes** do limite
6. Devolução em atraso: R$ 1,50 por dia inteiro, teto de R$ 30
7. Devolver duas vezes → 409
8. Uma renovação por empréstimo, +14 dias sobre a previsão; atrasado ou devolvido não renova
9. Data de retirada no passado é aceita; no futuro, 422
10. Bloqueio e multa são calculados, nunca gravados
11. Filtros por leitor e por situação, combináveis
12. Fora de escopo: reserva, fila, histórico, pagamento de multa, apagar empréstimo

Confirma que está tudo assim antes de eu escrever a spec?
