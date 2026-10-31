/**
 * O HTML de cada tela. Só monta texto; quem liga os toques é o main.ts.
 */
import { CORES, FASES_POR_TAMANHO, TAMANHOS } from '../motor/regras.ts';
import type { Fase } from '../motor/fase.ts';
import { progresso, type Salvo } from './salvar.ts';
import type { Situacao } from '../nuvem/sincronia.ts';

const svg = (d: string) => `<svg viewBox="0 0 24 24">${d}</svg>`;

const ICONES = {
  voltar: svg('<path d="m15 18-6-6 6-6"/>'),
  desfazer: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  apagar: svg('<path d="M7 21h10"/><path d="m14.5 4.5 5 5-9.5 9.5H6l-2.5-2.5a1.5 1.5 0 0 1 0-2.1z"/><path d="m9 10 5 5"/>'),
  dica: svg('<path d="M9 18h6"/><path d="M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.6V16h6v-.1c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5z"/>'),
  recomecar: svg('<path d="M3 12a9 9 0 1 0 2.8-6.5L3 8"/><path d="M3 3v5h5"/>'),
  preguica: svg('<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.5 6.5 0 0 0 10 10z"/>'),
};

/** Desenhinho decorativo do tamanho: uma grade n×n com faixas coloridas. */
function miniatura(n: number) {
  let casas = '';
  for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) {
    casas += `<i style="background:${CORES[(Math.floor(l / 2) * 3 + Math.floor(c / 2)) % n].fundo}"></i>`;
  }
  return `<div class="mini" style="grid-template-columns:repeat(${n},1fr)">${casas}</div>`;
}

const escapar = (t: string) => t.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

/** Faixa da conta na tela inicial: quem está jogando e se está salvo na nuvem. */
function faixaConta(email: string | null, situacao: Situacao) {
  if (situacao === 'verificando') return '<div class="conta"><span class="estado">☁️ …</span></div>';
  if (!email) {
    return `
      <div class="conta">
        <span class="estado">Sem conta: o progresso fica só neste aparelho.</span>
        <button class="link" id="abrir-conta">Entrar ou criar conta</button>
      </div>`;
  }
  const textos: Record<Situacao, string> = {
    verificando: '', 'sem-conta': '',
    salvo: '☁️ Salvo na nuvem',
    enviando: '☁️ Salvando…',
    'sem-internet': '📴 Sem internet — salva quando voltar',
  };
  return `
    <div class="conta">
      <span class="estado"><b>${escapar(email)}</b> · ${textos[situacao]}</span>
      <button class="link" id="sair-conta">Sair</button>
    </div>`;
}

export function htmlInicio(s: Salvo, email: string | null, situacao: Situacao) {
  const cartoes = TAMANHOS.map(({ n, nivel }) => {
    const p = progresso(s, n);
    const feitas = Math.min(p.fase, FASES_POR_TAMANHO);
    const texto = feitas >= FASES_POR_TAMANHO ? 'Todas! 🏆' : `Fase ${feitas + 1}`;
    return `
      <button class="cartao" data-tamanho="${n}">
        ${miniatura(n)}
        <div class="textos">
          <div class="titulo">${n}×${n}</div>
          <div class="nivel">${nivel} · ${feitas} de ${FASES_POR_TAMANHO}</div>
          <div class="progresso"><div style="width:${(feitas / FASES_POR_TAMANHO) * 100}%"></div></div>
        </div>
        <div class="fase">${texto}</div>
      </button>`;
  }).join('');
  return `
    <div class="inicio">
      <h1>Miaudoku 🐱</h1>
      <div class="sub">Cada gato no seu cantinho</div>
      ${faixaConta(email, situacao)}
      ${cartoes}
    </div>`;
}

export function htmlJogo(n: number, numero: number, nivel: string, preguica: boolean) {
  const botao = (id: string, icone: string, rotulo: string, extra = '') =>
    `<button id="${id}" ${extra}><span class="icone">${icone}</span><span class="rotulo">${rotulo}</span></button>`;
  return `
    <header class="topo">
      <button class="voltar" id="voltar" title="Voltar ao início">${ICONES.voltar}</button>
      <div class="nome"><h2>Fase ${numero + 1}</h2><div class="nivel">${n}×${n} · ${nivel}</div></div>
      <div class="coracoes" id="coracoes"></div>
    </header>
    <div class="aviso" id="aviso"></div>
    <div class="grade" id="grade" style="--n:${n}"></div>
    <nav class="barra">
      ${botao('desfazer', ICONES.desfazer, 'Desfazer')}
      ${botao('apagar', ICONES.apagar, 'Apagar ✕')}
      ${botao('dica', ICONES.dica, 'Dica')}
      ${botao('recomecar', ICONES.recomecar, 'Recomeçar')}
      ${botao('preguica', ICONES.preguica, 'Preguiça', `class="${preguica ? 'ligado' : ''}" title="Modo preguiça"`)}
    </nav>`;
}

/** Cria as casas da grade: cor de fundo e bordas (grossas entre cores diferentes). */
export function montarGrade(grade: HTMLElement, f: Fase) {
  const { n, regiao } = f;
  grade.innerHTML = '';
  for (let s = 0; s < n * n; s++) {
    const l = Math.floor(s / n), c = s % n;
    const d = document.createElement('div');
    d.className = 'casa';
    d.dataset.casa = String(s);
    d.style.background = CORES[regiao[s]].fundo;
    const lado = (nome: string, vizinho: number, existe: boolean) => {
      if (!existe) return;
      const outra = regiao[vizinho] !== regiao[s];
      d.style.setProperty(`border-${nome}-width`, outra ? '1.5px' : '0.5px');
      d.style.setProperty(`border-${nome}-color`, outra ? '#3b2f2a' : '#3b2f2a33');
    };
    lado('top', s - n, l > 0);
    lado('bottom', s + n, l < n - 1);
    lado('left', s - 1, c > 0);
    lado('right', s + 1, c < n - 1);
    grade.appendChild(d);
  }
}

export function htmlJanela(emoji: string, titulo: string, texto: string, botoes: { id: string; rotulo: string; claro?: boolean }[]) {
  return `
    <div class="tampa" id="tampa">
      <div class="caixa">
        <div class="grande">${emoji}</div>
        <h3>${titulo}</h3>
        ${texto ? `<p>${texto}</p>` : ''}
        ${botoes.map(b => `<button class="botao ${b.claro ? 'claro' : ''}" id="${b.id}">${b.rotulo}</button>`).join('')}
      </div>
    </div>`;
}

/** Janela de entrar / criar conta. */
export function htmlConta() {
  return `
    <div class="tampa" id="tampa">
      <form class="caixa formulario" id="form-conta" novalidate>
        <div class="grande">☁️</div>
        <h3>Sua conta</h3>
        <p>Com uma conta, o seu progresso fica guardado na nuvem e aparece em qualquer aparelho.</p>
        <input id="email" type="email" autocomplete="username" inputmode="email" placeholder="E-mail" autocapitalize="off" spellcheck="false" />
        <input id="senha" type="password" autocomplete="current-password" placeholder="Senha (pelo menos 6)" />
        <div class="erro" id="erro-conta"></div>
        <button class="botao" type="submit" id="entrar">Entrar</button>
        <button class="botao claro" type="button" id="criar">Criar conta nova</button>
        <button class="link" type="button" id="esqueci">Esqueci a senha</button>
        <button class="link" type="button" id="fechar-conta">Agora não</button>
      </form>
    </div>`;
}
