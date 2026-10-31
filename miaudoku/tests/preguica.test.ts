/**
 * Simulação do modo preguiça em muitas fases: o jogador acerta os gatos em ordem
 * aleatória (às vezes erra, às vezes usa a dica) e o jogo NUNCA pode pôr ✕ numa casa
 * que tem gato.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { deTexto, ehResposta } from '../src/motor/fase.ts';
import { acharDica } from '../src/motor/dica.ts';
import { definirX, guardar, novoJogo, porGato } from '../src/motor/jogo.ts';
import { criarSorteio } from '../src/motor/gerador.ts';
import { TAMANHOS } from '../src/motor/regras.ts';

describe('modo preguiça: nunca põe ✕ onde tem gato', () => {
  for (const { n } of TAMANHOS) {
    it(`${n}×${n}: 300 fases simuladas`, () => {
      const textos: string[] = JSON.parse(readFileSync(new URL(`../src/fases/${n}.json`, import.meta.url), 'utf8'));
      const rnd = criarSorteio(n);
      for (let i = 0; i < 300; i++) {
        const f = deTexto(textos[Math.floor(rnd() * textos.length)]);
        const j = novoJogo(f);
        j.coracoes = 99; // na simulação ninguém perde
        const certos = f.resposta.map((c, l) => l * n + c).sort(() => rnd() - 0.5);
        for (const casa of certos) {
          // às vezes marca um ✕ certo à mão, às vezes erra um gato, às vezes usa a dica
          const vazia = j.marcas.findIndex((m, s) => m === '' && !ehResposta(f, s));
          if (rnd() < 0.3 && vazia >= 0) { guardar(j); definirX(j, vazia, 'x'); }
          const errada = j.marcas.findIndex((m, s) => m !== 'gato' && !ehResposta(f, s));
          if (rnd() < 0.2 && errada >= 0) porGato(j, f, errada, true);
          if (rnd() < 0.2) {
            const d = acharDica(f, j.marcas);
            for (const s of d?.acao.marcar ?? []) definirX(j, s, 'x');
          }
          porGato(j, f, casa, true);
          const xErrado = j.marcas.findIndex((m, s) => m === 'x' && ehResposta(f, s));
          expect(xErrado, `fase ${textos.indexOf(textos[i])}: ✕ na casa ${xErrado}`).toBe(-1);
        }
        expect(j.marcas.filter(m => m === 'gato').length).toBe(n);
      }
    });
  }
});
