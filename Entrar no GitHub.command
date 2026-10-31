#!/bin/bash
# Dê dois cliques para ligar o GitHub a este Mac (só precisa fazer UMA vez).
# Ele mostra um CÓDIGO de 8 letras e abre o navegador: cole o código lá e autorize.
cd "$(dirname "$0")"
~/.local/bin/gh auth login --hostname github.com --git-protocol https --web --scopes workflow
~/.local/bin/gh auth setup-git
echo ""
echo "Pronto! Pode fechar esta janela e voltar para o Claude."
