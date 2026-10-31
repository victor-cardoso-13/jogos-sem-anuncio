/**
 * Modo preguiça 2: as casas "só cabe um gato" precisam SEMPRE ser casas que têm gato,
 * mesmo quando o jogador marca ✕ errados à mão.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { deTexto, ehResposta } from '../src/motor/fase.ts';
import { casasSoCabeUm, definirX, novoJogo, porGato } from '../src/motor/jogo.ts';
import { criarSorteio } from '../src/motor/gerador.ts';
import { TAMANHOS } from '../src/motor/regras.ts';

describe('preguiça 2: casas onde só cabe um gato', () => {
  it('o exemplo do mock: 7×7 depois de 3 gatos acende exatamente 2 casas', () => {
    const f = deTexto('abaacddaaaccddeaaaccfeaaaccfcggccffcccccffccccfff|1530246');
    const j = novoJogo(f);
    [1, 12, 17].forEach(c => porGato(j, f, c, true));
    expect(casasSoCabeUm(f, j.marcas)).toEqual([21, 30]);
  });

  it('não acende nada sem gatos postos numa fase de verdade', () => {
    const f = deTexto(JSON.parse(readFileSync(new URL('../src/fases/10.json', import.meta.url), 'utf8'))[0]);
    expect(casasSoCabeUm(f, novoJogo(f).marcas)).toEqual([]);
  });

  for (const { n } of TAMANHOS) {
    it(`${n}×${n}: em 200 partidas (com ✕ errados à mão), só acende casas que têm gato`, () => {
      const textos: string[] = JSON.parse(readFileSync(new URL(`../src/fases/${n}.json`, import.meta.url), 'utf8'));
      const rnd = criarSorteio(n * 7);
      let acesas = 0;
      for (let i = 0; i < 200; i++) {
        const f = deTexto(textos[Math.floor(rnd() * textos.length)]);
        const j = novoJogo(f);
        j.coracoes = 99;
        // o jogador marca alguns ✕ ao acaso, inclusive em casas que têm gato (erro dele)
        for (let k = 0; k < n; k++) definirX(j, Math.floor(rnd() * n * n), 'x');
        const ordem = f.resposta.map((c, l) => l * n + c).sort(() => rnd() - 0.5);
        for (const casa of ordem) {
          if (j.marcas[casa] === 'x') definirX(j, casa, '');
          porGato(j, f, casa, rnd() < 0.5);
          for (const s of casasSoCabeUm(f, j.marcas)) {
            acesas++;
            expect(ehResposta(f, s), `fase ${i}: casa ${s} acesa sem ter gato`).toBe(true);
          }
        }
      }
      expect(acesas).toBeGreaterThan(0);
    });
  }
});
