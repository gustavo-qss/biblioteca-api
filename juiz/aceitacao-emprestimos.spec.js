/**
 * Suíte de aceitação de `emprestimos` — o juiz da spec.
 *
 * Conversa com a API só por HTTP. Não importa nada de `src/` além de
 * `criarServidor()`, e não sabe como o recurso foi implementado por dentro.
 *
 * Rode de dentro da pasta do projeto:
 *   node --test /caminho/para/aula-sdd/juiz/aceitacao-emprestimos.spec.js
 * ou use o atalho:
 *   ./aula-sdd/juiz.sh biblioteca-api
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIA = 24 * 60 * 60 * 1000;

let criarServidor;
try {
  ({ criarServidor } = await import(pathToFileURL(join(process.cwd(), 'src/servidor.js')).href));
} catch (erro) {
  throw new Error(
    `Não achei src/servidor.js a partir de ${process.cwd()}. ` +
      'Rode o juiz de DENTRO da pasta do projeto.',
    { cause: erro },
  );
}

let servidor;
let base;

before(async () => {
  servidor = criarServidor();
  await new Promise((resolver) => servidor.listen(0, resolver));
  base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

/**
 * Datas de cenário sempre com 12h de folga, para nunca cair na fronteira
 * de um dia inteiro por causa do tempo de execução do teste.
 */
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
  const texto = await resposta.text();
  return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
}

/** Cada caso cria os seus próprios dados: nenhum caso depende do outro. */
async function novoLeitor() {
  const sufixo = Math.random().toString(16).slice(2, 8);
  const { corpo } = await post('/leitores', {
    nome: `Leitor ${sufixo}`,
    email: `leitor.${sufixo}@unifil.br`,
    anoDeNascimento: 2003,
  });
  return corpo.id;
}

async function novoLivro() {
  const sufixo = Math.random().toString(16).slice(2, 8);
  const { corpo } = await post('/livros', {
    titulo: `Livro ${sufixo}`,
    autor: 'Autor de Teste',
    ano: 1950,
  });
  return corpo.id;
}

async function abrir({ leitorId, livroId, emprestadoEm } = {}) {
  const dados = {
    leitorId: leitorId ?? (await novoLeitor()),
    livroId: livroId ?? (await novoLivro()),
  };
  if (emprestadoEm) dados.emprestadoEm = emprestadoEm;
  return post('/emprestimos', dados);
}

function diferencaEmDias(depois, antes) {
  return (new Date(depois).getTime() - new Date(antes).getTime()) / DIA;
}

describe('fatia 1 — abrir empréstimo', () => {
  it('1. abre com 201, id emp_, status ativo e prazo de 14 dias', async () => {
    const { status, corpo } = await abrir();

    assert.equal(status, 201, 'deveria responder 201 ao abrir um empréstimo');
    assert.match(corpo.id, /^emp_[0-9a-f]{8}$/, 'id deve ser emp_ + 8 hexadecimais');
    assert.equal(corpo.status, 'ativo');
    assert.equal(corpo.devolvidoEm, null);
    assert.equal(corpo.renovacoes, 0);
    assert.equal(corpo.multa, 0);
    assert.equal(
      diferencaEmDias(corpo.devolucaoPrevista, corpo.emprestadoEm),
      14,
      'R1: devolucaoPrevista deve ser emprestadoEm + 14 dias',
    );
  });

  it('2. marca o livro como emprestado', async () => {
    const livroId = await novoLivro();
    await abrir({ livroId });

    const { corpo: livro } = await get(`/livros/${livroId}`);
    assert.equal(livro.emprestado, true, 'R3: livro com empréstimo ativo fica emprestado: true');
  });

  it('3. recusa emprestar livro que já está emprestado', async () => {
    const livroId = await novoLivro();
    await abrir({ livroId });

    const { status, corpo } = await abrir({ livroId });
    assert.equal(status, 409, 'R3: livro já emprestado deve responder 409');
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });

  it('4. recusa leitor ou livro inexistente com 404', async () => {
    const semLeitor = await abrir({ leitorId: 'lei_00000000' });
    assert.equal(semLeitor.status, 404, 'R2: leitor inexistente deve responder 404');
    assert.equal(semLeitor.corpo.erro.codigo, 'NAO_ENCONTRADO');

    const semLivro = await abrir({ livroId: 'liv_00000000' });
    assert.equal(semLivro.status, 404, 'R2: livro inexistente deve responder 404');
    assert.equal(semLivro.corpo.erro.codigo, 'NAO_ENCONTRADO');
  });

  it('5. recusa o quarto empréstimo ativo do mesmo leitor', async () => {
    const leitorId = await novoLeitor();
    for (let i = 0; i < 3; i += 1) {
      const { status } = await abrir({ leitorId });
      assert.equal(status, 201, `R4: o empréstimo ${i + 1} ainda deveria ser aceito`);
    }

    const { status, corpo } = await abrir({ leitorId });
    assert.equal(status, 409, 'R4: o quarto empréstimo ativo deve responder 409');
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });
});

describe('fatia 2 — bloqueio por atraso', () => {
  it('6. recusa leitor com empréstimo atrasado mesmo tendo só um ativo', async () => {
    const leitorId = await novoLeitor();
    const atrasado = await abrir({ leitorId, emprestadoEm: diasAtras(20) });
    assert.equal(atrasado.status, 201, 'R10: a abertura com emprestadoEm no passado deve funcionar');

    const { status, corpo } = await abrir({ leitorId });
    assert.equal(status, 409, 'R5: leitor com atraso não abre novo empréstimo');
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });
});

describe('fatia 3 — devolução e multa', () => {
  it('7. devolve no prazo, libera o livro e não cobra multa', async () => {
    const livroId = await novoLivro();
    const { corpo: emprestimo } = await abrir({ livroId });

    const { status, corpo } = await post(`/emprestimos/${emprestimo.id}/devolucao`);
    assert.equal(status, 200, 'R6: devolução deve responder 200');
    assert.equal(corpo.status, 'devolvido');
    assert.ok(corpo.devolvidoEm, 'R6: devolvidoEm deve ser preenchido');
    assert.equal(corpo.multa, 0, 'R7: devolução no prazo não tem multa');

    const { corpo: livro } = await get(`/livros/${livroId}`);
    assert.equal(livro.emprestado, false, 'R3: a devolução libera o livro');
  });

  it('8. cobra 1,50 por dia inteiro de atraso', async () => {
    const { corpo: emprestimo } = await abrir({ emprestadoEm: diasAtras(20) });

    const { status, corpo } = await post(`/emprestimos/${emprestimo.id}/devolucao`);
    assert.equal(status, 200);
    assert.equal(corpo.multa, 9, 'R7: 6 dias de atraso x 1,50 = 9');
  });

  it('9. limita a multa ao teto de 30', async () => {
    const { corpo: emprestimo } = await abrir({ emprestadoEm: diasAtras(100) });

    const { status, corpo } = await post(`/emprestimos/${emprestimo.id}/devolucao`);
    assert.equal(status, 200);
    assert.equal(corpo.multa, 30, 'R7: a multa não passa de 30 por mais longo que seja o atraso');
  });

  it('10. recusa devolver um empréstimo já devolvido', async () => {
    const { corpo: emprestimo } = await abrir();
    await post(`/emprestimos/${emprestimo.id}/devolucao`);

    const { status, corpo } = await post(`/emprestimos/${emprestimo.id}/devolucao`);
    assert.equal(status, 409, 'R6: devolver duas vezes deve responder 409');
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });
});

describe('fatia 4 — renovação', () => {
  it('11. renova uma vez somando 14 dias à previsão e recusa a segunda', async () => {
    const { corpo: emprestimo } = await abrir();

    const primeira = await post(`/emprestimos/${emprestimo.id}/renovacao`);
    assert.equal(primeira.status, 200, 'R8: a primeira renovação deve ser aceita');
    assert.equal(primeira.corpo.renovacoes, 1);
    assert.equal(
      diferencaEmDias(primeira.corpo.devolucaoPrevista, emprestimo.emprestadoEm),
      28,
      'R8: renovar soma 14 dias à devolucaoPrevista atual',
    );

    const segunda = await post(`/emprestimos/${emprestimo.id}/renovacao`);
    assert.equal(segunda.status, 409, 'R8: só uma renovação é permitida');
    assert.equal(segunda.corpo.erro.codigo, 'CONFLITO');
  });

  it('12. recusa renovar empréstimo em atraso', async () => {
    const { corpo: emprestimo } = await abrir({ emprestadoEm: diasAtras(20) });

    const { status, corpo } = await post(`/emprestimos/${emprestimo.id}/renovacao`);
    assert.equal(status, 409, 'R8: empréstimo atrasado não renova');
    assert.equal(corpo.erro.codigo, 'CONFLITO');
  });
});

describe('fatia 5 — consulta', () => {
  it('13. filtra a listagem por leitorId e por status', async () => {
    const leitorId = await novoLeitor();
    const { corpo: primeiro } = await abrir({ leitorId });
    await abrir({ leitorId });
    await post(`/emprestimos/${primeiro.id}/devolucao`);

    const doLeitor = await get(`/emprestimos?leitorId=${leitorId}`);
    assert.equal(doLeitor.status, 200);
    assert.equal(doLeitor.corpo.length, 2, 'R9: filtro por leitorId deve trazer os dois');

    const ativos = await get(`/emprestimos?leitorId=${leitorId}&status=ativo`);
    assert.equal(ativos.corpo.length, 1, 'R9: os filtros devem se combinar');
    assert.equal(ativos.corpo[0].status, 'ativo');
  });
});
