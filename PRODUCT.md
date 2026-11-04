# 🎯 ARCHITETTURA E SPECIFICHE DI PRODOTTO: JLAUNCHEROS

## 1. Visione del Prodotto e Valore Differenziale

**JLauncherOS** non è un semplice "clone" grafico: è un ambiente operativo ambientale unificato (**Ambient Operating System**) per macOS progettato per combinare la purezza estetica di **LaunchMe** con la potenza computazionale locale del demone **JARVIS Mark VII** su **Apple Silicon M4**.

### Perché Esiste JLauncherOS:
- **Superamento dei Limiti di macOS:** Launchpad di sistema è rigido, privo di categorizzazione avanzata, non supporta gli spazi di lavoro e non ha integrazione con l'hardware del Notch.
- **Privacy e Zero Latenza Locale:** Tutte le funzioni di monitoraggio file, estrazione icone, disinstallazione pulita e indicizzazione avvengono localmente al 100% sul processore M4, senza chiamate cloud esterne.
- **Esperienza Visiva Senza Compromessi:** Nessun effetto mock sintetico: finestre trasparenti native Cocoa AppKit, icone reali a 256px estratte dai bundle `.icns` del Mac e fluidità ProMotion a 120 FPS.

---

## 2. I Tre Strati del Sistema

### 1. Il Livello Hardware & Windowing (Rust / Tauri v2)
- **`app_indexer.rs`:** Sfrutta la crate `rayon` per scansionare in parallelo centinaia di applicazioni in meno di 80ms. Estrae i file `.icns`, li converte in PNG compressi e li salva in una cache locale persistente.
- **`notch_detector.rs`:** Interroga `NSScreen.safeAreaInsets` di AppKit per rilevare le coordinate fisiche esatte del Notch e posizionare l'overlay al millimetro senza sovrapposizioni visive.
- **`window_manager.rs`:** Mantiene due finestre native a zero decorazioni e sfondo trasparente (`launcher` e `notch`), coordinate con il monitor del cursore del mouse.
- **`gestures_hotkeys.rs`:** Gestisce il trackpad swipe e la registrazione globale della hotkey **⌘4**.

### 2. Il Livello Presentazione (React 18 + Tailwind v4 + Framer Motion)
- **Fluid Layout & App Squircles:** Disposizione libera con supporto per varianti visive delle icone (*Default*, *Clear Colored*, *Tinted*, *Dark Mode*).
- **Widgets Dinamici:** Orologio analogico 12-9-3-6 su cassa nera, widget meteo a curva oraria, matrice mensile dot calendar e visualizzatore vinilico con rotazione a 33⅓ o 45 RPM.
- **Dynamic Notch Island:** Nastro esteso con raccordi hardware continui, timer a righello millimetrato, visualizzatore audio live e Pocket Shelf per file drop immediato.

### 3. Il Cervello Locale (Python 3.12 asyncio Daemon)
- **`core/server.py` & `core/router.py`:** Server WebSocket ultra-veloce su `127.0.0.1:8765` protetto da token segreto (`IPC Secret`).
- **`modules/help_memoria/`:** Diagnostica continua di storage APFS, calcolo dei file residui orfani e pulizia profonda.
- **`modules/clipboard/`:** Monitoraggio e catalogazione intelligente degli appunti con supporto colori HEX.
- **`modules/prompterrr/`:** Pipeline cognitiva Architetto-Critico per prompt LLM ad alta precisione.

---

## 3. Obiettivo Finale della Roadmap

1. **Fase 1 (Completata):** Unificazione dell'architettura Tauri v2, modulo dual-window trasparente, scanner icone native e avvio demone con PPID watchdog.
2. **Fase 2 (Completata):** Reverse engineering estetico di LaunchMe, eliminazione dei tell sintetici AI e adozione di veri asset macOS Liquid Glass.
3. **Fase 3 (Prossimo Passo):** Packaging finale `.dmg` / `.app` nativo universale per macOS Sonoma e Sequoia con firma codice e integrazione automatica con la Menu Bar.
