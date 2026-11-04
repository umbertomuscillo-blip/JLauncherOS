import { useEffect, useRef } from 'react';

export interface UseTrackpadSwipeOptions {
  /** Invocato quando le dita scorrono verso sinistra (deltaX > 0) -> Avanti / Pagina Successiva */
  onSwipeLeft: () => void;
  /** Invocato quando le dita scorrono verso destra (deltaX < 0) -> Indietro / Pagina Precedente */
  onSwipeRight: () => void;
  /** Se true, disabilita l'ascolto (es. se un modal è aperto o c'è un drag attivo) */
  disabled?: boolean;
  /** Soglia minima di pixel accumulati per far scattare la transizione (default: 45) */
  threshold?: number;
  /** Tempo di cooldown in millisecondi per assorbire l'inerzia del trackpad macOS (default: 400) */
  cooldownMs?: number;
}

/**
 * Hook React per la navigazione a due dita sul trackpad di macOS.
 * Intercetta i gesti orizzontali ad alta precisione scartando lo scroll verticale,
 * accumulando il delta e applicando un cooldown anti-rimbalzo per garantire che
 * ogni gesto cambi esattamente una pagina/spazio alla volta.
 */
export function useTrackpadSwipe({
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  threshold = 45,
  cooldownMs = 400,
}: UseTrackpadSwipeOptions): void {
  const accumulatedDeltaXRef = useRef(0);
  const lastTriggerTimeRef = useRef(0);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (disabled) return;

    const handleWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // Scartiamo eventi verticali o rumore di micro-spostamenti
      if (absX < 6 || absX < absY * 1.4) {
        return;
      }

      const now = Date.now();
      if (now - lastTriggerTimeRef.current < cooldownMs) {
        // In cooldown: assorbiamo l'inerzia del trackpad senza re-innescare
        return;
      }

      accumulatedDeltaXRef.current += e.deltaX;

      // Se il gesto si ferma per 140ms, azzeriamo l'accumulatore
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = window.setTimeout(() => {
        accumulatedDeltaXRef.current = 0;
        resetTimerRef.current = null;
      }, 140);

      // Attivazione transizione se la soglia è superata
      if (accumulatedDeltaXRef.current >= threshold) {
        lastTriggerTimeRef.current = now;
        accumulatedDeltaXRef.current = 0;
        if (resetTimerRef.current !== null) {
          window.clearTimeout(resetTimerRef.current);
          resetTimerRef.current = null;
        }
        onSwipeLeft();
      } else if (accumulatedDeltaXRef.current <= -threshold) {
        lastTriggerTimeRef.current = now;
        accumulatedDeltaXRef.current = 0;
        if (resetTimerRef.current !== null) {
          window.clearTimeout(resetTimerRef.current);
          resetTimerRef.current = null;
        }
        onSwipeRight();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, [disabled, threshold, cooldownMs, onSwipeLeft, onSwipeRight]);
}

export default useTrackpadSwipe;
