# 🏛️ 01_JLAUNCHEROS_ARCHITECTURE.md
## Architettura di Sistema, Topologia del Monorepo e Regole Ferree di Ingegneria

**Target OS:** macOS Sonoma / Sequoia (Apple Silicon M4 Architecture)  
**Progetto:** JLauncherOS — Unified Ambient OS  
**Componenti Unificati:** JARVIS (Backend), LaunchMe (HUD/Dynamic Notch), Help Memoria (Disk Engine), Prompterrr (LLM Pipeline)  
**Versione:** 1.0.0-alpha (Foundational Architecture Specification)

---

## 1. Visione di Sistema e Architettura Globale

**JLauncherOS** è un "Unified Ambient OS" progettato specificamente per le capacità computazionali di **Apple Silicon M4** (CPU High-Efficiency/Performance Cores, GPU Metal 3 con ray-tracing hardware, e 16-core Neural Engine). Il sistema fonde quattro progetti eterogenei in un'unica applicazione desktop macOS (`JLauncherOS.app`), garantendo interazione vocale a latenza zero, monitoraggio diagnostico continuo del file system APFS, orchestrazione avanzata di prompt LLM e un'interfaccia utente nativa con animazioni a 120 FPS (Apple ProMotion) integrata nella Dynamic Notch di macOS.

### I Quattro Pilastri Fusi
1. **JARVIS (The Core Brain):** Demone backend sviluppato in **Python 3.12**, orchestrato interamente tramite un event loop `asyncio` puro. Gestisce l'elaborazione del linguaggio naturale, il motore vocale edge-first, l'integrazione con il sistema operativo macOS (`pyobjc`) e il coordinamento dello stato di focus.
2. **LaunchMe (The Ambient Face):** Interfaccia utente costruita su **Tauri v2**, **Rust** (host di sistema e windowing low-level) e **React 18** (frontend webview con Tailwind CSS e Framer Motion). Gestisce la visualizzazione della "Dynamic Notch", dell'HUD flottante e del menubar tray.
3. **Help Memoria (The Diagnostic Engine):** Modulo backend a bassissimo livello dedicato all'analisi e diagnostica dello storage APFS, monitoraggio inode, purge selettivo delle cache di sistema/sviluppo (es. Xcode `DerivedData`, CocoaPods, log) e rilevamento proattivo dello spazio disco critico.
4. **Prompterrr (The Cognitive Pipeline):** Sottosistema per l'orchestrazione avanzata di prompt LLM con architettura a due stadi **Architetto-Critico** (Architect-Critic). Include algoritmi di context caching semantico, compressione di codice sorgente e streaming token diretto verso la Dynamic Notch.

---

## 2. Topologia del Monorepo e Struttura del Bundle macOS

### 2.1 Struttura del Monorepo

```
JLauncherOS/
├── .github/                     # CI/CD Workflows (build macOS app, test suites)
├── bin/                         # Script di automazione, sync e packaging
│   ├── build_app.sh             # Compilazione del bundle .app finale
│   ├── dev.sh                   # Avvio parallelo frontend + sidecar in dev mode
│   └── sync_knowledge_base.sh   # Sync automatico documentazione con NotebookLM / Drive
├── docs/                        # Knowledge Base e Fonti di Verità (NotebookLM Sources)
│   ├── 01_JLAUNCHEROS_ARCHITECTURE.md
│   ├── 02_IPC_SCHEMA_WEBSOCKET.md
│   └── 03_MASTER_ROADMAP.md
├── src-tauri/                   # RUST CRATE (Tauri v2 Host, Windowing, Sidecar Lifecycle)
│   ├── Cargo.toml
│   ├── tauri.conf.json          # Configurazione bundle, permessi, finestre e sidecar
│   └── src/
│       ├── main.rs              # Tauri entrypoint, setup hook e signal trap
│       ├── sidecar_manager.rs   # Spawner e supervisor del processo demone Python
│       ├── window_controller.rs # Gestione finestre trasparenti, Notch e floating HUD
│       └── tray_manager.rs      # Gestione menu icona di stato (Menubar macOS)
├── src/                         # FRONTEND (React 18 + TypeScript + Tailwind CSS)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx              # Root view router
│       ├── main.tsx
│       ├── components/
│       │   ├── notch/           # Dynamic Notch UI (morphing pill, audio visualizer)
│       │   ├── hud/             # Modalità HUD espansa / Launcher rapido
│       │   ├── help_memoria/    # Widget diagnostica storage, breakdown cache
│       │   └── prompterrr/      # Interfaccia Architetto-Critico & cache stats
│       ├── hooks/
│       │   ├── useWebSocket.ts  # Client WebSocket locale (JSON-RPC 2.0 type-safe)
│       │   └── useVoiceState.ts # Hook per reattività animazioni vocali Notch
│       └── types/
│           └── ipc_schema.ts    # Interfacce TypeScript generate dallo schema JSON-RPC
└── backend/                     # PYTHON BACKEND (Demone JARVIS + Moduli Fusi)
    ├── pyproject.toml           # Dipendenze gestite con Poetry / uv
    ├── main.py                  # Entrypoint del demone, bootstrap asyncio
    ├── core/
    │   ├── server.py            # Asyncio WebSocket Server (porta 8765)
    │   ├── router.py            # Dispatcher comandi e notifiche JSON-RPC 2.0
    │   ├── voice_engine.py      # openWakeWord, Whisper MLX, Apple Speech locale
    │   ├── focus_manager.py     # Gestore stati DEEP_WORK, STUDY, NORMAL
    │   └── thread_pool.py       # Global ThreadPoolExecutor per blocking I/O
    ├── modules/
    │   ├── help_memoria/        # Modulo Help Memoria migrato
    │   │   ├── __init__.py
    │   │   ├── disk_scanner.py  # Scansione ricorsiva storage (multi-threaded)
    │   │   ├── apfs_monitor.py  # Telemetria spazio APFS in tempo reale
    │   │   └── cleaner.py       # Esecutore purge cache sicure
    │   └── prompterrr/          # Modulo Prompterrr migrato
    │       ├── __init__.py
    │       ├── architect.py     # Generatore iniziale bozza prompt
    │       ├── critic.py        # Validatore, refiner e safety check
    │       └── context_cache.py # Cache semantica locale e calcolo token
    └── config/
        └── settings.py          # Configurazioni, costanti e path assoluti
```

### 2.2 Architettura del Bundle Nativo `.app` macOS

All'interno dell'applicazione pacchettizzata, il frontend Tauri e il backend Python risiedono all'interno dello stesso bundle bundle standard di macOS:

```
JLauncherOS.app/
└── Contents/
    ├── Info.plist               # LSUIElement = true (opzionale per HUD pura), Permessi Mic/Disk
    ├── MacOS/
    │   └── jlauncheros          # Binario compilato Rust (Tauri Host)
    ├── Resources/
    │   ├── icons/               # Icone applicazione e menubar
    │   └── backend/             # Runtime Python e codice sorgente consolidato
    │       ├── venv/            # Python 3.12 embedded o venv pre-compilato per arm64
    │       ├── main.py          # Entrypoint demone
    │       ├── core/
    │       └── modules/
    └── Frameworks/              # Librerie dinamiche WebKit / Tauri
```

---

## 3. Le Regole Ferree di Ingegneria (Inviolable Rules)

Ogni riga di codice scritta per JLauncherOS deve sottostare senza eccezioni a questi quattro principi cardinali:

### Regola 1: Graceful Shutdown e Process Supervision Assoluta
* **Rapporto Supervisore-Subordinato:** Il processo Tauri scritto in Rust è l'unico **Parent Process**. Il backend Python è un **Child Process (Sidecar)** subordinato.
* **Ciclo di Vita:** All'avvio di Tauri (`setup` hook in `src-tauri/src/main.rs`), Tauri genera il processo Python registrandone il `Child` e il `PID`.
* **Trappola dei Segnali:** Alla ricezione di `RunEvent::ExitRequested`, `SIGINT`, o `SIGTERM` da parte del sistema operativo, Tauri invia immediatamente `SIGTERM` al PID Python.
* **Grace Period e Fallback:** Viene applicato un timeout di grace period di **3.0 secondi**. Se il processo Python non termina autonomamente entro il tempo limite, Rust invoca imperativamente `SIGKILL` (`kill -9`) sul child process.
* **Divieto Assoluto di Zombie:** È categoricamente vietato lasciare processi Python attivi in background dopo la chiusura di JLauncherOS. Qualsiasi build che lasci processi orfani fallisce i criteri di rilascio.

### Regola 2: Zero Silent Failures ed Error Propagation
* **In Rust (`src-tauri/`):**
  * Vietato l'uso di `.unwrap()` o `.expect()` non motivati su percorsi di runtime (ammessi unicamente in test unitari e asserzioni statiche al compile-time).
  * Tutte le operazioni I/O, IPC e di windowing devono usare `Result<T, E>` tipizzati con la crate `thiserror` per errori di dominio, e `anyhow` unicamente al livello di bordo (`main.rs`).
  * Qualsiasi fallimento di connessione IPC deve essere loggato con contesto e gestito con retry logic non bloccante.
* **In Python (`backend/`):**
  * È formalmente vietato l'uso del costrutto `except Exception: pass` o `except Exception: logger.debug(...)`.
  * Tutte le eccezioni critiche (I/O, IPC, Audio, Moduli) devono essere esplicitamente tracciate con `logger.error("Dettaglio del contesto fallito", exc_info=True)`.
  * Se un modulo fallisce internamente (es. Help Memoria incontra una directory priva di permessi), l'errore deve essere incapsulato e ritornato come oggetto d'errore JSON-RPC 2.0 strutturato, senza mai crashare l'event loop di JARVIS.

### Regola 3: M4 Edge-First Architecture e Zero-Distraction Focus
* **Esecuzione 100% Locale:** Il processing audio, l'ascolto continuo della hotword (`openWakeWord`) e la sintesi/trascrizione vocale (Whisper MLX / Apple Speech nativo) devono essere eseguiti localmente sfruttando il Neural Engine e i core dedicati del chip Apple Silicon M4.
* **Zero Latenza di Rete per Azioni OS:** Nessun comando locale del sistema operativo (es. mutare volume, lanciare app, scansione disco, cambio traccia Spotify) deve dipendere da chiamate cloud esterne.
* **Rispetto Assoluto del Focus Mode:** Il demone include un `focus_manager.py` centrale.
  * Quando lo stato è impostato su `DEEP_WORK` o `STUDY`, il sistema vocale disattiva qualunque proattività sonora o pop-up invasivo.
  * La Dynamic Notch in modalità focus riflette visivamente lo stato con una pulsazione discreta senza espandersi arbitrariamente.

### Regola 4: Asyncio Puro e Isolamento dell'I/O Pesante (Thread Offloading)
* **Inviolabilità dell'Event Loop:** L'event loop principale di Python 3.12 gestisce unicamente:
  1. Il router WebSocket a latenza zero (< 5ms tick rate).
  2. Il dispatcher di messaggi JSON-RPC.
  3. L'ascolto reattivo dei microfoni e gli stati macchina.
* **Divieto di Blocking I/O:** Nessuna operazione di lettura/scrittura sincrona su disco, computazione di hash SHA256 o scansione di file system (tipica di Help Memoria) può essere eseguita direttamente all'interno di funzioni `async def`.
* **Offloading Mandatorio:** Qualsiasi operazione I/O-intensive o CPU-bound deve essere tassativamente delegata a un pool dedicato tramite:
  ```python
  loop = asyncio.get_running_loop()
  result = await loop.run_in_executor(global_thread_pool, blocking_function, *args)
  ```
  Questo garantisce che la risposta WebSocket e l'animazione della Notch non subiscano mai stuttering o freeze.

---

## 4. Matrice di Integrazione e Responsabilità dei Componenti

| Componente | Linguaggio / Runtime | Ruolo Primario nel Monorepo | Meccanismo di Interazione |
| :--- | :--- | :--- | :--- |
| **Tauri Core** | Rust 1.78+ | Supervisore di processo, Window controller, Menubar Tray, Gestione permessi OS | API native macOS (`Cocoa`, `AppKit`), `std::process::Command` |
| **LaunchMe UI** | React 18, Vite, TS | Dynamic Notch, animazioni a 120 FPS, HUD interattivo, dashboard comandi | WebSocket bidirezionale locale verso Python |
| **JARVIS Core** | Python 3.12, asyncio | Router logico, WebSocket Server, Voice Pipeline, state machine del sistema | `ws://127.0.0.1:8765/ws` (JSON-RPC 2.0) |
| **Help Memoria** | Python (C-extensions/I/O) | Scansione storage APFS, calcolo metriche cache, esecuzione pulizie disco | Esecuzione su `ThreadPoolExecutor`, notifiche push via WebSocket |
| **Prompterrr** | Python 3.12, MLX/LLM | Pipeline prompt Architetto-Critico, context caching semantico | Chiamate RPC asincrone con streaming token chunk-by-chunk |
