#!/usr/bin/env bash
# Instala um estado de empréstimos pronto num projeto — rede de segurança da aula.
#
#   ./aula-sdd/instalar.sh gabarito biblioteca-api        # implementação correta
#   ./aula-sdd/instalar.sh passo-1-real biblioteca-api    # o que o prompt sem spec gerou
#   ./aula-sdd/instalar.sh fatia-1 biblioteca-api         # só a fatia 1, via TDD
#   ./aula-sdd/instalar.sh limpar biblioteca-api          # volta ao estado sem empréstimos
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORIGEM="${1:?uso: ./aula-sdd/instalar.sh <passo-1-real|fatia-1|gabarito|limpar> <pasta-do-projeto>}"
PROJETO="${2:?uso: ./aula-sdd/instalar.sh <passo-1-real|fatia-1|gabarito|limpar> <pasta-do-projeto>}"
DESTINO="$RAIZ/$PROJETO"

[ -f "$DESTINO/src/servidor.js" ] || { echo "não achei $DESTINO/src/servidor.js"; exit 1; }

limpar() {
  rm -f "$DESTINO"/src/{repositorios,servicos,controladores,rotas}/emprestimos-*.js
  rm -f "$DESTINO"/verificacoes/emprestimos.spec.js
  sed -i "/emprestimos-rotas.js/d" "$DESTINO/src/servidor.js"
  sed -i "s|, \.\.\.rotasEmprestimos||" "$DESTINO/src/servidor.js"
}

limpar

if [ "$ORIGEM" = "limpar" ]; then
  echo "empréstimos removidos de $PROJETO."
  exit 0
fi

[ -d "$RAIZ/aula-sdd/$ORIGEM" ] || { echo "não existe aula-sdd/$ORIGEM"; exit 1; }

cp -r "$RAIZ/aula-sdd/$ORIGEM/src/." "$DESTINO/src/"
[ -d "$RAIZ/aula-sdd/$ORIGEM/verificacoes" ] && cp -r "$RAIZ/aula-sdd/$ORIGEM/verificacoes/." "$DESTINO/verificacoes/"

# Registro nos dois lugares do servidor.js, como manda a skill novo-recurso.
sed -i "s|import { rotasLeitores } from './rotas/leitores-rotas.js';|import { rotasLeitores } from './rotas/leitores-rotas.js';\nimport { rotasEmprestimos } from './rotas/emprestimos-rotas.js';|" "$DESTINO/src/servidor.js"
sed -i "s|const rotas = \[\.\.\.rotasLivros, \.\.\.rotasLeitores\];|const rotas = [...rotasLivros, ...rotasLeitores, ...rotasEmprestimos];|" "$DESTINO/src/servidor.js"

echo "$ORIGEM instalado em $PROJETO."
