#!/usr/bin/env bash
# ==============================================================================
# JLauncherOS - Development Launcher Script (Fase 1)
# Avvia l'ambiente virtuale Python e il supervisore Tauri v2 in dev mode.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "============================================================"
echo "🚀 JLauncherOS Development Environment (Apple Silicon M4)"
echo "Radice Progetto: ${PROJECT_ROOT}"
echo "============================================================"

# 1. Configurazione / Validazione Virtualenv Python
VENV_DIR="${PROJECT_ROOT}/backend/venv"
PYTHON_BIN="${VENV_DIR}/bin/python"

if [ ! -d "${VENV_DIR}" ] || [ ! -f "${PYTHON_BIN}" ]; then
    echo "📦 Creazione ambiente virtuale Python in: ${VENV_DIR}..."
    python3 -m venv "${VENV_DIR}"
    echo "⬇️ Installazione dipendenze backend..."
    "${PYTHON_BIN}" -m pip install --upgrade pip setuptools wheel
    "${PYTHON_BIN}" -m pip install -r "${PROJECT_ROOT}/backend/requirements.txt"
else
    echo "✅ Virtualenv Python rilevato in: ${VENV_DIR}"
fi

# 2. Configurazione dipendenze Node.js
if [ ! -d "${PROJECT_ROOT}/node_modules" ]; then
    echo "📦 Installazione dipendenze Node.js/Vite..."
    npm install
else
    echo "✅ Dipendenze Node.js presenti."
fi

# 3. Trap di chiusura pulita per Bash
cleanup() {
    echo ""
    echo "🛑 Intercettato segnale di uscita in dev.sh. Chiusura ordinata..."
    exit 0
}

trap cleanup SIGINT SIGTERM

# 4. Avvio ambiente di sviluppo Tauri v2
echo "⚡ Avvio Tauri Dev (Supervisore Rust + Hot Reload Frontend)..."
npx @tauri-apps/cli dev
