/**
 * TUTORIAL
 * ========
 * Aparece sozinho na primeira vez que a pessoa abre o jogo, e depois pela
 * janela da conta → "Como jogar". Dá para pular a qualquer momento.
 * Os desenhos usam uma grade 4×4 de exemplo (a mesma grade do jogo, em miniatura).
 */
import { deTexto } from '../motor/fase.ts';
import { icone, montarGrade, type NomeIcone } from './desenho.ts';

const VISTO = 'miaudoku:tutorial-visto';
export const jaViuTutorial = () => localStorage.getItem(VISTO) === '1';

// 4×4 de exemplo: rosa e azul em cima, amarela e verde embaixo; gatos nas colunas 2, 4, 1, 3.
const EXEMPLO = deTexto('aabbaabbccddccdd|1302');
const GATOS = EXEMPLO.resposta.map((c, l) => l * 4 + c);

interface Passo {
  titulo: string;
  texto: string;
  desenho: (palco: HTMLElement) => void;
}

/** Grade de exemplo com marcas: "g" gato, "x" ✕, "r" gato com problema. */
function exemplo(palco: HTMLElement, marcas: Record<number, string> = {}) {
  const g = document.createElement('div');
  g.className = 'grade exemplo';
  palco.appendChild(g);
  montarGrade(g, EXEMPLO, { tocavel: false, grossa: 2.4 });
  for (const [s, m] of Object.entries(marcas)) {
    const casa = g.children[Number(s)] as HTMLElement;
    casa.classList.add(m === 'g' ? 'gato' : m === 'x' ? 'x' : 'gato');
    if (m === 'r') casa.classList.add('problema');
  }
  return g;
}

const AJUDAS: [NomeIcone, string, string][] = [
  ['dica', 'Dica', 'mostra o próximo passo e explica o porquê'],
  ['desfazer', 'Desfazer', 'volta a última jogada'],
  ['apagar', 'Apagar ✕', 'limpa todos os ✕ da grade'],
  ['recomecar', 'Recomeçar', 'começa a fase do zero'],
  ['preguica', 'Preguiça', 'toque 1 vez: marca ✕ sozinho ao acertar um gato; 2 vezes: também acende onde só cabe um gato'],
];

const PASSOS: Passo[] = [
  {
    titulo: 'UM GATO EM CADA LINHA, COLUNA E COR',
    texto: 'Cada <b>linha</b>, cada <b>coluna</b> e cada <b>cor</b> tem exatamente <b>um gato</b>.',
    desenho: p => { exemplo(p, Object.fromEntries(GATOS.map(s => [s, 'g']))).classList.add('brilha'); },
  },
  {
    titulo: 'GATOS NÃO SE ENCOSTAM',
    texto: 'Dois gatos nunca ficam encostados: <b>nem do lado, nem na diagonal</b>.',
    desenho: p => {
      exemplo(p, { 1: 'g', 6: 'r' });
      p.insertAdjacentHTML('beforeend', '<div class="selo-nao">✕ não pode</div>');
    },
  },
  {
    titulo: 'DOIS TOQUES = GATO',
    texto: 'Toque <b>duas vezes rápido</b> numa casa para pôr um gato. Se ali não tiver gato, você perde uma <b>vida</b>.',
    desenho: p => {
      const g = exemplo(p);
      (g.children[1] as HTMLElement).classList.add('aparece-gato');
      p.insertAdjacentHTML('beforeend', '<div class="dedo dois-toques">👆</div>');
    },
  },
  {
    titulo: 'UM TOQUE = ✕',
    texto: 'Um toque marca <b>✕</b> ("aqui não tem gato"). <b>Arraste</b> o dedo para marcar várias casas de uma vez.',
    desenho: p => {
      const g = exemplo(p);
      [8, 9, 10, 11].forEach((s, i) => {
        const c = g.children[s] as HTMLElement;
        c.classList.add('aparece-x');
        c.style.setProperty('--atraso', `${0.35 + i * 0.3}s`);
      });
      p.insertAdjacentHTML('beforeend', '<div class="dedo arrasta">👆</div>');
    },
  },
  {
    titulo: '3 VIDAS POR FASE',
    texto: 'Errou um gato? Perde uma <b>vida</b>. Se as três acabarem, a fase recomeça do zero.',
    desenho: p => {
      p.insertAdjacentHTML('beforeend', `<div class="vidas-grandes">${icone('coracao')}${icone('coracao')}${icone('coracao', 'perde')}</div>`);
    },
  },
  {
    titulo: 'AJUDAS',
    texto: 'Ficou com dúvida? Os botões de baixo ajudam:',
    desenho: p => {
      p.insertAdjacentHTML('beforeend', `<ul class="ajudas">${AJUDAS.map(([ic, nome, oque]) =>
        `<li><span class="bola">${icone(ic)}</span><span><b>${nome}</b> — ${oque}</span></li>`).join('')}</ul>`);
    },
  },
];

/** Abre o tutorial por cima de tudo. "fim" é chamado ao terminar ou pular. */
export function abrirTutorial(raiz: HTMLElement, fim: () => void = () => {}) {
  let i = 0;
  const caixa = document.createElement('div');
  caixa.className = 'tutorial';
  caixa.id = 'tutorial';
  raiz.appendChild(caixa);

  const fechar = () => {
    localStorage.setItem(VISTO, '1');
    caixa.remove();
    fim();
  };

  const mostrar = () => {
    const p = PASSOS[i];
    const ultimo = i === PASSOS.length - 1;
    caixa.innerHTML = `
      <button class="link pular" id="tut-pular">Pular</button>
      <div class="pontos">${PASSOS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="desenho" id="tut-desenho"></div>
      <h2>${p.titulo}</h2>
      <p>${p.texto}</p>
      <div class="botoes">
        <button class="botao claro" id="tut-voltar" ${i === 0 ? 'disabled' : ''}>Voltar</button>
        <button class="botao" id="tut-proximo">${ultimo ? 'Começar a jogar' : 'Próximo'}</button>
      </div>`;
    p.desenho(caixa.querySelector('#tut-desenho')!);
    caixa.querySelector<HTMLElement>('#tut-pular')!.onclick = fechar;
    caixa.querySelector<HTMLElement>('#tut-voltar')!.onclick = () => { i = Math.max(0, i - 1); mostrar(); };
    caixa.querySelector<HTMLElement>('#tut-proximo')!.onclick = () => { if (ultimo) fechar(); else { i++; mostrar(); } };
  };
  mostrar();
}
