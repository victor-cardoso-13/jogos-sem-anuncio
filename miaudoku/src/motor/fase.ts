/**
 * Uma fase: a grade dividida em regiões (cores) e a resposta.
 * As casas são numeradas de 0 a n·n−1, linha por linha (casa = linha·n + coluna).
 */

export interface Fase {
  n: number;
  /** regiao[casa] = número da cor (0 a n−1) */
  regiao: number[];
  /** resposta[linha] = coluna do gato nessa linha */
  resposta: number[];
}

export type TipoUnidade = 'linha' | 'coluna' | 'regiao';

/** Uma linha, coluna ou região: cada uma precisa de exatamente 1 gato. */
export interface Unidade {
  tipo: TipoUnidade;
  id: number;
  casas: number[];
}

export const linhaDe = (f: Fase, casa: number) => Math.floor(casa / f.n);
export const colunaDe = (f: Fase, casa: number) => casa % f.n;

export function ehResposta(f: Fase, casa: number) {
  return f.resposta[linhaDe(f, casa)] === colunaDe(f, casa);
}

/** Dois gatos nessas casas se atrapalham? (mesma linha, coluna, cor, ou encostados) */
export function seAtacam(f: Fase, a: number, b: number) {
  if (a === b) return false;
  const l1 = linhaDe(f, a), c1 = colunaDe(f, a), l2 = linhaDe(f, b), c2 = colunaDe(f, b);
  return l1 === l2 || c1 === c2 || f.regiao[a] === f.regiao[b] ||
    (Math.abs(l1 - l2) <= 1 && Math.abs(c1 - c2) <= 1);
}

const cacheUnidades = new WeakMap<Fase, Unidade[]>();

export function unidades(f: Fase): Unidade[] {
  const salvo = cacheUnidades.get(f);
  if (salvo) return salvo;
  const u: Unidade[] = [];
  const todas = [...Array(f.n * f.n).keys()];
  for (let i = 0; i < f.n; i++) {
    u.push({ tipo: 'linha', id: i, casas: todas.filter(s => linhaDe(f, s) === i) });
    u.push({ tipo: 'coluna', id: i, casas: todas.filter(s => colunaDe(f, s) === i) });
    u.push({ tipo: 'regiao', id: i, casas: todas.filter(s => f.regiao[s] === i) });
  }
  cacheUnidades.set(f, u);
  return u;
}

/**
 * Conta as respostas possíveis (para no "limite").
 * Resolvedor simples por tentativa, separado da lógica da dica, para conferir as fases.
 */
export function contarSolucoes(n: number, regiao: number[], limite = 2): { total: number; primeira: number[] | null } {
  let total = 0;
  let primeira: number[] | null = null;
  const colUsada = Array(n).fill(false);
  const regUsada = Array(n).fill(false);
  const atual: number[] = [];
  const passo = (l: number) => {
    if (total >= limite) return;
    if (l === n) {
      total++;
      if (!primeira) primeira = [...atual];
      return;
    }
    for (let c = 0; c < n; c++) {
      const r = regiao[l * n + c];
      if (colUsada[c] || regUsada[r]) continue;
      if (l > 0 && Math.abs(atual[l - 1] - c) <= 1) continue;
      colUsada[c] = regUsada[r] = true;
      atual.push(c);
      passo(l + 1);
      atual.pop();
      colUsada[c] = regUsada[r] = false;
    }
  };
  passo(0);
  return { total, primeira };
}

// ---------------------------------------------------------------------------
// Formato guardado nos arquivos de fases: "aabbc…|30241"
// (letras = regiões em ordem de aparecimento; números = coluna do gato por linha)
// ---------------------------------------------------------------------------

const LETRAS = 'abcdefghij';

/** Renomeia as regiões na ordem em que aparecem (a primeira é "a", a próxima nova é "b"…). */
export function regioesCanonicas(regiao: number[]): number[] {
  const mapa = new Map<number, number>();
  return regiao.map(r => {
    if (!mapa.has(r)) mapa.set(r, mapa.size);
    return mapa.get(r)!;
  });
}

export function paraTexto(f: Fase): string {
  return regioesCanonicas(f.regiao).map(r => LETRAS[r]).join('') + '|' + f.resposta.join('');
}

export function deTexto(txt: string): Fase {
  const [r, s] = txt.split('|');
  const n = s.length;
  return { n, regiao: [...r].map(ch => LETRAS.indexOf(ch)), resposta: [...s].map(Number) };
}

/**
 * Identidade da fase sem contar giros e espelhos: duas fases que são
 * a mesma girada ou espelhada recebem a mesma chave.
 */
export function chaveSemSimetria(n: number, regiao: number[]): string {
  const chaves: string[] = [];
  for (let t = 0; t < 8; t++) {
    const nova = Array<number>(n * n);
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) {
      let [a, b] = [l, c];
      if (t & 1) [a, b] = [b, a];
      if (t & 2) a = n - 1 - a;
      if (t & 4) b = n - 1 - b;
      nova[a * n + b] = regiao[l * n + c];
    }
    chaves.push(regioesCanonicas(nova).map(r => LETRAS[r]).join(''));
  }
  return chaves.sort()[0];
}
