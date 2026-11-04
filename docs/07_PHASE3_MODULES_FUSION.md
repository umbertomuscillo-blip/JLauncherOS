# 🧠 07_PHASE3_MODULES_FUSION.md
## Integrazione Moduli: Fusione Help Memoria, Prompterrr & Dynamic Notch (Fase 3)

**Target OS:** macOS Sonoma / Sequoia (Apple Silicon M4 Architecture)  
**Host Process:** Tauri v2 Native Host (Rust 1.78+)  
**Sidecar Process:** JARVIS Core Daemon (Python 3.12 / pure `asyncio`)  
**Data Creazione:** 03 Novembre 2026  
**Stato:** Fase 3 Architecture Specification (Fully Integrated)

---

## 1. Visione Architetturale della Fusione

La Fase 3 porta a compimento la convergenza definitiva dei moduli applicativi all'interno dell'architettura unificata di **JLauncherOS**:
1. **Help Memoria:** Diagnostica dello storage APFS, scansione asincrona non bloccante delle cache di sviluppo (Xcode `DerivedData`, CocoaPods, log, browser) e pulizia sicura.
2. **Prompterrr:** Pipeline cognitiva a due stadi **Architetto-Critico** con context caching semantico, compressione token e streaming reattivo verso la Dynamic Notch.
3. **JARVIS Voice & Focus Engine:** State machine a 4 stati vocali (`idle`, `listening`, `thinking`, `speaking`) integrata con il Focus Manager per il rispetto assoluto degli stati `DEEP_WORK` e `STUDY`.
4. **LaunchMe Dynamic Notch UI:** Componenti React a 120 FPS con transizioni visive hardware-accelerated (`transform3d`, `will-change`).

---

## 2. Regola Ferrea dell'Offloading Mandatorio (Asyncio ThreadPool su M4)

> "La reattività dell'interfaccia a 120 FPS dipende dall'assoluta fluidità del WebSocket. In Fase 3, qualsiasi operazione I/O bloccante (scansione APFS, hashing di contesto, operazioni filesystem di Help Memoria e Prompterrr) DEVE essere incapsulata ed eseguita tramite un `ThreadPoolExecutor` globale dimensionato per Apple Silicon M4 (`max_workers=8`). È severamente vietato eseguire cicli o chiamate bloccanti direttamente nel loop di asyncio."

### Principi Guida:
- **Zero Event Loop Starvation:** Tutte le funzioni che usano `os.walk`, manipolano grossi file (Help Memoria) o calcolano hash SHA-256 (Prompterrr) vengono delegate tramite `run_in_thread_pool(func, *args, **kwargs)` in `@backend/core/thread_pool.py`.
- **M4 Worker Topology:** Il pool globale è configurato a `max_workers=8` con prefisso thread `jlauncher_m4_worker`, mappando il carico sui core Performance ed Efficiency di Apple Silicon.
- **Graceful Shutdown (Zero Zombie):** Invocazione mandatoria di `shutdown_thread_pool(wait=True)` su intercettazione di segnali `SIGINT`/`SIGTERM` in `@backend/main.py`.

---

## 3. Mappatura Metodi RPC e Notifiche Push Cablate

| Namespace | Metodo RPC Primario | Alias Retrocompatibile | Eventi Push Emessi | Descrizione |
| :--- | :--- | :--- | :--- | :--- |
| **`memory`** | `memory.scan` | `memory.triggerDiskScan` | `event.memory.scanProgress`, `event.memory.diskAlarm` | Scansione storage APFS e monitoraggio soglie |
| **`memory`** | `memory.clean` | `memory.cleanCaches` | `event.memory.scanProgress` | Purge sicuro delle cache autorizzate |
| **`memory`** | `memory.getStorageTelemetry` | - | - | Statistiche disco APFS (usato, libero, percentuale) |
| **`prompterrr`** | `prompterrr.submitPrompt` | `prompterrr.executePipeline` | `event.prompterrr.tokenStream`, `event.prompterrr.pipelineComplete` | Elaborazione Dual-Stage Architetto-Critico e streaming |
| **`prompterrr`** | `prompterrr.abortPipeline` | - | - | Interruzione immediata della pipeline attiva |
| **`voice`** | `voice.startListening` | - | `event.voice.stateChanged`, `event.voice.transcript` | Avvio ascolto vocale e transizione stato |
| **`voice`** | `voice.stopListening` | - | `event.voice.stateChanged` | Arresto ascolto vocale |
| **`system`** | `system.setFocusMode` | - | `event.voice.stateChanged` | Focus mode (NORMAL, DEEP_WORK, STUDY) |
| **`media`** | `media.controlPlayback` | - | `event.media.trackChanged` | Controlli audio per Dynamic Notch Island |

---

## 4. Specifiche UI Dynamic Notch a 120 FPS

- **Rendering Accelerato:** La Dynamic Notch in `@src/components/notch/DynamicNotch.tsx` sfrutta il compositing GPU di Metal via:
  ```css
  transform: translate3d(0, 0, 0);
  will-change: width, height, transform;
  ```
- **Zero Jitter:** I frame rate rimangono costanti a 120 Hz sui display ProMotion di MacBook Pro M4 anche durante scansioni APFS ad alta intensità di file.
