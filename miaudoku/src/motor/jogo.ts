/**
 * Uma partida de uma fase: as marcas do jogador, os corações e o "desfazer".
 * Não sabe nada de tela; a tela chama estas funções.
 */
import { ehResposta, seAtacam, type Fase } from './fase.ts';
import type { Marca } from './dica.ts';
import { CORACOES } from './regras.ts';

export interface Jogo {
  marcas: Marca[];
  coracoes: number;
  /** fotos das marcas para o "Desfazer" (os corações não voltam) */
  historico: Marca[][];
}

export function novoJogo(f: Fase): Jogo {
  return { marcas: Array(f.n * f.n).fill(''), coracoes: CORACOES, historico: [] };
}

/** Tira uma foto antes de mudar algo, para poder desfazer. */
export function guardar(j: Jogo) {
  j.historico.push([...j.marcas]);
}

export function desfazer(j: Jogo): boolean {
  const foto = j.historico.pop();
  if (!foto) return false;
  j.marcas = foto;
  return true;
}

/** Marca ou tira ✕ (casas com gato não mudam). */
export function definirX(j: Jogo, casa: number, valor: '' | 'x') {
  if (j.marcas[casa] !== 'gato') j.marcas[casa] = valor;
}

export function apagarTodosX(j: Jogo) {
  if (!j.marcas.includes('x')) return;
  guardar(j);
  j.marcas = j.marcas.map(m => (m === 'x' ? '' : m));
}

export type ResultadoGato = 'certo' | 'venceu' | 'errado' | 'perdeu' | 'nada';

/**
 * Tenta pôr um gato.
 * - Certo: o gato fica (com foto para desfazer). No modo preguiça, marca ✕ em tudo que ele bloqueia.
 * - Errado: o gato não fica e perde 1 coração (sem foto: não há o que desfazer).
 */
export function porGato(j: Jogo, f: Fase, casa: number, preguica: boolean): ResultadoGato {
  if (j.marcas[casa] === 'gato' || j.coracoes <= 0) return 'nada';
  if (!ehResposta(f, casa)) {
    j.coracoes--;
    return j.coracoes <= 0 ? 'perdeu' : 'errado';
  }
  guardar(j);
  j.marcas[casa] = 'gato';
  if (preguica) {
    for (let s = 0; s < j.marcas.length; s++) {
      if (j.marcas[s] === '' && seAtacam(f, casa, s)) j.marcas[s] = 'x';
    }
  }
  return gatosPostos(j) === f.n ? 'venceu' : 'certo';
}

export const gatosPostos = (j: Jogo) => j.marcas.filter(m => m === 'gato').length;
