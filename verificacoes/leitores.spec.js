import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { criarServidor } from '../src/servidor.js';
import { reiniciar } from '../src/repositorios/leitores-repositorio.js';

let servidor;
let base;

before(async () => {
  servidor = criarServidor();
  await new Promise((resolver) => servidor.listen(0, resolver));
  base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

beforeEach(() => reiniciar());

async function criarLeitor(dados = {}) {
  const resposta = await fetch(`${base}/leitores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Ana Prado',
      email: 'ana@unifil.br',
      anoDeNascimento: 2004,
      ...dados,
    }),
  });
  return { resposta, corpo: await resposta.json() };
}

describe('leitores', () => {
  it('começa com a lista vazia', async () => {
    const resposta = await fetch(`${base}/leitores`);
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), []);
  });

  it('cria um leitor e devolve 201 com identificador prefixado', async () => {
    const { resposta, corpo } = await criarLeitor();
    assert.equal(resposta.status, 201);
    assert.match(corpo.id, /^lei_[0-9a-f]{8}$/);
    assert.ok(corpo.criadoEm);
  });

  it('recusa leitor sem nome com 422', async () => {
    const { resposta, corpo } = await criarLeitor({ nome: '' });
    assert.equal(resposta.status, 422);
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('recusa email sem arroba com 422', async () => {
    const { resposta, corpo } = await criarLeitor({ email: 'ana.unifil.br' });
    assert.equal(resposta.status, 422);
    assert.equal(corpo.erro.codigo, 'DADOS_INVALIDOS');
  });

  it('busca um leitor pelo identificador', async () => {
    const { corpo: criado } = await criarLeitor();
    const resposta = await fetch(`${base}/leitores/${criado.id}`);
    assert.equal(resposta.status, 200);
    assert.equal((await resposta.json()).nome, 'Ana Prado');
  });

  it('devolve 404 para identificador inexistente', async () => {
    const resposta = await fetch(`${base}/leitores/lei_00000000`);
    assert.equal(resposta.status, 404);
    assert.equal((await resposta.json()).erro.codigo, 'NAO_ENCONTRADO');
  });

  it('filtra a listagem por nome', async () => {
    await criarLeitor();
    await criarLeitor({ nome: 'Bruno Lima', email: 'bruno@unifil.br' });

    const resposta = await fetch(`${base}/leitores?nome=bruno`);
    const leitores = await resposta.json();
    assert.equal(leitores.length, 1);
    assert.equal(leitores[0].nome, 'Bruno Lima');
  });

  it('atualiza um leitor existente preservando id e criadoEm', async () => {
    const { corpo: criado } = await criarLeitor();
    const resposta = await fetch(`${base}/leitores/${criado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Ana Prado Vieira',
        email: 'ana.vieira@unifil.br',
        anoDeNascimento: 2004,
      }),
    });
    assert.equal(resposta.status, 200);
    const atualizado = await resposta.json();
    assert.equal(atualizado.nome, 'Ana Prado Vieira');
    assert.equal(atualizado.id, criado.id);
    assert.equal(atualizado.criadoEm, criado.criadoEm);
  });

  it('remove um leitor e devolve 204 sem corpo', async () => {
    const { corpo: criado } = await criarLeitor();
    const resposta = await fetch(`${base}/leitores/${criado.id}`, { method: 'DELETE' });
    assert.equal(resposta.status, 204);
    assert.equal(await resposta.text(), '');

    const conferencia = await fetch(`${base}/leitores/${criado.id}`);
    assert.equal(conferencia.status, 404);
  });
});
