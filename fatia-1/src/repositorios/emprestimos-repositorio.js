import { novoIdentificador } from '../comum/identificador.js';

const emprestimos = new Map();

export function listar() {
  return [...emprestimos.values()];
}

export function inserir(dados) {
  const emprestimo = {
    id: novoIdentificador('emp'),
    leitorId: dados.leitorId,
    livroId: dados.livroId,
    emprestadoEm: dados.emprestadoEm,
    devolucaoPrevista: dados.devolucaoPrevista,
    devolvidoEm: null,
    renovacoes: 0,
    status: 'ativo',
    multa: 0,
  };
  emprestimos.set(emprestimo.id, emprestimo);
  return emprestimo;
}

/** Usado apenas pelas verificações, para isolar um caso do outro. */
export function reiniciar() {
  emprestimos.clear();
}
