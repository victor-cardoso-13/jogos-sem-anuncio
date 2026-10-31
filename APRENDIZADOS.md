# Aprendizados: como fazer jogos neste formato

Este arquivo reúne o que aprendemos fazendo o **Mexe-Mexe**. A ideia é reaproveitar
o caminho nos próximos jogos e gastar menos esforço (e menos tokens).
Se for pedir um jogo novo ao Claude, comece dizendo: *"siga o APRENDIZADOS.md"*.

**Organização:** cada jogo fica na sua própria pasta, e este arquivo fica na raiz, servindo para todos.

```
Computador/
├── APRENDIZADOS.md   ← este arquivo (vale para todos os jogos)
├── mexe-mexe/        ← primeiro jogo, use como modelo
└── meowdoku/         ← próximo jogo
```

---

## 1. O formato

- **O que é:** um jogo que roda no navegador, com o computador como adversário.
- **Onde roda:** no iPad, "adicionado à Tela de Início" (fica como um app), e no computador.
- **Sem servidor:** tudo roda no aparelho, e funciona offline depois do primeiro acesso.
- **A partida fica salva sozinha** no aparelho, para fechar e continuar depois.
- **Tecnologia:** Vite + TypeScript, sem frameworks pesados.
- **Testes:** Vitest para as regras e Playwright para tirar prints da tela.

## 2. Como o código de cada jogo é organizado

Modelo: a pasta `mexe-mexe/`.

```
src/motor/regras.ts   ← TODAS as regras da casa num lugar só (o arquivo que mais muda)
src/motor/            ← regras puras: cartas, validação, vez, fim de jogo (sem nada de tela)
src/ia/               ← computador: níveis, limite de tempo, nunca joga errado
src/ui/               ← desenho da tela, toque/arrasto, encaixe sem rolagem, salvar
src/main.ts           ← liga botões e toques às regras
tests/                ← testes automáticos
Jogar no computador.command ← dois cliques e o jogo abre no navegador
```

**Por que separar:**
- O motor não sabe que existe tela. Dá para testar tudo sem abrir o navegador.
- Mudar uma regra quase nunca quebra o visual.

## 3. O jeito de trabalhar que funcionou

1. **Perguntar antes de programar**, com **exemplos concretos para marcar**. Perguntas abertas não funcionam.
   - Exemplo que funcionou: "quais destes valem? ☐ 8♥8♠8♦ ☐ 8♥8♠8♦8♣ ☐ 8♥8♥8♠8♦".
   - Uma regra descrita só em palavras ("só pode baixar o outro naipe se...") quase sempre tem mais de uma leitura.
2. **Protótipo visual antes da tela de verdade.** Um HTML estático simples, aberto no navegador. A gente aprova e só depois constrói.
   - Para dúvidas de visual (como arrumar as cartas na mesa), mostrar 2 ou 3 opções em desenho simples e deixar escolher.
   - Não começar a parte gráfica antes do "pode seguir". Isso economiza retrabalho e tokens.
3. **Etapas pequenas:**
   - (a) regras + testes;
   - (b) tela jogável;
   - (c) publicar + funcionar offline;
   - (d) níveis do computador, dica e polimento.
4. **Cada regra nova vira teste** com os exemplos que a família confirmou.
5. **Tirar prints automáticos** (Playwright) depois de cada mudança na tela. É assim que se confere que nada rola, nada sobrepõe e nada some.
   - **Aparelhos que importam:** iPad (deitado 1180×820 e em pé 820×1180) e iPhones 12, 13, 15 e 16, normais e Pro Max, em pé e deitados, **descontando as barras do Safari** (ex.: Pro Max em pé ≈ 440×800, deitado ≈ 956×360). **Não gastar tempo com iPhone SE.** No Mexe-Mexe, testar só no iPad deixou o jogo **injogável no celular**.
   - **No celular:** botões minimalistas (ícone + nome pequeno, numa fila só), a mão com a fila inteira, e a mesa com um tamanho mínimo legível — se não couber, **só a mesa** rola. Cartas miúdas são piores que uma mesa que rola.
   - **Casos reais viram teste.** Quando a família manda print de "antes e depois" de algo que a dica não achou, montar a mesa exata num teste antes de corrigir.
   - Testar também com a **tela cheia** (partida longa simulada) e medir depois que as animações terminam.
   - **Menus flutuantes** (que abrem em cima de um botão) quebram em tela pequena. Prefira uma janela no meio da tela, com botões grandes.

## 4. Regras da casa: armadilhas que apareceram

As regras "oficiais" da internet NÃO são as da família. Antes de começar qualquer jogo, perguntar:

- **Quantas cartas da mão por vez?** No Mexe-Mexe é **1 ou 3**, nunca 2 nem 4. E as 3 vão **juntas para o mesmo jogo** e precisam **formar um jogo sozinhas** (2-2-2 ou 2-3-4; nada de 7-8-10 usando o 9 da mesa). Isso mudou o computador inteiro.
  - A trava tem que valer **na hora do movimento**, não só no fim da vez. A família não aceita ver "2 cartas na mesa" nem por um instante.
- **Trinca com naipe repetido?** Em casa pode, porque são 2 baralhos. Mas o 4º naipe só entra com 6 cartas ou mais.
- **Curinga:** onde pode ficar (no Mexe-Mexe, nunca na ponta e nunca dois juntos), e se ele volta ou não para a mão.
- **O Ás:** é baixo, alto, ou os dois? Pode "dar a volta" (K-A-2)?
- **Monte acabou:** quem ganha? E quanto vale cada carta? (Ás = 15!)
- **Disposição na mesa:** cores alternadas (vermelha-preta-vermelha) e trinca lado a lado. Até o visual tem regra da casa.
- **O fim da vez:** a vez passa sozinha quando a jogada fica certa? No Mexe-Mexe, sim: passa sozinha depois de 1,5 s, e o botão "Passar a vez" continua lá.
- **Não deixar a partida salva "congelar" as regras.** Ao continuar uma partida salva, refazer as regras a partir de `regras.ts` e manter só as escolhas daquela partida (ex.: nº de adversários). Senão, quem estiver no meio de um jogo continua com as regras velhas.
- **"Novo jogo" (ou qualquer área de soltar) em lugar fixo.** Se ele muda de posição quando a mesa enche, a pessoa erra o toque.
- **Testar com mesas "de mentira" para tirar prints é útil, mas avise que é montagem.** A família estranha jogos que nunca existiriam numa partida de verdade.

Todas essas decisões ficam em `src/motor/regras.ts`, comentadas com exemplos.

## 5. Facilidade de uso para quem é idoso (prioridade nº 1)

- **Cartas e letras grandes**, com alto contraste. Opção de 4 cores para os naipes.
- **Tocar na carta e depois tocar no destino.** Arrastar também funciona, mas não pode ser o único jeito.
- **Nunca ter barra de rolagem.** As cartas encolhem sozinhas até caber tudo (`src/ui/encaixe.ts`).
- **Uma faixa de aviso** que sempre diz, em palavras simples, o que fazer agora.
- **Não deixar errar:**
  - jogo inválido fica com borda vermelha e o motivo escrito;
  - o botão de passar a vez fica bloqueado enquanto algo não vale;
  - se a pessoa toca nele assim mesmo, aparece a explicação.
- **"Desfazer" (1 passo) e "Desfazer tudo"**, para poder bagunçar à vontade enquanto pensa.
- **A ordem da mão fica do jeito que a pessoa escolheu.** A carta comprada entra no lugar certo, com o selo "NOVA".
- **Computador devagar,** um passo de cada vez:
  - primeiro aparece a frase do que ele vai fazer;
  - depois as cartas deslizam **uma por uma** pela tela (`src/ui/animacao.ts`);
  - o que ele baixou fica com o selo laranja "NOVA" até a sua vez acabar.
  - Sem cronômetro, sem pressa.
- **Avisar o perigo:** quando o adversário fica com 1 carta só, aparece um alerta.
- **Botão "Dica"** que mostra uma jogada e oferece "Fazer para mim".

## 6. Computador (IA)

- **Ele só "pensa":** recebe a mão e a mesa e devolve como elas ficariam, mais a lista de passos para animar.
- **Sempre há uma conferência final:** se a jogada não passar nas regras, ele compra.
- **Nos testes, a IA é chamada SEM essa conferência.** Assim um erro dela aparece no teste em vez de ficar escondido.
- **Limite de tempo por jogada** (nunca travar o iPad), e na tela ele "pensa" depois de mostrar "pensando…".
- **Níveis por "quanto ele pode mexer":**
  - Fácil: 1 jogo da mesa;
  - Médio: até 3 jogos;
  - Difícil: sem limite, e no empate deixa a melhor mão.
- **Teste de partidas inteiras simuladas,** centenas delas, conferindo três coisas:
  - nenhuma jogada inválida;
  - nenhuma carta some nem duplica;
  - o tempo de cada jogada fica dentro do limite.

## 7. Ferramentas no Mac

- **Node.js** foi instalado com o `nvm`, na pasta do usuário, sem senha de administrador.
- **Para jogar no computador:** dois cliques em `Jogar no computador.command`.
- **Para testar no iPad pelo Wi-Fi:** usar o mesmo atalho e abrir no Safari o endereço "Network" que aparece no Terminal.
  - Sem internet de verdade (HTTPS), a função "offline" não funciona. Ela só funciona depois de publicar.

## 8. Lista para começar o próximo jogo

- [ ] Nome do jogo e para quem é (idade, aparelho)
- [ ] Regras da casa, com exemplos para marcar (o que vale e o que não vale)
- [ ] Quantos adversários e quais níveis
- [ ] Protótipo visual aprovado
- [ ] Criar a pasta do jogo ao lado de `mexe-mexe/` e copiar dela a configuração (package.json, tsconfig, vite.config, o atalho .command) e os arquivos de `src/ui/` (encaixe, toque, salvar)
- [ ] Motor + testes, depois a tela, depois publicar

## 9. O que o Miaudoku ensinou (jogo de quebra-cabeça, sem adversário)

- **O "computador" vira o criador de fases.** Fases numeradas, criadas UMA vez no Mac (`npm run gerar`) e guardadas em `src/fases/N.json`. Assim abrem na hora no celular e nunca se repetem.
- **Sortear tudo ao acaso quase nunca dá fase boa.** O que funcionou: fixar a resposta e ir ajustando a grade aos poucos até sobrar 1 resposta só.
- **Conferir cada fase com um resolvedor separado** da dica. Se a mesma lógica cria e confere, um erro passa despercebido.
- **Tirar fases repetidas, inclusive giradas e espelhadas.**
- **A dica explica o porquê** (não só mostra a resposta). O resto da grade fica apagado e só aparece o que importa.
- **Pacotes de fases "congelados":** se gerar de novo, as fases mudam e o progresso salvo aponta para outras. Trocar a chave de salvamento (`v1` → `v2`).
- **Testar no celular:** o Mac serve o jogo pelo Wi-Fi (`npx vite --host`), e o celular abre o endereço "Network". Se a porta 5173 estiver ocupada (outro jogo aberto), usar outra.
- **Scripts em TypeScript rodam direto no Node novo** (`node arquivo.ts`), desde que os imports terminem em `.ts`.

## 10. Conta e progresso na nuvem (Firebase) — vale para todos os jogos

- **Um projeto Firebase só** (`jogos-sem-anuncio`) para todos os jogos: mesmo login para a família. O progresso de cada jogo fica em `jogadores/{conta}/jogos/{nome-do-jogo}`.
- **Para um jogo novo:** copiar `miaudoku/src/nuvem/` (config, conta, sincronia, mesclar) e trocar o nome do jogo em `conta.ts`. As regras de segurança (`firestore.rules`, na raiz) já servem para qualquer jogo.
- **Cada conta tem a sua "gaveta" no aparelho.** Duas pessoas no mesmo celular nunca misturam progresso. O progresso feito sem conta só vai para uma conta se a pessoa confirmar.
- **A nuvem recebe um resumo**, não tudo: o "Desfazer" fica só no aparelho (o Firebase não aceita listas dentro de listas).
- **"Começar de novo" precisa de um contador de rodadas**, senão a nuvem "devolve" a fase antiga.
- **Testar com contas de mentira no Firebase de verdade** (e apagar no fim): é o único jeito de provar que as contas não se misturam.
- **Ajudante do Firebase no Claude:** `Computador/.mcp.json` + dois cliques em `Entrar no Firebase.command` (uma vez só).

## 11. O que o Mexe-Mexe ensinou na nuvem e na publicação

- **Jogo contra o computador também tem "progresso": o retrospecto.** Cada partida terminada é guardada com uma **identidade** (`partidaId`), num mapa e não numa lista.
  - Juntar dois aparelhos = somar os mapas. A mesma partida nunca conta duas vezes.
  - Nunca guardar só os totais ("5 vitórias"): dois aparelhos somando totais erram a conta.
- **A partida vai para a nuvem como texto** (`JSON.stringify`, sem o "Desfazer"). Assim o Firebase nunca reclama de listas dentro de listas ou de `undefined`. Uma partida inteira ocupa uns 8 KB.
- **Combinar com a família o que conta no retrospecto:** a partida abandonada não conta; o nível que vale é o do fim; com vários adversários, "vitória" é só quando VOCÊ ganha.
- **Se o jogo não tem "voltar para o início"**, ponha Conta e Retrospecto também nos Ajustes.
- **A troca de conta interrompe a jogada do computador** (um contador de "gaveta"). Senão, ele continuaria jogando na partida da outra pessoa.
- **Publicar um jogo novo no site:** tirar do `.gitignore`; um passo no workflow (`npm ci && npm test && npm run build`); `cp -r jogo/dist _site/jogo`; link em `site/index.html`.
  - O `base: './'` do Vite serve para qualquer endereço: GitHub Pages, computador e Wi-Fi.
- **Teste de tempo do computador:** o GitHub é mais lento que o Mac. A folga é maior só lá (`process.env.CI`). Se um teste falha, **nada é publicado, nem os outros jogos**.
- **Ícone do app sem programa de desenho:** um SVG numa página HTML, fotografado pelo Playwright em 512, 192 e 180 px.
- **Duas conversas do Claude ao mesmo tempo** (uma no Miaudoku, outra no Mexe-Mexe): no commit, adicionar só os arquivos do próprio jogo, **nunca `git add -A`**.
- **No iPhone, cada jogo posto na Tela de Início guarda as suas coisas separado.** É preciso entrar na conta uma vez em cada jogo. No Safari normal, entrar num jogo já vale para o outro.
