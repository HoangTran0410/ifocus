import React, { useEffect, useState } from "react";
import { Scene, EffectType, TimerMode } from "../types";
import loadable from "@loadable/component";
import { LoadingFallback } from "../utils/loader";

const Background = loadable(() => import("./Background"), {
  fallback: LoadingFallback,
});
const Timer = loadable(() => import("./Timer"), {
  fallback: LoadingFallback,
});
const Visualizer = loadable(() => import("./Visualizer"), {
  fallback: LoadingFallback,
});

interface PiPContentProps {
  currentScene: Scene;
  currentEffect: EffectType;
  isBgMuted: boolean;
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  showTimer: boolean;
  setShowTimer: (show: boolean) => void;
  showVisualizer: boolean;
  setShowVisualizer: (show: boolean) => void;
}

export default function PiPContent({
  currentScene,
  currentEffect,
  isBgMuted,
  timerMode,
  setTimerMode,
  showTimer,
  setShowTimer,
  showVisualizer,
  setShowVisualizer,
}: PiPContentProps) {
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
      <div className="relative w-screen h-screen overflow-hidden font-sans bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans">
      {/* Dynamic Background */}
      <Background
        scene={currentScene}
        effect={currentEffect}
        isMuted={isBgMuted}
        disableYouTube={true}
        isPiP={true}
      />

      {/* Main Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        {/* Center Area - Visualizer takes priority over Timer */}
        <div className="flex-1 flex items-center justify-center p-4 pointer-events-auto">
          {showVisualizer ? (
            <div className="w-full max-w-2xl">
              <Visualizer
                onClose={() => setShowVisualizer(false)}
                isCenterMode
                allowPiP={false}
              />
            </div>
          ) : showTimer ? (
            <Timer
              mode={timerMode}
              setMode={setTimerMode}
              onClose={() => setShowTimer(false)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
