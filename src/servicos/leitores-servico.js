import * as repositorio from '../repositorios/leitores-repositorio.js';
import { dadosInvalidos, naoEncontrado } from '../comum/erros.js';

const CAMPOS_OBRIGATORIOS = ['nome', 'email', 'anoDeNascimento'];

function validar(dados) {
  for (const campo of CAMPOS_OBRIGATORIOS) {
    const valor = dados[campo];
    if (valor === undefined || valor === null || valor === '') {
      throw dadosInvalidos(`O campo "${campo}" é obrigatório.`);
    }
  }
  if (!String(dados.email).includes('@')) {
    throw dadosInvalidos('O campo "email" precisa conter "@".');
  }
  if (!Number.isInteger(dados.anoDeNascimento)) {
    throw dadosInvalidos('O campo "anoDeNascimento" precisa ser um número inteiro.');
  }
}

function exigirExistente(id) {
  const leitor = repositorio.buscarPorId(id);
  if (!leitor) {
    throw naoEncontrado(`Não existe leitor com o identificador "${id}".`);
  }
  return leitor;
}

export function listar({ nome } = {}) {
  const leitores = repositorio.listar();
  if (!nome) return leitores;
  const procurado = nome.toLowerCase();
  return leitores.filter((leitor) => leitor.nome.toLowerCase().includes(procurado));
}

export function buscarPorId(id) {
  return exigirExistente(id);
}

export function criar(dados) {
  validar(dados);
  return repositorio.inserir(dados);
}

export function atualizar(id, dados) {
  const atual = exigirExistente(id);
  validar(dados);
  return repositorio.substituir(id, {
    ...atual,
    nome: dados.nome,
    email: dados.email,
    anoDeNascimento: dados.anoDeNascimento,
  });
}

export function remover(id) {
  exigirExistente(id);
  repositorio.remover(id);
}
