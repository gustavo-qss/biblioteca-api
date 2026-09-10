#!/usr/bin/env bash
# Roda a suíte de aceitação de empréstimos contra um projeto.
#
#   ./aula-sdd/juiz.sh biblioteca-api            # todas as fatias
#   ./aula-sdd/juiz.sh biblioteca-api "fatia 1"  # só uma fatia
set -euo pipefail

# Estes scripts se localizam sozinhos: a pasta pode ter o nome que for.
AULA="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAIZ="$(cd "$AULA/.." && pwd)"
PROJETO="${1:-biblioteca-api}"
DESTINO="$RAIZ/$PROJETO"
FILTRO="${2:-}"

[ -f "$DESTINO/src/servidor.js" ] || {
  echo "não achei o projeto: $DESTINO/src/servidor.js não existe"
  echo
  echo "  material da aula em:  $AULA"
  echo "  pastas ao lado dele:"
  ls -1 "$RAIZ" 2> /dev/null | sed 's/^/    /'
  echo
  echo "  uso: ./juiz.sh [pasta-do-projeto] [filtro]"
  exit 1
}

cd "$DESTINO"

if [ -n "$FILTRO" ]; then
  exec node --test --test-name-pattern="$FILTRO" "$AULA/juiz/aceitacao-emprestimos.spec.js"
fi
exec node --test "$AULA/juiz/aceitacao-emprestimos.spec.js"
