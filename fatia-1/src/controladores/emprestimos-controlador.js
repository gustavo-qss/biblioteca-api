import * as servico from '../servicos/emprestimos-servico.js';
import { enviarJson } from '../comum/respostas.js';

export function criar({ res, corpo }) {
  enviarJson(res, 201, servico.criar(corpo));
}
