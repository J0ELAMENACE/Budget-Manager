#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Budget Manager — Installation Linux
#  Depuis le dossier du projet :
#  chmod +x install.sh && ./install.sh
# ─────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; WHITE='\033[1;37m'; RED='\033[0;31m'; RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✓ $1${RESET}"; }
info() { echo -e "  ${CYAN}→ $1${RESET}"; }
err()  { echo -e "  ${RED}✗ $1${RESET}"; exit 1; }

clear
echo ""
echo -e "  ${WHITE}💰 Budget Manager — Installation${RESET}"
echo -e "  ──────────────────────────────────"
echo ""

# Vérifier qu'on est dans le bon dossier
[ -f "package.json" ] || err "Lance ce script depuis la racine du projet (là où se trouve package.json)."

# Node.js
info "Vérification de Node.js..."
command -v node &>/dev/null || err "Node.js n'est pas installé. Installe-le depuis https://nodejs.org (version 18+) puis relance ce script."
NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
[ "$NODE_MAJOR" -ge 18 ] || err "Node.js $(node --version) détecté — version 18+ requise."
ok "Node.js $(node --version)"

# npm install
info "Installation des dépendances npm..."
npm install
ok "Dépendances installées."

# Build Linux
info "Build de l'application Linux..."
npm run dist:linux
ok "Build terminé."

# Trouver l'AppImage
APPIMAGE=$(find dist-electron -name "*.AppImage" 2>/dev/null | head -n 1)

echo ""
echo -e "  ──────────────────────────────────"
ok "Prêt ! Lance l'application :"
echo ""
if [ -n "${APPIMAGE:-}" ]; then
    chmod +x "$APPIMAGE"
    echo -e "  ${WHITE}$APPIMAGE${RESET}"
    echo ""
    read -r -p "  Lancer maintenant ? [O/n] : " RUN
    if [[ ! "$RUN" =~ ^[nN]$ ]]; then
        "$APPIMAGE" &
    fi
else
    echo -e "  ${WHITE}dist-electron/${RESET}"
fi
echo ""
