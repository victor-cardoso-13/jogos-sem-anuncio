import { describe, expect, it } from 'vitest';
import { daNuvem, iguais, mesclar, paraNuvem } from '../src/nuvem/mesclar.ts';
import type { ProgressoTamanho, Salvo } from '../src/ui/salvar.ts';

const tam = (fase: number, extra: Partial<ProgressoTamanho> = {}): ProgressoTamanho => ({ fase, jogo: null, atualizadoEm: 0, ...extra });
const salvo = (tamanhos: Record<number, ProgressoTamanho>, preguica = 0, preguicaEm = 0): Salvo => ({ preguica, preguicaEm, tamanhos });

describe('formato da nuvem', () => {
  it('ida e volta mantém fase, marcas e corações (o "Desfazer" não vai)', () => {
    const s = salvo({
      7: tam(12, {
        rodada: 1, atualizadoEm: 5, faseTexto: 'abc|0',
        jogo: { marcas: ['', 'x', 'gato', ''], coracoes: 2, historico: [['', '', '', '']] },
      }),
      9: tam(3),
    }, 2, 9);
    const volta = daNuvem(paraNuvem(s));
    expect(volta.tamanhos[7].fase).toBe(12);
    expect(volta.tamanhos[7].jogo?.marcas).toEqual(['', 'x', 'gato', '']);
    expect(volta.tamanhos[7].jogo?.coracoes).toBe(2);
    expect(volta.tamanhos[7].jogo?.historico).toEqual([]);
    expect(volta.tamanhos[7].faseTexto).toBe('abc|0');
    expect(volta.tamanhos[9].jogo).toBeNull();
    expect(volta.preguica).toBe(2);
    expect(iguais(s, volta)).toBe(true);
  });

  it('o Firebase aceita: sem listas dentro de listas e sem "undefined"', () => {
    const s = salvo({ 5: tam(1, { jogo: { marcas: ['x'], coracoes: 3, historico: [['x'], ['']] } }), 6: { fase: 0, jogo: null } });
    const texto = JSON.stringify(paraNuvem(s), (_, v) => {
      if (v === undefined) throw new Error('undefined');
      if (Array.isArray(v) && v.some(Array.isArray)) throw new Error('lista dentro de lista');
      return v;
    });
    expect(texto).toContain('"marcas":"x"');
  });
});

describe('juntar aparelho e nuvem', () => {
  it('fica com quem está mais adiante em cada tamanho', () => {
    const celular = salvo({ 5: tam(10), 9: tam(2) });
    const computador = salvo({ 5: tam(4), 9: tam(7), 10: tam(1) });
    const j = mesclar(celular, computador);
    expect(j.tamanhos[5].fase).toBe(10);
    expect(j.tamanhos[9].fase).toBe(7);
    expect(j.tamanhos[10].fase).toBe(1);
  });

  it('"Começar de novo" (rodada nova) vence uma fase maior da rodada antiga', () => {
    const recomecou = salvo({ 5: tam(0, { rodada: 1, atualizadoEm: 10 }) });
    const antigo = salvo({ 5: tam(1000, { rodada: 0, atualizadoEm: 99 }) });
    expect(mesclar(recomecou, antigo).tamanhos[5].fase).toBe(0);
    expect(mesclar(antigo, recomecou).tamanhos[5].fase).toBe(0);
  });

  it('mesma fase: fica com a partida mexida por último', () => {
    const velho = salvo({ 7: tam(3, { atualizadoEm: 100, jogo: { marcas: ['x'], coracoes: 3, historico: [] } }) });
    const novo = salvo({ 7: tam(3, { atualizadoEm: 200, jogo: { marcas: ['gato'], coracoes: 2, historico: [] } }) });
    expect(mesclar(velho, novo).tamanhos[7].jogo?.marcas).toEqual(['gato']);
    expect(mesclar(novo, velho).tamanhos[7].jogo?.marcas).toEqual(['gato']);
  });

  it('modo preguiça: vale o que foi mudado por último', () => {
    expect(mesclar(salvo({}, 1, 5), salvo({}, 0, 9)).preguica).toBe(0);
    expect(mesclar(salvo({}, 2, 9), salvo({}, 0, 5)).preguica).toBe(2);
  });

  it('nuvem antiga (preguiça sim/não) vira modo 1 ou 0', () => {
    const antigo = { versao: 1 as const, preguica: true, preguicaEm: 1, tamanhos: {} };
    expect(daNuvem(antigo).preguica).toBe(1);
    expect(daNuvem({ ...antigo, preguica: false }).preguica).toBe(0);
  });

  it('"Zerar progresso" (rodada nova em todos) não é desfeito pela nuvem nem por outro aparelho', () => {
    const zerado = salvo({ 5: tam(0, { rodada: 1, atualizadoEm: 50 }), 9: tam(0, { rodada: 3, atualizadoEm: 50 }) });
    const outroAparelho = salvo({ 5: tam(500, { rodada: 0, atualizadoEm: 99 }), 9: tam(40, { rodada: 2, atualizadoEm: 99 }) });
    const j = mesclar(outroAparelho, zerado);
    expect(j.tamanhos[5].fase).toBe(0);
    expect(j.tamanhos[9].fase).toBe(0);
  });

  it('gatinho: vale a escolha mais recente; sem escolha (ou desconhecido) é o creme', () => {
    const celular: Salvo = { ...salvo({}), gatinho: 'sentado', gatinhoEm: 10 };
    const computador: Salvo = { ...salvo({}), gatinho: 'traco', gatinhoEm: 20 };
    expect(mesclar(celular, computador).gatinho).toBe('traco');
    expect(mesclar(computador, celular).gatinho).toBe('traco');
    expect(daNuvem(paraNuvem(celular)).gatinho).toBe('sentado');
    expect(daNuvem({ versao: 1, preguica: 0, preguicaEm: 0, tamanhos: {} }).gatinho).toBe('creme');
    expect(mesclar(salvo({}), { ...salvo({}), gatinho: 'dinossauro', gatinhoEm: 5 }).gatinho).toBe('creme');
  });

  it('não mexe nas cópias originais', () => {
    const a = salvo({ 5: tam(2, { jogo: { marcas: ['x'], coracoes: 3, historico: [] } }) });
    const j = mesclar(a, salvo({}));
    j.tamanhos[5].jogo!.marcas[0] = 'gato';
    expect(a.tamanhos[5].jogo!.marcas[0]).toBe('x');
  });
});
