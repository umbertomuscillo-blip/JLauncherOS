import React, { useEffect, useRef } from 'react';
import { useLauncherState } from '@/context/LauncherStateContext';
import { useVisibilityPause } from '@/context/VisibilityPauseContext';
import { iconSrc } from '@/services/tauriBridge';

export const WallpaperRenderer: React.FC = () => {
  const { theme } = useLauncherState();
  const { isAnimationPaused } = useVisibilityPause();
  const { wallpaper, glassMode, glassTintColorHex } = theme;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sunCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const weatherCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Zero-Resource Pause sui Live Video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isAnimationPaused) {
      video.pause();
    } else {
      void video.play().catch(() => {});
    }
  }, [isAnimationPaused]);

  // 2. Dynamic Sun Canvas: calcolo procedurale astronomico
  useEffect(() => {
    if (wallpaper.type !== 'dynamic_sun') return;
    const canvas = sunCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number | null = null;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (isAnimationPaused) return;

      const now = new Date();
      const hours = now.getHours() + now.getMinutes() / 60;
      const w = canvas.width;
      const h = canvas.height;

      // Angolo del sole: dalle 06:00 alle 18:00 attraversa l'arco
      const isDay = hours >= 6 && hours <= 18;
      const dayProgress = (hours - 6) / 12; // 0 all'alba, 0.5 a mezzogiorno, 1 al tramonto

      const grad = ctx.createLinearGradient(0, 0, 0, h);

      if (isDay) {
        if (dayProgress < 0.25) {
          // Alba
          grad.addColorStop(0, '#1a1c38');
          grad.addColorStop(0.4, '#4a2545');
          grad.addColorStop(0.8, '#c24b42');
          grad.addColorStop(1, '#ff9a56');
        } else if (dayProgress < 0.75) {
          // Giorno pieno
          grad.addColorStop(0, '#0a4275');
          grad.addColorStop(0.5, '#1e6fba');
          grad.addColorStop(1, '#64b5f6');
        } else {
          // Tramonto
          grad.addColorStop(0, '#10132b');
          grad.addColorStop(0.4, '#391c49');
          grad.addColorStop(0.7, '#962b49');
          grad.addColorStop(1, '#f2784b');
        }
      } else {
        // Notte profonda stellata
        grad.addColorStop(0, '#040714');
        grad.addColorStop(0.5, '#0a1128');
        grad.addColorStop(1, '#001f54');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Posizione e disco solare o lunare
      if (isDay) {
        const sunX = w * (0.15 + dayProgress * 0.7);
        const sunY = h * 0.85 - Math.sin(dayProgress * Math.PI) * (h * 0.65);

        // Alone solare
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 220);
        sunGlow.addColorStop(0, 'rgba(255, 245, 200, 0.95)');
        sunGlow.addColorStop(0.3, 'rgba(255, 210, 120, 0.45)');
        sunGlow.addColorStop(1, 'rgba(255, 180, 80, 0)');

        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 220, 0, Math.PI * 2);
        ctx.fill();

        // Nucleo sole
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Luna notturna
        const moonX = w * 0.75;
        const moonY = h * 0.22;
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 5, moonX, moonY, 100);
        moonGlow.addColorStop(0, 'rgba(240, 245, 255, 0.8)');
        moonGlow.addColorStop(0.4, 'rgba(180, 205, 240, 0.25)');
        moonGlow.addColorStop(1, 'rgba(100, 150, 220, 0)');

        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 100, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f0f5ff';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    if (!isAnimationPaused) {
      animId = requestAnimationFrame(render);
    }

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [wallpaper.type, isAnimationPaused]);

  // 3. Dynamic Weather Canvas: simulatore particellare 120Hz
  useEffect(() => {
    if (wallpaper.type !== 'dynamic_weather') return;
    const canvas = weatherCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number | null = null;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particelle meteo (pioggia o neve)
    const count = 120;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 3 + Math.random() * 8,
      length: 10 + Math.random() * 15,
      opacity: 0.2 + Math.random() * 0.5,
      sway: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      if (isAnimationPaused) return;

      const w = canvas.width;
      const h = canvas.height;

      // Sfondo cielo piovoso / nuvoloso
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#334155');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Disegna e aggiorna particelle
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 1.4;

      for (const p of particles) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 1, p.y + p.length);
        ctx.stroke();

        p.y += p.speed;
        p.x -= 0.6;

        if (p.y > h) {
          p.y = -20;
          p.x = Math.random() * (w + 100);
        }
      }

      animId = requestAnimationFrame(render);
    };

    if (!isAnimationPaused) {
      animId = requestAnimationFrame(render);
    }

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [wallpaper.type, isAnimationPaused]);

  // Sezione Sfondo Statico o Fallback
  const isDynamicHeic = wallpaper.type === 'dynamic_heic';
  const isDayHeic = new Date().getHours() >= 6 && new Date().getHours() <= 18;

  // Stile colore di sfumatura per Liquid Glass Tinted
  const tintOverlay =
    glassMode === 'tinted' && glassTintColorHex ? (
      <div
        style={{
          backgroundColor: glassTintColorHex,
          opacity: 0.18,
          mixBlendMode: 'color',
        }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />
    ) : null;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Sfondo Statico */}
      {wallpaper.type === 'static' && wallpaper.filePath && (
        <img
          src={iconSrc(wallpaper.filePath)}
          alt=""
          className="w-full h-full object-cover animate-in fade-in duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      )}

      {/* 2. Sfondo Statico Fallback (Gradiente Cosmico macOS Tahoe) */}
      {wallpaper.type === 'static' && !wallpaper.filePath && (
        <div
          className="w-full h-full"
          style={{
            background:
              'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
          }}
        />
      )}

      {/* 3. Dynamic HEIC (Giorno / Notte) */}
      {isDynamicHeic && (
        <div
          className="w-full h-full transition-colors duration-1000"
          style={{
            background: isDayHeic
              ? 'radial-gradient(circle at 50% 20%, #38bdf8 0%, #0284c7 40%, #0c4a6e 100%)'
              : 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
          }}
        />
      )}

      {/* 4. Live Video con Zero-Resource Pause */}
      {wallpaper.type === 'live_video' && (
        <video
          ref={videoRef}
          src={
            wallpaper.filePath
              ? iconSrc(wallpaper.filePath)
              : 'https://assets.mixkit.co/videos/preview/mixkit-curved-lines-of-light-on-a-dark-background-31475-large.mp4'
          }
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      )}

      {/* 5. Dynamic Sun Canvas */}
      {wallpaper.type === 'dynamic_sun' && (
        <canvas ref={sunCanvasRef} className="w-full h-full block" />
      )}

      {/* 6. Dynamic Weather Canvas */}
      {wallpaper.type === 'dynamic_weather' && (
        <canvas ref={weatherCanvasRef} className="w-full h-full block" />
      )}

      {/* Tinta di fondo se Liquid Glass Tinted */}
      {tintOverlay}

      {/* Layer Wallpaper Blur regolabile */}
      <div
        style={{
          backdropFilter: `blur(${wallpaper.blurIntensity * 0.42}px)`,
          WebkitBackdropFilter: `blur(${wallpaper.blurIntensity * 0.42}px)`,
          backgroundColor: `rgba(0, 0, 0, ${Math.min(0.65, 0.15 + (wallpaper.blurIntensity / 100) * 0.35)})`,
        }}
        className="absolute inset-0 transition-[backdrop-filter,background-color] duration-150"
        aria-hidden="true"
      />
    </div>
  );
};

export default WallpaperRenderer;
