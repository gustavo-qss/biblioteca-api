import * as servico from '../servicos/emprestimos-servico.js';
import { enviarJson } from '../comum/respostas.js';

export function listar({ res, consulta }) {
  const emprestimos = servico.listar({
    leitorId: consulta.get('leitorId'),
    livroId: consulta.get('livroId'),
    status: consulta.get('status'),
  });
  enviarJson(res, 200, emprestimos);
}

export function buscarPorId({ res, parametros }) {
  enviarJson(res, 200, servico.buscarPorId(parametros.id));
}

export function criar({ res, corpo }) {
  enviarJson(res, 201, servico.criar(corpo));
}

export function devolver({ res, parametros, corpo }) {
  enviarJson(res, 200, servico.devolver(parametros.id, corpo));
}

export function remover({ res, parametros }) {
  servico.remover(parametros.id);
  enviarJson(res, 204, null);
}
