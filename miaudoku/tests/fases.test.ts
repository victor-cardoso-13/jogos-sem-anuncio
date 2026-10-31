/**
 * Confere CADA fase dos pacotes (src/fases/N.json):
 * - resposta única, conferida por um resolvedor separado da dica;
 * - nenhuma fase repetida (nem girada/espelhada);
 * - dá para resolver só com as dicas, sem nunca errar e sem "mostrar" gato.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { chaveSemSimetria, contarSolucoes, deTexto, ehResposta, type Fase } from '../src/motor/fase.ts';
import { acharDica, type Marca } from '../src/motor/dica.ts';
import { FASES_POR_TAMANHO, TAMANHOS } from '../src/motor/regras.ts';

function regioesConexas(f: Fase) {
  for (let r = 0; r < f.n; r++) {
    const casas = f.regiao.flatMap((v, s) => (v === r ? [s] : []));
    if (!casas.length) return false;
    const visto = new Set([casas[0]]);
    const pilha = [casas[0]];
    while (pilha.length) {
      const s = pilha.pop()!;
      const viz = [s - f.n, s + f.n, s % f.n ? s - 1 : -1, (s + 1) % f.n ? s + 1 : -1];
      for (const v of viz) if (v >= 0 && v < f.n * f.n && f.regiao[v] === r && !visto.has(v)) { visto.add(v); pilha.push(v); }
    }
    if (visto.size !== casas.length) return false;
  }
  return true;
}

/** Resolve só com dicas, conferindo cada passo contra a resposta. */
function resolverConferindo(f: Fase): string | null {
  const marcas: Marca[] = Array(f.n * f.n).fill('');
  for (let i = 0; i < 400; i++) {
    const d = acharDica(f, marcas);
    if (!d) break;
    if (d.tipo === 'mostrar') return 'precisou mostrar um gato';
    if (d.tipo === 'xErrado') return 'apareceu ✕ errado sem o jogador errar';
    if (d.acao.gato !== undefined) {
      if (!ehResposta(f, d.acao.gato)) return `pôs gato errado na casa ${d.acao.gato}`;
      marcas[d.acao.gato] = 'gato';
    }
    for (const s of d.acao.marcar ?? []) {
      if (ehResposta(f, s)) return `marcou ✕ na casa ${s}, que tem gato`;
      marcas[s] = 'x';
    }
  }
  return marcas.filter(m => m === 'gato').length === f.n ? null : 'não terminou';
}

for (const { n, menorCor } of TAMANHOS) {
  const arquivo = new URL(`../src/fases/${n}.json`, import.meta.url);
  describe.skipIf(!existsSync(arquivo))(`fases ${n}×${n}`, () => {
    const textos: string[] = existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, 'utf8')) : [];
    const fases = textos.map(deTexto);

    it(`tem ${FASES_POR_TAMANHO} fases`, () => {
      expect(fases.length).toBe(FASES_POR_TAMANHO);
    });

    it('nenhuma fase se repete (nem girada ou espelhada)', () => {
      const chaves = new Set(fases.map(f => chaveSemSimetria(f.n, f.regiao)));
      expect(chaves.size).toBe(fases.length);
    });

    it('grade certa: n cores, cada cor inteira (sem pedaços soltos)', () => {
      for (const f of fases) {
        expect(f.n).toBe(n);
        expect(f.regiao.length).toBe(n * n);
        expect(new Set(f.regiao).size).toBe(n);
        expect(regioesConexas(f)).toBe(true);
      }
    });

    it(`nenhuma cor com menos de ${menorCor} casa(s)`, () => {
      for (const f of fases) {
        for (let r = 0; r < n; r++) expect(f.regiao.filter(x => x === r).length).toBeGreaterThanOrEqual(menorCor);
      }
    });

    it('resposta única, e é a resposta guardada', () => {
      for (const f of fases) {
        const { total, primeira } = contarSolucoes(f.n, f.regiao, 2);
        expect(total).toBe(1);
        expect(primeira).toEqual(f.resposta);
      }
    });

    it('as dicas resolvem tudo sem chute e sem errar', () => {
      const problemas = fases.map((f, i) => [i + 1, resolverConferindo(f)]).filter(([, p]) => p);
      expect(problemas).toEqual([]);
    });
  });
}
