# 🚀 Launcher Benchmark & Feature Evolution Catalog: LaunchMe & AlfredApp (v2–v5)

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

### LaunchMe 2.08.2 (October 27, 2026)

#### New Features

- Added Waves, a new Vinyl style for the full-screen music player.

#### Bug Fixes and Optimizations

- Fixed importing custom icons in Spaces and switching between Spaces.
- Fixed the “No network” error during login.

### LaunchMe 2.08.1 (October 25, 2026)

#### Bug Fixes and Optimizations

- Improved custom icon support.
- Fixed GIF widgets.
- Fixed using GIFs as backgrounds for all widgets.
- Fixed custom icons in folder previews.
- Other improvements and fixes.

### LaunchMe 2.08.0 (October 20, 2026)

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

### LaunchMe 2.07.0 (October 17, 2026)

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

### LaunchMe 2.006.0 (October 3, 2026)

#### New Features

- Added Glowing Beats to the full-screen music player.
- Added Music Art Wallpaper in Appearance settings.
- Added screenshots to the Notch Clipboard.

### LaunchMe 2.005.1 (September 28, 2026)

#### Bug Fixes and Optimizations

- Fixed missing translations for some languages.
- Optimized the Notch Clipboard.
- Optimized the Vinyl full-screen music player.

### LaunchMe 2.005.0 (September 14, 2026)

#### New Features

- Added Spaces Themes. Export Spaces with their settings and wallpaper to share them, or download LaunchMe Spaces Themes from the website and install them in one click.
- Added Vinyl mode to the full-screen music player.

### LaunchMe 2.004.0 (September 13, 2026)

#### New Features

- Added Spaces Themes. Export Spaces with their settings and wallpaper to share them, or download LaunchMe Spaces Themes from the website and install them in one click.

#### Bug Fixes and Optimizations

- Bug fixes and small improvements.

### LaunchMe 2.003.3 (September 4, 2026)

#### New Features

- Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid. Spotify supports animated artwork.

#### Bug Fixes and Optimizations

- Bug fixes and small improvements.

### LaunchMe 2.003.2 (August 28, 2026)

#### New Features

- Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid. Spotify supports animated artwork.

### LaunchMe 2.003.1 (August 26, 2026)

#### New Features

- Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid. Spotify supports animated artwork.

### LaunchMe 2.003.0 (August 26, 2026)

#### New Features

- Added a full-screen music player with song artwork, accessible from the Music widget in the Notch or Grid.

### LaunchMe 2.002.5 (August 12, 2026)

#### Bug Fixes and Optimizations

- Authorization improvements and fixes.

### LaunchMe 2.002.4 (July 21, 2026)

#### Bug Fixes and Optimizations

- Notch improvements and fixes.

### LaunchMe 2.002.3 (July 15, 2026)

#### Bug Fixes and Optimizations

- General improvements and fixes.

### LaunchMe 2.002.2 (July 9, 2026)

#### New Features

- Added a Clock widget with 11 styles.
- Updated the Calendar widget, with more updates coming soon.

#### Bug Fixes and Optimizations

- Optimized and improved page animations.
- Fixed hidden apps in Spaces reappearing after a restart.

### LaunchMe 2.002.1 (July 9, 2026)

#### New Features

- Added a Clock widget with 11 styles.
- Updated the Calendar widget, with more updates coming soon.

#### Bug Fixes and Optimizations

- Optimized and improved page animations.
- Fixed hidden apps in Spaces reappearing after a restart.

### LaunchMe 2.002.0 (July 9, 2026)

#### New Features

- Added a Clock widget with 11 styles.
- Updated the Calendar widget, with more updates coming soon.

#### Bug Fixes and Optimizations

- Optimized and improved page animations.
- Fixed hidden apps in Spaces reappearing after a restart.

### LaunchMe 2.001.1 (July 6, 2026)

#### New Features

- Added Notch with widgets, Clipboard, AirDrop, Pocket, Timer, Spaces sync, apps, folders, and more.
- Added Apple Music animated artwork in Full Cover style for all Music widget sizes in the Notch and main grid.
- Added a finger-spread gesture for closing LaunchMe.

#### Bug Fixes and Optimizations

- Fixed excessive CPU and power usage by the Music widget.
- Fixed hidden apps becoming visible again after restarting the Mac and in other cases.
- Fixed the gesture sometimes not working after sleep until it was turned off and on again.
- Optimized Spaces in the Notch.

### LaunchMe 2.001.0 (July 5, 2026)

#### New Features

- Added Notch with widgets, Clipboard, AirDrop, Pocket, Timer, Spaces sync, apps, folders, and more.
- Added Apple Music animated artwork in Full Cover style for all Music widget sizes in the Notch and main grid.
- Added a finger-spread gesture for closing LaunchMe.

#### Bug Fixes and Optimizations

- Fixed excessive CPU and power usage by the Music widget.
- Fixed hidden apps becoming visible again after restarting the Mac and in other cases.
- Fixed the gesture sometimes not working after sleep until it was turned off and on again.

### LaunchMe 1.118.5 (June 25, 2026)

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

### LaunchMe 1.118.4 (June 22, 2026)

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

### LaunchMe 1.118.3 (June 20, 2026)

#### New Features

- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.
- Added an option to open LaunchMe over full-screen apps.
- Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.

#### Bug Fixes and Optimizations

- Fixed the hotkey and added an option to disable it.
- Optimized the cache. The app might be slower once while the old cache is cleaned.

### LaunchMe 1.118.2 (June 20, 2026)

#### New Features

- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.
- Added an option to open LaunchMe over full-screen apps.
- Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.

#### Bug Fixes and Optimizations

- Fixed the hotkey and added an option to disable it.
- Optimized the cache. The app might be slower once while the old cache is cleaned.

### LaunchMe 1.118.1 (June 19, 2026)

#### New Features

- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.
- Added an option to open LaunchMe over full-screen apps.
- Added Ukrainian, Vietnamese, Indonesian, Filipino, and Polish translations.

### LaunchMe 1.118.0 (June 18, 2026)

#### New Features

- Added a Music widget for controlling Spotify and Apple Music, with album artwork in three styles and background customization.
- Added a live Weather widget with nine styles.
- Made the Liquid Glass theme free.

### LaunchMe 1.117.3 (June 16, 2026)

#### New Features

- Added Gesture Invoke in Settings.

#### Bug Fixes and Optimizations

- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

### LaunchMe 1.117.2 (June 16, 2026)

#### New Features

- Added Gesture Invoke in Settings.

#### Bug Fixes and Optimizations

- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

### LaunchMe 1.117.1 (June 15, 2026)

#### New Features

- Added Gesture Invoke in Settings.

#### Bug Fixes and Optimizations

- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

### LaunchMe 1.117.0 (June 15, 2026)

#### New Features

- Added Gesture Invoke in Settings.

#### Bug Fixes and Optimizations

- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

### LaunchMe 1.116.0 (June 15, 2026)

#### Bug Fixes and Optimizations

- Improved performance and fixed bugs. LaunchMe now works and opens faster with more than 200 apps.

### LaunchMe 1.115.0 (June 12, 2026)

#### New Features

- Added Liquid Glass color customization and Clear mode.
- Added Emoji & Symbols to the search bar.
- Added the ability to unhide hidden apps.

### LaunchMe 1.114.0 (June 10, 2026)

#### New Features

- Added Liquid Glass color customization and Clear mode.

### LaunchMe 1.113.0 (June 8, 2026)

#### New Features

- Added the ability to rename apps.

### LaunchMe 1.112.9 (May 28, 2026)

#### Bug Fixes and Optimizations

- Small updates and improvements.

### LaunchMe 1.112.8 (May 28, 2026)

#### Bug Fixes and Optimizations

- Small bug fixes and improvements.

---

## 3. 🎩 Parte 2: AlfredApp — Storico Completo Changelog

### 3.1 Alfred 5 (Modern Era)

> Pagina ufficiale: `https://www.alfredapp.com/changelog/`

### Alfred 5.8.1

Build 2349, Thursday 24th September 2026

- Improved Light Mode support in updated "General" preferences
- Updated System Settings search to fix iCloud and General results on macOS 27
- Update Google Chrome bookmarks feature to correctly search all bookmarks

### Alfred 5.8

Build 2348, Friday 11th September 2026

- Minor optimisations and tweaks for macOS 27 Golden Gate
- Preparation for seamless transition to Alfred 6
- Tweak the "General" preferences to remove social bar

### Alfred 5.7.3

Build 2320, Wednesday 1st April 2026

- Add mitigation to macOS Tahoe window rending quirk when using multiple desktop spaces
- Update Xcode build environment

### Alfred 5.7.2

Build 2312, Tuesday 9th December 2025

- File Search fallback ranking overhaul
  - Files will now be requested from macOS in a pre-sorted order
  - This is due to changes in the underlying metadata index. If you find this affects performance, you can return to the previous behaviour in Alfred's Features > File Search > Search > Default Order
  - Changed default result limits to 40, 50, 75, 100 to work around sorting issue in default metadata query
- Add support for updated Recent Documents in Tahoe
- Update parsing of lists in Alfred's Markdown processor
- Contacts search now works with multiple first names
- Tweak help subtext regarding using metadata for Contacts search only being available in macOS 15 and earlier
- Allocate more space for text in onboarding outro screen
- Fix a spelling mistake in the File Search Troubleshooting

### Alfred 5.7.1

Build 2307, Monday 6th October 2025

- Tweak to overhauled macOS System Settings search
  - Bypass caching for custom configured prefPane metadata searches in the default results
  - Pre-process names to improve matching on (non-break) hyphenated terms such as Wi-Fi
  - Added missing terminology to certain setting names
  - Improved icons for certain settings
  - Added Passwords for macOS 13 and 14

### Alfred 5.7

Build 2302, Monday 15th September 2025

- Alfred 5.7 is ready for macOS 26 Tahoe
- Overhaul built-in macOS System Settings searching, you'll no longer need to use our workflow
- Added new macOS Settings proxy in Alfred Remote to be able to correctly launch settings in macOS 13+
- Added AppleScript option to reveal and open the details of a Workflow in Alfred's Preferences
- Fix out of bounds issue in Music Mini Player preventing returning to top level navigation
- Fix markdown parser to be less greedy for link text
- Fix CSV parsing from including a trailing quote when it's the final character in the csv file
- Fix logic for file icon type loading to be efficient with external volumes
- Add plist boolean to ensure correct behaviour of AutoFill one-time codes in macOS 26+
- Shhh... Added some framework preparation for some pretty stupendous future stuff

### Alfred 5.6.2

Build 2296, Monday 12th May 2025

- Add a description key for Music access when using Alfred's Music Mini Player
- Update subtext in Contacts preferences to remove legacy "Address Book" wording

### Alfred 5.6.1

Build 2294, Tuesday 6th May 2025

- Enable {var} and {const} placeholders in Fallback Search workflow object Title and Subtext fields
- Add additional timing information into file search troubleshooting
- Alfred now correctly reads the selected default result subtext via VoiceOver
- Fix showing the macOS accent colour in Alfred's default window for native popup menus etc
- Add mitigation for non-focusing window Drag and Drop bug in macOS 15.4

### Alfred 5.6

Build 2290, Monday 24th February 2025

#### Workflow Improvements and Fixes

- Added fn+Click shortcut in Workflow Editor to automatically align objects to the selected object
  - Added hint for this in Workflow Editor overlay
- Workflow variable placeholders now available in more places e.g.
  - Alfred 5.5 GUI Views alternative mod connection subtext
  - Universal Actions trigger name
  - File Actions trigger name
- When deleting a Workflow, add option on dialog to also remove the workflow's cache and data folders
  - Disabled by default, Alfred will remember the checkbox status
- Added option to sort the Workflow list by category in the Workflow Editor
- Improve workflow object debugging by displaying when processing of last stream object is complete, and the discarded argument at this point
- Fix (null) keyword string when configuring a Workflow subsequent Keyword Input in "keyword" inbound mode, and omitting a keyword in the configuration
  - Also show a warning message in the debugger of this misconfiguration
- Update Music Command Workflow object popup style to match System Command workflow object
- Correct prefocus the path field in the Reveal File in Finder Workflow object configuration
- Update Grid View buffer behaviour to better match default results
- Fix showing Workflow Bundle Id as orange if it contains unexpected characters
- Update the Dispatch Key Combo Workflow object config to use a number slider for the dispatch count
- Added new alfred_theme_window_width workflow script environment variable
- Remove the "All Workflow Objects" workflow object from the getting started menu, as the palette provides the same information
- Prevent double encoding of + when using %2B when calling a Workflow External Trigger via URL
  - The External Trigger Identifier configuration will now show as orange text when unsuitable characters are used
- Implement External Trigger Identifier conflict resolution logic within the Object Inbound Configuration sheet
- Add small message to Run Script and Script Filter Workflow object configurations hinting towards using the "with input as argv" mode
- Improve the layout and alignment of the components in the generated Workflow User configuration view
- Update "Subtitle" to "Subtext" in List Filter and Grid View Workflow object configurations
- Standardise the Input File field parsing behaviour in the Text View and Grid View Workflow UI Objects, and the External Script option of Run Script and Script Filter
  - These now all accept {var:} in the file input field
- Update any references of {var:} to {var:varname} for consistency throughout Alfred's Preferences
- Update script-based Workflow object configuration sheets "Create" button greyout behaviour when using External Scripts, now matching the Workflow UI object configuration
- Add missing keyboard navigation to Workflow UI configuration sheets
- Update the Remote Trigger Workflow object argument config to match the Hotkey Trigger
- Improve Script Filter JSON parsing, now skips unexpected item type

#### General Improvements and Fixes

- The shutdown and restart commands now correctly respect the macOS "Reopen windows when logging back in" setting found when manually shutting down or restarting your Mac
- It's now possible to copy the Alfred version number from the General and Update preferences
- Fix AirDrop capitalisation in Alfred's default results
- Improve accessibility of Alfred Preferences Workflow Gallery integration
- Update the Run NSAppleScript Remote action config message to match the Workflow object config message
- Update Subtitle to Subtext for consistency in Alfred's Remote Page configuration
- Remove the Alfred 5.5 banner from Alfred's preferences
- Remove historic Sonoma 14.0 rendering bug mitigations
- Instantiate spell checker on main thread to prevent rare hang when pasting define command immediately after startup
- Add tab autocomplete to calculations to resolve the answer into Alfred's input field
  - Works similar to appending = to a calculation
- Updated messaging in Clipboard Viewer when there are no snippets, or no clipboard history, giving better context
- Prevent rare crash if inserting a hanging high surrogate into Alfred's text input box programatically
- Tweak to Music Mini Player AppleScript in resetting the Alfred playlist before populating
- Update Application cache to strip /System/Volumes/Data/ from Application path when on an external drive
- Update internal search ? keyword to find the Large Type feature when typing "large type" with a space
- Added additional data in File Search troubleshooting

### Alfred 5.5.1

Build 2273, Friday 13th September 2024

#### macOS 15 Sequoia

- Alfred 5 officially supports macOS Sequoia
- Add macOS Sequoia Passwords app by default in Clipboard History

#### Workflow Improvements and Fixes

- Fix Workflow connection veto close correctly pasting when copying groups of objects
- Improve warnings for Number Slider configurable config when marker count is notable
- Fixed Grid View JSON Universal Action overrides, which also fixes correctly adding overridden items to the buffer
- Fix copying from Grid View when there is no search field visible
- Ignore empty paths passed into the Grid View workflow object
- When directly calling an input object with multiple keywords and Inbound Mode set to Keyword, use the first keyword
- Added a defaults write to change the font size of the workflow debugger ranged between 11 (default) and 24 (big)
  - defaults write com.runningwithcrayons.Alfred-Preferences workflows.debuggerFontSize [size]
- Fix issue to refresh a workflow's compound variable cache after updating environment variables via AppleScript
- Fix Script Filter not showing Universal Actions panel when JSON arg is empty, action is populated
  - Improve handling of missing arg in grid view when triggering Universal Actions
- Match Automation Task names non-sequentially in Workflow Palette search
- Tweak help subtext in various Workflow objects
- Tweak Workflow context popup menu to simplify some options
- Fix Workflow JSON Config editor to correctly show emoji characters in strings while retaining syntax highlighting
- Fix correctly following alternative connections configured as fn↩︎ in Workflow User Interface Views

#### General Improvements and Fixes

- Write localhash to prefs.json to aid in advanced workflow creation
- Updated Universal Actions file display name code to obtain display name immediately after rename
- Increase width of "Match Application's keywords in Default Results" checkbox in Application search options
- Modify Usage tab to bring "Copy Stats" button top the top level
- Fix Markdown Rendering of image widths when contained within a list
- Fix matching ?automation tasks with a trailing s to open Automation Task Options
- Update placeholder icons in theme editor to be more colourful
- Improve Terminal integration code, specifically for large inputs
- Update Twitter to X in default web search, while retaining 'twitter' as a secondary keyword

### Alfred 5.5

Build 2257, Monday 18th March 2024

This is a absolutely huge and significant update!

Visit https://www.alfredapp.com/whats-new/ to see what's new and get some great workflows!

#### New Workflow UI Components for rich interaction with Alfred

- Grid View: With the new Grid View object, show results image and file results in a satisfyingly visual layout!
  - Dynamically feed in a list of files from the previous workflow object or use JSON to script your input
  - Customise the column count and image aspect
  - Include an optional search field to filter the grid results
- Text View: A super flexible, editable Markdown and plain text view, expanding your Workflow abilities immensely. Take simple notes or create a fully interactive text editor!
  - Populate results from a workflow object, a script for dynamic results or a file source
  - Make the text selectable, or editable within Alfred, with optional continuous spell checking mode when editable
  - Parse the results as Markdown: Include images, links, code blocks, lists, headers and more within your Markdown content
  - Dynamically specify footer text and loading text, including hotkey modifier hints
- Image View: Browse images in a clean, automatically sized view within Alfred.
  - Preview a single image from Alfred's results
  - Preview multiple results with a pagination guide at the bottom and use the arrows to navigate
  - Stack the view, so it's easy to go back to Alfred results with Esc
  - ⌘O opens the current file in its default app
  - Use numbers ⌘0 to maximise the window and ⌘9 to Zoom to Fit
- PDF View: Browse your PDFs in Alfred
  - Select and copy text from the PDF
  - Change the page display via the right-click context menu to show a single page or double page side by side
  - Navigate through your PDF, and zoom in and out using hotkeys
  - Stack views on top of Alfred results to quickly go back to them with Esc

#### Universal Actions

- New "View in Alfred" Universal Action
  - Takes advantage of rich new views to quickly view images, Markdown, text, pdfs
  - use ⌘0 to dynamically enlarge the content viewer
  - Multi select images, view them in Alfred, then use ← or → to quickly switch between them
- Improve Workflow Universal Action integration
  - Fix resolution of variables in keywords when matching Keyword and Script Filter actions in Universal Actions view
  - New global option on canvas popup menu to toggle treating newly added Inputs and Script Filters as Universal Actions
- Update Recent Documents Universal Action to correctly load recents on macOS Sonoma
  - Additionally add to the recent documents list from Alfred's internal knowledge

#### More Workflow Improvements

- Workflow Editor now resolves keyword variables on input objects
  - Renders in italic to differentiate from fixed keywords
  - Globally disabled and enabled in canvas popup menu options
- On running a Workflow, show clickable macOS Notification when Automation Tasks are missing
  - Clicking the notification will open the "Update Automation Tasks" preferences sheet
- New Workflow JSON output key to cache script output for high performance
  - Includes loose reload mode to show expired results while loading new results
  - Cache is cleared for specific workflows on using 'reload workflow' AppleScript
- Added new "Unstack View" option to Hide Alfred workflow object
  - Allows for graceful unstacking of stackable views such as the new Image View
- Added new Number Slider to Workflow user configuration options
  - Configure for number range, visual markers and limiting markers (e.g. 10 steps)
  - Automatically switches min / max if configured incorrectly
- Correctly return an error when calling a Workflow External Trigger externally, and the workflow needs user configuration
- Fix word truncation in title bar of Workflow debugger
- Fix Workflow window veto close logic when using result mod overrides, to prevent default connection veto from being used
- Holding ⌥ on the Workflow Gallery menu in the Workflow Editor will now give a "Fix Tools" option to fix broken Homebrew / Xcode instances
- Tweak Text Field behaviour in Workflow User Configuration for consistent behaviour
- Fix sizing of generated Workflow user config to match the preview size
- Fix initial field focus in Show Alfred Workflow object configuration
- Allow Automation Task framework more control over workflow stream on task error

#### General Improvements

- Add "View in Alfred" as new default result modifier action in Advanced prefs, uses new rich views
- Overhaul the top level window / view framework to allow for the dynamic heights and widths of the new Workflow UI Components
  - Rewrite Alfred window location and sizing logic to better constrain to display height
- New custom Markdown renderer for Workflow "About" and Change Log
- Prevent text from slightly overflowing selection on right side of Alfred Window input fields in macOS 15+
- Accessibility
  - Updated Large Type window to work correctly with VoiceOver
  - Improved Dialog Conditional Workflow Object configuration VoiceOver
  - Fixed System Command preferences to better read components
  - Add new "?Add Default Search Scope" internal search
  - Add + button for search scopes in File Filter workflow object
  - Improve accessibility for Dispatch Key Combo object combo field
- Fix internal search to correctly return Workflow results when there is a manually edited invalid info.plist
- When deleting a workflow or snippet, the name is now shown in the confirmation dialog
- Update theme editor background to only show system backgrounds which are viewable
- Fix theme options position view from clipping tiny Alfred outside of the bounds

### Alfred 5.1.4

Build 2195, Wednesday 25th October 2023

- macOS Sonoma
  - Remove visual glitch mitigation and fixed window size option if using Sonoma 14.1 as FB13188204 is fixed
- Fix layout of initial Permission Request window, preventing truncated text on "Don't show again" checkbox
- Fix the File Action workflow trigger to strictly filter for the specified file types
  - You'll now only see the trigger in Universal Actions if all given files satisfy the specified file types
- Tweak Powerpack preferences tab layout for visual clarity
- Update Workflow framework to tweak behaviour of nil arguments converted to argument arrays differently to improve Automation Task behaviour
- Added alfred_workflow_description to the workflow constants to provide the Workflow's description
- Prevent unnecessary parameters from being saved in Workflow plist when they are no longer relevant
- Show current version in Update preferences when a new update is available
- Tweak wording for macOS metadata reindex button to "Rebuild macOS Metadata Index"
- Tweak Automation Tasks in workflow editor to prevent stacked event listeners

### Alfred 5.1.3

Build 2175, Monday 25th September 2023

- macOS Sonoma
  - Add certain temporary mitigations to a Sonoma visual glitch until workaround can be established, or Sonoma bug fixed (FB13188204)
  - If you're experiencing rendering bugs in Alfred's default results, enable the "Default Results Fixed Size" in Alfred's General preferences
- Add additional countries to "Where are you" for website localisation
- Default to google.com for Google searches, matching Safari's behaviour
  - More reliably logged in to Google account when using Google related searches
  - Added option in Alfred's General preferences to return to previous local domain behaviour
- Fix Workflow debugger crashing when attempting to post nil argument
- Update theme footer margin to be fixed at predictable 10px instead of using search field margin
- Using ⌘Esc within Alfred will now close Alfred regardless of stacked views
  - e.g. if you've navigated from the default results to the Universal Actions view, ⌘Esc will hide Alfred instead of taking you back to the default results
- Tweak Alfred window and view automatic sizing calculation to better constrain to short screen resolutions
- Fix internal URL scheme to open workflows by both Workflow UID, falling back on to Workflow Bundle ID
- Move Universal Actions "No matching actions" to footer for more consistency with FS Navigation
- Remove superfluous characters from end of "Loading volumes, please wait...ec" message
- Begin removal of Sonoma rendering bug mitigation code
- Update framework file picker to re-select file in popout Open dialog in e.g. User Config and File Picker

### Alfred 5.1.2

Build 2145, Wednesday 2nd August 2023

- macOS Sonoma tweaks
  - Tweak framework of file and app opening, fixing the opening of web pages saved as Web Apps
- The {snippet:...} placeholder is now processed in the Arg/Var, Large Type, and Write File Workflow objects
  - As these 3 objects operate in plain text, rich text snippets will be converted to plain text
  - Note: It's not recommended to use this placeholder if you intend to publish your workflows, as the snippet may not exist
- Add a new Script Type of /bin/zsh --no-rcs which gives a cleaner environment for running Workflows
  - This is the default script language for newly created Run Script and Script Filter objects
- Improve passive Gallery Workflow update checking
- Tweak and clarify wording on workflow message dialogs, e.g. Prefab dialog when no objects selected

### Alfred 5.1.1

Build 2138, Tuesday 30th May 2023

- Improve VoiceOver in default results for files with differing filename and Display Name
- Tweak Preferences Snippet table sizing to prevent ... truncation in header
- Tweak Alfred Preferences update message when unable to connect to CDN to download update
- Tweak help subtext in Workflow File Filter and File Action Trigger configuration
- Tweak Checkbox label description for clarity in Workflow Configuration Builder
- Add 'Resolve Dependencies' and 'Automation Task Options' to the ? keyword internal search
- Update Amazon search url to latest format, and include additional country localised domains
- Add installed Automation Task version into exported diagnostics
- Remove outdated Permissions Enabled example in Permissions helper sheet
- Clarified help text in Dispatch Key Combo Workflow object

### Alfred 5.1

Build 2134, Wednesday 26th April 2023

#### Workflows

- Automation Tasks
  - New Options sheet to configure and update tasks, available from Workflows > Alfred Gallery > Automation Task Options...
  - Improvements to the Automation Task updater framework, including option to automatically keep tasks up to date
  - Automation Tasks can now be added to the Workflow Palette
    - Enable in the Automation Task Options sheet
    - Once in the Palette, they can be searched and added to the workflow like native objects
  - Framework has been updated to better support internal overridable query input, giving more native experience
- Alfred Gallery Improvements
  - Updated Workflow Gallery icon hints in workflow list for clarity
  - When checking for Gallery Workflow updates, Alfred will now alter the workflow list filter to ensure workflows needing updates are visible
  - Added new option to sort workflow list by Gallery Updated which sorts by Gallery Updates > Gallery Workflows > Alphabetical
  - Avoid crash in Alfred Preferences' Gallery updater when cancelling the update during the initialisation
- Added new Expression Utility workflow object
  - Allows for easy variable and query expressions such as incrementing variables
- Updated Random Utility workflow object
  - Add new option to get random word from a newline separated string
- Updated Reveal File in Finder Action workflow object
  - Now correctly processes multiple passed-in paths, revealing all paths in Finder instead of only first path
- Accessibility Improvements
  - Overhauled VoiceOver of workflow object configuration sheets: List Filter, File Filter, Script Filter, Dictionary Filter, Running Apps Filter
  - Add + and - Buttons to the Hotkey Trigger Related Apps tab for improved Accessibility
- Improve Alfred Ubiquitous Search (? keyword) to include Workflow Configuration fields (by name or value), and environment variables
  - Search will also now match variable names used in input object keyword fields
  - Multiple keywords will also be matched if using the || modifier
- Updated Workflow Editor notification system, now made generic to allow for more than simple Alfred Gallery update notifications
  - Now shows Automation Tasks update available
  - Click to remove a visible notification
- Rename "User Configuration" to "Configuration Builder" in the workflow backend config, to better explain its purpose
- Strip irrelevant newlines from text fields in Workflow naming and export sheets when saving
- Remove automatic lowercasing of keywords fields in input objects on saving, allowing for case-sensitive variable names
- Tweak wording in Workflow Dependencies Management for clarity
- Fix incorrect component resizing when selecting "Reset to Defaults" in workflow configuration
- Fix text truncation when workflow configuration checkbox text is too long
- Tweak Script Filter config UI layout to better vertical align components
- System Command workflow object Eject All action updated to use Alfred's new eject framework
- Added option to reload workflow on popup in preferences workflow list, useful for when e.g. a symlinked workflow isn't automatically reloading on external edit
- Added new Alfred AppleScript command to reveal a Workflow via UID or Bundle Id, and optionally show the Workflow's User Configuration
- The Script Filter JSON action property now correctly overrides arg when adding a result to the buffer
- Update built-in Script Filter getting started workflow with improved descriptions and notes
- The Script Filter keyword is now set as environment alfred_workflow_keyword on running a script to complement || multiple keywords
- The Workflow Editor now writes a sorted history of selected workflow UIDs to history.json in Alfred's application support folder, ordered latest selected workflow first
- Prefabs with a single item now correctly open the workflow configuration when the option to "Show Configuration Sheet for Newly Added Objects" is selected
- Fix dragging Safari into Hotkey Trigger object configuration > Related Apps
- Gracefully truncate Workflow name and description in Workflow Editor header and Import sheet

#### Clipboard and Snippets

- Added the ability to QuickLook Alfred's Clipboard History
  - Select the item in the history and tap ⇧ or press ⌘Y
  - Works with text, images and single files
- Added new option to convert image data to PNG on pasting
  - Will result in smaller data output, but may result in loss of colour accuracy or compatibility
- Added ⌘O to directly open Files and URLs from the Clipboard History list
- The snippet's keyword is now shown in the default results when using the snip keyword
  - This can be disabled in Alfred's Snippet preferences
- Show correct default Snippet Collection icon when searching with ? keyword
- Update clipboard image import to use NSPasteboardTypeTIFF (public.tiff) in place of deprecated NSTIFFPboardType (NeXT TIFF v4.0 pasteboard type)

#### General

- Clarify the Powerpack activation UI, adding spacing and a title label
- Update Apple Maps search icon to match current version
- Update the 1Password feature preferences to link to the Alfred Gallery 1Password workflow
- Tweak file application cache to be more accommodating of alternative unicode spaces
- Change Alfred Preferences title bar error messages colour to system red to make it easier to see in dark mode
- Update build environment and targets
  - Significant code review and refinements, removing deprecated code, adding future-proofing
- Update mechanisms used for discovering ejectable volumes
  - Ejectable volumes are now discovered off of the main thread to avoid potential UI pauses
  - Eject and Eject All commands now have a placeholder result when loading mounted drives, or if no mounts exist to eject
  - Use new eject framework to discover removable drives to be used in the Copy to... / Move to... Universal Actions
- Removed deprecated Alfred 2 theme importing
- Migrate URL discovery and testing methods in Custom Web Search feature to update framework
- Markdown rendering improvements
  - Fix horizontal rule rendering in markdown when using macOS Ventura
  - Fix incorrect interpretation of URLs within brackets
  - Update URLs to use URL string when title is empty
- Fix 'bing' title to 'Bing' in default web searches, and updated to the latest Bing logo
- Update ebay default web search icon
- Rewrite keyword matching framework for higher performance and new features
  - Multiple keywords can now be specified in features and workflows by using the || separator
- Update auto-completion logic to only complete the keyword if the expected argument type is none
- Add back notes in the Contacts viewer using new authorised provisioning profile
- Tweak internal vector icon rendering to fix incorrect drop shadows, and increase performance
- Update the copied argument when using the ? keyword to prepend navigateto/ which makes for a valid URL scheme on Ventura
- Add additional settings keyword to show Alfred's Preferences

### Alfred 5.0.6

Build 2110, Tuesday 13th December 2022

- Alfred Gallery Early Access
  - Browse Workflows on our new Workflow Gallery at https://alfred.app/
    - Almost 100 workflows already added, and hundreds more already in review to be added over the Early Access period
  - Install workflows directly into Alfred using the "Install in Alfred" button in the gallery
  - Keep Gallery workflows updated to their latest versions from directly within Alfred's Preferences
  - Manage Homebrew dependencies for Gallery workflows automatically using the new Resolve Dependencies feature
- Overhauled the macOS Reindexing sheet and underlying framework
- Add Voice Over accessibility to Contacts Viewer
- Remove unused Show button from Alfred's macOS Notification
- It's now possible to hide individual default actions from the default view in the Workflow Editor when no Workflow is selected
  - Right-click in the view and select the action you would like to hide
- Improve AppleScript behaviour for updating and removing workflow configuration
  - Fixes bug where prefs.plist wouldn't be written under certain circumstances
- Replace out some legacy Workflow icons with updated icons
- Update Remote template icons to use updated Workflow icons
- Strip kbd tags in markdown interpretation
- Improve underlying view layout calculation of Workflow user configuration
- Clear the icon cache for a Workflow when updating or reinstalling the workflow
- Fix incorrectly caching Alfred theme when directly accessing feature views after a macOS dark mode toggle
- Added option to ignore Universal Clipboard file lists in the clipboard history

### Alfred 5.0.5

Build 2096, Thursday 3rd November 2022

- Date placeholder rollbacks and enhancements
  - Roll back 5.0.4 POSIX formatting fix, as this turned out to break language settings for formatted dates
  - Fix 24h custom date formatting with the following:
    - Add new {isodate:...}, {isotime:...} and {isodatetime} placeholders which fix locale to POSIX and conform to ISO 8601
    - Using {isodatetime} will give 24h fixed ISO 8601 format yyyy-MM-dd'T'HH:mm:ssZZZZZ
    - Updated template for sortable date time placeholder template to use iso formatting, to fix in 24h
    - Added new Date and Time ISO 8601 placeholder template

### Alfred 5.0.4

Build 2095, Tuesday 1st November 2022

- macOS Ventura Tweaks
  - Clean up search result subtext for apps in the Cryptexes folder
  - Pre-cache Safari's updated location
- Workflow Tweaks
  - Workflow user configuration values can now be set and removed via AppleScript
  - Add "Configure..." item on Workflow list popup menu, and clarify button text to "Configure Workflow..." in Workflow editor header
  - Add : label suffixes in Workflow user configuration back end items
  - Update placeholder dates to use POSIX fixed formatting for user defined formats
  - Fix List Filter object configuration sheet resizing
- Clean up the AppleScript dictionary definition descriptions
- Correctly open Aliased packages and apps from the File System Navigation
- Improvements to file search scoping and troubleshooting
  - Added additional options to the search scope Reset... button
    - Reset to Applications and Home - This enables Applications, disables Folders in Home, and adds ~ along with a few more relevant folders
    - Reset to Full Disk - This disables Applications and Folders in Home, and adds /
  - Improve home folder discovery when Folders in Home is selected, rejecting more potentially irrelevant folders
    - Alter home folder location detection, and add redundancy check
    - Default to adding ~ to scope if unable to detect home folders
  - File Search Troubleshooting
    - Add more details to the file readability step
    - Add 3 actual MDQuery searches for the file based on defined scope, home and all
    - Add progress indicator, as MDQuery may not return instantly

### Alfred 5.0.3

Build 2087, Tuesday 11th October 2022

- macOS Ventura Preparation
  - Update build environment
  - Update Alfred's build target version, and remove deprecated API calls
  - Remove legacy text rendering (some custom themes may need tweaks)
- Tweaks to Mini Player AppleScript to fix certain tracks from not playing
- Tweaks to labels and descriptions in Features preferences
- Workflow User Configuration updates
  - Add "Default Value" for Popup configuration item
  - Update File Picker to have user editable field which also accepts e.g. {var:}
  - Added a placeholder configuration field to the File Picker
- Performance tweaks to image caching
- Tweaks to background local IP lookup for the Alfred Remote preferences

### Alfred 5.0.2

Build 2073, Monday 29th August 2022

- Prepare for updated v5 Corporate Powerpack activation
- Hide folder's Icon file from navigation to match Finder behaviour
  - If required, this can be brought back using defaults write com.runningwithcrayons.Alfred fsShowFolderIconFiles 1
- Palette improvements
  - Favourited Workflow palette items are now prioritised above non-favourited items in the palette search
  - Add "Filter" to "Running Apps" object in palette for consistency
- Write File Workflow output object improvements
  - Add "Prepend" option to file writing
  - Add option to write relative file to workflow's cache folder
  - Improve accessibility descriptions and tabbing order
- Remove /System/Volumes/Data/ from path subtext for file searches (default search and custom workflow file filters)
- Warn in workflow User Configuration when there are duplicate Environment Variable keys
- Add "Open Editor Shortcuts Help" to Workflow canvas popup menu
  - Opens useful guide and cheatsheet for operating the canvas effectively using the keyboard
- Add ⇧⌥arrows shortcut to Workflow editor to match ⇧⌥click behaviour of connecting but not moving the selection
- Update Custom Search configuration test button to match encoding behaviour of resulting Custom Search
- Update {clipboard} placeholder to better conform to {placeholder:variation.modifiers}
  - {clipboard.lowercase} and {clipboard:2.lowercase} is now the recommended syntax
  - {clipboard:lowercase} still works for backwards compatibility
- Fix the help link on the Workflow Dialog Conditional object
- Improve URL syntax parsing for Workflow markdown
  - Now also makes plain URLs clickable
- Workflow Export dialog
  - Improve accessibility of fields and responder order
  - Tweak help subtext on Workflow export dialog
- Update Workflow Replace utility to pre-process newlines and tabs in RegEx replacement template

### Alfred 5.0.1

Build 2067, Wednesday 27th July 2022

- Improvements
  - Additions to Split Arg utility object
    - Added new "Discard empty items" option
    - Improved VoiceOver and keyboard navigation
  - Improve Automation Task Workflow debug output to show which task is being run
  - Workflow markdown interpretation now also accepts both star and plus for unordered lists
  - Update the Workflow Prefab icon to better visually differentiate it in the Palette search
  - Improve experience on creating scripts via the Workflow Run Script / Script Filter "Create File" button
    - When no file extension is given to the file name, open the file in the default text editor
  - Warn when there are duplicate variable names used between Environment Variables and User Configuration in the Workflow Configuration
  - Palette search now also matches when not using spaces, e.g. "openurl" will now show "Open URL" in the results
  - Workflow JSON overrides for certain objects improved
    - Debug utility now allows override of processing outputs, and clear debug text
    - Speak output now allows override of using VoiceOver
    - Split Arg now allows override of output mode
    - Browse in Alfred now allows override of sorting and stacking
- Minor fixes and tweaks
  - Clear workflow's constants cache on committing an edit to a workflow
  - Fix spelling in Workflow Prefab dialog 'cavnas' to 'canvas'
  - Fix spelling in Workflow Debug sheet 'do' to 'to'
  - Fix button text colour for Workflow Getting Started Follow-Along guide when using macOS Light Mode
  - Fix scrollbar behaviour in Workflow Configuration > User Configuration sheet when macOS scrollbars set to Always
  - Add a warning dialog at startup if user doesn't meet minimum macOS 10.14 requirement
  - Fix correctly saving object configuration when using Run Script or Script Filter set to "External Script" then selecting "Create File" button
  - Remove / from the {query} and {var} URL encoded character list to make encoding options more forgiving
  - Make additional tweaks to new URL encoding algorithm to better work with unicode
  - Update Share Usage link URLs in Alfred Preference's Usage tab to use newer twitter URLs
  - Fix scroll view content sizing in Configurable Config Text Area fields
  - Fix scrollbars on Workflow User Configuration and Automation Task sheets when scrollbars set to always
  - Tweak size of the Workflow Config backend shared "description" field to better vertically fit text
  - Update info and error label colours in Workflow Delay utility object config to be dark mode compatible
  - Fix sizing of Prefab and Favourite sections of the palette to properly fit text when no items are added

### Alfred 5.0

Build 2057, Wednesday 13th July 2022

#### Workflows

- Brand new Workflow Editor
  - Completely rewritten from the ground up to put accessibility and performance first
  - New palette for more efficient workflow creation
    - Drag and drop to add items to the canvas
    - Normal and compact mode, and easily expand and collapse sections
    - Favourites section to host your most used workflow objects
    - Preconfigured objects, or groups of objects, can be stored in the palette as Prefabs for faster workflow creation
  - New Workflow landing screen when no workflows are selected, with handy shortcuts
  - New Getting Started guide
    - Walks new users through the various aspects of workflow development
    - Interactive Getting Started section in the palette, with prefabs to drag and connect
  - New configurable "User Configuration" for workflows
    - Add simple user-facing preferences to your workflows, making them easier for users to install and set-up
    - Recognisable controls such as Text fields, check boxes, picker boxes and more
    - Option for required fields which are highlighted with orange
    - Assign variable names and default values to each item which are then available throughout your workflow
    - Configuration shown on importing or upgrading a workflow
    - Quickly access a workflow's configuration from within the editor using the Configure Workflow button, or ⌘,
  - Keyboard navigation around workflow objects
    - Use ⌘ arrows to select objects around the canvas
    - Use ⌘⌥ left / right to navigate along connection streams
    - Use ⌘⌥ up / down to navigate to connected siblings
    - When no objects are selected, arrow keys will navigate the scroll area (⇧ arrows for larger steps)
    - Improved view focusing progression during actions, making keyboard navigation more predictable
  - New Workflow object icons to clarify workflow development
  - Individual connections can now be disabled, allowing for easier workflow development and testing
  - Efficient automatic workflow object connection with the ⌥ key
    - When dragging items from the palette or using the palette search, hold ⌥ to automatically connect to selected items
    - Select an item, hold ⌥ and click items to chain connect the items in order
    - Select one or more items, hold ⇧⌥ and click items to connect items to the first selected items
  - When dragging a new connection to an empty space on the canvas, you can now scroll from the edges of the canvas to create more space
  - Improvements to snapping and sizing to allow for better horizontal alignment
  - Notes are now intrinsically rendered as part of the object, so they don't get rendered behind other objects
  - Improved connection path detection, including recognising clicking the alternative path indicator
  - Improved rendering quality when zooming a canvas
  - Added alignment options for selected objects, both horizontally and vertically centred or referenced around clicked object
  - New Inbound Configuration option to modify the incoming argument before it's used
    - Updated indicator on workflow object input in editor when argument is being modified
  - The workflow list is now resizable
  - Hotkey Trigger highlight colour now differentiates when sharing combo with disabled workflows
    - Related hotkeys on canvas popup menu also show when the related hotkey is within a disabled workflow
  - Contextual help for workflow objects can now be found in more places
  - It is now possible to edit a Workflow object note by double clicking it
  - The "About Workflow" now supports a subset of Markdown
    - Add pretty introductions and help to your workflows, including images from the workflow's folder
    - Currently supported: Headers, italic, bold, unordered lists, inline code, separator, local image, links
- New Workflow debugger
  - Debugger is now available at the top level of the Workflow preferences, without the need to select a workflow
- Created new Automations object category
  - Moved Music and System Commands into Automations
- Snippet Triggers can now optionally be shown in the Clipboard History / Snippets Viewer
  - This is a global option available within the Snippet Trigger object configuration
- External Trigger updated to optionally enable running of triggers via URL Scheme
  - Example shown in object configuration
- Updated Conditional Utility object
  - Added cases for evaluating boolean true and false
  - Added option to hide the "Else" fallback condition
- Script Filter
  - Added new skipknowledge boolean field to the top level JSON
    - Allows for fixed order result sets while maintaining result UIDs (for item re-selection on reload)
- Rename File utility to File Conditional to better represent its purpose
- Rename Split Arg to Vars to Split Arg and add option to output as a list of arguments instead of variables
  - Added convenient popup button for default delimiters e.g. comma, tab, new line
- Add new Run Shortcut automation object
  - Run macOS 12+ specified shortcuts from within your workflow
  - Specify input as string or file(s)
  - Choose to ignore Shortcut output and continue, or wait for Shortcut and use its output
- Add new Join Arg utility object
  - Converts multiple input arguments into a single output argument with specified join character
  - Useful with supporting some Automation Tasks
- Add new Running Apps workflow input filter object
  - Select output from Bundle ID, Path, or Process ID
  - Add optional result title prefix as a hint to the action
- Add new Dialog Conditional utility object
  - Present a macOS System dialog to the user
  - Configure title, description and up to 3 available buttons
  - Multiple outputs, allowing different path based on button pressed
- Add new Speak output object
  - Speaks configured or passed-in text
- Stripped back run script environment to ensure external variables don't pollute Alfred's script environment
  - Update default run script environment path to /opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
- Python 3 has now been added to the default script selection
  - Note that if Python 3 hasn't already been installed via e.g. Homebrew, this may trigger the Xcode command line tools install
- Update the default selected script type for Run Script and Script Filter to zsh instead of bash
- New word matching framework
  - Improves boundary matching beyond whitespace
  - New "Word based - sequential" matching option available in Script Filter when selecting "Alfred filters results"
  - List Filter now shares the same matching options available in the Script Filter
- /usr/bin/swift has now been added to the selectable language types in Run Script and Script Filter
- Prevent clicking through on an unpopulated website in the workflow importer and exporter
- Improvements to the placeholder system throughout Workflows
  - The {query} placeholder will now process placeholder modifiers, e.g. {query.lowercase.trim}
    - Allows for faster workflow development with fewer utility objects
  - Access constants, previously only available to Run Script and Script Filter, using {const:constname}, e.g. {const:alfred_workflow_version}
    - Use {constants} in the Debug Utility to view all constants for a workflow within the workflow debugger
    - Improve script runtime handler to prevent user-overridden Alfred constants
  - Debug Utility now uses {variables} to dump all variables, however {allvars} will still be recognised for backwards compatibility.
- When duplicating a symlinked workflow, fully resolve the symlinked path so the workflow is correctly duplicated

#### General

- Alfred now uses the Modern and Modern Dark as the default themes
- Roll out enhanced URL handler throughout Alfred allowing for more flexible URL recognition and handling
  - Remove deprecated UTF-8 option from custom web searches, make all searches UTF-8
- Improve Alfred text view undo algorithm to break coalescing on non-alphanumeric breaks instead of timing
- Add custom Alfred accent colour to Preferences UI, for improved experience on Big Sur+
- Improved icon rendering across the board
- Larger hit zones for buttons at the bottom of the Workflows, Themes and Remote Pages lists
- Improved macOS Colour palette behaviour in theme editor when changing colour options
- Improvements to Ubiquitous Internal Preferences Search, ? keyword within Alfred
  - Add new blank workflows using ?add workflow

#### Snippets

- New option to allow resetting of colour, size and font in rich text
  - Useful for creating formatted snippets which are dark mode compatible
  - Option also added to Copy to Clipboard Workflow object
- Separate icons for Snippets and Snippet Collections for UI clarity
- Enable drag and drop of snippets between collections in the preferences
- Fix disabled collection colour in preferences dark mode

#### Universal Actions

- Reveal in Finder Universal Action now works with multiple file selections

#### Accessibility

- Alfred 5 brings a big overhaul in Accessibility, and marks the start of an ongoing process to refine and improve every aspect of Alfred 5
- When searching in Alfred using the ? keyword, or using the Alfred Preferences search, workflows are now correctly focused when searched for and actionedChanges made during the Alfred 5 Early Access

### Alfred 5.0 GM1

Build 2057, Wednesday 13th July 2022

- A few further tweaks to URL processing
- Preparation for General Release, removing Early Access banner from prefs

### Alfred 5.0 EA11

Build 2053, Tuesday 12th July 2022

- Fix Early Access regression in URL query argument handling throughout Alfred
- Open URL workflow object
  - Improve flexibility of URL placeholder handling by offering two new options to Encode {query} and Encode {var:}
    - These are checked by default, and are best left checked under normal use of this object
    - When unchecked, options are passed to the URL processor unchanged, giving developer control over encoding
  - Overhaul Accessibility for the Open URL object, with correct tab focus ordering, and better VoiceOver descriptions

### Alfred 5.0 RC1

Build 2050, Monday 11th July 2022

- Run Shortcut Workflow Automation Action
  - Update underlying shortcut execution from using 'shortcuts' command line tool to calling AppleScript 'Shortcut Events' instead
    - Fixes issue where passed file paths were copied to macOS temporary folder so couldn't be operated on
  - Update shortcuts logic to fall back to No Input when overriding JSON with an out of range value input mode value
- Fix layout on resizing Workflow configuration sheet environment variables tab
- Workflow Debugger log messages output from the Debug workflow object now show as system yellow in the debugger to better stand out
- Update iTunes to Music in Mini Player volume commands
- Update default "Search in Finder" fallback to show correct Finder subtext in Alfred's results
- General Release preparations
  - Remove EA from bundle version number (Preferences are still in Early Access mode)
  - Improve Alfred Preferences Powerpack tab and activation process
  - Remove Powerpack requirement from using Early Access build
  - Tweaks to the Onboarding / Welcome process

### Alfred 5.0 EA10

- Accessibility
  - Add + and - buttons to Launch Apps / Files Workflow Object configuration sheet to make more accessible
- Improve memory efficiency of Automation Tasks when running internal scripts
- Run Shortcut Workflow Automation Action
  - Add (default) input option to ignore passed argument
    - This prevents certain Shortcut app scripts from failing due to an unexpected input being passed
  - Improve task caching to better respect overridden options
  - Stop workflow when the Shortcut action errors, shown in the Workflow debugger

### Alfred 5.0 EA9

- Accessibility
  - Improve the Alfred Preference's Music Feature VoiceOver descriptions
- More label changes in Preferences from iTunes to Music
- Update Automation Task workflow object to respect Task UID configuration override (e.g. using the JSON Config utility object)
- Workflow Shortcuts Automation action
  - Stop workflow stream if no Shortcut selected, or there is a Shortcut error
  - Enable Workflow object configuration overrides
- Add System Bold to the available standard fonts in Alfred's theme editor

### Alfred 5.0 EA8

- Accessibility
  - Improve VoiceOver of selected workflow object in canvas
    - Now reads additional visual information on the object such as the defined keyword for a Keyword Input
    - Reads the attached canvas note for the object
    - Reads defined hotkey value
  - Remove macOS Bug workaround which verbally changed modifier keys to text in Hotkey View accessibility
    - Fix prevents double reading of mod keys, please let me know if you don't hear the mod keys anymore
- Update Automation Task workflow object to respect config overrides (e.g. using the JSON Config utility object)
- Automation Task Updater improvements
  - Configured Automation Tasks with a missing underlying Task now show as red in canvas
  - Tasks will automatically reconfigure themselves once updated tasks are installed, and canvas update
- Improve robustness of workflow array stream processing to ensure non-strings are correctly processed by objects
- Workflow Configuration Sheet (the sheet under the [x] button)
  - Update the help button link location to a more suitable page
  - Make the user config preview sheet width better match the live sheet to aid text decisions
- Update the default Mini Player keyword to "music", because apparently leaving it as "itunes" wasn't being retro-funny ;)

### Alfred 5.0 EA7

- Workflow Canvas and Accessibility
  - Update Speech Workflow output object with option to automatically use VoiceOver for output
    - Enabled by default for newly added objects, falls back to using macOS Speech Synthesiser
  - Added ⌥arrows to automatically connect while navigating in the canvas
    - The "next selected object" for connection uses the same logic as using ⌘arrows
  - Added ⌥⌫ to remove connections to and from the selected object(s)
  - Added ⌘↩︎ to show the popup menu for the selected object(s)
- Automation Tasks
  - Add the initial Automation Task update mechanism, currently available from within the Workflow Automation Task object
    - Downloads and installs (or reinstalls) the Automation Tasks from our official repository
    - Additional changes are coming here before General Release
  - Update the task argument validation to discard irrelevant arguments being passed in, and then check the Task expected input count on the remaining items
    - Allows for much more flexibility when adding Automation Task objects throughout a workflow
    - Add additional debugging output in the Workflow debugger to show which arguments are being used, and which have been discarded
- Fixed the help button link location in the Workflow configuration (the sheet under the [x] button)
- Loosen the URL validation within the Open URL Workflow Object configuration, now allowing for e.g. {query}/xyz or {var:xyz}
- Prevent non-configured Workflow Snippet Triggers from showing in the Snippet Viewer
- Pass .icloud files to Finder for opening, which will instigate a download and open of these files
- Prevent Workflow and Automation Task auto-generated configuration text fields from incorrectly wrapping with long text
- Added + and - buttons to the Clipboard History App Ignore list in Alfred's Preferences to improve accessibility
- Added links to follow-along counterpart webpages for the Workflow getting started guides

### Alfred 5.0 EA6

- Open URL workflow object
  - Updated to now recognise multiple input arguments, and process defined URL for each argument
  - Improves flexibility when used in combination with new and updated workflow objects, including the Automation Task object
- Workflow User Configuration Backend
  - Add new option to Copy an entire item (on item's popup menu), and paste it as new (from + button)
  - Make Workflow user configuration backend subtext descriptions non-selectable
- Workflow readme markdown improvements
  - Improve link detection, and remove Open URL confirmation check
  - Fix markdown syntax, now using asterisks for bold, italic, and bold italic
- Fix accessibility label in Features > General prefs for Remove Scope Folder button
- Fix logic in Running Apps filter to prevent over-caching
  - Fixes issue with Quit keyword showing irrelevant items

### Alfred 5.0 EA5

- Add ⌘K as shortcut to clear the Workflow Editor debugger
- Update Workflow preferences Workflow filter to be aware of non-strings when filtering
- macOS Ventura compatibility improvements

### Alfred 5.0 EA4

- Tweak canvas overlay
  - Move down on the canvas, and make slightly smaller
  - Swap Apple mouse emoji for the word "Click"
  - Add a close button to the top right
- Put focus back into palette search field when clicking a search result
- Improve the Powerpack tab layout (this will change before general release)
- Update various text throughout Alfred's preferences
- Improve the Learn More Prefab which is part of the 5th Workflow Getting Started guide

### Alfred 5.0 EA3

- Fix the palette guide height calculations when macOS Scrollbars are set to "Always"
- Spell check the change log and fix speeling mistakes ;)
- Add hyperlinks to workflow readme markdown (shows URL when clicking to confirm opening)
- Add a message within the Automation Tasks workflow configuration linking to early access workflow (currently not online)
- Add new canvas overlay to help discover some of the new keyboard shortcuts
  - Can be hidden from canvas popup menu, under the options submenu
- Tweak canvas background opacity by a fraction to work around odd Monterey flicker

### Alfred 5.0 EA2

- Fix spelling in onboarding from Actiavted to Activated
- Fix {query} replacement in Dialog Conditional
- Tweak font attributes in Workflow guides
- Prevent crash when using the Dialog Conditional and editing workflow while dialog visible
- When duplicating a symlinked workflow, correctly duplicate workflow instead of doing nothing
- Remove a couple of erroneous NSLogs which were in for development
- Remove the Skip Onboarding preference value when showing "Beta Requires Powerpack" to prevent loop
- Update "Buy or Upgrade" and "Upgrade" button links to point to early access store (currently not online)
- Fix missing Join Arguments icon in palette when in compact mode
- Always show the Dialog Conditional in front of Alfred's window
- Add workflow debug output if Dialog Conditional doesn't show due to missing configuration
- Add border around Dialog Conditional in canvas to differentiate from standard Conditional
- Fiddle with the palette re-layout when using macOS Scrollbars are set to "Always"

The Alfred 4 Change Log is still available for your browsing pleasure!

### Latest Blog Post:

Alfred 6 Expanded Sneak Peek

---

### 3.2 Alfred 4

> Pagina ufficiale: `https://www.alfredapp.com/changelog/v4/`

### Alfred 4.8

Build 1312, Friday 4th November 2022

- Ventura Compatibility tweaks
  - Merge back Alfred 5 changes for cryptex folder, and pre-cache Safari in its new location
  - Merge back Alfred 5 updated interactive File Search Troubleshooting guide
  - Merge back File Search Scope updates
    - New options available from the Features > Default Results > Search Scope > Reset... button
    - Reset to Full Disk, or Applications and Home, giving faster control after a failed File Troubleshooting result
- Update Xcode build environment to match Alfred 5
- Show message when attempting to use the automatic "Install in Alfred" link on the upcoming Alfred Gallery, as this requires Alfred 5

### Alfred 4.7

Build 1306, Friday 15th July 2022

- Update build environment to match Alfred 5 to simplify future maintenance
- Add simplified upgrade path to Alfred 5 within the Preferences
- Clarify incompatible workflow message in workflow editor, giving more details

### Alfred 4.6.7

Build 1305, Wednesday 29th June 2022

- Alfred 5 migration and compatibility preparation
  - Early Access for Alfred 5 is now available on alfredapp.com
- Fix "Treat Input as Universal Action" not being correctly persisted on Keyword and Script Filter inputs after editing
- macOS Ventura compatibility improvements

### Alfred 4.6.6

Build 1303, Wednesday 25th May 2022

- Fix regression in latching input filter placeholder results based on typed keyword
- Fix File Filter workflow object configuration UI table to correctly show NOT and Words header titles
- Add a plist preference to skip Alfred's launch at login check when updating versions
  - Use the following in Terminal: defaults write com.runningwithcrayons.Alfred-Preferences skipLoginItemCheck 1

### Alfred 4.6.5

Build 1299, Monday 25th April 2022

- Add 1Password 8 integration via new and improved Alfred Workflow
  - Update 1Password feature in Alfred's Preference linking to workflow for 1Password 8 users
- Improve threading in Export Diagnostics to ensure key code methods are called on the main thread
- Update built-in Snippets Trigger Workflow example, removing PHP
- Updated build environment

### Alfred 4.6.4

Build 1294, Tuesday 22nd March 2022

- Improve result re-selection behaviour in Alfred's default results, maintaining visual position where possible
- Prevent results marked as invalid from latching in the default results
- Update usage graph legend label from "iTunes" to "Music"
- Fix description in JSON Config workflow utility object config
- Allow override of Alfred's main window z level in user defaults, e.g. defaults write com.runningwithcrayons.Alfred windowZLevel 50
  - Alfred has a carefully calculated z position so setting this override might cause unexpected issues
  - Only use if Alfred's window unexpectedly shows behind a non-native app, e.g. intelliJ's search window. Restart Alfred after setting this override
- For volumes which don't support the recycle bin, delete workflows and snippets instead of failing
- Tweak background colour of workflow editor to prevent dark mode graphical glitch on Monterey with scaled display
- Work around macOS Monterey bug which prevents Alfred from showing after using a secure entry field
  - This issue only affects Alfred when using the Focus Compatibility mode. Everything works as expected when using the default mode
  - Monterey will still prevent Alfred from showing over the secure entry field, but now behaviour returns to normal after leaving the field

### Alfred 4.6.3

Build 1285, Tuesday 15th February 2022

- Update default search scope to include ~/Library/CloudStorage
- Abbreviate file results subtext prefix ~/Library/CloudStorage/... to ☁️/..., allowing more space for useful path information
- Update web bookmark search to be diacritically insensitive for bookmark folders
- Workflow Run Script / Script Filter tweaks
  - Add a note to the default example Python workflow script to warn of deprecation, and removal in macOS 12.3+
  - Do a bin existence check and add [not installed] to the popup selection box on any paths which are not available
- Add more informative popup dialog on failing to import a workflow due to lack of permissions

### Alfred 4.6.2

Build 1280, Tuesday 25th January 2022

#### General

- Ignore currently mounted TimeMachine backup volumes with eject command by adding new exclusion to the ignore list
- Added new Copy [with Replace] to... and Move [with Replace] to... Universal File Actions
  - Allows overwriting of destination files of the same name if they exist.
- Trim custom web search URLs before validating
- Rewrite "Force Keyboard" code to attempt to re-set the selected layout on showing Alfred if it was unavailable on previous attempts

#### Workflows

- Fix issue where a hotkey with a shared combo was sometimes not correctly being deregistered with macOS when an instance was removed or unset in Alfred's Workflow Editor
- Fix List Filter Inputs to correctly filter if variables are used in the item Title field
- Log to the debugger when a workflow object is run directly via the Incoming Configuration

### Alfred 4.6.1

Build 1274, Monday 29th November 2021

#### macOS Monterey Support

- Add /opt/local/bin/ to the alternative bin search location if default bin location is missing
- Update built-in Google and Amazon Suggest example workflows
  - Now match native web experience where suggestions are below typed query
  - Improved UTF-8 support
- Add new macOS Monterey Passwords preference pane to default results
- Updated internal 'sleep' System Command script for improved reliability

#### Universal Actions

- Improve File Buffer clearing logic when actioning buffer contents
  - If action leads to workflow trigger, and workflow changes contents of buffer, file buffer will no longer be cleared
- Fix regression where file paths weren't being optionally escaped when being copied to clipboard

#### Large Type

- Overhauled text wrapping algorithm to improve layout on large blocks of unicode text (e.g. Japanese)
- Improved Large Type positioning and rendering, avoiding occasional text overflow issues and improving vertical centring
- Map between internal tag and NSTextAlignment value for Large Type alignment to prevent odd issue where alignment is wrong

#### General

- Fix Workflow Script Filter input XML Parsing where some session variables are not correctly passed out
- Fix Workflow Preferences search non-anchored matching of External ID and Remote ID causing noise in results
- Prevent theme list from taking focus when navigating preferences tabs via keyboard for improved accessibility navigation

### Alfred 4.6

Build 1266, Friday 15th October 2021

#### macOS Monterey Support

- Added compatibility enhancements for macOS Monterey
- Improved handling of missing bin path when running a Workflow script
  - Log debug info into the workflow debugger when relevant
  - Add options on popup alert dialog to open or disable the relevant workflow when attempting to run
  - Check alternative Homebrew install locations for bins when missing from default location
    - Homebrew installed php on macOS 12 will be found in either /opt/homebrew/bin/php (Apple Silicon) or /usr/local/bin/php (Intel)
- Updated built-in Google and Amazon workflows by Vítor Galvão
  - New workflows use ruby in place of php for default compatibility in macOS Monterey
  - If you're using these workflows, delete them and re-install them from the Workflow > + > Getting Started menu
- Various tweaks and improvements to underlying Alfred framework

#### General

- Ignore dragging for 3 pixels to prevent accidental drags in Alfred's default or subview result views
  - Improves click behaviour with sensitive peripherals such as pen tablets

#### Universal Actions

- Added option on Keyword and Script Filter workflow inputs to control which are automatically treated as Universal Actions
  - Available in Workflow editor on popup menu for selected inputs
  - Recommended for use when implementing Universal Action triggers for more granular control
  - Added note to Universal Actions trigger to highlight this feature
- Perform variable replacement in Keyword and Script Filter titles for universal actions

#### Accessibility

- Improvement to the ? (question mark) preferences search keyword to better describe which preference the selected result will open

### Alfred 4.5.1

Build 1256, Monday 9th August 2021

#### General

- Tweaks and improvements to the new Universal Actions feature
  - Fix regression of missing email subject when sending file attachments via Alfred's actions
  - Fix regression of emacs ctrl+f not being respected as right arrow for action / navigation
- Fix regression in calculator with floating point rounding issue
- Prevent 0 sized images from being added to Alfred's clipboard history
- Clarify error message when a workflow script task cannot run, such as the script language missing
- Improved messaging on the Run NSAppleScript workflow action
- Clarify osascript type from AS to AppleScript and JS to JavaScript in Run Script and Script Filter workflow objects

### Alfred 4.5

Build 1253, Monday 2nd August 2021

#### Universal Actions

- Brand new major feature for Alfred 4 Powerpack Users: See alfredapp.com/universal-actions for details and pretty pictures!
  - Global Hotkey in macOS to action the selected Files, URLs and Text
    - Set your hotkey in Alfred’s Preferences > Features > Universal Actions to get started
  - Action from within Alfred
    - Use your global action hotkey, or the action shortcut combo, to action any selected result or item throughout Alfred
    - Action file navigation, clipboard history, and even action actions
  - Built-in Actions
    - Over 60 built-in actions, such as copying to your Clipboard, saving as a Snippet, searching the web, showing recent documents for an app or extracting URLs from a block of text
    - More actions coming soon!
  - Deep Workflow integration
    - Create your own actions, from the simplest text transformation to the most advanced script
    - String multiple actions one after the other without leaving Alfred
    - Workflow Keyword and Script Filter objects are conveniently added as default actions
    - For ultimate control, you can create specific Universal Action triggers where you need them within your Workflows
    - New Built-in Universal Actions Getting Started workflow
- Supporting changes for new Universal Actions feature
  - Respect the WebURLsWithTitlesPboardType clipboard content type when importing data from the clipboard for actioning
  - If configured, correctly implement the tap action keys (e.g. fn and ctrl) throughout the action view hierarchy
  - New and updated Workflow objects
    - Universal Action trigger
      - Add actions to Alfred's Universal Actions panel
      - Select which types of data are relevant from Files, URLs and Text
      - Select whether to only show if single or multiple items are passed
    - File Action trigger
      - Updated multiple argument mode to match new Universal Action trigger behaviour
    - Action in Alfred action
      - New option to directly jump to certain actions such as Open with, Copy, Move, Email and Recent Documents
      - The argument type treatment can be selected for passing through to Universal Actions
        - Previously configured objects default to type "File" for backwards compatibility
        - Newly created objects default to type "Automatic" for automatic detection of passed type
      - Workflow object output now correctly passes through the input arguments
  - AppleScript
    - A new "as type" has been added to the Action in Alfred AppleScript, allowing e.g. items to be forced to type "text". See AppleScript Dictionary for more
  - New action parameter for Script Filter JSON to override arg being actioned per returned result, see JSON documentation for more information

#### General

- Recognise numpad keys as special when using Dispatch Key Combo objects in Workflows and Remote
  - Add popup option on Key Combo editor to select numpad keys when using a non-full-size keyboard
- Move window hide logic to ensure results clean up always happens at the correct time
- Improve logic around mod key recognition for QuickLook, correcting issue where mod taps were sometimes ignored
- Update calculator to limit the significant digits to prevent some floating point rounding issues on Catalina and Big Sur
- Improve event handling for actions shortcut when using right arrow, preventing repeat (held) key events from performing actions
- Update internal Alfred URL parser to correctly recognise empty authority based URLs
  - Migrate additional internals to use Alfred URL parser
- Fix misinterpreted alt+down shortcut combo as right arrow for actioning

#### Workflows

- Fix layout issue and spelling in Write Text File output object config sheet
- Setting the Script Filter quicklookurl parameter to empty string or null is now correctly respected as not wanting quicklook for the specific result
- Added new ⇧⌘F Preferences shortcut which will switch to the Workflows tab and highlight the Workflow Filter field

### Alfred 4.3.4

Build 1229, Wednesday 28th April 2021

#### General

- Fix Large Type window on Big Sur 11.3 sometimes causing unexpected quit

#### Accessibility

- Improve VoiceOver for the Workflow Editor, more improvements to come
- More useful accessibility descriptions for Add and Remove workflow buttons
- Add VoiceOver label for workflow object editor sheet
- Fix preferences quitting unexpectedly when hovering a workflow object connection with VoiceOver enabled

### Alfred 4.3.3

Build 1226, Thursday 15th April 2021

#### Alfred Remote

- Add new grid options for Alfred Remote 1.5
  - Button grid can now be 6x6
  - Button labels can now be hidden
- When deleting a workflow which has an installed Alfred Remote page, ensure the page gets correctly removed
- Add updated device icons in Alfred's Remote preferences

#### General

- Fix image saving throughout Alfred's Preferences to correctly constrain to 256px square regardless of display resolution (e.g. Retina)
  - Leads to e.g. smaller workflows, and faster loading Alfred Remote pages
  - We still recommend manually optimising the images in your Workflows before sharing
- Add tweak to visual effect backing view instantiation
- Fix calculator floating point accuracy issues in Big Sur due to a behavioural change in underlying number formatter
- Tweak to Italian snippet date localisation
- Ensure that Alfred is correctly hidden when using Return to open folders in Finder from Alfred's File System Navigation
- Request for Contacts access off of main thread to prevent edge case temporary hang at startup
- Fix Workflow Post Notification Output to correctly show passed in arg when Title is empty and Text is populated

### Alfred 4.3.2

Build 1221, Tuesday 16th February 2021

- Fix spelling in clipboard preferences
- Update Google Translate URL to latest version
- Add a new view stack option to the Browse in Alfred workflow object, allowing for user-defined Esc behaviour
  - Useful for having folder-based File Filter connected to Browse in Alfred, for peeking in and out of folders
- Add new character wrap option in workflow Large Type output object (previously fixed at approx 50 chars wide)
  - Useful for predictable fixed width font technical text output
- Clear theme cache on hiding Alfred
- Update the Open URL Workflow and Remote objects to show the relevant URL handling app for the typed URL scheme
- Fix Preferences search results dropdown view to correctly resize in Big Sur
- Update default search scope location for homebrew Cellar

### Alfred 4.3.1

Build 1214, Friday 22nd January 2021

#### Theming

- Add an Appearance option to show scroll indicator "Always" when there are more results (previous Alfred behaviour), instead of the new "Automatically" behaviour
- Fix Alfred's window not showing on Big Sur when switching window focus mode from Compatibility to Standard
- Work around Big Sur issue where file system navigation configuration cog was disappearing when clicking for menu
- Cache the active theme in Alfred to prevent partial theme changing on automatic macOS Light / Dark mode update

#### Workflows

- Don't trim leading or trailing whitespaces when saving Terminal Command action
- Update built-in "Paste as Plain Text" template to ignore placeholders
- Show the Workflow Snippet Trigger shared prefix / suffix for the keyword when using ? internal search

#### General

- Improve VoiceOver accessibility within Alfred's preferences
- Update default Web Search icons to latest versions
- Improve URL matching and performance for default results
  - Broader matching, however, requires valid TLD character match for non-scheme prefixed URL
- Add ⌘↩︎ modifier to URL history items to open the typed URL instead of history item
  - Allows for URL entry if there is matching URL history result taking priority
- Add ⌘↩︎ modifier to edit the selected snippet for both the 'snip' keyword and snippets in snippet viewer
  - Show contextual help text in snippet viewer as mod key is pressed
- Troubleshooting tweaks
  - Add additional troubleshooting logic for incorrect metadata type assigned to an Application
  - Add a Copy Output button to the file troubleshooting
- Update 1Password Open Item functionality to use 1Password "view" URL scheme instead of "search"
- Pre-cache Battery preferences pane in macOS Big Sur
- Deselect all in snippets table after moving snippets from one collection to another using the popup menu
- Fix initial Preferences table view columns to fit width in older versions of macOS now Alfred is being built on Big Sur

### Alfred 4.3

Build 1205, Monday 14th December 2020

#### Universal Build

- Alfred's main download and update now runs natively on both Intel and Apple Silicon
  - Previously, the Universal M1 build was available as a separate download

#### Theming

- Two new default themes added to take advantage of new theming features in 4.3
  - Alfred Modern: Uses the light visual effect window backing with rounded purple highlights
  - Alfred Modern Dark: Uses the dark visual effect window backing with rounded turquoise highlights
  - Don't forget that you can choose different themes while in macOS Light and Dark mode, and Alfred will automatically switch
  - Duplicate these themes to create your own variations in Alfred's Appearance preferences
- Added ability to select a native macOS Visual Effect view to back Alfred's window
  - Provides more native looking themes, with proper window surround
  - Fixes fuzzy window corners in macOS Big Sur when using the previous style window blur
  - Visual Effect options available from the top left blur button in the Theme editor
  - Deprecated the classic blur, which uses private API and doesn't guarantee future support
  - Buffer feature will now fill full width of Alfred window if Visual Effect background used, to match native window background
- Add new theme options to add round corners to the search field and selected result backgrounds
  - Result separators will automatically reduce in width to match the selected result rounded corners
  - Reduce the width of the selected text background editor to better visualise search field rounded corners
  - Automatically round the corners of the scroll indicator based on width, to better match the native macOS scrollbar
  - Relax the maximum rounded corner constraint. Note that if using a visual effect background, macOS can artificially constrain very rounded corners in unexpected ways
- Add new theme option for horizontal search field padding, allowing for better search text alignment
- Standardised centre padding on secondary views, and disassociate with edge horizontal padding for larger summary / quicklook icons
- Only show results scrollbar once scrolling has started, for cleaner default results, and better matching macOS visuals
- Cleaner upgrade notification tab at bottom of Alfred window, compatible with modern macOS blur
- Update internal framework to better respond to view backing type changes
- Drag Alfred window by the Alfred Buffer counter text when there are more buffer items that can visibly fit
- Only position the colour picker the first time it's shown (bottom left of the preferences window), otherwise, respect user positioning

#### Workflows

- Browse in Alfred Action
  - Added new sort override options into the Browse in Alfred action object
  - Facilitates interesting shortcuts such as a hotkey to show the Downloads folder sorted by Created date, newest first
- Improve scrolling behaviour in Conditional Utility when macOS scrollbars set to always show

#### General

- History Improvements
  - You can now use ⌃↑ and ⌃↓ to navigate Alfred's default result history at any time
  - Note: these shortcuts will need to be disassociated from Mission Control's shortcuts to use them in Alfred
- Mouse improvements
  - Add a new mouse jitter helper to ignore tiny mouse movements in Alfred's results and subviews, preventing unintentional result selection
  - Correctly select the row directly under the mouse pointer when clicking a result row
- File System Navigation
  - Improved wording on the sorting popup menu to clarify sort direction instead of ascending and descending
- Create new URL Helper to parse raw / non-encoded (RFC 3986) URL strings, paving the way to overhauling Alfred's URL handling
  - Update Contact Viewer to use new URL Helper, which fixes e.g. tel handler in Big Sur
  - Fix Open URL workflow object to correctly show domain label in workflow canvas for non-encoded URLs
  - Fix Custom Search Open Search lookup to correctly decode special characters
  - Add additional logic to Open URL workflow object if unable to create valid URL from string
  - Update Quick Look handler to use new url parser
- Improve default fallback logic for direct inputs (e.g. hotkey to input workflow), fixing showing null in fallback result subtext
- File Buffer Improvements
  - If configured, only clear the contents of Alfred's Buffer on actioning if the action is based on the contents of the buffer (not separate single actions)
  - Improve keystroke responsiveness if using the Buffer shortcut keys as the first keystroke after showing Alfred
- Update internal search to add music icon and keywords where relevant

#### Preferences

- Tweak preferences Snippets feature icon to better line up with Clipboard feature icon
- Clarify the Clear All button for Alfred's clipboard history, and add confirmation sheet
- Ensure that the Snippet count is correctly updated for a Collection when adding or removing Snippets
- Improve preferences features header to be correctly tinted for the desktop
- Fix spacing around table views on Big Sur
- Fix non-retina Big Sur rendering issues in the following places:
  - Icons in the Feature and Workflow view header
  - Twitter button in usage preferences
  - "Open Workflow Folder" button in Workflow object editor sheet
  - Button icons in the top right of the Workflow editor
- Troubleshooting
  - Allow subsequent files to be dragged into the file troubleshooting once a previous one has completed
  - Update the file troubleshooting scope check failure to be a warning with additional information on how to fix, and move it to be the final check performed
  - Allow scope check troubleshooting pass if application nested within mapped volume data path

### Alfred 4.2.1

Build 1187, Friday 13th November 2020

- Fix Facebook web search URL
- Update Workflow Conditional Utility object configuration to add scrolling view for a larger number of conditions
- Fix Workflow alternate connection subtext to correctly display variables
- Fix Workflow export to obtain export info on correct thread
- Update any remaining built-in web searches from using legacy encoding
- Improve Remote page icon generation for newly created pages
- Fix Big Sur Workflow editor note rendering

### Alfred 4.2

Build 1180, Wednesday 28th October 2020

- Preparation for macOS Big Sur
- Move clipboard / snippet viewer preview text to top left when text matches colour hex, for easier visual scanning while scrolling
- Improve error reporting when unable to obtain Alfred update data
- Improve File troubleshooting messaging
- Improve memory management in File System navigation summary panel
- Improve initial welcome screen text

### Alfred 4.1.1

Build 1172, Tuesday 1st September 2020

- Dynamic Placeholders
  - Add in option on placeholder insertion popup menu to contextually turn off Dynamic Placeholder expansion
  - Improve help subtext in areas which use Dynamic Placeholders
- Tweaks to Contacts integration to defend against unexpected data
- Show custom URL scheme in contact viewer subtext when configured for selected field
- File System Navigation
  - Fix unexpected exit when navigating up a folder level with typed text when already at the top level
  - Prevent double slash in search field when using AppleScript to tell Alfred to browse /
- Update AppleScript action and browse actions to recognise URL file: paths and convert them accordingly
- Improve reliability of tap modifier actions immediately after using a hotkey to show a pre-populated view, e.g. File Navigation
- Update Snippet Collection naming error to correctly fit in sheet
- Improve troubleshooting guide text

### Alfred 4.1

Build 1167, Thursday 9th July 2020

#### Workflow Changes

- Workflow editor rendering tweaks to significantly improve the UI performance with very large and complex workflows
- Improve visibility of modifiers set on connections, especially when using light object colours
- Updated Workflow Objects
  - Hotkey Trigger
    - The same hotkey combination can now be shared across multiple triggers matching different conditions
    - Added navigation to related hotkeys on the contextual popup menu for a hotkey trigger in the workflow editor
    - Prioritisation of shared hotkey to run, with the following priority:
      - In Focus match takes highest priority, e.g. Hotkey only when Safari in focus
      - Not in Focus takes secondary priority, e.g. Hotkey only when Spotify not in focus
      - Falls back to hotkey with no app specific focus configured
    - Hints shown in orange if a shared hotkey combination is in use
      - Hotkey Trigger object key combo background changes
      - Subtext under the hotkey field updates with warning
    - Show subtle grey background behind application icons on Hotkey Object in workflow editor where hotkey focus mode is set to "don't have focus"
    - Copy and Paste of object (or object configuration) now also retains the hotkey combo
      - Note that this will naturally create a conflict which you will have to manually resolve
  - Script Filter Input
    - Fix Run Behaviour sheet "Reset to Defaults" button to also reset the "Argument" section
  - Copy to Clipboard Output
    - Fixed to now correctly use clipboardtextrtf property from passed-in JSON config
    - Reorganise internal logic to enable plain text clipboard output to be derived from passed-in RTF from JSON config
      - Only save either clipboardtext or clipboardtextrtf into the configuration
      - Fixes automatic {cursor} positioning with mismatching rtf / plain text
  - Arg / Var Utility
    - Add option to "pass through" the input argument, allowing for array objects (e.g. list of files) to pass through unprocessed
    - Clarify the help subtext in the configuration sheet
- New Workflow Objects
  - File Buffer Action
    - Added new workflow action to interact with Alfred's File Buffer
  - Action in Alfred Action
    - Added new workflow action to show Alfred's actions panel for the passed in file
  - File Utility
    - Tests if file exists and outputs on one of two outputs accordingly
    - Option to also output the UTI for the file as a variable
      - This could be useful for subsequent branching using a Conditional
- New Workflow Object Inbound Configuration
  - Access using the "Inbound Configuration..." popup menu for the selected object
  - External trigger identifiers can now be directly set on external objects
    - Conflicts are now checked between the External Trigger object, and any external identifiers set
  - You now have control over how a downstream input object presents its results between Direct and Keyword modes
    - Direct mode is the previous behaviour, where the input icon is placed to the right hand side and you see no keyword
    - Keyword mode places the input into Alfred's default results and sets it as unique (same as pressing return on a placeholder)
  - Workflow objects represent the presence of an external identifier with small hint on object input in Workflow editor
    - Double click the hint for faster subsequent access to the inbound configuration
    - The icon for both External Trigger and Call External have been tweaked to match the new hint
- Fix internal variable types in workflow editor framework
- Added "Filter Workflows by..." on the popup menu for workflow objects in the canvas for hotkeys and keywords
  - Makes it easier to find workflows with similar hotkeys and keywords
- Standardise how an array of arguments is shown in the workflow debugger
- Improve various subtexts throughout the workflow object configuration sheets

#### Snippets and Clipboard

- Snippets can now embed other snippets using the {snippet:} placeholder
  - Placeholder works in all expected places, for example, the Copy to Clipboard workflow output object
  - Note that nesting is only one level deep
  - Added a "Copy Placeholder" on the popup menu for a selected snippet to copy the relevant {snippet:} placeholder
- Improve text placeholder framework
  - Improved processing efficiency by deriving plain text content from already-processed rich text content where applicable
  - more consistent behaviour between clipboard objects
  - Fixes issue where the snip keyword wasn't correctly processing rich text placeholders
- Fix Snippet keyword to correctly respect the "Auto-paste on Return" option
- Option to ignore org.nspasteboard.AutoGeneratedType in the Clipboard History Advanced preferences, enabled by default

#### Contacts

- Multiple Contact Actions can now be configured with modifier keys
  - Contact Actions editor sheet now correctly shows "Add" or "Save" button instead of just "Add"
    - Set the Add / Save button shortcut to be ⌘S
  - Action text at bottom of Contact Viewer now updates on mod key change to provide action hint
- Improve the "type to search" in the Contacts Viewer
  - You can now press up and down to select the previous or next match for the typed filter
- Trim around name components when creating full name

#### 1Password

- Added alternative ⌘↩︎ action to open the selected 1Password bookmark in 1Password instead of Open and Fill

#### Troubleshooting

- Start process of adding interactive troubleshooting built into Alfred's Help preferences to aid fixing common issues
  - Also add help links to key troubleshooting help pages
- Troubleshooting is written to a Report file, for easy emailing and subsequent support
- File Search
  - Run a number of diagnostic checks on a dragged in file to work out why it isn't being found

#### General fixes and improvements

- Fix Alfred using (and consuming) up/down key events when IME panel is showing (e.g. Pinyin selection panel)
  - Note that this fix is more of a "workaround" to a lack of Public API to officially support this
- Recognise full width space U+3000 as an activator for Alfred's quick file search mode
- Show Base32 decoded data wherever dyn.a UTI types are seen, to give better idea of content
- Fix making selected result unique in Alfred's default results if input is configured to be "no space"
  - Alfred was immediately disassociating the unique result due to incorrect logic
- Fix Music feature description text in Catalina to correctly say Music.app instead of iTunes
- Fix Dark / Light mode appearance of descriptive text in macOS Rebuild Metadata sheet
- Make the snip keyword's subtext more succinct for Copy or Paste text, showing more of the snippet content
- Fully resolve [local] symlinks and aliases when using Quick Look, to see the file contents instead of the file icon
- Fix twitter web search icon colour
- File Buffer Improvements
  - Show "x+ items" to top left of Buffer when the number of visible items exceeds the available visible space
  - Correctly re-draw the buffer when additional items are added and removed beyond the visible window width
- Add a - button to delete selected custom web searches in the Web Search preferences
- Show version number for Application bundles in preview panels (e.g. file system navigation, action panel)
- Improve VoiceOver accessibility for hotkey fields, now correctly reads newly inputted hotkey

### Alfred 4.0.9

Build 1144, Friday 20th March 2020

#### macOS Catalina improvements

- Add potential workarounds to Catalina screen coordinates bug making Alfred's window appear temporarily outside of the visible viewport when connecting a second display
- Correctly locate Desktop backgrounds to display in Alfred's theme editor on Catalina
- Update Workflow templates sub-menu from iTunes to Music.app on Catalina

#### UX and General fixes

- Update build environment to Xcode 11
- Add in Workflow list filter option to only show disabled Workflows
- Fix event threading issues in Snippet Manager which can cause unwanted Alfred behaviour with Snippet Expansion enabled when using fn+arrow keys
- Fix edit Snippet and Snippet Collection edit sheets to correctly show if Alfred's preferences window doesn't have focus when selecting the context menu item

### Alfred 4.0.8

Build 1135, Friday 17th January 2020

- Add finding and opening AirDrop, Network, Computer and iCloud Drive natively into Default Results for Mojave and above
- Fix play/pause command subtext to correctly read Music.app instead of iTunes on Catalina
- Update an Advanced > Modifier option from "Search with Spotlight" to "Search with Finder" to better reflect the actual behaviour
- Music
  - Update Alfred Remote iTunes example page to better reflect Music.app in Catalina
  - Update Workflow iTunes command actions to show as Music command actions in Catalina
- Web Searches
  - Update LinkedIn search URL in default web search
  - Update broken Weather Underground search URL to Google Weather search
- File Actions
  - Add "Browse Folder in Alfred" for files to browse the folder of the selected file
- File Buffer
  - Check if files exist before showing Alfred to ensure defunct files aren't shown
    - Note that files prefixed with /Volumes/ aren't included in the check to avoid potential delays in displaying Alfred

### Alfred 4.0.7

Build 1131, Tuesday 17th December 2019

- Fix Workflow List Filter initial loading of icons in configuration sheet
- Work around potential macOS Catalina address book caching issue in Alfred's contact viewer
- Fix dragging Alfred window from hat incorrectly performing action on older versions of macOS
- Workflow Improvements
  - Dispatch Key Combo output
    - Update Dispatch Key Combo output with option to interpret input argument for dispatch
    - Add workflow debug logging when key combination cannot be dispatched
  - Fix regression to gracefully correctly remove workflow variable when setting name to empty in Environment Variables and Arg/Var utility
- Back out default file search sorting from 4.0.4 due to potential performance issues under certain circumstances
- Update Welcome / Migration logic to more gracefully handle a backup on old Mac then restore to brand new Mac

### Alfred 4.0.6

Build 1124, Friday 8th November 2019

- iTunes Mini Player
  - Update Music API Parser in Catalina to include remote music
  - Momentarily hide Mini Player in transition between indexing and player views for first reindex in a session, allowing macOS permission dialog to show if necessary
- Update Rotten Tomatoes web search to use %20 instead of + for spaces
- When saving a clipboard entry as a snippet from Alfred's clipboard viewer with ⌘S, select "Auto expansion allowed" by default
- Internal Search
  - Wider, more flexible word based matching for internal searches
  - If searching for a disabled workflow, and disabled workflows have been hidden in Alfred's workflow preferences, show the hidden workflows so workflow can be selected
  - If searching for a hidden remote page, and hidden remote pages have been hidden in Alfred's remote preferences, show the hidden pages so the page can be selected
  - Show "disabled" or "hidden" in subtext of relevant internal searches
  - Add ?diagnostics as shortcut to Diagnostics... button in Help preferences
- Fix "Try Searching the Preferences" text in help tab for earlier versions of macOS
- Tweaks to the "Rebuild macOS Metadata" in Alfred's Advanced preferences
  - Update help text to inform about .Spotlight-V100 folder, and Terminal needing Full Disk Access
  - Fix .Spotlight-V100 folder location in macOS Catalina
- Work around Catalina bug in popup menu for custom workflow object colour selection
- Update "Waiting for results..." text to "Waiting for results from macOS..." for the rare occasion when Alfred is waiting on file search results

### Alfred 4.0.5

Build 1118, Tuesday 15th October 2019

- Clean Alfred's application cache in macOS Catalina on first launch to prevent stale duplicate cache entries from macOS upgrade
- Show macOS Catalina firmlinked applications as being located in /Applications/
- Fix Dutch snippet date placeholder localisations
- Prevent incorrect "home folder" warning message when unticking Applications Folder from Alfred's default search scope
- Calculator
  - Fix 4.0.4 regression in calculator where introducing x as multiply prevented hexadecimal calculations from working, pre-4.0.4 behaviour is now reinstated
  - If you would like to use x for multiplication, you can use the following command in Terminal.app:
    - defaults write com.runningwithcrayons.Alfred-Preferences calculatorXAsMultiply -bool true
- Workflow Import
  - Fix import sheet variable edits being committed to variables table for newly imported workflows
  - Commit any active edit when import button is pressed, e.g. ensuring a variable is saved if mid-edit and import / update pressed
- iTunes Mini Player
  - Disable Library XML field in Alfred's iTunes Advanced preferences in macOS Catalina, as this is no longer needed

### Alfred 4.0.4

Build 1111, Friday 13th September 2019

- File Search
  - Force default sort order to file metadata query to ensure most relevant results before Alfred has accumulated internal knowledge
    - You should see a significant improvement to Alfred's default ranking of results, and more relevant file search results presented
    - This resolution has been needed in the past due to changes in the underlying macOS metadata, and has now been added permanently
  - Tweak to File Filter to allow * as the Metadata field. Allows for wide arbitrary matching of multiple metadata fields if used with Words and Split options selected
  - Fix regression where application alt names words were not being matched, important for non-English app searching in English from mid string e.g. "monitor" to match "Activity Monitor"
  - Split /Applications (and /System/Applications) from Default Results search scope into separate checkbox to prevent accidental, confusing removal, and to future-proof for Catalina
  - Add Catalina iCloud Drive location to default search scope (select 'reset' to get default scope paths if they have been customised)
    - Note: This location seems to be changing throughout the Catalina Beta, so further changes may be needed
  - Correctly abbreviate files in home folder and iCloud in Catalina instead of showing full System Volume path
  - Only show iCloud Drive once in file search result subtext for files in the top level iCloud Drive folder
- Add warning at startup when a sync folder is set but the preferences are missing from that folder (e.g. a Volume not currently mounted)
- Fix Snippet 'snip' keyword to correctly use rich text snippets
- Fix "Email To..." file action in macOS Catalina (Thanks to Alfred user Vitor from our Forum)
- Switch default ordering of the clipboard history 'clear' keyword results to be chronological
- Tweak some workflow debug messaging
- Increase arbitrary URL recognition limit from 500 to 4096 characters
- Fix text in welcome message from "to to" to "to do"
- Recognise .alfred4workflow file type for importing workflows
- Calculator
  - Recognise x as multiplication
  - Update calculator to ignore basic calculations if prefixed with a permissible character but an unrecognised character sequence
- File Actions
  - Ensure that scope folders (e.g. Desktop) are correctly found when searching for a folder in Actions such as "copy to" and "move to"
  - Prevent hang when prefixing a search term with ~ in the "copy to" and "move to" actions
- iTunes Mini Player
  - Close Mini Player database before moving newly indexed database into position
  - Ensure that top level results divider line is only drawn in the Mini Player when needed
  - Improve artist / album counting during indexing
  - Catalina improvements
    - Fix Alfred Mini Player to work with macOS Catalina
    - Update music data importing to use macOS API (in place of XML)
    - Show "Music" in place of "iTunes" for Alfred feature preferences and default results

### Alfred 4.0.3

Build 1092, Thursday 4th July 2019

- Contacts Viewer improvements
  - Add "type to select" for fast selection of the item to highlight
    - Search based on item type, for example, show a contact and type "twitter" to highlight the twitter item
    - Searching also works on content, for example, search for part of an address to highlight
- Theming
  - Ensure Alfred's main window is correctly reconfigured the first time showing after a theme edit
  - Redraw theme position control on showing theme options to ensure correctly selected theme is shown
  - Refine Alfred's window snap repositioning calculation when dragging Alfred to a new position
  - Ensure the dark mode set theme is correctly pre-selected when launching preferences into the Appearance tab when in dark mode
  - Add option to use native macOS Dark Mode window rendering (for dark borders, and dark language popovers)
- Switch to localised standard compare when sorting files in Alfred's file system navigation
  - Gives Finder like sort order, e.g. 1, 2, 10, 20
- Workflow improvements
  - Open URL Action
    - Trim URL when validating or saving in Open URL workflow object to match underlying behaviour
  - Split Utility
    - Fix issue where config UI incorrectly greys out Save button preventing subsequent edits
    - Fix tabbing between fields in config UI
    - Improve behaviour of splitting, now also allowing for space delimiting
    - Allow empty delimiter, which will set output variable to the input argument
  - Update the built-in Google Suggest and Amazon Suggest workflow examples to use argv script mode, and use updated suggestion URLs
- Trim the typed argument for Alfred's ? internal search in Alfred's default search
- Make sure Alfred's Large Type display correctly closes when using a Hide Alfred workflow utility object after a Large Type output object.
- Show error if unable to write license file on activating Powerpack from Alfred's Powerpack preferences tab
- Improved encoding when opening the Dictionary URL from the define keyword, allowing for single quotes

### Alfred 4.0.2

Build 1088, Monday 17th June 2019

- Fix spelling in Preview feature, "masOS" to "macOS"
- Fix spelling in Welcome migration step, "Copy Prefererences" to "Copy Preferences"
- Fix incorrect word in Welcome migration log, "Migrating remove" to "Migrating remote"
- Fix Preferences internal search results position when preferences window is in full screen mode
- Fix variable substitutions in Copy to Clipboard Workflow output object when mode is set to Rich Text
- Add missing JSON configuration interface for v4 changes in Large Type workflow object
- Improve Alfred's border rendering in macOS Dark Mode
- Add in additional Usage Description request texts in info.plist
- Improve File Filter workflow object file search query formulation when {var:varname} substitutions are used in the fields
- Change the way Alfred displays the version and build number to remove the b for build
- Update eject commands to correctly eject after unmounting
- Allow Alfred's main window to be also repositioned on screen by dragging the hat
- URL recognition
  - Add option for default URL scheme when no scheme specified on typing URL into Alfred, http or https, defaults to https
  - Correctly recognise all valid characters for URL scheme, allowing for x- based schemes
- v3 Regression fixes
  - Fix showing result in default results when result has empty title and subtext
    - Tweak allowing direct input to e.g. Keyword Input with no title / subtitle to show clean input box with no results, but still allow actioning / mod-actioning
  - Fix missing "Write Text File" subtext on workflow object
- Dark Mode
  - Fix dark mode for Alfred's Remote Server config sheet
  - Make nearly black and nearly white in rich text editors convert to the controlTextColor to be dark mode compatible and to match pasting into e.g. TextEdit.app or Mail.app
- macOS Catalina changes
  - Added /System/Applications/ to Alfred's default search scope (note, you'll have to add this manually if you have previously customised the search scope)
  - Update how Alfred discovers application icons for features such as Calculator and Dictionary
  - Update Alfred Remote example pages to correctly discover applications
- Prepare for Alfred 4 corporate licensing

### Alfred 4.0.1

Build 1078, Thursday 30th May 2019

- Fix Welcome Window backup and migration logs to correctly show bright text in dark mode
- Add additional nil checking into internal search

### Alfred 4.0

Build 1076, Wednesday 29th May 2019

#### General changes

- Change bundle id to "com.runningwithcrayons.Alfred" for now and future
  - Future proofs major versions which will now share macOS App Support, cache folders etc
  - Removes name dependency when using AppleScript to call Alfred, now you can use tell application id "com.runningwithcrayons.Alfred" to search
  - Note: Also added a "Show Alfred" workflow object which should be used where possible instead of AppleScript call backs
- Add "Welcome" window when first launching Alfred
  - Pre-activation of Powerpack
  - Settings backup and migration of older preferences
  - Configure macOS permissions
- Hardened runtime support for macOS
- Improved, higher performance application caching for Alfred's file search
- Prevent multiple copies of Alfred from running if, for example, a workflow accidentally attempts to re-launch Alfred as a new process
- Hotkey display will now track the current keyboard layout (i.e. ⌘L in British layout will now correctly show ⌘N when switching the keyboard to Dvorak)
- Improve secondary-view input field / selection list text copy behaviour to match Alfred's main search field
  - E.g. allows for copy partial selected search term, or partial selected summary text from clipboard history viewer without overriding with "copy entire item" action
- Show correct fallback text when query is dynamically updated, for example, pressing = after a calculation to equate the answer
- Make 'alfred preferences' correctly match result to show Alfred's preferences in Alfred's default results
- Standardise big hat drawing between Workflows and Remote preferences when no workflow or page is selected
- Make QuickLook previews change dynamically when changing result item in Alfred's Default Results and File System Navigation
- Migrate and modernise many icons into PaintCode
- Show "this does nothing" notification when double clicking an alfredpreferences file
- Fix locale and macOS language discovery to correctly format dates
  - Fix applies to all places where dates can be used, e.g. Snippets, Workflow placeholders, Contacts
- Update mechanism for storing and reading preferences sync folder to prefs.json in Alfred's Application Support folder
  - JSON contains 'current' value, written at startup to help external scripts find Alfred's preferences if synced
  - Note, for the time being, the syncfolder is still written to the preferences plist for workflow libraries which may rely on this
- Migrate remaining http links to https (to force encryption where unspecified)
  - e.g. Contact URLs, Workflow website, Remote page examples, 1Password, user proxy settings
  - Also certain labels throughout the preferences now correctly show https

#### Preferences

- Overhaul to Alfred's Preferences
  - Easier to find preferences, and discover new features
  - New look with Dark Mode support
  - Performance improvements throughout
  - Consistency / layout refinements throughout
- Moved Application options from Advanced into Default Results feature
  - Added option to ignore app keyword metadata, now disabled by default due to strange Spotlight "SEO" practices by 3rd party apps
- Updated Features list order for improved relevance
  - Moved Clipboard and Snippets higher in feature list, renamed Clipboard feature to Clipboard History
  - Moved File Preview options from File Search into a top level Feature for better relevance and discoverability
- Ask for confirmation when resetting the default search scope, and if reset, also default to including folders in home
- Improved error reporting when workflows, snippets and snippet collections can't be moved to trash (e.g. due to a permissions issue)
- The previously selected feature is remember and reselected if the preferences is re-opened within 12 hours
- Added easier access to macOS Permissions in Alfred's General preferences
  - Add an example image of what to expect in the macOS Permissions preferences
- When adding fallback triggers, grey out triggers which have already been added so they can't be added twice
- Clean up General preferences tab, moving the Alfred Remote download link to the Remote tab

#### Preferences Search

- New search framework allowing for searching throughout Alfred's features
- Added search in Alfred's Preferences (accessible with ⌘F) to find and select preferences
  - Searching for 'hotkeys' will show all configured hotkeys
  - Searching for 'keywords' will show all configured keywords
- Add ⌘F to disallowed hotkeys for OS and Preferences consistency. This is now used throughout Alfred's Preferences for the "Find" function
- Added new '?' keyword to search and open Alfred's Preferences directly from Alfred's main search box
- When searching for a workflow object, the workflow selected object can now be opened in the canvas by pressing return

#### Snippets

- Rich text snippets
  - Rich text snippets, editable within the snippets editor
  - Automatic link detection in snippet editor, allowing for links in snippets
  - Rich text enabled snippets are prefixed with a asterisk in the snippet list
- Snippets searchable from Alfred's preferences search for quick editing
- Snippet sound improvements
  - Separated text expansion "play sound" option into individual options for Snippets and Workflow Snippet Triggers
  - Option to select the sound you'd like to play when expansion happens, including dropping custom sounds in
  - Sound now played after the expansion (instead of before) for improved latency
- Improve user experience when creating first snippet with no collections created
  - A new "Default Collection" is automatically created
  - Update table edit snippet buttons behaviour to always allow for adding snippets

#### Workflows

##### Improved Workflow debugger

- Concurrent debugging across all workflows with filtering down to individual workflows / selected objects
- Interactive navigation with clickable links in debugger taking you to relevant source objects in Workflow editor
  - Uses alfredpreferences: URL scheme allowing for links to be copied and used externally
- Add ⌘D to toggle Debugger when in workflow editor
- Copy button now copies both plain and RTF versions of the debugger to the pasteboard
- Debugger remains enabled when switching between workflows, and switching away from Workflows tab
- Size and visibility of debugger is remembered per session when switching / closing / opening workflows
- Make stderr messages turquoise unless the script exited with non 0 code
- Fix error logging from Run Script to separate stderr and error
- Truncate log messages over 100k characters to prevent poor workflow debugger performance
- Make {allvars} in the debugger correctly show unicode values
- Change the debug distributed message type so Alfred 3 doesn't see Alfred 4 debug messages

##### New Workflow objects

- Conditional Utility
  - If / else if / else conditional with single input and multiple outputs
  - Simplifies workflow stream flow
  - Adds greater than / less than comparison, where input and match strings are evaluated as integers
  - Drag reorder of conditions
- Split Utility
  - Split the single passed in query argument by a given delimiter, into multiple variables
- Random Utility
  - Generate a random UUID
  - Generate a random number with optional range
  - Pick a random word in a given list
    - Words are trimmed, and empty strings are removed
- Show Alfred
  - A simple utility to show Alfred's window with some text
  - Where possible, this should be used within a workflow instead of AppleScript to re-show Alfred as a "new window"
- Browse In Terminal
  - Simple action to browse the specified or passed in path in Terminal.app (or custom Terminal specified in Features > Terminal)
  - Will work with multiple passed in paths, for example, Hotkey file selection (multiple files selected) > Browse in Terminal

##### Improvements and new features for existing Workflow objects

- Hotkey Trigger
  - Added the Find Pasteboard to the available Argument sources
    - Allows for simple integration into the macOS Find Pasteboard (Note that you can use ⌘E in a Mac app to add the current selection to the Find Pasteboard)
- External Trigger
  - Update generated example AppleScript to show new application bundle id
- Snippet Trigger
  - Small tweak to Snippet Trigger object warning text (when Auto Expansion is disabled) to ensure it's not truncated
- Keyword Input
  - Removed constraint on title needing to be filled to save object
  - Change "required" in Keyword placeholder text to "Recommended"
  - Updated fixed inputs (e.g. a hotkey wired into a keyword input) to show a simple Alfred input box with no results when the keyword Input has no title and subtitle
- Script Filter Input
  - Added option to not set argv when query is empty (under "Run Behaviour" button)
    - This will be the default behaviour for newly created Script Filter objects. Current objects will be set to pass an empty string to prevent regression issues.
- File Filter Input
  - Added result sorting options: Alfred's Knowledge (default), Created Date, Last Modified Date
  - Added option to set the result limit from between 10 and 200 (use larger values with care as this can cause file search performance issues)
  - Variable placeholders can now be used in the Fields > Search Fields > Value column for easier dynamic creation of file filters (would previously necessitate a JSON Config utility)
- Filter Utility
  - "Ignoring Case" option now also available to Regex matches
  - Add {query} placeholder string on config input field to reinforce default value, set default value to empty
  - Marked as "Legacy Object", recommending the use of the "Conditional Utility" instead
- Replace Utility
  - Added additional options for Regex option
    - Added option for Case Insensitive matching
    - Added option for Multi-line which causes ^ and $ to match the beginning / end of each line instead of beginning / end of whole string
- Play Sound Utility
  - Ability to drop a new audio file into the configuration sheet to configure with this sound. The sound is copied into the workflow folder on saving.
  - No longer limited to m4a and aif files, will also accept others sound types as mp3
- Copy to Clipboard Output
  - Added rich text support with RTF editing directly within the config
- Large Type Output
  - Added styling options for font, colours and alignment
  - Added background fill selection and fade in speed
- Reveal in Finder Action
  - Added config UI allowing for configuration of passed in path, including static paths
- Transform Utility
  - Rename Camel Case transform to Capital Case to better match operation and placeholders

##### Placeholder syntax enhancements

- Placeholders improved with standardised syntax {placeholder:variation.modifier}
  - Added trim transform modifier to trim newlines and white space from the placeholder
  - Added reverse transform modifier to reverse the placeholder
  - Added stripdiacritics transform modifier to remove accented characters from the placeholder
  - Added stripnonalphanumeric transform modifier to remove any non-alphanumeric characters such as punctuation or emoji from the placeholder
  - Added capitalcase transform as alternative to capitals for consistency
  - Transform modifiers are now also available to variables and clipboard history items e.g.
    - For variable named result, transform to uppercase using {var:result.uppercase}
    - For a historic clipboard item, trim using {clipboard:2.trim}
  - Transforms can now be stacked, e.g. {var:result.trim.uppercase} or {clipboard:trim.stripdiacritics}
  - As with Alfred 3, use {clipboard} for current clipboard contents, and {clipboard:0} for latest item from Clipboard History
  - Variables names should take the format [A-Za-z0-9_]. This is now correctly warned against with orange highlight in the Arg/Var Utility and Workflow Environment Variables
  - Updated in-app placeholder examples and help subtext to use updated syntax

##### General Workflow improvements

- Fix default workflow list configuration to show creator
- New 'random' dynamic placeholder, available in many areas of Alfred such as snippets and the arg/var utility
  - {random:UUID} for a random uuid
  - {random:1..5} for a random number between 1 and 5. These numbers can be omitted for min / max integer range
  - {random:cheese,apple,biscuits} for a random word from the specified list of words
- Show an error sheet when the workflow being imported is invalid rather than failing silently
- Tweaks to workflow icons
- Added an option to "Export Metadata" for a workflow as a json file
- Fix issues which may occur when duplicating a workflow
  - Clear bundle id for newly duplicated workflow to prevent two workflows with the same bundle id
  - Fallback Triggers with matching underlying UIDs in different workflows no longer cause an issue
- Standardise default placeholder behaviour when {query} based input fields are empty
  - e.g. OpenURL will now accept an empty URL field and assume {query}
  - Improved descriptive placeholder text instead of just {query}
- Change order of workflow canvas top right buttons to Variables, Remote Pages, Export, Debug
- New Workflow Export sheet
  - Important workflow fields can be verified and amended before exporting workflow
  - Enable "Hide Extension" option in Workflow Export save dialog (the selected preference is persisted)
- New Workflow Import sheet
  - Workflow environment variables are now presented and editable on import
- Framework tweak to facilitate more robust retain / release cycle for injected workflow into workflow objects
  - More reliable snippet trigger decommissioning and dealloc when deleting a workflow
- Fix Remote Page config layout in features and workflow sheet to be consistent (and not have white line to left in workflow sheet)
- If no scheme is defined for workflow website, default to https when opening site from arrow
- Show variables in orange as warning in workflow object configuration (e.g. Snippet Trigger, Hotkey Trigger, Split Utility) when variable format isn't correct
- Add AppleScript for force reloading of a workflow by the given UID (folder name), or Workflow Bundle ID
  - e.g. tell application id "com.runningwithcrayons.Alfred" to reload workflow "workflow-folder-name"
  - Reports error when workflow isn't found by UID or Bundle ID
- Workflow mod connection improvements
  - Workflow Connections
    - Modifier combinations can now be selected in the connection configuration sheet
    - Canvas now shows modifier characters on connections to better accommodate compound mods
    - Modded characters are rendered slightly larger, and background box is more rounded for non-vetoed connections
  - Script Filter
    - Add compound mod overrides for script filters. Use a + in the JSON for mode than one mod, e.g. cmd+shift
    - Recognise old and updated Apple terminology for mod key definitions in returned JSON e.g. option or alt, ctrl or control, cmd or command

#### Actions

- Actions moved out from File Search feature into own feature
- Fixed result limit when searching in Open With, Copy/Move actions to match the shared result limit in Features > File Search
- Updated underlying "Open Terminal Here" action to open the passed folder/item in Terminal app directly rather than using AppleScript
  - Make "Open Terminal Here" file action work with multiple files (e.g. from the Buffer)

#### Theming

- Automatic macOS Mojave Dark Mode support
  - Alfred will now remember the themes you have set in dark and light mode for automatic theme switching
- New theme editor
  - Editing guides while moving the mouse around to see what is being edited and sized
  - Clarified dynamic help text while editing a theme
  - Added ability to select font variations based off of the currently selected font (e.g. bold, italic)
  - Added macOS Font Collections to the font popup menu, allowing access to both system and user created font collections
- Re-written Alfred's font rendering engine, allowing for more predictable font vertical alignment with obscure fonts
- Fix theme editor theme list to be case insensitive sorted
- Fix search box height sizing calculation (with certain fonts e.g. Avenir)
  - Note that imported v3 themes may have decreased vertical padding around the search field depending on font (this padding can be added readjusted in the theme editor)
- Added new default themes, tweaked current themes for consistency

#### Contacts

- You can now cmd+return on a contact in Alfred's default results to perform the alternate opening action
  - If you have contacts configured to open in Alfred, cmd+return will open them in Contacts.app
  - If you have contacts configured to open in Contacts.app, cmd+return will open them in Alfred
- Ensure Alfred correctly hides after opening a contact in macOS Contacts app using ⌘O

#### Remote

- Updated the Clipboard Snippets object to work with Rich Text, including inserting RTF snippets
- Tweak the remote prefs no-page selected background colour (Note that further changes are due on this)

#### System Commands

- Improvements to Eject and Eject All
  - Updated method of unmounting 10.11+
    - Predictably unmounts individual mounts on a single device
    - If the volume is encrypted, it is relocked after being unmounted
    - Error reporting now shows more details, such as which app is currently preventing a volume from being ejected
  - Blacklisting
    - Volumes in the eject blacklist can now be edited by double clicking on them
    - The volume blacklist can now contain wildcards (and simple character classes) e.g. [Bb]ackup*
    - Added com.apple.TimeMachine* to default volume blacklist
    - Add "Reset" button for eject blacklist in Features > System preferences

#### File System

- Added dynamic sorting of files to file system navigation
  - Sort by name, creation date and last modified date
  - Option to always sort Folders to the top
  - Sort ascending and descending (click arrow button, or use ⇧⌘S shortcut)
  - ⇧⌘, shows the popup menu for sort options to allow for sort configuration directly from the keyboard
  - Showing and hiding the navigation preview panel shortcut is performed with ⇧⌘I
- Update to File Search workflow object for significantly more flexibility, see workflow changes
- When searching for a "documents" folder, append the iCloud container name for Document folders within iCloud
- Update Alfred's File Metadata Querier framework to work more consistently with the new {var:...} placeholder ability
  - Now treating variables in the same way {query} is treated
  - Remove default query fallback, as it's no longer relevant
  - User defined scope folders are now not manually parsed / included into results under certain scenarios:
    - A filter where a constant string value defined for a field which isn't "display name" or "alternative name" won't include scope folders in the filter's results
    - Any filter fields which are marked as "not" won't be included in the scope folder search
- Improvements to File Buffer
  - Show symbol against a result in Alfred's default results and file system navigation when it is added to the buffer
  - Update ⌥↑ shortcut key to toggle item in the buffer, instead of just add
  - Add shortcut help text to tooltip when hovering over buffer item
  - Make Alfred File Buffer aware of drop "move" operations, and remove files out of the Buffer on drop when the path is no longer valid
  - Fix File Buffer to predictably show hover-over information on initial mouse over
- Overhaul drag and drop of files out of Alfred to now better conform to modern macOS behaviour

#### Web Searches

- Default to https prefix for non-prefixed URLs typed into Alfred's main window
- Removed optional HTTPS on system web searches, always forced to HTTPS now.
- Custom search improvements
  - Added "Lookup..." button to attempt to automatically look up the specified website hosts using OpenSearch or SearchAction
    - Lookups can only occur for https domains. if no scheme is typed, Alfred will assume https
    - Useful keyboard shortcuts in the Custom Search panel for fast adding of custom searches without the mouse
- Web searches searchable in Alfred's preferences search
- Updated system web search icons to more modern equivalents

#### Large Type

- Fix font vertical alignment issues with certain fonts
- Make large tight text slightly less tight to the edge of the screen
- Configurable Large Type workflow output object

#### Calculator

- Update calculator to recognise ÷ as divide symbol

#### Powerpack

- When activating the Powerpack, if unnecessary additional text is pasted into the fields, try to discover and extract the email address and Powerpack code
  - Warn user on certain "known" mistypings in email address by highlighting in orange, for example: @gamil.com

The Alfred 3 Change Log is still available for your browsing pleasure!

### Latest Blog Post:

Alfred 6 Expanded Sneak Peek

---

### 3.3 Alfred 3

> Pagina ufficiale: `https://www.alfredapp.com/changelog/v3/`

### Alfred 3.8.6

Build 972, Tuesday 17th December 2019

- Back out default file search sorting from 3.8.3 due to potential performance issues under certain circumstances

### Alfred 3.8.5

Build 970, Thursday 24th October 2019

- Update Rotten Tomatoes web search to use %20 instead of + for spaces

### Alfred 3.8.4

Build 968, Tuesday 8th October 2019

- Ensure that Dictionary and Calculator app icons correctly show for associated Alfred features in macOS Catalina

### Alfred 3.8.3

Build 967, Monday 9th September 2019

- Add default sort order back to file metadata query to ensure most relevant results before Alfred has accumulated internal knowledge
  - You should see a significant improvement to Alfred's default ranking of results, and more relevant file search results presented
- macOS Catalina preparation and improvements
  - Update Alfred's Features preferences tab to correctly source new Catalina icons
  - Update Alfred Remote example pages to link to the updated applications
  - Separate Applications in default search scope to dynamically add new Catalina app location
  - Add iCloud Drive updated location to default search scope (If user modified, you will need to reset your default search scope to have this added)
  - Disable iTunes Mini Player in macOS Catalina, as app and underlying support has been removed by Apple
    - Note: We are working on Music.app compatibility in Alfred 4
- Prevent duplicates from being added to generated search scope list
- Update Alfred Remote built in web page examples to use https
- Modify the Update preferences to quantify "latest version" of version 3 with the sentence "You are using the latest version of Alfred 3."
- When compiling internal AppleScripts, move error reporting to main thread to prevent oddities

### Alfred 3.8.2

Build 963, Friday 31st May 2019

- Add banner in Alfred's preferences to tell you that Alfred 4 is available
  - Banner can be permanently hidden
  - If you'd like to upgrade to Alfred 4, download from https://www.alfredapp.com/
- Show error if trying to launch Alfred 3 when Alfred 4 is running, preventing potential conflicts
- Fix buffer popover window transparency

### Alfred 3.8.1

Build 961, Wednesday 13th March 2019

- Make theme editor correctly fade background image in (regression after updating toolset to Xcode 10)
- Fix shadow rendering in Alfred theme editing to make colours match between real and editor themes
- Fix crash in certain scenarios when attempting to eject an external drive which is currently busy
- Tweak to table editing in Arg/Var utility to work around Mojave rendering bug
- Update Amazon Japan URL from .jp to .co.jp to avoid unnecessary redirect

### Alfred 3.8

Build 959, Saturday 2nd February 2019

- Updated toolset and build to Xcode 10
  - Apple Notarisation for deployment
  - Hardened runtime for macOS 10.14
  - Work around macOS 10.14 transparency issues
  - Add NSAppleEventsUsageDescription for AppleScript event integration
- Work around a macOS Mojave text rendering issue where Alfred's font weight was lighter than required
- Make sure the key combo view fires an update when using the right-click popup menu to set the mod chars
- Remove backspace to delete selected collection in Alfred's Snippet Preferences to prevent accidental deletion
- Add in ideographic space keyword separator recognition for filter based queries (file search, script filter, dictionary etc)
- Work around Google Chrome issue where snippet auto expansion doesn't always function as expected

### Alfred 3.7.1

Build 946, Monday 17th December 2018

#### General Fixes and Improvements

- Enable 1Password multi-URL per bookmark integration (after a tweak in 1Password itself)
- Add default snippet order (name) to the snippet viewer when filtering. Exact snippet keyword matches, followed by keyword prefix matches are still sorted to the top
- Ensure that Alfred's snippet expansion works as expected with the macOS Accessibility Virtual Keyboard
- Fix "Launch Apps / Files" workflow object to correctly toggle visibility for symlinked apps
- Tweaks to preferences xibs to remove deprecated parameters
- Add new option to ignore Universal Clipboard data within Alfred's Clipboard History, preventing "Pasting from x" macOS dialog (Requires macOS 10.13 High Sierra and above)
- Show generic clipboard icon for Universal Clipboard data instead of currently focused local app in Alfred's Clipboard History (Requires macOS 10.13 High Sierra and above)
- Show colour preview in Clipboard History view for hex without leading hash
- Update Alfred's force keyboard language advanced setting to work more reliably

#### Improvements for macOS Mojave

- Force clear background colour to Alfred root window to improve rendering behaviour in macOS Mojave
- Fix issue in macOS Mojave where Alfred main window isn't correctly released, causing unexpected behaviour
- Work around macOS Mojave indexing issue where Applications have incorrect metadata file type information causing missing icon and duplicate results
- Fix Workflow List Filter config in Mojave to correctly live-update table when entering a list item's details

### Alfred 3.7

Build 938, Thursday 13th September 2018

#### General Fixes and Improvements

- Tweaks Alfred auto-updater to be more reliable with macOS Mojave
- Consolidate Alfred Text Helper into Alfred's core for future proofing with macOS Mojave
  - Add new request dialog on first start of Alfred to request permissions
  - Add a "Request macOS Permissions" option to the Alfred Status Bar menu if permissions aren't currently granted
- Fix empty workflow filter file search results in certain situations when suffixing a search term quickly with a space
- Fix Script Filter result mod override variables to correctly inherit upstream variables
- Fix clipboard history image preview to correctly render on retina displays
- Additional integrated URLs updated from http to https, for example, the Apple Maps link in the Contacts viewer

### Alfred 3.6.2

Build 922, Wednesday 11th July 2018

#### General Fixes and Improvements

- Ensure that default double tap based hotkeys are correctly deregistered when clearing the hotkey field in Alfred's preferences
- When processing text placeholders, evaluate the clipboard placeholder to an empty string if there is no suitable plain text entry in the current clipboard
- Improve Alfred startup efficiency, specifically workflow snippet trigger initial caching
- When deleting workflows and snippets (also snippet collections), these are now moved to the Trash instead of removed
- Fix Large Type preferences to correctly show for non-Powerpack users (regression when moving them from Appearance to Features)
- Prevent file filter from holding on to macOS metadata query exclusivity if the query keyword is edited within Alfred to match a different file filter
- Add troubleshooting button to Powerpack activation error sheet
- Fix specific floating point precision rounding issue in calculator
- Recognise longer TLDs when typing in a URL to open
- Increase workflow import sheet to allow for help subtext to properly fit
- Improve help subtext for various features in Alfred's preferences
- Add official support for 1Password 7
- Add "Tap to confirm" option in Alfred Remote for running workflows, similar to system commands
- Fix Filter workflow object to treat arrays as strings when processing, instead of just halting if an array (e.g. of files from hotkey selection) is passed in
- Initial set of tweaks for macOS 10.14

### Alfred 3.6.1

Build 910, Monday 9th April 2018

#### Workflows

- Improve CSV drag and drop import in "List Filter" input object configuration sheet, more closely adhering to RFC 4180
- Enhancements to the "Dispatch Key Combo" workflow object
  - Added popup with ability to add and remove key modifiers allowing for dispatching of combos which are otherwise macOS reserved (e.g. cmd+tab)
  - Added option to clear key combo
- Fix new "set config" AppleScript command for smoother operation
  - If a currently running workflow calls set config on itself, the workflow will continue running
- Small tweak to workflow editor to better handle unexpected missing workflow data
- Fix insert placeholder button on "Write Text File" output object to correctly insert placeholders into editor view
- Fix spelling of overridden in "Run External Trigger" output object
- Clarify the subtext relating to variables in the "Call External Trigger" trigger object
- Fix correctly passing workflow configuration (environment) variables out of a "Call External Trigger" trigger object
- Tweak incompatible python library check for macOS 10.13+

#### Accessibility / VoiceOver Improvements

- Selected default results now gives context and more information
- Subviews now better contextually read results (Clipboard / Snippet Viewer, File System Navigation, File Actions)

#### General Fixes and Improvements

- Improvements to calculator locale recognition and usage (separator / grouping)
- Fix Finder quitting when using quitall command in macOS 10.13, non-English locale
- Fix stuck buffer popover text on macOS 10.13 when popover is currently visible and Alfred window hides
- Updated IMDB default web search to be https now that IMDB supports this
- Fix rendering quirk in clipboard viewer after deleting clipboard items and all items are individually deleted
- Compatibility improvements for the new 1Password 7 Beta (and future general release)
- Update Ask and Ebay default web searches to https and latest URL scheme

### Alfred 3.6

Build 903, Wednesday 14th February 2018

#### Bookmarks

- Improved Google Chrome support
  - Better discovery of profile folder when there is a single profile
  - Ability to select profile if more than one profile exists (in Alfred's Web Bookmarks feature preference; not synced, so selected profile can be different per machine)
- Improved, more consistent bookmark search behaviour
  - Now matches arbitrary word order in search query
  - Flatten unicode space characters for better international word boundary support
  - Bookmark's folder will now be matched regardless of location in the typed query

#### Text Expansion, Snippets and Clipboard

- Added new snippet search options (in Features > Snippets preferences)
  - Snippet content can now be optionally searched in the Snippet Viewer and from the Snippet keyword
  - Snippet word matching mode can now be disabled allowing for broad non-anchored search to match the clipboard history search
- Added new option to enable diacritic and unicode case insensitive searching of clipboard history items
  - Note that with very large clipboard databases, this can have an small effect on performance as Alfred implements a custom SQLite function for matching
- Snippet Viewer and Snippet keyword now give consistent results
- Clipboard history and snippet search now treats query spaces as wildcards for wider result matching
- Improve reliability of sequential snippet expansion (one snippet immediately followed by a second snippet)
- Improve snippet time / date placeholder regex recognition to be more precise
- ⌘S on a selected snippet in the Snippet Viewer now edits the snippet in Alfred's Preferences

#### Large Type

- The Large Type options have been moved from Appearance > Options to the Features preferences to make it more discoverable
- Added new option to set the Large Type font

#### File Search / Navigation

- Add ability to toggle visibility of preview view in Alfred's File System Navigation view. New button in bottom right of navigation view with shortcut ⇧⌘I
- Updated search handler to perform less overall queries for lower resource usage
- Prioritise files above bookmarks in the default file search, i.e. file types selected in Alfred's Default Results preferences
- macOS 10.13 file search improvements
  - Force default macOS metadata query sort order to be more predictable for when Alfred has no internal knowledge in macOS 10.13 (change backed out after Apple fixed bug in 10.13.2)
  - Moved metadata query result handling off the event thread for improved responsiveness
- Added subtext to file search placeholders (open, find, in, tags), and added a please wait message if macOS response is slow
- Fix small memory leak in file actions preview panel

#### Workflows

- New AppleScript to set and remove workflow configuration variables (See AppleScript dictionary)
- Fix connection rendering quirk when adding new objects in canvas by dragging to empty space
- Also migrate the "with space" option on input objects when updating a workflow with "Migrate my settings" selected
- Fix AppleScript Run Command definition to make the trigger id argument non-optional
- Fix help button link in workflow about / environment variables sheet

#### General Fixes and Improvements

- Minor tweaks to default result item re-selection logic and performance
- Fix selected shortcut highlight colour in secondary view selection lists (e.g. navigation and actions views)
- Modernise web search icons for YouTube, Gmail and Weather
- When using macOS High Sierra and Alfred's Lock command, Alfred will now simulate cmd+ctrl+q for instant lock
- Add iTunes Mini Player playlist local (non-synced) suffix for unique Alfred playlists per Mac (Improves Mini Player behaviour when iTunes is syncing playlists)
- Pressing return on terminal command keyword with no command typed now correctly sets it as the only visible result (framework tweak)
- Tweak to threading for background image loading in preferences Appearance tab to ensure integrity of UI thread
- Deferred creation of Alfred Preferences package initial subfolders until they are needed, which reduces potential syncing conflicts when first setting Alfred up on multiple Macs and the initial Mac's preferences haven't fully synced / propagated
- Added additional information when setting up syncing, including a warning when user selects iCloud Drive
- List of preferences unique to each Mac when syncing moved from Advanced preferences to syncing help page, added help button linking to syncing page

### Alfred 3.5.1

Build 883, Wednesday 18th October 2017

#### General Fixes and Improvements

- macOS High Sierra 10.13 fixes
  - Fix alphabetically sorting files in Alfred's File System navigation with APFS
  - Fix window transparency issue when showing inline QuickLook preview view in File System navigation / Clipboard History
  - Fix recent documents file action to correctly load new High Sierra recent document format
- Bookmark feature improvements
  - Improved matching on new bookmarks feature, better respecting arbitrary word boundaries
  - Fix UTF-8 case insensitive searching of bookmarks
  - Fix wording on bookmark searching placeholder to "Search Bookmarks" when using a keyword
  - Lower default priority of bookmarks in default results, to e.g. allow calculator to come above matched bookmark
  - Improved Google Chrome bookmark discovery for default bookmarks
  - Allow empty bookmark titles when importing. When the title is empty, Alfred displays the url host instead
- 1Password improvements
  - Don't show the 1Password auto-generated passwords, as these add irrelevant noise to the 1Password results
- Text Expansion
  - Ignore repeat (key held) characters which can lead to unwanted text expansions

### Alfred 3.5

Build 875, Monday 25th September 2017

#### NEW: Bookmarks Feature

- Added new "Bookmarks" feature for indexing and searching bookmarks, removing dependence on macOS metadata
  - NOTE: If previously including bookmarks in default results, this option will need to be re-enabled in Features > Bookmarks
  - Fixes bookmark searching in macOS 10.13 where macOS metadata has been removed
  - Currently supports Safari and Google Chrome
    - Note that the option to select Safari and Chrome are not synced to allow different per-Mac settings
  - Now searchable in default results or via keyword (convenience vs lower noise)
  - Bookmarks are matched by title, hostname, or folder when searching
  - Option to open bookmarks in the macOS default browser, or the bookmark's respective source browser

#### Workflow Improvements

- Improvements to Script Filter workflow object
  - Significant enhancements regarding Alfred filtering JSON output results
    - New Match Mode options, for word boundary, exact or word based matching, available from cog next to "Alfred Filters Results" checkbox
    - New JSON "match" property (string) to override default "title" matching
    - Updated help pages for Match Mode (additional contextual help button on Match Mode sheet), and JSON output spec
  - Fix per-item result variables in JSON output (was incorrectly compounding result item variables)
  - Improve efficiency of 'rerun' flag in JSON output, preventing unnecessary reruns from occurring
    - Now uses a serial operation queue, and only reruns the very last requested rerun after script execution triggered by user input
  - Fix dynamic configuration of object fields (when passing JSON into object input)
  - When JSON defined 'rerun' is out of range (<0.1 or >5), give a debug warning instead of a hard error. Rerun flag is ignored if out of range
  - Fix workflow connection logic issue when using JSON mod overrides with no matching configured mod connection
    - Now correctly respects the default (non mod) connection window behaviour configuration
- Fix "Snippet Trigger" to correctly enable and disable when the parent workflow is enabled and disabled
- Fix field tabbing in "Fallback Search" trigger object configuration sheet
- Fix correctly updating file path field in "Open File" action object configuration when deleting item from left path icon box

#### Clipboard Improvements

- Performance tweaks to Alfred's Clipboard Manager, specifically when new clipboard content is recognised
- Improve snippet text auto expansion behaviour when Caps Lock is enabled
- Fix snippet date placeholder regex to allow multiple date placeholders on single continuous line

#### General Improvements

- New Fallbacks option to show fallback searches in default results, even when there are results
  - If specified in Alfred's Default Results feature, Alfred will show fallbacks at the bottom of the results list...
    - Unless a search item has been selected, e.g. pressing return on the 'open' file search or on the 'google' web search
    - Unless a workflow has a fixed input, e.g. a chained workflow input, or a hotkey wired to an input
- Updated logic on maintaining and releasing the currently selected result in the default results list
- Framework and performance improvements involving Alfred's workspace manager
  - Fix window visibility event order to make sure app specific hotkeys (specifically, hotkeys set to be active when Alfred is visible) are correctly registered
- Add AppleScript command for showing Alfred's Actions Panel for the given file
  - e.g. tell application "Alfred 3" to action "~/Desktop"
  - This accepts one or more paths as the argument
- Add AppleScript command for showing Alfred's File System Navigation with the given path / search string
  - e.g. tell application "Alfred 3" to browse "~/Desktop/"
- Alfred Framework updates for better macOS 10.13 compatibility
- Reduce blur radius on default "Frosty Teal" theme for higher performance in macOS 10.13

### Alfred 3.4.1

Build 860, Friday 21st July 2017

#### Workflows

- Update Script Format JSON output with new features
  - Add per item (and per item mod) variables which are passed out of the object on actioning the result
  - Add per mod customisable images (i.e. dynamically change the result icon when a user holds a mod key)
  - Please note that, as the Script Filter XML output is legacy, it remains unchanged
- Fix Script Filter default fallback image order if no icon specified in JSON/XML
  - Fall back to Script Filter icon first, then Workflow icon
- Prevent incompatible workflows from loading in macOS 10.12.4+ if they contain an older version of 3rd party library Alfred-Workflow
  - Give link to troubleshooting page to automatically update and re-enable these workflows
  - Use new separate view for 'no workflow' and 'incompatible workflow' display in workflow editor, giving more future flexibility
- Add new "Snippet Trigger" getting started guide to + button of the workflow editor
- Fix snippet database cache to correctly update when snippet triggers are duplicated
- Reduce workflow trigger connection constraints, allowing new Snippet Trigger to be connected to input objects
- Tidied rendering of hotkey object in workflow canvas, removing gradient
- Update workflow import message, notifying that snippet triggers are also stripped on new workflow import
- Improved workflow save performance, removing some unnecessary saves

#### General Improvements

- Fix unexpected unicode search behaviour in file system navigation
- Intelligent removal of ' quick-search prefix when showing fallback searches
- Add tel:{query} as suggested custom URL scheme for phone numbers in contacts integration
- Reorganise and standardise simulated key event framework for text expansion and clipboard pasting
- Replace text expansion "Slow down simulated key events" option with slider from Fastest (default) to Slowest
- Add help button on Snippet Expansion config sheet in preferences
- Add option to restore clipboard contents after using Snippet Viewer for snippet (option shared with snip keyword)
- Add option to allow data marked as concealed in clipboard history, concealed data ignored by default
- Fix Alfred Text Service icon to properly hide after accessibility is enabled
- Fix Screen Saver system command in macOS 10.13
- Reduce blur radius and increase opacity of default themes for higher performance in macOS 10.13

### Alfred 3.4

Build 850, Monday 19th June 2017

#### Clipboard and Snippets

- Added advanced scripted text expansion using a new Workflow 'Snippet' trigger object
  - Type a snippet keyword into any macOS window to directly run a workflow
  - Dynamically create snippet content using the power of Alfred's Workflows, then automatically paste back to app
  - Enables multi-part text expansion such as form filling
- Added new {datetime} placeholder which allows for simple combined date and time formatting with short, medium, long and full
- Added date arithmetic to date placeholders throughout Alfred
  - Supported (Y)ear, (M)onth, (D)ay, (h)our, (m)inute, (s)econd
  - e.g. {datetime +1Y -2M +2h:medium} (See context help for more syntax examples)
  - Arithmetic can be stacked, i.e. add and subtract multiple days in single equation
- Add a new "Placeholder" helper button to the bottom left of text areas which support placeholder replacements (Workflow / Snippet / Remote)
  - Added insertable examples for date, time, clipboard and cursor
- Added per-collection snippet keyword prefix and suffix
  - Allows better and faster control over how and when snippets are found and auto-expand
  - Collection prefix and suffix are edited per collection, but shown per snippet in table
  - Improved collection display in preferences, with snippet count, prefix and suffix shown
  - Prefix and suffix are exported and imported with collections
- Added toggle to enable or disable entire snippet collections
  - Applies to (Clipboard) Snippet Viewer, Snippet keyword and Snippet auto expansion
- Add batch editing of auto expansion for selected snippets
- Tidy up the snippet collection preferences to better match Alfred's preferences
- Added option to duplicate a snippet from the context popup menu in the Snippet feature preferences
- Update Snippets feature preferences search to also search snippet content
- Fix snippet keyword conflict highlighting in Snippet feature preferences table
- Fix issue where Clipboard History could miss an entry from an app which clears clipboard content, and delays before repopulating copied data (seen with Maps.app)
- Improvements and simplifications to the snippets and snippet collection framework (for performance and robustness)
- Added context help button to Snippet Collection edit sheet, and updated help link on Collection edit sheet
- Fix snippet placeholder processing order to prevent double processing of certain clipboard placeholders
- Small tweak to Automatic Snippet Expansion to make conflicting keyword expansion more predictable (now always expands first matching one)
- Ignore org.nspasteboard.ConcealedType pasteboard types for clipboard history

#### Workflows

- Add 'Snippet' Trigger workflow object to support new scripted text expansion feature, detailed above
- Add workflow editor Object Alignment Guides for easier object layout, available from the workflow canvas popup menu options
  - Alternatively, hold the 'option' key while hovering items on the canvas to see alignment guides
- Added option for not trimming script filter argument, for when spaces are significant to your workflow
  - Updated the trimming of Input Filter arguments to be more intelligent
- Add dispatch "Count" option to the Dispatch Key Combo output object; Dispatch a key combo between 1 to 10 times
  - If count is set greater than 1, count is shown on workflow object in canvas
- Output an AppleScript error on calling Alfred when the workflow id or trigger id is not found, or if the workflow is disabled
  - See context help for "External" Trigger workflow object for error codes
- Fix border rendering around Dispatch Key Combo output object input field when view doesn't have focus
- Fix tab field focusing order on OpenURL workflow action configuration
- Fix initial focus on keyword field in Dictionary Filter input object config sheet
- Fix unexpected behaviour when pressing - button during editing of a new workflow environment variable value
- Fix incorrect visual selection after using insert object from the popup menu
- Cleanly close STDIN for workflow Scripts, preventing scripts wanting standard input from waiting indefinitely
- Update URL validation in OpenURL object configuration to be aware of variables
- Small tweak to workflow object config sheet layout to better line up UI components
- Ensure that the workflow list is correctly updated when a workflow is saved (e.g. last modified date)
- Overhauled and simplified workflow import framework code, specifically with migrations
- Update workflow script editor text area, now shows the empty script / default script suggestion as grey text
- Improve debug output for Script Filter, showing queued and run arguments
- Add help hint on Terminal Command config page, suggesting Run Script as alternative
- Improve mouse tracking calculation within Workflow canvas, preventing tracking when hovering over debugger
- Show error message in Alfred's Preferences when Alfred is unable to save a workflow (e.g. permissions issue)

#### File System

- Show the Finder "Display Name" in File Actions panel for better consistency (specifically for file extensions)
- Update global action's "File Selection" hotkey to be Alfred aware, now works within Alfred's default results and File System navigation

#### iTunes

- Updated behaviour track transport controls
  - Now better compatible with special case playlists such as Genius
  - Added new "back" track command, matching Apple Keyboard / iTunes intelligent behaviour of restart or previous track
  - Updated iTunes Mini Player previous track button behaviour to the new "back" behaviour
  - Updated Alfred Remote with new "Back Track" option, with associated example template
  - Updated iTunes Action workflow object with "Back Track" option, with associated workflow template

#### General Improvements

- Update LinkedIn search in default web searches to latest URL
- Add a help button next to the main Alfred hotkey, linking to hotkey help and troubleshooting
- Fix quirk when right clicking for popup menu within Alfred's preferences when window isn't key
- Increase auto-updater timeout interval to 60s for users on very poor network connections

### Alfred 3.3.2

Build 818, Monday 11th April 2017

- More robust threading for define and spell keywords
- Fixed eject blacklist, now respects mounts in sub folders under /Volumes/
- Improved experience when first starting Alfred Text Service (Snippet expansion) and granting accessibility access
- Added option to restore clipboard contents after using snip keyword, to match snippet auto expansion
- Respect the file preview options (don't show x types, don't show if in y folder) in clipboard history preview
- Flatten ’ (curly single quote) in iTunes mini player indexing and search (currently only flattening straight ')
- Update Alfred's built toolset on fresh new mini build server, shiny!
- Added helper to aid Corporate Powerpack license deployment

### Alfred 3.3.1

Build 806, Monday 27th February 2017

- Improved logic on when to launch files and apps in background, prevents macOS launch dialogs from hiding behind Alfred window
- Fix pop-up menu from hat in main Alfred window to show with ctrl+click as well as right-click
- Fix Open With file action to correct respect Full Fuzzy app matching advanced preference
- Action panel left text side now expands to fill with wider themes instead of right preview side
- A few small layout tweaks for macOS 10.9

### Alfred 3.3

Build 801, Wednesday 1st February 2017

#### Clipboard and Snippets

- Added new {clipboard:x} placeholder to obtain items from Alfred's clipboard history, where x is the history offset
  - e.g. {clipboard:0} is latest, {clipboard:1} the previous item and so on
  - This can be useful for snippets / snippet expansion to perform clever custom merging of the clipboard
- More efficient pre-processing of snippet results when using snip keyword
- Add "Rename" on popup menu for selected snippet collection
- Add "Edit" to popup menu for selected snippet
- Move {clipboard} processing to after {date} / {time} processing for most predictable and consistent output

#### Workflows

- New icons for workflow objects
- Add {date}, {time} and {clipboard}, {clipboard:x} style placeholders to relevant objects
  - Added to Write File and Large Type Workflow Output objects
  - Added to Arg and Var / JSON Utility objects
  - Note that this inherently also adds {clipboard:x} to the Copy to Clipboard Output object
- Added new "Clipboard" Getting Started guide to demonstrate new workflow features
- Fix regression preventing workflow File Action trigger from saving custom action icon
- Improved behaviour when adding Getting Started / example / template workflows, adding to currently selected category
- Updated spell / define input filter to work asynchronously, resulting in smoother performance
- Fix layout issue in Write File object configuration sheet for "Allow empty files" tick box
- Updated "All Workflow Objects" Getting Started guide with new objects
- Updated 'Should I watch this movie' example workflow

#### 1Password

- Added vault selection to hide specific vaults from Alfred's results
- Added option to "Only show Logins" if you aren't interested in seeing all 1Password data in Alfred's results
- Added separate columns for 'type' and 'vault' added in 1Password feature preferences
- All 1Password columns are now sortable in the preferences item preview table
- Recognise multiple URLs in a 1Password web login and show separate entries in Alfred's search results

#### File System

- Overhauled file interactions, moving back to using Finder / AppleScript for copy, move and delete
  - Now gives a more useful feedback notification when the action fails
  - Correctly deals with permissions and app translocation
  - Gives Finder progress for larger files
- Improved, simplified logic in file actions view
  - Now also recognises file packages
- Added default cmd+i shortcut on selected file results to show Finder's Get Info view
- Added 'Macintosh HD' to the default eject blacklist

#### Alfred Remote

- Add new System volume control to System Commands
- Reorganise the System Command popup menu into groups matching workflow System Command
- Update System Command remote page example to include new commands

#### General Improvements

- New icons for File Actions and iTunes Mini Player
- A number of optimisations and improvements to further reduce the distributable size
- Added popup menu when right clicking on Alfred hat in default results which matches status bar menu
  - Gives Alfred's version number, access to Alfred's preferences, check for updates, quit
- Improved word based searching in Alfred Preferences Web Search / Workflow search fields
- Added new option in Advanced preferences to restore clipboard content after using a hotkey which obtains the current selection in macOS
  - Note that this isn't the default behaviour as there is a memory implication for buffering clipboard content
- Update LinkedIn built in web search to latest search URL
- Update Rotten Tomatoes and Wolfram default searches to https
- Improve responsiveness by opening files and apps asynchronously in certain scenarios
- Improved calculator number formatting, now properly respecting macOS grouping separator if not forced

### Alfred 3.2.1

Build 768, Thursday 8th December 2016

#### General Improvements

- Update markdown helper to correctly interpret list items (4 space instead of 2 space)
  - Note that if you are using Alfred 3.2 or earlier, the update change log will render incorrectly until you update to 3.2.1
- Improved loading of 1Password 6.5+ 3rd party integration data
- Update Google Drive default web search URL to latest, fixing space encoding issue
- Make the usage stats header text selectable in Alfred's preferences

#### Workflows

- Add new "Play Sound" output object
  - Play sounds from the System sound bank
  - Play custom aif / m4a files from within the workflow's folder
- Replace out {query} before snippet dynamic placeholders in "Copy to Clipboard" workflow object allowing for:
  - {cursor} positioning to work correctly when also using {query}
  - Passed in {query} to contain dynamic snippet placeholders such as {cursor}
- Add content type tree support to the File Action trigger making it easier to show actions for type groups
  - For example, add +public.image as a file type for an action to show for all files which conform to this type
- Add workflow info to the script task error dialog to help identify and debug issues
- Improved rendering in the Workflows list in Alfred's preferences
  - Added option to show 'Last Modified' date in Workflows list

#### Clipboard and Snippets

- Correctly calculate the visible length rather than underlying length of a snippet when positioning {cursor}
- More efficient rejection of keyword matching when checking for auto expanding snippets
- Work around macOS bug regarding mis-reported fn mod key being registered during text expansion
- More effective tidy up of expired clipboard history data

#### File System

- Add new "Copy File to Clipboard" file action which copies file rather than path
  - Useful for copying file for subsequent pasting into e.g. Mail.app
- Consolidated single and multiple file action code for better efficiency

### Alfred 3.2

Build 759, Tuesday 8th November 2016

#### Workflows

- Improvements to workflow canvas creation usability
  - Drag from a connection to an empty space to create a new workflow object at that location
  - Click a workflow output to create and connect a new workflow object to the right
  - Automatically select any newly added workflow objects to allow for immediate moving or removing by keyboard
  - Hint on canvas for how to add the first workflow object with an empty workflow
- Script Filter enhancements
  - The script output can now tell Alfred to re-run the script after a set period of time
  - Scripts can now output variables
    - Variables are passed through to the object output connections when actioning results
    - Variables are passed back into subsequent runs of the script within the same session
  - New "Advanced Script Filters" getting started workflow which covers the new concepts
  - Tidy up default examples when changing script type with no script entered
  - 'quicklookurl' now also accepts file paths and internally converts to file URLs (treated as a file path if it has a / or ~/ prefix)
  - Fix cleaning stream variables before processing causing variables to be lost on looping workflows
  - Higher performance processing of JSON/XML to results
- Improvements and additions to other Workflow objects
  - 'Hotkey' trigger object can now pass currently focused application through to workflow as a variable allowing for app context filtering
  - 'Copy to Clipboard' output object now accepts {cursor} placeholder to move cursor to selected position (only works when auto-pasting)
- Fix issue where corrupted workflow prevented Alfred Preferences Workflows tab from displaying
- Improvements for symlinked workflows
  - Fully resolve path to info.plist before writing to ensure symlinked workflows are written to correct folder
  - Fully resolve workflow folder before exporting to allow for symlinked workflow folders to be exported
- Fix fn+return mod override connection behavior in default results on macOS Sierra
- Improvements to built-in Getting Started and Example workflows
  - Add new "Simple Folder Search" built-in workflow example
  - Renamed "Script Filter Output" to "Script Filter" for better consistency
  - Added new "Advanced Hotkeys" getting started guide to cover hotkey active app variables
  - Updated the "All Workflow Objects" getting started workflow to add new objects

#### Clipboard and Snippets

- Add {cursor} placeholder to move cursor to selected position within pasted snippets (including Alfred Remote)
- Show a warning in Alfred's Snippets preferences if an app is preventing text expansion by locking secure input
- If using option to slow down key events, slow them a little more than v3.1.1
- Prevent clipboard merging from incorrectly merging non-text clipboard entries by their description (e.g. images and file)
- More efficient processing of snippets in Alfred Text Service

#### File System

- Make Alfred's Application cache also convert names to latin for e.g. pinyin search
- Add "Previews" tab under File Search feature
  - Move Quick Look option from Advanced to Previews
  - New option to disable rich previews altogether
  - New options to not load actions/navigation rich previews for specified types and within specified folders
    - When the rich preview panel isn't required, the selected file type icon is shown instead
- Higher performance caching of scope folders when initialising metadata search
- Work around macOS file localiation bug (e.g. folders in the home folder weren't correctly localising in search)
- Correctly clean up file summary panel after hiding

#### 1Password Integration

- 1Password integration updated to be compatible with 1Password 6.5+
- Alfred now shows results from multiple vaults, including 1Password Families / Teams
- All items are now shown from your 1Password
  - Logins are opened directly in your default browser
  - Other items (such as Secure Notes) are opened in 1Password mini

#### General Improvements

- Fix navigating out of empty folder behaviour in Copy To / Move To file actions
- Make all help subtext throughout Alfred's preferences darker for better readability
- Update references of OS X to macOS throughout Alfred and Alfred Preferences
- Prevent Alfred's Preferences Appearance tab from unnecessarily switching to discrete GPU on dual GPU laptops
- Fix issue where quickly dragging a file out of Alfred's main results could result in the incorrect file being dragged
- Update iTunes option to ignore movies and tv shows from miniplayer, also ignore music videos
- Streamlined various aspects of Alfred's core for higher performance
- Fix spelling mistake in Advanced > Proxy settings

### Alfred 3.1.1

Build 736, Saturday 17th September 2016

#### General Improvements

- Fix macOS Sierra issue where Alfred appears to be stuck when opening a newly downloaded app for the first time. Alfred was simply hiding the macOS warning confirmation dialog.
- Add default file search option to ignore iMessage transcripts to work around macOS bug where they are incorrectly found when ~/Desktop is in the search scope
- Add null check on metadata file search attributes before attempting cleanup during a file search
- Fix Calculator bug when deleting advanced = keyword with standard calculator disabled, result remains in display
- Improved processing of array config override properties in workflows and action triggers
- Update simulated key events throughout Alfred for improved reliability
- Fix wording in iTunes mini player indexing view 'Artist:' to 'Artists:'

#### Clipboard and Snippet Improvements

- Added option to slow down simulated key events for snippet expansion which can help with older Macs, and with non-standard software
- Added option to adjust delay for clipboard content restoration after snippet expansion
- Updated image type recognition in clipboard when identifying data type, ensuring that images copied from clipboard aren't treated as text (urls)
- Improved clipboard history logic for when to ignore data from specified apps

### Alfred 3.1

Build 718, Tuesday 30th August 2016

#### Workflows

- Add new "Call External Trigger" workflow output object
  - Calls trigger directly, avoiding the need to use AppleScript
  - Pass through argument and variables to trigger (in same or different workflow)
  - Ability to use variables directly within workflow and trigger fields for callback style functions
  - Update the "External Trigger" workflow object to better reflect the new "Call External Trigger" object
  - Add new "Call External Trigger" Getting Started workflow
- Add new "Hide Alfred" workflow utility
  - Gives more control when preventing Alfred from hiding in a connection
- Add new "Dispatch Key Combo" workflow output to simulate a keypress within macOS
  - Prevents the need to use AppleScript to simulate keypresses
  - Update key combo framework code to share between Remote and Workflow Object
- Update "Delay" workflow utility to accept fractional seconds e.g. 0.5
- Prevent workflow list popup menu from showing when there is a sheet showing in the preferences window
- Performance enhancements around workflow object configuration setting and getting
- When showing a direct / chained input in Alfred, and the textfield is empty, use cmd+backspace to reset Alfred to default state
- Fix "Debug" workflow utility to correctly process multi item input arguments

#### General Improvements

- Improved overall performance and responsiveness, especially when Mac is under load
- Added ability to drag files out of Alfred's file buffer
- Improved reliability of simulated mod key release when using Alfred Hotkeys
- Show the document preview instead of the file icon in the recent document file action
- Fix allowing cmd+s and Esc as key combos in Remote configuration
- Prevent rare scenario where auto-expanding snippet could cause Alfred to display
- Speed up Large Type fade in animation
- Improve performance of Actions panel
- Update iTunes AppleScript to disable shuffle before playing Alfred playlist (Latest iTunes 12 supports this again)
- Add updated email attachment support for Airmail 3
- Tuned metadata queries for macOS Sierra for higher performance
- Improved file preview display, showing compact style view of documents / movies etc
- Fix spelling mistake in Alfreds's preferences... From "Apples's" to "Apple's" ;)
- Fix alias files correctly opening when using file system navigation

### Alfred 3.0.3

Build 694, Monday 18th July 2016

#### Workflows

- Fix issue which prevented argv arguments being correctly being passed to workflow scripts configured as External Scripts
- Correctly recognise number types in JSON config passed out of JSON Config and scripts doing dynamic configuration
- Update Workflow getting started guides, placing workflow name before "Getting Started" for clarity
- Fix issue preventing dictionary filter language from being correctly applied
  - If you are experiencing an issue, re-save the configuration for the dictionary filter in your workflow
- The workflow version is now set as script environment variable alfred_workflow_version

#### Clipboard and Snippets

- Reorganised options between snippets and clipboard preferences for better relevancy
  - 'Show "All Snippets" at top of Clipboard History' option is now in clipboard preferences
- Added new option "Show snippets when searching Clipboard History" on by default
  - Disable to prevent your snippets from showing in the default clipboard history search results
- Significant improvement to snippet database caching performance
  - Useful if you have very large snippet databases
- Use ditto for snippet collection export for wider snippet filename compatibility
- Make the snippet name field optional (but still recommended if sharing a collection)
- Fettle timing in Alfred Text Service for better support of non-standard apps
- Bring forward the logic to ignore clipboard content for specified apps
  - Also allows Adobe users to work around Illustrator memory bug on copy
- Fix correctly showing Alfred as the source app in Clipboard History when copying from Alfred's text input field
- Allow the clipboard history clear keyword to work with clipboard history persisting disabled

#### General Improvements

- Improve deployment and update mechanism in preparation for macOS 10.12
- Fix compatibility issue for macOS 10.9 in List Filter workflow object configuration
- Fix font menu showing with ctrl+click as well as right click in theme editor
- Fix spell / define keywords to automatically detect language when "Default" language is used
- Provisioning for Powerpack activation when sharing a bootable external drive between multiple Macs (requires defaults write)

### Alfred 3.0.2

Build 676, Tuesday 14th June 2016

#### Corporate Licensing

- Alfred 3 corporate licensing now available
  - We will be rolling out updated corporate licenses to current corporate users in the coming days
  - If you are interested in corporate licensing for your business or team, please contact our info@ email address

#### General Improvements

- Recognise 'alfred3workflow' file extension in the same way as 'alfredworkflow' for installing workflows
  - Helps helper libraries such as Alfred-Workflow by Dean Jackson (deanishe) with features such as auto-update
- Fix intelligent selection list wrapping (in e.g. Clipboard History view), making it more predictable.
  - The wrapping from last item to first item and first item to last item will now only occur with a key press, not a repeated key hold.
- Only treat clipboard history image data as images if there isn't associated plain string data.
  - This allows copying from apps such as Numbers and Excel in the correct text version
- Prepend workflow folder to PYTHONPATH environment variable when running Python scripts
- In text service, reset buffered chars when characters typed with ctrl key down
  - Allows for e.g. ctrl+c terminal, then typing snippet.
  - Also helps expansion when using e.g. emacs bindings
- Always set the argument for a workflow dictionary filter, this allows 'not found' words to be processed in the same way as matching words

### Alfred 3.0.1

Build 671, Tuesday 31st May 2016

#### Snippet Improvements

- Enhanced performance and reliability for automatic snippet expansion
- Allow spaces in snippet keywords
  - Render spaces as ␣ in the snippets table view to make it clear when there are spaces being used
- Limit characters in snippet collection names to allow for maximum sharing and syncing compatibility
- Sanitise snippet filenames on import to ensure reliable syncing
- Tidy up export of snippets
- Reorganise the text expansion code for higher performance and more resilience to external influences
- More reliable dead key state resetting in Alfred Text Service
- Fix date regex for arbitrary {date:} replacement tag. Was incorrectly matching multiple date formats in single paragraph.
- Strip out characters from snippet filename when saving which may cause syncing issues (i.e. emoji with Dropbox)

#### Clipboard Improvements

- Add actual word count and character count to clipboard history text items summary view
- Improve performance of clipboard history viewer and auto pasting by only reloading text for pasting if necessary
- Make clip truncation in the clipboard history viewer more intelligent
- Fix the "Clear History" button in Alfred's Clipboard preferences

#### Workflow improvements

- Ensure that number values are correctly passed into environment variables when running scripts
- In Arg and Var workflow object, ensure that Arg {query} is replaced with empty string if passed in argument is empty
- When running scripts, fall back to decoding as ASCII string if UTF-8 fails. Fixes rare scenarios when scripts unexpectedly return empty contents.
- More resilience against unexpected CSV data when dragging CSV into the list filter
- Improve the dynamic file search workflow example
- Correctly process the JSON Utility output, deeply replacing {query} and (query)
- Switch default parsing method for Script Filters to be JSON
  - This essentially means that if there is an error and the return format cannot be identified, a JSON related error will be shown.
  - Significantly enhance the debug output of failing JSON output from a Script Filter, showing generated output and possible error cause

#### General improvements and fixes

- Option to touch alias files after opening them in Alfred to enhanced ranking, on by default
  - This is useful if you want to make aliases for applications, and add aliases to Alfred's default file types.
- Fix issue with AppleScript files running twice when finding them for running in file search mode
- Fix default results auto-complete for no-argument items
- Improved wording on activation error sheet
- Add Ukraine to locations
- Fix help button in migration assistant
- Improved alias resolution code
- Don't start Alfred 3 if Alfred 1 is running to prevent clashes
- Improve reliability of initial migration, specifically if users had Alfred 2 synced in the past
- Add checks around file url when checking and removing Alfred from login items to handle unexpected data
- Fix iTunes indexing progress display when track name is nil
- Fix theme rendering colours in positioning view of appearance options
- Tidy up naming on imported themes
- Update change log markdown generation to use system font, and refine sizes

### Alfred 3.0

Build 652, Thursday 19th May 2016

We've updated almost every aspect of Alfred for this huge release as you can see from this extensive change log.

While we've added many new features, there have also been numerous improvements under the hood, with extensive code analysis. As such, the downloadable file has been reduced in size by nearly 40% (less than 3MB at the point of release) and you will find Alfred to be faster than ever, with a tiny memory footprint.

#### General Improvements

- Migration assistant to help transfer all settings from Alfred 2 to Alfred 3
- Move Alfred to macOS 10.9+ allowing Alfred to use newer macOS technologies
- Added version number into macOS status bar hat menu
- ⌘W to close the Alfred window at any point
- The LC_CTYPE environment variable is now set to en_US.UTF-8 by default
  - Can be overridden per workflow in the new Workflow Variables
- Migrate Alfred's threading to GCD / Thread Pooling for higher performance
- Update selection list actioning framework to support actions when no items are visible (i.e. file navigation or iTunes transport)
- Removed native support for Growl (workflows can still use growlnotify if required)
- Updated help tab with link to Getting Started guide
- Updated Alfred's auto updater
- Improved, higher performance image caching
- Overhauled keyboard handling, now aware of DVORAK-QWERTY
  - Higher performance key caching when switching keyboards
- Improved knowledge / learning with faster latching to keyword based items such as workflows

#### Workflows

Workflows have received a significant upgrade in Alfred 3, with new "Getting Started" guides available from the + button, exploring many of the new abilities.

##### Overhaul to the workflow architecture

- Now allows arbitrary object layout and connection
- Chaining of objects of all types, including input objects
- Dynamic and scriptable workflow object configuration using JSON
- Ability to veto Alfred's window from closing in the connection configuration
  - Useful for input chaining to prevent window from closing / flickering
- Improved script task handling, particularly in regards to stderr handling
- Placeholder titles are no longer required fields for filter inputs for better chaining / direct use flexibility
- Version number added to workflow (variables) config, shown in description field when editing a workflow

##### Brand new Workflow editor

- Better visual clarity of connections
  - Assign colours to objects
  - New object notes to clearly annotate your workflows
- Multi selection / reorganisation of objects
- Intelligent cut, copy and paste of multiple objects
  - Strip pasted hotkey config only when necessary
- Copy and paste configuration between matching objects
  - Removes the need to delete and re-add object when reusing
- Add objects using right-click on the canvas at the location for editing
  - Insert objects before or after an object, with automatic reconfiguration of connections
  - Replace a selected object with a different object without losing its connections
- Standardise the ⌘S shortcut for saving workflow configuration sheets
- Use arrow keys to move selected objects around the canvas (+shift for moving further)
- New "Open Workflow folder in Finder" button in every workflow configuration sheet, next to Save / Cancel buttons
- New "Open in Terminal" option on workflows popup menu
- Canvas zooming, contextually zooming on selected items. Also, supports Apple trackpad pinch to zoom gesture.
- You can now search by creator in the workflow list (at least the first name needs to be typed to match)
- Remember canvas location and zoom within a session (for e.g. switching between workflows / easier copy and paste)

##### Improved Debugging

- Make filtering debug output by selected object a selectable option
- Debug logging is now clearer with colours
- Timestamp added into debugger
- New alfred_debug=1 environment variable on scripts when the Alfred debugger is visible in preferences
- Close button added to debug view

##### Improved workflow import

- Now shows the workflow readme before importing
- When updating, option to not migrate settings, which helps 'reset' a workflow when importing.
- Intelligent workflow import when updating a workflow, migrating keywords, variables and hotkeys
  - Variables are merged with variables a user may have changed or added
  - Keywords are not migrated if the new version starts with a { as this assumes it contains a variable

##### New Workflow objects

- Utilities
  - Argument and Variables
    - Modify or switch the current input argument being passed through the workflow
    - Insert or update new variables into the workflow stream
  - JSON Config
    - Modify the flow of data through Alfred allowing for:
      - Updated argument / variable replacement
      - Dynamic configuration of connected objects
      - Workflow variable insertion / configuration
    - Button to tidy the written JSON
  - Junction
    - Merge connections, multiple in and out
    - Also nice for keeping a workflow's connections tidy
  - Filter
    - Only continue if input matches / does not match string or regex
  - Delay
    - Schedule a workflow stream to continue execution after specified number of seconds
    - Yields execution back to workflow
    - Dynamic icon in workflow editor to hint specified seconds
  - Transform
    - Trim, upper, lower, camel, reverse, strip diacritics, strip non-alpha
  - Replace
    - Replace string / regex within input query with specified string
    - Mode for "empty input" allowing for defaulting of arguments
  - Debug
    - Write text out to the Alfred workflow debugger
    - Sensible default which shows input and all variables
    - Debug info shown with default 'interesting information' selected in debugger
    - Option to clear the debug log, useful for debug objects at beginning of workflow stream
- Outputs
  - Write Text File
    - Write the input to the specified text file
    - Option to skip, overwrite or append if file already exists
    - Option to create intermediate folders before writing file
    - File can be written to absolute path, or relatively to workflow data folder or workflow folder itself

##### Updated Workflow objects

- Triggers
  - Hotkey
    - Now shows the hotkey mode to the right hand side: simulate mod release, wait for mod release, pass through mods
- Inputs
  - Script Filter
    - Updated script output format for adding results into Alfred
      - New JSON feedback format, easier to read and configure
      - Updated XML feedback format for new mod features
      - Legacy support for Alfred 2 XML format
    - New ability to directly run external scripts of any type without the need to bootstrap
    - Simplified query argument processing, allowing use of argv in place of {query} replacement
      - When using argv, file lists (e.g. from an Action trigger) are passed as separate arguments
    - New option for Alfred to filter the returned results
      - Script is run once, Alfred subsequently filters as user types - extreme performance
    - More result flexibility including separate control of validity, subtext and argument for modifiers
      - Mod results no longer need a configured mod output connection, they pass out default connection instead
    - New 'quicklookurl' XML tag / JSON property to override and provide a custom Quick Look for a result
  - List Filter
    - Simple configuration of items into Alfred's results
      - Configure the title, subtitle, argument and icon for each result
      - Intelligent inheritance of icon (workflow -> object -> item)
      - Batch import CSV of items into list configuration for easy mass editing
  - Dictionary Filter
    - Access macOS's word lookup with a workflow object
    - Configurable language settings
- Actions
  - Open File
    - Offers new text field to manually enter static file to open
      - Easier to see full file path of dropped file
      - Allows for filename variable replacement
      - Allows for opening of a file which may not yet exist
    - If not absolute path, treats file as relative to workflow
    - If static file defined, this is now correctly passed out to the connected objects
    - Now aware of relative paths, searches first in workflow's own folder, then the workflow's data folder
  - Open URL
    - Now defaults the search URL to {query} to work for passed in URLs
    - Significantly improved URL encoding (see "Web Searches" section of change log)
  - Reveal File in Finder
    - Now aware of relative paths, searches first in workflow's own folder, then the workflow's data folder
  - Browse in Alfred
    - Now aware of relative paths, searches first in workflow's own folder, then the workflow's data folder
    - The browsed path is now correctly passed out to the connected objects
  - Run Script
    - New ability to directly run external scripts of any type without the need to bootstrap
    - Simplified query argument processing, allowing use of argv in place of {query} replacement
      - When using argv, file lists (e.g. from an Action trigger) are passed as separate arguments
- Outputs
  - Copy to Clipboard
    - Option to mark the copied data as transient, preventing it from appearing in clipboard history apps (including Alfred)
  - Large Type
    - Now configurable large type text with query and variable substitution, consistent with other output objects

##### Workflow environment variables

- Default environment variables set per workflow configuration sheet
- {var:varname} placeholders can be used in workflow object configuration text fields
- Can be set dynamically throughout a workflow
  - Using Argument and Variable utility
  - Using JSON (JSON utility, or JSON output from a script)
- Workflow variables are set as environment variables when running script objects
- Variable values are migrated when upgrading a workflow
- Readme moved to variables configuration for better contextual explanation of workflow setup
- The theme selected result background colour is now set as a script environment variable

#### Clipboard History and Snippets

- Multimedia Clipboard
  - Images
  - File Lists
  - Hex Colours
- Vastly improved Snippets with Auto Expansion
  - Automatic snippet expansion into any macOS text field via the snippet's keyword
    - maintains previous clipboard contents when using auto expansion
  - cmd+s on a clipboard item in Alfred's clipboard history to quickly save snippet from a clipboard entry
  - Snippet collections
  - Export and Import collections
  - Move snippets between collections
  - New JSON file format
  - Hotkey directly to snippets, toggle between clipboard and snippets viewers with respective hotkeys
  - Snippets are no longer copied into clipboard history on use
  - When adding a snippet into Alfred Remote, popup menu shows snippet collection hierarchy
- New option to "Load More" at bottom of clipboard history list to load next batch of history
  - Helps find clipboard history data if you can't remember a part of it for searching
- Improved clipboard history performance, uses practically zero CPU
  - Items pasted out of Alfred are marked as Alfred clipboard data; clipboard isn't re-processed by Alfred
- Added new option to move items to top of list when used from clipboard history (on by default as per v2 behaviour)
- Improved clipboard fast append matching algorithm
- Arbitrary date formatting with the {date:FORMAT} placeholder (using Unicode Technical Standard #35)
- When clearing the clipboard database, the database is now deleted then recreated

#### Theming and Appearance

- New Alfred 3 default themes
- Brand new theme editor
  - Intuitive point and drag to change sizes, click for colour, right click for fonts
  - Font mode to drag up/down through default fonts
  - Change between theme mode and font mode with T and F
- Share themes on alfredapp.com directly from the theme editor
- Easy to read JSON file format
- When creating a new theme with the + button, base it on the default theme. Use duplicate theme menu to duplicate selected
- Use System font by default throughout Alfred (in views where theme fonts aren't applicable, e.g. Clipboard History preview)
- Arbitrary font selection from all installed fonts
- Undo / Redo support in the theme editor
- Intelligent shadow invalidation for more reliable theme transparency
- Improved logic on vertical alignment of fonts in the search field paving the way for non-standard 3rd party fonts
- Imports v2 Theme URLs and migrates theme to v3 (e.g. from Packal)

#### File Search and Navigation

- Improved file actions (copy/move/delete) with success / fail notifications
- Abbreviate file path subtext (e.g. ~/ instead of /Users/andrew/)
- Abbreviate the iCloud Drive subtext file paths (e.g. iCloud Drive/Pages/document1.doc)
- Bug Fix: When browsing an empty folder and backspacing on the folder (e.g. ~/Applications/) that it jumps up a folder.
- Improved layout for secondary views (FS Navigation / actions panel etc) with larger preview
- Now uses Quick Look panel to show preview of document
- Show full filename at bottom of FS Navigation view
- In areas where you configure user defined file types (default results, file filter workflow object), prefix type with + to search type tree
- Fix when typing a path into Alfred e.g. /Applications, then selecting all and typing a string (e.g. 'andrew')
  - Now correctly returns to the default results instead of staying in the FS navigation mode with no results
- e.g. "public.folder" searches kMDItemContentType, "+public.directory" searches kMDItemContentTypeTree

#### System Commands

- New Sleep Displays command with keyword "sleepdisplays", to sleep displays
  - Also added for Alfred Remote
- Moved to using pmset for sleep command and new display sleep command
- Make the default eject scope "Local Mounted Volumes"
- Better organised "System Commands" Alfred Remote example page with new "Sleep Displays" command

#### Contacts Integration

- More intelligent height truncation for long contact cards
- Updated Microsoft Outlook email attachment support

#### Web Searches

- Make Amazon searcher https by default
- Updated Bing to use https and .com by default due to certificate inconsistency
- Updated Wunderground to be use https by default
- Added new default web search for Pinterest
- Unified custom web search sheet save button to use cmd+s
- Significantly improved URL encoding
  - Add intelligent {query} encoding based on wether it's a URL parameter, or part of the URL string.
  - Allow for flexible space encoding in {query}, e.g. - _ + /
  - Applies to Custom Searches, Open URL workflow object and Remote Open URL

#### Accessibility

- Improved Accessibility
- Alfred can now read the selected result using Voice Over

The Alfred 2 Change Log is still available for your browsing pleasure!

### Latest Blog Post:

Alfred 6 Expanded Sneak Peek

---

### 3.4 Alfred 2

> Pagina ufficiale: `https://www.alfredapp.com/changelog/v2/`

### 2.9 27th May 2017

- Another small tweak to LinkedIn default web search

### 2.8.9 24th May 2017

- Launch default result files and file system navigation files in background, avoiding macOS front most modal dialog issues for new apps
- Fix LinkedIn search, make Wolfram and Rotten Tomatoes searches aware of https
- Provide v3 upgrade link in Powerpack tab
- Updated toolchain and build environment to Xcode 8
- Signed with updated Apple Developer ID certificate
- Merge across select memory usage refinements from Alfred 3

### 2.8.8 23rd Jan 2017

- Updated default LinkedIn, Wunderground, Google Drive, Amazon web search to latest URL
- Updated a number of default web searches to use + instead of %20 space search queries
- Added helper message when attempting to activate Alfred 2 with Alfred 3 license

### 2.8.7 23rd Nov 2016

- Compatibility improvements

### 2.8.6 15th Jul 2016

- Preparation for MacOS Sierra 10.12
- Improved compatibility with App Translocation

### 2.8.5 9th Jun 2016

- Banner in preferences announcing Alfred 3 is now available (can be hidden)
- Compatibility enhancements

### 2.8.4 29th Apr 2016

- Add in some compatibility enhancements in preparation for Alfred 3 release
- Fix URL decoding of imported custom searches
- When running scripts read stderr to end of file to ensure full text for debugging
- Update some URL links so they launch directly without redirects

### 2.8.3 10th Mar 2016

- Maintenance release with a few little under the hood enhancements
- Fix iTunes Mini Player non-functional path when "hide mini player after selecting" is unselected
- Fix graphical glitch in Terminal prefs when switching from "Custom" to "Terminal"
- Fix "Search in Spotlight" mod action silently failing with multiple words for fallback searches
- Fix when viewing snippets in clipboard viewer, the preview subtext doesn't update on changing selection

### 2.8.2 12th Jan 2016

- 1Password compatibility improvements
- Set default scheme on a 1Password bookmark if missing
- Show 1Password data path in Alfred's advanced preferences when discovering data automatically
- Fully encode the exported URL from Alfred's custom search instead of being aware of odd custom search URLs on import
- Fix only listing matching default scope folders in Alfred's results if they actually exist
- Fix crash when closing workflow related remote page configuration
- Fix "search in spotlight" alt action when the keyword length is less than the query length
- Remove ATS TLS 1.0 exception for CacheFly connection, as the CDN is now capable of TLS 1.2

### 2.8.1 18st Nov 2015

- Add in "System Light" font for OS X 10.10+
- Disallow font tightening before truncation which gives poor font rendering in 10.11+
- Fix support for OS X application recent documents in 10.11
- Add OS X 10.11 App Transport Security temporary exemption to allow workflows to connect to non secure and TLS 1.0 sites
- Fix quirk in selection lists (e.g. clipboard history) when deleting from bottom of list
- Make Alfred's contact viewer date formatting correctly handle birthdays without a year
- Fix Google search icon pixelation
- Standardise "Search with Spotlight" alternative action behaviour for different result types, now always searching for typed query argument
- Resize some of the label areas in the advanced preferences to make sure the text always fits
- Updated tool chain, and static link latest OpenSSL
- Tweaks to the theme importer sheet for robustness
- Better filtering on unwanted iTunes track types / playlists in mini player

### 2.8 21st Sep 2015

- JavaScript is now available as a scripting language within Alfred Workflows (OS X 10.10+, using osascript)
- Update hotkey scope internal notifications to work with new Alfred focus subsystem when focused app is set to Alfred
- Improve reliability to the new focus setup in Alfred, falling back on being an active window in unable to take non-active key status
- Add "compatibility" mode in Alfred's Appearance options, useful if you use Alfred along side Java or with keyboard remappers
- Remove email validation REGEX from Alfred's General prefs sign-up form, as Campaign Monitor does validation on submission
- Large Type view updated to use the OS X System font
- Google search icons updated

### 2.7.2 1st Sep 2015

#### Improvements

- Significantly improve Alfred's focusing behaviour, not taking active from the currently focused app. This improves a number of things including clipboard history paste behaviour with a multi screen setup.
- Bring the Alfred window forward in the window hierarchy
- Ability to manually add and edit UTIs in the Features > Default Results > Advanced preferences and Workflow File Filter input configuration
- Replace iTerm integration with custom integrations, and update help page to link to updated custom iTerm scripts https://github.com/stuartcryan/custom-iterm-applescripts-for-alfred
- Updated icons / favicons for built in web searches
- Add option for custom URL handler to open selected contact in user defined app
- Improved logic for auto-discovery of 1Password bookmarks-default.json 3rd party integration
- Add new Apple SF fonts (Text / Display) to theming if available on Mac
- Update all internal *.alfredapp.com URLs to new site URLs, also use https by default for these sites
- Update Alfred's help keyword to use new website search with https
- Do some validation on workflow bundle IDs, and warn (orange text) if it contains characters other than [a-zA-Z0-9._-]
- Recognition of Japanese ideographic [full width] space character as keyword 'with space' separator
- Improve the 'define' and 'spell' keywords, giving more accurate results and reducing duplicates. Also, consistently make 'define' always show typed word as first result regardless of correctness (as Dictionary may have an answer which Alfred doesn't, e.g. Wikipedia)
- Fix the result order for spell and define to keep the results more relevant (rather than order based on usage)
- Default to Alfred Yosemite theme if no theme is selected
- Add a "Copy Paths to Clipboard" action for multiple [buffer] items
- Update General preferences signup form to use updated Campaign Monitor signup url
- Prepare for moving the Alfred Remote System Command confirmations to iOS (as double tap) instead of Mac (alert dialog)
- Switch to using Alfred's file cache for the "Open With..." action, allowing for faster results and respecting fuzzy settings

#### Fixes

- Fix crash in Alfred when using Alfred's hotkey to hide Alfred and Quick Look is showing
- Remove irrelevant items from the iTunes Mini Player such as apps (issue introduced around iTunes 12)
- Remove iTunes store link from within mini player
- Prevent truncation of labels in Run Terminal Command sheet
- Fix File Buffer Compatibility toggle for 'Remove All' via shift+alt+backspace
- Prevent silent exception in selection list (e.g. actions) when trying to action an item if there is no visible rows
- Truncate tail for clipboard history items instead of truncate middle (introduced with filenames)
- Fix the iTunes previous / next actions and track display for Apple Music
- Update email signup REGEX to accept new TLDs

### 2.7.1 15th Apr 2015

#### Fixes and Improvements

- Sorting and Searching of URLs in Alfred's URL History preferences, making it easier to find items to delete
- Reorganise spelling feature to allow for cmd+o to open the 'spell' keyword results in Dictionary
- Back out "LC_CTYPE=UTF-8 encoding to script environment" as it was causing some Workflow issues

### 2.7 13th Apr 2015

#### Alfred Remote Improvements

- Add key combo dispatching to Remote (no longer need to use AppleScript)
- Added OS X Preference Panels to the Remote Items [+] popup for adding (also tidy up framework for adding items)
- Option to "Hide from this Mac" for Remote pages, to hide pages not relevant to that specific Mac
- Dragging Remote page items now allows for dragging over existing items, allowing DnD within a full page
- Add Remote Server keywords for stop, restart in Alfred's results
- New Menu item to "Reset Icon and Label" for Remote page items both on single items and all items in a page
- Use correct display name in Remote page examples rather than filename
- More robust image caching / refreshing for Remote page prefs
- Truncate head on path text for Alfred Remote launch file action
- Change "Looking for iOS Remote" to "Waiting for iOS Remote" along with further description in Add iOS Remote sheet for more obvious UX
- Update Remote naming convention to match Workflow actions
- More reliable mod key simulated release / key combo dispatching release

#### Workflow Improvements

- Run Script actions and outputs can now run concurrently, new option in workflow object prefs
- Sensible defaults for script {query} escaping and default query assignment examples
- Add arbitrary query limits to certain internal workflows to prevent bloating
- Add "Delete" item in popup menu on workflow canvas for deleting objects
- Improve accuracy of key speed record, it now also counts deletes back to scratch
- Track keyboard layout changes for Alfred dispatched keycodes, making commands more reliable
- Add LC_CTYPE=UTF-8 encoding to script environment
- Add PYTHONIOENCODING=utf-8 environment variable for Python scripts

#### Fixes and Improvements

- Ensure that homebrew folders are added to new installs of Alfred
- Less intrusive update notification, now displayed as a small tab to the bottom left of Alfred window rather than old modal dialog
- Bring the Alfred window in front of modal dialogs
- Fix the clipboard history ignore apps table (remove non-editable editable field)
- Update text in file search prefs Applescripts to AppleScripts
- When tab is selected to show actions for the selected result, backtab (shift+tab) now auto-completes the selected result.
- Respect alfred:ignore if set as a tag in OS X (currently only works a Spotlight Comment)
- Clarify appearance "default screen" text to reflect actual behaviour (Alfred shows on the screen you drag him to)
- Don't trim the string in the "Copy to Clipboard" output workflow object
- Centre truncate result titles and filesystem navigation results which is more useful for long filenames
- Correctly show Scientific Notation in calculator if answer over 15 digits

### 2.6 27th Jan 2015

#### Alfred Remote for iOS

- Alfred Remote is your personal command centre for Alfred 2 for Mac. Your iPhone or iPad now becomes a perfect day-long companion to your Mac; Whether at work or play, be more productive than ever! alfredapp.com/remote

#### New Features

- New Script Filter runtime behaviour options giving more control over when scripts are executed
- Add Rotten Tomatoes to default web searches with keyword 'rotten'
- Ability to set theme UID externally via AppleScript
- Add default support for sending attachments in Airmail 2
- Add homebrew Caskroom and Cellar to Alfred's default search scope

#### Improvements and Fixes

- Enhance workflow preferences search to include external trigger and remote trigger ids
- Clarify text the calculator preferences
- Update google drive to new URL
- Update the google images URL to the latest non redirecting one
- Show person’s birthday in Alfred’s contact viewer
- Change to new method of loading URLs to sidestep Yosemite issue
- Improve reliability of simulated key releases by not setting the flags and only simulating a release if the key is down
- Remove deprecated setFlipped code for updated respectFlipped
- Ability to large type (⌘L) from the clipboard viewer and snippets 'snip' keyword.
- Better format the large type text around largest word length, and replace tab with spaces for proper indentation.
- Add additional configuration options for proxy, allowing for scheme prefixes if missing
- Clarify text for 1Password 3rd party integration in Alfred's preferences
- Improve workflow logging / debugging, better facilitating stderr as a method for logging
- Fix truncated labels in workflow Script preference sheets
- Improve workflow preferences search field behaviour in Yosemite
- Fix default feature 'no argument' keyword inputs auto complete with trailing space (e.g. clipboard, itunes)
- Reorganise the default hotkeys framework to sync more gracefully, removing defunct code

### 2.5.1 22nd Oct 2014

#### Improvements and Fixes

- Add support for 1Password 5 in Yosemite
- Improve workflow search (in Alfred's Preferences) in Yosemite, moving search config to more obvious cog
- Fix exception when passing an empty string in script filter XML subtext mod keys
- Remove automatic trimming for external trigger arguments (e.g. when running from AppleScript)
- Prepare support for Alfred Remote (not long now!!)

### 2.5 6th Oct 2014

#### Web and Security Improvements

- Update any cachefly.alfredapp.com references and auto update checks to operate over https
- Add option for https in default web searches, on by default
- Allow non encoded characters in custom web searches, workflow urls and remote urls. Makes adding URLs much easier and more predictable.
- Don't escape @ to %40 when URL encoding a mailto from email command and contacts viewer
- Update google icons to new style and add specific icons for google maps and translate

#### Workflow Improvements

- Make Title (keyword input) and Placeholder Title (script / file filter inputs) required workflow input fields to prevent confusion
- Modify behaviour on direct queries to make sure placeholder text is correctly shown when the argument is specified as required
- For fixed inputs (from hotkeys / external triggers / remote), correctly respect 'required argument' when arg is empty (i.e. don’t action)
- Change workflow input filter behaviour to prevent unnecessary script execution if argument hasn't changed. Also update trimming behaviour on direct input to match default input
- Reorganise Alfred’s main window for fixed inputs (hotkeys / external triggers / remote) and initially process input to show results or placeholder text
- Update the workflow examples to have 256px icons for future proofing
- Add icons to iTunes commands (e.g. play, random), also show these icons in workflow config
- Searching for workflows in Preferences fails to find word after '(' or '{' or '['
- Fix refresh issue when using a direct input where results weren’t cleaned out properly if Alfred was already visible

#### General Improvements and Bug Fixes

- Update resource icons to 256px for future proofing (e.g. Alfred Remote)
- Increase saved icons (workflows, web searches etc) to 256px for future proofing
- Modify caching policies for any internal URL requests to ignore the OS X URL caching
- Fix small memory leak in Alfred Preferences script action sheet (Doesn’t affect Alfred core)
- Prevent irrelevant results with “Quick Search” disabled and pressing space
- Prevent flicker in Alfred's UI when disassociating a uniquely selected result (e.g. google web search) when deleting backwards on the search field
- Change 'less' to 'fewer' in file search preferences help subtext
- Improve help subtext for File Search > Inside Files
- Fix Alfred main window subtext y position and incorrect crop in file actions browser
- Tidy up Alfred debug log
- Fix IMDB non english locale searches with a diacritic string
- Sort the fallback searches from the [+] button to make it easier to find the fallback you want
- Update method for OS X version checking removing deprecated Gestalt call
- Add additional help buttons in Workflows and Appearance preferences
- Start Improving help documentation
- Update build tools to Xcode 6

### 2.4 14th Aug 2014

#### Compatibility Improvements

- OS X Yosemite Compatibility, Alfred 2 officially supports Apple's upcoming operating system
- Updated Alfred preferences framework to provide a unified synced / non synced preference codebase for Alfred, giving better reliability

#### Theming Improvements

- Add new default OS X Yosemite Light and Dark themes
- Sharper status bar icon which respects Yosemite theming
- Add the experimental default window blur into appearance > options, no longer a preferences hack
- Add Helvetica Neue and Helvetica Neue Light to Alfred's theme editor selection
- Don't sync window position as different Macs may have very different location requirements
- Fix quirky footer text in theme editor when cycling through options such as fonts
- Update Alfred to use Helvetica Neue for built in default themes and a number of views across the app
- Update the "Show Result Subtext" appearance settings and add in a few nice new options such as only show subtext for selected row, or only show for alternative (modifier) actions
- Add a 'show subtext' modifier option in Alfred's advanced preferences. This allows to peak at the default subtext, e.g. file path, if the subtext is hidden in the theme
- When Large Type is showing, make cmd+c copy the visible text to the clipboard, then hide and deactivate Alfred

#### General Improvements and Bug Fixes

- New option to fuzzy match file system navigation results, on by default in Alfred's Features > File Search > Navigation options
- Add some useful alfred_ variables to the script environment to help get commonly required Alfred information.
- Add http_proxy and https_proxy support (option in Alfred's advanced preferences) for workflows
- Add the proxy exception list to workflow script environment as no_proxy variable
- Prevent update type from being greyed out when disabling auto updates
- Add a placeholder page in Alfred's preferences for Alfred Remote
- Escape pipe symbol in folder names for the "Open Terminal Here" action
- More robust nil checking when searching for snippets when doing placeholder replacements
- Fix failure moving / copying a file when name contains grave accent
- Diacritic insensitive genre searching in iTunes mini player
- Improve handling of double tap hotkey combos to prevent accidental triggering
- Prevent smart substitutions in workflow Terminal Command and Copy to Clipboard object editors
- Prevent right click table popups when sheets are visible in preferences
- Better dialog feedback on sync folder selection (e.g. when folder is already in use)
- More reliable mechanism for reshowing preferences on restart (i.e. when re-setting sync folder)
- Make clipboard history activation / watching more robust, improving performance
- Don't persist internal clipboard items when clip history is disabled
- Tweak vertical position of result text when subtext isn't visible
- Update DuckDuckGo logo to latest design in default web searches

### 2.3 8th May 2014

#### New Features

- New 'external trigger' workflow object for running workflows from outside of Alfred using AppleScript
- Update 'Open File' workflow action to allow static files to be opened with the specified application
- Context sensitive workflow hotkeys, ability to automatically register and deregister hotkeys for the currently focused app in OS X
- When disabling a workflow, also deregister the hotkeys. This requires a little responsibility on the part of the hotkey user to avoid registering hotkeys elsewhere in OS X
- New options to set new workflow defaults such as creator and readme, available on the [+] new workflow button
- Add 'text for copying' and 'text for large type’ and dynamic mod subtext overrides to Script Filter XML (see script filter xml example for more info)
- Promote Preference Panes into Alfred’s internal file cache for higher performance, better i18n and fuzzy matching
- Bring back window blur hack in Mavericks with added resilience
- Tidy up 'Eject' framework and add "Eject All" to the available System Command workflow actions

#### Improvements

- Update workflow Script XML example to include the new Alfred 2.3 attributes
- Add "Copy" button in debugger to copy the current content of log to clipboard
- Improve and clarify certain aspects of debug logging
- Always output returned script XML from a Script Filter when logging is set to "All Information", regardless of error
- Make sure that the debugger is only hidden if the workflow selection is changed by a user, and not on an external reload
- Option to remember the last selected workflow category when re-opening Alfred, in the ‘Edit Categories’ preferences
- Show system default mail client icon with 'email' command, not fixed to Mail.app icon/li>
- Clarify the popup auto update dialog, adding a note to show if the user is currently following pre-release builds
- Better re-selection of workflows when changing categories, filtering and editing
- Popup menus on workflow canvas for e.g. configure / copy / paste etc. Prevent accidental dragging of workflow objects when clicking by reducing initial sensitivity
- More intelligent creation of workflow from pre-defined templates, now allowing users to set the name and icon, and be pre-filled with workflow defaults
- A few preferences UI refinements
- Update to latest Xcode 5.1 and clang

#### Bug Fixes

- Fix rare script output UTF8 decoding error resulting in missing data returned from a script. Manifested in script filter returning large XML which parsed as invalid
- When renaming categories, ensure that related workflows have their categories updated correctly
- chmod -x unnecessary flags from some bundled example and template workflows
- Remove the un-wired "Confirm" option for the 'eject all' feature preferences
- Prevent duplicate names in the categories editor
- Prevent deleting workflow objects / connections while dragging or connecting them, leading to undesirable behaviour
- Prevent smart substitutions in Terminal integration custom AppleScript editor preferences

### 2.2 12th Mar 2014

#### New Features

- New debugging options for Workflows. Click the bug icon when editing a workflow. Debug filtering options available such as selecting the unique object you would like to see the debug info for, and error or full log info
- New organisation options and filtering for workflows, with categorisation. Available in Workflow preferences search drop-down
- Copy and Paste workflow objects e.g. from one workflow to another
- Added option on workflow list popup menu to duplicate workflows
- Default support for Airmail.app added for creating emails with attachments
- Option to use metadata for contacts search instead of Address Book API. Gives better word based and diacritic matching.
- Singapore added to the web locations

#### Improvements

- Improve Alfred’s knowledge sorting for fixed and unique filter results (e.g. a hotkey attached to file filter, or uniquely selecting the ‘open’ file search)
- Correctly detect and format addresses in the contact viewer, fixes issue where e.g. US address formatting wasn't correct
- Clarify the 1Password advanced prefs for 1Password 3 and 1Password 4 differences
- Add some Amazon web localisations for AU, BR, CN, MX, IN instead of falling back to amazon.com
- Improved reindexing with option to delete /.Spotlight-V100/ for most thorough metadata reindex
- Add back in touching folders to latest timestamp to enhance subsequent sorting in Alfred (and Spotlight). Preference in Alfred’s Features > File Search > Advanced
- Multi-selection now allowed in Workflows for re-categorisation and deletion
- Respect alternative metadata names in app cache for better internationalised matching
- Request contacts access on starting Alfred rather than first searching for better user experience
- List hotkeys in correct order to match Apple’s HCI guidelines (ctrl, alt, shift, cmd)
- More efficient fixed font loading
- Show contact suffix if available, e.g. BSc
- Ensure that multi part surnames are found in Alfred e.g. Mc Smith
- Nicer icon for the ‘tags’ keyword similar to Finder’s tag icon
- Turn off smart quotes and substitutions by default for snippets editor
- Better unicode support for full URLs in the Open URL workflow action
- Reset the iTunes XML patch cache when reloading the music library
- Fall back to workflow icon if icon is nil in Script Filter (currently shows a folder icon)
- Improved rendering in workflow editor canvas

#### Bug Fixes

- Prevent smart quotes in the AppleScript workflow action editor
- Fix text in reindex terminal window as dot is no longer shown in Spotlight magnifying glass when reindexing
- Remove non working Appsfire web search as it now uses AJAX and Appsfire are shifting business models
- Remove irrelevant popup options when there is an invalid workflow
- Update Google images / maps URLs to newer format (non subdomain)
- Remove (+) copy mouse icon when dragging fallback categories in preferences
- Remove erroneous ‘Name:’ label from File Action trigger preferences
- Improve reliability of multi-file buffer grid preview (actions view) on hovering mouse
- Ensure object is correctly re-selected in workflow editor when resizing window, or showing the workflow debugger
- Remove ability to use Dropbox’s Apps folder for syncing as this is still causing quirks for a small number of users (only affects new syncs)
- Remove window flicker when using the "Use Spotlight metadata for searching contacts" and opening contact in Alfred
- Fix incorrect tooltips in workflow editor
- Code refinement and performance enhancements

### 2.1.1 18th Nov 2013

- Add native tag support, with new ‘tags’ keyword which uses 'AND' logic for multiple keywords
- Improved layout for file search prefs for the new tag option
- Better support for OS X Mavericks multi screen, with new appearance option to "Show Alfred on Active Screen"
- In the Contacts Viewer, show addresses in Apple Maps by default, falling back onto Google Maps if Apple Maps isn't available
- Add Apple Maps into default web searches for users on Mavericks
- Show workflow image in notification in Mavericks with checkbox to disable in Advanced prefs
- Improvements to the iTunes AppleScript integration
- Fix some preference layout issues in Mavericks
- Turn off OS X auto substitution in Alfred's script editor fields e.g. smart quotes
- Fix escaping of ! in folder names for 'Open Terminal Here' file action
- Improved selected item mouse hover behaviour in default results
- More resilient inline definitions for non EN locales
- Stop trailing / being added when copying an optionally escaped path to clipboard
- Update tool chain and to using Xcode 5, improve build scripts

### 2.1 23rd Oct 2013

- Official OS X 10.9 Mavericks compatibility
- Add /System/Library/CoreServices/Applications to Alfred's default search scope which includes Network Utility.app in Mavericks. You may need to add this path manually if you have modified your default search scope
- Fix inline dictionary definitions in Mavericks for the spell and define keywords
- Fix focus issue in Mavericks, and generally make the 'Browse in Alfred' workflow action less window flicky
- Improvements to iTunes integration, making the mini player aware of iTunes Radio
- If quick look is visible in file system navigation, correctly hide preview and Alfred, then open the selected item when pressing return
- Add in kMDItemUserTags to the selectable items in a workflow filter for better Mavericks tagging support
- More robust handling of clipboard history app blacklist
- Fix spelling mistake in Alfred assistant
- Use 1Password 4 icon as the default fallback icon if 1Password isn't found
- Escape & in folder names for the "Open Terminal Here" file action
- Improve syncing compatibility with Dropbox
- Tidy up logging

### 2.0.9 3rd Oct 2013

- Improve 1Password 4 compatibility (ensure 3rd party support is enabled in 1Password 4's preferences)
- Respect the new 1Password clipboard metadata type to ignore in Alfred's clipboard history
- Show the full path to applications listed in the 'Open With...' action list
- Fix Facebook web search

### 2.0.8 17th Sep 2013

- Add 1Password 4 compatibility (ensure 3rd party support is enabled in 1Password 4's preferences)
- Performance tweaks and bug fixes

### 2.0.7 8th Aug 2013

- Add custom AppleScript plugins for sending email attachments through Alfred's actions
- Correctly position Alfred on "mouse pointer screen" when OS X has screens above one another
- Improved logic for "Display Alfred on mouse screen" to prevent unnecessary checking of the mouse screen position
- Add option in Large Type prefs to show Large Type on current mouse display
- Fix rogue trailing space in tab-auto complete in web searches without {query}
- Fix unusual crash in address book viewer when using custom fields in OS X 10.7
- Better autoscroll and selection of newly added workflow object
- Update preferences help menu to have an item linking to Alfred's support site
- Add option to show job title, if available, in the contacts viewer
- Fix the default sort order of apps in the "Open With..." action to be last used date descending (i.e. most recent used app at the top)
- Improve reliability of the multi file actions summary view popover (popover sometimes wasn't appearing)
- Prevent window dragging in the multiple file summary view to match behaviour of file buffer
- Remove defunct Google Reader from default web searches

### 2.0.6 17th Jul 2013

- Add appearance option to show Alfred on the screen which the mouse pointer is currently visible
- Consume Tab Autocomplete when there are no matches in the file system navigation view to prevent selecting all the text
- If a contact's URL doesn't have a scheme in the address book viewer, default to http:// so that the URL is correctly opened
- Fix issue where using cmd+number in subviews (iTunes Mini Player / File System Navigation etc) selected the incorrect item
- More robust filter type editing when pressing the [-] button on editing the advanced filter types tab. Also, pre-select the newly added row
- Show "Browse folder in Alfred" action for public.volume types
- Fix workflow based hotkey app toggling for apps inside ~/ folder tree
- Add 'com.apple.applescript.text' to the AppleScript types for default results and running AppleScripts (if selected in prefs)
- When setting a new hotkey with a shift (or other mod) and number, show the number in the UI rather than the modified character such as @
- Make the loading of icons for files on external drives a user based option for performance
- Reduce unnecessary logging for improved performance

### 2.0.5 11th Jun 2013

- Improved file matching for full file names and split name combos e.g. open bananas jpg
- OS X 10.6 hot fix for custom URLs and Open URL workflow object validation preventing configuration from displaying

### 2.0.4 3rd Jun 2013

- Add in <arg></arg> as an optional replacement to <item arg=""> which allows for newlines in the argument and other various xml advantages
- Respect prefix text when using a hotkey passed through to a workflow
- Add in soft failing for incompatible workflows (for future proofing workflows)
- New option to exclude podcasts in Alfred's mini player, only include podcasts which are available and can play
- Change http links to https links for buy.alfredapp.com throughout Alfred's preferences
- Check for write permissions on Alfred 2.app when updating to avoid quiet fail situations
- Perform URL validation in the custom web search configuration and Open URL workflow object configuration (also validates local URL schemes)
- Make Alfred use file type icons instead of file icons on external volumes for increased performance
- Make Alfred more robust when it comes to dodgy and invalid missing fields in OS X metadata results
- Robustness in file navigation view to prevent crash when using two "Browse in Alfred" actions simultaneously in a workflow
- Move filecache into Databases sub folder with other Alfred database files for tidiness
- Refine the photoshop -> ps fuzzy modifiers to not affect other apps
- Respect the "show in default results" tickbox for the iTunes play/pause keywords
- Make the fallback sheet table fields non-editable text as this doesn't actually do anything
- Remove unnecessary logging in file search to make things more efficient
- Find Spotlight Comments in the copy to / move to action folder destination search
- Escape \ and $ for "Open Terminal Here" action
- Separate preferences script editor Menlo font loading into fixed with font loader
- Default to system font if specified font isn't found to make Alfred more resilient to missing fonts
- When pasting from Alfred's clipboard history viewer, retain the original source app information (icon)
- Better update logic when switching between pre-releases and general releases in the update prefs
- Fix buffer icon upside down issue in certain situations due to icon caching
- Fix minor memory leak in workflows using metadata querier

### 2.0.3 18th Apr 2013

- Give Alfred's Auto Updater its own tab with change log
- Migrate user set hotkeys and keywords when updating a workflow
- Make no results from a script filter correctly fall back to fallbacks
- Make the script filter item uid attribute optional, and generate a UUID for these instead. This prevents Alfred from learning the returned result order so will respect the XML returned order
- Sort saved workflow [input] objects based on y position for more predictable initial no-knowledge ordering
- Add hidden knowledge for placeholder items - Allows for web searches / workflows to be ranked higher in the default results
- better logic on alternative modifiers, allows default mod actions on invalid results
- Respect opening contacts metadata files in Alfred's contact viewer if setup
- don't show "View contact in Alfred' subtext for non Powerpack users
- Capitalise Finder in 'reveal file in finder' modifier press subtext
- Fix spelling mistake 'searchces' when deleting a custom search
- add option to escape backslashes in {query} for scripting
- default backslash escaping for script workflow templates and examples
- When using cmd+c on a contact in Alfred's results, copy the name rather than the contact id
- Reset iTunes mini player if node stack typed mismatch, prevents nil caused double characters
- Add placeholder AppleScript for NSAppleScript configuration window with no AppleScript
- improve "Open With" matching to use kMDItemKeywords fields which also match app char names from 10.8.3
- fix issue with typed word not showing with define keyword in certain scenarios
- Add and improve timer logging for better performance profiling
- Change resizing mode on snippets table in prefs to make more useful
- If cmd+down on file, navigate into the containing folder
- Show reason sheet why non-PP users can't import themes or workflows rather than just not doing anything
- more efficient eject workflow which only loads the volumes if it needs to
- Don't grey out advanced 'sync' button for non-Powerpack users, instead, explain Powerpack is needed
- Rename 'Update" to "Save" in the workflows detail editor to prevent confusion
- If a person is marked as a company, then prefix with the company in Alfred's results
- Add in support for Mailplane 3 email attachments
- Trim large type text to ensure there are no hanging characters before displaying
- More clear 'grey out' behaviour for alt connection sheet when selecting 'none' as the connection modifier
- show full path at bottom of recent documents window
- Add type to filter documents in the recent documents action
- Fix some text in the v1 import sheet
- Switch out some unused NSLogs
- add resilience against certain Address Book scenarios
- Move application file cache database into app support folder to prevent auto cache cleaner apps from breaking or slowing Alfred
- Fix issue where joining comments and keywords in the app cache caused a selector not found when assuming an id was an array
- More robust default browser selection when populating browser info into workflow object config browser selection
- Fix time modifiers for snippets e.g. {time:short}
- Code review and remove the unused update controllers from the general prefs
- Fix spelling mistake in Google Suggest workflow example

### 2.0.2 23rd Mar 2013

- Improved app discovery and caching allowing for apps such as iPhone Simulator to be found if folder added to search scope
- Improved 'Browse in Alfred' workflow action, now allowing for more control over which folder is browsed
- iTunes keywords now available in Alfred's default results, if enabled in Alfred's iTunes > Keywords preferences
- Flatten app cache search string for more reliable internationalised app searching such as Russian
- Fully resolve symlinks in Alfred.alfredpreferences path which prevented preferences not being saving in certain scenarios
- Add error reporting to Alfred's preferences when a preference can't be saved for better user feedback
- Only enable the clipboard merge preferences if Alfred's clipboard history is enabled to prevent confusion
- Make {query} work in the script filter placeholder fields as they do in keyword / custom search fields for consistency
- Add selected theme to the 'not synced' info text in advanced prefs (allows for different theme per Mac)
- Search by phonetic names in the contacts searcher for better internationalised support
- Don't show the 'no update data available' warning on a background auto-update check
- Clean up unnecessary data in the app support folder when it is no longer needed
- Remove lightening bolt text from iTunes prefs as this is no longer in v2
- Clean up previous main results when switching from a typed query to a ' query in a single shot
- Make keyword optional when saving a snippet, as it's not really needed (as per v1)
- Better main app icon without aliasing at certain icon sizes
- Escape $ in the copy to / move to actions
- Escape ()[] in 'Open Terminal Here' action

### 2.0.1 16th Mar 2013

- v1 Settings Migration button in Alfred's General prefs for upgrading users
- Allow smaller prefs height for 11" Airs and 13" MacBooks
- Add an 'Edit Details' on the right click workflow popup in the workflows list, does the same as double clicking
- Fix dictionary prefs to show popup if localised name is missing for a language
- Show Alfred preferences with keyword 'alfred' and don't show Alfred 2.app in the search results (once cache is cleared)
- Force find apps marked as MDSystemFile such as Emacs, MacVim. Will also find e.g. Screen Sharing.app if containing folder is added to scope
- enter auto complete on snip keyword (missing internal UID). e.g. type sn, press return on placeholder, filter snippet
- Resilience against font not found for Menlo in Preferences causing prefs to malfunction
- Allow cmd+a as hotkey again, a number of v1 users were using cmd+a to show Alfred
- Fix plain text paste template workflow, now works correctly
- Trim a URL before opening it allowing for pasted URLs with trailing newlines to work

### 2.0 14th Mar 2013

Initial public version

### Latest Blog Post:

Alfred 6 Expanded Sneak Peek

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
