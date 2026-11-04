# ⚡ 02_IPC_SCHEMA_WEBSOCKET.md
## Il Sistema Nervoso: Protocollo IPC Locale a Latenza Zero (JSON-RPC 2.0)

**Endpoint Primario:** `ws://127.0.0.1:8765/ws`  
**Protocollo:** WebSocket (RFC 6455) con Framing **JSON-RPC 2.0**  
**Obiettivo:** Trasporto bidirezionale sub-millisecondo (< 1ms) tra UI React (LaunchMe) e Demone Python (JARVIS + Help Memoria + Prompterrr).

---

## 1. Topologia di Comunicazione e Handshake

```
+-------------------------------------------------------------+
|                     Tauri v2 Native App                     |
|                                                             |
|   +-----------------------+     ws://127.0.0.1:8765/ws      |
|   |   React 18 Frontend   | <===========================>   |
|   |  (LaunchMe / Notch)   |     Zero-Latency Loopback       |
|   +-----------------------+                                 |
|               ^                                             |
|               | (Window events)                             |
|               v                                             |
|   +-----------------------+      SIGTERM / Process Watch    |
|   |       Rust Host       | ---------------------------->   |
|   +-----------------------+                                 |
+-------------------------------------------------------------+
                                      |
                                      v
                    +-----------------------------------+
                    |      Python 3.12 Child Daemon     |
                    |              (JARVIS)             |
                    |                                   |
                    |  - Asyncio WebSocket Server       |
                    |  - Help Memoria (Offloaded I/O)   |
                    |  - Prompterrr (LLM Pipeline)      |
                    |  - Local Voice Engine (M4 Edge)   |
                    +-----------------------------------+
```

### 1.1 Specifiche di Connessione e Sicurezza Locale
1. **Loopback Binding:** Il server accetta connessioni unicamente da `127.0.0.1` (o Unix Domain Socket opzionale su `/tmp/jlauncheros.sock`).
2. **Session Handshake Token:** All'avvio del sidecar, Rust genera una chiave effimera UUIDv4 esportata in variabile d'ambiente `JLAUNCHER_IPC_SECRET`. Durante la connessione iniziale WebSocket, il frontend invia il token nell'header o tramite il metodo `system.handshake`.
3. **Heartbeat:** Ping/Pong ciclico ogni `3000ms`. Se tre ping consecutivi non ricevono pong entro 1000ms, il client React entra in modalità `RECONNECTING` con backoff esponenziale (min 200ms, max 2000ms).

---

## 2. Specifiche del Framing JSON-RPC 2.0

Tutti i messaggi scambiati devono aderire alla specifica JSON-RPC 2.0:

* **Command Request (React -> Python):**
  ```json
  {
    "jsonrpc": "2.0",
    "id": "uuid-v4-or-incremental-int",
    "method": "namespace.action",
    "params": { ... }
  }
  ```

* **Command Response (Python -> React):**
  ```json
  {
    "jsonrpc": "2.0",
    "id": "uuid-v4-or-incremental-int",
    "result": { ... }
  }
  ```

* **Command Error Response (Python -> React):**
  ```json
  {
    "jsonrpc": "2.0",
    "id": "uuid-v4-or-incremental-int",
    "error": {
      "code": -32000,
      "message": "Descrizione sintetica dell'errore",
      "data": { ... }
    }
  }
  ```

* **Push Notification / Telemetry Event (Python -> React):**
  *Nessun campo `id` presente.*
  ```json
  {
    "jsonrpc": "2.0",
    "method": "event.namespace.eventName",
    "params": { ... }
  }
  ```

---

## 3. Catalogo dei Comandi (React -> Python)

### 3.1 Namespace `system` (Core & Focus)

#### `system.handshake`
Autentica la sessione del frontend appena caricato.
* **Params:**
  ```json
  {
    "client_version": "1.0.0",
    "auth_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
  ```
* **Result:**
  ```json
  {
    "status": "authenticated",
    "daemon_uptime_seconds": 12.4,
    "system_mode": "NORMAL"
  }
  ```

#### `system.setFocusMode`
Attiva o disattiva le modalità di concentrazione di JARVIS.
* **Params:**
  ```json
  {
    "mode": "DEEP_WORK", // "NORMAL" | "DEEP_WORK" | "STUDY"
    "duration_minutes": 50,
    "silence_audio": true
  }
  ```
* **Result:**
  ```json
  {
    "previous_mode": "NORMAL",
    "active_mode": "DEEP_WORK",
    "expires_at": "2026-10-30T23:38:45Z"
  }
  ```

#### `system.ping`
Verifica diagnostica della connessione ad alta frequenza e misurazione della latenza Round-Trip Time (RTT) su loopback (< 2.0ms).
* **Vincolo di Sicurezza:** Richiede handshake completato (`system.handshake`). Se invocato pre-handshake riceve errore `-32005` (`Authentication Failure`).
* **Misurazione Latenza:** Lato client calcolato con `performance.now()` tra l'invio della richiesta e la risoluzione del frame di risposta.
* **Params:**
  ```json
  {
    "timestamp": 1730336000000
  }
  ```
* **Result:**
  ```json
  {
    "pong": true,
    "echo_timestamp": 1730336000000,
    "server_time": 1730336000001
  }
  ```
* **Error (se non autenticato):**
  ```json
  {
    "code": -32005,
    "message": "Authentication Failure: Session not authenticated. Call system.handshake first."
  }
  ```

---

### 3.2 Namespace `voice` (Motore Vocale Edge M4)

#### `voice.startListening`
Attiva forzatamente il microfono locale (bypassando o anticipando la hotword).
* **Params:** `{}`
* **Result:**
  ```json
  {
    "listening": true,
    "sample_rate": 16000
  }
  ```

#### `voice.stopListening`
Termina la sessione di cattura vocale attiva.
* **Params:** `{}`
* **Result:**
  ```json
  {
    "listening": false
  }
  ```

---

### 3.3 Namespace `memory` (Help Memoria - Diagnostica Disco & Cache)

#### `memory.triggerDiskScan`
Avvia una scansione asincrona offloadata su `ThreadPoolExecutor` di percorsi critici.
* **Params:**
  ```json
  {
    "deep_scan": false,
    "targets": ["caches", "logs", "xcode_derived_data", "trash"]
  }
  ```
* **Result:**
  ```json
  {
    "scan_id": "scan_882910ba",
    "status": "started",
    "estimated_target_count": 4
  }
  ```

#### `memory.cleanCaches`
Esegue la pulizia autorizzata per categorie selezionate dall'utente.
* **Params:**
  ```json
  {
    "scan_id": "scan_882910ba",
    "categories": ["xcode_derived_data", "system_logs"],
    "dry_run": false
  }
  ```
* **Result:**
  ```json
  {
    "freed_bytes": 14260633600,
    "freed_human": "13.28 GB",
    "deleted_files_count": 84210
  }
  ```

---

### 3.4 Namespace `prompterrr` (Pipeline LLM Architetto-Critico)

#### `prompterrr.executePipeline`
Invia una richiesta di raffinamento prompt con context caching semantico.
* **Params:**
  ```json
  {
    "prompt_input": "Crea una funzione Rust ad alte prestazioni per calcolare l'hash di file APFS.",
    "context_files": ["@src-tauri/src/main.rs"],
    "mode": "architect_critic",
    "temperature": 0.2,
    "enable_cache": true
  }
  ```
* **Result:**
  ```json
  {
    "pipeline_id": "pipe_019284fa",
    "status": "processing"
  }
  ```

#### `prompterrr.abortPipeline`
Interrompe immediatamente una generazione in corso.
* **Params:**
  ```json
  {
    "pipeline_id": "pipe_019284fa"
  }
  ```
* **Result:**
  ```json
  {
    "pipeline_id": "pipe_019284fa",
    "status": "aborted"
  }
  ```

---

### 3.5 Namespace `media` (Integrazione Spotify / macOS Audio)

#### `media.controlPlayback`
Invia comandi al controller multimediale locale (AppleScript / Spotify API locale).
* **Params:**
  ```json
  {
    "action": "play_pause" // "play" | "pause" | "play_pause" | "next" | "previous"
  }
  ```
* **Result:**
  ```json
  {
    "action_executed": "play_pause",
    "is_playing": true
  }
  ```

---

## 4. Catalogo degli Eventi Push (Python -> React)

Questi eventi asincroni vengono inviati dal demone Python in broadcast o su sottoscrizione al frontend per alimentare reazioni istantanee nella UI.

### 4.1 Eventi `event.voice` (Animazione Dynamic Notch)

#### `event.voice.stateChanged`
Pilota l'animazione della Notch tra le 4 modalità canoniche (`idle`, `listening`, `thinking`, `speaking`).
* **Payload:**
  ```json
  {
    "jsonrpc": "2.0",
    "method": "event.voice.stateChanged",
    "params": {
      "state": "speaking", // "idle" | "listening" | "thinking" | "speaking"
      "audio_amplitude": 0.74,
      "energy_frequency": [0.1, 0.4, 0.9, 0.6, 0.2]
    }
  }
  ```

#### `event.voice.transcript`
Trascrizione parziale e finale streaming da Whisper/MLX.
* **Payload:**
  ```json
  {
    "jsonrpc": "2.0",
    "method": "event.voice.transcript",
    "params": {
      "is_final": false,
      "text": "JARVIS avvia la scansione del",
      "confidence": 0.94
    }
  }
  ```

---

### 4.2 Eventi `event.memory` (Help Memoria Telemetry & Alarms)

#### `event.memory.scanProgress`
Aggiornamento in tempo reale del progresso scansione disco per la progress bar HUD.
* **Payload:**
  ```json
  {
    "jsonrpc": "2.0",
    "method": "event.memory.scanProgress",
    "params": {
      "scan_id": "scan_882910ba",
      "current_path": "/Users/umberto/Library/Caches/Google",
      "scanned_files": 34810,
      "discovered_cleanable_bytes": 6291456000,
      "percentage": 42.5
    }
  }
  ```

#### `event.memory.diskAlarm`
Allarme proattivo generato quando lo spazio libero su disco APFS scende sotto soglia critica.
* **Payload:**
  ```json
  {
    "jsonrpc": "2.0",
    "method": "event.memory.diskAlarm",
    "params": {
      "mount_point": "/",
      "available_bytes": 4831838208,
      "available_human": "4.50 GB",
      "severity": "CRITICAL", // "LOW" | "WARNING" | "CRITICAL"
      "recommendation": "Xcode DerivedData occupa 24 GB. Avviare pulizia con Help Memoria?"
    }
  }
  ```

---

### 4.3 Eventi `event.prompterrr` (Token Streaming & Pipeline Evolution)

#### `event.prompterrr.tokenStream`
Streaming di token generati in tempo reale (Architetto o Critico) verso il widget React.
* **Payload:**
  ```json
  {
    "jsonrpc": "2.0",
    "method": "event.prompterrr.tokenStream",
    "params": {
      "pipeline_id": "pipe_019284fa",
      "stage": "architect", // "architect" | "critic"
      "token_chunk": "use std::fs::File;\nuse std::io::Read;\n",
      "tokens_emitted": 128
    }
  }
  ```

#### `event.prompterrr.pipelineComplete`
Notifica di completamento della pipeline con telemetria di caching.
* **Payload:**
  ```json
  {
    "jsonrpc": "2.0",
    "method": "event.prompterrr.pipelineComplete",
    "params": {
      "pipeline_id": "pipe_019284fa",
      "duration_ms": 1420,
      "cache_hit": true,
      "tokens_saved": 850,
      "final_prompt": "..."
    }
  }
  ```

---

### 4.4 Eventi `event.media` (Notch Media Island)

#### `event.media.trackChanged`
Notifica di cambio brano musicale per espansione animata della Notch in pillola musicale.
* **Payload:**
  ```json
  {
    "jsonrpc": "2.0",
    "method": "event.media.trackChanged",
    "params": {
      "title": "Time",
      "artist": "Hans Zimmer",
      "album": "Inception (OST)",
      "duration_seconds": 275,
      "position_seconds": 45,
      "is_playing": true,
      "album_art_url": "data:image/jpeg;base64,..."
    }
  }
  ```

---

## 5. Mappatura Codici di Errore

| Codice Errore | Significato Specifica JSON-RPC | Contesto JLauncherOS |
| :--- | :--- | :--- |
| **`-32700`** | Parse error | Payload JSON non valido o malformato ricevuto su WebSocket. |
| **`-32600`** | Invalid Request | Mancano campi obbligatori (`jsonrpc`, `method`, o `id`). |
| **`-32601`** | Method not found | Il namespace o metodo richiesto non è registrato nel demone. |
| **`-32602`** | Invalid params | Parametri mancanti o di tipo errato rispetto alle specifiche. |
| **`-32603`** | Internal error | Eccezione non gestita catturata e incapsulata nel demone. |
| **`-32001`** | Sidecar Busy | Help Memoria o Prompterrr hanno già un'operazione attiva non concorrente. |
| **`-32002`** | Mic Permission Denied | Permessi macOS non concessi per l'input audio. |
| **`-32003`** | Disk Access Denied | Mancanza di Full Disk Access per la scansione APFS protetta. |
| **`-32004`** | LLM Context Overflow | Il contesto inviato supera la window size del modello locale. |
| **`-32005`** | Authentication Failure | Token UUID di handshake non valido o mancante. |
