import { novoIdentificador } from '../comum/identificador.js';

const emprestimos = new Map();

export function listar() {
  return [...emprestimos.values()];
}

export function buscarPorId(id) {
  return emprestimos.get(id) ?? null;
}

export function inserir(dados) {
  const emprestimo = {
    id: novoIdentificador('emp'),
    livroId: dados.livroId,
    leitorId: dados.leitorId,
    dataEmprestimo: dados.dataEmprestimo,
    dataDevolucaoPrevista: dados.dataDevolucaoPrevista,
    dataDevolucao: dados.dataDevolucao ?? null,
    status: dados.status ?? 'ativo',
    multa: dados.multa ?? 0,
    criadoEm: new Date().toISOString(),
  };
  emprestimos.set(emprestimo.id, emprestimo);
  return emprestimo;
}

export function substituir(id, emprestimo) {
  emprestimos.set(id, emprestimo);
  return emprestimo;
}

export function remover(id) {
  return emprestimos.delete(id);
}

/** Usado apenas pelas verificações, para isolar um caso do outro. */
export function reiniciar() {
  emprestimos.clear();
}
