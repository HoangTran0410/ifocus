import React, { useEffect, useState } from "react";
import loadable from "@loadable/component";
import { LoadingFallback } from "../utils/loader";
import {
  useShowTimer,
  useSetShowTimer,
  useShowVisualizer,
  useSetShowVisualizer,
} from "../stores/useAppStore";

const Background = loadable(() => import("./Background"), {
  fallback: LoadingFallback,
});
const Timer = loadable(() => import("./Timer"), {
  fallback: LoadingFallback,
});
const Visualizer = loadable(() => import("./Visualizer"), {
  fallback: LoadingFallback,
});

export default function PiPContent() {
  // Get state from Zustand store
  const showTimer = useShowTimer();
  const setShowTimer = useSetShowTimer();
  const showVisualizer = useShowVisualizer();
  const setShowVisualizer = useSetShowVisualizer();

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
      <Background disableYouTube={true} isInPiP={true} />

      {/* Visualizer - handles its own positioning */}
      {showVisualizer && (
        <Visualizer
          onClose={() => setShowVisualizer(false)}
          forceCenter
          isInPiP={true}
        />
      )}

      {/* Main Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        {/* Center Area - only show Timer when visualizer is not in center mode */}
        <div className="flex-1 flex items-center justify-center p-4 pointer-events-auto">
          {showTimer && !showVisualizer ? (
            <Timer onClose={() => setShowTimer(false)} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
