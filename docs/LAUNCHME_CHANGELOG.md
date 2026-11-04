# 🛸 LaunchMe (macOS): Specifiche Tecniche, Architettura e Storico Completo Changelog

> **Sorgente Ufficiale:** [`https://launchmeapp.com/changelog/`](https://launchmeapp.com/changelog/)  
> **Ultimo Pacchetto DMG:** [`LaunchMeDirect-2.08.2.dmg`](https://launchmeapp.com/updates/LaunchMeDirect-2.08.2.dmg)  
> **Target OS:** macOS 14+, macOS 15 Sequoia, macOS 26 Tahoe, macOS 27 Golden Gate  
> **Ruolo nel Progetto JLauncherOS:** Benchmark primario per UI Overlay, Dynamic Notch Island, Liquid Glass Vibrancy, Gestures Multitouch e Music Integration.

---

## 📑 Indice
1. [🌟 LaunchMe: Scheda di Reverse Engineering & Architettura](#1-launchme-scheda-di-reverse-engineering--architettura)
   - 1.1 Posizionamento di Mercato e Vision
   - 1.2 I 7 Sottosistemi Architetturali Chiave
   - 1.3 Parametri Configurabili e Dimensioni UI
2. [📜 Storico Integrale Changelog (Tutte le 36 Versioni Ufficiali)](#2-storico-integrale-changelog)
3. [⚠️ Analisi dei Bug Critici e Lezioni di Sviluppo](#3-analisi-dei-bug-critici-e-lezioni-di-sviluppo)
4. [🚀 Roadmap di Ispirazione per JLauncherOS](#4-roadmap-di-ispirazione-per-jlauncheros)

---

## 1. 🌟 LaunchMe: Scheda di Reverse Engineering & Architettura

LaunchMe si posiziona come *"The Launchpad replacement macOS deserves"*. A differenza dei launcher a barra minimalista (Spotlight o Alfred), LaunchMe adotta un'interfaccia a schermo intero altamente immersiva che fonde il concetto di Launchpad con widget attivi, integrazione del Notch hardware e controlli multimediali.

```
+-----------------------------------------------------------------------------------+
|  [Dynamic Notch Island]                                                           |
|  * Compact/Large Mode | AirDrop & Pocket Shelf | Pomodoro Countdown | Clipboard   |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Live / Dynamic Wallpaper / Liquid Glass Background (AVI / MP4 / MOV / GIF)]     |
|                                                                                   |
|  +-----------------------------------+  +--------------------------------------+  |
|  | Widgets Area:                     |  | Application Grid Area:               |  |
|  | - Music Player (Vinyl / Waves)    |  | - Customizable Grids (3x5 up to 5x8) |  |
|  | - Weather (9 styles)              |  | - Drag & Drop Categories / Folders   |  |
|  | - Clock (11 styles)               |  | - Custom Icons & Clear Colored Mode  |  |
|  | - Pomodoro Timer with Audio       |  | - Shift-Select Batch Actions         |  |
|  +-----------------------------------+  +--------------------------------------+  |
|                                                                                   |
|  [Search Bar + Calculator + Emoji Picker + Fast File Access]                      |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 1.2 I 7 Sottosistemi Architetturali Chiave

#### 1. Dynamic Notch & Island Drawer (macOS Hardware Integration)
- **Modalità Compact & Large:** Mostra widget meteo, brano in riproduzione o timer direttamente nel Notch dei MacBook.
- **Pocket Shelf & AirDrop:** Zona di drop ancorata al Notch dove trascinare file per mantenerli a portata di mano o inviarli via AirDrop.
- **Notch Clipboard:** Storico degli appunti integrato con card visuali e anteprima degli screenshot catturati.
- **Timer / Pomodoro:** Conto alla rovescia con menu di suoni di avviso selezionabili nelle impostazioni del Notch.

#### 2. Liquid Glass & Vibrancy Rendering Engine
- **Sincronizzazione di Sistema:** L'effetto "Liquid Glass" adatta automaticamente intensità e sfocatura (blur) al tema di sistema macOS (Light/Dark/Tinted).
- **Clear Mode:** Modalità ultra-trasparente per le icone e i background delle cartelle.
- **Supporto Live Wallpaper:** Rendering di sfondi video animati nei formati `AVI`, `MP4`, `MOV`, `MKV` e supporto completo per widget animati in formato `GIF`.

#### 3. Music Player & Visualizers (Spotify & Apple Music)
- **Integrazione Dual Player:** Supporta sia Apple Music che Spotify con lettura e sincronizzazione delle cover ad alta risoluzione (supporto alle cover animate per Spotify e Apple Music in Full Cover).
- **Stili del Player:**
  - *Vinyl Style (con variante Waves)*: Disco in vinile con animazione di rotazione e braccio della testina.
  - *Full Screen Art*: Artwork dell'album a tutto schermo con background sfocato sincronizzato.
  - *Particles Visualizer*: Particelle fluttuanti reattive.
  - *Glowing Beats*: Effetti di luminescenza ritmica.
  - *Vertical Music Player*: Layout verticale ottimizzato per widget laterali.
- **Timeline Scrubbing Sicuro:** Barra di avanzamento interattiva senza attivare in primo piano l'app musicale (risolto in v2.08.0).

#### 4. Grid System & App Organization
- **Layout Griglia Flessibile:** Scelta rapida tra formati $3	imes 5$, $3	imes 6$, $3	imes 7$, $3	imes 8$, $4	imes 5$, $4	imes 8$, fino a $5	imes 8$.
- **Batch Selection con Shift:** Possibilità di selezionare più applicazioni tenendo premuto `Shift` per raggrupparle istantaneamente in una nuova cartella.
- **Ordinamento A-Z:** Ordinamento alfabetico automatico con un click all'interno delle cartelle.
- **Personalizzazione Icone:** Sostituzione delle icone per singola app e anteprima custom nelle cartelle.
- **Uninstaller Pulito:** Disinstallazione completa delle app con rilevamento e cancellazione di cache e file residui in `~/Library`.

#### 5. Trackpad Gestures & Window Level
- **Invocazione Naturale:** Pinch a 3, 4 o 5 dita per aprire l'overlay di LaunchMe (simile al vecchio gesto di Launchpad).
- **Spread Gesture:** Allargamento delle dita per chiudere istantaneamente l'app.
- **Overlay Sopra App Fullscreen:** La finestra vive al livello `NSFloatingWindowLevel` con flag `canJoinAllSpaces` e `fullScreenAuxiliary`, permettendo l'apertura immediata anche sopra applicazioni che occupano uno Space a pieno schermo.

#### 6. Spaces & Themes (.launchmespaces)
- **Presets per Scenari di Lavoro:** Organizzazione delle app in base al contesto (es. *Lavoro, Design, Studio, Gaming*).
- **Esportazione & Condivisione Temi:** Salvataggio di interi "Spaces" con sfondi, impostazioni e icone in file `.launchmespaces` installabili con doppio click.

#### 7. Motore di Ricerca & Utility Rapide
- **Ricerca File & App:** Apertura rapida, copia e preview con Quick Look.
- **Calcolatrice Integrata:** Valutazione espressioni matematiche inline nel campo di ricerca.
- **Selettore Emoji & Simboli:** Accesso rapido nativo dalla search bar.

---

## 2. 📜 Storico Integrale Changelog

> Estratto fedelmente da `https://launchmeapp.com/changelog/`

### LaunchMe 2.08.2 — *October 27, 2026*

#### New Features
- Added Waves, a new Vinyl style for the full-screen music player.

#### Bug Fixes and Optimizations
- Fixed importing custom icons in Spaces and switching between Spaces.
- Fixed the “No network” error during login.

---

### LaunchMe 2.08.1 — *October 25, 2026*

#### Bug Fixes and Optimizations
- Improved custom icon support.
- Fixed GIF widgets.
- Fixed using GIFs as backgrounds for all widgets.
- Fixed custom icons in folder previews.
- Other improvements and fixes.

---

### LaunchMe 2.08.0 — *October 20, 2026*

#### New Features
- Liquid Glass Intensive synced to system settings for all glass effect in the app for macOS27
- Pomodoro widget in Notch
- Liquid glass Tint intensive settings for all glass elements, included folders background in Appearance settings
- Categories card glass background settings
- Folder layout settings. Added options 3x5 - 3x8, 4x5 - 4x8, 5x5 - 5x8 grid options. Right click in folder to choose or in Settings Panel - General
- Added sound for timer and list of timer sounds in Notch Settings
- Change Notch widget size from context menu Compact / Large
- Select many apps with Shift to create folder with selected apps
- Added sorting apps A-Z inside a folder

#### Bug Fixes and Optimizations
- Fixed button animation in macOS 27
- Clipboard optimization in Search Bar
- Liquid Glass fix for macOS 27
- Removed search bar and burger button from full screen music mode
- Fixed Always On bugs
- Some bug fixes and optimizations for macOS 27
- Fixed when Music Widget might open the app when you trying to change song time on timeline

---

### LaunchMe 2.07.0 — *October 17, 2026*

#### New Features
- New Always On feature.
- Particles visual in the full-screen music player.
- New Spaces panel, accessible from the menu. Install LaunchMe Spaces in the app with one click.
- New vertical music player style.

#### Bug Fixes and Optimizations
- Updated menu: icon size slider and Snow moved to the Settings panel.
- Updated animations for the menu and search field.
- Optimized the full-screen music player and widgets.
- Small interface improvements.

---

### LaunchMe 2.006.0 — *October 3, 2026*

#### New Features
- Added Glowing Beats to the full-screen music player.
- Added Music Art Wallpaper in Appearance settings.
- Added screenshots to the Notch Clipboard.

---

### LaunchMe 2.005.1 — *September 28, 2026*

#### Bug Fixes and Optimizations
- Fixed missing translations for some languages.
- Optimized the Notch Clipboard.
- Optimized the Vinyl full-screen music player.

---

### LaunchMe 2.005.0 — *September 14, 2026*

#### New Features
- Added Spaces Themes. Export Spaces with their settings and wallpaper to share them, or download LaunchMe Spaces Themes from the website and install them in one click.
- Added Vinyl mode to the full-screen music player.

---

### LaunchMe 2.004.0 — *September 13, 2026*

#### New Features
- Added Spaces Themes. Export Spaces with their settings and wallpaper to share them, or download LaunchMe Spaces Themes from the website and install them in one click.

#### Bug Fixes and Optimizations
- Bug fixes and small improvements.

---

### LaunchMe 2.003.3 — *September 4, 2026*

#### New Features
- Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid. Spotify supports animated artwork.

#### Bug Fixes and Optimizations
- Bug fixes and small improvements.

---

### LaunchMe 2.003.2 — *August 28, 2026*

#### New Features
- Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid. Spotify supports animated artwork.

---

### LaunchMe 2.003.1 — *August 26, 2026*

#### New Features
- Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid. Spotify supports animated artwork.

---

### LaunchMe 2.003.0 — *August 26, 2026*

#### New Features
- Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid.

---

### LaunchMe 2.002.5 — *August 12, 2026*

#### Bug Fixes and Optimizations
- Authorization improvements and fixes.

---

### LaunchMe 2.002.4 — *July 21, 2026*

#### Bug Fixes and Optimizations
- Notch improvements and fixes.

---

### LaunchMe 2.002.3 — *July 15, 2026*

#### Bug Fixes and Optimizations
- General improvements and fixes.

---

### LaunchMe 2.002.2 — *July 9, 2026*

#### New Features
- Added a Clock widget with 11 styles.
- Updated the Calendar widget, with more updates coming soon.

#### Bug Fixes and Optimizations
- Optimized and improved page animations.
- Fixed hidden apps in Spaces reappearing after a restart.

---

### LaunchMe 2.002.1 — *July 9, 2026*

#### New Features
- Added a Clock widget with 11 styles.
- Updated the Calendar widget, with more updates coming soon.

#### Bug Fixes and Optimizations
- Optimized and improved page animations.
- Fixed hidden apps in Spaces reappearing after a restart.

---

### LaunchMe 2.002.0 — *July 9, 2026*

#### New Features
- Added a Clock widget with 11 styles.
- Updated the Calendar widget, with more updates coming soon.

#### Bug Fixes and Optimizations
- Optimized and improved page animations.
- Fixed hidden apps in Spaces reappearing after a restart.

---

### LaunchMe 2.001.1 — *July 6, 2026*

#### New Features
- Added Notch with widgets, Clipboard, AirDrop, Pocket, Timer, Spaces sync, apps, folders, and more.
- Added Apple Music animated artwork in Full Cover style for all Music widget sizes in the Notch and main grid.
- Added a finger-spread gesture for closing LaunchMe.

#### Bug Fixes and Optimizations
- Fixed excessive CPU and power usage by the Music widget.
- Fixed hidden apps becoming visible again after restarting the Mac and in other cases.
- Fixed the gesture sometimes not working after sleep until it was turned off and on again.
- Optimized Spaces in the Notch.

---

### LaunchMe 2.001.0 — *July 5, 2026*

#### New Features
- Added Notch with widgets, Clipboard, AirDrop, Pocket, Timer, Spaces sync, apps, folders, and more.
- Added Apple Music animated artwork in Full Cover style for all Music widget sizes in the Notch and main grid.
- Added a finger-spread gesture for closing LaunchMe.

#### Bug Fixes and Optimizations
- Fixed excessive CPU and power usage by the Music widget.
- Fixed hidden apps becoming visible again after restarting the Mac and in other cases.
- Fixed the gesture sometimes not working after sleep until it was turned off and on again.

---

### LaunchMe 1.118.5 — *June 25, 2026*

#### New Features
- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.
- Added an option to open LaunchMe over full-screen apps.
- Added automatic folder grouping and Launchpad layout restoration under the sort button.
- Added app uninstalling, including cache and leftover files.
- Added a right-click menu on empty space for quick access to Settings, Wallpaper, and Widgets.
- Added a choice of three-, four-, or five-finger pinch for gesture invocation.

#### Bug Fixes and Optimizations
- Fixed smooth page scrolling with the mouse wheel.

---

### LaunchMe 1.118.4 — *June 22, 2026*

#### New Features
- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.
- Added an option to open LaunchMe over full-screen apps.
- Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.
- Added automatic folder grouping and Launchpad layout restoration under the sort button.

#### Bug Fixes and Optimizations
- Fixed the hotkey and added an option to disable it.
- Optimized the cache. The app might be slower once while the old cache is cleaned.

---

### LaunchMe 1.118.3 — *June 20, 2026*

#### New Features
- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.
- Added an option to open LaunchMe over full-screen apps.
- Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.

#### Bug Fixes and Optimizations
- Fixed the hotkey and added an option to disable it.
- Optimized the cache. The app might be slower once while the old cache is cleaned.

---

### LaunchMe 1.118.2 — *June 20, 2026*

#### New Features
- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.
- Added an option to open LaunchMe over full-screen apps.
- Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.

#### Bug Fixes and Optimizations
- Fixed the hotkey and added an option to disable it.
- Optimized the cache. The app might be slower once while the old cache is cleaned.

---

### LaunchMe 1.118.1 — *June 19, 2026*

#### New Features
- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.
- Added an option to open LaunchMe over full-screen apps.
- Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.

---

### LaunchMe 1.118.0 — *June 18, 2026*

#### New Features
- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.

---

### LaunchMe 1.117.3 — *June 16, 2026*

#### New Features
- Added Gesture Invoke in Settings.

#### Bug Fixes and Optimizations
- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

---

### LaunchMe 1.117.2 — *June 16, 2026*

#### New Features
- Added Gesture Invoke in Settings.

#### Bug Fixes and Optimizations
- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

---

### LaunchMe 1.117.1 — *June 15, 2026*

#### New Features
- Added Gesture Invoke in Settings.

#### Bug Fixes and Optimizations
- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

---

### LaunchMe 1.117.0 — *June 15, 2026*

#### New Features
- Added Gesture Invoke in Settings.

#### Bug Fixes and Optimizations
- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

---

### LaunchMe 1.116.0 — *June 15, 2026*

#### Bug Fixes and Optimizations
- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

---

### LaunchMe 1.115.0 — *June 12, 2026*

#### New Features
- Added Liquid Glass color customization and Clear mode.
- Added Emoji & Symbols to the search bar.
- Added the ability to unhide hidden apps.

---

### LaunchMe 1.114.0 — *June 10, 2026*

#### New Features
- Added Liquid Glass color customization and Clear mode.

---

### LaunchMe 1.113.0 — *June 8, 2026*

#### New Features
- Added the ability to rename apps.

---

### LaunchMe 1.112.9 — *May 28, 2026*

#### Bug Fixes and Optimizations
- Small updates and improvements.

---

### LaunchMe 1.112.8 — *May 28, 2026*

#### Bug Fixes and Optimizations
- Small bug fixes and improvements.

---



---

## 3. ⚠️ Analisi dei Bug Critici e Lezioni di Sviluppo

Dall'analisi delle versioni e dei relativi fix emergono sfide architetturali fondamentali che **JLauncherOS** deve gestire fin dal day-one:

1. **Gestione CPU del Music Widget (Fix LaunchMe v2.001.1):**
   - *Problema:* Il widget musicale consumava eccessiva CPU e batteria a causa di chiamate di polling continue via AppleScript.
   - *Soluzione JLauncherOS:* Utilizzare i listener asincroni nativi di macOS `NSDistributedNotificationCenter` per ricevere eventi di cambio traccia a costo zero di CPU (`com.apple.Music.playerInfo` e `com.spotify.client.PlaybackStateChanged`).
2. **Perdita delle Gesture dopo lo Standby/Sleep (Fix LaunchMe v2.001.1):**
   - *Problema:* Il listener dei gesti multitouch smetteva di funzionare dopo la sospensione del Mac finché non veniva riavviato manualmente.
   - *Soluzione JLauncherOS:* Ascoltare le notifiche di `NSWorkspaceDidWakeNotification` per reinizializzare automaticamente il tap/hook su `MultitouchSupport`.
3. **Persistenza delle App Nascoste negli Spaces (Fix LaunchMe v2.002.0 – v2.002.2):**
   - *Problema:* Le app contrassegnate come "nascoste" ricomparivano dopo il riavvio del Mac.
   - *Soluzione JLauncherOS:* Persistenza atomica su SQLite/JSON (`~/.config/jlauncher/spaces.json`) con verifica dell'ID bundle (`CFBundleIdentifier`) anziché del semplice nome dell'eseguibile.
4. **Scrubbing Timeline vs Modal Window Trap (Fix LaunchMe v2.08.0):**
   - *Problema:* Cliccare sulla timeline per cambiare punto del brano provocava l'apertura e il focus in primo piano dell'app Spotify o Apple Music, facendo chiudere l'overlay del launcher.
   - *Soluzione JLauncherOS:* Inviare comandi di seek silenziosi tramite AppleScript senza attivare l'app in foreground (`set player position to X`).
5. **Fluidità con Oltre 200 Applicazioni (Fix LaunchMe v1.116.0 – v1.117.3):**
   - *Problema:* Rallentamenti nell'apertura e nelle animazioni quando il catalogo superava le 200 app.
   - *Soluzione JLauncherOS:* Virtualizzazione della griglia (Windowing virtuale con React/Tauri), caricamento asincrono delle icone con cache disco e texture Atlas GPU.

---

## 4. 🚀 Roadmap di Ispirazione per JLauncherOS

| Caratteristica LaunchMe | Come Implementarla in JLauncherOS | Differenziatore di JLauncherOS (JARVIS Powered) |
| :--- | :--- | :--- |
| **Dynamic Notch Drawer** | Finestra Tauri/Cocoa invisibile ancorata allo screen notch | Non solo file e meteo: il Notch ospita lo **stato dei subagenti AI**, notifiche JARVIS e comandi rapidi vocali |
| **Liquid Glass Styling** | Tailwind CSS + Backdrop-filter Blur + NSVisualEffectView | Integrazione con gli stili tematici di JARVIS Mark VII (HUD cyberpunk, vetro frosted, dark titanium) |
| **Trackpad Gesture Invoke** | Daemon Rust/PyObjC per cattura eventi multitouch 3/4-finger pinch | Doppio trigger: Gesture multitouch per launcher visivo + Hotkey globale rapida (`⌥ Space`) per prompt AI |
| **Pocket Drag & Drop** | Area di drop che riceve `NSFilenamesPboardType` | Il file trascinato nel Pocket può essere passato direttamente ad un prompt AI con un click (es. "Riassumi questo PDF") |
| **Vinyl Music Mode** | Canvas HTML5 / Three.js con rotazione a 33 RPM e onde audio | Visualizzatore audio audio-reattivo tramite Web Audio API collegato alle cuffie o agli speaker del Mac |
| **Spaces Themes** | Schemi JSON per layout griglia, icone e sfondi | I temi e gli spazi possono attivarsi automaticamente in base allo stato di focus JARVIS (`DEEP_WORK`, `STUDY`, `ENTERTAINMENT`) |

---
*Specifiche architetturali e changelog estratti per il team di ingegneria di JLauncherOS.*
