import urllib.request
import re
import html
import os
from html.parser import HTMLParser

class AlfredParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.output = []
        self.list_depth = 0
        self.tag_stack = []
        
    def handle_starttag(self, tag, attrs):
        self.tag_stack.append(tag)
        if tag in ['h2', 'h3', 'h4']:
            level = int(tag[1]) + 1
            self.output.append(f'\n\n{"#" * level} ')
        elif tag == 'ul':
            self.list_depth += 1
        elif tag == 'li':
            indent = '  ' * (self.list_depth - 1)
            self.output.append(f'\n{indent}- ')
        elif tag == 'p':
            self.output.append('\n\n')
        elif tag == 'br':
            self.output.append('\n')

    def handle_endtag(self, tag):
        if self.tag_stack and self.tag_stack[-1] == tag:
            self.tag_stack.pop()
        if tag in ['h2', 'h3', 'h4']:
            self.output.append('\n')
        elif tag == 'ul':
            self.list_depth = max(0, self.list_depth - 1)
        elif tag == 'p':
            self.output.append('\n')

    def handle_data(self, data):
        text = html.unescape(data).replace('\r', ' ')
        if not text.strip():
            if self.tag_stack and any(t in ['h2', 'h3', 'h4', 'em', 'span', 'a'] for t in self.tag_stack):
                self.output.append(' ')
            return
        if self.tag_stack and any(t in ['h2', 'h3', 'h4'] for t in self.tag_stack):
            self.output.append(text.strip() + ' ')
        else:
            self.output.append(re.sub(r'\s+', ' ', text))

def parse_alfred_page(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
    raw_html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    first_h2 = raw_html.find('<h2>')
    footer = raw_html.find('id="footer"')
    if footer == -1: footer = raw_html.find('<footer')
    if footer == -1: footer = raw_html.rfind('</ul>') + 5
    content = raw_html[first_h2:footer]
    parser = AlfredParser()
    parser.feed(content)
    md = ''.join(parser.output)
    md = re.sub(r'[ \t]+(?=\n)', '', md)
    md = re.sub(r'\n{3,}', '\n\n', md)
    return md.strip()

print("Fetching Alfred changelogs...")
alfred_5 = parse_alfred_page('https://www.alfredapp.com/changelog/')
alfred_4 = parse_alfred_page('https://www.alfredapp.com/changelog/v4/')
alfred_3 = parse_alfred_page('https://www.alfredapp.com/changelog/v3/')
alfred_2 = parse_alfred_page('https://www.alfredapp.com/changelog/v2/')

launchme_raw = """October 27, 2026
2.08.2

New Features
* Added Waves, a new Vinyl style for the full-screen music player.

Bug Fixes and Optimizations
* Fixed importing custom icons in Spaces and switching between Spaces.
* Fixed the “No network” error during login.

October 25, 2026
2.08.1

Bug Fixes and Optimizations
* Improved custom icon support.
* Fixed GIF widgets.
* Fixed using GIFs as backgrounds for all widgets.
* Fixed custom icons in folder previews.
* Other improvements and fixes.

October 20, 2026
2.08.0

New Features
* Liquid Glass Intensive synced to system settings for all glass effect in the app for macOS27
* Pomodoro widget in Notch
* Liquid glass Tint intensive settings for all glass elements, included folders background in Appearance settings
* Categories card glass background settings
* Folder layout settings. Added options 3x5 - 3x8, 4x5 - 4x8, 5x5 - 5x8 grid options. Right click in folder to choose or in Settings Panel - General
* Added sound for timer and list of timer sounds in Notch Settings
* Change Notch widget size from context menu Compact / Large
* Select many apps with Shift to create folder with selected apps
* Added sorting apps A-Z inside a folder

Bug Fixes and Optimizations
* Fixed button animation in macOS 27
* Clipboard optimization in Search Bar
* Liquid Glass fix for macOS 27
* Removed search bar and burger button from full screen music mode
* Fixed Always On bugs
* Some bug fixes and optimizations for macOS 27
* Fixed when Music Widget might open the app when you trying to change song time on timeline

October 17, 2026
2.07.0

New Features
* New Always On feature.
* Particles visual in the full-screen music player.
* New Spaces panel, accessible from the menu. Install LaunchMe Spaces in the app with one click.
* New vertical music player style.

Bug Fixes and Optimizations
* Updated menu: icon size slider and Snow moved to the Settings panel.
* Updated animations for the menu and search field.
* Optimized the full-screen music player and widgets.
* Small interface improvements.

October 3, 2026
2.006.0

New Features
* Added Glowing Beats to the full-screen music player.
* Added Music Art Wallpaper in Appearance settings.
* Added screenshots to the Notch Clipboard.

September 28, 2026
2.005.1

Bug Fixes and Optimizations
* Fixed missing translations for some languages.
* Optimized the Notch Clipboard.
* Optimized the Vinyl full-screen music player.

September 14, 2026
2.005.0

New Features
* Added Spaces Themes. Export Spaces with their settings and wallpaper to share them, or download LaunchMe Spaces Themes from the website and install them in one click.
* Added Vinyl mode to the full-screen music player.

September 13, 2026
2.004.0

New Features
* Added Spaces Themes. Export Spaces with their settings and wallpaper to share them, or download LaunchMe Spaces Themes from the website and install them in one click.

Bug Fixes and Optimizations
* Bug fixes and small improvements.

September 4, 2026
2.003.3

New Features
* Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid. Spotify supports animated artwork.

Bug Fixes and Optimizations
* Bug fixes and small improvements.

August 28, 2026
2.003.2

New Features
* Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid. Spotify supports animated artwork.

August 26, 2026
2.003.1

New Features
* Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid. Spotify supports animated artwork.

August 26, 2026
2.003.0

New Features
* Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid.

August 12, 2026
2.002.5

Bug Fixes and Optimizations
* Authorization improvements and fixes.

July 21, 2026
2.002.4

Bug Fixes and Optimizations
* Notch improvements and fixes.

July 15, 2026
2.002.3

Bug Fixes and Optimizations
* General improvements and fixes.

July 9, 2026
2.002.2

New Features
* Added a Clock widget with 11 styles.
* Updated the Calendar widget, with more updates coming soon.

Bug Fixes and Optimizations
* Optimized and improved page animations.
* Fixed hidden apps in Spaces reappearing after a restart.

July 9, 2026
2.002.1

New Features
* Added a Clock widget with 11 styles.
* Updated the Calendar widget, with more updates coming soon.

Bug Fixes and Optimizations
* Optimized and improved page animations.
* Fixed hidden apps in Spaces reappearing after a restart.

July 9, 2026
2.002.0

New Features
* Added a Clock widget with 11 styles.
* Updated the Calendar widget, with more updates coming soon.

Bug Fixes and Optimizations
* Optimized and improved page animations.
* Fixed hidden apps in Spaces reappearing after a restart.

July 6, 2026
2.001.1

New Features
* Added Notch with widgets, Clipboard, AirDrop, Pocket, Timer, Spaces sync, apps, folders, and more.
* Added Apple Music animated artwork in Full Cover style for all Music widget sizes in the Notch and main grid.
* Added a finger-spread gesture for closing LaunchMe.

Bug Fixes and Optimizations
* Fixed excessive CPU and power usage by the Music widget.
* Fixed hidden apps becoming visible again after restarting the Mac and in other cases.
* Fixed the gesture sometimes not working after sleep until it was turned off and on again.
* Optimized Spaces in the Notch.

July 5, 2026
2.001.0

New Features
* Added Notch with widgets, Clipboard, AirDrop, Pocket, Timer, Spaces sync, apps, folders, and more.
* Added Apple Music animated artwork in Full Cover style for all Music widget sizes in the Notch and main grid.
* Added a finger-spread gesture for closing LaunchMe.

Bug Fixes and Optimizations
* Fixed excessive CPU and power usage by the Music widget.
* Fixed hidden apps becoming visible again after restarting the Mac and in other cases.
* Fixed the gesture sometimes not working after sleep until it was turned off and on again.

June 25, 2026
1.118.5

New Features
* Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
* Added a live Weather widget with nine styles.
* Made the Liquid Glass theme free.
* Added an option to open LaunchMe over full-screen apps.
* Added automatic folder grouping and Launchpad layout restoration under the sort button.
* Added app uninstalling, including cache and leftover files.
* Added a right-click menu on empty space for quick access to Settings, Wallpaper, and Widgets.
* Added a choice of three-, four-, or five-finger pinch for gesture invocation.

Bug Fixes and Optimizations
* Fixed smooth page scrolling with the mouse wheel.

June 22, 2026
1.118.4

New Features
* Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
* Added a live Weather widget with nine styles.
* Made the Liquid Glass theme free.
* Added an option to open LaunchMe over full-screen apps.
* Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.
* Added automatic folder grouping and Launchpad layout restoration under the sort button.

Bug Fixes and Optimizations
* Fixed the hotkey and added an option to disable it.
* Optimized the cache. The app might be slower once while the old cache is cleaned.

June 20, 2026
1.118.3

New Features
* Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
* Added a live Weather widget with nine styles.
* Made the Liquid Glass theme free.
* Added an option to open LaunchMe over full-screen apps.
* Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.

Bug Fixes and Optimizations
* Fixed the hotkey and added an option to disable it.
* Optimized the cache. The app might be slower once while the old cache is cleaned.

June 20, 2026
1.118.2

New Features
* Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
* Added a live Weather widget with nine styles.
* Made the Liquid Glass theme free.
* Added an option to open LaunchMe over full-screen apps.
* Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.

Bug Fixes and Optimizations
* Fixed the hotkey and added an option to disable it.
* Optimized the cache. The app might be slower once while the old cache is cleaned.

June 19, 2026
1.118.1

New Features
* Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
* Added a live Weather widget with nine styles.
* Made the Liquid Glass theme free.
* Added an option to open LaunchMe over full-screen apps.
* Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.

June 18, 2026
1.118.0

New Features
* Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
* Added a live Weather widget with nine styles.
* Made the Liquid Glass theme free.

June 16, 2026
1.117.3

New Features
* Added Gesture Invoke in Settings.

Bug Fixes and Optimizations
* Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

June 16, 2026
1.117.2

New Features
* Added Gesture Invoke in Settings.

Bug Fixes and Optimizations
* Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

June 15, 2026
1.117.1

New Features
* Added Gesture Invoke in Settings.

Bug Fixes and Optimizations
* Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

June 15, 2026
1.117.0

New Features
* Added Gesture Invoke in Settings.

Bug Fixes and Optimizations
* Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

June 15, 2026
1.116.0

Bug Fixes and Optimizations
* Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

June 12, 2026
1.115.0

New Features
* Added Liquid Glass color customization and Clear mode.
* Added Emoji & Symbols to the search bar.
* Added the ability to unhide hidden apps.

June 10, 2026
1.114.0

New Features
* Added Liquid Glass color customization and Clear mode.

June 8, 2026
1.113.0

New Features
* Added the ability to rename apps.

May 28, 2026
1.112.9

Bug Fixes and Optimizations
* Small updates and improvements.

May 28, 2026
1.112.8

Bug Fixes and Optimizations
* Small bug fixes and improvements."""

# Parse LaunchMe into structured entries
entries = []
pattern = r'([A-Za-z]+ \d{1,2}, \d{4})\s*\n+([0-9\.]+)\s*\n+(.*?)(?=(?:[A-Za-z]+ \d{1,2}, \d{4}\s*\n+[0-9\.]+)|\Z)'
for m in re.finditer(pattern, launchme_raw, re.DOTALL):
    date_str = m.group(1).strip()
    ver_str = m.group(2).strip()
    body_str = m.group(3).strip()
    entries.append((ver_str, date_str, body_str))

launchme_md_blocks = []
for ver, dt, body in entries:
    block = f"### LaunchMe {ver} ({dt})\n\n"
    # Format subheadings and lists cleanly
    lines = body.splitlines()
    for line in lines:
        l = line.strip()
        if not l:
            block += "\n"
        elif l.startswith("New Features"):
            block += f"#### {l}\n\n"
        elif l.startswith("Bug Fixes and Optimizations"):
            block += f"#### {l}\n\n"
        elif l.startswith("* "):
            block += f"- {l[2:]}\n"
        elif l.startswith("- "):
            block += f"- {l[2:]}\n"
        else:
            block += f"{l}\n"
    launchme_md_blocks.append(block.strip())

launchme_final_md = "\n\n".join(launchme_md_blocks)

full_document = f"""# 🚀 Launcher Benchmark & Feature Evolution Catalog: LaunchMe & AlfredApp (v2–v5)

> **Document Scope & Purpose:**
> Questo documento raccoglie in modo esaustivo, strutturato e cronologico l'intero storico di sviluppo, le funzionalità, i fix architetturali e i changelog di due punti di riferimento assoluti per macOS:
> 1. **LaunchMe** (v1.112.8 → v2.08.2, benchmark per Overlay visuale, Notch Island, Liquid Glass, Widget Multimediali e Gesture).
> 2. **AlfredApp** (v2 → v5, benchmark mondiale per produttività, indicizzazione file Spotlight/metadata, Workflow programmabili, Clipboard history, Snippets e universal actions).
> 
> **Destinazione d'uso per l'AI di Progettazione:**
> Analizzare i pattern di evoluzione del software, identificare feature chiave da integrare in **JLauncherOS**, prevenire pitfall architetturali (gestione CPU del widget musicale, ritardi nell'indicizzazione file su macOS recenti, gestione gestures su Trackpad, persistenza spazi/nascondi app) e definire la roadmap di prodotto.

---

## 📑 Indice dei Contenuti
1. [🧠 Executive Synthesis & Feature Taxonomy (Design Matrix)](#1-executive-synthesis--feature-taxonomy-design-matrix)
   - 1.1 Overlay, Window Management & Notch Integration
   - 1.2 Widget Ecosystem & Music Engine
   - 1.3 File Search, Metadata Indexing & System Integration (Alfred Model)
   - 1.4 Productivity: Clipboard History, Snippets & Workflows
   - 1.5 Performance, Caching & macOS API Compatibility
2. [🛸 Parte 1: LaunchMe — Storico Completo Changelog (v1.112.8 – v2.08.2)](#2-parte-1-launchme--storico-completo-changelog)
3. [🎩 Parte 2: AlfredApp — Storico Completo Changelog (v2, v3, v4, v5)](#3-parte-2-alfredapp--storico-completo-changelog)
   - 3.1 Alfred 5 (Modern Era, Automation Tasks, Workflow Palette, macOS Sequoia/Tahoe)
   - 3.2 Alfred 4 (Rich Text Snippets, Conditional Workflows, Catalina/Big Sur/Monterey/Ventura)
   - 3.3 Alfred 3 (Workflow Script Filters, Clipboard Images, Chaining, Sierra/High Sierra/Mojave)
   - 3.4 Alfred 2 (Introduzione Workflows, Quick Look, Yosemite/El Capitan)
4. [🛠️ Parte 3: JLauncherOS — Matrice di Ispirazione e Backlog Tecnico](#4-parte-3-jlauncheros--matrice-di-ispirazione-e-backlog-tecnico)

---

## 1. 🧠 Executive Synthesis & Feature Taxonomy (Design Matrix)

L'analisi combinata di LaunchMe e Alfred evidenzia due anime complementari che definiscono lo "stato dell'arte" dei launcher per macOS:
- **L'Anima Visiva ed Esperienziale (LaunchMe):** Concentrata su un'interfaccia a tutto schermo (overlay non modale sopra le app a pieno schermo), sfruttamento del Notch (Dynamic Island per Mac), estetica Liquid Glass (trasparenze con effetto blur dinamico sincronizzato con i temi di sistema), gestione a griglia delle applicazioni con drag & drop / raggruppamento cartelle e controlli multimediali interattivi (vinile, onde, particelle).
- **L'Anima Produttiva e Algoritmica (Alfred):** Concentrata sulla latenza ultra-bassa (sub-millisecondo), interrogazione diretta dei metadati macOS (`mdfind`/Spotlight Metadata Engine), workflow visuali a blocchi (trigger, filtri di script, azioni universali), buffer degli appunti con cronologia multimediale (testo, immagini, file), e integrazione chirurgica con le preferenze di sistema e i browser.

### Tabella Comparativa dei Pilastri Funzionali

| Pilastro Funzionale | Implementazione LaunchMe | Implementazione Alfred | Opportunità per JLauncherOS |
| :--- | :--- | :--- | :--- |
| **Window & Overlay** | Fullscreen HUD sopra full-screen apps, swipe gestures | Finestra fluttuante centrale rapida o barra compatta | Finestra ibrida: Floating Palette per comandi veloci + Fullscreen HUD espandibile per griglia/widget |
| **Notch / Island** | Widget Notch compatto/large, Shelf AirDrop, Pocket | Non presente (focus menu bar/hotkey) | **Dynamic Notch Drawer**: Shelf per file temporanei, status agenti AI, player musicale compatto |
| **Motore di Ricerca** | Ricerca app con filtri per categoria, emoji/simboli | Indicizzazione metadati file, fallback web, deep setting query | Ricerca locale unificata (App + File + Contatti + Comandi JARVIS / Script Shell) |
| **Widget Engine** | Orologio (11 stili), Meteo (9 stili), Pomodoro, GIF Widget | Script Filters dinamici, visualizzazione JSON a elenco | Widget modulari HTML/React con aggiornamento real-time via WebSocket/IPC |
| **Player Musicale** | Mini-player, Fullscreen Vinyl, Waves, Glowing Beats, cover animate | Mini Player con controllo iTunes/Music, ricerca libreria | Controllo unificato (Apple Music / Spotify) con visualizzatore audio audio-reactive in canvas/WebGL |
| **Clipboard Manager** | Clipboard integrata nel Notch con screenshot | Clipboard buffer persistente (testo, immagini, snippet con merge) | Clipboard intelligente con tagging AI, estrazione OCR e sincronizzazione note |
| **Automazione** | Raggruppamento automatico cartelle, uninstaller pulito | Workflows drag & drop, Script Filters (Python, Bash, Node, Swift) | Integrazione con JARVIS Core, trigger vocali/hotkey ed esecuzione tool nativi |
| **Trackpad Gestures** | Pinch a 3/4/5 dita per aprire, spread per chiudere | Hotkey globale (`⌘ Space` o combinazioni custom) | Supporto combinato: Gesture Multitouch trackpad + Hotkey globale configurabile |

---

## 2. 🛸 Parte 1: LaunchMe — Storico Completo Changelog

{launchme_final_md}

---

## 3. 🎩 Parte 2: AlfredApp — Storico Completo Changelog

### 3.1 Alfred 5 (Modern Era)

> Pagina ufficiale: `https://www.alfredapp.com/changelog/`

{alfred_5}

---

### 3.2 Alfred 4

> Pagina ufficiale: `https://www.alfredapp.com/changelog/v4/`

{alfred_4}

---

### 3.3 Alfred 3

> Pagina ufficiale: `https://www.alfredapp.com/changelog/v3/`

{alfred_3}

---

### 3.4 Alfred 2

> Pagina ufficiale: `https://www.alfredapp.com/changelog/v2/`

{alfred_2}

---

## 4. 🛠️ Parte 3: JLauncherOS — Matrice di Ispirazione e Backlog Tecnico

Basandosi sulle lezioni apprese dallo storico di LaunchMe e Alfred, ecco le raccomandazioni architetturali prioritarie per lo sviluppo di **JLauncherOS**:

### 1. Architettura Finestra & Display Overlay (Zero-Lag Display Engine)
- **Supporto Fullscreen Spaces (`NSWindowCollectionBehavior`):** Come dimostrato da LaunchMe (`1.118.5`) e Alfred 5 (`5.7.3`), il launcher deve configurare `NSWindowCollectionBehaviorCanJoinAllSpaces | NSWindowCollectionBehaviorFullScreenAuxiliary` per apparire istantaneamente sopra finestre a pieno schermo senza forzare lo switch del Desktop Space macOS.
- **Gesture Invocation (Pinch/Spread):** Implementare un listener a basso livello su `NSEvent addGlobalMonitorForEventsMatchingMask:` o libreria `MultitouchSupport.framework` per catturare pinch a 3/4/5 dita e spread per dismiss, con fallback sicuro quando il sistema rientra dallo sleep.

### 2. Notch Island & Pocket Dropper
- **Notch Pocket (Drag & Drop Buffer):** Ispirato al Notch di LaunchMe (`2.001.0`), creare una drop zone ancorata in cima allo schermo (o sotto la camera nei MacBook recenti) dove l'utente può trascinare file da usare al volo con prompt AI o inviare tramite AirDrop.
- **Notch Clipboard Drawer:** Buffer visivo degli appunti con anteprima immediata di screenshot e testo copiato, con scorciatoie rapide per l'incolla.

### 3. Media Player & Glassmorphism UI
- **Prevenzione CPU Spike (Bugfix LaunchMe `2.001.1`):** Non usare mai un polling aggressivo per interrogare Spotify/Apple Music. Usare le notifiche di sistema di macOS `DistributedNotificationCenter.defaultCenter.addObserver` (`com.apple.Music.playerInfo` e `com.spotify.client.PlaybackStateChanged`).
- **Scrubbing Timeline Non Invasivo:** Come risolto in LaunchMe `2.08.0`, il click o drag sulla barra temporale del player musicale non deve mai attivare/focalizzare l'applicazione nativa Music/Spotify, ma comunicare silenziosamente tramite AppleScript o ScriptingBridge.
- **Liquid Glass Blur Dinamico:** Utilizzare `NSVisualEffectView` con `NSVisualEffectBlendingModeBehindWindow` e sincronizzare intensità e tint con le impostazioni dell'utente.

### 4. Search & Metadata Indexing (Standard Alfred)
- **Pre-sorting dei Metadati (Alfred `5.7.2` & `3.8.3`):** Quando si eseguono query con `MDQuery` o `mdfind`, richiedere risultati pre-ordinati per data di ultima apertura (`kMDItemLastUsedDate`) per evitare blocchi dell'interfaccia su cataloghi con oltre 10.000 file.
- **Deep System Settings Matching (Alfred `5.7.1`):** Pre-processare i nomi dei pannelli di impostazione (es. trattini non-breaking come Wi-Fi) per garantire che la ricerca trovi subito le pagine di Impostazioni di Sistema su macOS Ventura, Sonoma, Sequoia e oltre.
- **Background Execution per Risultati (Alfred `2.8.9`):** Aprire file e cartelle in background (`NSWorkspaceLaunchOptions.withoutActivation`) per evitare dialog modali di sistema bloccanti.

---
*Documento generato e sincronizzato per il team di progettazione software JLauncherOS.*
"""

# Write to docs/LAUNCHER_BENCHMARK_CHANGELOGS.md
docs_path = os.path.abspath('docs/LAUNCHER_BENCHMARK_CHANGELOGS.md')
root_path = os.path.abspath('LAUNCHER_BENCHMARK_CHANGELOGS.md')

with open(docs_path, 'w', encoding='utf-8') as f:
    f.write(full_document)
print(f"Written: {docs_path} ({len(full_document)} characters)")

with open(root_path, 'w', encoding='utf-8') as f:
    f.write(full_document)
print(f"Written: {root_path} ({len(full_document)} characters)")
