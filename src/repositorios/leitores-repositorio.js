import { novoIdentificador } from '../comum/identificador.js';

const leitores = new Map();

export function listar() {
  return [...leitores.values()];
}

export function buscarPorId(id) {
  return leitores.get(id) ?? null;
}

export function inserir(dados) {
  const leitor = {
    id: novoIdentificador('lei'),
    nome: dados.nome,
    email: dados.email,
    anoDeNascimento: dados.anoDeNascimento,
    criadoEm: new Date().toISOString(),
  };
  leitores.set(leitor.id, leitor);
  return leitor;
}

export function substituir(id, leitor) {
  leitores.set(id, leitor);
  return leitor;
}

export function remover(id) {
  return leitores.delete(id);
}

/** Usado apenas pelas verificações, para isolar um caso do outro. */
export function reiniciar() {
  leitores.clear();
}
