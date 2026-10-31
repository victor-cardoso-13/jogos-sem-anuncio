/**
 * Carrega o pacote de fases de um tamanho só quando ele é aberto
 * (assim o jogo abre rápido mesmo com milhares de fases).
 */
import { deTexto, type Fase } from '../motor/fase.ts';

const arquivos = import.meta.glob<string[]>('../fases/*.json', { import: 'default' });
const carregados = new Map<number, string[]>();

export async function carregarPacote(n: number): Promise<string[]> {
  if (!carregados.has(n)) {
    const abrir = arquivos[`../fases/${n}.json`];
    carregados.set(n, abrir ? await abrir() : []);
  }
  return carregados.get(n)!;
}

/** A fase e o seu texto (o texto serve de "identidade" para conferir partidas salvas). */
export async function carregarFase(n: number, numero: number): Promise<{ fase: Fase; texto: string } | null> {
  const pacote = await carregarPacote(n);
  return numero < pacote.length ? { fase: deTexto(pacote[numero]), texto: pacote[numero] } : null;
}
