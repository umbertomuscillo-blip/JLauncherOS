import React, { useState, useCallback } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import type { FocusMode, PingResult, SetFocusModeResult } from "../../types/ipc_schema";

export interface NotchControllerProps {
  wsUrl?: string;
}

export const NotchController: React.FC<NotchControllerProps> = ({ wsUrl }) => {
  const { status, lastRttMs, focusMode, error, call, reconnect } = useWebSocket(wsUrl);
  const [currentFocus, setCurrentFocus] = useState<FocusMode>(focusMode);
  const [isPinging, setIsPinging] = useState(false);
  const [pingStats, setPingStats] = useState<{ rtt: number; time: string } | null>(null);

  // Aggiorna focus locale se cambia quello remoto
  React.useEffect(() => {
    setCurrentFocus(focusMode);
  }, [focusMode]);

  const handlePing = useCallback(async () => {
    setIsPinging(true);
    try {
      const now = Date.now();
      const { result, rttMs } = await call<PingResult>("system.ping", { timestamp: now });
      if (result.pong) {
        setPingStats({
          rtt: rttMs,
          time: new Date(result.server_time).toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.error("Ping fallito:", err);
    } finally {
      setIsPinging(false);
    }
  }, [call]);

  const handleToggleFocus = useCallback(async () => {
    const nextMode: FocusMode =
      currentFocus === "NORMAL"
        ? "DEEP_WORK"
        : currentFocus === "DEEP_WORK"
        ? "STUDY"
        : "NORMAL";

    try {
      const { result } = await call<SetFocusModeResult>("system.setFocusMode", {
        mode: nextMode,
        duration_minutes: 45,
        silence_audio: nextMode !== "NORMAL",
      });
      setCurrentFocus(result.active_mode);
    } catch (err) {
      console.error("Cambio focus mode fallito:", err);
    }
  }, [call, currentFocus]);

  const getStatusColor = () => {
    switch (status) {
      case "AUTHENTICATED":
        return "#30d158"; // Apple neon green
      case "CONNECTED":
        return "#ffd60a"; // Apple yellow
      case "CONNECTING":
        return "#0a84ff"; // Apple blue
      case "ERROR":
      case "DISCONNECTED":
      default:
        return "#ff453a"; // Apple red
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "24px",
        borderRadius: "20px",
        background: "rgba(30, 30, 32, 0.75)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        color: "#f5f5f7",
        maxWidth: "460px",
        width: "100%",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      {/* Dynamic Notch Mockup Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "8px 16px",
          background: "rgba(0, 0, 0, 0.4)",
          borderRadius: "12px",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: getStatusColor(),
              boxShadow: `0 0 10px ${getStatusColor()}`,
              transition: "all 0.3s ease",
            }}
          />
          <span style={{ fontWeight: 600, letterSpacing: "0.2px" }}>
            {status === "AUTHENTICATED" ? "BRIDGE ATTIVO" : status}
          </span>
        </div>

        <div style={{ fontSize: "12px", color: "#a1a1a6" }}>
          {lastRttMs !== null ? (
            <span style={{ color: lastRttMs < 2.0 ? "#30d158" : "#ffd60a" }}>
              ⚡ {lastRttMs} ms
            </span>
          ) : (
            "— ms"
          )}
        </div>
      </div>

      {/* Focus Mode Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px 16px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "12px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "#86868b", textTransform: "uppercase" }}>Focus Mode</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: currentFocus === "NORMAL" ? "#f5f5f7" : "#bf5af2" }}>
            {currentFocus}
          </div>
        </div>

        <button
          onClick={handleToggleFocus}
          disabled={status !== "AUTHENTICATED"}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 500,
            borderRadius: "8px",
            border: "none",
            background: status === "AUTHENTICATED" ? "rgba(191, 90, 242, 0.25)" : "rgba(255,255,255,0.05)",
            color: status === "AUTHENTICATED" ? "#bf5af2" : "#636366",
            cursor: status === "AUTHENTICATED" ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
          }}
        >
          Commuta Focus
        </button>
      </div>

      {/* Diagnostic & Benchmark Actions */}
      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
        <button
          onClick={handlePing}
          disabled={status !== "AUTHENTICATED" || isPinging}
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#f5f5f7",
            cursor: status === "AUTHENTICATED" ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
          }}
        >
          {isPinging ? "Misurazione..." : "Ping Demone (<2ms)"}
        </button>

        {status === "ERROR" && (
          <button
            onClick={reconnect}
            style={{
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: "10px",
              border: "none",
              background: "rgba(255, 69, 58, 0.2)",
              color: "#ff453a",
              cursor: "pointer",
            }}
          >
            Riconnetti
          </button>
        )}
      </div>

      {/* Telemetry Output */}
      {pingStats && (
        <div
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(48, 209, 88, 0.1)",
            border: "1px solid rgba(48, 209, 88, 0.2)",
            fontSize: "12px",
            color: "#30d158",
            textAlign: "center",
          }}
        >
          Loopback RTT: <strong>{pingStats.rtt} ms</strong> (Server Time: {pingStats.time})
        </div>
      )}

      {error && status !== "AUTHENTICATED" && (
        <div
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(255, 69, 58, 0.15)",
            fontSize: "12px",
            color: "#ff453a",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default NotchController;
