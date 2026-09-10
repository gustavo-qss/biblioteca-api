#!/usr/bin/env bash
# Leva o projeto ao estado do FIM de um passo da aula — sem prompt, sem token.
# Cada passo é absoluto: dá para pular, voltar e repetir em qualquer ordem.
#
#   ./aula-sdd/passo.sh 0     antes da aula: sem empréstimos, sem spec, sem auditor
#   ./aula-sdd/passo.sh 1     a entrega que passa (o prompt sem spec)
#   ./aula-sdd/passo.sh 2     a entrevista (nenhum arquivo muda; mostra o resumo)
#   ./aula-sdd/passo.sh 3     a spec
#   ./aula-sdd/passo.sh 4a    TDD, só a fatia 1
#   ./aula-sdd/passo.sh 4     TDD, as fatias restantes
#   ./aula-sdd/passo.sh 5     o auditor
#
# Segundo argumento opcional: a pasta do projeto (padrão: biblioteca-api).
set -euo pipefail

# Estes scripts se localizam sozinhos: a pasta pode ter o nome que for.
AULA="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAIZ="$(cd "$AULA/.." && pwd)"
PASSO="${1:?uso: ./aula-sdd/passo.sh <0|1|2|3|4a|4|5> [pasta-do-projeto]}"
PROJETO="${2:-biblioteca-api}"
DESTINO="$RAIZ/$PROJETO"
SPEC="$DESTINO/spec-emprestimos.md"
TESTES="$DESTINO/verificacoes/emprestimos.spec.js"

[ -f "$DESTINO/src/servidor.js" ] || {
  echo "não achei o projeto: $DESTINO/src/servidor.js não existe"
  echo
  echo "  material da aula em:  $AULA"
  echo "  pastas ao lado dele:"
  ls -1 "$RAIZ" 2> /dev/null | sed 's/^/    /'
  echo
  echo "  uso: ./passo.sh <0|1|2|3|4a|4|5> [pasta-do-projeto]"
  exit 1
}

# ── peças do estado ──────────────────────────────────────────────────────────

codigo() { "$AULA/instalar.sh" "$1" "$PROJETO" > /dev/null; }

spec() {
  if [ "$1" = com ]; then cp "$AULA/spec-emprestimos.md" "$SPEC"; else rm -f "$SPEC"; fi
}

auditor() {
  if [ "$1" = com ]; then
    mkdir -p "$DESTINO/.opencode/agent"
    cp "$AULA/agente/auditor.md" "$DESTINO/.opencode/agent/"
  else
    rm -f "$DESTINO/.opencode/agent/auditor.md"
    rmdir "$DESTINO/.opencode/agent" 2> /dev/null || true
  fi
}

# ── o que aparece na tela ────────────────────────────────────────────────────

titulo() { printf '\n\033[1m%s\033[0m\n' "$1"; }
secao()  { printf '\n\033[1m── %s\033[0m\n' "$1"; }
mexe()   { printf '   %s\n' "$@"; }

resumo() { awk '/^ℹ pass/ { p = $3 } /^ℹ fail/ { f = $3 } END { printf "pass %s · fail %s", p, f }'; }

placar() {
  local testes juiz
  testes=$({ cd "$DESTINO" && npm test 2>&1 || true; } | resumo)
  juiz=$({ "$AULA/juiz.sh" "$PROJETO" 2>&1 || true; } | resumo)
  secao "placar"
  printf '   npm test          %s\n' "$testes"
  if [ "${1:-}" = fatia1 ]; then
    printf '   juiz "fatia 1"    %s\n' "$({ "$AULA/juiz.sh" "$PROJETO" "fatia 1" 2>&1 || true; } | resumo)"
  fi
  printf '   juiz              %s\n' "$juiz"
}

proximo() { printf '\n   próximo: %s %s\n\n' "$0" "$1"; }

# ── os passos ────────────────────────────────────────────────────────────────

case "$PASSO" in
  0)
    codigo limpar; spec sem; auditor sem
    titulo "Passo 0 — antes da aula"
    secao "skills do projeto"
    ls "$DESTINO/.opencode/skills" | sed 's/^/   /'
    secao "o que NÃO pode existir ainda"
    printf '   .opencode/agent/     %s\n' "$([ -d "$DESTINO/.opencode/agent" ] && echo EXISTE || echo 'não existe ✓')"
    printf '   spec-emprestimos.md  %s\n' "$([ -f "$SPEC" ] && echo EXISTE || echo 'não existe ✓')"
    placar
    proximo 1
    ;;

  1)
    codigo passo-1-real; spec sem; auditor sem
    titulo "Passo 1 — a entrega que passa"
    secao "o prompt"
    mexe "Implemente o recurso de empréstimos de livros na Biblioteca API." \
         "Um leitor pega um livro emprestado e depois devolve." \
         "Cobre multa por atraso."
    secao "o que o agente escreveu"
    mexe "+ src/{repositorios,servicos,controladores,rotas}/emprestimos-*.js" \
         "+ verificacoes/emprestimos.spec.js" \
         "~ src/servidor.js   (registro das rotas)"
    placar
    printf '\n   verde no npm test, vermelho no juiz: ele não errou, ele decidiu.\n'
    proximo 2
    ;;

  2)
    codigo passo-1-real; spec sem; auditor sem
    titulo "Passo 2 — a entrevista"
    mexe "nenhum arquivo muda neste passo: o produto é a conversa."
    secao "o resumo que o grilling devolve no fim"
    sed -n '/^## Fronteira vazia/,$p' "$AULA/fallbacks/rodadas-grilling.md" | sed '1,2d; s/\*\*//g; /^$/d; s/^/   /'
    printf '\n   as rodadas completas: %s\n' "$AULA/fallbacks/rodadas-grilling.md"
    proximo 3
    ;;

  3)
    codigo passo-1-real; spec com; auditor sem
    titulo "Passo 3 — a conversa vira contrato"
    secao "o que o to-spec escreveu"
    mexe "+ spec-emprestimos.md"
    secao "as regras numeradas"
    grep -E '^\*\*R[0-9]+ ' "$SPEC" | sed -E 's/^\*\*(R[0-9]+) — ([^*]+)\*\*.*/   \1  \2/'
    secao "as seções"
    grep -E '^## ' "$SPEC" | sed 's/^## /   /'
    printf '\n   o código ainda é o do passo 1 — a spec sozinha não muda o placar.\n'
    proximo 4a
    ;;

  4a)
    codigo fatia-1; spec com; auditor sem
    titulo "Passo 4 — TDD, só a fatia 1"
    secao "o que o tdd escreveu"
    mexe "~ src/…/emprestimos-*.js         só o POST /emprestimos (R1 R2 R3 R4 R10)" \
         "~ verificacoes/emprestimos.spec.js"
    secao "os testes, um por vez"
    grep -E "^  it\('" "$TESTES" | sed -E "s/^  it\('([^']+)'.*/   \1/"
    placar fatia1
    printf '\n   a fatia 1 fecha verde; as outras 4 fatias do juiz continuam vermelhas.\n'
    proximo 4
    ;;

  4)
    codigo gabarito; spec com; auditor sem
    titulo "Passo 4 — as fatias restantes"
    secao "o que o tdd escreveu"
    mexe "~ src/…/emprestimos-*.js         devolução, multa, renovação, consulta" \
         "~ verificacoes/emprestimos.spec.js"
    secao "git diff verificacoes/  (fatia 1 → todas)"
    local_diff=$(diff "$AULA/fatia-1/verificacoes/emprestimos.spec.js" "$TESTES" || true)
    printf '   linhas acrescentadas   %s\n' "$(grep -c '^>' <<< "$local_diff" || true)"
    printf '   linhas removidas       %s   ← nenhum teste antigo foi tocado\n' "$(grep -c '^<' <<< "$local_diff" || true)"
    placar
    printf '\n   sem spec: npm test 30/30 · juiz  4/13\n'
    printf '   com spec: npm test 33/33 · juiz 13/13\n'
    proximo 5
    ;;

  5)
    codigo gabarito; spec com; auditor com
    titulo "Passo 5 — o auditor"
    secao "o que o novo-subagente escreveu"
    mexe "+ .opencode/agent/auditor.md"
    secao "o frontmatter"
    sed -n '2,/^---$/p' "$DESTINO/.opencode/agent/auditor.md" | sed '$d; s/^/   /'
    if command -v opencode > /dev/null; then
      secao "opencode debug agent auditor  (sem token)"
      (cd "$DESTINO" && opencode debug agent auditor 2>&1) \
        | grep -E '"(mode|write|edit|patch|task)": ' | sed -E 's/^ +/   /; s/,$//' || true
    fi
    secao "regra → teste que a comprova  (por nome de teste)"
    for regra in $(grep -oE '^\*\*R[0-9]+' "$SPEC" | tr -d '*'); do
      linhas=$(grep -nE "^  it\('$regra " "$TESTES" | cut -d: -f1 | paste -sd, || true)
      if [ -n "$linhas" ]; then
        printf '   %-4s linha %s\n' "$regra" "$linhas"
      else
        printf '   %-4s \033[1mSEM PROVA\033[0m\n' "$regra"
      fi
    done
    printf '\n   13/13 no juiz, verde no npm test — e a R10 (data no futuro → 422)\n'
    printf '   está no código sem nenhum teste. É isso que o @auditor tem que achar.\n'
    printf '   (esta tabela é um grep; o parecer de verdade vem de rodar o @auditor.)\n\n'
    ;;

  *)
    echo "passo desconhecido: $PASSO  (use 0, 1, 2, 3, 4a, 4 ou 5)"
    exit 1
    ;;
esac
