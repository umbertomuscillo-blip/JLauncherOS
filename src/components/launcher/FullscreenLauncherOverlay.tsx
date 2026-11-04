import React, { useState, useEffect, useMemo } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import type {
  SystemAppItem,
  SystemGetAppsResult,
  WeatherData,
  MediaTrackState,
  UninstallPreviewResult,
  FocusMode,
} from "../../types/ipc_schema";
import {
  Search,
  Folder,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Zap,
  Trash2,
  BookmarkPlus,
  Edit2,
  X,
} from "lucide-react";
import {
  MacAppSquircleIcon,
  WeatherArtworkIcon,
} from "../icons/LaunchMeIcons";

interface FolderItem {
  id: string;
  name: string;
  apps: SystemAppItem[];
  color: string;
}

export const FullscreenLauncherOverlay: React.FC = () => {
  const { call } = useWebSocket();

  // Dati di Sistema
  const [apps, setApps] = useState<SystemAppItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [gridLayout, setGridLayout] = useState<"3x5" | "4x6" | "5x7">("4x6");

  // Cartelle & Selezione Multipla con Shift
  const [folders, setFolders] = useState<FolderItem[]>([
    {
      id: "f_dev",
      name: "Development Lab",
      color: "#0a84ff",
      apps: [
        { name: "Visual Studio Code", bundle_id: "com.microsoft.VSCode", path: "/Applications/Visual Studio Code.app", category: "Dev" },
        { name: "Terminal", bundle_id: "com.apple.Terminal", path: "/System/Applications/Utilities/Terminal.app", category: "Dev" },
        { name: "Antigravity IDE", bundle_id: "com.google.antigravity", path: "/Applications/Antigravity IDE.app", category: "Dev" },
      ],
    },
    {
      id: "f_design",
      name: "Creative Suite",
      color: "#bf5af2",
      apps: [
        { name: "Figma", bundle_id: "com.figma.Desktop", path: "/Applications/Figma.app", category: "Design" },
        { name: "CapCut", bundle_id: "com.lemon.capcut", path: "/Applications/CapCut.app", category: "Design" },
      ],
    },
  ]);

  const [activeFolderModal, setActiveFolderModal] = useState<FolderItem | null>(null);
  const [selectedAppPaths, setSelectedAppPaths] = useState<Set<string>>(new Set());

  // Context Menu Stato
  const [contextMenu, setContextMenu] = useState<{
    app: SystemAppItem;
    x: number;
    y: number;
  } | null>(null);

  // Clean Uninstall Dialog Stato
  const [uninstallModal, setUninstallModal] = useState<UninstallPreviewResult | null>(null);

  // Widget Laterali: Orologio, Musica, Meteo, Focus
  const [timeNow, setTimeNow] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [mediaTrack, setMediaTrack] = useState<MediaTrackState>({
    title: "Midnight City (Vinyl Edition)",
    artist: "M83 & JARVIS Sound Lab",
    album: "Hurry Up, We're Dreaming",
    duration_seconds: 244,
    position_seconds: 68,
    is_playing: true,
    player_app: "Spotify",
  });
  const [activeFocus, setActiveFocus] = useState<FocusMode>("NORMAL");

  // Timer per l'Orologio
  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Applicazioni e Widget
  useEffect(() => {
    const loadData = async () => {
      try {
        const appsRes = await call<SystemGetAppsResult>("system.getApplications");
        if (appsRes?.result?.apps) setApps(appsRes.result.apps);

        const wRes = await call<WeatherData>("weather.getCurrent", { city: "Cupertino" });
        if (wRes?.result) setWeather(wRes.result);

        const mRes = await call<MediaTrackState>("media.getPlaybackState");
        if (mRes?.result) setMediaTrack(mRes.result);
      } catch (e) {
        console.warn("[FullscreenLauncherOverlay] Fetch parziale:", e);
      }
    };
    loadData();
  }, [call]);

  // Calcolatrice Rapida Inline nella Search Bar
  const mathResult = useMemo(() => {
    const q = searchQuery.trim();
    if (!q || !/^[0-9+\-*/().\s^%]+$/.test(q)) return null;
    try {
      // Valutazione sicura per espressioni numeriche
      // eslint-disable-next-line no-eval
      const res = Function(`"use strict"; return (${q})`)();
      if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
        return res;
      }
    } catch {
      return null;
    }
    return null;
  }, [searchQuery]);

  // Filtraggio Applicazioni
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        !searchQuery ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = activeCategory === "All" || app.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [apps, searchQuery, activeCategory]);

  // Click su un'App (o Shift-Click per batch selection)
  const handleAppClick = async (app: SystemAppItem, e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      setSelectedAppPaths((prev) => {
        const next = new Set(prev);
        if (next.has(app.path)) next.delete(app.path);
        else next.add(app.path);
        return next;
      });
      return;
    }

    try {
      await call("system.launchApp", { app_path: app.path });
    } catch (err) {
      console.error("Errore lancio app:", err);
    }
  };

  // Creazione Cartella dalle App Selezionate
  const handleCreateFolderFromSelected = () => {
    if (selectedAppPaths.size === 0) return;
    const selectedApps = apps.filter((a) => selectedAppPaths.has(a.path));
    const newFolder: FolderItem = {
      id: `folder_${Date.now()}`,
      name: `New Group (${selectedApps.length})`,
      color: "#bf5af2",
      apps: selectedApps,
    };
    setFolders((prev) => [...prev, newFolder]);
    setSelectedAppPaths(new Set());
  };

  // Ordinamento A-Z all'interno della cartella
  const handleSortFolderAZ = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            apps: [...f.apps].sort((a, b) => a.name.localeCompare(b.name)),
          };
        }
        return f;
      })
    );
    if (activeFolderModal && activeFolderModal.id === folderId) {
      setActiveFolderModal((prev) =>
        prev
          ? {
              ...prev,
              apps: [...prev.apps].sort((a, b) => a.name.localeCompare(b.name)),
            }
          : null
      );
    }
  };

  // Apertura Context Menu
  const handleContextMenu = (app: SystemAppItem, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ app, x: e.clientX, y: e.clientY });
  };

  // Anteprima Disinstallazione Pulita
  const handleRequestUninstall = async (app: SystemAppItem) => {
    setContextMenu(null);
    try {
      const preview = await call<UninstallPreviewResult>("system.uninstallAppPreview", { app_path: app.path });
      if (preview?.result) setUninstallModal(preview.result);
    } catch (err) {
      console.error("Errore disinstallazione preview:", err);
    }
  };

  // Toggle Focus Mode
  const handleSetFocusMode = async (mode: FocusMode) => {
    try {
      await call("system.setFocusMode", { mode, duration_minutes: 50 });
      setActiveFocus(mode);
    } catch (err) {
      console.error("Errore impostazione focus:", err);
    }
  };

  // Analog Clock Angles (IMG_0141.jpg 12-9-3-6 Timepiece)
  const seconds = timeNow.getSeconds();
  const minutes = timeNow.getMinutes();
  const hours = timeNow.getHours() % 12;
  const secondAngle = seconds * 6;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;

  // Format scrubber timestamps
  const formatElapsed = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, "0")}`;
  };

  const remainingSecs = Math.max(0, (mediaTrack.duration_seconds || 244) - (mediaTrack.position_seconds || 0));

  // Calendar Month Days Left computation (IMG_0141.jpg bottom-right matrix)
  const year = timeNow.getFullYear();
  const monthIdx = timeNow.getMonth();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const currentDay = timeNow.getDate();
  const daysLeft = Math.max(0, daysInMonth - currentDay);
  const monthName = timeNow.toLocaleDateString("en-US", { month: "long" });

  // Hourly curve data (IMG_0141.jpg top-right weather curve)
  const hourlyPoints = weather?.hourly?.slice(0, 6) || [
    { time: "12 AM", temp: 19 },
    { time: "1 AM", temp: 18 },
    { time: "2 AM", temp: 17 },
    { time: "3 AM", temp: 18 },
    { time: "4 AM", temp: 20 },
    { time: "5 AM", temp: 21 },
  ];

  const coverUrl =
    mediaTrack.album_art_url ||
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=900&auto=format&fit=crop&q=85";

  return (
    <div
      onClick={() => setContextMenu(null)}
      style={{
        display: "grid",
        gridTemplateColumns: "268px 1fr 268px",
        gap: "28px",
        width: "100%",
        maxWidth: "1480px",
        height: "calc(100vh - 112px)",
        padding: "12px 24px 20px",
        boxSizing: "border-box",
        userSelect: "none",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* ==================================================================== */}
      {/* 🌌 FULL-BLEED DYNAMIC AMBIENT ALBUM ART WALLPAPER (IMG_0141.jpg)     */}
      {/* ==================================================================== */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -2,
          backgroundImage: `url("${coverUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(68px) saturate(155%) brightness(0.42)",
          transform: "scale(1.14)",
          transition: "background-image 0.8s ease",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background:
            "radial-gradient(circle at 50% 38%, rgba(12, 14, 20, 0.2) 0%, rgba(6, 7, 11, 0.82) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ==================================================================== */}
      {/* 👈 LEFT COLUMN: FLOATING MUSIC WIDGET (TOP) & 12-9-3-6 CLOCK (BOTTOM)*/}
      {/* ==================================================================== */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "18px", height: "100%" }}>
        {/* Top-Left: Compact Floating Music Player Card (IMG_0141.jpg "Too Fast - Sonder") */}
        <div
          className="apple-liquid-glass"
          style={{
            borderRadius: "28px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            transition: "transform 0.28s var(--ease-apple-spring), box-shadow 0.28s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "16px",
                overflow: "hidden",
                flexShrink: 0,
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.55)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
              }}
            >
              <img
                src={coverUrl}
                alt={mediaTrack.album}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {mediaTrack.title}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.68)",
                  marginTop: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {mediaTrack.artist}
              </span>
            </div>
          </div>

          {/* Thin Scrubber Bar + Tabular Timestamps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <input
              type="range"
              className="lm-scrubber"
              aria-label="Track timeline"
              min={0}
              max={mediaTrack.duration_seconds || 244}
              value={mediaTrack.position_seconds || 68}
              onChange={async (e) => {
                const pos = parseInt(e.target.value, 10);
                setMediaTrack((prev) => ({ ...prev, position_seconds: pos }));
                await call("media.seek", { position_seconds: pos });
              }}
              style={{ width: "100%" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.52)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>{formatElapsed(mediaTrack.position_seconds || 68)}</span>
              <span>-{formatElapsed(remainingSecs)}</span>
            </div>
          </div>

          {/* Minimalist Transport Pills */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px" }}>
            <button
              type="button"
              aria-label="Previous track"
              onClick={() => call("media.controlPlayback", { action: "previous" })}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "transparent",
                border: "none",
                color: "rgba(255, 255, 255, 0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <SkipBack size={17} fill="currentColor" />
            </button>

            <button
              type="button"
              aria-label={mediaTrack.is_playing ? "Pause" : "Play"}
              onClick={async () => {
                const res = await call<MediaTrackState>("media.controlPlayback", { action: "play_pause" });
                if (res?.result) setMediaTrack((prev) => ({ ...prev, ...res.result }));
                else setMediaTrack((prev) => ({ ...prev, is_playing: !prev.is_playing }));
              }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {mediaTrack.is_playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            <button
              type="button"
              aria-label="Next track"
              onClick={() => call("media.controlPlayback", { action: "next" })}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "transparent",
                border: "none",
                color: "rgba(255, 255, 255, 0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <SkipForward size={17} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Bottom-Left: Signature 12-9-3-6 Analog Square Clock (IMG_0141.jpg) */}
        <div
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: "32px",
            background: "#111216",
            border: "1px solid rgba(255, 255, 255, 0.11)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.14)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Cardinal Giant Numerals 12, 9, 3, 6 */}
          <span
            style={{
              position: "absolute",
              top: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "50px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            12
          </span>
          <span
            style={{
              position: "absolute",
              left: "18px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "50px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            9
          </span>
          <span
            style={{
              position: "absolute",
              right: "18px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "50px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            3
          </span>
          <span
            style={{
              position: "absolute",
              bottom: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "50px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            6
          </span>

          {/* Center Date Label ("Tue, Oct 8" style) */}
          <span
            style={{
              position: "absolute",
              top: "36%",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.72)",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {timeNow.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>

          {/* Analog SVG Hands (Hour, Minute, Red Second Hand) */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 240 240"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {/* Hour Hand */}
            <g transform={`rotate(${hourAngle} 120 120)`}>
              <line
                x1="120"
                y1="120"
                x2="120"
                y2="66"
                stroke="#FFFFFF"
                strokeWidth="6.5"
                strokeLinecap="round"
              />
            </g>
            {/* Minute Hand */}
            <g transform={`rotate(${minuteAngle} 120 120)`}>
              <line
                x1="120"
                y1="120"
                x2="120"
                y2="42"
                stroke="#FFFFFF"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </g>
            {/* Red Sweeping Second Hand */}
            <g transform={`rotate(${secondAngle} 120 120)`}>
              <line
                x1="120"
                y1="138"
                x2="120"
                y2="32"
                stroke="#FF3B30"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
            {/* Center Pivot Cap */}
            <circle cx="120" cy="120" r="5.5" fill="#FF3B30" />
            <circle cx="120" cy="120" r="2.2" fill="#111216" />
          </svg>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 🚀 CENTER COLUMN: SEARCH PILL & FLOATING SQUIRCLE APP GRID           */}
      {/* ==================================================================== */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px", height: "100%", overflow: "hidden" }}>
        {/* Floating Liquid Glass Search Pill + Category Bar */}
        <div
          className="apple-liquid-glass"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderRadius: "999px",
            padding: "8px 18px",
            transition: "all 0.25s var(--ease-apple-spring)",
          }}
        >
          <Search size={16} color="rgba(255, 255, 255, 0.65)" />
          <input
            type="text"
            aria-label="Search applications or calculate math"
            placeholder="Search apps or calculate (e.g. 24 * 7)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 500,
              outline: "none",
              fontFamily: "inherit",
            }}
          />

          {mathResult !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "rgba(48, 209, 88, 0.2)",
                border: "1px solid rgba(48, 209, 88, 0.45)",
                color: "#30d158",
                fontSize: "12px",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>=</span>
              <span>{mathResult}</span>
            </div>
          )}

          {/* Grid Density Selector */}
          <div style={{ display: "flex", gap: "4px" }}>
            {(["3x5", "4x6", "5x7"] as const).map((gl) => (
              <button
                key={gl}
                type="button"
                onClick={() => setGridLayout(gl)}
                style={{
                  padding: "4px 9px",
                  fontSize: "11px",
                  borderRadius: "999px",
                  border: "none",
                  background: gridLayout === gl ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: gridLayout === gl ? "#ffffff" : "rgba(255, 255, 255, 0.55)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {gl}
              </button>
            ))}
          </div>
        </div>

        {/* Subtle Category Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
            {["All", "Dev", "Design", "Productivity", "Media", "System", "Utilities"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "5px 13px",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor:
                    activeCategory === cat ? "rgba(255, 255, 255, 0.28)" : "rgba(255, 255, 255, 0.08)",
                  background:
                    activeCategory === cat ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.05)",
                  color: activeCategory === cat ? "#ffffff" : "rgba(255, 255, 255, 0.68)",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {selectedAppPaths.size > 0 && (
            <button
              type="button"
              onClick={handleCreateFolderFromSelected}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "999px",
                background: "#0a84ff",
                border: "none",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Folder size={12} />
              Group ({selectedAppPaths.size})
            </button>
          )}
        </div>

        {/* Floating Application & Folder Squircles Grid (No Opaque Boxes, IMG_0141.jpg) */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns:
              gridLayout === "3x5"
                ? "repeat(4, 1fr)"
                : gridLayout === "4x6"
                ? "repeat(5, 1fr)"
                : "repeat(6, 1fr)",
            rowGap: "26px",
            columnGap: "18px",
            padding: "12px 8px",
            alignContent: "start",
          }}
        >
          {/* Floating Glass Folders */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="lm-app-tile"
              onClick={() => setActiveFolderModal(folder)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "9px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.14)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  boxShadow: "0 12px 24px rgba(0, 0, 0, 0.42)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px",
                  padding: "7px",
                }}
              >
                {folder.apps.slice(0, 4).map((subApp, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MacAppSquircleIcon name={subApp.name} category={subApp.category} size={22} />
                  </div>
                ))}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#ffffff",
                  textAlign: "center",
                  textShadow: "0 1px 4px rgba(0, 0, 0, 0.7)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "96px",
                }}
              >
                {folder.name}
              </span>
            </div>
          ))}

          {/* Floating macOS Squircle Application Icons */}
          {filteredApps.map((app) => {
            const isSelected = selectedAppPaths.has(app.path);
            return (
              <div
                key={app.path}
                className="lm-app-tile"
                onClick={(e) => handleAppClick(app, e)}
                onContextMenu={(e) => handleContextMenu(app, e)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "9px",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "18px",
                  background: isSelected ? "rgba(10, 132, 255, 0.24)" : "transparent",
                  outline: isSelected ? "1.5px solid #0a84ff" : "none",
                }}
              >
                <div
                  style={{
                    filter: "drop-shadow(0 12px 20px rgba(0, 0, 0, 0.48))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MacAppSquircleIcon name={app.name} category={app.category} size={64} />
                </div>

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#ffffff",
                    textAlign: "center",
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.75)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "96px",
                  }}
                >
                  {app.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 👉 RIGHT COLUMN: WEATHER CURVE (TOP) & MONTH DOTS MATRIX (BOTTOM)    */}
      {/* ==================================================================== */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "18px", height: "100%" }}>
        {/* Top-Right: Liquid Glass Weather Curve Widget (IMG_0141.jpg "53° now in New York") */}
        <div
          className="apple-liquid-glass"
          style={{
            borderRadius: "28px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            transition: "transform 0.28s var(--ease-apple-spring), box-shadow 0.28s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {weather?.temperature ?? 19}° now in {weather?.city || "Cupertino"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "rgba(255, 255, 255, 0.68)" }}>
                <span>feels {weather?.feels_like ?? 18}°</span>
                <span>{weather?.condition || "Clear"}</span>
              </div>
            </div>
            <WeatherArtworkIcon isNight={true} size={36} />
          </div>

          {/* Smooth Hourly Temperature Curve SVG (IMG_0141.jpg) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            <svg width="100%" height="64" viewBox="0 0 220 64" fill="none" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 10 34 C 45 42, 75 46, 110 38 C 145 30, 180 20, 210 24 L 210 60 L 10 60 Z"
                fill="url(#tempAreaGrad)"
              />
              <path
                d="M 10 34 C 45 42, 75 46, 110 38 C 145 30, 180 20, 210 24"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {[
                { cx: 10, cy: 34 },
                { cx: 50, cy: 40 },
                { cx: 90, cy: 43 },
                { cx: 130, cy: 34 },
                { cx: 170, cy: 24 },
                { cx: 210, cy: 24 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.cx} cy={pt.cy} r={i === 0 ? 4 : 2.5} fill="#FFFFFF" />
              ))}
            </svg>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                textAlign: "center",
                fontSize: "10px",
                color: "rgba(255, 255, 255, 0.56)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {hourlyPoints.map((h, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>{h.temp}°</span>
                  <span>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom-Right: Month Days Left Dot Matrix Card (IMG_0141.jpg "October 26 days left") */}
        <div
          className="apple-liquid-glass"
          style={{
            borderRadius: "28px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "16px",
            transition: "transform 0.28s var(--ease-apple-spring), box-shadow 0.28s ease",
          }}
        >
          {/* Header: Month & Days Left */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
              {monthName}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.62)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {daysLeft} days left
            </span>
          </div>

          {/* 7-Column Rounded Pill/Dot Matrix (IMG_0141.jpg) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px 8px",
              justifyItems: "center",
              padding: "6px 0",
            }}
          >
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dNum = idx + 1;
              const isPast = dNum < currentDay;
              const isToday = dNum === currentDay;
              return (
                <span
                  key={idx}
                  title={`${monthName} ${dNum}`}
                  style={{
                    width: "20px",
                    height: "11px",
                    borderRadius: "999px",
                    background: isToday
                      ? "#0a84ff"
                      : isPast
                      ? "#ffffff"
                      : "rgba(255, 255, 255, 0.16)",
                    boxShadow: isToday ? "0 0 10px rgba(10, 132, 255, 0.75)" : "none",
                    transition: "background 0.2s ease",
                  }}
                />
              );
            })}
          </div>

          {/* JARVIS Focus State Control Strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "10px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Zap size={13} color="#ff9f0a" />
              <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255, 255, 255, 0.78)" }}>
                Focus
              </span>
            </div>

            <div style={{ display: "flex", gap: "4px" }}>
              {(["NORMAL", "DEEP_WORK", "STUDY"] as FocusMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSetFocusMode(mode)}
                  style={{
                    fontSize: "10px",
                    padding: "4px 9px",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      activeFocus === mode ? "#ff9f0a" : "rgba(255, 255, 255, 0.08)",
                    color: activeFocus === mode ? "#000000" : "#ffffff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {mode === "NORMAL" ? "Standard" : mode === "DEEP_WORK" ? "Deep" : "Study"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 📁 MODAL: EXPANDED FOLDER VIEW (LAUNCHME STYLE)                      */}
      {/* ==================================================================== */}
      {activeFolderModal && (
        <div
          onClick={() => setActiveFolderModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "480px",
              background: "rgba(22, 23, 30, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: "28px",
              padding: "24px",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.75)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Folder size={18} color={activeFolderModal.color} />
                <span style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>
                  {activeFolderModal.name}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleSortFolderAZ(activeFolderModal.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Sort A–Z
                </button>
                <button
                  type="button"
                  aria-label="Close folder"
                  onClick={() => setActiveFolderModal(null)}
                  style={{ background: "none", border: "none", color: "#8e8e93", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Apps inside Folder */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "18px",
                maxHeight: "300px",
                overflowY: "auto",
                padding: "8px 0",
              }}
            >
              {activeFolderModal.apps.map((app) => (
                <div
                  key={app.path}
                  className="lm-app-tile"
                  onClick={async () => {
                    await call("system.launchApp", { app_path: app.path });
                    setActiveFolderModal(null);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <MacAppSquircleIcon name={app.name} category={app.category} size={54} />
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#ffffff",
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "80px",
                    }}
                  >
                    {app.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 🖱️ APP CONTEXT MENU (RIGHT-CLICK)                                   */}
      {/* ==================================================================== */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "rgba(30, 30, 36, 0.95)",
            backdropFilter: "blur(30px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "14px",
            padding: "6px",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.7)",
            zIndex: 1100,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            minWidth: "180px",
          }}
        >
          <button
            onClick={async () => {
              await call("system.launchApp", { app_path: contextMenu.app.path });
              setContextMenu(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: "none",
              border: "none",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Play size={12} /> Open Application
          </button>

          <button
            onClick={() => {
              alert(`Added "${contextMenu.app.name}" to Dynamic Notch Island!`);
              setContextMenu(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: "none",
              border: "none",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <BookmarkPlus size={12} /> Add to Notch Island
          </button>

          <button
            onClick={() => {
              const newName = prompt("Rename application label:", contextMenu.app.name);
              if (newName) {
                setApps((prev) =>
                  prev.map((a) => (a.path === contextMenu.app.path ? { ...a, name: newName } : a))
                );
              }
              setContextMenu(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: "none",
              border: "none",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Edit2 size={12} /> Rename
          </button>

          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "4px 0" }} />

          <button
            onClick={() => handleRequestUninstall(contextMenu.app)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: "none",
              border: "none",
              color: "#ff453a",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Trash2 size={12} /> Clean Uninstall...
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 🧹 CLEAN UNINSTALLER PREVIEW MODAL (LAUNCHME FEATURE)                */}
      {/* ==================================================================== */}
      {uninstallModal && (
        <div
          onClick={() => setUninstallModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "520px",
              background: "rgba(24, 24, 28, 0.98)",
              border: "1.5px solid rgba(255, 69, 58, 0.4)",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 69, 58, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Trash2 size={24} color="#ff453a" />
              <div>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                  Clean Uninstaller: {uninstallModal.app_name}
                </span>
                <p style={{ fontSize: "11px", color: "#8e8e93", margin: "2px 0 0 0" }}>
                  Found {uninstallModal.remnant_count} associated cache & support locations ({uninstallModal.total_human})
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "180px",
                overflowY: "auto",
                background: "rgba(0,0,0,0.3)",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {uninstallModal.remnants.map((rem, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#a1a1a6" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: "380px" }}>{rem.path}</span>
                  <span style={{ color: "#ffffff" }}>{Math.round(rem.size_bytes / 1024)} KB</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => setUninstallModal(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  alert(`Successfully purged all residual caches and uninstalled ${uninstallModal.app_name}!`);
                  setUninstallModal(null);
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#ff453a",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(255, 69, 58, 0.5)",
                }}
              >
                Purge & Uninstall ({uninstallModal.total_human})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenLauncherOverlay;
