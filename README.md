# Material do professor — aula de spec, TDD e subagente

**Esta branch não vai para o aluno.** Ela contém o juiz, o gabarito e o documento de
requisitos que o agente não pode ler durante a aula.

## Montar em outra máquina

```bash
mkdir flex_ia && cd flex_ia
git clone -b aula/estado-inicial     https://github.com/gustavo-qss/biblioteca-api.git biblioteca-api
git clone -b aula/material-professor https://github.com/gustavo-qss/biblioteca-api.git aula-sdd
cd biblioteca-api && npm test        # 19/19
```

Os dois precisam ficar lado a lado, com estes nomes — `instalar.sh` e `juiz.sh`
resolvem o projeto como irmão da própria pasta.

O OpenCode abre em `biblioteca-api/`. Tudo daqui fica fora do alcance dele.

## O que é cada coisa

| | |
|---|---|
| `comandos-da-aula.md` | **comece por aqui** — todos os comandos e checkpoints em ordem |
| `passo.sh` | leva o projeto ao fim de cada passo, sem prompt: `0 1 2 3 4a 4 5` |
| `roteiro-aula-sdd-tdd-subagente.md` | o roteiro completo, com as falas |
| `requisitos-envolvido-emprestimos.md` | o que você responde na entrevista do Passo 2 — **não projetar** |
| `juiz.sh` · `juiz/` | a suíte de aceitação do cliente, só HTTP |
| `instalar.sh` | troca o estado do projeto em um comando |
| `passo-1-real/` | a entrega que o agente fez sem spec (30/30 no `npm test`, 4/13 no juiz) |
| `fatia-1/` | só a fatia 1, via TDD (25/25 no `npm test`, 5/5 na fatia 1 do juiz) |
| `gabarito/` | a implementação correta (33/33 e 13/13) |
| `spec-emprestimos.md` | rede se o `to-spec` sair ruim |
| `agente/auditor.md` | rede se o `novo-subagente` sair ruim |
| `fallbacks/rodadas-grilling.md` | rede se a entrevista travar |
| `aula-sdd-enunciado-classroom.txt` | a atividade, para colar no Classroom |

## Comandos

```bash
./passo.sh <0|1|2|3|4a|4|5>            # estado pronto do fim de cada passo
./juiz.sh biblioteca-api              # todas as fatias
./juiz.sh biblioteca-api "fatia 1"    # uma fatia
./instalar.sh <passo-1-real|fatia-1|gabarito|limpar> biblioteca-api
```

*(rodando de `flex_ia/`, use `./aula-sdd/juiz.sh …`)*
