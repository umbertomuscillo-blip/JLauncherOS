import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import type { TokenStreamEvent, PipelineCompleteEvent } from "../../types/ipc_schema";

export const PromptPipelineView: React.FC = () => {
  const { status, call, subscribe } = useWebSocket();
  const [promptInput, setPromptInput] = useState<string>(
    "Genera un modulo Rust/AppKit per il rendering a 120 FPS su display ProMotion."
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [streamedText, setStreamedText] = useState<string>("");
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineCompleteEvent | null>(null);

  useEffect(() => {
    const unsubStream = subscribe("event.prompterrr.tokenStream", (params: TokenStreamEvent) => {
      setStreamedText((prev) => prev + params.token_chunk);
    });

    const unsubComplete = subscribe("event.prompterrr.pipelineComplete", (params: PipelineCompleteEvent) => {
      setPipelineMetrics(params);
      setIsRunning(false);
    });

    return () => {
      unsubStream();
      unsubComplete();
    };
  }, [subscribe]);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setStreamedText("");
    setPipelineMetrics(null);

    try {
      await call("prompterrr.submitPrompt", {
        prompt: promptInput,
        prompt_input: promptInput,
        context_files: ["src-tauri/src/main.rs", "backend/main.py"],
        mode: "architect_critic",
        temperature: 0.2,
        enable_cache: true,
      });
    } catch (err) {
      console.error("Errore durante l'esecuzione della pipeline:", err);
      setIsRunning(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
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
        <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0 }}>Prompterrr (Architetto-Critico)</h2>
        <span style={{ fontSize: "12px", color: "#bf5af2" }}>M4 Context Engine</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "12px", color: "#86868b" }}>Prompt Input</label>
        <textarea
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px",
            borderRadius: "10px",
            background: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#f5f5f7",
            fontSize: "13px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>

      <button
        onClick={handleRunPipeline}
        disabled={status !== "AUTHENTICATED" || isRunning}
        style={{
          padding: "10px 14px",
          fontSize: "13px",
          fontWeight: 600,
          borderRadius: "10px",
          border: "none",
          background: "#bf5af2",
          color: "#ffffff",
          cursor: status === "AUTHENTICATED" && !isRunning ? "pointer" : "not-allowed",
          opacity: isRunning ? 0.6 : 1,
        }}
      >
        {isRunning ? "Pipeline in elaborazione..." : "Esegui Pipeline Dual-Stage"}
      </button>

      {/* Token Streaming Output Box */}
      <div
        style={{
          background: "#0d0d0f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
          padding: "12px",
          minHeight: "120px",
          maxHeight: "220px",
          overflowY: "auto",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "12px",
          lineHeight: "1.5",
          color: "#e5e5ea",
          whiteSpace: "pre-wrap",
        }}
      >
        {streamedText || <span style={{ color: "#636366" }}>In attesa di esecuzione... I token appariranno qui in streaming reale.</span>}
      </div>

      {/* Metrics Banner */}
      {pipelineMetrics && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: "rgba(191, 90, 242, 0.1)",
            border: "1px solid rgba(191, 90, 242, 0.25)",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#bf5af2",
          }}
        >
          <span>⏱️ Tempo: <strong>{pipelineMetrics.duration_ms} ms</strong></span>
          <span>⚡ Cache Hit: <strong>{pipelineMetrics.cache_hit ? "Sì" : "No"}</strong></span>
          <span>💾 Token Risparmiati: <strong>{pipelineMetrics.tokens_saved}</strong></span>
        </div>
      )}
    </div>
  );
};

export default PromptPipelineView;
