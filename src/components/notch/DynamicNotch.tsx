import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import type {
  VoiceState,
  VoiceStateChangedEvent,
  VoiceTranscriptEvent,
  MediaTrackChangedEvent,
  DiskAlarmEvent,
} from "../../types/ipc_schema";

export const DynamicNotch: React.FC = () => {
  const { call, subscribe } = useWebSocket();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [amplitude, setAmplitude] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>("");
  const [mediaInfo, setMediaInfo] = useState<MediaTrackChangedEvent | null>(null);
  const [diskAlarm, setDiskAlarm] = useState<DiskAlarmEvent | null>(null);

  useEffect(() => {
    // Sottoscrizione eventi push via WebSocket
    const unsubVoice = subscribe("event.voice.stateChanged", (params: VoiceStateChangedEvent) => {
      setVoiceState(params.state);
      setAmplitude(params.audio_amplitude || 0);
    });

    const unsubTranscript = subscribe("event.voice.transcript", (params: VoiceTranscriptEvent) => {
      setTranscript(params.text);
    });

    const unsubMedia = subscribe("event.media.trackChanged", (params: MediaTrackChangedEvent) => {
      setMediaInfo(params);
    });

    const unsubAlarm = subscribe("event.memory.diskAlarm", (params: DiskAlarmEvent) => {
      setDiskAlarm(params);
    });

    return () => {
      unsubVoice();
      unsubTranscript();
      unsubMedia();
      unsubAlarm();
    };
  }, [subscribe]);

  const handleSimulateVoice = async () => {
    if (voiceState === "idle") {
      await call("voice.startListening");
    } else {
      await call("voice.stopListening");
    }
  };

  const getNotchColor = () => {
    switch (voiceState) {
      case "listening":
        return "#0a84ff"; // Apple Blue
      case "thinking":
        return "#bf5af2"; // Apple Purple
      case "speaking":
        return "#30d158"; // Apple Green
      case "idle":
      default:
        return diskAlarm ? "#ff453a" : "rgba(255, 255, 255, 0.15)";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "480px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      {/* Physical Dynamic Notch Island Container */}
      <div
        onClick={handleSimulateVoice}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          borderRadius: "26px",
          background: "#000000",
          border: `1.5px solid ${getNotchColor()}`,
          boxShadow: `0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px ${getNotchColor()}33`,
          cursor: "pointer",
          width: voiceState === "idle" ? "240px" : "360px",
          height: "38px",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          userSelect: "none",
          transform: "translate3d(0, 0, 0)", // Metal/GPU hardware acceleration
          willChange: "width, height, transform, border-color, box-shadow", // 120 FPS ProMotion
        }}
      >
        {/* Status Dot / Camera Sensor */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: getNotchColor(),
              boxShadow: `0 0 8px ${getNotchColor()}`,
              transition: "background 0.3s ease",
            }}
          />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#f5f5f7", textTransform: "capitalize" }}>
            {voiceState}
          </span>
        </div>

        {/* Dynamic Waveform Visualizer (120 FPS ProMotion ready) */}
        {voiceState === "listening" || voiceState === "speaking" ? (
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            {[0.4, 0.8, 1.0, 0.6, 0.3].map((factor, idx) => (
              <span
                key={idx}
                style={{
                  width: "3px",
                  height: `${Math.max(4, Math.round(amplitude * 24 * factor))}px`,
                  background: getNotchColor(),
                  borderRadius: "2px",
                  transition: "height 0.08s ease-out",
                }}
              />
            ))}
          </div>
        ) : mediaInfo && mediaInfo.is_playing ? (
          <div style={{ fontSize: "11px", color: "#a1a1a6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
            🎵 {mediaInfo.title}
          </div>
        ) : (
          <div style={{ fontSize: "11px", color: "#636366" }}>JARVIS AI</div>
        )}
      </div>

      {/* Transcript or Alarm Sub-banner */}
      {transcript && (
        <div
          style={{
            marginTop: "10px",
            padding: "6px 14px",
            borderRadius: "12px",
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: "12px",
            color: "#e5e5ea",
            textAlign: "center",
          }}
        >
          "{transcript}"
        </div>
      )}

      {diskAlarm && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px 14px",
            borderRadius: "10px",
            background: "rgba(255, 69, 58, 0.15)",
            border: "1px solid rgba(255, 69, 58, 0.3)",
            fontSize: "12px",
            color: "#ff453a",
            textAlign: "center",
          }}
        >
          ⚠️ {diskAlarm.recommendation}
        </div>
      )}
    </div>
  );
};

export default DynamicNotch;
