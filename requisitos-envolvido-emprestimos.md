# Solicitações do Envolvido — Empréstimos

| | |
|---|---|
| **Sistema** | Biblioteca API |
| **Envolvida** | Coordenação da Biblioteca Central — UniFil |
| **Elaborado por** | Análise de requisitos, a partir de entrevista |
| **Versão / data** | 1.0 — 03/09/2026 |

---

## 1. Finalidade

Registrar as necessidades da Coordenação da Biblioteca quanto ao controle de
empréstimos, para servir de base à especificação e ao aceite da entrega.

## 2. Descrição do envolvido

Responsável pelo atendimento no balcão e pela conservação do acervo. Não participa das
decisões técnicas; decide as regras de negócio. É quem assina o aceite.

## 3. Problema

O controle de empréstimos é feito em caderno. Não há como saber quem está em atraso
antes de o leitor chegar ao balcão, e o acervo se concentra em poucos leitores.

## 4. Necessidades

| # | Necessidade | Prioridade |
|---|---|---|
| NE-01 | Registrar retirada e devolução com prazo controlado | Alta |
| NE-02 | Impedir que um leitor concentre o acervo ou acumule atrasos | Alta |
| NE-03 | Cobrar o atraso sem que a cobrança vire um valor impagável | Média |
| NE-04 | Consultar, no balcão, a situação de um leitor | Média |

## 5. Regras de negócio

| # | Regra | Atende |
|---|---|---|
| RN-01 | O prazo de devolução é de **14 dias corridos** contados da retirada | NE-01 |
| RN-02 | Um leitor pode ter no máximo **3 empréstimos ativos** | NE-02 |
| RN-03 | Há um exemplar por título: livro emprestado não é emprestado de novo | NE-01 |
| RN-04 | Leitor com empréstimo em atraso **não retira** nada até regularizar | NE-02 |
| RN-05 | Havendo atraso e limite atingido, **o atraso é comunicado primeiro** | NE-02 |
| RN-06 | Atraso é multado em **R$ 1,50 por dia inteiro**; dia iniciado não conta | NE-03 |
| RN-07 | A multa tem **teto de R$ 30,00**; acima disso, o caso é tratado no balcão | NE-03 |
| RN-08 | Cada empréstimo pode ser renovado **uma única vez**, somando 14 dias à previsão | NE-01 |
| RN-09 | Empréstimo em atraso ou já devolvido **não pode ser renovado** | NE-01 |
| RN-10 | Um empréstimo já devolvido **não é devolvido de novo** | NE-01 |
| RN-11 | A retirada pode ser lançada com **data retroativa**; data futura é inválida | NE-01 |
| RN-12 | Bloqueio e multa são **calculados na consulta**, nunca armazenados | NE-04 |
| RN-13 | A consulta filtra por leitor e por situação (ativo/devolvido), combináveis | NE-04 |

## 6. Restrições

O aplicativo do balcão já está em produção e consome esta API. **Os nomes de campo e
os códigos de retorno não são negociáveis.**

```jsonc
// POST /emprestimos                → 201
// GET  /emprestimos                → 200   (?leitorId= e ?status= combináveis)
// GET  /emprestimos/:id            → 200
// POST /emprestimos/:id/devolucao  → 200
// POST /emprestimos/:id/renovacao  → 200
{
  "id": "emp_1a2b3c4d",          // emp_ + 8 hexadecimais
  "leitorId": "lei_...",
  "livroId": "liv_...",
  "emprestadoEm": "ISO-8601",    // opcional na entrada; padrão é agora
  "devolucaoPrevista": "ISO-8601",
  "devolvidoEm": null,           // null enquanto ativo
  "renovacoes": 0,
  "multa": 0,
  "status": "ativo"              // "ativo" | "devolvido"
}
```

| Situação | Retorno | Código |
|---|---|---|
| leitor ou livro inexistente | 404 | `NAO_ENCONTRADO` |
| RN-02, RN-03, RN-04, RN-09, RN-10 | 409 | `CONFLITO` |
| corpo inválido, data de retirada futura (RN-11) | 422 | `DADOS_INVALIDOS` |

## 7. Fora de escopo

Reserva e fila de espera; histórico do leitor; registro de pagamento de multa;
exclusão de empréstimo.

## 8. Critérios de aceitação do envolvido

A entrega é aceita quando cada regra da seção 5 puder ser demonstrada no balcão, sem
esperar o prazo real transcorrer e sem leitura de código-fonte.

---

### Nota do professor — como usar isto no Passo 2

Este documento **existe** e o agente **não o tem**. É essa a aula.

Você responde a entrevista lendo daqui: curto, decidido, uma regra por resposta. Se a
recomendação do agente bater com a regra, "isso mesmo" basta.

- **Não projete e não leia em voz alta antes de ele perguntar.**
- A seção 6 só sai quando ele perguntar sobre nomes de campo ou status.
- Pergunta fora da lista: decida na hora e siga; vira contrato do mesmo jeito.
- Regra que ele **não** perguntar: deixe passar. O juiz reprova depois, e aí vale a
  frase — *"ele não errou, ele decidiu; e decidiu sozinho porque eu não fui perguntada."*
