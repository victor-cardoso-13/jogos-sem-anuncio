/**
 * O HTML de cada tela. Só monta o desenho; quem liga os toques é o main.ts.
 */
import { CORES, FASES_POR_TAMANHO, TAMANHOS } from '../motor/regras.ts';
import type { Fase } from '../motor/fase.ts';
import { progresso, type Salvo } from './salvar.ts';
import type { Situacao } from '../nuvem/sincronia.ts';

// ---------------------------------------------------------------------------
// Ícones de traço (o mesmo estilo em todas as telas)
// ---------------------------------------------------------------------------

const TRACOS = {
  inicio: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  coracao: '<path d="M12 20s-7-4.4-9-9.2C1.7 7.4 4 4.5 7.1 4.5c2 0 3.6 1.2 4.9 3 1.3-1.8 2.9-3 4.9-3 3.1 0 5.4 2.9 4.1 6.3C19 15.6 12 20 12 20z"/>',
  desfazer: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  apagar: '<path d="M7 21h10"/><path d="m14.5 4.5 5 5-9.5 9.5H6l-2.5-2.5a1.5 1.5 0 0 1 0-2.1z"/><path d="m9 10 5 5"/>',
  dica: '<path d="M9 18h6"/><path d="M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.6V16h6v-.1c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5z"/>',
  recomecar: '<path d="M3 12a9 9 0 1 0 2.8-6.5L3 8"/><path d="M3 3v5h5"/>',
  preguica: '<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.5 6.5 0 0 0 10 10z"/>',
  seta: '<path d="m9 6 6 6-6 6"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
};
export type NomeIcone = keyof typeof TRACOS;
export const icone = (nome: NomeIcone, classe = '') => `<svg class="ic ${classe}" viewBox="0 0 24 24">${TRACOS[nome]}</svg>`;

/** Cor do selo de cada nível (fundo, letra). */
const SELO: Record<string, [string, string]> = {
  'Fácil': ['#cde8c6', '#2e6b2e'],
  'Médio': ['#f7e3a3', '#7a5b00'],
  'Difícil': ['#f8d0aa', '#8a4b12'],
  'Muito difícil': ['#f4c6cc', '#8e2b3a'],
  'Desafio': ['#ddd0f3', '#5b3b94'],
};
export const selo = (texto: string, nivel: string) => {
  const [fundo, cor] = SELO[nivel] ?? ['#eee', '#333'];
  return `<span class="selo" style="background:${fundo};color:${cor}">${texto}</span>`;
};

const escapar = (t: string) => t.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

// ---------------------------------------------------------------------------
// Grade (a do jogo e as prévias pequenas)
// ---------------------------------------------------------------------------

/**
 * Desenha a grade: as casas coloridas e, por cima, TODAS as linhas de uma vez
 * (finas e claras dentro da mesma cor, grossas e escuras entre cores diferentes).
 * Desenhar as linhas juntas, com pontas arredondadas, evita furinhos nas quinas.
 */
export function montarGrade(grade: HTMLElement, f: Fase, opcoes: { grossa?: number; tocavel?: boolean } = {}) {
  const { n, regiao } = f;
  const { grossa = 2.6, tocavel = true } = opcoes;
  grade.innerHTML = '';
  grade.style.setProperty('--n', String(n));
  for (let s = 0; s < n * n; s++) {
    const d = document.createElement('div');
    d.className = 'casa';
    if (tocavel) d.dataset.casa = String(s);
    d.style.background = CORES[regiao[s]].fundo;
    grade.appendChild(d);
  }
  const finas: string[] = [], grossas: string[] = [];
  for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) {
    const s = l * n + c;
    if (c < n - 1) (regiao[s] !== regiao[s + 1] ? grossas : finas).push(`M${c + 1} ${l}V${l + 1}`);
    if (l < n - 1) (regiao[s] !== regiao[s + n] ? grossas : finas).push(`M${c} ${l + 1}H${c + 1}`);
  }
  grade.insertAdjacentHTML('beforeend', `
    <svg class="linhas" viewBox="0 0 ${n} ${n}" preserveAspectRatio="none">
      <path d="${finas.join('')}" stroke="#3b2f2a" stroke-opacity=".16" stroke-width=".6" vector-effect="non-scaling-stroke" fill="none"/>
      <path d="${grossas.join('')}" stroke="#3b2f2a" stroke-width="${grossa}" stroke-linecap="round" vector-effect="non-scaling-stroke" fill="none"/>
    </svg>`);
}

// ---------------------------------------------------------------------------
// Tela inicial
// ---------------------------------------------------------------------------

const BLOCOS = [0, 1, 2, 3, 4, 5, 6, 9]; // cor de cada letra de MIAUDOKU

function botaoConta(email: string | null, situacao: Situacao) {
  if (situacao === 'verificando') return `<button class="pilula" id="conta">${icone('pessoa')}…</button>`;
  if (!email) return `<button class="pilula" id="conta">${icone('pessoa')}Entrar</button>`;
  const offline = situacao === 'sem-internet' ? '<i class="offline" title="Sem internet"></i>' : '';
  return `<button class="pilula" id="conta"><span class="avatar">${escapar(email[0].toUpperCase())}${offline}</span>Conta</button>`;
}

export function htmlInicio(s: Salvo, email: string | null, situacao: Situacao) {
  const cartoes = TAMANHOS.map(({ n, nivel }) => {
    const p = progresso(s, n);
    const feitas = Math.min(p.fase, FASES_POR_TAMANHO);
    const terminou = feitas >= FASES_POR_TAMANHO;
    return `
      <button class="cartao" data-tamanho="${n}">
        <div class="grade previa" data-previa="${n}"></div>
        <div class="meio">
          <div class="tam">${n}×${n}${selo(nivel.toUpperCase(), nivel)}</div>
          <div class="progresso"><div style="width:${Math.max(2, (feitas / FASES_POR_TAMANHO) * 100)}%"></div></div>
        </div>
        <div class="fase">${terminou ? 'TODAS<b>🏆</b>' : `FASE<b>${feitas + 1}</b>`}</div>
        ${icone('seta', 'seta')}
      </button>`;
  }).join('');
  return `
    <div class="inicio">
      ${botaoConta(email, situacao)}
      <h1 class="blocos" aria-label="Miaudoku">${[...'MIAUDOKU'].map((l, i) => `<span style="background:${CORES[BLOCOS[i]].fundo}">${l}</span>`).join('')}</h1>
      <div class="sub">QUEBRA-CABEÇA DE GATOS</div>
      <div class="lista">${cartoes}</div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Tela da fase
// ---------------------------------------------------------------------------

/** Botão da preguiça: muda a cada toque (desligado → 1 → 2) e mostra o número do modo. */
export function htmlBotaoPreguica(modo: number) {
  const classe = modo === 1 ? 'ligado' : modo === 2 ? 'ligado forte' : '';
  return `<button id="preguica" class="item ${classe}" aria-label="Modo preguiça ${modo || 'desligado'}">
    <span class="bola">${icone('preguica')}</span>${modo ? `<span class="num">${modo}</span>` : ''}<span class="rotulo">Preguiça</span>
  </button>`;
}

export function htmlJogo(n: number, numero: number, nivel: string, preguica: number) {
  const botao = (id: string, nome: NomeIcone, rotulo: string, classe = '') =>
    `<button id="${id}" class="item ${classe}"><span class="bola">${icone(nome)}</span><span class="rotulo">${rotulo}</span></button>`;
  return `
    <header class="topo">
      ${botao('voltar', 'inicio', 'Início')}
      <div class="titulo-fase">
        <h2>FASE ${numero + 1}</h2>
        ${selo(`${n}×${n} · ${nivel.toUpperCase()}`, nivel)}
      </div>
      <div class="item" id="vidas" aria-label="Vidas">
        <span class="bola coracoes">${[0, 1, 2].map(() => icone('coracao')).join('')}</span>
        <span class="rotulo">Vidas</span>
      </div>
    </header>
    <div class="palco" id="palco"><div class="grade" id="grade"></div></div>
    <nav class="barra">
      ${botao('desfazer', 'desfazer', 'Desfazer')}
      ${botao('apagar', 'apagar', 'Apagar ✕')}
      ${botao('dica', 'dica', 'Dica')}
      ${botao('recomecar', 'recomecar', 'Recomeçar')}
      ${htmlBotaoPreguica(preguica)}
    </nav>`;
}

/** Cartão da dica (sobe de baixo, ou desce de cima se a dica estiver lá embaixo na grade). */
export function htmlCartaoDica(texto: string, emCima: boolean) {
  return `
    <div class="cartao-dica ${emCima ? 'em-cima' : ''}" id="cartao-dica">
      <div class="cab"><span class="lampada">${icone('dica')}</span>DICA</div>
      <p>${texto}</p>
      <div class="botoes">
        <button class="botao" id="fazer-dica">Fazer para mim</button>
        <button class="botao claro" id="fechar-dica">Entendi</button>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Janelas
// ---------------------------------------------------------------------------

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

/** Texto da situação da nuvem, para a janela da conta. */
export function textoSituacao(situacao: Situacao) {
  return {
    verificando: '', 'sem-conta': '',
    salvo: '☁️ Progresso salvo na nuvem.',
    enviando: '☁️ Salvando…',
    'sem-internet': '📴 Sem internet agora: salva sozinho quando a internet voltar.',
  }[situacao];
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
