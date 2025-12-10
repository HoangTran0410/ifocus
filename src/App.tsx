import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Music,
  CheckSquare,
  Edit3,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Sparkles,
  PictureInPicture2,
} from "lucide-react";

// Extend Window interface for Document Picture-in-Picture API
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: {
        width?: number;
        height?: number;
      }) => Promise<Window>;
      window: Window | null;
    };
  }
}
import { Background } from "./components/Background";
import { Timer } from "./components/Timer";
import { AudioController } from "./components/AudioController";
import { Tasks } from "./components/Tasks";
import { PiPContent } from "./components/PiPContent";
import { Notes } from "./components/Notes";
import { SceneSelector } from "./components/SceneSelector";
import { EffectsSelector } from "./components/EffectsSelector";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { DEFAULT_SCENES, DEFAULT_SOUNDS } from "./constants";
import { Scene, SoundState, Task, Note, TimerMode, EffectType } from "./types";

// Panel types
type PanelType = "none" | "audio" | "tasks" | "notes" | "scenes" | "effects";

function App() {
  // Application State
  const [currentScene, setCurrentScene] = useLocalStorage<Scene>(
    "zen_scene",
    DEFAULT_SCENES[0]
  );
  const [currentEffect, setCurrentEffect] = useLocalStorage<EffectType>(
    "zen_effect",
    "none"
  );

  // Runtime state for sound playback (volume and isPlaying)
  const [soundStates, setSoundStates] = useLocalStorage<SoundState[]>(
    "zen_sound_states",
    DEFAULT_SOUNDS.map((sound) => ({
      id: sound.id,
      volume: 0.5,
      isPlaying: false,
    }))
  );

  const [tasks, setTasks] = useLocalStorage<Task[]>("zen_tasks", []);
  const [notes, setNotes] = useLocalStorage<Note[]>("zen_notes", []);

  // YouTube State
  const [youtubeUrl, setYoutubeUrl] = useLocalStorage<string>("zen_yt_url", "");
  const [youtubeHistory, setYoutubeHistory] = useLocalStorage<string[]>(
    "zen_yt_history",
    []
  );
  const [isBgMuted, setIsBgMuted] = useLocalStorage<boolean>(
    "zen_bg_muted",
    true
  ); // Background video mute state

  const [timerMode, setTimerMode] = useLocalStorage<TimerMode>(
    "zen_timerMode",
    "pomodoro"
  );
  const [activePanel, setActivePanel] = useState<PanelType>("none");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const togglePiP = async () => {
    try {
      console.log("Toggle PiP clicked");

      // Check for Document Picture-in-Picture API support
      if (!window.documentPictureInPicture) {
        alert(
          "Document Picture-in-Picture is not supported in your browser. Please use Chrome 116+ or Edge 116+."
        );
        return;
      }

      // If PiP window is already open, close it
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
        setIsPiP(false);
        return;
      }

      // Open Document PiP window
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 800,
        height: 450,
      });

      pipWindowRef.current = pipWindow;

      // Copy all stylesheets from the main document to PiP window
      const styleSheets = Array.from(document.styleSheets);
      styleSheets.forEach((styleSheet) => {
        try {
          const cssRules = Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
          const style = pipWindow.document.createElement("style");
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          // For external stylesheets, create a link element
          const link = pipWindow.document.createElement("link");
          link.rel = "stylesheet";
          link.href = (styleSheet as CSSStyleSheet).href || "";
          if (link.href) {
            pipWindow.document.head.appendChild(link);
          }
        }
      });

      // Set body styles
      pipWindow.document.body.style.margin = "0";
      pipWindow.document.body.style.padding = "0";
      pipWindow.document.body.style.overflow = "hidden";

      // Listen for window close
      pipWindow.addEventListener("pagehide", () => {
        pipWindowRef.current = null;
        setIsPiP(false);
      });

      // Set state to trigger React Portal rendering
      setIsPiP(true);
    } catch (error) {
      console.error("PiP error:", error);
      alert(
        "Failed to activate Picture-in-Picture mode. Error: " +
          (error as Error).message
      );
      setIsPiP(false);
    }
  };

  // Cleanup PiP window on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  const addToHistory = (url: string) => {
    // Deduplicate and keep top 5
    const newHistory = [url, ...youtubeHistory.filter((u) => u !== url)].slice(
      0,
      5
    );
    setYoutubeHistory(newHistory);
  };

  return (
    <div className="pip-capture-root relative w-screen h-screen overflow-hidden font-sans">
      {/* Dynamic Background */}
      <Background
        scene={currentScene}
        effect={currentEffect}
        isMuted={isBgMuted}
      />

      {/* Main Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        {/* Header / Top Bar */}
        <div className="flex justify-between items-center p-6 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
              <span className="font-bold text-white">F</span>
            </div>
            <span className="text-white font-semibold tracking-wide text-lg shadow-black drop-shadow-md">
              iFocus
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePiP}
              className={`p-3 transition-colors rounded-full hover:bg-white/10 ${
                isPiP ? "text-white" : "text-white/70 hover:text-white"
              }`}
              title="Picture-in-Picture"
            >
              <PictureInPicture2 size={20} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

        {/* Center Timer Area */}
        <div className="flex-1 flex items-center justify-center p-4 pointer-events-auto">
          <div
            className={`transition-all duration-500 ${
              activePanel !== "none" ? "lg:-translate-x-32" : ""
            }`}
          >
            <Timer mode={timerMode} setMode={setTimerMode} />
          </div>
        </div>

        {/* Bottom Dock / Navigation */}
        <div className="flex justify-center pb-8 pointer-events-auto">
          {/* We apply the same transition logic here to keep it centered relative to the timer */}
          <div
            className={`transition-all duration-500 ${
              activePanel !== "none" ? "lg:-translate-x-32" : ""
            }`}
          >
            <div className="flex gap-4 p-2 bg-black/40 opacity-80 hover:opacity-100 hover:backdrop-blur-xl transition-all rounded-2xl border border-white/10 shadow-2xl">
              <DockButton
                icon={<ImageIcon size={20} />}
                label="Scenes"
                isActive={activePanel === "scenes"}
                onClick={() =>
                  setActivePanel(activePanel === "scenes" ? "none" : "scenes")
                }
              />
              <DockButton
                icon={<Sparkles size={20} />}
                label="Effects"
                isActive={activePanel === "effects"}
                onClick={() =>
                  setActivePanel(activePanel === "effects" ? "none" : "effects")
                }
              />
              <DockButton
                icon={<Music size={20} />}
                label="Sounds"
                isActive={activePanel === "audio"}
                onClick={() =>
                  setActivePanel(activePanel === "audio" ? "none" : "audio")
                }
              />
              <div className="w-px h-10 bg-white/10 mx-1 self-center" />
              <DockButton
                icon={<CheckSquare size={20} />}
                label="Tasks"
                isActive={activePanel === "tasks"}
                onClick={() =>
                  setActivePanel(activePanel === "tasks" ? "none" : "tasks")
                }
              />
              <DockButton
                icon={<Edit3 size={20} />}
                label="Notes"
                isActive={activePanel === "notes"}
                onClick={() =>
                  setActivePanel(activePanel === "notes" ? "none" : "notes")
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel Drawer - Keep all panels mounted, just hide them */}
      <div
        className={`absolute top-0 right-0 h-full w-full sm:w-96 glass-panel border-l border-white/10 transition-transform duration-300 ease-out z-20 ${
          activePanel !== "none" ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">
              {activePanel}
            </span>
            <button
              onClick={() => setActivePanel("none")}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* All panels stay mounted, just hidden */}
          <div className="flex-1 overflow-hidden relative">
            <div
              className={`absolute inset-0 ${
                activePanel === "audio" ? "block" : "hidden"
              }`}
            >
              <AudioController
                soundStates={soundStates}
                setSoundStates={setSoundStates}
                youtubeUrl={youtubeUrl}
                setYoutubeUrl={setYoutubeUrl}
                youtubeHistory={youtubeHistory}
                addToHistory={addToHistory}
              />
            </div>
            <div
              className={`absolute inset-0 ${
                activePanel === "tasks" ? "block" : "hidden"
              }`}
            >
              <Tasks tasks={tasks} setTasks={setTasks} />
            </div>
            <div
              className={`absolute inset-0 ${
                activePanel === "notes" ? "block" : "hidden"
              }`}
            >
              <Notes notes={notes} setNotes={setNotes} />
            </div>
            <div
              className={`absolute inset-0 ${
                activePanel === "scenes" ? "block" : "hidden"
              }`}
            >
              <SceneSelector
                currentScene={currentScene}
                setScene={setCurrentScene}
                isBgMuted={isBgMuted}
                setIsBgMuted={setIsBgMuted}
              />
            </div>
            <div
              className={`absolute inset-0 ${
                activePanel === "effects" ? "block" : "hidden"
              }`}
            >
              <EffectsSelector
                currentEffect={currentEffect}
                setEffect={setCurrentEffect}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Render PiP content using Portal when PiP is active */}
      {isPiP &&
        pipWindowRef.current &&
        createPortal(
          <PiPContent
            currentScene={currentScene}
            currentEffect={currentEffect}
            isBgMuted={isBgMuted}
            timerMode={timerMode}
            setTimerMode={setTimerMode}
          />,
          pipWindowRef.current.document.body
        )}
    </div>
  );
}

// Helper Subcomponent
const DockButton = ({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 ${
      isActive
        ? "bg-white text-black shadow-lg"
        : "text-white/70 hover:bg-white/10 hover:text-white hover:translate-y-[-2px]"
    }`}
  >
    {icon}
    <span className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-white bg-black/60 px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap pointer-events-none">
      {label}
    </span>
  </button>
);

export default App;
