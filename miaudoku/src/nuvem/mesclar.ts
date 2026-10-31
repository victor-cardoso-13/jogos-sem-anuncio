/**
 * Converte o progresso para o formato da nuvem (e de volta) e junta duas cópias
 * (a do aparelho e a da nuvem) quando a pessoa joga em mais de um aparelho.
 * Não usa o Firebase: dá para testar sem internet.
 */
import type { Marca } from '../motor/dica.ts';
import type { ProgressoTamanho, Salvo } from '../ui/salvar.ts';
import { idGatinho } from '../ui/gatinhos.ts';

/** Versões antigas guardavam a preguiça como sim/não: "sim" vira o modo 1. */
export const modoPreguica = (v: unknown): number => (v === true ? 1 : v === 2 ? 2 : v === 1 ? 1 : 0);

/** Um tamanho na nuvem. As marcas viram um texto curto: "." vazio, "x" ✕, "g" gato. */
export interface TamanhoNuvem {
  rodada: number;
  fase: number;
  faseTexto: string;
  marcas: string;
  coracoes: number;
  atualizadoEm: number;
}

export interface DadosNuvem {
  versao: 1;
  /** 0, 1 ou 2 (documentos antigos podem ter true/false) */
  preguica: number | boolean;
  preguicaEm: number;
  /** gatinho escolhido (documentos antigos não têm: vale o padrão) */
  gatinho?: string;
  gatinhoEm?: number;
  tamanhos: Record<string, TamanhoNuvem>;
}

const PARA_LETRA: Record<Marca, string> = { '': '.', x: 'x', gato: 'g' };
const DE_LETRA: Record<string, Marca> = { '.': '', x: 'x', g: 'gato' };

/** O "Desfazer" não vai para a nuvem (só faz sentido no aparelho em que se está jogando). */
export function paraNuvem(s: Salvo): DadosNuvem {
  const tamanhos: Record<string, TamanhoNuvem> = {};
  for (const [n, p] of Object.entries(s.tamanhos)) {
    tamanhos[n] = {
      rodada: p.rodada ?? 0,
      fase: p.fase,
      faseTexto: p.jogo ? p.faseTexto ?? '' : '',
      marcas: p.jogo ? p.jogo.marcas.map(m => PARA_LETRA[m]).join('') : '',
      coracoes: p.jogo ? p.jogo.coracoes : 0,
      atualizadoEm: p.atualizadoEm ?? 0,
    };
  }
  return { versao: 1, preguica: s.preguica, preguicaEm: s.preguicaEm ?? 0, gatinho: idGatinho(s.gatinho), gatinhoEm: s.gatinhoEm ?? 0, tamanhos };
}

export function daNuvem(d: DadosNuvem): Salvo {
  const tamanhos: Record<number, ProgressoTamanho> = {};
  for (const [n, t] of Object.entries(d.tamanhos ?? {})) {
    const temJogo = t.marcas.length > 0;
    tamanhos[Number(n)] = {
      fase: t.fase,
      rodada: t.rodada,
      atualizadoEm: t.atualizadoEm,
      ...(temJogo
        ? { jogo: { marcas: [...t.marcas].map(l => DE_LETRA[l] ?? ''), coracoes: t.coracoes, historico: [] }, faseTexto: t.faseTexto }
        : { jogo: null }),
    };
  }
  return { preguica: modoPreguica(d.preguica), preguicaEm: d.preguicaEm, gatinho: idGatinho(d.gatinho), gatinhoEm: d.gatinhoEm ?? 0, tamanhos };
}

/** Quem está mais adiante: mais rodadas, depois fase maior, depois a mudança mais recente. */
function maisAdiante(a: ProgressoTamanho, b: ProgressoTamanho): ProgressoTamanho {
  const chave = (p: ProgressoTamanho) => [p.rodada ?? 0, p.fase, p.atualizadoEm ?? 0];
  const [ka, kb] = [chave(a), chave(b)];
  for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] > kb[i] ? a : b;
  return a;
}

/** Junta duas cópias do progresso, tamanho por tamanho. Em empate fica com "a" (o aparelho). */
export function mesclar(a: Salvo, b: Salvo): Salvo {
  const tamanhos: Record<number, ProgressoTamanho> = {};
  const todos = new Set([...Object.keys(a.tamanhos), ...Object.keys(b.tamanhos)].map(Number));
  for (const n of todos) {
    const pa = a.tamanhos[n], pb = b.tamanhos[n];
    tamanhos[n] = structuredClone(pa && pb ? maisAdiante(pa, pb) : pa ?? pb);
  }
  const preguicaDeB = (b.preguicaEm ?? 0) > (a.preguicaEm ?? 0);
  const gatinhoDeB = (b.gatinhoEm ?? 0) > (a.gatinhoEm ?? 0);
  return {
    preguica: preguicaDeB ? b.preguica : a.preguica,
    preguicaEm: Math.max(a.preguicaEm ?? 0, b.preguicaEm ?? 0),
    gatinho: idGatinho(gatinhoDeB ? b.gatinho : a.gatinho),
    gatinhoEm: Math.max(a.gatinhoEm ?? 0, b.gatinhoEm ?? 0),
    tamanhos,
  };
}

/** As duas cópias já são iguais (no que vai para a nuvem)? Evita gravar à toa. */
export function iguais(a: Salvo, b: Salvo) {
  return JSON.stringify(paraNuvem(a)) === JSON.stringify(paraNuvem(b));
}
