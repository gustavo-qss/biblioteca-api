import * as controlador from '../controladores/emprestimos-controlador.js';

export const rotasEmprestimos = [
  { metodo: 'GET', padrao: /^\/emprestimos$/, manipulador: controlador.listar },
  {
    metodo: 'POST',
    padrao: /^\/emprestimos\/(?<id>[^/]+)\/devolucao$/,
    manipulador: controlador.devolver,
  },
  {
    metodo: 'POST',
    padrao: /^\/emprestimos\/(?<id>[^/]+)\/renovacao$/,
    manipulador: controlador.renovar,
  },
  { metodo: 'GET', padrao: /^\/emprestimos\/(?<id>[^/]+)$/, manipulador: controlador.buscarPorId },
  { metodo: 'POST', padrao: /^\/emprestimos$/, manipulador: controlador.criar },
];
