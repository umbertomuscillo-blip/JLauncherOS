import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import type {
  SpaceProfile,
  SpacesGetResult,
  BatchLaunchWorkflowResult,
} from "../../types/ipc_schema";
import {
  Play,
  Download,
} from "lucide-react";
import {
  MacAppSquircleIcon,
  CyanMacFolderIcon,
  Space3DIcon,
} from "../icons/LaunchMeIcons";

export const WorkflowsManager: React.FC = () => {
  const { call } = useWebSocket();

  const [spaces, setSpaces] = useState<SpaceProfile[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string>("space_coding");
  const [launchStatus, setLaunchStatus] = useState<string>("");

  const fetchSpaces = async () => {
    try {
      const res = await call<SpacesGetResult>("spaces.getSpaces");
      if (res?.result?.spaces) {
        setSpaces(res.result.spaces);
        setActiveSpaceId(res.result.active_space_id || res.result.spaces[0]?.id || "space_coding");
      }
    } catch (e) {
      console.warn("Fetch spaces fallito:", e);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [call]);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) || spaces[0];

  // Cambio Space Attivo
  const handleSwitchSpace = async (spaceId: string) => {
    try {
      await call("spaces.switchSpace", { space_id: spaceId });
      setActiveSpaceId(spaceId);
    } catch (e) {
      console.error("Errore switch space:", e);
    }
  };

  // Lancio Simultaneo Workflow (One-Click Launch)
  const handleBatchLaunch = async (spaceId: string) => {
    setLaunchStatus("Launching all workflow apps & folders...");
    try {
      const res = await call<BatchLaunchWorkflowResult>("spaces.batchLaunchWorkflow", { space_id: spaceId });
      if (res?.result?.success) {
        setLaunchStatus(`Launched ${res.result.launched_apps.length} apps & opened ${res.result.opened_folders.length} folders!`);
        setTimeout(() => setLaunchStatus(""), 4000);
      }
    } catch (e) {
      setLaunchStatus("Launch failed.");
      console.error("Errore batch launch:", e);
    }
  };

  // Esportazione Tema .launchmespaces
  const handleExportSpace = async (spaceId: string) => {
    try {
      const res = await call<{ format: string; space: SpaceProfile }>("spaces.exportSpace", { space_id: spaceId });
      if (res?.result?.space) {
        const jsonStr = JSON.stringify(res.result, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${res.result.space.name.toLowerCase().replace(/\s+/g, "_")}.launchmespaces`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Errore export space:", e);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "32px",
        width: "100%",
        maxWidth: "1280px",
        height: "calc(100vh - 120px)",
        padding: "20px 30px",
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      {/* Top 3D Tactile Spaces Selector Row (IMG_0149.PNG: Design, Dev, Study) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "28px",
        }}
      >
        {spaces.map((space) => {
          const isActive = space.id === activeSpaceId;
          return (
            <div
              key={space.id}
              className="lm-app-tile"
              onClick={() => handleSwitchSpace(space.id)}
              style={{
                width: "210px",
                borderRadius: "28px",
                padding: "22px 20px",
                background: isActive
                  ? "rgba(255, 255, 255, 0.14)"
                  : "rgba(20, 21, 28, 0.58)",
                backdropFilter: "blur(28px) saturate(150%)",
                WebkitBackdropFilter: "blur(28px) saturate(150%)",
                border: isActive
                  ? "1.5px solid rgba(255, 255, 255, 0.38)"
                  : "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: isActive
                  ? "0 24px 56px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.25)"
                  : "0 14px 36px rgba(0, 0, 0, 0.4)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.45))" }}>
                <Space3DIcon type={space.icon || space.name} size={74} />
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  {space.name}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.56)", marginTop: "2px" }}>
                  {space.apps.length} apps · {space.folders.length} folders
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Speech-Bubble Workspace Tray with App Squircles & Cyan Finder Folders (IMG_0149.PNG) */}
      {activeSpace && (
        <div
          className="apple-liquid-glass"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "820px",
            borderRadius: "32px",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            transition: "all 0.28s var(--ease-apple-spring)",
          }}
        >
          {/* Speech Bubble Pointer Arrow */}
          <svg
            width="28"
            height="14"
            viewBox="0 0 28 14"
            fill="none"
            style={{
              position: "absolute",
              top: "-13px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <path d="M14 0L28 14H0L14 0Z" fill="rgba(32, 35, 46, 0.88)" />
          </svg>

          {/* Header & One-Click Batch Launch */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                {activeSpace.name} Workspace
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "rgba(255, 255, 255, 0.78)",
                }}
              >
                {activeSpace.hotkey}
              </span>
              {launchStatus && (
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#30d158" }}>
                  {launchStatus}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => handleBatchLaunch(activeSpace.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 18px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#0a84ff",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(10, 132, 255, 0.45)",
                }}
              >
                <Play size={13} fill="currentColor" />
                Launch Workspace
              </button>

              <button
                type="button"
                aria-label="Export .launchmespaces file"
                onClick={() => handleExportSpace(activeSpace.id)}
                title="Export .launchmespaces"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          {/* Unified Grid of Applications & Bright Cyan Finder Folders (IMG_0149.PNG) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
              gap: "20px",
              justifyItems: "center",
            }}
          >
            {activeSpace.apps.map((app, idx) => (
              <div
                key={`app_${idx}`}
                className="lm-app-tile"
                onClick={() => call("system.launchApp", { app_path: app.path })}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <MacAppSquircleIcon name={app.name} category="Dev" size={60} />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#ffffff",
                    textAlign: "center",
                    maxWidth: "92px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {app.name}
                </span>
              </div>
            ))}

            {(activeSpace.folders.length > 0
              ? activeSpace.folders
              : ["~/Projects", "~/Assets", "~/Documents"]
            ).map((folderPath, idx) => {
              const folderLabel = folderPath.split("/").filter(Boolean).pop() || folderPath;
              return (
                <div
                  key={`folder_${idx}`}
                  className="lm-app-tile"
                  onClick={() => handleBatchLaunch(activeSpace.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <CyanMacFolderIcon size={60} />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#ffffff",
                      textAlign: "center",
                      maxWidth: "92px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {folderLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowsManager;
