#!/usr/bin/env bash
# Roda a suíte de aceitação de empréstimos contra um projeto.
#
#   ./aula-sdd/juiz.sh biblioteca-api            # todas as fatias
#   ./aula-sdd/juiz.sh biblioteca-api "fatia 1"  # só uma fatia
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJETO="${1:?uso: ./aula-sdd/juiz.sh <pasta-do-projeto> [filtro]}"
FILTRO="${2:-}"

cd "$RAIZ/$PROJETO"

if [ -n "$FILTRO" ]; then
  exec node --test --test-name-pattern="$FILTRO" "$RAIZ/aula-sdd/juiz/aceitacao-emprestimos.spec.js"
fi
exec node --test "$RAIZ/aula-sdd/juiz/aceitacao-emprestimos.spec.js"
