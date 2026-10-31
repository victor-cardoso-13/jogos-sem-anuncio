import { describe, expect, it } from 'vitest';
import { deTexto } from '../src/motor/fase.ts';
import { acharDica } from '../src/motor/dica.ts';
import { apagarTodosX, definirX, desfazer, guardar, novoJogo, porGato } from '../src/motor/jogo.ts';

// A fase do protótipo (7×7). Resposta: coluna do gato em cada linha.
//   rosa  rosa  rosa  azul  azul  azul  azul      ← gato na coluna 7
const fase = deTexto(
  'aaabbbb' +
  'aaaccdb' +
  'adddddd' +
  'eeffgdg' +
  'eefgggg' +
  'eefgggg' +
  'eeeeggg' + '|6305241',
);
const casa = (l: number, c: number) => (l - 1) * 7 + (c - 1); // linha e coluna contando de 1

describe('gatos e corações', () => {
  it('gato certo fica; gato errado some e tira 1 coração', () => {
    const j = novoJogo(fase);
    expect(porGato(j, fase, casa(1, 7), false)).toBe('certo');
    expect(j.marcas[casa(1, 7)]).toBe('gato');
    expect(porGato(j, fase, casa(2, 1), false)).toBe('errado');
    expect(j.marcas[casa(2, 1)]).toBe('');
    expect(j.coracoes).toBe(2);
  });

  it('com 3 erros, perde', () => {
    const j = novoJogo(fase);
    porGato(j, fase, casa(2, 1), false);
    porGato(j, fase, casa(2, 2), false);
    expect(porGato(j, fase, casa(2, 3), false)).toBe('perdeu');
    expect(j.coracoes).toBe(0);
    expect(porGato(j, fase, casa(1, 7), false)).toBe('nada');
  });

  it('pondo todos os gatos certos, vence', () => {
    const j = novoJogo(fase);
    const res = fase.resposta.map((c, l) => porGato(j, fase, l * 7 + c, false));
    expect(res.at(-1)).toBe('venceu');
  });
});

describe('desfazer', () => {
  it('desfaz o gato, mas o coração perdido não volta', () => {
    const j = novoJogo(fase);
    porGato(j, fase, casa(1, 7), false);
    porGato(j, fase, casa(2, 1), false); // erro: não cria passo de desfazer
    expect(desfazer(j)).toBe(true);
    expect(j.marcas[casa(1, 7)]).toBe('');
    expect(j.coracoes).toBe(2);
    expect(desfazer(j)).toBe(false);
  });

  it('apagar todos os ✕ pode ser desfeito', () => {
    const j = novoJogo(fase);
    guardar(j);
    definirX(j, casa(1, 1), 'x');
    definirX(j, casa(1, 2), 'x');
    apagarTodosX(j);
    expect(j.marcas.includes('x')).toBe(false);
    desfazer(j);
    expect(j.marcas.filter(m => m === 'x').length).toBe(2);
  });
});

describe('modo preguiça', () => {
  it('ao acertar, marca ✕ na linha, coluna, cor e em volta do gato', () => {
    const j = novoJogo(fase);
    porGato(j, fase, casa(1, 7), true);
    const x = (l: number, c: number) => j.marcas[casa(l, c)] === 'x';
    expect(x(1, 1)).toBe(true); // mesma linha
    expect(x(7, 7)).toBe(true); // mesma coluna
    expect(x(2, 7)).toBe(true); // mesma cor (b), logo abaixo
    expect(x(2, 6)).toBe(true); // outra cor, mas encosta na diagonal
    expect(x(2, 4)).toBe(false); // outra cor, outra linha/coluna, não encosta
    expect(x(3, 3)).toBe(false); // longe
  });

  it('sem o modo preguiça, não marca nada sozinho', () => {
    const j = novoJogo(fase);
    porGato(j, fase, casa(1, 7), false);
    expect(j.marcas.includes('x')).toBe(false);
  });
});

describe('dica', () => {
  it('explica com português certo ("da região", "na linha")', () => {
    const d = acharDica(fase, Array(49).fill(''))!;
    expect(d.tipo).not.toBe('mostrar');
    expect(d.texto).not.toMatch(/\b(em a|de a|Em a|de as|em as)\b/);
  });

  it('avisa quando um ✕ está numa casa que tem gato', () => {
    const marcas = Array(49).fill('');
    marcas[casa(1, 7)] = 'x';
    const d = acharDica(fase, marcas)!;
    expect(d.tipo).toBe('xErrado');
    expect(d.acao.tirarX).toBe(casa(1, 7));
  });

  it('nunca manda pôr ✕ onde tem gato nem gato onde não tem', () => {
    const marcas = Array(49).fill('');
    for (let i = 0; i < 60; i++) {
      const d = acharDica(fase, marcas);
      if (!d) break;
      expect(d.tipo).not.toBe('mostrar');
      if (d.acao.gato !== undefined) {
        expect(fase.resposta[Math.floor(d.acao.gato / 7)]).toBe(d.acao.gato % 7);
        marcas[d.acao.gato] = 'gato';
      }
      for (const s of d.acao.marcar ?? []) {
        expect(fase.resposta[Math.floor(s / 7)]).not.toBe(s % 7);
        marcas[s] = 'x';
      }
    }
    expect(marcas.filter(m => m === 'gato').length).toBe(7);
  });
});
