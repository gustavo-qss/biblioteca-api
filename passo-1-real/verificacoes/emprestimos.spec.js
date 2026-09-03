import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { criarServidor } from '../src/servidor.js';
import { reiniciar as reiniciarEmprestimos } from '../src/repositorios/emprestimos-repositorio.js';
import { reiniciar as reiniciarLivros } from '../src/repositorios/livros-repositorio.js';
import { reiniciar as reiniciarLeitores } from '../src/repositorios/leitores-repositorio.js';

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

async function criarLivro(dados = {}) {
  const resposta = await fetch(`${base}/livros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: 'Dom Casmurro', autor: 'Machado de Assis', ano: 1899, ...dados }),
  });
  return await resposta.json();
}

async function criarLeitor(dados = {}) {
  const resposta = await fetch(`${base}/leitores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Ana Prado', email: 'ana@unifil.br', anoDeNascimento: 2004, ...dados }),
  });
  return await resposta.json();
}

describe('empréstimos', () => {
  it('começa com a listagem vazia', async () => {
    const resposta = await fetch(`${base}/emprestimos`);
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), []);
  });

  it('realiza um empréstimo com sucesso e marca o livro como emprestado', async () => {
    const livro = await criarLivro();
    const leitor = await criarLeitor();

    const resposta = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livroId: livro.id, leitorId: leitor.id }),
    });

    assert.equal(resposta.status, 201);
    const corpo = await resposta.json();
    assert.match(corpo.id, /^emp_[0-9a-f]{8}$/);
    assert.equal(corpo.livroId, livro.id);
    assert.equal(corpo.leitorId, leitor.id);
    assert.equal(corpo.status, 'ativo');
    assert.equal(corpo.multa, 0);

    const resLivro = await fetch(`${base}/livros/${livro.id}`);
    const livroAtualizado = await resLivro.json();
    assert.equal(livroAtualizado.emprestado, true);
  });

  it('recusa empréstimo sem livroId ou leitorId com 422', async () => {
    const leitor = await criarLeitor();
    const resposta = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leitorId: leitor.id }),
    });
    assert.equal(resposta.status, 422);
    const corpo = await resposta.json();
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('recusa empréstimo de livro inexistente com 404', async () => {
    const leitor = await criarLeitor();
    const resposta = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livroId: 'liv_00000000', leitorId: leitor.id }),
    });
    assert.equal(resposta.status, 404);
    const corpo = await resposta.json();
    assert.equal(corpo.erro.codigo, 'NAO_ENCONTRADO');
  });

  it('recusa empréstimo de leitor inexistente com 404', async () => {
    const livro = await criarLivro();
    const resposta = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livroId: livro.id, leitorId: 'lei_00000000' }),
    });
    assert.equal(resposta.status, 404);
    const corpo = await resposta.json();
    assert.equal(corpo.erro.codigo, 'NAO_ENCONTRADO');
  });

  it('recusa empréstimo de livro já emprestado com 409', async () => {
    const livro = await criarLivro();
    const leitor1 = await criarLeitor({ email: 'ana@unifil.br' });
    const leitor2 = await criarLeitor({ nome: 'Bruno Lima', email: 'bruno@unifil.br' });

    await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livroId: livro.id, leitorId: leitor1.id }),
    });

    const resposta = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livroId: livro.id, leitorId: leitor2.id }),
    });

    assert.equal(resposta.status, 409);
    const corpo = await resposta.json();
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });

  it('busca um empréstimo pelo identificador', async () => {
    const livro = await criarLivro();
    const leitor = await criarLeitor();

    const empRes = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livroId: livro.id, leitorId: leitor.id }),
    });
    const criado = await empRes.json();

    const resposta = await fetch(`${base}/emprestimos/${criado.id}`);
    assert.equal(resposta.status, 200);
    const corpo = await resposta.json();
    assert.equal(corpo.id, criado.id);
  });

  it('devolve um livro no prazo sem multa e libera o livro', async () => {
    const livro = await criarLivro();
    const leitor = await criarLeitor();

    const empRes = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livroId: livro.id, leitorId: leitor.id }),
    });
    const criado = await empRes.json();

    const resposta = await fetch(`${base}/emprestimos/${criado.id}/devolver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(resposta.status, 200);
    const corpo = await resposta.json();
    assert.equal(corpo.status, 'devolvido');
    assert.equal(corpo.multa, 0);
    assert.ok(corpo.dataDevolucao);

    const resLivro = await fetch(`${base}/livros/${livro.id}`);
    const livroAtualizado = await resLivro.json();
    assert.equal(livroAtualizado.emprestado, false);
  });

  it('devolve um livro com atraso e cobra multa', async () => {
    const livro = await criarLivro();
    const leitor = await criarLeitor();

    const dataEmprestimo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const dataDevolucaoPrevista = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString();

    const empRes = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        livroId: livro.id,
        leitorId: leitor.id,
        dataEmprestimo,
        dataDevolucaoPrevista,
      }),
    });
    const criado = await empRes.json();

    const resposta = await fetch(`${base}/emprestimos/${criado.id}/devolver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(resposta.status, 200);
    const corpo = await resposta.json();
    assert.equal(corpo.status, 'devolvido');
    assert.ok(corpo.multa > 0);
    assert.equal(corpo.diasAtraso, 13);
  });

  it('recusa devolver empréstimo já devolvido com 422', async () => {
    const livro = await criarLivro();
    const leitor = await criarLeitor();

    const empRes = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livroId: livro.id, leitorId: leitor.id }),
    });
    const criado = await empRes.json();

    await fetch(`${base}/emprestimos/${criado.id}/devolver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const resposta = await fetch(`${base}/emprestimos/${criado.id}/devolver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(resposta.status, 422);
    const corpo = await resposta.json();
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('remove um empréstimo e devolve 204 sem corpo', async () => {
    const livro = await criarLivro();
    const leitor = await criarLeitor();

    const empRes = await fetch(`${base}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livroId: livro.id, leitorId: leitor.id }),
    });
    const criado = await empRes.json();

    const resposta = await fetch(`${base}/emprestimos/${criado.id}`, { method: 'DELETE' });
    assert.equal(resposta.status, 204);
    assert.equal(await resposta.text(), '');

    const conferencia = await fetch(`${base}/emprestimos/${criado.id}`);
    assert.equal(conferencia.status, 404);
  });
});
