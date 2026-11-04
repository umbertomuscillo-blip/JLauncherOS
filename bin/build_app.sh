#!/bin/bash
# ==============================================================================
# JLauncherOS - Production App Builder (Apple Silicon M4 Native App)
# Esegue pipeline sequenziale di validazione e genera il bundle macOS (.app).
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "🚀 Avvio Pipeline di Produzione: JLauncherOS (Apple Silicon M4 Native App)..."
echo "Radice Progetto: ${PROJECT_ROOT}"

echo "🧪 1. Esecuzione Python Test Suite (Zero Regression)..."
PYTHONPATH=backend:. ./backend/venv/bin/pytest tests/ -q

echo "🦀 2. Esecuzione Rust Cargo Tests..."
cd src-tauri && cargo test -q && cd ..

echo "📦 3. Compilazione React 18 Frontend (TypeScript + Vite)..."
npm run build

echo "🍏 4. Pacchettizzazione Bundle macOS (Tauri Release Build)..."
# Genera il bundle applicativo nativo (.app)
npx tauri build --bundles app

echo "============================================================"
echo "✅ Pipeline completata con successo! JLauncherOS.app generata."
echo "📍 Destinazione: src-tauri/target/release/bundle/macos/JLauncherOS.app"
echo "============================================================"
