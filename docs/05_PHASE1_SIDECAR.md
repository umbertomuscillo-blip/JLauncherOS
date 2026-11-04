# 🧟‍♂️ 05_PHASE1_SIDECAR.md
## Protocollo Zero Zombie & Supervisione Deterministica del Sidecar (Fase 1)

**Target OS:** macOS Sonoma / Sequoia (Apple Silicon M4 Architecture)  
**Host Process:** Tauri v2 Native Host (Rust 1.78+)  
**Sidecar Process:** JARVIS Core Daemon (Python 3.12 / pure `asyncio`)  
**Data Creazione:** 31 Ottobre 2026  
**Stato:** Foundational Phase 1 Specification

---

## 1. Regola Architetturale Fondamentale

> **"La stabilità di Jarvis dipende dall'assenza di processi zombie. In Fase 1, Rust (Tauri) detiene il ciclo di vita assoluto. Il demone Python deve includere un task asincrono che verifica ogni 1.0s `os.getppid() == 1` per autoterminarsi in caso di crash dell'interfaccia. Tauri deve inviare SIGTERM e, dopo 3 secondi non bloccanti, SIGKILL."**

---

## 2. Meccanica del Protocollo Zero Zombie a Due Livelli

Il rischio primario nei sistemi desktop ibridi (Webview / Rust + interprete dinamico Python) su macOS è il disaccoppiamento del ciclo di vita:
1. **Crash improvviso o chiusura forzata del Parent Process (Tauri):** Se Tauri viene terminato con `kill -9` o va in panico, il processo Python viene ereditato dal processo init/launchd (`PID 1`).
2. **Blocco dell'interprete child:** Se il child process Python entra in deadlock I/O o gestisce malamente `SIGTERM`, impedisce la chiusura pulita dell'applicazione o lascia la porta di comunicazione (`8765`) permanentemente occupata.

Per annientare i processi zombie, JLauncherOS implementa un controllo incrociato simmetrico e deterministico:

```
+-------------------------------------------------------------------------+
| RUST (Tauri Host Supervisor)                                            |
|                                                                         |
| 1. Spawn processo Python con Process Group dedicato                     |
| 2. Registra PID del figlio in SidecarState thread-safe                  |
| 3. Inietta segreto effimero: JLAUNCHER_IPC_SECRET=<UUIDv4>               |
| 4. Su Shutdown (WindowEvent::Destroyed / ExitRequested):                |
|    ├── FASE 1: Invia SIGTERM (libc::kill(pid, SIGTERM))                 |
|    ├── Timer non-bloccante di 3.0 secondi                               |
|    └── FASE 2: Se ancora vivo, invia SIGKILL (libc::kill(pid, SIGKILL)) |
+-------------------------------------------------------------------------+
                                    |
                            (Lifecycle Link)
                                    v
+-------------------------------------------------------------------------+
| PYTHON (JARVIS Daemon Subordinato)                                      |
|                                                                         |
| 1. Bootstrap event loop asyncio puro                                    |
| 2. Configura Signal Handlers (SIGINT, SIGTERM) -> graceful task cancel  |
| 3. Avvia Task Asincrono Watchdog PPID:                                  |
|    ├── loop ogni 1.0s con asyncio.sleep(1.0)                            |
|    ├── Verifica se os.getppid() == 1                                    |
|    └── Se True -> logger.critical() ed sys.exit(0) immediato            |
| 4. Risoluzione percorsi con Path(__file__).resolve() assoluti           |
+-------------------------------------------------------------------------+
```

---

## 3. Specifiche di Implementazione Rust (`@src-tauri/`)

1. **Gestione Errori Senza Panico:**
   - Vietato l'uso di `.unwrap()` o `.expect()` nel codice di produzione.
   - Tutti gli errori di runtime (fallimento di spawn del processo, fallimento di kill, I/O) devono essere propagati tramite enum `SidecarError` basato su `thiserror::Error`.
2. **Architettura `SidecarManager`:**
   - Struttura `SidecarState` avvolta in `Arc<Mutex<Option<Child>>>` registrata nel managed state di Tauri (`app.manage(...)`).
   - Metodo `spawn()`: localizza il binario Python nell'ambiente virtuale (`backend/venv/bin/python` o fallback di sistema), genera una chiave UUIDv4, imposta le variabili d'ambiente necessarie ed esegue il comando.
   - Metodo `graceful_shutdown()`:
     1. Recupera il `pid` nativo del processo figlio.
     2. Invia `SIGTERM` tramite `libc::kill(pid, libc::SIGTERM)`.
     3. Attende fino a 3000ms verificando tramite `child.try_wait()` con intervalli di 100ms.
     4. Se il processo non è terminato entro 3 secondi, esegue `libc::kill(pid, libc::SIGKILL)` o `child.kill()`.

---

## 4. Specifiche di Implementazione Python (`@backend/`)

1. **PPID Watchdog Asincrono (`ppid_watchdog`):**
   ```python
   async def ppid_watchdog(check_interval: float = 1.0) -> None:
       """Verifica che il parent process sia ancora in vita; se os.getppid() == 1 si auto-termina."""
       while True:
           await asyncio.sleep(check_interval)
           if os.getppid() == 1:
               logger.critical("Parent process (Tauri) terminato inaspettatamente (PPID=1). Auto-terminazione Zero Zombie.")
               sys.exit(0)
   ```
2. **Gestione Segnali Unix (`signal.SIGINT`, `signal.SIGTERM`):**
   - Registrazione handler asincrono sull'event loop: `loop.add_signal_handler(sig, shutdown_callback)`.
   - Chiusura ordinata e cancellazione di tutti i task pendenti `asyncio.all_tasks()`.
3. **Zero Silent Failures:**
   - Tracciamento mandatorio di qualunque eccezione con `logger.error("Dettaglio errore", exc_info=True)`.
4. **Risoluzione Path Assoluti (`@backend/config/settings.py`):**
   - Tutti i percorsi di configurazione e storage devono essere calcolati relativamente alla radice di progetto via `Path(__file__).resolve().parent.parent`.

---

## 5. Criteri di Validazione e Test (Stress Test Zero Zombie)

1. **Test Chiusura Normale (`Cmd+Q` / Destroyed Window):**
   - All'uscita dell'applicazione, il processo demone Python riceve `SIGTERM` e si chiude entro 500ms.
   - Nessun residuo su `ps aux | grep -i [m]ain.py`.
2. **Test Crash del Padre (`kill -9 <TAURI_PID>`):**
   - Se il supervisore Rust viene terminato bruscamente, il demone Python rileva `os.getppid() == 1` entro 1000ms ed effettua l'uscita pulita.
3. **Test Timeout SIGKILL:**
   - Se il demone Python ignora o è bloccato su `SIGTERM`, Rust forza `SIGKILL` dopo esattamente 3.0 secondi senza bloccare il thread di windowing.
