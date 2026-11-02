import { chromium } from 'playwright';
const URL = 'http://127.0.0.1:5195/?emu';
const b = await chromium.launch();
async function jogador() { const ctx = await b.newContext({ viewport: { width: 430, height: 900 } }); const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(1500); await p.click('[data-acao="tutorialPular"]').catch(() => {}); return p; }
const texto = p => p.locator('body').innerText();
const T = []; const ok = (r, c, extra = '') => { T.push(c); console.log(c ? 'OK  ' : 'FALHOU', r, extra); };
const admin = async cod => { const r = await (await fetch(`http://127.0.0.1:8189/v1/projects/jogos-sem-anuncio/databases/(default)/documents/salas/${cod}`, { headers: { Authorization: 'Bearer owner' } })).json(); if (!r.fields) return null; const f = r.fields; return { fase: f.fase.stringValue, vez: +f.vez.integerValue, rodada: +f.rodada.integerValue, versao: +f.versao.integerValue, dono: f.dono.stringValue, uids: f.uids.arrayValue.values?.length ?? 0, removidos: f.jogadores.arrayValue.values.map(j => !!j.mapValue.fields.removido?.booleanValue), nomes: f.jogadores.arrayValue.values.map(j => j.mapValue.fields.nome.stringValue) }; };
const entrar = async (p, n, cod) => { await p.click('[data-acao="abrirOnline"]'); await p.fill('#nome-online', n); await p.fill('#codigo-online', cod); await p.click('[data-acao="onlineEntrar"]'); await p.waitForTimeout(2000); };
const criar = async (p, n) => { await p.click('[data-acao="abrirOnline"]'); await p.fill('#nome-online', n); await p.click('[data-acao="onlineCriar"]'); await p.waitForTimeout(2200); return /Sala ([A-Z2-9]{5})/.exec(await texto(p))[1]; };
const clicaTexto = async (p, t) => { await p.getByText(t, { exact: false }).first().click({ timeout: 3000 }).catch(e => console.log('   (sem botão "' + t + '")')); await p.waitForTimeout(1200); };

// ===== Sala 1: espera =====
let A = await jogador(), B = await jogador(), C = await jogador(), D = await jogador();
let cod = await criar(A, 'Ana'); await entrar(B, 'Beto', cod); await entrar(C, 'Cris', cod); await entrar(D, 'Dani', cod);
let s = await admin(cod); ok('4 pessoas na sala', s.uids === 4);
await A.locator('[data-acao="onlineTirar"][data-idx="3"]').click(); await A.waitForTimeout(1500);
s = await admin(cod); ok('criador tira a Dani na espera (regra 7)', s.uids === 3 && s.removidos[3] === true, JSON.stringify(s.nomes));
await C.click('[data-acao="onlineSair"]'); await C.waitForTimeout(1500); if (await C.locator('[data-acao="onlineSair"]').count() && (await admin(cod)).uids === 3) await clicaTexto(C, 'Sair');
s = await admin(cod); ok('Cris sai na espera (regra 8)', s.uids === 2, 'uids=' + s.uids);
const donoAntes = s.dono; await A.click('[data-acao="onlineSair"]'); await A.waitForTimeout(1500); if ((await admin(cod))?.uids === 2) await clicaTexto(A, 'Sair');
s = await admin(cod); ok('criador sai: o criador passa para o Beto (regra 8)', s && s.uids === 1 && s.dono !== donoAntes, 'dono mudou: ' + (s && s.dono !== donoAntes));
await B.click('[data-acao="onlineSair"]'); await B.waitForTimeout(1500); if (await admin(cod)) await clicaTexto(B, 'Sair');
ok('último sai: sala some', (await admin(cod)) === null);

// ===== Sala 2: jogo, tirar no meio, sair no meio =====
A = await jogador(); B = await jogador(); C = await jogador();
cod = await criar(A, 'Ana'); await entrar(B, 'Beto', cod); await entrar(C, 'Cris', cod);
await A.click('[data-acao="onlineComecar"]'); await A.waitForTimeout(2500); s = await admin(cod); ok('rodada 1 começou', s.fase === 'jogando' && s.rodada === 1);
// tempo esgotado: volta o relógio (administrador do emulador) e deixa o próprio app resolver
const vezAntes = s.vez, verAntes = s.versao;
await fetch(`http://127.0.0.1:8189/v1/projects/jogos-sem-anuncio/databases/(default)/documents/salas/${cod}?updateMask.fieldPaths=vezDesde`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { vezDesde: { integerValue: String(Date.now() - 400000) } } }) });
await A.waitForTimeout(9000); s = await admin(cod); ok('tempo esgotado: o app passa a vez sozinho (regra 5)', s.vez !== vezAntes && s.versao === verAntes + 1, `vez ${vezAntes}→${s.vez}`);
// criador tira a Cris no meio do jogo (menu de ajustes)
await A.click('[data-acao="abrirAjustes"]').catch(() => {}); await A.waitForTimeout(800);
const tirar = A.locator('[data-acao="onlineTirar"][data-idx="2"]'); console.log('   botão "tirar" visível no meio do jogo:', await tirar.count());
if (await tirar.count()) { await tirar.first().click(); await A.waitForTimeout(1500); s = await admin(cod); ok('criador tira a Cris no meio do jogo (regra 7)', s.removidos[2] === true, JSON.stringify(s.removidos)); }
// Beto sai no meio: sobra só a Ana -> ela ganha, fase fim
await B.click('[data-acao="abrirAjustes"]').catch(() => {}); await B.waitForTimeout(600); const sairB = B.locator('[data-acao="onlineSair"]'); console.log('   botão sair do Beto:', await sairB.count());
if (await sairB.count()) { await sairB.first().click(); await B.waitForTimeout(1500); if ((await admin(cod)).fase !== 'fim') await clicaTexto(B, 'Sair'); }
s = await admin(cod); ok('Beto sai no meio: sobra 1 e a partida acaba (regra 8)', s.fase === 'fim', JSON.stringify(s));
// próxima rodada
await A.waitForTimeout(800); console.log('   Ana vê botão próxima:', await A.locator('[data-acao="onlineProxima"]').count());
console.log(T.every(Boolean) ? '\nTUDO OK (' + T.length + ')' : '\nFALHAS: ' + T.filter(x => !x).length);
await b.close();
