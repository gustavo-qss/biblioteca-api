import * as controlador from '../controladores/leitores-controlador.js';

export const rotasLeitores = [
  { metodo: 'GET', padrao: /^\/leitores$/, manipulador: controlador.listar },
  { metodo: 'GET', padrao: /^\/leitores\/(?<id>[^/]+)$/, manipulador: controlador.buscarPorId },
  { metodo: 'POST', padrao: /^\/leitores$/, manipulador: controlador.criar },
  { metodo: 'PUT', padrao: /^\/leitores\/(?<id>[^/]+)$/, manipulador: controlador.atualizar },
  { metodo: 'DELETE', padrao: /^\/leitores\/(?<id>[^/]+)$/, manipulador: controlador.remover },
];
