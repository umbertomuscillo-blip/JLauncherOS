# 🚀 JLauncherOS (JARVIS Ambient OS)

<p align="center">
  <img src="public/assets/launchme/workflows-icon.svg" alt="JLauncherOS Logo" width="84" height="84" />
</p>

<p align="center">
  <b>The Unified Ambient Operating System for macOS (Apple Silicon M4)</b><br />
  A high-performance, distraction-free launcher & dynamic hardware companion merging <b>JARVIS</b>, <b>LaunchMe</b>, <b>Help Memoria</b>, and <b>Prompterrr</b>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-macOS%20Sonoma%20%7C%20Sequoia-black?style=flat-square&logo=apple" alt="macOS" />
  <img src="https://img.shields.io/badge/Architecture-Apple%20Silicon%20(M4)-0071e3?style=flat-square" alt="Apple Silicon M4" />
  <img src="https://img.shields.io/badge/Core-Tauri%20v2%20%2B%20Rust-orange?style=flat-square&logo=rust" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20Tailwind%20v4%20%2B%20Framer-cyan?style=flat-square&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/Backend-Python%203.12%20asyncio-blue?style=flat-square&logo=python" alt="Python Backend" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## 🎯 Obiettivo Finale del Progetto (Vision)

Il desktop moderno di macOS è spesso frammentato: Launchpad è rimasto invariato da anni, Spotlight gestisce le scorciatoie ma non gli spazi di lavoro, e gli assistenti intelligenti vivono isolati in finestre browser o app separate.

**JLauncherOS** nasce con un obiettivo chiaro e ambizioso: **creare un vero "Ambient Operating System" invisibile, ultra-reattivo e calibrato al millimetro su Apple Silicon M4**.

1. **Sostituzione Totale di Launchpad & Spotlight:**
   Un overlay a schermo intero trasparente a **120 FPS** (Apple ProMotion), con griglia libera per le applicazioni, raggruppamento istantaneo in cartelle, ricerca Spotlight con calcolatrice matematica integrata e visualizzazione degli spazi di lavoro per contesto (*Coding*, *Design*, *Study*, *Media*).
2. **Integrazione Hardware Fisica (Dynamic Notch):**
   Una superficie interattiva ancorata al Notch del MacBook che trasforma la cornice hardware in un centro di controllo dinamico: Now Playing musicale, timer/Pomodoro a righello meccanico, cronologia appunti multi-formato (inclusi codici colore con swatches HEX) e drop-zone Pocket Shelf per lo scambio rapido di file via AirDrop.
3. **Cervello Assistivo Locale & Privacy-First (JARVIS Core):**
   Un demone locale in Python che monitora la salute dell'archiviazione APFS (purge di cache Xcode/DerivedData), gestisce l'orchestrazione cognitiva di prompt LLM (Prompterrr) e governa lo stato di focus con interazione a latenza zero, garantendo il 100% di riservatezza dei dati sul dispositivo.

---

## 🏗️ Architettura & Come Funziona

JLauncherOS adotta un'architettura **Ibrida Asincrona a Bassa Latenza**:

```mermaid
graph TD
    subgraph macOS Environment [macOS Sequoia / Sonoma - Apple Silicon M4]
        HW[Hardware Screen & Notch Bezel]
        OS_APPS[System & User Apps: /Applications]
        APFS[APFS Storage & System Caches]
    end

    subgraph Native Host [Tauri v2 Host in Rust]
        WM[Window Manager: Dual-Window Controller]
        APP_IDX[App Indexer: Rayon + .icns to PNG Extractor]
        NOTCH_DET[Notch Detector: Cocoa NSScreen Insets]
        CLIP[Clipboard Daemon: NSPasteboard Listener]
        SUPERVISOR[Sidecar Manager & PPID Watchdog]
    end

    subgraph Frontend [React 18 + Tailwind v4 + Framer Motion]
        WIN_LAUNCHER[Window: Launcher Overlay Fullscreen]
        WIN_NOTCH[Window: Dynamic Notch Floating Bar]
        GRID[Free Layout Grid + Real macOS App Icons]
        WIDGETS[Widgets: 12-9-3-6 Clock, Sun Curve, Vinyl Studio]
    end

    subgraph Backend Daemon [JARVIS Python Core 3.12]
        IPC_WS[IPC Server: ws://127.0.0.1:8765/ws]
        ROUTER[IPC Router with Secret Handshake]
        MEM_ENGINE[Help Memoria: APFS Diagnostics & Cleaner]
        PROMPT_ENGINE[Prompterrr: Cognitive Prompt Pipeline]
        MEDIA_CTRL[Media Controller: Apple Music & Spotify]
    end

    HW --> NOTCH_DET
    OS_APPS --> APP_IDX
    APFS --> MEM_ENGINE

    WM -->|Toggle ⌘4| WIN_LAUNCHER
    NOTCH_DET -->|Pixel Calibration| WIN_NOTCH
    APP_IDX -->|Cached 256px PNGs| GRID
    CLIP --> WIN_NOTCH

    SUPERVISOR -->|Spawn & Monitor PID| Backend Daemon
    Frontend <-->|Async IPC WebSocket| IPC_WS
    IPC_WS --> ROUTER
    ROUTER --> MEM_ENGINE
    ROUTER --> PROMPT_ENGINE
    ROUTER --> MEDIA_CTRL
```

### 1. Dual-Window Nativa Trasparente
Tauri v2 istanzia due finestre distinte:
- **`launcher`:** Finestra fullscreen frameless a sfondo trasparente. Compare istantaneamente sul monitor in cui si trova il mouse alla pressione di **⌘4** (o `Option + Spazio`), oscurando dolcemente il desktop senza bloccare il flusso di lavoro.
- **`notch`:** Finestra di `520x64px` (espandibile fino a `170px`) ancorata precisamente all'area del notch hardware calcolata tramite le API native `NSScreen.safeAreaInsets` di AppKit Cocoa.

### 2. Estrazione Nativa delle Icone macOS
Dimentica le icone SVG generiche o i mock sintetici. Il modulo [`app_indexer.rs`](file:///Users/umbertomuscillo/Downloads/JLauncherOS/src-tauri/src/app_indexer.rs) in Rust esegue una scansione parallela multithread su tutte le `.app` del sistema, estrae i bundle `.icns` originali e genera una cache locale ad altissima fedeltà in `~/Library/Caches/com.launchme.clone/icons`. Le icone visibili a schermo sono **le vere icone ufficiali delle tue applicazioni**.

### 3. IPC Sicuro con Token Handshake e Zero Zombie
Il demone Python di JARVIS viene avviato come sidecar gestito. All'avvio, Rust genera un token segreto random crittograficamente sicuro (`IPC Secret`). Il frontend esegue l'handshake e stabilisce una connessione WebSocket protetta su `ws://127.0.0.1:8765/ws`.
Un **PPID Watchdog** in background controlla costantemente il PID del genitore Rust: se l'app host si chiude o viene terminata, il backend esegue un *graceful shutdown* in meno di 200ms, azzerando qualsiasi rischio di processi orfani.

---

## 🌟 Funzionalità Principali

| Modulo | Funzionalità | Dettagli Tecnici |
| :--- | :--- | :--- |
| **App Grid & Launcher** | Griglia fluida e personalizzabile (3x5, 4x6, 5x7), drag-and-drop, raggruppamento cartelle e ordinamento alfabetico. | Icone reali macOS, ricerca Spotlight, calcolatrice inline (`24 * 7`). |
| **Dynamic Notch** | Isola multifunzione ancorata al bezel del MacBook. | Audio equalizer wave, Spotify/Apple Music Now Playing, Pixel Pet. |
| **Mechanical Timer** | Timer Pomodoro con nastro scorrevole a righello graduato e tacche millimetrate. | Preset rapidi (5m, 15m, 25m, 50m), cursore arancione neon e chime acustico. |
| **Smart Clipboard** | Monitoraggio degli appunti con cronologia persistente. | Filtri per Testo, Link, File e Codici Colore con palette esadecimale interattiva. |
| **Pocket Shelf & AirDrop** | Mensola di parcheggio file temporanei per non affollare la Scrivania. | Drag & drop immediato e invio a dispositivi Apple vicini con un click. |
| **Vinyl Studio** | Giradischi per audiofili a pieno schermo con copertina slipcase e disco rotante a 33⅓ o 45 RPM. | Braccio con testina metallica dinamica e pillola di controllo fluttuante. |
| **Spaces & Workflows** | Spazi tematici di lavoro (Sviluppo, Design, Studio, Relax) esportabili in file `.launchmespaces`. | Apertura batch di tutte le app del profilo con scorciatoie rapide ⌘1..⌘9. |
| **Help Memoria** | Diagnostica di archiviazione APFS e disinstallazione pulita (Clean Uninstaller). | Purge di residui orfani in `Application Support`, `Caches`, `Preferences` e `Containers`. |

---

## 🚀 Guida Rapida all'Avvio

### Prerequisiti
- **Sistema Operativo:** macOS 14.0+ (Sonoma o Sequoia raccomandati)
- **Hardware:** Apple Silicon (M1, M2, M3, M4)
- **Strumenti Richiesti:**
  - [Node.js](https://nodejs.org/) (versione 18 o superiore)
  - [Rust & Cargo](https://rustup.rs/) (versione stabile recente)
  - [Python 3.12](https://www.python.org/)

### 1. Installazione Dipendenze
```bash
# Dipendenze Frontend
npm install

# Setup Virtualenv Python per il Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 2. Esecuzione in Modalità Sviluppo (Dev Mode)
Lo script unificato `./bin/dev.sh` avvia in parallelo il frontend con Hot-Reload (Vite), compila il supervisore Rust in modalità debug e lancia il demone Python:
```bash
./bin/dev.sh
```

### 3. Scorciatoie da Tastiera Predefinite
- **`⌘4`** oppure **`Option + Spazio`**: Mostra / Nasconde il Launcher a Schermo Intero
- **`Option + V`**: Apre la vista Vinyl Turntable Studio
- **`Option + W`**: Apre la gestione Spazi & Workflows
- **`⌘1` ... `⌘9`**: Salto immediato allo Spazio corrispondente
- **`Escape`**: Chiude le modali aperte o nasconde il Launcher

---

## 🧪 Test Suite & Qualità del Codice

Il progetto vanta una copertura rigorosa end-to-end sia su Rust che su Python e TypeScript:

```bash
# Esecuzione Test Rust (App Indexer, Window Manager, Plist Parser)
cargo test --manifest-path src-tauri/Cargo.toml

# Esecuzione Test Suite Python (IPC Server, Clipboard, Shelf, Media, PPID Watchdog)
PYTHONPATH=backend:. ./backend/venv/bin/pytest tests/

# Typecheck & Build del Frontend
npm run build
```

---

## 📁 Struttura della Repository

```
JLauncherOS/
├── backend/                     # Python 3.12 Core Daemon
│   ├── config/                  # Settings e variabili d'ambiente
│   ├── core/                    # Router IPC, Server WebSocket, Voice Engine, ThreadPool
│   └── modules/                 # Clipboard, Media, Shelf, Spaces, SystemApps, Help Memoria
├── bin/                         # Script operativi (dev.sh, build_app.sh, sync_knowledge_base.sh)
├── docs/                        # Specifiche architetturali, roadmap e release notes
│   └── sources/                 # Documenti madre di stato cumulativo JARVIS v2.X
├── public/                      # Asset statici e icone SVG estratte
├── src-tauri/                   # Rust Native Host (Tauri v2)
│   ├── Cargo.toml               # Configurazione dipendenze native
│   ├── tauri.conf.json          # Dichiarazione finestre trasparenti e permessi
│   └── src/                     # App Indexer, Notch Detector, Window Manager, Clipboard
├── src/                         # Frontend React 18 + Tailwind v4 + Framer Motion
│   ├── AppLauncher.tsx          # Dashboard Launcher a schermo intero
│   ├── AppNotch.tsx             # Componente base Notch Island
│   ├── components/              # Grid, Notch, Folders, Widgets, Search, Wallpaper, Settings
│   ├── context/                 # State management globale e pausa rendering in background
│   └── services/                # Bridge IPC Tauri e motori di calcolo
└── tests/                       # Test di integrazione asincroni pytest
```

---

## 📄 Licenza
Rilasciato sotto licenza [MIT](LICENSE). Realizzato con dedizione per l'ecosistema macOS e la comunità Apple Silicon.
