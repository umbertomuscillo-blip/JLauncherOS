import React, { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import type { DiskScanProgressEvent } from "../../types/ipc_schema";

export const DiskDashboard: React.FC = () => {
  const { status, call, subscribe } = useWebSocket();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [scanProgress, setScanProgress] = useState<DiskScanProgressEvent | null>(null);
  const [scanResults, setScanResults] = useState<any>(null);
  const [cleanSummary, setCleanSummary] = useState<any>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([
    "xcode_derived_data",
    "caches",
    "logs",
  ]);

  const fetchTelemetry = useCallback(async () => {
    try {
      const { result } = await call<any>("memory.getStorageTelemetry");
      setTelemetry(result);
    } catch (err) {
      console.warn("Impossibile caricare telemetria storage:", err);
    }
  }, [call]);

  useEffect(() => {
    if (status === "AUTHENTICATED") {
      fetchTelemetry();
    }
  }, [status, fetchTelemetry]);

  useEffect(() => {
    const unsub = subscribe("event.memory.scanProgress", (params: DiskScanProgressEvent) => {
      setScanProgress(params);
    });
    return () => unsub();
  }, [subscribe]);

  const handleStartScan = async () => {
    setIsScanning(true);
    setCleanSummary(null);
    try {
      const { result } = await call<any>("memory.scan", {
        targets: selectedTargets,
        deep_scan: false,
      });
      setScanResults(result);
      fetchTelemetry();
    } catch (err) {
      console.error("Scansione fallita:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClean = async () => {
    setIsCleaning(true);
    try {
      const { result } = await call<any>("memory.clean", {
        categories: selectedTargets,
        dry_run: false,
      });
      setCleanSummary(result);
      setScanResults(null);
      fetchTelemetry();
    } catch (err) {
      console.error("Pulizia fallita:", err);
    } finally {
      setIsCleaning(false);
    }
  };

  const toggleTarget = (key: string) => {
    setSelectedTargets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        padding: "24px",
        borderRadius: "20px",
        background: "rgba(24, 24, 27, 0.8)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: "#f5f5f7",
        maxWidth: "540px",
        width: "100%",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0 }}>Help Memoria (APFS Storage)</h2>
        <span style={{ fontSize: "12px", color: "#86868b" }}>Apple Silicon APFS Engine</span>
      </div>

      {/* Storage Gauge Bar */}
      {telemetry && (
        <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "14px", borderRadius: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
            <span>Spazio Libero: <strong style={{ color: "#30d158" }}>{telemetry.available_human}</strong></span>
            <span style={{ color: "#86868b" }}>Totale: {telemetry.total_human}</span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                width: `${telemetry.used_percentage}%`,
                height: "100%",
                background: telemetry.used_percentage > 90 ? "#ff453a" : "#0a84ff",
                borderRadius: "4px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Categories Selection */}
      <div>
        <div style={{ fontSize: "12px", color: "#86868b", marginBottom: "8px", textTransform: "uppercase" }}>
          Target di Scansione Selezionati
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {[
            { id: "xcode_derived_data", label: "Xcode DerivedData" },
            { id: "caches", label: "App & System Caches" },
            { id: "logs", label: "System Logs (~/Logs)" },
            { id: "trash", label: "Cestino (~/.Trash)" },
          ].map((cat) => (
            <label
              key={cat.id}
              onClick={() => toggleTarget(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "10px",
                background: selectedTargets.includes(cat.id) ? "rgba(10, 132, 255, 0.15)" : "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${selectedTargets.includes(cat.id) ? "rgba(10, 132, 255, 0.4)" : "rgba(255, 255, 255, 0.06)"}`,
                cursor: "pointer",
                fontSize: "12px",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={selectedTargets.includes(cat.id)}
                onChange={() => {}}
                style={{ accentColor: "#0a84ff" }}
              />
              {cat.label}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleStartScan}
          disabled={status !== "AUTHENTICATED" || isScanning}
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "10px",
            border: "none",
            background: "#0a84ff",
            color: "#ffffff",
            cursor: status === "AUTHENTICATED" && !isScanning ? "pointer" : "not-allowed",
            opacity: isScanning ? 0.6 : 1,
          }}
        >
          {isScanning ? "Scansione in corso..." : "Avvia Scansione APFS"}
        </button>

        {scanResults && (
          <button
            onClick={handleClean}
            disabled={isCleaning}
            style={{
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "10px",
              border: "none",
              background: "#30d158",
              color: "#000000",
              cursor: isCleaning ? "not-allowed" : "pointer",
            }}
          >
            {isCleaning ? "Pulizia..." : "Esegui Pulizia Sicura"}
          </button>
        )}
      </div>

      {/* Live Scan Progress Stream */}
      {isScanning && scanProgress && (
        <div style={{ background: "rgba(0, 0, 0, 0.4)", padding: "10px 14px", borderRadius: "10px", fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ color: "#0a84ff" }}>Scansione in corso...</span>
            <span>{scanProgress.percentage}%</span>
          </div>
          <div style={{ color: "#86868b", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {scanProgress.current_path}
          </div>
        </div>
      )}

      {/* Scan Results Breakdown */}
      {scanResults && (
        <div style={{ background: "rgba(48, 209, 88, 0.08)", border: "1px solid rgba(48, 209, 88, 0.2)", padding: "12px", borderRadius: "10px", fontSize: "12px" }}>
          <div>File Rilevati: <strong>{scanResults.scanned_files}</strong></div>
          <div>Spazio Liberabile: <strong style={{ color: "#30d158" }}>{(scanResults.discovered_cleanable_bytes / (1024 * 1024)).toFixed(1)} MB</strong></div>
        </div>
      )}

      {/* Clean Output Confirmation */}
      {cleanSummary && (
        <div style={{ background: "rgba(48, 209, 88, 0.15)", border: "1px solid #30d158", padding: "12px", borderRadius: "10px", fontSize: "13px", color: "#30d158", textAlign: "center" }}>
          🎉 Pulizia Completata: <strong>{cleanSummary.freed_human}</strong> liberati ({cleanSummary.deleted_files_count} file rimossi)!
        </div>
      )}
    </div>
  );
};

export default DiskDashboard;
