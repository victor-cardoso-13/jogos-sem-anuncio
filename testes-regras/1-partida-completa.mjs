import { chromium } from 'playwright';
const URL = 'http://127.0.0.1:5195/?emu';
const b = await chromium.launch(); const logs = [];
async function jogador(nome) {
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } }); const p = await ctx.newPage();
  p.on('console', m => logs.push(nome + ': ' + m.text())); p.on('pageerror', e => logs.push(nome + ' ERR ' + e.message));
  await p.goto(URL); await p.waitForTimeout(1500); await p.click('[data-acao="tutorialPular"]').catch(() => {});
  return p;
}
const texto = async p => (await p.locator('body').innerText());
const A = await jogador('Ana'), B = await jogador('Beto'), C = await jogador('Cris');
await A.click('[data-acao="abrirOnline"]'); await A.fill('#nome-online', 'Ana'); await A.click('[data-acao="onlineCriar"]'); await A.waitForTimeout(2500);
const codigo = /Sala ([A-Z2-9]{5})/.exec(await texto(A))[1]; console.log('1) sala criada:', codigo);
for (const [p, n] of [[B, 'Beto'], [C, 'Cris']]) { await p.click('[data-acao="abrirOnline"]'); await p.fill('#nome-online', n); await p.fill('#codigo-online', codigo); await p.click('[data-acao="onlineEntrar"]'); await p.waitForTimeout(2500); }
console.log('2) na sala:', /Na sala \((\d) de 4\)/.exec(await texto(A))?.[1], 'jogadores');
// opções do criador
await A.getByText('Até 100 pontos').click(); await A.waitForTimeout(800); await A.getByText('5 min').click(); await A.waitForTimeout(800); await A.getByText('Com', { exact: true }).click(); await A.waitForTimeout(800);
console.log('3) opções mudaram para os outros (Beto vê):', (await texto(B)).includes('5 min') ? 'ok' : '?');
await A.click('[data-acao="onlineComecar"]'); await A.waitForTimeout(2500);
console.log('4) começou? Ana vê mão:', await A.locator('.mao .carta, .mao [data-carta], .mao > *').count() > 0);
// joga: todo mundo tenta "Comprar e passar" até acabar a rodada
let passos = 0, fim = false;
for (; passos < 500 && !fim; passos++) {
  for (const p of [A, B, C]) {
    const btn = p.locator('[data-acao="comprar"]:not(.apagado)'); if (await btn.count()) await btn.first().click({ timeout: 800 }).catch(() => {});
  }
  await A.waitForTimeout(120);
  const t = await texto(A); fim = /ganhou|empat|Próxima rodada|Mostrar|pontos/i.test(t) && (await A.locator('[data-acao="onlineProxima"], [data-acao="proximaRodada"]').count()) > 0;
}
console.log('5) rodada terminou em', passos, 'passos:', fim);
console.log((await texto(A)).split('\n').filter(l => l.trim()).slice(0, 14));
const adm = async c => (await (await fetch(`http://127.0.0.1:8189/v1/projects/jogos-sem-anuncio/databases/(default)/documents/salas/${c}`, { headers: { Authorization: 'Bearer owner' } })).json()).fields;
let f = await adm(codigo); console.log('6) antes: fase', f.fase.stringValue, 'rodada', f.rodada.integerValue);
await A.locator('[data-acao="onlineProxima"], [data-acao="proximaRodada"]').first().click(); await A.waitForTimeout(3000);
f = await adm(codigo); console.log('7) depois do "próxima rodada": fase', f.fase.stringValue, 'rodada', f.rodada.integerValue, f.fase.stringValue === 'jogando' && f.rodada.integerValue === '2' ? 'OK' : 'FALHOU');
console.log('   Beto vê a mão da rodada 2:', (await B.locator('.mao > *').count()) > 0);
console.log('erros de permissão nos logs:', logs.filter(l => /permission|insufficient/i.test(l)).length, logs.filter(l => /permission|insufficient/i.test(l)).slice(0, 3));
await b.close();
