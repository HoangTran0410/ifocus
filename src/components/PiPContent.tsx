import React, { useEffect, useState } from "react";
import { Background } from "./Background";
import { Timer } from "./Timer";
import { Scene, EffectType, TimerMode } from "../types";

interface PiPContentProps {
  currentScene: Scene;
  currentEffect: EffectType;
  isBgMuted: boolean;
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
}

export const PiPContent: React.FC<PiPContentProps> = ({
  currentScene,
  currentEffect,
  isBgMuted,
  timerMode,
  setTimerMode,
}) => {
  const [isReady, setIsReady] = useState(false);

  // Wait for the PiP window to be fully ready
  useEffect(() => {
    // Small delay to ensure styles are loaded
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="relative w-full h-full overflow-hidden font-sans bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden font-sans">
      {/* Dynamic Background */}
      <Background
        scene={currentScene}
        effect={currentEffect}
        isMuted={isBgMuted}
        disableYouTube={currentScene.type === "youtube"}
      />

      {/* Main Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        {/* Center Timer Area */}
        <div className="flex-1 flex items-center justify-center p-4 pointer-events-auto">
          <Timer mode={timerMode} setMode={setTimerMode} />
        </div>
      </div>
    </div>
  );
};
