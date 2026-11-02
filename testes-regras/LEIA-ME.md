# Testes das regras do Mexe-Mexe online (emulador, sem tocar no banco de verdade)

Estes 3 roteiros jogam de verdade, com vários navegadores, contra as regras de `../firestore.rules`.
**Rode sempre que mexer nas regras da coleção `salas`** (ou no `mexe-mexe/src/online/`).

1. `1-partida-completa.mjs`  — 3 pessoas: criar, entrar, mudar opções, jogar até o fim, contar pontos, próxima rodada.
2. `2-ataques-barrados.mjs`  — trapaças que o banco precisa recusar (trocar o criador, jogar fora da vez, ler a mão do outro…).
3. `3-sair-tirar-tempo.mjs`  — tirar alguém, sair (na espera e no meio do jogo) e tempo esgotado.
Esperado: tudo "OK" / "TUDO COMO ESPERADO". Qualquer "FALHOU" = regra apertada demais (jogo trava) ou frouxa demais.

## Como rodar (uma vez por sessão)
- Precisa de Java (o do Mac costuma não ter). Dá para usar um Java portátil (Temurin 21) numa pasta temporária.
- Numa pasta de trabalho, com o repositório `mexe-mexe` instalado (`npm ci`):
  1. Emulador com as portas **Auth 9199 e Firestore 8189** (diferentes das padrão, para não colidir com outros servidores):
     use um `firebase.json` de teste com `"emulators": {"auth":{"port":9199},"firestore":{"port":8189},"ui":{"enabled":false}}`
     e `"firestore":{"rules":"<caminho>/firestore.rules"}`; rode `firebase emulators:start --only auth,firestore --project jogos-sem-anuncio --config <esse firebase.json>`.
     No `mexe-mexe/src/nuvem/conta.ts`, troque 9099→9199 e 8080→8189 (o jogo só usa isso com `?emu` no modo de desenvolvimento) e **não commite** essa troca.
  2. Jogo: dentro de `mexe-mexe/`, `npx vite --port 5195 --host 127.0.0.1`.
  3. Copie os `.mjs` para `mexe-mexe/scripts/` e rode `node scripts/<arquivo>.mjs` (usam o `playwright` do `mexe-mexe`).
- Os roteiros usam as portas 5195 (jogo) e 8189 (Firestore).
