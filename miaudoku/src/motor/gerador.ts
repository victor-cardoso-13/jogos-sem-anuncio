/**
 * GERADOR DE FASES
 * ================
 * 1) Sorteia onde ficam os gatos (a resposta).
 * 2) Cresce uma região de cor em volta de cada gato até encher a grade.
 * 3) Vai trocando casas de cor entre regiões vizinhas até sobrar
 *    uma resposta só E a dica conseguir resolver sem chute.
 * Usa um sorteio com "semente": a mesma semente sempre gera as mesmas fases.
 */
import { contarSolucoes, type Fase } from './fase.ts';
import { resolverComDicas } from './dica.ts';

/** Sorteio repetível (mulberry32). */
export function criarSorteio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VIZ = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function sortearResposta(n: number, rnd: () => number): number[] {
  for (;;) {
    const p = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    if (p.every((v, i) => i === 0 || Math.abs(v - p[i - 1]) > 1)) return p;
  }
}

function crescerRegioes(n: number, resposta: number[], rnd: () => number, minimo: number): number[] {
  const g = Array<number>(n * n).fill(-1);
  resposta.forEach((c, l) => (g[l * n + c] = l));
  const tamanho = Array(n).fill(1);
  let vazias = n * n - n;
  let tentativas = 0;
  while (vazias) {
    // primeiro as cores que ainda não chegaram no tamanho mínimo
    const pequenas = [...Array(n).keys()].filter(r => tamanho[r] < minimo);
    const r = pequenas.length && tentativas++ < n * n * 4
      ? pequenas[Math.floor(rnd() * pequenas.length)]
      : Math.floor(rnd() * n);
    const borda: number[] = [];
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) {
      if (g[l * n + c] !== -1) continue;
      if (VIZ.some(([a, b]) => l + a >= 0 && l + a < n && c + b >= 0 && c + b < n && g[(l + a) * n + c + b] === r)) {
        borda.push(l * n + c);
      }
    }
    if (borda.length) {
      g[borda[Math.floor(rnd() * borda.length)]] = r;
      tamanho[r]++;
      vazias--;
    }
  }
  return g;
}

function regiaoConexa(n: number, g: number[], r: number): boolean {
  const casas = g.flatMap((v, s) => (v === r ? [s] : []));
  if (!casas.length) return false;
  const visto = new Set([casas[0]]);
  const pilha = [casas[0]];
  while (pilha.length) {
    const s = pilha.pop()!;
    const l = Math.floor(s / n), c = s % n;
    for (const [a, b] of VIZ) {
      const l2 = l + a, c2 = c + b;
      if (l2 < 0 || l2 >= n || c2 < 0 || c2 >= n) continue;
      const s2 = l2 * n + c2;
      if (g[s2] === r && !visto.has(s2)) {
        visto.add(s2);
        pilha.push(s2);
      }
    }
  }
  return visto.size === casas.length;
}

/**
 * Tenta gerar uma fase boa. Pode devolver null (aí é só tentar de novo).
 * "minimo" = menor número de casas que uma cor pode ter (cor de 1 casa entrega o gato de graça).
 */
export function tentarGerar(n: number, rnd: () => number, passos = 3000, minimo = 1): Fase | null {
  const resposta = sortearResposta(n, rnd);
  const g = crescerRegioes(n, resposta, rnd, minimo);
  const tamanhoDa = (r: number) => g.reduce((t, v) => t + (v === r ? 1 : 0), 0);
  if ([...Array(n).keys()].some(r => tamanhoDa(r) < minimo)) return null;
  const gatos = new Set(resposta.map((c, l) => l * n + c));
  let atual = contarSolucoes(n, g, 50).total;

  for (let i = 0; i < passos; i++) {
    if (atual === 1) {
      const fase = { n, regiao: [...g], resposta };
      const { dicas } = resolverComDicas(fase);
      if (!dicas.some(d => d.tipo === 'mostrar')) return fase;
    }
    const s = Math.floor(rnd() * n * n);
    if (gatos.has(s)) continue;
    const [a, b] = VIZ[Math.floor(rnd() * 4)];
    const l = Math.floor(s / n) + a, c = (s % n) + b;
    if (l < 0 || l >= n || c < 0 || c >= n) continue;
    const r1 = g[s], r2 = g[l * n + c];
    if (r1 === r2 || tamanhoDa(r1) <= minimo) continue;
    g[s] = r2;
    if (!regiaoConexa(n, g, r1)) {
      g[s] = r1;
      continue;
    }
    const novo = contarSolucoes(n, g, 50).total;
    // aceita se não piorou (e às vezes aceita piorar, para não empacar)
    if (novo >= 1 && (novo <= atual || rnd() < 0.05)) atual = novo;
    else g[s] = r1;
  }
  return null;
}
