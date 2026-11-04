# 🎨 SPECIFICHE DI DESIGN: JLAUNCHEROS & APPLE LIQUID GLASS

## 1. Principi Guida del Design ("Zero-AI Tells")

Il design di **JLauncherOS** rifiuta gli stereotipi visivi generati dalle AI (gradienti viola saturi, ombre sfocate generiche, icone vettoriali approssimative, layout bento schematici senza gerarchia). L'estetica segue rigorosamente i canoni dell'**Apple Human Interface Guidelines (HIG)** e del materiale **Liquid Glass**:

### Regola Fondamentale dei Due Livelli (Apple HIG)
1. **Content Layer (Il Contenuto):**
   - Testo, icone native delle applicazioni, copertine degli album, tracciati meteo e grafici posano su superfici solide e leggibili con contrasto netto.
   - Nessun effetto vetro o sfocatura applicato internamente al contenuto.
2. **Functional Layer (I Controlli):**
   - Barre di navigazione, pillola di ricerca, controlli flottanti del vinile e cornice del Notch utilizzano il materiale **Liquid Glass**:
     ```css
     background: linear-gradient(160deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 40%, rgba(4, 17, 28, 0.65) 100%);
     backdrop-filter: blur(28px) saturate(140%);
     -webkit-backdrop-filter: blur(28px) saturate(140%);
     border: 1px solid rgba(255, 255, 255, 0.14);
     box-shadow: 0 28px 60px rgba(0, 0, 0, 0.52), inset 0 1px 0 rgba(255, 255, 255, 0.22);
     ```

---

## 2. Tipografia e Numeri Tabulari
- **Font di Sistema:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui`.
- **Numeri Meccanici:** Tutti i contatori numerici (timer countdown, percentuali batteria, gradi meteo, minutaggio audio) utilizzano obbligatoriamente `font-variant-numeric: tabular-nums` per evitare jitter o micro-spostamenti durante il rendering in tempo reale.
- **Pesi Calibrati:** Titoli in `fontWeight: 700` o `800`, label secondarie in `fontWeight: 500` con colore attenuato `rgba(255, 255, 255, 0.65)`.

---

## 3. Dinamica di Movimento (Motion & Springs)
- **Curve di Easing:** Tutte le transizioni grafiche sfruttano le curve fisiche Apple:
  - `var(--ease-apple-spring)` = `cubic-bezier(0.22, 1, 0.36, 1)`
  - `var(--ease-apple-fluid)` = `cubic-bezier(0.16, 1, 0.3, 1)`
- **Hover & Feedback:**
  - Le icone delle app si sollevano dolcemente con `transform: translateY(-4px) scale(1.05)` e ombra di contatto realistica a doppio raggio.
  - Al click (`active`), rispondono con un leggero assestamento elastico a `scale(0.97)`.
- **Accessibilità:** Pieno rispetto di `prefers-reduced-motion` per azzerare i tempi di transizione per gli utenti che richiedono interfaccia statica.
