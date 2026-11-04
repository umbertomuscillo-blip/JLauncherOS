import React, { useState, useEffect } from "react";

interface PixelPetProps {
  mood?: "happy" | "sleepy" | "curious" | "grooving";
  isPlayingMusic?: boolean;
}

export const PixelPet: React.FC<PixelPetProps> = ({ isPlayingMusic = false }) => {
  const [frame, setFrame] = useState<number>(0);
  const [petAction, setPetAction] = useState<"idle" | "walk" | "sleep" | "heart">("idle");
  const [speech, setSpeech] = useState<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 4);
    }, isPlayingMusic ? 200 : 400);

    return () => clearInterval(interval);
  }, [isPlayingMusic]);

  const handlePetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPetAction("heart");
    const phrases = ["Purrr...", "120 Hz Ready", "JARVIS Online", "Focus Active"];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)] || "Meow!";
    setSpeech(randomPhrase);

    setTimeout(() => {
      setPetAction("idle");
      setSpeech("");
    }, 2400);
  };

  const tailOffset = frame % 2 === 0 ? 0 : 1;
  const isBlink = frame === 3;

  return (
    <button
      type="button"
      onClick={handlePetClick}
      aria-label="Interactive Pixel Cat Companion"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        padding: "6px 12px",
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: "#ffffff",
        userSelect: "none",
        transition: "background 0.2s ease, transform 0.2s ease",
      }}
    >
      {/* Authentic 16x16 Crisp Pixel-Art Cat Sprite (IMG_0139.PNG / IMG_0153.PNG) */}
      <svg
        width="34"
        height="34"
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        style={{
          transform: isPlayingMusic
            ? `translateY(${frame % 2 === 0 ? -1 : 0}px)`
            : "none",
          transition: "transform 0.15s ease",
          flexShrink: 0,
        }}
      >
        {/* Ears */}
        <rect x="3" y="2" width="2" height="2" fill="#F59E0B" />
        <rect x="10" y="2" width="2" height="2" fill="#F59E0B" />
        <rect x="4" y="3" width="1" height="1" fill="#FDE68A" />
        <rect x="10" y="3" width="1" height="1" fill="#FDE68A" />
        {/* Head */}
        <rect x="3" y="4" width="9" height="5" fill="#FBBF24" />
        {/* Eyes */}
        {!isBlink ? (
          <>
            <rect x="4" y="5" width="2" height="2" fill="#111827" />
            <rect x="9" y="5" width="2" height="2" fill="#111827" />
            <rect x="4" y="5" width="1" height="1" fill="#FFFFFF" />
            <rect x="9" y="5" width="1" height="1" fill="#FFFFFF" />
          </>
        ) : (
          <>
            <rect x="4" y="6" width="2" height="1" fill="#111827" />
            <rect x="9" y="6" width="2" height="1" fill="#111827" />
          </>
        )}
        {/* Nose / Whiskers */}
        <rect x="7" y="7" width="1" height="1" fill="#F43F5E" />
        {/* Sitting Body */}
        <rect x="4" y="9" width="7" height="5" fill="#F59E0B" />
        <rect x="5" y="10" width="5" height="3" fill="#FEF3C7" />
        {/* Front Paws */}
        <rect x="4" y="13" width="2" height="2" fill="#FFFFFF" />
        <rect x="9" y="13" width="2" height="2" fill="#FFFFFF" />
        {/* Animated Pixel Tail */}
        <rect x={11} y={11 - tailOffset} width="2" height="2" fill="#D97706" />
        <rect x={12 + tailOffset} y={9 - tailOffset} width="2" height="2" fill="#F59E0B" />
        {/* Heart Reaction Pixel */}
        {petAction === "heart" && (
          <path d="M12 2h1v1h1V2h1v2h-1v1h-1v1h-1V5h-1V4h1V2z" fill="#FF3B30" />
        )}
      </svg>

      <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>
          {speech || (isPlayingMusic ? "Grooving" : "Pixel Companion")}
        </span>
        <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.62)", lineHeight: 1.2 }}>
          {isPlayingMusic ? "Synced to rhythm" : "Sitting on bezel"}
        </span>
      </div>
    </button>
  );
};

export default PixelPet;
