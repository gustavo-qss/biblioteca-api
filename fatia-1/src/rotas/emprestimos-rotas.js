import * as controlador from '../controladores/emprestimos-controlador.js';

export const rotasEmprestimos = [
  { metodo: 'POST', padrao: /^\/emprestimos$/, manipulador: controlador.criar },
];
