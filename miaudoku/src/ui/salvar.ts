/**
 * Guarda o progresso no próprio aparelho (localStorage):
 * em que fase cada tamanho está, a partida em andamento e o modo preguiça.
 *
 * Cada conta tem a sua "gaveta" separada no aparelho, e quem joga sem conta tem outra.
 * Assim, duas pessoas no mesmo celular nunca misturam o progresso.
 * Se um dia as fases forem geradas de novo, troque o "v1" da chave.
 */
import type { Jogo } from '../motor/jogo.ts';

const BASE = 'miaudoku:v1';
/** Última conta que entrou neste aparelho (só um "marcador", não é senha). */
const ULTIMA_CONTA = 'miaudoku:ultima-conta';

export interface ProgressoTamanho {
  /** número da fase atual (0 = Fase 1) */
  fase: number;
  /** partida em andamento dessa fase (null = ainda não mexeu) */
  jogo: Jogo | null;
  /** de qual fase é a partida salva (se as fases forem recriadas, a partida antiga é descartada) */
  faseTexto?: string;
  /** sobe 1 cada vez que o jogador começa todas as fases de novo */
  rodada?: number;
  /** quando mudou pela última vez (para juntar com a nuvem) */
  atualizadoEm?: number;
}

export interface Salvo {
  preguica: boolean;
  preguicaEm?: number;
  tamanhos: Record<number, ProgressoTamanho>;
}

export const vazio = (): Salvo => ({ preguica: false, tamanhos: {} });

/** De quem é a gaveta aberta agora (null = jogando sem conta). */
let dono: string | null = localStorage.getItem(ULTIMA_CONTA);
let aoSalvar: ((s: Salvo) => void) | null = null;

const chave = (uid: string | null) => (uid ? `${BASE}:conta:${uid}` : BASE);

export const contaAtiva = () => dono;

/** Troca de gaveta (entrou, saiu ou trocou de conta). */
export function usarConta(uid: string | null) {
  dono = uid;
  if (uid) localStorage.setItem(ULTIMA_CONTA, uid);
  else localStorage.removeItem(ULTIMA_CONTA);
}

/** Avisa a nuvem a cada salvamento (quem chama decide quando enviar). */
export function quandoSalvar(fn: ((s: Salvo) => void) | null) {
  aoSalvar = fn;
}

export function carregar(uid: string | null = dono): Salvo {
  try {
    const txt = localStorage.getItem(chave(uid));
    if (txt) return { ...vazio(), ...JSON.parse(txt) };
  } catch {
    /* sem dados ou corrompido: começa do zero */
  }
  return vazio();
}

export function salvar(s: Salvo, uid: string | null = dono) {
  try {
    localStorage.setItem(chave(uid), JSON.stringify(s));
  } catch {
    // Sem espaço ou modo privado: o jogo continua, só não fica salvo.
  }
  if (uid === dono) aoSalvar?.(s);
}

/** Apaga a gaveta de quem joga sem conta (depois de levar o progresso para uma conta). */
export function limparSemConta() {
  localStorage.removeItem(chave(null));
}

export function temProgresso(s: Salvo) {
  return Object.values(s.tamanhos).some(p => p.fase > 0 || p.jogo);
}

export function progresso(s: Salvo, n: number): ProgressoTamanho {
  return (s.tamanhos[n] ??= { fase: 0, jogo: null });
}

/** Marca que o progresso desse tamanho mudou agora. */
export function tocar(s: Salvo, n: number) {
  progresso(s, n).atualizadoEm = Date.now();
}
