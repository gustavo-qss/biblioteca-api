import * as repositorio from '../repositorios/emprestimos-repositorio.js';
import * as livrosServico from './livros-servico.js';
import * as leitoresServico from './leitores-servico.js';
import * as livrosRepositorio from '../repositorios/livros-repositorio.js';
import { dadosInvalidos, naoEncontrado, conflito } from '../comum/erros.js';

function calcularDevolucaoPrevista(dataBase, dias = 7) {
  const d = new Date(dataBase);
  if (isNaN(d.getTime())) {
    throw dadosInvalidos('A data de empréstimo é inválida.');
  }
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

function exigirExistente(id) {
  const emprestimo = repositorio.buscarPorId(id);
  if (!emprestimo) {
    throw naoEncontrado(`Não existe empréstimo com o identificador "${id}".`);
  }
  return emprestimo;
}

export function listar({ leitorId, livroId, status } = {}) {
  let lista = repositorio.listar();
  if (leitorId) {
    lista = lista.filter((e) => e.leitorId === leitorId);
  }
  if (livroId) {
    lista = lista.filter((e) => e.livroId === livroId);
  }
  if (status) {
    lista = lista.filter((e) => e.status === status);
  }
  return lista;
}

export function buscarPorId(id) {
  return exigirExistente(id);
}

export function criar(dados) {
  if (!dados.livroId) {
    throw dadosInvalidos('O campo "livroId" é obrigatório.');
  }
  if (!dados.leitorId) {
    throw dadosInvalidos('O campo "leitorId" é obrigatório.');
  }

  const livro = livrosServico.buscarPorId(dados.livroId);
  if (livro.emprestado) {
    throw conflito('O livro já está emprestado.');
  }

  leitoresServico.buscarPorId(dados.leitorId);

  const dataEmprestimo = dados.dataEmprestimo ?? dados.emprestadoEm ?? new Date().toISOString();
  const prazoDias = Number.isInteger(dados.prazoDias) ? dados.prazoDias : 7;
  const dataDevolucaoPrevista = dados.dataDevolucaoPrevista ?? dados.prazo ?? calcularDevolucaoPrevista(dataEmprestimo, prazoDias);

  const emprestimo = repositorio.inserir({
    livroId: dados.livroId,
    leitorId: dados.leitorId,
    dataEmprestimo,
    dataDevolucaoPrevista,
    dataDevolucao: null,
    status: 'ativo',
    multa: 0,
  });

  livrosRepositorio.substituir(livro.id, { ...livro, emprestado: true });

  return emprestimo;
}

export function devolver(id, dados = {}) {
  const emprestimo = exigirExistente(id);
  if (emprestimo.status === 'devolvido' || emprestimo.dataDevolucao !== null) {
    throw dadosInvalidos('Este empréstimo já foi devolvido.');
  }

  const dataDevolucao = dados.dataDevolucao ?? dados.devolvidoEm ?? new Date().toISOString();
  const dataDev = new Date(dataDevolucao);
  if (isNaN(dataDev.getTime())) {
    throw dadosInvalidos('A data de devolução é inválida.');
  }

  const dataPrev = new Date(emprestimo.dataDevolucaoPrevista);

  let diasAtraso = 0;
  let multa = 0;

  if (dataDev > dataPrev) {
    const diffTime = dataDev.getTime() - dataPrev.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    diasAtraso = diffDays > 0 ? diffDays : 0;
    const taxaMultaPorDia = 2.00;
    multa = Number((diasAtraso * taxaMultaPorDia).toFixed(2));
  }

  const atualizado = repositorio.substituir(id, {
    ...emprestimo,
    dataDevolucao,
    status: 'devolvido',
    multa,
    diasAtraso,
  });

  const livro = livrosRepositorio.buscarPorId(emprestimo.livroId);
  if (livro) {
    livrosRepositorio.substituir(livro.id, { ...livro, emprestado: false });
  }

  return atualizado;
}

export function remover(id) {
  const emprestimo = exigirExistente(id);
  if (emprestimo.status === 'ativo') {
    const livro = livrosRepositorio.buscarPorId(emprestimo.livroId);
    if (livro) {
      livrosRepositorio.substituir(livro.id, { ...livro, emprestado: false });
    }
  }
  repositorio.remover(id);
}
