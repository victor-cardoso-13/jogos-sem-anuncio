#!/bin/bash
# Dê dois cliques para ligar o Firebase a este Mac (só precisa fazer UMA vez).
# Vai abrir o navegador: entre com a MESMA conta Google do projeto e clique em "Permitir".
cd "$(dirname "$0")"
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
firebase login
echo ""
echo "Pronto! Pode fechar esta janela e voltar para o Claude."
