import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { criarServidor } from '../src/servidor.js';
import { reiniciar as reiniciarEmprestimos } from '../src/repositorios/emprestimos-repositorio.js';
import { reiniciar as reiniciarLivros } from '../src/repositorios/livros-repositorio.js';
import { reiniciar as reiniciarLeitores } from '../src/repositorios/leitores-repositorio.js';

const DIA = 24 * 60 * 60 * 1000;

let servidor;
let base;

before(async () => {
  servidor = criarServidor();
  await new Promise((resolver) => servidor.listen(0, resolver));
  base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

beforeEach(() => {
  reiniciarEmprestimos();
  reiniciarLivros();
  reiniciarLeitores();
});

async function post(caminho, corpo) {
  const resposta = await fetch(`${base}${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo ?? {}),
  });
  const texto = await resposta.text();
  return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
}

async function get(caminho) {
  const resposta = await fetch(`${base}${caminho}`);
  return { status: resposta.status, corpo: await resposta.json() };
}

async function novoLeitor() {
  const { corpo } = await post('/leitores', {
    nome: 'Ana Prado',
    email: `ana${Math.random().toString(16).slice(2, 8)}@unifil.br`,
    anoDeNascimento: 2004,
  });
  return corpo.id;
}

async function novoLivro() {
  const { corpo } = await post('/livros', {
    titulo: 'Dom Casmurro',
    autor: 'Machado de Assis',
    ano: 1899,
  });
  return corpo.id;
}

async function abrir({ leitorId, livroId, emprestadoEm } = {}) {
  const dados = { leitorId: leitorId ?? (await novoLeitor()), livroId: livroId ?? (await novoLivro()) };
  if (emprestadoEm) dados.emprestadoEm = emprestadoEm;
  return post('/emprestimos', dados);
}

function emDias(depois, antes) {
  return (new Date(depois).getTime() - new Date(antes).getTime()) / DIA;
}

describe('emprestimos', () => {
  it('R1 abre com 201, identificador prefixado e prazo de 14 dias', async () => {
    const { status, corpo } = await abrir();
    assert.equal(status, 201);
    assert.match(corpo.id, /^emp_[0-9a-f]{8}$/);
    assert.equal(corpo.status, 'ativo');
    assert.equal(corpo.devolvidoEm, null);
    assert.equal(corpo.renovacoes, 0);
    assert.equal(corpo.multa, 0);
    assert.equal(emDias(corpo.devolucaoPrevista, corpo.emprestadoEm), 14);
  });

  it('R3 marca o livro como emprestado', async () => {
    const livroId = await novoLivro();
    await abrir({ livroId });
    assert.equal((await get(`/livros/${livroId}`)).corpo.emprestado, true);
  });

  it('R3 recusa livro já emprestado com 409', async () => {
    const livroId = await novoLivro();
    await abrir({ livroId });
    const { status, corpo } = await abrir({ livroId });
    assert.equal(status, 409);
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });

  it('R2 recusa leitor inexistente com 404', async () => {
    const { status, corpo } = await abrir({ leitorId: 'lei_00000000' });
    assert.equal(status, 404);
    assert.equal(corpo.erro.codigo, 'NAO_ENCONTRADO');
  });

  it('R2 recusa livro inexistente com 404', async () => {
    const { status, corpo } = await abrir({ livroId: 'liv_00000000' });
    assert.equal(status, 404);
    assert.equal(corpo.erro.codigo, 'NAO_ENCONTRADO');
  });

  it('R4 recusa o quarto empréstimo ativo do mesmo leitor com 409', async () => {
    const leitorId = await novoLeitor();
    for (let i = 0; i < 3; i += 1) {
      assert.equal((await abrir({ leitorId })).status, 201);
    }
    const { status, corpo } = await abrir({ leitorId });
    assert.equal(status, 409);
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });
});
