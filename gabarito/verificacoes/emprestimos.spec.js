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

function diasAtras(dias) {
  return new Date(Date.now() - dias * DIA - 12 * 60 * 60 * 1000).toISOString();
}

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

  it('R5 recusa leitor em atraso mesmo com um só empréstimo ativo', async () => {
    const leitorId = await novoLeitor();
    await abrir({ leitorId, emprestadoEm: diasAtras(20) });
    const { status, corpo } = await abrir({ leitorId });
    assert.equal(status, 409);
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });

  it('R6 devolve no prazo, libera o livro e não cobra multa', async () => {
    const livroId = await novoLivro();
    const { corpo: emprestimo } = await abrir({ livroId });
    const { status, corpo } = await post(`/emprestimos/${emprestimo.id}/devolucao`);
    assert.equal(status, 200);
    assert.equal(corpo.status, 'devolvido');
    assert.ok(corpo.devolvidoEm);
    assert.equal(corpo.multa, 0);
    assert.equal((await get(`/livros/${livroId}`)).corpo.emprestado, false);
  });

  it('R7 cobra 1,50 por dia inteiro de atraso', async () => {
    const { corpo: emprestimo } = await abrir({ emprestadoEm: diasAtras(20) });
    const { corpo } = await post(`/emprestimos/${emprestimo.id}/devolucao`);
    assert.equal(corpo.multa, 9);
  });

  it('R7 limita a multa em 30', async () => {
    const { corpo: emprestimo } = await abrir({ emprestadoEm: diasAtras(100) });
    const { corpo } = await post(`/emprestimos/${emprestimo.id}/devolucao`);
    assert.equal(corpo.multa, 30);
  });

  it('R6 recusa devolver duas vezes com 409', async () => {
    const { corpo: emprestimo } = await abrir();
    await post(`/emprestimos/${emprestimo.id}/devolucao`);
    const { status, corpo } = await post(`/emprestimos/${emprestimo.id}/devolucao`);
    assert.equal(status, 409);
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });

  it('R8 renova uma vez e recusa a segunda com 409', async () => {
    const { corpo: emprestimo } = await abrir();
    const primeira = await post(`/emprestimos/${emprestimo.id}/renovacao`);
    assert.equal(primeira.status, 200);
    assert.equal(primeira.corpo.renovacoes, 1);
    assert.equal(emDias(primeira.corpo.devolucaoPrevista, emprestimo.emprestadoEm), 28);

    const segunda = await post(`/emprestimos/${emprestimo.id}/renovacao`);
    assert.equal(segunda.status, 409);
  });

  it('R8 recusa renovar empréstimo em atraso com 409', async () => {
    const { corpo: emprestimo } = await abrir({ emprestadoEm: diasAtras(20) });
    const { status } = await post(`/emprestimos/${emprestimo.id}/renovacao`);
    assert.equal(status, 409);
  });

  it('R9 filtra a listagem por leitorId e por status', async () => {
    const leitorId = await novoLeitor();
    const { corpo: primeiro } = await abrir({ leitorId });
    await abrir({ leitorId });
    await post(`/emprestimos/${primeiro.id}/devolucao`);

    assert.equal((await get(`/emprestimos?leitorId=${leitorId}`)).corpo.length, 2);
    const ativos = await get(`/emprestimos?leitorId=${leitorId}&status=ativo`);
    assert.equal(ativos.corpo.length, 1);
    assert.equal(ativos.corpo[0].status, 'ativo');
  });
});
