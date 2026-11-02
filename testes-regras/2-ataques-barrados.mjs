import { chromium } from 'playwright';
const URL = 'http://127.0.0.1:5195/?emu';
const b = await chromium.launch();
async function jogador() { const ctx = await b.newContext({ viewport: { width: 430, height: 900 } }); const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(1500); await p.click('[data-acao="tutorialPular"]').catch(() => {}); return p; }
const texto = async p => p.locator('body').innerText();
const entrar = async (p, n, cod) => { await p.click('[data-acao="abrirOnline"]'); await p.fill('#nome-online', n); await p.fill('#codigo-online', cod); await p.click('[data-acao="onlineEntrar"]'); await p.waitForTimeout(2200); };
const A = await jogador(), B = await jogador(), C = await jogador(), D = await jogador(), E = await jogador();
await A.click('[data-acao="abrirOnline"]'); await A.fill('#nome-online', 'Ana'); await A.click('[data-acao="onlineCriar"]'); await A.waitForTimeout(2200);
const cod = /Sala ([A-Z2-9]{5})/.exec(await texto(A))[1];
await entrar(B, 'Beto', cod); await entrar(C, 'Cris', cod);
// ---- um 5º "de fora" e o 4º (cabe) ----
await entrar(D, 'Dani', cod); const naSala = /Na sala \((\d) de 4\)/.exec(await texto(A))?.[1];
await entrar(E, 'Edu', cod); const edu = (await texto(E)).includes('cheia') || !/Na sala/.test(await texto(E));
console.log('sala com 4:', naSala, '| 5ª pessoa barrada:', edu);
const op = (p, nome, caminho, dados) => p.evaluate(async ([nome, caminho, dados]) => {
  const { banco, doc, updateDoc, setDoc, deleteDoc, getDoc } = window.__fs; const r = doc(banco, ...caminho);
  try { if (nome === 'update') await updateDoc(r, dados); else if (nome === 'set') await setDoc(r, dados); else if (nome === 'delete') await deleteDoc(r); else if (nome === 'get') { const d = await getDoc(r); return d.exists() ? 'LIDO' : 'inexistente'; } return 'PERMITIDO'; }
  catch (e) { return 'recusado(' + e.code + ')'; }
}, [nome, caminho, dados]);
const uidDe = p => p.evaluate(() => window.__fs.auth.currentUser.uid);
const uB = await uidDe(B), uF = await uidDe(E);
const T = [];
const esperar = (rotulo, obtido, queria) => { const ok = obtido.startsWith(queria); T.push(ok); console.log(ok ? 'OK  ' : 'FALHOU', rotulo, '→', obtido); };
const S_ = ['salas', cod];
// ---- na espera ----
esperar('Beto (não é criador) troca o dono para si', await op(B, 'update', S_, { dono: uB }), 'recusado');
esperar('Beto muda as opções (só o criador pode)', await op(B, 'update', S_, { config: { curinga: true, modo: 'casual', limiteSeg: 120 } }), 'recusado');
esperar('Criador põe opção absurda (limite 99999)', await op(A, 'update', S_, { config: { curinga: true, modo: 'casual', limiteSeg: 99999 } }), 'recusado');
esperar('Estranha (Fran) entra por fora com 5 pessoas', await op(E, 'update', S_, { uids: [], jogadores: [] }), 'recusado');
esperar('Estranha apaga a sala', await op(E, 'delete', S_), 'recusado');
esperar('Beto apaga a sala', await op(B, 'delete', S_), 'recusado');
esperar('Estranha lê a sala sabendo o código (permitido por desenho)', await op(E, 'get', S_), 'LIDO');
esperar('Estranha cria sala com código ruim', await op(E, 'set', ['salas', 'abc'], { dono: uF }), 'recusado');
esperar('Estranha cria sala com nome de 200 letras', await op(E, 'set', ['salas', 'ZZZZ2'], { dono: uF, uids: [uF], jogadores: [{ uid: uF, nome: 'x'.repeat(200) }], fase: 'espera', rodada: 0, versao: 0, config: { curinga: false, modo: 'casual', limiteSeg: 180 } }), 'recusado');
// ---- começar; a Ana (criadora) joga a 1ª vez de verdade pelo app; aí a vez é do Beto (que NÃO é criador) ----
await A.click('[data-acao="onlineComecar"]'); await A.waitForTimeout(2500);
await A.click('[data-acao="comprar"]:not(.apagado)'); await A.waitForTimeout(1500);
const ler = () => A.evaluate(async (c) => { const { banco, doc, getDoc } = window.__fs; return (await getDoc(doc(banco, 'salas', c))).data(); }, cod);
let st = await ler(); const paginas = [A, B, C, D]; const vez = st.vez;
console.log('jogando; vez do índice', vez, '(0 = criadora)');
const daVez = paginas[vez], outro = paginas[(vez + 1) % 4], outro2 = paginas[(vez + 2) % 4];
const ana = await uidDe(A), prox = (vez + 1) % 4;
const v1 = (extra = {}) => ({ versao: st.versao + 1, ...extra });
// -- quem está na vez (não é criador) --
esperar('Da vez troca o dono para si', await op(daVez, 'update', S_, v1({ dono: await uidDe(daVez) })), 'recusado');
esperar('Da vez mexe nos pontos (totais)', await op(daVez, 'update', S_, v1({ totais: [999, 0, 0, 0] })), 'recusado');
esperar('Da vez pula versões (+5)', await op(daVez, 'update', S_, { versao: st.versao + 5, vez: prox, vezDesde: Date.now() }), 'recusado');
esperar('Da vez troca a lista de jogadores', await op(daVez, 'update', S_, v1({ jogadores: [] })), 'recusado');
// -- quem NÃO está na vez --
esperar('Fora da vez troca a mesa', await op(outro, 'update', S_, v1({ mesa: '[[{"id":"x"}]]', vez: prox, vezDesde: Date.now() })), 'recusado');
esperar('Fora da vez pula o tempo do outro (cedo demais)', await op(outro2, 'update', S_, v1({ vez: prox, vezDesde: Date.now() })), 'recusado');
const marcaSaida = st.jogadores.map((j, i) => (i === vez ? { ...j, removido: true } : j));
esperar('Fora da vez "tira" o jogador da vez (se passando por saída)', await op(outro, 'update', S_, v1({ jogadores: marcaSaida, vez: prox, vezDesde: Date.now() })), 'recusado');
// -- o próprio criador também não pode tudo --
esperar('Criadora pula a vez do Beto sem tirar ninguém', await op(A, 'update', S_, v1({ vez: prox, vezDesde: Date.now() })), 'recusado');
esperar('Criadora pula versões (+5)', await op(A, 'update', S_, { versao: st.versao + 5 }), 'recusado');
esperar('Criadora zera a rodada (fase de volta p/ espera)', await op(A, 'update', S_, v1({ fase: 'espera' })), 'recusado');
// -- mãos --
esperar('Beto lê a mão da Ana', await op(B, 'get', ['salas', cod, 'maos', ana]), 'recusado');
esperar('Beto troca a mão da Ana', await op(B, 'set', ['salas', cod, 'maos', ana], { cartas: '[]' }), 'recusado');
esperar('Beto grava mão com lixo extra', await op(B, 'set', ['salas', cod, 'maos', uB], { cartas: '[]', extra: 'x' }), 'recusado');
esperar('Beto grava mão gigante (50 mil letras)', await op(B, 'set', ['salas', cod, 'maos', uB], { cartas: 'x'.repeat(50000) }), 'recusado');
esperar('Pessoa de fora lê mãos reveladas', await op(E, 'get', ['salas', cod, 'reveladas', ana]), 'recusado');
esperar('Pessoa de fora escreve em pendentes', await op(E, 'set', ['salas', cod, 'pendentes', uB], { cartas: '[]' }), 'recusado');
// -- tempo de verdade: volta vezDesde no banco (acesso de administrador do emulador) --
await fetch(`http://127.0.0.1:8189/v1/projects/jogos-sem-anuncio/databases/(default)/documents/salas/${cod}?updateMask.fieldPaths=vezDesde`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { vezDesde: { integerValue: String(Date.now() - 400000) } } }) });
st = await ler();
esperar('Passou o tempo: outro da sala compra pelo atrasado e passa a vez', await op(outro2, 'update', S_, { monte: st.monte, cartas: st.cartas, vez: prox, vezDesde: Date.now(), versao: st.versao + 1 }), 'PERMITIDO');
console.log(T.every(Boolean) ? '\nTUDO COMO ESPERADO (' + T.length + ' verificações)' : '\nHÁ FALHAS: ' + T.filter(x => !x).length);
await b.close();
