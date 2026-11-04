import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import PixelPet from "./PixelPet";
import type {
  VoiceState,
  VoiceStateChangedEvent,
  MediaTrackState,
  ClipboardItem,
  ClipboardGetHistoryResult,
  ShelfItem,
  ShelfGetFilesResult,
  WeatherData,
} from "../../types/ipc_schema";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clock,
  Sparkles,
  Clipboard as ClipboardIcon,
  FolderDown,
  Palette,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Volume2,
  Star,
} from "lucide-react";
import {
  MacAppSquircleIcon,
  WeatherArtworkIcon,
} from "../icons/LaunchMeIcons";

type NotchTab = "overview" | "music" | "timer" | "clipboard" | "shelf" | "themes";
type NotchTheme = "neon_glow" | "frosted_dark" | "liquid_cyan" | "oled_black";

export const DynamicNotchIsland: React.FC = () => {
  const { call, subscribe } = useWebSocket();

  // Stati Generali del Notch
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NotchTab>("overview");
  const [notchTheme, setNotchTheme] = useState<NotchTheme>("neon_glow");

  // Stato Vocale e Audio
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [amplitude, setAmplitude] = useState<number>(0);

  // Stato Media / Music Player
  const [mediaTrack, setMediaTrack] = useState<MediaTrackState>({
    title: "Midnight City (Vinyl Edition)",
    artist: "M83 & JARVIS Sound Lab",
    album: "Hurry Up, We're Dreaming",
    duration_seconds: 244,
    position_seconds: 68,
    is_playing: true,
    player_app: "Spotify",
    vinyl_rpm: 33,
    volume: 80,
  });

  // Stato Timer / Pomodoro
  const [timerDuration, setTimerDuration] = useState<number>(25 * 60); // 25 min default
  const [timerRemaining, setTimerRemaining] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Stato Clipboard
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [clipFilter, setClipFilter] = useState<string>("all");
  const [clipSearch, setClipSearch] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Stato Pocket Shelf & AirDrop
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [isAirDropSending, setIsAirDropSending] = useState<boolean>(false);

  // Stato Meteo
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Web Audio Synthesizer per Chime Timer
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio fallback silent
    }
  };

  // Caricamento Dati Iniziali via IPC
  const fetchAllData = async () => {
    try {
      const mediaRes = await call<MediaTrackState>("media.getPlaybackState");
      if (mediaRes?.result) setMediaTrack(mediaRes.result);

      const clipRes = await call<ClipboardGetHistoryResult>("clipboard.getHistory", { filter_type: clipFilter, search: clipSearch });
      if (clipRes?.result?.items) setClipboardItems(clipRes.result.items);

      const shelfRes = await call<ShelfGetFilesResult>("shelf.getFiles");
      if (shelfRes?.result?.items) setShelfItems(shelfRes.result.items);

      const wRes = await call<WeatherData>("weather.getCurrent", { city: "Cupertino" });
      if (wRes?.result) setWeather(wRes.result);
    } catch (e) {
      console.warn("[DynamicNotchIsland] Fetch dati iniziali parziale:", e);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Sottoscrizioni Eventi Push
    const unsubVoice = subscribe("event.voice.stateChanged", (p: VoiceStateChangedEvent) => {
      setVoiceState(p.state);
      setAmplitude(p.audio_amplitude || 0);
    });

    const unsubMedia = subscribe("event.media.trackChanged", (p: MediaTrackState) => {
      setMediaTrack((prev) => ({ ...prev, ...p }));
    });

    return () => {
      unsubVoice();
      unsubMedia();
    };
  }, [subscribe]);

  // Gestione Tick del Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerRemaining]);

  // Controlli Media Player
  const handleMediaControl = async (action: "play" | "pause" | "play_pause" | "next" | "previous") => {
    try {
      const updated = await call<MediaTrackState>("media.controlPlayback", { action });
      if (updated?.result) setMediaTrack((prev) => ({ ...prev, ...updated.result }));
    } catch (e) {
      console.error("Errore controllo media:", e);
    }
  };

  // Controlli Clipboard
  const handleCopyClipboard = async (item: ClipboardItem) => {
    try {
      await call("clipboard.copyItem", { item_id: item.item_id });
      setCopiedId(item.item_id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      console.error("Errore copia appunti:", e);
    }
  };

  const handleDeleteClipboard = async (item_id: string) => {
    try {
      await call("clipboard.deleteItem", { item_id });
      setClipboardItems((prev) => prev.filter((i) => i.item_id !== item_id));
    } catch (e) {
      console.error("Errore rimozione elemento appunti:", e);
    }
  };

  // AirDrop Trigger
  const handleAirDrop = async (item_id: string) => {
    setIsAirDropSending(true);
    try {
      await call("shelf.airDropFile", { item_id });
    } finally {
      setTimeout(() => setIsAirDropSending(false), 1200);
    }
  };

  // Stili e Temi Liquid Glass
  const getThemeStyles = () => {
    switch (notchTheme) {
      case "neon_glow":
        return {
          background: "rgba(10, 10, 16, 0.88)",
          border: "1.5px solid rgba(10, 132, 255, 0.45)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(10, 132, 255, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
          accent: "#0a84ff",
        };
      case "liquid_cyan":
        return {
          background: "rgba(6, 20, 28, 0.88)",
          border: "1.5px solid rgba(0, 210, 255, 0.45)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 210, 255, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
          accent: "#00d2ff",
        };
      case "oled_black":
        return {
          background: "#000000",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.95)",
          accent: "#ffffff",
        };
      case "frosted_dark":
      default:
        return {
          background: "rgba(24, 24, 28, 0.82)",
          border: "1.5px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.25)",
          accent: "#bf5af2",
        };
    }
  };

  const themeStyle = getThemeStyles();

  // Formattazione Secondi Timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const selectedMinutes = Math.round(timerDuration / 60);
  const pinnedMiniApps = [
    { name: "Safari", category: "Productivity", path: "/Applications/Safari.app" },
    { name: "Spotify", category: "Media", path: "/Applications/Spotify.app" },
    { name: "VS Code", category: "Dev", path: "/Applications/Visual Studio Code.app" },
    { name: "Figma", category: "Design", path: "/Applications/Figma.app" },
    { name: "Terminal", category: "Dev", path: "/System/Applications/Utilities/Terminal.app" },
    { name: "Antigravity", category: "Dev", path: "/Applications/Antigravity IDE.app" },
  ];

  // Fallback high-craft color swatches & items matching IMG_0155.PNG if clipboard history is sparse
  const displayClipboardItems: ClipboardItem[] =
    clipboardItems.length > 0
      ? clipboardItems
      : [
          {
            item_id: "swatch_1",
            text_content: "#FFF0E5",
            preview: "#FFF0E5",
            content_type: "color",
            timestamp: Date.now() - 120000,
            metadata: { hex: "#FFF0E5" },
          },
          {
            item_id: "swatch_2",
            text_content: "#006667",
            preview: "#006667",
            content_type: "color",
            timestamp: Date.now() - 240000,
            metadata: { hex: "#006667" },
          },
          {
            item_id: "swatch_3",
            text_content: "#FFBAA7",
            preview: "#FFBAA7",
            content_type: "color",
            timestamp: Date.now() - 480000,
            metadata: { hex: "#FFBAA7" },
          },
          {
            item_id: "swatch_4",
            text_content: "#E5ECF6",
            preview: "#E5ECF6",
            content_type: "color",
            timestamp: Date.now() - 720000,
            metadata: { hex: "#E5ECF6" },
          },
          {
            item_id: "clip_link",
            text_content: "https://launchmeapp.com",
            preview: "launchmeapp.com — macOS Dynamic Notch",
            content_type: "link",
            timestamp: Date.now() - 960000,
          },
        ];

  const filteredClips = displayClipboardItems.filter((item) => {
    const matchesType = clipFilter === "all" || item.content_type === clipFilter;
    const matchesQuery =
      !clipSearch || item.preview.toLowerCase().includes(clipSearch.toLowerCase());
    return matchesType && matchesQuery;
  });

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: 999,
      }}
    >
      {/* 🛸 Hardware-Anchored Dynamic Notch Island with Concave Bezel Ears (IMG_0139.PNG) */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        {/* Left Concave Hardware Notch Ear */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: "-1px" }}>
          <path d="M0 0H16V16C16 7.16344 8.83656 0 0 0Z" fill="#08090D" />
        </svg>

        <div
          onClick={() => !isExpanded && setIsExpanded(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isExpanded ? "12px 20px 16px" : "6px 16px",
            borderRadius: isExpanded ? "0 0 30px 30px" : "0 0 20px 20px",
            background: themeStyle.background,
            border: themeStyle.border,
            borderTop: "none",
            boxShadow: themeStyle.boxShadow,
            backdropFilter: "blur(40px) saturate(190%)",
            WebkitBackdropFilter: "blur(40px) saturate(190%)",
            cursor: isExpanded ? "default" : "pointer",
            width: isExpanded ? "860px" : "350px",
            height: isExpanded ? "308px" : "36px",
            transition: "all 0.36s cubic-bezier(0.16, 1, 0.3, 1)",
            flexDirection: isExpanded ? "column" : "row",
            userSelect: "none",
            transform: "translate3d(0, 0, 0)",
            overflow: "hidden",
          }}
        >
          {/* Top Bezel Header Bar inside Notch */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              height: "28px",
              flexShrink: 0,
            }}
          >
            {/* Left: Live Weather / Sensor Pill (IMG_0141.jpg top micro-notch style) */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background:
                    voiceState === "listening"
                      ? "#0a84ff"
                      : isTimerRunning
                      ? "#ff9500"
                      : "#30d158",
                  boxShadow: isTimerRunning
                    ? "0 0 8px #ff9500"
                    : `0 0 8px ${themeStyle.accent}`,
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ffffff",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {weather?.temperature ?? 19}° {weather?.city || "Cupertino"}
              </span>
            </div>

            {/* Center (Compact): Equalizer Bars & Active Track or Countdown */}
            {!isExpanded && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "170px", overflow: "hidden" }}>
                {isTimerRunning ? (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#ff9500",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatTime(timerRemaining)}
                  </span>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      {[0.6, 1.0, 0.4, 0.85, 0.5].map((factor, i) => (
                        <span
                          key={i}
                          style={{
                            width: "2.5px",
                            height: `${Math.max(4, Math.round(amplitude * 18 * factor || 5 + (i % 3) * 3))}px`,
                            background: themeStyle.accent,
                            borderRadius: "2px",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "rgba(255, 255, 255, 0.78)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {mediaTrack.title}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Center (Expanded): Segmented Mode Bar */}
            {isExpanded && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(255, 255, 255, 0.06)",
                  borderRadius: "999px",
                  padding: "3px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {[
                  { id: "overview", label: "Ribbon", icon: <Sparkles size={11} /> },
                  { id: "timer", label: "Timer", icon: <Clock size={11} /> },
                  { id: "clipboard", label: "Clipboard", icon: <ClipboardIcon size={11} /> },
                  { id: "shelf", label: "Shelf & AirDrop", icon: <FolderDown size={11} /> },
                  { id: "music", label: "Player", icon: <Play size={11} /> },
                  { id: "themes", label: "Themes", icon: <Palette size={11} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as NotchTab)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 11px",
                      borderRadius: "999px",
                      border: "none",
                      background:
                        activeTab === tab.id ? "rgba(255, 255, 255, 0.18)" : "transparent",
                      color: activeTab === tab.id ? "#ffffff" : "rgba(255, 255, 255, 0.58)",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Right: Expand / Collapse Toggle button */}
            <button
              type="button"
              aria-label={isExpanded ? "Collapse Notch" : "Expand Notch"}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>

          {/* 🌟 Expanded Island Content Area */}
          {isExpanded && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                flex: 1,
                paddingTop: "12px",
                overflow: "hidden",
              }}
            >
              {/* ================================================================ */}
              {/* TAB 1: HORIZONTAL MULTI-WIDGET RIBBON (IMG_0139.PNG & IMG_0153)  */}
              {/* ================================================================ */}
              {activeTab === "overview" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.35fr 0.9fr 1fr 1.15fr",
                    gap: "12px",
                    height: "100%",
                    alignItems: "stretch",
                  }}
                >
                  {/* Widget 1: Compact Music Card */}
                  <div
                    className="apple-liquid-glass"
                    style={{
                      borderRadius: "20px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.2s var(--ease-apple-spring)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={
                          mediaTrack.album_art_url ||
                          "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=80"
                        }
                        alt={mediaTrack.album}
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "11px",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#ffffff",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {mediaTrack.title}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "rgba(255, 255, 255, 0.62)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {mediaTrack.artist}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        type="button"
                        aria-label="Previous"
                        onClick={() => handleMediaControl("previous")}
                        style={{
                          width: "28px",
                          height: "28px",
                          background: "none",
                          border: "none",
                          color: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        <SkipBack size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Play or Pause"
                        onClick={() => handleMediaControl("play_pause")}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.16)",
                          border: "none",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        {mediaTrack.is_playing ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        type="button"
                        aria-label="Next"
                        onClick={() => handleMediaControl("next")}
                        style={{
                          width: "28px",
                          height: "28px",
                          background: "none",
                          border: "none",
                          color: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        <SkipForward size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Widget 2: Sitting Pixel Cat Ledge + Month Dots (IMG_0139.PNG) */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.09)",
                      borderRadius: "20px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <PixelPet isPlayingMusic={mediaTrack.is_playing} />

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                      {Array.from({ length: 28 }).map((_, idx) => {
                        const d = idx + 1;
                        const today = new Date().getDate();
                        return (
                          <span
                            key={idx}
                            style={{
                              height: "5px",
                              borderRadius: "999px",
                              background:
                                d === today
                                  ? "#0a84ff"
                                  : d < today
                                  ? "#ffffff"
                                  : "rgba(255, 255, 255, 0.16)",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Widget 3: 2x3 Quick App Squircles Grid (IMG_0139.PNG center) */}
                  <div
                    className="apple-liquid-glass"
                    style={{
                      borderRadius: "20px",
                      padding: "12px",
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gridTemplateRows: "repeat(2, 1fr)",
                      gap: "8px",
                      placeItems: "center",
                      transition: "all 0.2s var(--ease-apple-spring)",
                    }}
                  >
                    {pinnedMiniApps.map((app) => (
                      <button
                        key={app.name}
                        type="button"
                        title={app.name}
                        onClick={() => call("system.launchApp", { app_path: app.path })}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MacAppSquircleIcon name={app.name} category={app.category} size={38} />
                      </button>
                    ))}
                  </div>

                  {/* Widget 4: Weather Horizon Sunrise Card ("Day Cloudy 17°" in IMG_0139.PNG) */}
                  <div
                    className="apple-liquid-glass"
                    style={{
                      borderRadius: "20px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.2s var(--ease-apple-spring)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: 700,
                            color: "#ffffff",
                            lineHeight: 1.1,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {weather?.temperature ?? 19}°
                        </div>
                        <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.76)", fontWeight: 500 }}>
                          {weather?.condition || "Day Cloudy"}
                        </span>
                      </div>
                      <WeatherArtworkIcon isNight={false} size={34} />
                    </div>

                    {/* Horizon Sun Curve */}
                    <svg width="100%" height="36" viewBox="0 0 160 36" fill="none">
                      <path
                        d="M 6 30 Q 80 2, 154 30"
                        stroke="rgba(255, 214, 10, 0.75)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="6"
                        y1="24"
                        x2="154"
                        y2="24"
                        stroke="rgba(255, 255, 255, 0.18)"
                        strokeDasharray="3 3"
                      />
                      <circle cx="80" cy="16" r="4.5" fill="#FFD60A" />
                    </svg>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>
                      <span>{weather?.city || "Cupertino"}</span>
                      <span>Feels {weather?.feels_like ?? 18}°</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* TAB 2: MECHANICAL RULER SCRUBBER TIMER (IMG_0154.PNG)            */}
              {/* ================================================================ */}
              {activeTab === "timer" && (
                <div
                  className="apple-liquid-glass"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    border: isTimerRunning
                      ? "1.5px solid #ff9500"
                      : "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: "22px",
                    padding: "14px 20px",
                    boxShadow: isTimerRunning ? "0 0 24px rgba(255, 149, 0, 0.22)" : "none",
                    transition: "all 0.25s var(--ease-apple-spring)",
                  }}
                >
                  {/* Top Row: Digital Countdown + Preset Pill + Start/Stop CTA */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                      <span
                        style={{
                          fontSize: "40px",
                          fontWeight: 700,
                          color: isTimerRunning ? "#ff9500" : "#ffffff",
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: "-0.02em",
                          lineHeight: 1,
                        }}
                      >
                        {formatTime(timerRemaining)}
                      </span>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          background: "rgba(255, 149, 0, 0.16)",
                          border: "1px solid rgba(255, 149, 0, 0.4)",
                          color: "#ff9500",
                          fontSize: "11px",
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {selectedMinutes} min
                      </span>
                    </div>

                    {/* Preset Pills & Primary Action */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {[5, 15, 25, 50].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => {
                            setIsTimerRunning(false);
                            setTimerDuration(mins * 60);
                            setTimerRemaining(mins * 60);
                          }}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "999px",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            background:
                              selectedMinutes === mins
                                ? "rgba(255, 255, 255, 0.18)"
                                : "rgba(255, 255, 255, 0.05)",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {mins} min
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        style={{
                          padding: "7px 18px",
                          borderRadius: "999px",
                          border: "none",
                          background: "#ff9500",
                          color: "#000000",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {isTimerRunning ? "Pause" : "Start timer"}
                      </button>

                      {isTimerRunning && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsTimerRunning(false);
                            setTimerRemaining(timerDuration);
                          }}
                          style={{
                            padding: "7px 14px",
                            borderRadius: "999px",
                            border: "1px solid rgba(255, 255, 255, 0.16)",
                            background: "rgba(255, 255, 255, 0.08)",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Stop
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mechanical Graduated Ruler Tape Scrubber (IMG_0154.PNG) */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "88px",
                      background: "rgba(0, 0, 0, 0.38)",
                      borderRadius: "16px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "0 16px",
                      overflow: "hidden",
                    }}
                  >
                    {/* Orange Center Indicator Needle */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    >
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <polygon points="7,10 0,0 14,0" fill="#FF9500" />
                      </svg>
                      <div style={{ width: "2px", flex: 1, background: "#FF9500" }} />
                    </div>

                    {/* Graduated Tick Marks & Numbers (... 115 120 0 5 10 15 20 25 ...) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        width: "100%",
                        height: "52px",
                        paddingBottom: "6px",
                      }}
                    >
                      {Array.from({ length: 49 }).map((_, idx) => {
                        const offsetMin = idx - 24;
                        const tickMin = (selectedMinutes + offsetMin + 120) % 120;
                        const isMajor = tickMin % 5 === 0;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (!isTimerRunning) {
                                const clamped = Math.max(1, tickMin === 0 ? 120 : tickMin);
                                setTimerDuration(clamped * 60);
                                setTimerRemaining(clamped * 60);
                              }
                            }}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "6px",
                              cursor: isTimerRunning ? "default" : "pointer",
                              flex: 1,
                            }}
                          >
                            {isMajor && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: offsetMin === 0 ? 700 : 500,
                                  color:
                                    offsetMin === 0
                                      ? "#ff9500"
                                      : "rgba(255, 255, 255, 0.55)",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {tickMin}
                              </span>
                            )}
                            <span
                              style={{
                                width: isMajor ? "2px" : "1px",
                                height: isMajor ? "18px" : "10px",
                                borderRadius: "1px",
                                background:
                                  offsetMin === 0
                                    ? "#ff9500"
                                    : isMajor
                                    ? "rgba(255, 255, 255, 0.62)"
                                    : "rgba(255, 255, 255, 0.22)",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Smooth Scrubber Overlay Range */}
                    <input
                      type="range"
                      aria-label="Adjust timer minutes"
                      min={60}
                      max={7200}
                      step={60}
                      value={timerDuration}
                      disabled={isTimerRunning}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setTimerDuration(val);
                        setTimerRemaining(val);
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: isTimerRunning ? "not-allowed" : "ew-resize",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* TAB 3: CLIPBOARD HISTORY SWATCH CAROUSEL (IMG_0155.PNG)          */}
              {/* ================================================================ */}
              {activeTab === "clipboard" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    gap: "10px",
                  }}
                >
                  {/* Top Category Filter Bar (IMG_0155.PNG) */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      {[
                        { id: "all", label: "Recent" },
                        { id: "color", label: "Colors" },
                        { id: "text", label: "Text" },
                        { id: "link", label: "Links" },
                        { id: "file", label: "Files" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setClipFilter(tab.id)}
                          style={{
                            padding: "4px 11px",
                            borderRadius: "999px",
                            border: "none",
                            background:
                              clipFilter === tab.id
                                ? "rgba(255, 255, 255, 0.2)"
                                : "rgba(255, 255, 255, 0.06)",
                            color:
                              clipFilter === tab.id ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="text"
                        aria-label="Filter clipboard"
                        placeholder="Filter..."
                        value={clipSearch}
                        onChange={(e) => setClipSearch(e.target.value)}
                        style={{
                          width: "150px",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          background: "rgba(255, 255, 255, 0.06)",
                          color: "#ffffff",
                          fontSize: "11px",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setClipboardItems([])}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          background: "transparent",
                          color: "rgba(255, 255, 255, 0.65)",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scrolling Swatch & Card Carousel (IMG_0155.PNG) */}
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      overflowX: "auto",
                      flex: 1,
                      alignItems: "stretch",
                      paddingBottom: "4px",
                    }}
                  >
                    {filteredClips.map((item) => {
                      const isColor =
                        item.content_type === "color" || /^#[0-9A-Fa-f]{6}$/.test(item.preview.trim());
                      const hexColor = item.metadata?.hex || (isColor ? item.preview.trim() : "#0A84FF");
                      return (
                        <div
                          key={item.item_id}
                          className="apple-liquid-glass"
                          onClick={() => handleCopyClipboard(item)}
                          style={{
                            width: "148px",
                            flexShrink: 0,
                            borderRadius: "18px",
                            border:
                              copiedId === item.item_id
                                ? "1.5px solid #30d158"
                                : "1px solid rgba(255, 255, 255, 0.14)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            transition: "all 0.22s var(--ease-apple-spring)",
                          }}
                        >
                          {isColor ? (
                            <div
                              style={{
                                height: "94px",
                                width: "100%",
                                background: hexColor,
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "flex-end",
                                padding: "8px",
                              }}
                            >
                              <Star size={13} color="rgba(0,0,0,0.45)" />
                            </div>
                          ) : (
                            <div
                              style={{
                                height: "94px",
                                padding: "10px",
                                background: "rgba(0, 0, 0, 0.26)",
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.82)",
                                overflow: "hidden",
                              }}
                            >
                              {item.preview}
                            </div>
                          )}

                          <div
                            style={{
                              padding: "8px 10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#ffffff",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {copiedId === item.item_id
                                  ? "Copied"
                                  : isColor
                                  ? hexColor.toUpperCase()
                                  : item.content_type}
                              </div>
                              <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>
                                2m ago
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "4px" }}>
                              <Copy size={12} color="rgba(255,255,255,0.65)" />
                              <button
                                type="button"
                                aria-label="Delete clipboard item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClipboard(item.item_id);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "rgba(255,255,255,0.45)",
                                  padding: 0,
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* TAB 4: DUAL POCKET SHELF & AIRDROP RADAR CARDS (IMG_0157.PNG)    */}
              {/* ================================================================ */}
              {activeTab === "shelf" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    height: "100%",
                  }}
                >
                  {/* Left Card: AirDrop Concentric Blue Radar (IMG_0157.PNG) */}
                  <div
                    onClick={() => shelfItems[0] && handleAirDrop(shelfItems[0].item_id)}
                    style={{
                      borderRadius: "22px",
                      background:
                        "radial-gradient(circle at 50% 42%, rgba(10, 132, 255, 0.28) 0%, rgba(14, 16, 24, 0.85) 75%)",
                      border: "1px solid rgba(10, 132, 255, 0.35)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="116"
                      height="116"
                      viewBox="0 0 120 120"
                      fill="none"
                      className="lm-radar-ring"
                    >
                      <circle cx="60" cy="60" r="50" stroke="#0A84FF" strokeOpacity="0.25" strokeWidth="1.5" />
                      <circle cx="60" cy="60" r="38" stroke="#0A84FF" strokeOpacity="0.45" strokeWidth="1.8" />
                      <circle cx="60" cy="60" r="26" stroke="#0A84FF" strokeOpacity="0.7" strokeWidth="2" />
                      <circle cx="60" cy="60" r="14" stroke="#0A84FF" strokeWidth="2.2" />
                      <path d="M60 56L44 84H76L60 56Z" fill="#0A84FF" />
                    </svg>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                      {isAirDropSending ? "Sending via AirDrop..." : "AirDrop"}
                    </span>
                  </div>

                  {/* Right Card: Files Drop Shelf (IMG_0157.PNG) */}
                  <div
                    className="apple-liquid-glass"
                    style={{
                      borderRadius: "22px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.22s var(--ease-apple-spring)",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <FolderDown size={36} color="#ffffff" strokeWidth={1.6} />
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                        Files
                      </span>
                      <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.56)" }}>
                        Drop files here to pin across Spaces
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", width: "100%", overflowX: "auto" }}>
                      {shelfItems.map((file) => (
                        <button
                          key={file.item_id}
                          type="button"
                          onClick={() => handleAirDrop(file.item_id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 10px",
                            borderRadius: "10px",
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 500,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span>{file.name}</span>
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>
                            {file.size_human}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* TAB 5: DEDICATED MUSIC PLAYER                                    */}
              {/* ================================================================ */}
              {activeTab === "music" && (
                <div
                  style={{
                    display: "flex",
                    gap: "18px",
                    height: "100%",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.09)",
                    borderRadius: "20px",
                    padding: "16px 20px",
                  }}
                >
                  <img
                    src={
                      mediaTrack.album_art_url ||
                      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80"
                    }
                    alt={mediaTrack.album}
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "16px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "10px" }}>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                        {mediaTrack.title}
                      </div>
                      <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.68)" }}>
                        {mediaTrack.artist} — {mediaTrack.album}
                      </span>
                    </div>

                    <input
                      type="range"
                      className="lm-scrubber"
                      aria-label="Seek track"
                      min={0}
                      max={mediaTrack.duration_seconds || 300}
                      value={mediaTrack.position_seconds || 0}
                      onChange={async (e) => {
                        const newPos = parseInt(e.target.value, 10);
                        setMediaTrack((p) => ({ ...p, position_seconds: newPos }));
                        await call("media.seek", { position_seconds: newPos });
                      }}
                      style={{ width: "100%" }}
                    />

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <button
                          type="button"
                          aria-label="Previous"
                          onClick={() => handleMediaControl("previous")}
                          style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
                        >
                          <SkipBack size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label="Play or Pause"
                          onClick={() => handleMediaControl("play_pause")}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: themeStyle.accent,
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            cursor: "pointer",
                          }}
                        >
                          {mediaTrack.is_playing ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button
                          type="button"
                          aria-label="Next"
                          onClick={() => handleMediaControl("next")}
                          style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
                        >
                          <SkipForward size={18} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.68)", fontSize: "11px" }}>
                        <Volume2 size={14} />
                        <span>{mediaTrack.volume ?? 80}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* TAB 6: LIQUID GLASS SURFACE THEMES                               */}
              {/* ================================================================ */}
              {activeTab === "themes" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                    height: "100%",
                  }}
                >
                  {[
                    { id: "neon_glow", name: "Sapphire Glass", desc: "Deep obsidian with blue specular edge", color: "#0a84ff" },
                    { id: "frosted_dark", name: "Frosted Graphite", desc: "macOS standard dark material", color: "#bf5af2" },
                    { id: "liquid_cyan", name: "Liquid Cyan", desc: "Aqua refraction edge highlight", color: "#00d2ff" },
                    { id: "oled_black", name: "True Notch Black", desc: "Seamless hardware bezel match", color: "#ffffff" },
                  ].map((th) => (
                    <div
                      key={th.id}
                      onClick={() => setNotchTheme(th.id as NotchTheme)}
                      style={{
                        padding: "14px",
                        borderRadius: "18px",
                        background:
                          notchTheme === th.id
                            ? "rgba(255, 255, 255, 0.12)"
                            : "rgba(255, 255, 255, 0.04)",
                        border:
                          notchTheme === th.id
                            ? `1.5px solid ${th.color}`
                            : "1px solid rgba(255, 255, 255, 0.08)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{th.name}</span>
                        <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.58)", margin: "4px 0 0 0" }}>
                          {th.desc}
                        </p>
                      </div>
                      <span
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          background: th.color,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Concave Hardware Notch Ear */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: "-1px" }}>
          <path d="M16 0H0V16C0 7.16344 7.16344 0 16 0Z" fill="#08090D" />
        </svg>
      </div>
    </div>
  );
};

export default DynamicNotchIsland;
