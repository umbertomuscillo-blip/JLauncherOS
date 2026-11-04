import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import type { MediaTrackState } from "../../types/ipc_schema";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Disc3,
  Waves,
  Sparkles,
} from "lucide-react";

type VisualizerMode = "vinyl" | "waves" | "ambient_art";

export const VinylTurntableStudio: React.FC = () => {
  const { call, subscribe } = useWebSocket();

  const [track, setTrack] = useState<MediaTrackState>({
    title: "Midnight City (Vinyl Edition)",
    artist: "M83 & JARVIS Sound Lab",
    album: "Hurry Up, We're Dreaming",
    duration_seconds: 244,
    position_seconds: 68,
    is_playing: true,
    player_app: "Spotify",
    vinyl_rpm: 33,
    volume: 85,
    album_art_url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80",
  });

  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>("vinyl");
  const [rpm, setRpm] = useState<33 | 45>(33);
  const [rotationDegree, setRotationDegree] = useState<number>(0);

  // Caricamento Dati Iniziali e Sottoscrizione
  useEffect(() => {
    const fetchState = async () => {
      try {
        const state = await call<MediaTrackState>("media.getPlaybackState");
        if (state?.result) setTrack(state.result);
      } catch (e) {
        console.warn("Fetch playback state fallito:", e);
      }
    };
    fetchState();

    const unsub = subscribe("event.media.trackChanged", (updated: MediaTrackState) => {
      setTrack((prev) => ({ ...prev, ...updated }));
    });

    return () => unsub();
  }, [call, subscribe]);

  // Animazione Rotazione Vinile a 120 FPS
  useEffect(() => {
    let animFrame: number;
    const speed = (rpm === 45 ? 1.35 : 1.0) * 0.75;

    const animate = () => {
      if (track.is_playing) {
        setRotationDegree((prev) => (prev + speed) % 360);
      }
      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [track.is_playing, rpm]);

  // Controlli Playback
  const handleTogglePlay = async () => {
    try {
      const res = await call<MediaTrackState>("media.controlPlayback", { action: "play_pause" });
      if (res?.result) setTrack((prev) => ({ ...prev, ...res.result }));
    } catch (e) {
      console.error("Errore play/pause:", e);
    }
  };

  const handleNext = async () => {
    try {
      const res = await call<MediaTrackState>("media.controlPlayback", { action: "next" });
      if (res?.result) setTrack((prev) => ({ ...prev, ...res.result }));
    } catch (e) {
      console.error("Errore next:", e);
    }
  };

  const handlePrevious = async () => {
    try {
      const res = await call<MediaTrackState>("media.controlPlayback", { action: "previous" });
      if (res?.result) setTrack((prev) => ({ ...prev, ...res.result }));
    } catch (e) {
      console.error("Errore prev:", e);
    }
  };

  // Formattazione Tempo
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "1360px",
        height: "calc(100vh - 120px)",
        padding: "20px 30px",
        boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Top Header Mode Selector */}
      <div
        className="apple-liquid-glass"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "8px 18px",
          borderRadius: "20px",
          transition: "all 0.25s var(--ease-apple-spring)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Disc3 size={20} color="#bf5af2" />
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.5px" }}>
            Vinyl Turntable Studio & Full-Screen Visualizer
          </span>
        </div>

        {/* Mode Switcher Buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "vinyl", label: "Turntable", icon: <Disc3 size={13} /> },
            { id: "waves", label: "Waves", icon: <Waves size={13} /> },
            { id: "ambient_art", label: "Ambient Art", icon: <Sparkles size={13} /> },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setVisualizerMode(mode.id as VisualizerMode)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "10px",
                border: "none",
                background: visualizerMode === mode.id ? "#bf5af2" : "rgba(255, 255, 255, 0.08)",
                color: visualizerMode === mode.id ? "#ffffff" : "#a1a1a6",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 🎵 MAIN STAGE: VINYL DECK / WAVES / AMBIENT COVER                    */}
      {/* ==================================================================== */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          position: "relative",
          margin: "20px 0",
        }}
      >
        {/* MODE 1: REALISTIC SLIPCASE JACKET + EMERGING SPLATTER VINYL + TONEARM (IMG_0140.jpg) */}
        {visualizerMode === "vinyl" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: "28px 48px",
            }}
          >
            {/* Full-bleed Ambient Album Art Backdrop */}
            <div
              aria-hidden="true"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: -2,
                backgroundImage: `url("${
                  track.album_art_url ||
                  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=900&auto=format&fit=crop&q=85"
                }")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(76px) saturate(160%) brightness(0.36)",
                transform: "scale(1.15)",
                pointerEvents: "none",
              }}
            />

            {/* Left: Cardboard Vinyl Slipcase Jacket Sleeve (IMG_0140.jpg) */}
            <div
              style={{
                width: "330px",
                height: "330px",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "24px 28px 64px rgba(0, 0, 0, 0.85), -4px 0 12px rgba(0, 0, 0, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                position: "relative",
                zIndex: 3,
                flexShrink: 0,
              }}
            >
              <img
                src={
                  track.album_art_url ||
                  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=85"
                }
                alt={track.album}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {/* Cardboard Spine Highlight */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.22) 0%, transparent 4%, transparent 96%, rgba(0,0,0,0.45) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Center-Right: Emerging Grooved Splatter Vinyl Disc + Metallic Tonearm (IMG_0140.jpg) */}
            <div
              style={{
                position: "relative",
                width: "340px",
                height: "340px",
                marginLeft: "-96px",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Spinning Grooved Vinyl Record */}
              <div
                style={{
                  width: "326px",
                  height: "326px",
                  borderRadius: "50%",
                  background: `
                    repeating-radial-gradient(
                      circle at 50% 50%,
                      rgba(255, 255, 255, 0.035) 0px,
                      rgba(255, 255, 255, 0.035) 1px,
                      #0b0c10 2px,
                      #07080b 4px
                    ),
                    conic-gradient(
                      from 0deg,
                      #090a0f 0deg,
                      #262833 42deg,
                      #090a0f 90deg,
                      #1f212b 135deg,
                      #090a0f 180deg,
                      #262833 225deg,
                      #090a0f 270deg,
                      #1f212b 315deg,
                      #090a0f 360deg
                    )
                  `,
                  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.9), inset 0 0 18px rgba(255, 255, 255, 0.12)",
                  border: "2px solid #1e2028",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `rotate(${rotationDegree}deg)`,
                  willChange: "transform",
                }}
              >
                {/* Center Album Art Vinyl Label Sticker */}
                <div
                  style={{
                    width: "112px",
                    height: "112px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    position: "relative",
                    border: "3px solid rgba(255, 255, 255, 0.85)",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.75)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={
                      track.album_art_url ||
                      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=80"
                    }
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#090a0f",
                      border: "2px solid rgba(255, 255, 255, 0.7)",
                    }}
                  />
                </div>
              </div>

              {/* Precision Metallic Tonearm Assembly (IMG_0140.jpg right side) */}
              <svg
                width="160"
                height="300"
                viewBox="0 0 160 300"
                fill="none"
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-64px",
                  pointerEvents: "none",
                  transformOrigin: "115px 44px",
                  transform: track.is_playing ? "rotate(18deg)" : "rotate(0deg)",
                  transition: "transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)",
                  filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.75))",
                }}
              >
                {/* Gimbal Base */}
                <circle cx="115" cy="44" r="24" fill="#1C1D24" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
                <circle cx="115" cy="44" r="14" fill="#8E8E93" />
                {/* Counterweight */}
                <rect x="106" y="10" width="18" height="16" rx="4" fill="#636366" />
                {/* Brushed Aluminum Arm Tube */}
                <path
                  d="M115 44 L102 195 L74 238"
                  stroke="#E5E5EA"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Cartridge Headshell */}
                <g transform="rotate(32 74 238)">
                  <rect x="64" y="228" width="18" height="28" rx="3" fill="#18191F" stroke="#FFFFFF" strokeWidth="1.2" />
                  <rect x="69" y="254" width="8" height="5" rx="1" fill="#FF9500" />
                </g>
              </svg>
            </div>

            {/* Minimal Speed Selector Pill */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginLeft: "68px" }}>
              {[33, 45].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setRpm(speed as 33 | 45)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.16)",
                    background: rpm === speed ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {speed} RPM
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MODE 2: WAVES VISUALIZER (LAUNCHME 2.08 STYLE) */}
        {visualizerMode === "waves" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              gap: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "160px" }}>
              {Array.from({ length: 48 }).map((_, i) => {
                const heightFactor = Math.sin((i / 48) * Math.PI) * (track.is_playing ? 0.7 + (i % 5) * 0.08 : 0.2);
                return (
                  <span
                    key={i}
                    style={{
                      width: "6px",
                      height: `${Math.max(8, Math.round(heightFactor * 140))}px`,
                      borderRadius: "4px",
                      background: "linear-gradient(to top, #bf5af2, #0a84ff)",
                      boxShadow: "0 0 12px rgba(191, 90, 242, 0.4)",
                      transition: "height 0.12s ease",
                    }}
                  />
                );
              })}
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff" }}>{track.title}</span>
              <p style={{ fontSize: "14px", color: "#a1a1a6", margin: "4px 0 0 0" }}>
                {track.artist} — {track.album}
              </p>
            </div>
          </div>
        )}

        {/* MODE 3: AMBIENT FULL-SCREEN ART */}
        {visualizerMode === "ambient_art" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              position: "relative",
            }}
          >
            {/* Ambient Blurred Aura */}
            <div
              style={{
                position: "absolute",
                width: "480px",
                height: "480px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(191,90,242,0.4) 0%, rgba(10,132,255,0.2) 60%, transparent 100%)",
                filter: "blur(60px)",
                animation: "pulse 4s infinite alternate",
              }}
            />

            <div
              style={{
                width: "360px",
                height: "360px",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 25px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(191, 90, 242, 0.4)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                zIndex: 2,
              }}
            >
              <img
                src={track.album_art_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80"}
                alt={track.album}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 🎛️ FLOATING LIQUID GLASS CONTROLS PILL                              */}
      {/* ==================================================================== */}
      <div
        className="apple-liquid-glass"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "840px",
          padding: "14px 28px",
          borderRadius: "999px",
          transition: "all 0.28s var(--ease-apple-spring)",
        }}
      >
        {/* Track Title and Artist */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "220px" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {track.title}
          </span>
          <span style={{ fontSize: "11px", color: "#a1a1a6" }}>{track.artist}</span>
        </div>

        {/* Center Controls & Timeline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1, maxWidth: "380px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <button
              onClick={handlePrevious}
              style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={handleTogglePlay}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#bf5af2",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(191, 90, 242, 0.6)",
              }}
            >
              {track.is_playing ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              onClick={handleNext}
              style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Interactive Timeline Scrubber */}
          <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "10px", color: "#8e8e93", fontVariantNumeric: "tabular-nums" }}>
              {formatTime(track.position_seconds)}
            </span>
            <input
              type="range"
              min={0}
              max={track.duration_seconds || 300}
              value={track.position_seconds || 0}
              onChange={async (e) => {
                const newPos = parseInt(e.target.value, 10);
                setTrack((p) => ({ ...p, position_seconds: newPos }));
                await call("media.seek", { position_seconds: newPos });
              }}
              style={{ flex: 1, accentColor: "#bf5af2", cursor: "pointer" }}
            />
            <span style={{ fontSize: "10px", color: "#8e8e93", fontVariantNumeric: "tabular-nums" }}>
              {formatTime(track.duration_seconds)}
            </span>
          </div>
        </div>

        {/* Volume & Details */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#a1a1a6" }}>
          <Volume2 size={16} />
          <span style={{ fontSize: "11px", fontWeight: 600 }}>{track.volume ?? 85}%</span>
        </div>
      </div>
    </div>
  );
};

export default VinylTurntableStudio;
