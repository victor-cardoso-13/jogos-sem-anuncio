# Pasta "Computador" — instruções para o Claude

**O Miaudoku saiu daqui** (31/10/2026). Agora ele tem pasta e repositório próprios:
`/Users/victor/Desktop/Jogos/miaudoku` → https://github.com/victor-cardoso-13/miaudoku
→ https://victor-cardoso-13.github.io/miaudoku/

- A pasta `Computador/miaudoku/` aqui só publica um **aviso de mudança** no endereço antigo
  (`.../jogos-sem-anuncio/miaudoku/`): uma página que redireciona e um `sw.js` que desinstala o app antigo.
  **Não mexa no jogo aqui.** O passo "Miaudoku" do `.github/workflows/publicar.yml` continua funcionando
  do mesmo jeito (npm ci / test / build montam só o aviso) — pode manter.
- Na página inicial do site (`site/index.html`), o link do Miaudoku pode apontar direto para
  `https://victor-cardoso-13.github.io/miaudoku/` (o antigo também funciona, porque redireciona).

## Por que a mudança
As conversas dos dois jogos usavam a mesma cópia do repositório: quando uma trocava de ramo para
fazer um PR, os arquivos da outra mudavam por baixo dela. **Cada jogo com o seu repositório evita isso.**
Sugestão para o Mexe-Mexe (decisão do Victor): fazer o mesmo — pasta `Jogos/mexe-mexe` com repositório próprio.

## O que continua aqui (vale para todos os jogos)
- `firestore.rules`, `firebase.json`, `.firebaserc`: regras do Firebase (projeto `jogos-sem-anuncio`).
  Deploy: `firebase deploy --only firestore` a partir desta pasta.
- `APRENDIZADOS.md`: como fazemos jogos.

## Cuidados com o Git nesta pasta enquanto houver mais de uma conversa
- Não troque de ramo (`git checkout`) nem use `git add -A`/`git stash`: outra conversa pode ter trabalho sem salvar.
- Faça commit só dos seus arquivos: `git add <pasta>` e `git commit -- <pasta>`; para PR, `git push origin HEAD:<ramo-novo>`.
