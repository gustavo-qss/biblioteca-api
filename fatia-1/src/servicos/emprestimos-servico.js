import * as repositorio from '../repositorios/emprestimos-repositorio.js';
import * as livros from '../repositorios/livros-repositorio.js';
import * as leitores from '../repositorios/leitores-repositorio.js';
import { conflito, dadosInvalidos, naoEncontrado } from '../comum/erros.js';

const DIA = 24 * 60 * 60 * 1000;
const DIAS_DE_PRAZO = 14;
const LIMITE_DE_ATIVOS = 3;

function somarDias(iso, dias) {
  return new Date(new Date(iso).getTime() + dias * DIA).toISOString();
}

function ativosDoLeitor(leitorId) {
  return repositorio.listar().filter((e) => e.leitorId === leitorId && e.status === 'ativo');
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

  // R4
  if (ativosDoLeitor(dados.leitorId).length >= LIMITE_DE_ATIVOS) {
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
