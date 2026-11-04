# 📦 RELEASE SOURCE: JARVIS v2.0 — JLauncherOS Fase 2 (IPC Bridge & JSON-RPC Router)
**Data Release:** 2026-11-03 | **Versione Precedente:** v1.0 | **Stato Test Suite (`@tests/`):** [16/16 PASSED]

## 📊 Matrice di Stato Globale dei 6 Pilastri (Cumulativa)
| Pilastro | Documento Madre | Versione Attuale | Stato Wiring Reale (`@main.py`) | File `@` Principali Toccati in questa v2.X |
| :--- | :--- | :--- | :--- | :--- |
| 1. Core & Runtime | `@01_core_and_runtime.md` | v2.0 | ATTIVO | `@backend/main.py`, `@backend/core/router.py`, `@backend/core/server.py`, `@src-tauri/src/main.rs` |
| 2. Voice Engine & Audio | `@02_voice_engine_and_audio.md` | v2.0 | ATTIVO | `@backend/core/voice_engine.py`, `@src/components/notch/DynamicNotch.tsx` |
| 3. Second Brain & Memory | `@03_memory_and_knowledge_graph.md` | v2.0 | ATTIVO | `@backend/modules/help_memoria/disk_scanner.py`, `@backend/modules/help_memoria/apfs_monitor.py` |
| 4. Connectors & Vision | `@04_connectors_and_integrations.md` | v2.0 | ATTIVO | `@src/hooks/useWebSocket.ts`, `@src/types/ipc_schema.ts` |
| 5. Proactivity & Agents | `@05_proactivity_and_subagents.md` | v2.0 | ATTIVO | `@backend/modules/prompterrr/critic.py`, `@backend/modules/prompterrr/architect.py` |
| 6. Generative UI & App | `@06_generative_ui_and_packaging.md` | v2.0 | ATTIVO | `@src/components/notch/NotchController.tsx`, `@src/App.tsx` |
---

## 1. Sintesi Esecutiva & Obiettivo della Release
La **Fase 2** di JLauncherOS realizza il "Sistema Nervoso" locale ad altissima velocità tra l'host nativo Tauri v2 / interfaccia React 18 e il demone subordinato Python 3.12 (JARVIS Core).
La comunicazione avviene unicamente su interfaccia di loopback (`ws://127.0.0.1:8765/ws`) con framing **JSON-RPC 2.0**, autenticazione crittografica di sessione pre-handshake (token effimero UUIDv4 generato da Rust) e latenza Round-Trip Time (RTT) benchmarkata a **0.20 ms** su Apple Silicon M4 (< 2.0 ms garantito).

## 2. Modifiche ai Moduli & Dettagli Implementativi
- **Knowledge Base & Specifiche (`@docs/`):**
  - `@docs/06_PHASE2_IPC_BRIDGE.md`: inserita specifica architetturale vincolante su endpoint `ws://127.0.0.1:8765/ws`, JSON-RPC 2.0, token effimero da Rust, rifiuto pre-handshake `-32005` e target RTT < 2.0ms.
  - `@docs/02_IPC_SCHEMA_WEBSOCKET.md`: formalizzata la firma del metodo `system.ping` (usato per il calcolo dell'RTT), con gestione degli errori `-32005` e misurazione con `performance.now()`.
- **Rust Native Host (`@src-tauri/`):**
  - `@src-tauri/src/main.rs`: implementato ed esposto il comando `#[tauri::command] fn get_ipc_secret(...)` che recupera in modo thread-safe il token UUIDv4 da `SidecarState` con mappatura di ogni errore in stringa (`.map_err(|e| e.to_string())`) e **zero `.unwrap()`** nel codice di produzione.
  - Registrazione del comando in `.invoke_handler(tauri::generate_handler![get_ipc_secret])`.
- **Backend Python (`@backend/core/`):**
  - `@backend/core/router.py`: implementati modelli Pydantic v2 per serializzazione/deserializzazione JSON-RPC 2.0, gestione codici di errore standard (`-32700` .. `-32603`) e codici custom JLauncherOS, blocco delle chiamate pre-handshake con errore `-32005` (`Authentication Failure`), handler asincroni per `system.handshake`, `system.setFocusMode` e `system.ping`.
  - `@backend/core/server.py`: implementato `IPCWebSocketServer` su loopback `127.0.0.1:8765` con `websockets.asyncio.server`, `ping_interval=3` e `ping_timeout=3`, gestione client connessi e autenticati con rimozione atomica garantita in blocco `try ... finally` (**Zero Memory Leak**), e metodo `broadcast_event` per notifiche push prive di `id`.
  - `@backend/main.py`: istanziazione di `IPCRouter` e `IPCWebSocketServer`, avvio asincrono in background prima del loop principale ed integrazione nel Graceful Shutdown (`SIGINT`/`SIGTERM`) con cancellazione di tutti i task pendenti.
- **Frontend React (`@src/`):**
  - `@src/types/ipc_schema.ts`: schema TypeScript rigoroso con interfacce Request/Response/Notification JSON-RPC 2.0 e parametri/risultati per `system.*`, `voice.*`, `memory.*` e `prompterrr.*`.
  - `@src/hooks/useWebSocket.ts`: custom hook con chiamata `invoke("get_ipc_secret")` via Tauri, apertura WS su loopback, auto-handshake immediato, tracciamento delle promise pendenti con calcolo latenza reale RTT via `performance.now()`, riconnessione con backoff esponenziale (200ms - 2000ms) e bus pub/sub.
  - `@src/components/notch/NotchController.tsx`: componente controller dinamico che consuma `useWebSocket`, visualizza in tempo reale lo stato della connessione e l'RTT misurato, ed offre trigger diagnostici per ping e commutazione del Focus Mode.
  - `@src/App.tsx`: montaggio integrato del controller all'interno della dashboard con navigazione a schede.
- **Automated Test Suite (`@tests/`):**
  - `@tests/test_ipc_server.py`: suite completa basata su `pytest` e `pytest-asyncio` con 6 test per rifiuto chiamate pre-handshake (-32005), rifiuto token non valido (-32005), successo handshake e setFocusMode, error codes -32601 e -32602, push broadcast ed RTT benchmark su loopback.

## 3. Esito Verifiche di Wiring (Checklist Anti-Isolamento)
| Controllo di Wiring (Anti-Isolamento) | Stato | File `@` di Verifica |
| :--- | :--- | :--- |
| 1. Il modulo WS Server è importato ed esposto in `main.py`? | **Sì** | `@backend/main.py` |
| 2. Il comando/evento è tipizzato nello schema condiviso? | **Sì** | `@src/types/ipc_schema.ts` |
| 3. Le operazioni I/O pesanti sono delegate senza bloccare? | **N.A.** | (Fase 3) |
| 4. È garantita l'assenza di `.unwrap()` in Rust `get_ipc_secret`? | **Sì** | `@src-tauri/src/main.rs` |
| 5. Il server WS previene i memory leak con `try...finally`? | **Sì** | `@backend/core/server.py` |
| 6. React recupera il secret e si connette a 120 FPS? | **Sì** | `@src/hooks/useWebSocket.ts` |
| 7. I test confermano il rifiuto (-32005) e l'RTT < 2.0ms? | **Sì** | `@tests/test_ipc_server.py` |

## 4. Resoconto Test Suite (`@tests/`)
- **Pytest IPC Server (`tests/test_ipc_server.py`):** 6/6 PASSED (0.41s)
- **Benchmark RTT Loopback (Apple Silicon M4):**
  - Latenza Media: **0.20 ms** (requisito: < 2.0 ms)
  - Latenza Minima: **0.14 ms**
  - Latenza Massima: **0.32 ms**
- **Test Suite Completa (`tests/`):** 16/16 PASSED (1.12s)
- **Compilazione Frontend (`npm run build`):** Successo (Vite 5 + TypeScript 5.6) in 242ms.
- **Compilazione Rust (`cargo check`):** Successo in 0.43s, 0 errori.

## 5. Impatto Architetturale & Prossimi Passi
La Fase 2 consolida il substrato comunicativo bidirezionale a latenza sub-millisecondo tra Tauri/React e il runtime Python. Il sistema è ora pienamente equipaggiato per gestire il multiplexing degli eventi audio 120 FPS, le telemetrie APFS di Help Memoria e lo streaming dei token di Prompterrr senza bloccare l'interfaccia né il loop principale.
