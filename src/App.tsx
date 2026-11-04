import React, { useState, useEffect } from "react";
import DynamicNotchIsland from "./components/notch/DynamicNotchIsland";
import FullscreenLauncherOverlay from "./components/launcher/FullscreenLauncherOverlay";
import VinylTurntableStudio from "./components/music/VinylTurntableStudio";
import WorkflowsManager from "./components/spaces/WorkflowsManager";
import NotchController from "./components/notch/NotchController";
import DiskDashboard from "./components/help_memoria/DiskDashboard";
import PromptPipelineView from "./components/prompterrr/PromptPipelineView";
import {
  Sparkles,
  LayoutGrid,
  Disc3,
  Layers,
  Wrench,
} from "lucide-react";

type ActiveTab = "notch" | "launcher" | "vinyl" | "workflows" | "diagnostics";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("launcher");

  // Global Keyboard Shortcuts (Option+Space for Launcher, Option+V for Vinyl, Option+W for Workflows, Option+N for Notch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.code === "Space") {
          e.preventDefault();
          setActiveTab((prev) => (prev === "launcher" ? "notch" : "launcher"));
        } else if (e.code === "KeyV") {
          e.preventDefault();
          setActiveTab("vinyl");
        } else if (e.code === "KeyW") {
          e.preventDefault();
          setActiveTab("workflows");
        } else if (e.code === "KeyN") {
          e.preventDefault();
          setActiveTab("notch");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        height: "100vh",
        width: "100vw",
        color: "#ffffff",
        background: "#07080a",
        padding: "0 20px 14px",
        boxSizing: "border-box",
        userSelect: "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 🛸 Persistent Hardware-Anchored Dynamic Notch Island at Top Bezel */}
      <DynamicNotchIsland />

      {/* Main View Display */}
      <div
        style={{
          width: "100%",
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {activeTab === "launcher" && <FullscreenLauncherOverlay />}
        {activeTab === "notch" && <NotchController />}
        {activeTab === "vinyl" && <VinylTurntableStudio />}
        {activeTab === "workflows" && <WorkflowsManager />}
        {activeTab === "diagnostics" && (
          <div
            style={{
              display: "flex",
              gap: "20px",
              width: "100%",
              maxWidth: "1200px",
              height: "calc(100vh - 140px)",
              overflowY: "auto",
              padding: "10px",
            }}
          >
            <div style={{ flex: 1 }}>
              <DiskDashboard />
            </div>
            <div style={{ flex: 1 }}>
              <PromptPipelineView />
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Liquid Glass Dock (IMG_0153.PNG style) */}
      <nav
        aria-label="Workspace Switcher Dock"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(20, 21, 28, 0.62)",
          backdropFilter: "blur(32px) saturate(160%)",
          WebkitBackdropFilter: "blur(32px) saturate(160%)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
          padding: "5px 8px",
          borderRadius: "999px",
          zIndex: 100,
        }}
      >
        {[
          { id: "launcher", label: "Launcher", icon: <LayoutGrid size={13} />, hotkey: "⌥Space" },
          { id: "vinyl", label: "Vinyl Studio", icon: <Disc3 size={13} />, hotkey: "⌥V" },
          { id: "workflows", label: "Workflows", icon: <Layers size={13} />, hotkey: "⌥W" },
          { id: "notch", label: "Notch Lab", icon: <Sparkles size={13} />, hotkey: "⌥N" },
          { id: "diagnostics", label: "Diagnostics", icon: <Wrench size={13} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "999px",
                border: "none",
                background: isActive ? "rgba(255, 255, 255, 0.2)" : "transparent",
                color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.hotkey && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    background: "rgba(255, 255, 255, 0.1)",
                    color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.52)",
                  }}
                >
                  {tab.hotkey}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </main>
  );
};

export default App;
