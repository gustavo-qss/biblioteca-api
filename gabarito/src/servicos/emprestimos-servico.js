import * as repositorio from '../repositorios/emprestimos-repositorio.js';
import * as livros from '../repositorios/livros-repositorio.js';
import * as leitores from '../repositorios/leitores-repositorio.js';
import { conflito, dadosInvalidos, naoEncontrado } from '../comum/erros.js';

const DIA = 24 * 60 * 60 * 1000;
const DIAS_DE_PRAZO = 14;
const LIMITE_DE_ATIVOS = 3;
const MAXIMO_DE_RENOVACOES = 1;
const MULTA_POR_DIA = 1.5;
const TETO_DA_MULTA = 30;

function somarDias(iso, dias) {
  return new Date(new Date(iso).getTime() + dias * DIA).toISOString();
}

function estaAtrasado(emprestimo, referencia = new Date()) {
  return emprestimo.status === 'ativo' && new Date(emprestimo.devolucaoPrevista) < referencia;
}

function ativosDoLeitor(leitorId) {
  return repositorio.listar().filter((e) => e.leitorId === leitorId && e.status === 'ativo');
}

function exigirExistente(id) {
  const emprestimo = repositorio.buscarPorId(id);
  if (!emprestimo) {
    throw naoEncontrado(`Não existe empréstimo com o identificador "${id}".`);
  }
  return emprestimo;
}

/** R10: data opcional, sempre no passado. */
function resolverDataDeEmprestimo(informada) {
  if (informada === undefined || informada === null || informada === '') {
    return new Date().toISOString();
  }
  const data = new Date(informada);
  if (Number.isNaN(data.getTime())) {
    throw dadosInvalidos('O campo "emprestadoEm" precisa ser uma data ISO 8601 válida.');
  }
  if (data.getTime() > Date.now()) {
    throw dadosInvalidos('O campo "emprestadoEm" não pode estar no futuro.');
  }
  return data.toISOString();
}

function marcarLivro(livroId, emprestado) {
  const livro = livros.buscarPorId(livroId);
  if (livro) livros.substituir(livroId, { ...livro, emprestado });
}

export function listar({ leitorId, status } = {}) {
  return repositorio.listar().filter((emprestimo) => {
    if (leitorId && emprestimo.leitorId !== leitorId) return false;
    if (status && emprestimo.status !== status) return false;
    return true;
  });
}

export function buscarPorId(id) {
  return exigirExistente(id);
}

export function criar(dados) {
  for (const campo of ['leitorId', 'livroId']) {
    if (!dados[campo]) throw dadosInvalidos(`O campo "${campo}" é obrigatório.`);
  }

  // R2
  if (!leitores.buscarPorId(dados.leitorId)) {
    throw naoEncontrado(`Não existe leitor com o identificador "${dados.leitorId}".`);
  }
  if (!livros.buscarPorId(dados.livroId)) {
    throw naoEncontrado(`Não existe livro com o identificador "${dados.livroId}".`);
  }

  const emprestadoEm = resolverDataDeEmprestimo(dados.emprestadoEm);
  const ativos = ativosDoLeitor(dados.leitorId);

  // R5 vem antes da R4.
  if (ativos.some((emprestimo) => estaAtrasado(emprestimo))) {
    throw conflito('O leitor tem empréstimo em atraso e não pode abrir outro.');
  }
  // R4
  if (ativos.length >= LIMITE_DE_ATIVOS) {
    throw conflito(`O leitor já tem ${LIMITE_DE_ATIVOS} empréstimos ativos.`);
  }
  // R3
  const emprestado = repositorio
    .listar()
    .some((emprestimo) => emprestimo.livroId === dados.livroId && emprestimo.status === 'ativo');
  if (emprestado) {
    throw conflito('O livro já está emprestado.');
  }

  const emprestimo = repositorio.inserir({
    leitorId: dados.leitorId,
    livroId: dados.livroId,
    emprestadoEm,
    devolucaoPrevista: somarDias(emprestadoEm, DIAS_DE_PRAZO), // R1
  });
  marcarLivro(dados.livroId, true);
  return emprestimo;
}

/** R7: dias inteiros de atraso, 1,50 por dia, com teto. */
function calcularMulta(devolucaoPrevista, devolvidoEm) {
  const atraso = new Date(devolvidoEm).getTime() - new Date(devolucaoPrevista).getTime();
  if (atraso <= 0) return 0;
  const dias = Math.floor(atraso / DIA);
  return Math.round(Math.min(dias * MULTA_POR_DIA, TETO_DA_MULTA) * 100) / 100;
}

export function devolver(id) {
  const atual = exigirExistente(id);
  if (atual.status === 'devolvido') {
    throw conflito('Este empréstimo já foi devolvido.');
  }

  const devolvidoEm = new Date().toISOString();
  marcarLivro(atual.livroId, false);

  return repositorio.substituir(id, {
    ...atual,
    status: 'devolvido',
    devolvidoEm,
    multa: calcularMulta(atual.devolucaoPrevista, devolvidoEm),
  });
}

export function renovar(id) {
  const atual = exigirExistente(id);
  if (atual.status === 'devolvido') {
    throw conflito('Um empréstimo devolvido não pode ser renovado.');
  }
  if (estaAtrasado(atual)) {
    throw conflito('Um empréstimo em atraso não pode ser renovado.');
  }
  if (atual.renovacoes >= MAXIMO_DE_RENOVACOES) {
    throw conflito('Este empréstimo já foi renovado.');
  }

  return repositorio.substituir(id, {
    ...atual,
    renovacoes: atual.renovacoes + 1,
    devolucaoPrevista: somarDias(atual.devolucaoPrevista, DIAS_DE_PRAZO),
  });
}
