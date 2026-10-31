/**
 * DICA
 * ====
 * Procura o raciocínio mais simples que faz o jogo avançar e explica em palavras.
 * Ela só olha a resposta em dois casos: para avisar de um ✕ errado e,
 * se não achar raciocínio nenhum, para mostrar um gato (tipo "mostrar").
 * As fases do jogo são escolhidas para nunca chegar no "mostrar".
 */
import { ehResposta, seAtacam, unidades, type Fase, type TipoUnidade, type Unidade } from './fase.ts';
import { CORES } from './regras.ts';

export type Marca = '' | 'x' | 'gato';

export type TipoDica =
  /** um ✕ foi posto numa casa que tem gato */
  | 'xErrado'
  /** linha, coluna ou cor com uma casa livre só */
  | 'unica'
  /** k cores presas em k linhas/colunas (ou o contrário) */
  | 'presa'
  /** pôr gato numa casa deixaria alguém sem lugar */
  | 'semLugar'
  /** nenhum raciocínio curto: mostra um gato */
  | 'mostrar';

export interface Dica {
  tipo: TipoDica;
  /** para "presa": quantas unidades juntas (1, 2 ou 3) */
  grau: number;
  texto: string;
  /** casas do raciocínio (as outras ficam apagadas na tela) */
  area: number[];
  /** casa onde vai o gato (ou o ✕ errado) */
  alvo: number[];
  /** casas que não podem ter gato (✕ vermelho) */
  marcarX: number[];
  acao: { gato?: number; marcar?: number[]; tirarX?: number };
}

// ---- Nomes em português ----

const nome = (u: Unidade) => u.tipo === 'regiao' ? `a região ${CORES[u.id].nome}` : `a ${u.tipo} ${u.id + 1}`;
const PLURAL: Record<TipoUnidade, string> = { linha: 'linhas', coluna: 'colunas', regiao: 'regiões' };

function nomes(lista: Unidade[]) {
  if (lista.length === 1) return nome(lista[0]);
  const ids = lista.map(u => u.tipo === 'regiao' ? CORES[u.id].nome : String(u.id + 1));
  return `as ${PLURAL[lista[0].tipo]} ${ids.slice(0, -1).join(', ')} e ${ids[ids.length - 1]}`;
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** "a linha" → "na linha", "as linhas" → "nas linhas" */
const em = (s: string) => s.replace(/^(as?) /, 'n$1 ');
/** "a linha" → "da linha" */
const de = (s: string) => 'd' + s;

function combinacoes<T>(lista: T[], k: number): T[][] {
  if (k === 0) return [[]];
  const out: T[][] = [];
  lista.forEach((x, i) => combinacoes(lista.slice(i + 1), k - 1).forEach(r => out.push([x, ...r])));
  return out;
}

const PARES: [TipoUnidade, TipoUnidade][] = [
  ['regiao', 'linha'], ['regiao', 'coluna'], ['linha', 'regiao'],
  ['coluna', 'regiao'], ['linha', 'coluna'], ['coluna', 'linha'],
];

export function acharDica(f: Fase, marcas: Marca[]): Dica | null {
  const total = f.n * f.n;
  const gatos: number[] = [];
  for (let s = 0; s < total; s++) if (marcas[s] === 'gato') gatos.push(s);
  if (gatos.length === f.n) return null;

  const livre = (s: number) => marcas[s] === '' && !gatos.some(g => seAtacam(f, g, s));
  const abertas = unidades(f).filter(u => !u.casas.some(s => marcas[s] === 'gato'));
  const livres = (u: Unidade) => u.casas.filter(livre);
  const bloqueadas = (u: Unidade) => u.casas.filter(s => marcas[s] === '' && !livre(s));
  const dica = (d: Partial<Dica> & Pick<Dica, 'tipo' | 'texto' | 'acao'>): Dica =>
    ({ grau: 0, area: [], alvo: [], marcarX: [], ...d });

  // 1) Um ✕ foi posto onde tem gato
  for (let s = 0; s < total; s++) {
    if (marcas[s] === 'x' && ehResposta(f, s)) {
      return dica({ tipo: 'xErrado', texto: 'Um dos seus ✕ está numa casa que tem gato. Vou tirar esse ✕.',
        alvo: [s], acao: { tirarX: s } });
    }
  }

  // 2) Uma linha, coluna ou região com uma casa livre só (regiões primeiro)
  const ordem = [...abertas.filter(u => u.tipo === 'regiao'), ...abertas.filter(u => u.tipo !== 'regiao')];
  for (const u of ordem) {
    const f1 = livres(u);
    if (f1.length !== 1) continue;
    const bl = bloqueadas(u);
    return dica({
      tipo: 'unica',
      texto: `${cap(em(nome(u)))} só sobrou uma casa onde cabe gato` +
        (bl.length ? ' — as casas com ✕ vermelho estão na mesma linha, coluna ou cor de um gato, ou encostam nele' : '') +
        `. Então o gato ${u.tipo === 'regiao' ? 'dessa cor' : 'dela'} tem que ficar aqui.`,
      area: u.casas, alvo: f1, marcarX: bl, acao: { gato: f1[0] },
    });
  }

  // 3) k unidades de um tipo presas em k unidades de outro tipo
  for (let k = 1; k <= 3; k++) {
    for (const [ta, tb] of PARES) {
      const As = abertas.filter(u => u.tipo === ta);
      const Bs = abertas.filter(u => u.tipo === tb);
      for (const grupo of combinacoes(As, k)) {
        const casasA = grupo.flatMap(livres);
        if (!casasA.length) continue;
        const alcancados = Bs.filter(b => casasA.some(s => b.casas.includes(s)));
        if (alcancados.length !== k) continue;
        const sobra = alcancados.flatMap(livres).filter(s => !casasA.includes(s));
        if (!sobra.length) continue;
        const texto = k === 1
          ? `Todas as casas livres ${de(nome(grupo[0]))} ficam ${em(nome(alcancados[0]))}. ` +
            `Então o gato ${de(nome(alcancados[0]))} vai ser o ${ta === 'regiao' ? 'dessa cor' : 'dela'}, ` +
            'e as casas com ✕ vermelho não podem ter gato.'
          : `${cap(nomes(grupo))} só têm casas livres ${em(nomes(alcancados))}. ` +
            `São ${k} gatos para ${k} lugares, então ${nomes(alcancados)} ficam ocupadas por eles ` +
            'e as casas com ✕ vermelho não podem ter gato.';
        return dica({ tipo: 'presa', grau: k, texto, area: casasA, marcarX: sobra, acao: { marcar: sobra } });
      }
    }
  }

  // 4) Pôr gato aqui deixaria alguém sem lugar
  for (let p = 0; p < total; p++) {
    if (!livre(p)) continue;
    for (const u of abertas) {
      if (u.casas.includes(p)) continue;
      const f1 = livres(u);
      if (f1.length && f1.every(s => seAtacam(f, p, s))) {
        return dica({
          tipo: 'semLugar',
          texto: `Se tivesse gato na casa com ✕ vermelho, ${nome(u)} ficaria sem lugar: ` +
            'todas as casas livres dela encostam nessa casa ou estão na mesma linha, coluna ou cor. Então ali não tem gato.',
          area: f1, marcarX: [p], acao: { marcar: [p] },
        });
      }
    }
  }

  // 5) Nenhum raciocínio curto: mostra um gato
  for (let l = 0; l < f.n; l++) {
    const s = l * f.n + f.resposta[l];
    if (marcas[s] !== 'gato') {
      return dica({ tipo: 'mostrar', texto: 'Aqui não achei um raciocínio curto. Vou mostrar onde fica um gato.',
        alvo: [s], acao: { gato: s } });
    }
  }
  return null;
}

/**
 * Resolve a fase do zero usando só as dicas (como se o jogador apertasse
 * "Fazer para mim" sem parar). Usado para escolher e ordenar as fases.
 */
export function resolverComDicas(f: Fase): { dicas: Dica[]; marcas: Marca[] } {
  const marcas: Marca[] = Array(f.n * f.n).fill('');
  const dicas: Dica[] = [];
  for (let i = 0; i < f.n * f.n * 2; i++) {
    const d = acharDica(f, marcas);
    if (!d) break;
    dicas.push(d);
    if (d.tipo === 'mostrar') break;
    if (d.acao.gato !== undefined) marcas[d.acao.gato] = 'gato';
    for (const s of d.acao.marcar ?? []) marcas[s] = 'x';
    if (d.acao.tirarX !== undefined) marcas[d.acao.tirarX] = '';
  }
  return { dicas, marcas };
}

/** Quanto mais raciocínios difíceis a fase pede, maior a nota. */
export function notaDificuldade(dicas: Dica[]): number {
  const peso = (d: Dica) => d.tipo === 'unica' ? 1 : d.tipo === 'presa' ? [0, 3, 6, 10][d.grau] : d.tipo === 'semLugar' ? 6 : 0;
  return dicas.reduce((s, d) => s + peso(d), 0);
}
