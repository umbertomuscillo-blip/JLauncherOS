# 🛡️ 04_ANTIGRAVITY_SKILLS_UPDATE.md
## Resoconto Analitico, Gap Analysis e Nuove Direttive Operative per JLauncherOS

**Data:** 31 Ottobre 2026  
**Autore:** Principal AI Engineer & Staff macOS Systems Architect  
**Destinazione:** Knowledge Base di Progetto & Fonte di Verità per Google NotebookLM  
**Ambito:** Sviluppo Monorepo Ibrido Tauri v2 (Rust + React 18) e Python 3.12 (JARVIS + Help Memoria + Prompterrr) su Apple Silicon M4

---

## 1. Executive Summary & Scansione Locale

Dall'analisi dei file di configurazione operativi presenti nel sistema (`~/.gemini/config/GEMINI.md`, `~/.gemini/config/skills/jarvis-release-manager/SKILL.md` e `~/.gemini/config/skills/python-expert/SKILL.md`), è emerso che il precedente flusso di lavoro era ottimizzato per lo sviluppo di JARVIS come demone autonomo su macOS, basato su script Bash e librerie Python pure (`pyobjc`, `say`, `pytest`).

### Punti di Forza Rilevati nel Setup Esistente
* **Checklist Anti-Isolamento:** Prevenzione sistematica dei "moduli orfani" non collegati all'event loop o agli script di lancio.
* **Zero Silent Failures:** Divieto di mascherare eccezioni con `except Exception: pass` o log a livello `debug`.
* **Token Economy e Diff Chirurgiche:** Priorità alla modifica atomica dei file ed esplicita referenziazione con tag `@percorso/file`.
* **Focus M4 Edge-First:** Rispetto dello stato di concentrazione (`DEEP_WORK`, `STUDY`) ed esecuzione locale.

### Gap Tecnologici Critici Rispetto a JLauncherOS
Con l'introduzione dell'architettura unificata di JLauncherOS, sono stati identificati tre gap operativi fondamentali:
1. **Assenza di Direttive Rust & Tauri v2:** Nessun vincolo sulla gestione della memoria, sulla sicurezza dei tipi o sulla gestione degli errori nel crate Rust nativo (`src-tauri/`). Rischio elevato di panic a runtime dovuto a chiamate non controllate di `.unwrap()` o `.expect()`.
2. **Mancanza di Supervisione del Processo Sidecar (Rischio Processi Zombie):** Assenza di un protocollo rigoroso per il ciclo di vita del processo figlio Python. In Tauri v2, un arresto anomalo dell'interfaccia o la chiusura della finestra con `Cmd+Q` rischia di lasciare il demone Python attivo in background (specialmente in caso di wrapper di ambienti virtuali o PyInstaller), bloccando la porta `8765` e consumando risorse di calcolo M4.
3. **Rischio di Starvation dell'Event Loop Python (Blocking I/O):** La skill Python esistente non proibiva tassativamente operazioni bloccanti all'interno di funzioni asincrone. Con l'integrazione di **Help Memoria** (scansioni ricorsive di milioni di file APFS e cache) e **Prompterrr** (indicizzazione di file di contesto e calcolo token), l'esecuzione di I/O sincrono sull'event loop congelerebbe il WebSocket, causando la disconnessione della Dynamic Notch e stuttering visivo nella UI.

---

## 2. Sintesi delle Best Practice Emerge dalla Ricerca Web (2025/2026)

### 2.1 Tauri v2 Sidecar & Graceful Termination
* **Gestione a Due Fasi (Two-Phase Shutdown):** Una chiusura elegante non deve affidarsi esclusivamente a un `SIGKILL` immediato. La sequenza industriale consolidata prevede:
  1. Invio di un comando applicativo via IPC (`system.shutdown`) o segnale `SIGTERM` al processo figlio per consentirgli di completare la scrittura dei log, rilasciare lock sul file system e chiudere i socket di rete.
  2. Avvio di un timer di grazia non bloccante (3.0 secondi).
  3. Invocazione forzata di `child.kill()` (`SIGKILL`) qualora il processo risulti ancora attivo allo scadere del timeout.
* **Il "PyInstaller / Virtualenv Wrapper Problem":** Quando un sidecar viene lanciato tramite un binario wrapper o uno script di attivazione ambiente, il comando di kill può terminare il processo wrapper lasciando orfano il child process reale. Per scongiurare questo scenario:
  - Rust deve tracciare il Process Group (`setpgid` su Unix) e terminare l'intero gruppo di processi.
  - Il demone Python deve implementare un thread watchdog che monitori lo stato del Parent Process ID (PPID): se il processo padre (Tauri) muore improvvisamente, il processo figlio si auto-termina immediatamente.

### 2.2 Python Asyncio JSON-RPC 2.0 su WebSocket
* **Decoupling Architetturale:** Separazione netta tra il layer di trasporto (`websockets.asyncio.server`), il parser di protocollo JSON-RPC 2.0 (con validazione tramite schemi Pydantic) e il registro dei metodi di business logic (`router.py`).
* **Isolamento Totale dell'Event Loop:** Utilizzo mandatorio di `asyncio.to_thread(...)` o `loop.run_in_executor(thread_pool, ...)` per qualsiasi operazione che superi i **5ms** di esecuzione (I/O su disco, scansione directory, hashing, inferenza o compressione stringhe).
* **Gestione Connessioni e Reverse Push:** Mantenimento di un set centralizzato di client attivi (`CONNECTED_CLIENTS`) con rimozione garantita all'interno di blocchi `finally`. Invio di notifiche push asincrone (eventi senza campo `id`) per lo streaming dei token e lo stato della Dynamic Notch.
* **Heartbeat Attivo:** Configurazione dei parametri `ping_interval=3` e `ping_timeout=3` per la rimozione istantanea di connessioni zombie su loopback.

---

## 3. Nuove Direttive Operative per JLauncherOS

Queste regole aggiornate integrano ed estendono le linee guida di sviluppo per il workspace `JLauncherOS`.

```markdown
---
name: jlauncheros-hybrid-engineer
description: Regole e protocolli per lo sviluppo del monorepo ibrido JLauncherOS (Tauri v2, Rust, React 18, Python 3.12 asyncio) su Apple Silicon M4.
---

# 🚀 Regolamento Operativo di Ingegneria: JLauncherOS

## SEZIONE 1: REGOLE FERREE RUST (Tauri v2 Core & macOS AppKit)

1. **Divieto Assoluto di `.unwrap()` e `.expect()` a Runtime:**
   - È categoricamente vietato l'uso di `.unwrap()` o `.expect()` nel codice di produzione Rust (`src-tauri/src/`).
   - Tutte le funzioni che gestiscono I/O, IPC, finestre native o chiamate di sistema devono restituire un tipo `Result<T, E>`.
   - Utilizzare la crate `thiserror` per definire gerarchie di errore strutturate all'interno dei moduli.
   - Nei comandi esposti a Tauri (`#[tauri::command]`), mappare gli errori in stringhe o tipi serializzabili mediante `.map_err(|e| e.to_string())`.

2. **Supervisione Deterministica del Sidecar e Gestione Zombie:**
   - Il processo Rust è l'unico orchestratore e proprietario del ciclo di vita del demone Python.
   - Il riferimento al child process deve essere archiviato nel managed state di Tauri (`Arc<Mutex<Option<CommandChild>>>`).
   - L'applicazione deve intercettare sia `WindowEvent::CloseRequested` che `RunEvent::ExitRequested`.
   - All'uscita dell'applicazione, eseguire la procedura a due fasi: invio `SIGTERM` -> attesa fino a 3000ms -> fallback con `SIGKILL`. Nessun processo orfano deve sopravvivere a `Cmd+Q`.

3. **Integrazione AppKit & Dynamic Notch:**
   - La configurazione delle finestre trasparenti e della Dynamic Notch deve sfruttare gli hook nativi di Tauri v2 senza causare blocchi sul Main Thread (UI thread di macOS).
   - Le modifiche di geometria della finestra devono essere aggregate o delegate asincronamente.

---

## SEZIONE 2: REGOLE FERREE PYTHON 3.12 (JARVIS Core, Help Memoria, Prompterrr)

1. **Inviolabilità dell'Event Loop di `asyncio` (Divieto di Blocking I/O):**
   - L'event loop principale deve essere dedicato unicamente al server WebSocket, al routing dei messaggi JSON-RPC e al coordinamento dello stato.
   - È severamente vietato invocare chiamate I/O sincrone (`open`, `os.walk`, `os.scandir`, `shutil.rmtree`, `time.sleep`) direttamente all'interno di funzioni `async def`.
   - **Regola di Offloading:** Tutte le funzioni intensive di **Help Memoria** (scansione inode APFS, calcolo dimensioni) e **Prompterrr** (indicizzazione file di contesto, chiamate a modelli pesanti) devono essere incapsulate in funzioni sincrone ed eseguite tramite:
     ```python
     result = await asyncio.to_thread(blocking_worker_function, *args)
     # oppure
     result = await loop.run_in_executor(custom_thread_pool, blocking_worker_function, *args)
     ```

2. **PPID Watchdog Obbligatorio:**
   - Il demone Python deve avviare all'avvio un task asincrono o un thread daemon di monitoraggio che verifichi periodicamente (`ogni 1000ms`) che il Parent Process ID (Tauri) sia ancora in vita:
     ```python
     if os.getppid() == 1:  # Adottato da launchd/init = padre morto
         logger.warning("Parent process terminated unexpectedly. Shutting down daemon.")
         sys.exit(0)
     ```

3. **Zero Silent Failures & Gestione Errori JSON-RPC 2.0:**
   - Vietato l'uso di `except Exception: pass` o `except Exception: logger.debug(...)`.
   - Tutte le eccezioni inattese devono essere registrate con `logger.error("Contesto operazione fallita", exc_info=True)`.
   - Il router deve convertire qualsiasi errore interno in una risposta JSON-RPC 2.0 conforme con codici errore dedicati (`-32603` per errori generici, `-32001` per sidecar busy, `-32003` per permessi disco insufficienti).

4. **Sottoscrizioni WebSocket e Memory Leak Prevention:**
   - La gestione dei client connessi deve essere protetta all'interno di blocchi `try ... finally`:
     ```python
     CONNECTED_CLIENTS.add(websocket)
     try:
         async for message in websocket:
             await handle_message(message)
     finally:
         CONNECTED_CLIENTS.discard(websocket)
     ```

---

## SEZIONE 3: CHECKLIST ANTI-ISOLAMENTO AGGIORNATA (7 PUNTI)

Ogni piano operativo (`/plan`) sviluppato per JLauncherOS deve terminare con la seguente matrice di verifica:

| Controllo di Wiring (Anti-Isolamento) | Stato Pianificato (Sì/No/N.A.) | File `@` e Target di Intervento |
| :--- | :--- | :--- |
| 1. Il modulo/funzionalità è importato ed esposto nel router centrale (`@backend/core/router.py` o `@src-tauri/src/main.rs`)? | ... | `@backend/core/router.py` |
| 2. Il comando/evento è tipizzato nello schema condiviso (`@src/types/ipc_schema.ts` e modelli Pydantic)? | ... | `@src/types/ipc_schema.ts` |
| 3. Le operazioni I/O pesanti sono delegate a `ThreadPoolExecutor` / `asyncio.to_thread` senza intaccare l'event loop? | ... | `@backend/modules/...` |
| 4. È garantita l'assenza di `.unwrap()` o `.expect()` non controllati nel percorso Rust? | ... | `@src-tauri/src/...` |
| 5. Il ciclo di vita e il Graceful Shutdown (SIGTERM + fallback SIGKILL) sono testati contro processi zombie? | ... | `@src-tauri/src/sidecar_manager.rs` |
| 6. La UI React riceve e gestisce lo stato via WebSocket hook (`@src/hooks/useWebSocket.ts`) a 120 FPS? | ... | `@src/components/...` |
| 7. I percorsi e gli ambienti sono referenziati tramite path assoluti robusti (`Path(__file__).resolve()`) per l'esecuzione nel bundle `.app`? | ... | `@backend/config/settings.py` |

> ⚠️ **Regola Ferrea:** Se anche un solo punto necessario risulta "No", il task **NON può passare all'esecuzione del codice**.
```

---

## 4. Matrice di Applicazione e Prossimi Passi

1. **Inclusione in NotebookLM:** Questo documento (`04_ANTIGRAVITY_SKILLS_UPDATE.md`) costituisce la guida di allineamento da sincronizzare su NotebookLM per impedire allucinazioni dell'assistente durante la scrittura del codice di JLauncherOS.
2. **Adozione nei Task di Fase 1:** La **Fase 1** della roadmap (Setup Monorepo & Sidecar Supervision) utilizzerà queste specifiche per implementare il `sidecar_manager.rs` e il bootstrap di `main.py` con watchdog PPID.
