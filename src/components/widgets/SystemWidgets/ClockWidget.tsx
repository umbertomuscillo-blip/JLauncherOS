import { memo, useEffect, useRef, useState, type FC } from 'react';
import { Globe, Sun, Moon } from 'lucide-react';
import type { ClockWidgetStyle, WidgetConfig, WidgetSize } from '~types';
import { useVisibilityPause } from '@/context/VisibilityPauseContext';

interface ClockWidgetProps {
  widget: WidgetConfig;
  size?: WidgetSize;
}

export const ClockWidget: FC<ClockWidgetProps> = memo(({ widget, size = widget.size }) => {
  const { isAnimationPaused } = useVisibilityPause();
  const [time, setTime] = useState<Date>(() => new Date());

  const secondHandRef = useRef<HTMLDivElement | null>(null);
  const minuteHandRef = useRef<HTMLDivElement | null>(null);
  const hourHandRef = useRef<HTMLDivElement | null>(null);

  const style: ClockWidgetStyle =
    (widget.settings?.style as ClockWidgetStyle) || 'analog';

  // 120Hz Sweeping animation loop per l'orologio analogico
  useEffect(() => {
    if (isAnimationPaused) return;

    let animId: number;
    const updateSweepingClock = () => {
      const now = new Date();
      const ms = now.getMilliseconds();
      const s = now.getSeconds();
      const m = now.getMinutes();
      const h = now.getHours();

      const secDeg = (s + ms / 1000) * 6;
      const minDeg = (m + s / 60) * 6;
      const hourDeg = ((h % 12) + m / 60) * 30;

      if (secondHandRef.current) {
        secondHandRef.current.style.transform = `rotateZ(${secDeg}deg) translateZ(0)`;
      }
      if (minuteHandRef.current) {
        minuteHandRef.current.style.transform = `rotateZ(${minDeg}deg) translateZ(0)`;
      }
      if (hourHandRef.current) {
        hourHandRef.current.style.transform = `rotateZ(${hourDeg}deg) translateZ(0)`;
      }

      animId = requestAnimationFrame(updateSweepingClock);
    };

    animId = requestAnimationFrame(updateSweepingClock);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isAnimationPaused]);

  // Aggiornamento discreto ogni secondo per orologio digitale e world clock
  useEffect(() => {
    if (isAnimationPaused) return;

    const timer = window.setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isAnimationPaused]);

  // ───────────────────────── 1. ANALOG SWISS CLOCK (120Hz) ─────────────────────────
  if (style === 'analog') {
    const isSmall = size === '1x1';

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-3 rounded-3xl bg-neutral-900/75 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden select-none">
        {/* Dial Face */}
        <div className={`relative ${isSmall ? 'w-24 h-24' : 'w-28 h-28 sm:w-32 sm:h-32'} rounded-full bg-neutral-950/80 border border-white/20 shadow-inner flex items-center justify-center`}>
          {/* Hour tick marks */}
          {[...Array(12)].map((_, i) => {
            const angle = i * 30;
            const isCardinal = i % 3 === 0;
            return (
              <div
                key={i}
                className="absolute w-full h-full flex justify-center pointer-events-none"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div
                  className={`rounded-full ${
                    isCardinal ? 'w-1 h-2.5 bg-white' : 'w-0.5 h-1.5 bg-white/40'
                  }`}
                />
              </div>
            );
          })}

          {/* Hour Hand */}
          <div
            ref={hourHandRef}
            className="absolute w-full h-full flex justify-center items-center pointer-events-none"
            style={{ willChange: 'transform' }}
          >
            <div className="w-1.5 h-9 bg-white rounded-full -translate-y-4.5 shadow-md" />
          </div>

          {/* Minute Hand */}
          <div
            ref={minuteHandRef}
            className="absolute w-full h-full flex justify-center items-center pointer-events-none"
            style={{ willChange: 'transform' }}
          >
            <div className="w-1 h-13 bg-white/90 rounded-full -translate-y-6.5 shadow-sm" />
          </div>

          {/* Sweeping 120Hz Second Hand */}
          <div
            ref={secondHandRef}
            className="absolute w-full h-full flex justify-center items-center pointer-events-none"
            style={{ willChange: 'transform' }}
          >
            <div className="w-0.5 h-15 bg-amber-400 rounded-full -translate-y-7 shadow-xs" />
            <div className="w-1.5 h-3 bg-amber-400 rounded-full translate-y-1.5 opacity-80" />
          </div>

          {/* Center Pin Cap */}
          <div className="absolute w-3 h-3 rounded-full bg-amber-400 border border-neutral-900 shadow-md z-10" />
        </div>

        {!isSmall && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 mt-1">
            Svizzero • 120Hz
          </span>
        )}
      </div>
    );
  }

  // ───────────────────────── 2. DIGITAL FLIP CLOCK ─────────────────────────
  if (style === 'digital_flip') {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    const dayName = time.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
    const dateStr = time.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

    return (
      <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/80 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-xs text-white/60 font-semibold tracking-wider">
          <span>{dayName}</span>
          <span className="text-amber-400 font-mono">{dateStr}</span>
        </div>

        {/* Flip Cards Container */}
        <div className="flex items-center justify-center gap-2 my-auto py-1">
          {/* Hours Card */}
          <div className="relative flex flex-col items-center justify-center w-16 sm:w-20 h-16 sm:h-18 rounded-2xl bg-neutral-950 border border-white/15 shadow-xl overflow-hidden font-mono text-3xl sm:text-4xl font-extrabold text-white">
            <span>{hours}</span>
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 shadow-xs" />
          </div>

          <span className="text-2xl font-bold text-amber-400 animate-pulse">:</span>

          {/* Minutes Card */}
          <div className="relative flex flex-col items-center justify-center w-16 sm:w-20 h-16 sm:h-18 rounded-2xl bg-neutral-950 border border-white/15 shadow-xl overflow-hidden font-mono text-3xl sm:text-4xl font-extrabold text-white">
            <span>{minutes}</span>
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 shadow-xs" />
          </div>

          <span className="text-2xl font-bold text-amber-400 animate-pulse">:</span>

          {/* Seconds Card */}
          <div className="relative flex flex-col items-center justify-center w-12 sm:w-14 h-16 sm:h-18 rounded-2xl bg-neutral-950 border border-white/15 shadow-xl overflow-hidden font-mono text-xl sm:text-2xl font-extrabold text-amber-400">
            <span>{seconds}</span>
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 shadow-xs" />
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-white/40 pt-1 border-t border-white/5 font-mono">
          <span>PALETTE FLIP CLOCK</span>
          <span>FUSO: ROMA (GMT+1)</span>
        </div>
      </div>
    );
  }

  // ───────────────────────── 3. WORLD CLOCK ─────────────────────────
  const cities = [
    { name: 'Roma / Bari', timezone: 'Europe/Rome', offset: '+0h (Locale)' },
    { name: 'New York', timezone: 'America/New_York', offset: '-6h' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo', offset: '+7h' },
    { name: 'Londra', timezone: 'Europe/London', offset: '-1h' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/75 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
          <Globe size={13} className="text-sky-400" />
          Orologio Mondiale
        </span>
        <span className="text-[10px] text-white/50 font-mono">UTC Sync</span>
      </div>

      <div className="grid grid-cols-2 gap-2 my-auto py-1">
        {cities.map((c) => {
          const cityTime = new Date(time.toLocaleString('en-US', { timeZone: c.timezone }));
          const hours = cityTime.getHours();
          const isDay = hours >= 6 && hours < 18;
          const formatted = cityTime.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={c.name}
              className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/10"
            >
              <div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-white/90">
                  {isDay ? <Sun size={11} className="text-amber-400" /> : <Moon size={11} className="text-indigo-300" />}
                  <span>{c.name}</span>
                </div>
                <span className="text-[9px] text-white/40 font-mono">{c.offset}</span>
              </div>
              <span className="text-sm font-bold font-mono text-white">{formatted}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[10px] text-white/40 pt-1 border-t border-white/5 font-mono">
        <span>4 FUSI ORARI GLOBALI</span>
        <span>TEMPO REALE</span>
      </div>
    </div>
  );
});

ClockWidget.displayName = 'ClockWidget';
export default ClockWidget;
