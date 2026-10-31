/**
 * REGRAS DA CASA
 * ==============
 * Tudo o que foi combinado para o Miaudoku fica aqui.
 *
 * - 1 gato por linha, 1 por coluna e 1 por cor.
 * - Gatos não encostam: nem de lado, nem em cima/embaixo, nem na diagonal.
 * - Cada fase tem uma resposta só, e dá para resolver só pensando (sem chute).
 * - Gato fora da resposta = erro: o gato some e perde 1 coração.
 * - Acabaram os corações: a mesma fase recomeça do zero.
 * - Dois toques põem gato; um toque (ou arrastar) marca ✕.
 * - Modo preguiça: ao acertar um gato, marca ✕ em tudo que ele bloqueia.
 */

export const CORACOES = 3;

/** Tempo máximo entre os dois toques para valer como "dois toques". */
export const TEMPO_DUPLO_TOQUE_MS = 450;

/**
 * Distância máxima entre os dois toques, em tamanhos de casa (0,8 = 80% de uma casa).
 * O segundo toque pode cair um pouco na casa do lado: o gato vai para a casa do primeiro.
 */
export const FOLGA_DUPLO_TOQUE = 0.8;

export interface Tamanho {
  n: number;
  nivel: string;
  /**
   * Menor número de casas que uma cor pode ter. Cor de 1 casa entrega o gato
   * de graça; nos tamanhos difíceis, as cores são maiores para dar mais trabalho.
   */
  menorCor: number;
}

export const TAMANHOS: Tamanho[] = [
  { n: 5, nivel: 'Fácil', menorCor: 1 },
  { n: 6, nivel: 'Médio', menorCor: 1 },
  { n: 7, nivel: 'Médio', menorCor: 1 },
  { n: 8, nivel: 'Difícil', menorCor: 1 },
  { n: 9, nivel: 'Muito difícil', menorCor: 4 },
  { n: 10, nivel: 'Desafio', menorCor: 4 },
];

/** Quantas fases numeradas cada tamanho tem (no máximo; o 5×5 pode ter menos). */
export const FASES_POR_TAMANHO = 1000;

/** Uma cor por região. O nome aparece nas dicas ("a região rosa"). */
export const CORES: { nome: string; fundo: string }[] = [
  { nome: 'rosa', fundo: '#f4c6cc' },
  { nome: 'azul', fundo: '#c4dcf2' },
  { nome: 'amarela', fundo: '#f7e3a3' },
  { nome: 'verde', fundo: '#cde8c6' },
  { nome: 'lilás', fundo: '#ddd0f3' },
  { nome: 'laranja', fundo: '#f8d0aa' },
  { nome: 'verde-água', fundo: '#bfe4de' },
  { nome: 'cinza', fundo: '#dddad5' },
  { nome: 'bege', fundo: '#ead8c3' },
  { nome: 'oliva', fundo: '#e0e3b4' },
];
