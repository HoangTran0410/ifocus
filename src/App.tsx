import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import loadable from "@loadable/component";
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
  Menu,
} from "lucide-react";
import {
  useShowVisualizer,
  useSetShowVisualizer,
  useVisualizerMode,
  useShowTimer,
  useSetShowTimer,
} from "./stores/useAppStore";
import { LoadingFallback } from "./utils/loader";

// screens
const EffectsScreen = loadable(() => import("./components/ScreenEffects"), {
  fallback: LoadingFallback,
});
const AudioScreen = loadable(() => import("./components/ScreenAudio"), {
  fallback: LoadingFallback,
});
const TasksScreen = loadable(() => import("./components/ScreenTasks"), {
  fallback: LoadingFallback,
});
const NotesScreen = loadable(() => import("./components/ScreenNotes"), {
  fallback: LoadingFallback,
});
const SceneScreen = loadable(() => import("./components/ScreenScene"), {
  fallback: LoadingFallback,
});

// components
const Background = loadable(() => import("./components/Background"), {
  fallback: LoadingFallback,
});
const PiPContent = loadable(() => import("./components/PiPContent"), {
  fallback: LoadingFallback,
});
const Timer = loadable(() => import("./components/Timer"), {
  fallback: LoadingFallback,
});
const Visualizer = loadable(() => import("./components/Visualizer"), {
  fallback: LoadingFallback,
});

const Panels = [
  {
    label: "Scenes",
    icon: <ImageIcon size={18} />,
    comp: SceneScreen,
  },
  {
    label: "Sounds",
    icon: <Music size={18} />,
    comp: AudioScreen,
  },
  {
    label: "Effects",
    icon: <Sparkles size={18} />,
    comp: EffectsScreen,
  },
  { divider: true },
  {
    label: "Tasks",
    icon: <CheckSquare size={18} />,
    comp: TasksScreen,
  },
  {
    label: "Notes",
    icon: <Edit3 size={18} />,
    comp: NotesScreen,
  },
];

const DefaultPanel = Panels[0]?.label;

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

function App() {
  // Get state from Zustand store
  const showVisualizer = useShowVisualizer();
  const setShowVisualizer = useSetShowVisualizer();
  const visualizerMode = useVisualizerMode();
  const showTimer = useShowTimer();
  const setShowTimer = useSetShowTimer();

  // Local UI state (not persisted)
  const [activePanel, setActivePanel] = useState<string>(DefaultPanel);
  const lastActivePanelRef = useRef<string>(activePanel);

  const [visitedPanels, setVisitedPanels] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiPWebsite, setIsPiPWebsite] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);

  // Lazy load panels
  useEffect(() => {
    if (!!activePanel) {
      lastActivePanelRef.current = activePanel;

      if (!visitedPanels.has(activePanel))
        setVisitedPanels((prev) => new Set([...prev, activePanel]));
    }
  }, [activePanel, visitedPanels]);

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
        setIsPiPWebsite(false);
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
        setIsPiPWebsite(false);
      });

      // Set state to trigger React Portal rendering
      setIsPiPWebsite(true);
    } catch (error) {
      console.error("PiP error:", error);
      alert(
        "Failed to activate Picture-in-Picture mode. Error: " +
          (error as Error).message
      );
      setIsPiPWebsite(false);
    }
  };

  const openGithub = () => {
    window.open("https://github.com/hoangtran0410/ifocus", "_blank");
  };

  // Cleanup PiP window on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  return (
    <div className="pip-capture-root relative w-screen h-screen overflow-hidden font-sans">
      {/* Dynamic Background - now uses Zustand internally */}
      <Background />

      {/* Visualizer - handles its own positioning based on visualizerMode */}
      {showVisualizer && (
        <Visualizer
          onClose={() => setShowVisualizer(false)}
          stop={isPiPWebsite}
        />
      )}

      {/* Main Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Header / Top Bar */}
        <div className="flex justify-between items-center p-3 pointer-events-auto">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg p-2 transition-colors"
            onClick={openGithub}
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
              <span className="font-bold text-white">F</span>
            </div>
            <span className="text-white font-semibold tracking-wide text-lg shadow-black drop-shadow-md">
              iFocus
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* PiP button - desktop only */}
            <button
              onClick={togglePiP}
              className={`p-3 transition-colors rounded-full hover:bg-white/10 hidden sm:block ${
                isPiPWebsite ? "text-white" : "text-white/70 hover:text-white"
              }`}
              title="Picture-in-Picture"
            >
              <PictureInPicture2 size={20} />
            </button>
            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="p-3 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            {/* Hamburger menu for mobile */}
            <button
              onClick={() =>
                setActivePanel(!activePanel ? lastActivePanelRef.current : "")
              }
              className={`p-3 transition-colors rounded-full hover:bg-white/10 sm:hidden ${
                !!activePanel
                  ? "text-white bg-white/10"
                  : "text-white/70 hover:text-white"
              }`}
              title="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Center Timer Area - only show Timer when visualizer is not in center mode */}
        <div className="flex-1 flex items-center justify-center p-4 pointer-events-auto">
          {showTimer && !(showVisualizer && visualizerMode === "center") ? (
            <div className={`transition-all duration-500`}>
              <Timer onClose={() => setShowTimer(false)} />
            </div>
          ) : null}
        </div>

        {/* Bottom Dock / Navigation */}
        <div className="flex justify-center pb-6 pointer-events-auto hidden sm:flex">
          {/* We apply the same transition logic here to keep it centered relative to the timer */}
          <div className={`transition-all duration-500`}>
            <div className="flex gap-0 sm:gap-2 p-2 bg-black/40 opacity-50 hover:opacity-100 hover:backdrop-blur transition-all rounded-2xl border border-white/10 shadow-2xl">
              {Panels.filter((item) => !item.divider).map((item) => (
                <DockButton
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  isActive={activePanel === item.label}
                  onClick={() =>
                    setActivePanel(activePanel === item.label ? "" : item.label)
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel Drawer - Keep all panels mounted, just hide them */}
      <div
        className={`absolute top-0 right-0 h-full w-full sm:w-96 glass-panel border-l border-white/10 transition-transform duration-300 ease-out ${
          !!activePanel ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          zIndex: !!activePanel ? 50 : -1,
        }}
      >
        <div className="h-full flex flex-col p-4 sm:p-6">
          {/* Header with navigation tabs */}
          <div className="flex items-center justify-between mb-4">
            {/* Tab Navigation */}
            <div className="flex gap-1">
              {Panels.map((item) =>
                item.divider ? (
                  <div
                    key={item.label}
                    className="w-px h-10 bg-white/10 mx-1 self-center"
                  />
                ) : (
                  <button
                    key={item.label}
                    onClick={() => setActivePanel(item.label)}
                    className={`p-2 rounded-lg transition-all ${
                      activePanel === item.label
                        ? "bg-white/20 text-white"
                        : "text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                    title={item.label}
                  >
                    {item.icon}
                  </button>
                )
              )}
            </div>
            {/* Close button */}
            <button
              onClick={() => setActivePanel("")}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">
              {activePanel}
            </span>
          </div>

          {/* All panels stay mounted, just hidden - now use Zustand internally */}
          <div className="flex-1 overflow-hidden relative">
            {Panels.filter((item) => item.comp).map((item) => (
              <div
                key={item.label}
                className={`absolute inset-0 ${
                  activePanel === item.label ? "block" : "hidden"
                }`}
              >
                {visitedPanels.has(item.label) && <item.comp />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Render PiP content using Portal when PiP is active */}
      {isPiPWebsite &&
        pipWindowRef.current &&
        createPortal(<PiPContent />, pipWindowRef.current.document.body)}
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
