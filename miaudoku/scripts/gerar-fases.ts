/**
 * Cria os pacotes de fases numeradas (src/fases/N.json). Rode UMA vez:
 *   npm run gerar            → todos os tamanhos
 *   npm run gerar -- 9 10    → só alguns
 *
 * Divide o trabalho em vários processos (um por núcleo do Mac), junta tudo,
 * tira repetidas (inclusive giradas/espelhadas) e ordena da mais fácil para a mais difícil.
 * ATENÇÃO: os pacotes já criados são "congelados". Como vários processos trabalham
 * ao mesmo tempo, rodar de novo gera fases DIFERENTES, e o progresso salvo dos
 * jogadores passaria a apontar para outras fases. Se precisar recriar, troque a
 * chave "miaudoku:v1" em src/ui/salvar.ts.
 */
import { fork } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { criarSorteio, tentarGerar } from '../src/motor/gerador.ts';
import { chaveSemSimetria, deTexto, paraTexto } from '../src/motor/fase.ts';
import { notaDificuldade, resolverComDicas } from '../src/motor/dica.ts';
import { FASES_POR_TAMANHO, TAMANHOS } from '../src/motor/regras.ts';

const AQUI = fileURLToPath(import.meta.url);

/** Processo ajudante: gera fases com a sua semente e manda para o principal. */
function trabalhar(n: number, semente: number, fim: number) {
  const rnd = criarSorteio(semente);
  const { menorCor } = TAMANHOS.find(t => t.n === n)!;
  const vistas = new Set<string>();
  let semNovidade = 0;
  while (Date.now() < fim && semNovidade < 400) {
    const f = tentarGerar(n, rnd, 3000, menorCor);
    if (!f) continue;
    const chave = chaveSemSimetria(n, f.regiao);
    if (vistas.has(chave)) {
      semNovidade++;
      continue;
    }
    semNovidade = 0;
    vistas.add(chave);
    process.send!(paraTexto(f));
  }
  process.exit(0);
}

async function gerarTamanho(n: number, limiteMin: number): Promise<string[]> {
  const nucleos = Math.max(1, availableParallelism() - 1);
  const fim = Date.now() + limiteMin * 60_000;
  const porChave = new Map<string, string>();
  const inicio = Date.now();
  const margem = TAMANHOS.find(t => t.n === n)!.menorCor > 1 ? 1.6 : 1.2;
  const filhos = [...Array(nucleos).keys()].map(k => fork(AQUI, ['--trabalhar', String(n), String(n * 1000 + k), String(fim)]));
  await new Promise<void>(pronto => {
    let vivos = filhos.length;
    for (const filho of filhos) {
      filho.on('message', (txt: unknown) => {
        const t = String(txt);
        const chave = chaveSemSimetria(n, deTexto(t).regiao);
        if (!porChave.has(chave)) porChave.set(chave, t);
        // gera fases a mais para depois ficar só com as mais difíceis
        if (porChave.size >= FASES_POR_TAMANHO * margem) filhos.forEach(f => f.kill());
      });
      filho.on('exit', () => --vivos === 0 && pronto());
    }
  });
  console.log(`  ${n}×${n}: ${porChave.size} fases diferentes em ${((Date.now() - inicio) / 1000).toFixed(0)} s`);

  // Ordem fixa (para o resultado não depender de qual processo terminou antes)
  const todas = [...porChave.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, t]) => t);
  const comNota = todas.map(t => ({ t, nota: notaDificuldade(resolverComDicas(deTexto(t)).dicas) }));
  // Sobrando fases, tira as mais fáceis de todas; depois ordena da mais fácil à mais difícil.
  comNota.sort((a, b) => a.nota - b.nota || (a.t < b.t ? -1 : 1));
  const escolhidas = comNota.slice(Math.max(0, comNota.length - FASES_POR_TAMANHO));
  return escolhidas.map(x => x.t);
}

if (process.argv[2] === '--trabalhar') {
  trabalhar(Number(process.argv[3]), Number(process.argv[4]), Number(process.argv[5]));
} else {
  const pedidos = process.argv.slice(2).map(Number);
  const tamanhos = TAMANHOS.map(t => t.n).filter(n => !pedidos.length || pedidos.includes(n));
  console.log('Gerando fases (pode levar alguns minutos)…');
  for (const n of tamanhos) {
    const fases = await gerarTamanho(n, n >= 10 ? 30 : 10);
    const destino = fileURLToPath(new URL(`../src/fases/${n}.json`, import.meta.url));
    writeFileSync(destino, JSON.stringify(fases, null, 0).replace(/","/g, '",\n"') + '\n');
    console.log(`  → guardadas ${fases.length} fases em src/fases/${n}.json`);
  }
}
