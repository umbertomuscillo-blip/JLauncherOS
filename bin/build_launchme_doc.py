import urllib.request
import re
import html
import os
from html.parser import HTMLParser

url = 'https://launchmeapp.com/changelog/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
raw_html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

class ReleaseParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.releases = []
        self.cur_rel = None
        self.cur_section = None
        self.in_time = False
        self.in_h2 = False
        self.in_h3 = False
        self.in_li = False
        self.text_buf = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'article' and 'release' in attrs_dict.get('class', ''):
            self.cur_rel = {'id': attrs_dict.get('aria-labelledby', ''), 'date': '', 'version': '', 'sections': {}}
        elif tag == 'time':
            self.in_time = True
            self.text_buf = []
        elif tag == 'h2':
            self.in_h2 = True
            self.text_buf = []
        elif tag == 'h3':
            self.in_h3 = True
            self.text_buf = []
        elif tag == 'li':
            self.in_li = True
            self.text_buf = []

    def handle_endtag(self, tag):
        if tag == 'time':
            self.in_time = False
            if self.cur_rel:
                self.cur_rel['date'] = ''.join(self.text_buf).strip()
        elif tag == 'h2':
            self.in_h2 = False
            if self.cur_rel:
                self.cur_rel['version'] = ''.join(self.text_buf).strip()
        elif tag == 'h3':
            self.in_h3 = False
            self.cur_section = ''.join(self.text_buf).strip()
            if self.cur_rel and self.cur_section:
                if self.cur_section not in self.cur_rel['sections']:
                    self.cur_rel['sections'][self.cur_section] = []
        elif tag == 'li':
            self.in_li = False
            item_text = ''.join(self.text_buf).strip()
            if self.cur_rel and self.cur_section and item_text:
                self.cur_rel['sections'][self.cur_section].append(item_text)
        elif tag == 'article':
            if self.cur_rel:
                self.releases.append(self.cur_rel)
                self.cur_rel = None
                self.cur_section = None

    def handle_data(self, data):
        if self.in_time or self.in_h2 or self.in_h3 or self.in_li:
            self.text_buf.append(data)

parser = ReleaseParser()
parser.feed(raw_html)
print(f'Parsed {len(parser.releases)} releases from launchmeapp.com/changelog/')

# Build changelog markdown
changelog_md = ""
for r in parser.releases:
    ver = r['version']
    dt = r['date']
    changelog_md += f"### LaunchMe {ver} — *{dt}*\n\n"
    for sec_name, items in r['sections'].items():
        changelog_md += f"#### {sec_name}\n"
        for item in items:
            changelog_md += f"- {item}\n"
        changelog_md += "\n"
    changelog_md += "---\n\n"

doc_content = f"""# 🛸 LaunchMe (macOS): Specifiche Tecniche, Architettura e Storico Completo Changelog

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
- **Layout Griglia Flessibile:** Scelta rapida tra formati $3\times 5$, $3\times 6$, $3\times 7$, $3\times 8$, $4\times 5$, $4\times 8$, fino a $5\times 8$.
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

{changelog_md}

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
"""

docs_file = os.path.abspath('docs/LAUNCHME_CHANGELOG.md')
root_file = os.path.abspath('LAUNCHME_CHANGELOG.md')

with open(docs_file, 'w', encoding='utf-8') as f:
    f.write(doc_content)
print(f"Written: {docs_file} ({len(doc_content)} chars)")

with open(root_file, 'w', encoding='utf-8') as f:
    f.write(doc_content)
print(f"Written: {root_file} ({len(doc_content)} chars)")
