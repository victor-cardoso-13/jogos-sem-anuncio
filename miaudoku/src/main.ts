/**
 * Miaudoku — controle da tela.
 * Liga os toques e botões às regras (src/motor) e guarda o progresso (src/ui/salvar).
 */
import './estilo.css';
import type { Fase } from './motor/fase.ts';
import { acharDica, type Dica } from './motor/dica.ts';
import { apagarTodosX, definirX, desfazer, gatosPostos, guardar, novoJogo, porGato, type Jogo } from './motor/jogo.ts';
import { CORACOES, FASES_POR_TAMANHO, FOLGA_DUPLO_TOQUE, TAMANHOS, TEMPO_DUPLO_TOQUE_MS } from './motor/regras.ts';
import { htmlConta, htmlInicio, htmlJanela, htmlJogo, montarGrade } from './ui/desenho.ts';
import { carregarFase } from './ui/pacotes.ts';
import { carregar, progresso, salvar, tocar } from './ui/salvar.ts';
import {
  carregarConta, iniciarNuvem, levarProgressoSemConta, progressoSemConta, sairDaConta,
  sincronizar, situacaoAtual, trocarGaveta, usuarioAtual,
} from './nuvem/sincronia.ts';

const app = document.getElementById('app')!;
/** Progresso de quem está jogando (troca quando alguém entra ou sai da conta). */
let salvo = carregar();
let tela: 'inicio' | 'jogo' = 'inicio';

const TEXTO_INICIAL = 'Dois toques põem um gato. Um toque (ou arrastar) marca ✕.';

// Partida aberta agora
let n = 0;
let numero = 0;
let fase: Fase | null = null;
let jogo: Jogo | null = null;
let dicaAtual: Dica | null = null;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => app.querySelector<T>(sel)!;

// ---------------------------------------------------------------------------
// Tela inicial
// ---------------------------------------------------------------------------

function mostrarInicio(buscarNuvem = true) {
  tela = 'inicio';
  fase = jogo = null;
  app.onpointerdown = app.onpointermove = null;
  desenharInicio();
  // traz o progresso feito em outro aparelho
  if (buscarNuvem && usuarioAtual()) void sincronizar(salvo).then(trocarSalvo);
}

function desenharInicio() {
  if (tela !== 'inicio' || app.querySelector('#tampa')) return; // não apaga uma janela aberta
  app.innerHTML = htmlInicio(salvo, usuarioAtual()?.email ?? null, situacaoAtual());
  app.querySelectorAll<HTMLElement>('[data-tamanho]').forEach(b => {
    b.onclick = () => abrirTamanho(Number(b.dataset.tamanho));
  });
  app.querySelector<HTMLElement>('#abrir-conta')?.addEventListener('click', abrirConta);
  app.querySelector<HTMLElement>('#sair-conta')?.addEventListener('click', confirmarSair);
}

/** Usa o progresso juntado com a nuvem (só na tela inicial, para não atrapalhar uma partida). */
function trocarSalvo(novo: typeof salvo) {
  if (tela !== 'inicio') return;
  salvo = novo;
  desenharInicio();
}

async function abrirTamanho(tam: number) {
  const p = progresso(salvo, tam);
  if (p.fase >= FASES_POR_TAMANHO) {
    janela('🏆', `Você terminou as ${FASES_POR_TAMANHO} fases de ${tam}×${tam}!`, 'Quer jogar todas de novo, desde a Fase 1?', [
      { id: 'j-repetir', rotulo: 'Começar de novo', acao: () => {
        p.fase = 0;
        p.jogo = null;
        p.rodada = (p.rodada ?? 0) + 1; // a nuvem entende que é uma volta nova, não um atraso
        tocar(salvo, tam);
        salvar(salvo);
        abrirTamanho(tam);
      } },
      { id: 'j-inicio', rotulo: 'Voltar', claro: true, acao: mostrarInicio },
    ]);
    return;
  }
  const carregada = await carregarFase(tam, p.fase);
  if (!carregada) {
    janela('😿', 'Fases não encontradas', `As fases de ${tam}×${tam} ainda não foram criadas.`, [
      { id: 'j-inicio', rotulo: 'Voltar', acao: mostrarInicio },
    ]);
    return;
  }
  const f = carregada.fase;
  // partida salva de uma fase que mudou (fases recriadas): começa do zero
  if (p.jogo && p.faseTexto !== carregada.texto) p.jogo = null;
  n = tam;
  numero = p.fase;
  fase = f;
  jogo = p.jogo ?? novoJogo(f);
  p.jogo = jogo;
  p.faseTexto = carregada.texto;
  mostrarJogo();
}

// ---------------------------------------------------------------------------
// Tela da fase
// ---------------------------------------------------------------------------

function mostrarJogo() {
  tela = 'jogo';
  const nivel = TAMANHOS.find(t => t.n === n)!.nivel;
  app.innerHTML = htmlJogo(n, numero, nivel, salvo.preguica);
  montarGrade($('#grade'), fase!);
  ligarToques();
  ligarBotoes();
  avisar(TEXTO_INICIAL);
  atualizar();
}

/** Mostra as marcas e os corações, e guarda tudo no aparelho. */
function atualizar() {
  if (!jogo) return;
  dicaAtual = null;
  const grade = $('#grade');
  grade.classList.remove('com-dica');
  grade.querySelectorAll<HTMLElement>('.casa').forEach((el, s) => {
    el.className = 'casa' + (jogo!.marcas[s] ? ' ' + jogo!.marcas[s] : '');
  });
  $('#coracoes').textContent = '❤️'.repeat(jogo.coracoes) + '🤍'.repeat(CORACOES - jogo.coracoes);
  tocar(salvo, n);
  salvar(salvo);
}

function avisar(texto: string) {
  $('#aviso').textContent = texto;
  encaixar();
}

/** Faz a grade ocupar o maior espaço possível, sem barra de rolagem. */
function encaixar() {
  const grade = app.querySelector<HTMLElement>('#grade');
  if (!grade) return;
  const outros = ['.topo', '#aviso', '.barra'].reduce((s, sel) => s + $(sel).offsetHeight, 0);
  const estilo = getComputedStyle(app);
  const folga = parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom) + 12 * 3;
  const largura = app.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
  const lado = Math.max(160, Math.min(largura, app.clientHeight - outros - folga, 640));
  grade.style.setProperty('--lado', `${Math.floor(lado)}px`);
}
addEventListener('resize', encaixar);

// ---- Toques na grade: 1 toque/arrastar = ✕, 2 toques = gato ----

function ligarToques() {
  const grade = $('#grade');
  let ultimo = { casa: -1, t: 0, x: 0, y: 0 };
  let arrasto: { valor: '' | 'x'; x: number; y: number; ativo: boolean } | null = null;
  const tamanhoCasa = () => grade.clientWidth / n;

  const casaEm = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    return el?.dataset.casa !== undefined ? Number(el.dataset.casa) : null;
  };

  // Escuta a tela toda: o 2º toque de um "dois toques" pode cair fora da grade.
  app.onpointerdown = e => {
    if (!jogo || !fase) return;
    const agora = Date.now();
    // Segundo toque: vale pelo TEMPO e pela DISTÂNCIA do primeiro, não pela casa.
    // Assim, se o dedo cair um pouco na casa do lado, o gato vai para a casa do 1º toque.
    const perto = Math.hypot(e.clientX - ultimo.x, e.clientY - ultimo.y) < tamanhoCasa() * FOLGA_DUPLO_TOQUE;
    if (ultimo.casa >= 0 && agora - ultimo.t < TEMPO_DUPLO_TOQUE_MS && perto) {
      desfazer(jogo); // tira o ✕ do primeiro toque
      ultimo.t = 0;
      arrasto = null;
      tentarGato(ultimo.casa);
      return;
    }
    // (só agora olha a casa: fora da grade, um toque simples não faz nada)
    if (!(e.target as HTMLElement).closest('.grade')) return;
    const casa = casaEm(e.clientX, e.clientY);
    if (casa === null || jogo.marcas[casa] === 'gato') return;
    ultimo = { casa, t: agora, x: e.clientX, y: e.clientY };
    guardar(jogo);
    const valor = jogo.marcas[casa] === 'x' ? '' : 'x';
    definirX(jogo, casa, valor);
    arrasto = { valor, x: e.clientX, y: e.clientY, ativo: false };
    atualizar();
    if (dicaVisivel) avisar(TEXTO_INICIAL);
  };
  app.onpointermove = e => {
    if (!arrasto || !jogo) return;
    if (e.buttons === 0) {
      arrasto = null; // botão do mouse já foi solto fora da janela
      return;
    }
    if (!arrasto.ativo) {
      // dedo que escorrega um pouquinho não é arrasto: só vale depois de andar meia casa
      if (Math.hypot(e.clientX - arrasto.x, e.clientY - arrasto.y) < tamanhoCasa() * 0.5) return;
      arrasto.ativo = true;
      ultimo.t = 0; // virou arrasto: não pode mais ser o 1º toque de um "dois toques"
    }
    const casa = casaEm(e.clientX, e.clientY);
    if (casa === null || jogo.marcas[casa] === 'gato' || jogo.marcas[casa] === arrasto.valor) return;
    definirX(jogo, casa, arrasto.valor);
    atualizar();
  };
  onpointerup = onpointercancel = () => (arrasto = null);
}

let dicaVisivel = false;

function tentarGato(casa: number) {
  if (!jogo || !fase) return;
  const r = porGato(jogo, fase, casa, salvo.preguica);
  atualizar();
  dicaVisivel = false;
  if (r === 'certo') {
    const faltam = n - gatosPostos(jogo);
    avisar(faltam === 1 ? 'Isso! Falta 1 gato.' : `Isso! Faltam ${faltam} gatos.`);
  } else if (r === 'errado' || r === 'perdeu') {
    const el = $('#grade').children[casa] as HTMLElement;
    el.classList.add('errado');
    setTimeout(() => el.classList.remove('errado'), 500);
    $('#coracoes').classList.remove('perdeu');
    void $('#coracoes').offsetWidth; // reinicia a animação
    $('#coracoes').classList.add('perdeu');
    navigator.vibrate?.(120);
    if (r === 'errado') avisar('Aqui não tem gato. Perdeu 1 coração.');
    else setTimeout(perdeu, 600);
  } else if (r === 'venceu') {
    avisar('Muito bem! 🎉');
    venceu();
  }
}

function venceu() {
  const p = progresso(salvo, n);
  p.fase = numero + 1;
  p.jogo = null;
  tocar(salvo, n);
  salvar(salvo);
  const ultima = p.fase >= FASES_POR_TAMANHO;
  setTimeout(() => janela('🎉🐱', `Fase ${numero + 1} concluída!`, 'Todos os gatos têm seu cantinho.', [
    ultima
      ? { id: 'j-inicio', rotulo: 'Voltar ao início', acao: mostrarInicio }
      : { id: 'j-proxima', rotulo: 'Próxima fase', acao: () => abrirTamanho(n) },
    ...(ultima ? [] : [{ id: 'j-inicio', rotulo: 'Início', claro: true, acao: mostrarInicio }]),
  ]), 350);
}

function perdeu() {
  const p = progresso(salvo, n);
  p.jogo = null;
  tocar(salvo, n);
  salvar(salvo);
  janela('😿', 'Acabaram os corações', 'A fase vai recomeçar do zero.', [
    { id: 'j-tentar', rotulo: 'Tentar de novo', acao: () => abrirTamanho(n) },
    { id: 'j-inicio', rotulo: 'Início', claro: true, acao: mostrarInicio },
  ]);
}

// ---- Botões ----

function ligarBotoes() {
  $('#voltar').onclick = () => mostrarInicio();
  $('#desfazer').onclick = () => {
    if (jogo && desfazer(jogo)) {
      atualizar();
      avisar(TEXTO_INICIAL);
    }
  };
  $('#apagar').onclick = () => {
    if (!jogo) return;
    apagarTodosX(jogo);
    atualizar();
    avisar(TEXTO_INICIAL);
  };
  $('#recomecar').onclick = () => {
    if (!fase) return;
    jogo = novoJogo(fase);
    progresso(salvo, n).jogo = jogo;
    atualizar();
    avisar('A fase recomeçou do zero.');
  };
  $('#preguica').onclick = () => {
    salvo.preguica = !salvo.preguica;
    salvo.preguicaEm = Date.now();
    $('#preguica').classList.toggle('ligado', salvo.preguica);
    salvar(salvo);
    avisar(salvo.preguica
      ? 'Modo preguiça ligado: ao acertar um gato, o jogo marca ✕ em todas as casas que ele bloqueia.'
      : 'Modo preguiça desligado: você marca os ✕ do seu jeito.');
  };
  $('#dica').onclick = mostrarDica;
}

function mostrarDica() {
  if (!jogo || !fase) return;
  atualizar();
  const d = acharDica(fase, jogo.marcas);
  if (!d) return;
  const grade = $('#grade');
  const el = (s: number) => grade.children[s] as HTMLElement;
  grade.classList.add('com-dica');
  d.area.forEach(s => el(s).classList.add('dica-area'));
  d.alvo.forEach(s => el(s).classList.add('dica-alvo'));
  d.marcarX.forEach(s => el(s).classList.add('dica-x'));
  dicaAtual = d;
  dicaVisivel = true;

  const aviso = $('#aviso');
  aviso.textContent = '💡 ' + d.texto;
  const fazer = document.createElement('button');
  fazer.className = 'fazer';
  fazer.textContent = 'Fazer para mim';
  fazer.onclick = () => fazerDica(d);
  aviso.append(document.createElement('br'), fazer);
  encaixar();
}

function fazerDica(d: Dica) {
  if (!jogo || !fase || dicaAtual !== d) return;
  dicaVisivel = false;
  const { gato, marcar, tirarX } = d.acao;
  if (gato !== undefined) return tentarGato(gato);
  guardar(jogo);
  if (tirarX !== undefined) jogo.marcas[tirarX] = '';
  for (const s of marcar ?? []) definirX(jogo, s, 'x');
  atualizar();
  avisar(TEXTO_INICIAL);
}

// ---------------------------------------------------------------------------
// Janela (vitória, derrota, avisos)
// ---------------------------------------------------------------------------

function janela(emoji: string, titulo: string, texto: string, botoes: { id: string; rotulo: string; claro?: boolean; acao: () => void }[]) {
  app.querySelector('#tampa')?.remove();
  app.insertAdjacentHTML('beforeend', htmlJanela(emoji, titulo, texto, botoes));
  for (const b of botoes) {
    $(`#${b.id}`).onclick = () => {
      app.querySelector('#tampa')?.remove();
      b.acao();
    };
  }
}

// iPhone: o Safari ignora o "sem zoom" da página. Bloqueia o zoom de dois toques
// e o de pinça; na grade, o toque é tratado só pelo nosso código (pointerdown).
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
app.addEventListener('touchend', e => {
  if ((e.target as HTMLElement).closest('.grade')) e.preventDefault();
}, { passive: false });

// ---------------------------------------------------------------------------
// Conta (entrar, criar, sair)
// ---------------------------------------------------------------------------

function abrirConta() {
  app.querySelector('#tampa')?.remove();
  app.insertAdjacentHTML('beforeend', htmlConta());
  const form = $<HTMLFormElement>('#form-conta');
  const email = $<HTMLInputElement>('#email');
  const senha = $<HTMLInputElement>('#senha');
  const erro = $('#erro-conta');
  const botoes = [...form.querySelectorAll<HTMLButtonElement>('button')];
  const fechar = () => { app.querySelector('#tampa')?.remove(); desenharInicio(); };

  const tentar = async (acao: 'entrar' | 'criar') => {
    erro.className = 'erro';
    erro.textContent = '';
    botoes.forEach(b => (b.disabled = true));
    try {
      const c = await carregarConta();
      if (acao === 'entrar') await c.entrar(email.value, senha.value);
      else await c.criarConta(email.value, senha.value);
      await depoisDeEntrar();
    } catch (e) {
      const c = await carregarConta().catch(() => null);
      erro.textContent = c ? c.mensagemDeErro(e) : 'Sem internet agora. Tente de novo quando a internet voltar.';
      botoes.forEach(b => (b.disabled = false));
    }
  };

  form.onsubmit = e => { e.preventDefault(); void tentar('entrar'); };
  $('#criar').onclick = () => void tentar('criar');
  $('#fechar-conta').onclick = fechar;
  $('#esqueci').onclick = async () => {
    erro.textContent = '';
    try {
      await (await carregarConta()).esqueciSenha(email.value);
      erro.className = 'erro ok';
      erro.textContent = 'Pronto! Se existir uma conta com esse e-mail, chega lá uma mensagem para criar uma senha nova.';
    } catch (e) {
      erro.className = 'erro';
      erro.textContent = (await carregarConta()).mensagemDeErro(e);
    }
  };
  email.focus();
}

/** Depois de entrar: abre a gaveta da conta, oferece levar o progresso "sem conta" e junta com a nuvem. */
async function depoisDeEntrar() {
  const u = usuarioAtual() ?? (await esperarUsuario());
  trocarGaveta(u.uid);
  salvo = carregar();
  app.querySelector('#tampa')?.remove();
  if (progressoSemConta()) {
    janela('📱', 'Levar o progresso deste aparelho?',
      'Você jogou sem conta neste aparelho. Quer juntar esse progresso à sua conta? (Se este aparelho não é seu, escolha "Não".)', [
        { id: 'j-levar', rotulo: 'Sim, levar para a minha conta', acao: () => { salvo = levarProgressoSemConta(salvo); mostrarInicio(); } },
        { id: 'j-nao-levar', rotulo: 'Não', claro: true, acao: () => mostrarInicio() },
      ]);
    tela = 'inicio';
    return;
  }
  mostrarInicio();
}

/** Logo depois de entrar, o Firebase pode demorar um instante para avisar quem entrou. */
function esperarUsuario(): Promise<NonNullable<ReturnType<typeof usuarioAtual>>> {
  return new Promise(pronto => {
    const ver = () => { const u = usuarioAtual(); if (u) pronto(u); else setTimeout(ver, 50); };
    ver();
  });
}

function confirmarSair() {
  janela('👋', 'Sair da conta?', 'O seu progresso continua guardado na nuvem. Neste aparelho, o jogo volta para "sem conta".', [
    { id: 'j-sair', rotulo: 'Sair', acao: async () => { await sairDaConta(); } },
    { id: 'j-ficar', rotulo: 'Cancelar', claro: true, acao: desenharInicio },
  ]);
}

mostrarInicio(false);
void iniciarNuvem({
  // alguém entrou ou saiu: abre a gaveta certa e volta para a tela inicial
  trocouDeConta: () => {
    salvo = carregar();
    app.querySelector('#tampa:not(:has(#form-conta))')?.remove();
    if (tela === 'jogo') janela('👤', 'A conta mudou', 'Voltando para a tela inicial.', [{ id: 'j-ok', rotulo: 'Ok', acao: () => mostrarInicio() }]);
    else mostrarInicio();
  },
  mudouSituacao: () => {
    desenharInicio();
    if (tela === 'inicio' && usuarioAtual() && situacaoAtual() === 'salvo' && !sincronizouAoAbrir) {
      sincronizouAoAbrir = true;
      void sincronizar(salvo).then(trocarSalvo);
    }
  },
});
let sincronizouAoAbrir = false;
