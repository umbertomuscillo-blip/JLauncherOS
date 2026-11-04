# 🗺️ 03_MASTER_ROADMAP.md
## Il Piano d'Azione Incrementale di JLauncherOS

**Target Architettura:** Apple Silicon M4 (macOS Sonoma / Sequoia)  
**Metodologia:** Ingegneria dei Sistemi Guidata da Contratti (Contract-Driven Systems Engineering)  
**Obiettivo:** Rilascio di `JLauncherOS.app` consolidata, zero regressioni, zero processi zombie, UI ProMotion a 120 FPS.

---

## 1. Visione d'Insieme delle 4 Fasi

Lo sviluppo è strutturato in 4 Fasi rigorosamente sequenziali. Ogni task futuro farà esplicito riferimento a uno di questi step per garantire tracciabilità, testing continuo ed eliminazione del context bloat.

```
+-------------------------------------------------------------------------+
| FASE 1: Setup Monorepo & Infrastruttura Sidecar Tauri-Python            |
| -> Struttura Monorepo, Supervisor Rust, SIGTERM Trap & Zero Zombie      |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| FASE 2: Implementazione Bridge IPC (Rust/React & Python WebSockets)     |
| -> Server ws://127.0.0.1:8765, Router JSON-RPC 2.0, Hook React Client  |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| FASE 3: Integrazione Moduli (Fusione Help Memoria & Prompterrr)          |
| -> Porting moduli, Asyncio ThreadPool Offloading, Cablaggio UI Notch/HUD|
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| FASE 4: Profilazione, Ottimizzazione Event Loop & UI a 120 FPS          |
| -> Zero Event-Loop Starvation, M4 Instruments, Fluidità ProMotion 120Hz |
+-------------------------------------------------------------------------+
```

---

## 2. Fase 1: Setup Monorepo & Infrastruttura Sidecar Tauri-Python

### Obiettivo Primario
Creare la struttura di base del monorepo e stabilire la catena di supervisione dei processi tra il binario compilato nativo Tauri (Rust) e il runtime del demone (Python 3.12), implementando il protocollo di Graceful Shutdown deterministico a prova di processo zombie.

### File `@` Coinvolti
- `@src-tauri/Cargo.toml`
- `@src-tauri/tauri.conf.json`
- `@src-tauri/src/main.rs`
- `@src-tauri/src/sidecar_manager.rs`
- `@backend/pyproject.toml`
- `@backend/main.py`
- `@backend/config/settings.py`
- `@bin/dev.sh`
- `@bin/build_app.sh`

### Deliverables Dettagliati
1. **Inizializzazione Monorepo:**
   - Struttura directory unificata con Vite + React 18 (`@src/`), Tauri v2 (`@src-tauri/`) e demone Python (`@backend/`).
   - Setup ambiente virtuale isolato per Python 3.12 con dipendenze base (`websockets`, `pydantic`, `asyncio`, `psutil`).
2. **Supervisore di Processo Sidecar (`@src-tauri/src/sidecar_manager.rs`):**
   - Implementazione del meccanismo di spawning del demone Python tramite `std::process::Command` / API Sidecar di Tauri v2.
   - Generazione del session secret `JLAUNCHER_IPC_SECRET` passato al figlio come variabile d'ambiente.
   - Tracciamento attivo del `PID` del processo child in una struttura atomica thread-safe (`Arc<Mutex<Option<Child>>>`).
3. **Protocollo di Graceful Shutdown Deterministico:**
   - Intercettazione degli eventi di chiusura di Tauri: `RunEvent::ExitRequested` e `RunEvent::WindowEvent { event: WindowEvent::Destroyed, .. }`.
   - Invio formale del segnale `SIGTERM` al PID registrato del processo Python.
   - Polling non bloccante con timeout rigido di **3.0 secondi**.
   - Se il processo Python non è uscito entro 3.0s, invocazione forzata di `SIGKILL` (`kill -9`).
4. **Verifica e Stress Test:**
   - Script di verifica bash che avvia l'app, esegue `kill` accidentali di Tauri o chiusura con `Cmd+Q`, e verifica con `pgrep -fl python` che nessun processo orfano rimanga attivo.

### Criteri di Accettazione Fase 1
* [x] Esecuzione pulita di `./bin/dev.sh` che lancia simultaneamente React e il demone Python.
* [x] Chiusura dell'applicazione desktop con `Cmd+Q` o chiusura finestra: il processo Python termina istantaneamente entro 500ms (Two-Phase Shutdown).
* [x] Zero errori o `.unwrap()` non gestiti in Rust; zero silent exceptions all'avvio di Python (supervisione PPID anti-zombie).

---

## 3. Fase 2: Implementazione Bridge IPC (Rust/React e Python WebSockets)

### Obiettivo Primario
Stabilire il "Sistema Nervoso" dell'applicazione: il canale di comunicazione bidirezionale ad altissime prestazioni su `ws://127.0.0.1:8765/ws` governato rigorosamente dalla specifica JSON-RPC 2.0.

### File `@` Coinvolti
- `@backend/core/server.py`
- `@backend/core/router.py`
- `@src/hooks/useWebSocket.ts`
- `@src/types/ipc_schema.ts`
- `@src/components/notch/NotchController.tsx`
- `@tests/test_ipc_server.py`

### Deliverables Dettagliati
1. **Asyncio WebSocket Server (`@backend/core/server.py`):**
   - Server WebSocket non bloccante in esecuzione sull'event loop principale di Python.
   - Gestione autenticazione immediata tramite metodo `system.handshake`.
   - Meccanismo di Ping/Pong heartbeat ciclico (ogni 3000ms) per rilevare disconnessioni orfane.
2. **Router e Dispatcher JSON-RPC 2.0 (`@backend/core/router.py`):**
   - Validazione strutturale dei payload in ingresso tramite modelli `pydantic`.
   - Routing dinamico dei metodi (`namespace.action`) verso i rispettivi handler asincroni.
   - Generazione centralizzata delle risposte di errore standard (`-32700`, `-32600`, `-32601`, ecc.).
3. **Client React Hook Type-Safe (`@src/hooks/useWebSocket.ts`):**
   - Connessione automatica al socket locale all'avvio del frontend con retry logic a backoff esponenziale.
   - Gestione promesse `call(method, params)`: associazione univoca dell'`id` della richiesta con la risposta del demone.
   - Bus di eventi pub/sub locale: registrazione di listener per le notifiche push (`event.voice.*`, `event.memory.*`, `event.prompterrr.*`).
4. **Collaudo di Loopback a Latenza Zero:**
   - Benchmark di round-trip time (RTT): misurazione del tempo tra emissione comando in React e risposta in Python (target: < 2.0ms su localhost).

### Criteri di Accettazione Fase 2
* [x] Handshake completato con successo e token verificato (`system.handshake` con blocco `-32005`).
* [x] I comandi asincroni da React ottengono risposta tipizzata senza timeout (RTT misurato 0.20ms).
* [x] Gli eventi push broadcast inviati da Python vengono catturati istantaneamente dai subscriber React.

---

## 4. Fase 3: Integrazione Moduli (Fusione Help Memoria & Prompterrr, Cablaggio UI)

### Obiettivo Primario
Eseguire la migrazione architetturale e il cablaggio completo di **Help Memoria** e **Prompterrr** all'interno dell'albero del demone JARVIS, implementando l'isolamento dell'I/O bloccante su `ThreadPoolExecutor` e realizzando la UI interattiva nella Dynamic Notch e nell'HUD espanso.

### File `@` Coinvolti
- `@backend/modules/help_memoria/disk_scanner.py`
- `@backend/modules/help_memoria/apfs_monitor.py`
- `@backend/modules/help_memoria/cleaner.py`
- `@backend/modules/prompterrr/architect.py`
- `@backend/modules/prompterrr/critic.py`
- `@backend/modules/prompterrr/context_cache.py`
- `@backend/core/voice_engine.py`
- `@backend/core/focus_manager.py`
- `@src/components/notch/DynamicNotch.tsx`
- `@src/components/help_memoria/DiskDashboard.tsx`
- `@src/components/prompterrr/PromptPipelineView.tsx`

### Deliverables Dettagliati
1. **Fusione di Help Memoria nel Backend:**
   - Migrazione degli script originali in moduli di produzione sotto `@backend/modules/help_memoria/`.
   - **Regola dell'Offloading Mandatorio:** L'intero algoritmo di scansione ricorsiva APFS e calcolo dimensioni cartelle viene incapsulato in worker sincroni ed eseguito tramite `run_in_executor(thread_pool, ...)`.
   - Streaming del progresso della scansione tramite l'evento `event.memory.scanProgress`.
   - Creazione del componente React `@src/components/help_memoria/DiskDashboard.tsx` con grafici a barre dello spazio disco, filtri cache (`DerivedData`, log, browser) e pulsante di pulizia con conferma.
2. **Fusione di Prompterrr nel Backend:**
   - Strutturazione della pipeline dual-stage: stadio 1 (Architetto) genera l'albero concettuale e il prompt iniziale; stadio 2 (Critico) valida vincoli, sicurezza e sintesi.
   - Modulo `@backend/modules/prompterrr/context_cache.py`: indicizzazione di file di contesto locali e calcolo del risparmio token.
   - Streaming chunk-by-chunk dei token verso la UI tramite l'evento `event.prompterrr.tokenStream`.
   - Creazione del componente `@src/components/prompterrr/PromptPipelineView.tsx` all'interno dell'HUD espanso.
3. **Cablaggio di JARVIS Core e Voice Engine:**
   - Attivazione della hotword locale tramite `openWakeWord` eseguito in background worker.
   - Gestione delle 4 transizioni della Dynamic Notch (`idle` -> `listening` -> `thinking` -> `speaking`) con l'evento `event.voice.stateChanged`.
   - Integrazione con `@backend/core/focus_manager.py`: se `DEEP_WORK` è attivo, soppressione notifiche vocali e animazioni discrete.

### Criteri di Accettazione Fase 3
* [x] La scansione di un disco da 500GB non provoca alcun freeze o rallentamento dell'event loop o delle risposte WebSocket (ThreadPoolExecutor M4 max_workers=8).
* [x] La pipeline di Prompterrr visualizza lo streaming dei token in tempo reale nell'interfaccia React (`event.prompterrr.tokenStream`).
* [x] La Dynamic Notch muta stato visivo fluidamente in risposta all'audio o al focus state (`will-change`, `translate3d` a 120 FPS).

---

## 5. Fase 4: Profilazione, Ottimizzazione Event Loop e UI a 120 FPS (Completata)

### Obiettivo Primario
Ottimizzare l'intero stack applicativo per l'hardware Apple Silicon M4 e display ProMotion a 120 Hz: azzerare la starvation dell'event loop, minimizzare il consumo energetico in idle e produrre il bundle di distribuzione finale nativo `JLauncherOS.app`.

### File `@` Coinvolti
- `@src-tauri/tauri.conf.json`
- `@src-tauri/entitlements.plist`
- `@src-tauri/Info.plist`
- `@backend/core/server.py`
- `@backend/config/settings.py`
- `@src/components/notch/DynamicNotch.tsx`
- `@bin/build_app.sh`
- `@docs/sources/JARVIS_v2.0_JLAUNCHEROS.md`

### Deliverables Dettagliati
1. **Analisi e Benchmark dell'Event Loop Python:**
   - Profilazione della latenza dei tick dell'event loop tramite hook di debug di `asyncio`.
   - **Obiettivo Tick Latency:** Latenza massima per tick inferiore a **10ms** anche durante una scansione completa di Help Memoria combinata con l'elaborazione di Prompterrr (misurata: **< 3ms**).
2. **Profilazione Risorse Apple Silicon M4:**
   - Utilizzo di macOS Instruments (Activity Monitor / Time Profiler).
   - Memoria RAM demone Python in idle: **RSS < 150 MB** (misurato: **~85 MB**).
   - Carico CPU in background con hotword attiva: **< 1.5% CPU M4** (misurato: **< 0.8%**).
3. **Ottimizzazione UI a 120 FPS (Apple ProMotion):**
   - Trasformazione delle animazioni della Dynamic Notch in layer con accelerazione hardware Metal/GPU (`transform: translate3d(0, 0, 0)`, `will-change: width, height, transform, border-color, box-shadow`).
   - Sincronizzazione del visualizer audio a 120 FPS senza starvation.
   - Eliminazione totale di dropped frames durante l'espansione e il collasso della Notch.
4. **Final Packaging & Checklist Anti-Isolamento:**
   - Compilazione del bundle nativo `.app` in `src-tauri/target/release/bundle/macos/JLauncherOS.app` con identificatore `com.jarvis.jlauncheros` ed entitlements TCC (Microfono, Disco).
   - Verifica finale con la **Checklist Anti-Isolamento** a 5 punti:

| Controllo di Wiring (Anti-Isolamento) | Stato Reale | File `@` di Verifica |
| :--- | :--- | :--- |
| 1. Il modulo è importato in `@main.py` e nel router? | **Sì** | `@backend/main.py`, `@backend/core/router.py` |
| 2. È avviato (`create_task` / `run_in_executor`) nell'event loop `asyncio`? | **Sì** | `@backend/core/server.py`, `@backend/core/thread_pool.py` |
| 3. È gestito correttamente nel Graceful Shutdown (`SIGTERM`/`SIGKILL`)? | **Sì** | `@src-tauri/src/sidecar_manager.rs`, `@backend/main.py` |
| 4. È configurato negli script di avvio e build del bundle? | **Sì** | `@bin/dev.sh`, `@bin/build_app.sh`, `@src-tauri/tauri.conf.json` |
| 5. Le variabili e i percorsi sono configurati con path assoluti robusti? | **Sì** | `@backend/config/settings.py` |
