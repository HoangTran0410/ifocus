import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  getNormalizedFrequencyData,
  isAudioCaptureActive,
  startTabCapture,
  startMicCapture,
  startFileCapture,
  stopAudioCapture,
  getAnalyzerConfig,
  getDefaultAnalyzerConfig,
  updateAnalyzerConfig,
  getAudioSourceType,
  AudioAnalyzerConfig,
  AudioSourceType,
  getFrequencyBands,
} from "../utils/audioAnalyzer";
import {
  Mic,
  PictureInPicture2,
  Settings,
  RotateCcw,
  X,
  Move,
  Maximize,
  Upload,
  Trash2,
  Zap,
  Search,
  Sparkle,
  Monitor,
  FileAudio,
  StopCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useVisualizerMode as useVisualizerDisplayMode,
  useSetVisualizerMode as useSetVisualizerDisplayMode,
} from "../stores/useAppStore";
import {
  cleanupAllVisualizers,
  DEFAULT_MODE,
  MODES,
  render,
  VisualizerMode,
} from "../visualizers";
import { clearGradientCache } from "../visualizers/utils";
import { useMobile } from "../hooks/useMobile";

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const MIN_WIDTH = 120;
const MIN_HEIGHT = 120;
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 200;

interface VisualizerProps {
  onClose?: () => void;
  isInPiP?: boolean;
  forceCenter?: boolean;
  stop?: boolean;
}

type VisualizerPanel = "none" | "settings" | "mode" | "audio";

export default function Visualizer({
  onClose,
  isInPiP = false,
  forceCenter = false,
  stop = false,
}: VisualizerProps) {
  // Get visualizer display mode from Zustand
  const visualizerMode = useVisualizerDisplayMode();
  const setVisualizerMode = useSetVisualizerDisplayMode();

  // Detect mobile device
  const isMobile = useMobile();

  // Derive isCenterMode from store
  const isCenterMode = forceCenter || visualizerMode === "center";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // Persisted state using useLocalStorage
  const [mode, setMode] = useLocalStorage<VisualizerMode>(
    "zen_visualizer_mode",
    DEFAULT_MODE
  );
  const [position, setPosition] = useLocalStorage<Position>(
    "zen_visualizer_position",
    { x: 50, y: 50 }
  );
  const [size, setSize] = useLocalStorage<Size>("zen_visualizer_size", {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  // Hover state for opacity effect
  const [isHovered, setIsHovered] = useState(false);

  // Clear gradient cache when size changes
  useEffect(() => {
    clearGradientCache();
  }, [size.width, size.height]);

  // #region Config handlers

  // Logo image for trap nation mode
  const [logoDataUrl, setLogoDataUrl] = useLocalStorage<string | null>(
    "zen_visualizer_logo",
    null
  );
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  // PiP state
  const [_isPiPVis, setIsPiPVis] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Panel state - only one panel can be open at a time
  const [activePanel, setActivePanel] = useState<VisualizerPanel>("none");
  const [visitedPanels, setVisitedPanels] = useState<Set<VisualizerPanel>>(
    new Set()
  );
  const [modeSearch, setModeSearch] = useState("");
  const [config, setConfig] = useLocalStorage<AudioAnalyzerConfig>(
    "zen_visualizer_config",
    getAnalyzerConfig()
  );
  const [performanceMode, setPerformanceMode] = useLocalStorage<boolean>(
    "zen_visualizer_performance_mode",
    false
  );
  const [showFps, setShowFps] = useLocalStorage<boolean>(
    "zen_visualizer_show_fps",
    false
  );
  const [audioConfigExpanded, setAudioConfigExpanded] = useState(false);

  const performanceModeRef = useRef(performanceMode);
  useEffect(() => {
    performanceModeRef.current = performanceMode;
  }, [performanceMode]);

  useEffect(() => {
    if (activePanel !== "mode") {
      setModeSearch("");
    }
    // Track visited panels for lazy mounting
    if (activePanel !== "none") {
      setVisitedPanels((prev) => new Set(prev).add(activePanel));
    }
  }, [activePanel]);

  // FPS tracking refs
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const showFpsRef = useRef(showFps);
  useEffect(() => {
    showFpsRef.current = showFps;
  }, [showFps]);

  // Load logo image when dataUrl changes
  useEffect(() => {
    if (logoDataUrl) {
      const img = new Image();
      img.onload = () => {
        logoImageRef.current = img;
      };
      img.src = logoDataUrl;
    } else {
      logoImageRef.current = null;
    }
  }, [logoDataUrl]);

  // Apply saved config on mount
  useEffect(() => {
    updateAnalyzerConfig(config);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      cleanupAllVisualizers();
    };
  }, []);

  // Cleanup PiP window on unmount (don't stop audio capture - it's a singleton that should persist)
  useEffect(() => {
    return () => {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  // Handle logo upload
  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setLogoDataUrl(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    },
    [setLogoDataUrl]
  );

  // Handle logo removal
  const handleLogoRemove = useCallback(() => {
    setLogoDataUrl(null);
  }, [setLogoDataUrl]);

  // Handle close button click
  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.();
    },
    [onClose]
  );

  // Audio capture state
  const [isCapturing, setIsCapturing] = useState(() => isAudioCaptureActive());
  const [audioSourceType, setAudioSourceType] = useState<AudioSourceType>(() =>
    getAudioSourceType()
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle tab audio capture (desktop only)
  const handleTabCapture = useCallback(async () => {
    const success = await startTabCapture();
    setIsCapturing(success);
    setAudioSourceType(success ? "tab" : "none");
    if (success) setActivePanel("none");
  }, []);

  // Handle microphone capture
  const handleMicCapture = useCallback(async () => {
    const success = await startMicCapture();
    setIsCapturing(success);
    setAudioSourceType(success ? "mic" : "none");
    if (success) setActivePanel("none");
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const success = await startFileCapture(file);
        setIsCapturing(success);
        setAudioSourceType(success ? "file" : "none");
        if (success) setActivePanel("none");
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  // Handle stop capture
  const handleStopCapture = useCallback(() => {
    stopAudioCapture();
    setIsCapturing(false);
    setAudioSourceType("none");
  }, []);

  // Toggle audio panel
  const handleAudioPanelToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePanel((prev) => (prev === "audio" ? "none" : "audio"));
  }, []);

  // Handle config changes
  const handleConfigChange = useCallback(
    (key: keyof AudioAnalyzerConfig, value: number) => {
      const newConfig = { ...config, [key]: value };
      setConfig(newConfig);
      updateAnalyzerConfig({ [key]: value });
    },
    [config, setConfig]
  );

  // Toggle settings panel
  const handleSettingsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePanel((prev) => (prev === "settings" ? "none" : "settings"));
  }, []);

  // Reset config to defaults
  const handleResetConfig = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const defaultConfig = getDefaultAnalyzerConfig();
      setConfig(defaultConfig);
      updateAnalyzerConfig(defaultConfig);
    },
    [setConfig]
  );

  // Handle PiP toggle
  const handlePiPClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

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
        pipCanvasRef.current = null;
        setIsPiPVis(false);
        return;
      }

      try {
        // Open Document PiP window
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: size.width,
          height: size.height,
        });

        pipWindowRef.current = pipWindow;

        // Style the PiP window
        pipWindow.document.body.style.margin = "0";
        pipWindow.document.body.style.padding = "0";
        pipWindow.document.body.style.overflow = "hidden";
        pipWindow.document.body.style.background =
          "linear-gradient(135deg, rgba(15, 15, 30, 1), rgba(30, 20, 50, 1))";

        // Create a canvas in the PiP window
        const pipCanvas = pipWindow.document.createElement("canvas");
        pipCanvas.width = size.width;
        pipCanvas.height = size.height;
        pipCanvas.style.width = "100%";
        pipCanvas.style.height = "100%";
        pipWindow.document.body.appendChild(pipCanvas);
        pipCanvasRef.current = pipCanvas;

        // Listen for window close
        pipWindow.addEventListener("pagehide", () => {
          pipWindowRef.current = null;
          pipCanvasRef.current = null;
          setIsPiPVis(false);
        });

        setIsPiPVis(true);
      } catch (error) {
        console.error("PiP error:", error);
        alert(
          "Failed to activate Picture-in-Picture mode. Error: " +
            (error as Error).message
        );
        setIsPiPVis(false);
      }
    },
    [size]
  );

  // #endregion

  // #region Drag to Resize handlers
  // Drag state (not persisted)
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  // Pinch-to-resize state for mobile
  const [isPinching, setIsPinching] = useState(false);
  const pinchStartRef = useRef<{
    distance: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  }>({
    distance: 0,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    centerX: 0,
    centerY: 0,
  });
  const dragStartRef = useRef<{
    x: number;
    y: number;
    posX: number;
    posY: number;
  }>({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    posX: number;
    posY: number;
  }>({
    x: 0,
    y: 0,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    posX: 0,
    posY: 0,
  });

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    },
    [position]
  );

  // Touch drag start handler
  const handleTouchDragStart = useCallback(
    (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
      // Don't allow touch drag when panels are open
      if (activePanel !== "none") return;
      // Only handle single touch for dragging
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setIsDragging(true);
        dragStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          posX: position.x,
          posY: position.y,
        };
      } else if (e.touches.length === 2) {
        // Pinch-to-resize: start tracking
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        setIsPinching(true);
        setIsDragging(false);
        pinchStartRef.current = {
          distance,
          width: size.width,
          height: size.height,
          centerX,
          centerY,
        };
      }
    },
    [position, size, activePanel]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPosition({
          x: dragStartRef.current.posX + dx,
          y: dragStartRef.current.posY + dy,
        });
      } else if (isResizing) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;
        let newX = resizeStartRef.current.posX;
        let newY = resizeStartRef.current.posY;

        if (isResizing.includes("e")) {
          newWidth = Math.max(MIN_WIDTH, resizeStartRef.current.width + dx);
        }
        if (isResizing.includes("w")) {
          const potentialWidth = resizeStartRef.current.width - dx;
          if (potentialWidth >= MIN_WIDTH) {
            newWidth = potentialWidth;
            newX = resizeStartRef.current.posX + dx;
          }
        }
        if (isResizing.includes("s")) {
          newHeight = Math.max(MIN_HEIGHT, resizeStartRef.current.height + dy);
        }
        if (isResizing.includes("n")) {
          const potentialHeight = resizeStartRef.current.height - dy;
          if (potentialHeight >= MIN_HEIGHT) {
            newHeight = potentialHeight;
            newY = resizeStartRef.current.posY + dy;
          }
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    },
    [isDragging, isResizing, size.width, size.height]
  );

  // Touch move handler for drag and pinch-to-resize
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - dragStartRef.current.x;
        const dy = touch.clientY - dragStartRef.current.y;
        setPosition({
          x: dragStartRef.current.posX + dx,
          y: dragStartRef.current.posY + dy,
        });
      } else if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / pinchStartRef.current.distance;
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.round(pinchStartRef.current.width * scale)
        );
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.round(pinchStartRef.current.height * scale)
        );
        setSize({ width: newWidth, height: newHeight });
      } else if (isResizing && e.touches.length === 1) {
        // Handle touch resize with edge/corner handles
        const touch = e.touches[0];
        const dx = touch.clientX - resizeStartRef.current.x;
        const dy = touch.clientY - resizeStartRef.current.y;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;
        let newX = resizeStartRef.current.posX;
        let newY = resizeStartRef.current.posY;

        if (isResizing.includes("e")) {
          newWidth = Math.max(MIN_WIDTH, resizeStartRef.current.width + dx);
        }
        if (isResizing.includes("w")) {
          const potentialWidth = resizeStartRef.current.width - dx;
          if (potentialWidth >= MIN_WIDTH) {
            newWidth = potentialWidth;
            newX = resizeStartRef.current.posX + dx;
          }
        }
        if (isResizing.includes("s")) {
          newHeight = Math.max(MIN_HEIGHT, resizeStartRef.current.height + dy);
        }
        if (isResizing.includes("n")) {
          const potentialHeight = resizeStartRef.current.height - dy;
          if (potentialHeight >= MIN_HEIGHT) {
            newHeight = potentialHeight;
            newY = resizeStartRef.current.posY + dy;
          }
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    },
    [isDragging, isPinching, isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
    setIsPinching(false);
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(direction);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
        posX: position.x,
        posY: position.y,
      };
    },
    [size, position]
  );

  // Touch resize start handler
  const handleTouchResizeStart = useCallback(
    (e: React.TouchEvent, direction: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setIsResizing(direction);
        resizeStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          width: size.width,
          height: size.height,
          posX: position.x,
          posY: position.y,
        };
      }
    },
    [size, position]
  );

  useEffect(() => {
    if (isDragging || isResizing || isPinching) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
      window.addEventListener("touchcancel", handleTouchEnd);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchcancel", handleTouchEnd);
      };
    }
  }, [
    isDragging,
    isResizing,
    isPinching,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);
  // #endregion

  // #region Animation loop with real or simulated audio data
  // Demo audio data (simulated)
  const audioDataRef = useRef<number[]>(new Array(64).fill(0));
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flag to track if animation should continue running
    // This is critical for async animate functions - cancelAnimationFrame alone
    // won't stop frames scheduled after an await completes
    let isRunning = true;

    const animate = async () => {
      if (stop || !isRunning) return;

      timeRef.current += 0.02;

      // Try to get real audio data, fall back to simulated
      let data: number[];

      if (isAudioCaptureActive()) {
        // Use real audio data from connected sources
        data = getNormalizedFrequencyData();
      } else {
        // Generate demo audio data with smooth movement (fallback)
        for (let i = 0; i < audioDataRef.current.length; i++) {
          const noise =
            Math.sin(timeRef.current * 2 + i * 0.3) * 0.3 +
            Math.sin(timeRef.current * 3.5 + i * 0.5) * 0.2 +
            Math.sin(timeRef.current * 1.2 + i * 0.7) * 0.25;
          const base = 0.3 + noise * 0.5;
          audioDataRef.current[i] = Math.max(
            0,
            Math.min(1, base + Math.random() * 0.1)
          );
        }
        data = audioDataRef.current;
      }

      const barCount = data.length;

      // Get frequency band energies for precise audio-reactive effects
      // Each band value includes beat detection and is enhanced when beats occur
      const frequencyBands = isAudioCaptureActive()
        ? getFrequencyBands()
        : {
            bass: Math.sin(timeRef.current * 1.25) * 0.3 + 0.4,
            mid: Math.sin(timeRef.current * 1.3) * 0.25 + 0.35,
            high: Math.sin(timeRef.current * 1.4) * 0.2 + 0.3,
          };

      let _ctx = ctx,
        _canvas = canvas;

      if (pipCanvasRef.current) {
        const pipCtx = pipCanvasRef.current.getContext("2d");
        if (pipCtx) {
          _ctx = pipCtx;
          _canvas = pipCanvasRef.current;
        }
      }

      // Clear canvas
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

      await render({
        ctx: _ctx,
        canvas: _canvas,
        data,
        barCount,
        performanceMode: performanceModeRef.current,
        logoImage: logoImageRef.current,
        bass: frequencyBands.bass,
        mid: frequencyBands.mid,
        high: frequencyBands.high,
        mode,
      });

      // Check if we should stop after the async render completes
      // This prevents orphaned animation loops when cleanup runs during render
      if (!isRunning) return;

      // Draw FPS counter on main canvas
      if (showFpsRef.current) {
        _ctx.save();
        _ctx.font = "bold 12px monospace";
        _ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        _ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        _ctx.shadowBlur = 4;
        _ctx.fillText(`${fpsRef.current} FPS`, 10, 20);
        _ctx.restore();

        // Calculate FPS
        frameCountRef.current++;
        const now = performance.now();
        const elapsed = now - lastFpsUpdateRef.current;
        if (elapsed >= 500) {
          fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
          frameCountRef.current = 0;
          lastFpsUpdateRef.current = now;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Set flag to stop the animation loop
      // This ensures any in-flight async animate() calls will exit
      isRunning = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, [mode, stop]);
  // #endregion

  const renderSettings = () => (
    <div
      className="absolute top-10 left-0 right-0 z-20 p-3 mx-2 rounded-lg"
      style={{
        background: "rgba(15, 15, 30, 0.7)",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        maxHeight: size.height - 50,
        overflowY: "auto",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="space-y-3">
        {/* Performance Mode Toggle */}
        <button
          onClick={() => setPerformanceMode(!performanceMode)}
          className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            performanceMode
              ? "text-green-400 bg-green-500/20 hover:bg-green-500/30"
              : "text-white/80 bg-white/10 hover:bg-white/20"
          }`}
          title="Performance mode reduces visual effects for better framerate on low-end devices"
        >
          <Zap size={14} />
          Performance Mode {performanceMode ? "ON" : "OFF"}
        </button>

        {/* Show FPS Toggle */}
        <button
          onClick={() => setShowFps(!showFps)}
          className={`w-full px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            showFps
              ? "text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30"
              : "text-white/80 bg-white/10 hover:bg-white/20"
          }`}
          title="Show FPS counter on the visualizer"
        >
          Show FPS {showFps ? "ON" : "OFF"}
        </button>

        {/* Audio Config Collapsible Section */}
        <div className="border-t border-white/10 pt-2">
          <button
            onClick={() => setAudioConfigExpanded(!audioConfigExpanded)}
            className="w-full px-3 py-2 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Settings size={14} />
              Audio Config
            </span>
            {audioConfigExpanded ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>

          {audioConfigExpanded && (
            <div className="mt-2 space-y-3 p-2 bg-white/5 rounded-md">
              {/* Reset Button */}
              <button
                onClick={handleResetConfig}
                className="w-full px-3 py-1.5 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                title="Reset to defaults"
              >
                <RotateCcw size={14} />
                Reset to Defaults
              </button>

              {/* FFT Size - must be power of 2 */}
              <div>
                <label className="flex justify-between text-xs text-white/70 mb-1">
                  <span>FFT Size</span>
                </label>
                <select
                  value={config.fftSize}
                  onChange={(e) =>
                    handleConfigChange("fftSize", parseInt(e.target.value))
                  }
                  className="w-full px-2 py-1 text-xs bg-white/10 text-white/90 rounded-md border border-white/20 cursor-pointer focus:outline-none focus:border-purple-500"
                >
                  {[
                    32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
                  ].map((val) => (
                    <option key={val} value={val} className="bg-gray-900">
                      {val}
                    </option>
                  ))}
                </select>
              </div>

              {/* Smoothing Time */}
              <div>
                <label className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Smoothing</span>
                  <span className="text-purple-400">
                    {config.smoothingTimeConstant.toFixed(2)}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.99"
                  step="0.01"
                  value={config.smoothingTimeConstant}
                  onChange={(e) =>
                    handleConfigChange(
                      "smoothingTimeConstant",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Min Decibels */}
              <div>
                <label className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Min dB</span>
                  <span className="text-purple-400">{config.minDecibels}</span>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="-30"
                  step="1"
                  value={config.minDecibels}
                  onChange={(e) =>
                    handleConfigChange("minDecibels", parseInt(e.target.value))
                  }
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Max Decibels */}
              <div>
                <label className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Max dB</span>
                  <span className="text-purple-400">{config.maxDecibels}</span>
                </label>
                <input
                  type="range"
                  min="-50"
                  max="0"
                  step="1"
                  value={config.maxDecibels}
                  onChange={(e) =>
                    handleConfigChange("maxDecibels", parseInt(e.target.value))
                  }
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Freq Start Index */}
              <div>
                <label className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Freq Start</span>
                  <span className="text-purple-400">
                    {config.freqStartIndex}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1024"
                  step="1"
                  value={config.freqStartIndex}
                  onChange={(e) =>
                    handleConfigChange(
                      "freqStartIndex",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Freq Length */}
              <div>
                <label className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Freq Count</span>
                  <span className="text-purple-400">{config.freqLength}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="1024"
                  step="1"
                  value={config.freqLength}
                  onChange={(e) =>
                    handleConfigChange("freqLength", parseInt(e.target.value))
                  }
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Logo Upload for Trap Nation */}
              <div className="pt-2 border-t border-white/10">
                <label className="flex justify-between text-xs text-white/70 mb-2">
                  <span>Center Logo (Trap Nation)</span>
                </label>
                {logoDataUrl ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={logoDataUrl}
                      alt="Logo preview"
                      className="w-12 h-12 object-contain rounded bg-white/10"
                    />
                    <button
                      onClick={handleLogoRemove}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="w-full px-3 py-2 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2">
                    <Upload size={14} />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Filter modes based on search query
  const filteredModes = MODES.filter((m) =>
    m.toLowerCase().includes(modeSearch.toLowerCase())
  );

  // Split modes into Canvas and WebGL categories
  const canvasModes = filteredModes.filter((m) => !m.includes("(WebGL)"));
  const webglModes = filteredModes.filter((m) => m.includes("(WebGL)"));

  const renderModeButton = (m: (typeof MODES)[number]) => (
    <button
      key={m}
      onClick={() => {
        setMode(m);
        // setShowModePanel(false);
        // setModeSearch("");
      }}
      className={`px-2 py-2 text-xs font-medium rounded-md transition-all cursor-pointer truncate ${
        mode === m
          ? "text-purple-400 bg-purple-500/30 border border-purple-500/50"
          : "text-white/80 bg-white/10 hover:bg-white/20 border border-transparent"
      }`}
      title={m}
    >
      {m.replace(" (WebGL)", "")}
    </button>
  );

  const renderModePanel = () => (
    <div
      className="absolute top-10 left-0 right-0 z-20 p-3 mx-2 rounded-lg"
      style={{
        background: "rgba(15, 15, 30, 0.9)",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        maxHeight: size.height - 50,
        overflowY: "auto",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Search Input */}
      <div className="relative mb-3">
        <Search
          size={14}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50"
        />
        <input
          type="text"
          placeholder="Search modes..."
          value={modeSearch}
          onChange={(e) => setModeSearch(e.target.value)}
          className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 text-white/90 rounded-md border border-white/20 focus:outline-none focus:border-purple-500 placeholder:text-white/40"
          autoFocus={!isMobile}
        />
      </div>

      {/* Canvas Effects Section */}
      {canvasModes.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-3 mb-2">
            <div className="h-px flex-1 bg-white/20"></div>
            <span className="text-xs text-white/50 font-medium">Simple</span>
            <div className="h-px flex-1 bg-white/20"></div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {canvasModes.map(renderModeButton)}
          </div>
        </>
      )}

      {/* WebGL Effects Section */}
      {webglModes.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-3 mb-2">
            <div className="h-px flex-1 bg-white/20"></div>
            <span className="text-xs text-white/50 font-medium">WebGL</span>
            <div className="h-px flex-1 bg-white/20"></div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {webglModes.map(renderModeButton)}
          </div>
        </>
      )}

      {filteredModes.length === 0 && (
        <div className="text-center text-white/50 text-xs py-4">
          No modes found
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`select-none fixed ${isCenterMode ? "" : "cursor-move"}`}
      style={
        isCenterMode
          ? {
              // Center mode: fixed position, centered on screen
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: size.width,
              height: size.height,
              zIndex: 50,
            }
          : {
              // Window mode: fixed position, draggable
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
              zIndex: 40,
            }
      }
      onMouseDown={isCenterMode ? undefined : handleDragStart}
      onTouchStart={isCenterMode ? undefined : handleTouchDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main visualizer container */}
      <div
        className={`relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 ${
          isCenterMode && !isHovered && activePanel === "none"
            ? ""
            : "backdrop-blur-md"
        }`}
        style={{
          background:
            isCenterMode && !isHovered && activePanel === "none"
              ? "transparent"
              : "linear-gradient(135deg, rgba(15, 15, 30, 0.85), rgba(30, 20, 50, 0.85))",
          border:
            isCenterMode && !isHovered && activePanel === "none"
              ? "1px solid transparent"
              : "1px solid rgba(168, 85, 247, 0.3)",
          boxShadow:
            isCenterMode && !isHovered && activePanel === "none"
              ? "none"
              : "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(168, 85, 247, 0.1)",
        }}
      >
        {/* Header - in center mode, hide toolbar buttons unless hovered */}
        <div
          className={`absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10 transition-opacity duration-300 ${
            isCenterMode && !isHovered && activePanel === "none"
              ? "opacity-0"
              : ""
          }`}
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.4), transparent)",
            opacity: isHovered || activePanel !== "none" ? 1 : 0,
          }}
        >
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
            {/* Visualizer */}
          </span>

          <div className="flex items-center gap-1">
            {/* Mode Panel Button */}
            <button
              onClick={() => {
                setActivePanel((prev) => (prev === "mode" ? "none" : "mode"));
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activePanel === "mode"
                  ? "text-purple-400 bg-purple-500/20 hover:bg-purple-500/30"
                  : "text-white/80 bg-white/10 hover:bg-white/20"
              }`}
              title="Select visualizer mode"
            >
              <Sparkle size={12} />
              <span className="max-w-[80px] truncate">{mode}</span>
            </button>

            {/* Audio Source Button */}
            <button
              onClick={handleAudioPanelToggle}
              className={`p-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                isCapturing
                  ? "text-green-400 bg-green-500/20 hover:bg-green-500/30"
                  : activePanel === "audio"
                  ? "text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30"
                  : "text-white/80 bg-white/10 hover:bg-white/20"
              }`}
              title={
                isCapturing
                  ? `Audio: ${audioSourceType}`
                  : "Select audio source"
              }
            >
              {audioSourceType === "mic" && <Mic size={14} />}
              {audioSourceType === "tab" && <Monitor size={14} />}
              {audioSourceType === "file" && <FileAudio size={14} />}
              {audioSourceType === "none" && <Mic size={14} />}
            </button>
            {/* Settings Button */}
            <button
              onClick={handleSettingsClick}
              onMouseDown={(e) => e.stopPropagation()}
              className={`p-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activePanel === "settings"
                  ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                  : "text-white/80 bg-white/10 hover:bg-white/20"
              }`}
              title="Audio analyzer settings"
            >
              <Settings size={14} />
            </button>
            {/* PiP Button - hidden on mobile as Document PiP is not supported */}
            {!isInPiP && !isMobile && (
              <button
                onClick={handlePiPClick}
                className={`p-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  _isPiPVis
                    ? "text-purple-400 bg-purple-500/20 hover:bg-purple-500/30"
                    : "text-white/80 bg-white/10 hover:bg-white/20"
                }`}
                title={_isPiPVis ? "Close PiP" : "Open in PiP"}
              >
                <PictureInPicture2 size={14} />
              </button>
            )}
            {/* Display Mode Toggle Button */}
            {setVisualizerMode && !forceCenter && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (visualizerMode === "center") {
                    // When switching to window mode, center it on screen
                    const centerX = (window.innerWidth - size.width) / 2;
                    const centerY = (window.innerHeight - size.height) / 2;
                    setPosition({ x: centerX, y: centerY });
                  }
                  setVisualizerMode(
                    visualizerMode === "center" ? "window" : "center"
                  );
                }}
                className={`p-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  visualizerMode === "center"
                    ? "text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30"
                    : "text-white/80 bg-white/10 hover:bg-white/20"
                }`}
                title={
                  visualizerMode === "center"
                    ? "Switch to window mode"
                    : "Switch to center mode"
                }
              >
                {visualizerMode === "center" ? (
                  <Move size={14} />
                ) : (
                  <Maximize size={14} />
                )}
              </button>
            )}
            {/* Close Button */}
            <button
              onClick={handleCloseClick}
              className="p-1.5 text-xs font-medium text-white/80 bg-white/10 hover:bg-red-500/30 hover:text-red-400 rounded-md transition-colors cursor-pointer"
              title="Close visualizer"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Settings Panel - stay mounted once visited */}
        <div className={activePanel === "settings" ? "" : "hidden"}>
          {visitedPanels.has("settings") && renderSettings()}
        </div>

        {/* Audio Source Panel */}
        {activePanel === "audio" && (
          <div
            className="absolute top-10 left-0 right-0 z-20 p-3 mx-2 rounded-lg"
            style={{
              background: "rgba(15, 15, 30, 0.9)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <div className="text-xs text-white/60 font-medium mb-2">
                Select Audio Source
              </div>

              {/* Current Source Status */}
              {isCapturing && (
                <div className="flex items-center justify-between p-2 rounded-md bg-green-500/20 border border-green-500/30">
                  <span className="text-xs text-green-400 flex items-center gap-2">
                    {audioSourceType === "mic" && <Mic size={14} />}
                    {audioSourceType === "tab" && <Monitor size={14} />}
                    {audioSourceType === "file" && <FileAudio size={14} />}
                    {audioSourceType === "tab" && "Tab Audio"}
                    {audioSourceType === "mic" && "Microphone"}
                    {audioSourceType === "file" && "Audio File"}
                  </span>
                  <button
                    onClick={handleStopCapture}
                    className="px-2 py-1 text-xs text-red-400 bg-red-500/20 hover:bg-red-500/30 rounded-md transition-colors flex items-center gap-1"
                  >
                    <StopCircle size={12} />
                    Stop
                  </button>
                </div>
              )}

              {/* Tab Audio Option - Desktop only */}
              {!isMobile && !isCapturing && (
                <button
                  onClick={handleTabCapture}
                  className="w-full px-3 py-2 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-md transition-colors flex items-center gap-2"
                >
                  <Monitor size={14} />
                  Capture Tab Audio
                </button>
              )}

              {/* Microphone Option */}
              {!isCapturing && (
                <button
                  onClick={handleMicCapture}
                  className="w-full px-3 py-2 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-md transition-colors flex items-center gap-2"
                >
                  <Mic size={14} />
                  Use Microphone
                </button>
              )}

              {/* File Upload Option */}
              {!isCapturing && (
                <label className="w-full px-3 py-2 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-md transition-colors flex items-center gap-2 cursor-pointer">
                  <FileAudio size={14} />
                  Upload Audio/Video File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* Info text */}
              {!isCapturing && (
                <p className="text-xs text-white/40 mt-2">
                  {isMobile
                    ? "Tab audio capture is not available on mobile devices."
                    : "Choose how you want to provide audio for the visualizer."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mode Panel - stay mounted once visited */}
        <div className={activePanel === "mode" ? "" : "hidden"}>
          {visitedPanels.has("mode") && renderModePanel()}
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={size.width}
          height={size.height}
          className="w-full h-full"
        />

        {/* Resize handles */}
        <>
          {/* Corners */}
          <div
            className="resize-handle absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
            onTouchStart={(e) => handleTouchResizeStart(e, "nw")}
          />
          <div
            className="resize-handle absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
            onTouchStart={(e) => handleTouchResizeStart(e, "ne")}
          />
          <div
            className="resize-handle absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
            onTouchStart={(e) => handleTouchResizeStart(e, "sw")}
          />
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, "se")}
            onTouchStart={(e) => handleTouchResizeStart(e, "se")}
          />
          {/* Edges */}
          <div
            className="resize-handle absolute top-0 left-4 right-4 h-2 cursor-n-resize"
            onMouseDown={(e) => handleResizeStart(e, "n")}
            onTouchStart={(e) => handleTouchResizeStart(e, "n")}
          />
          <div
            className="resize-handle absolute bottom-0 left-4 right-4 h-2 cursor-s-resize"
            onMouseDown={(e) => handleResizeStart(e, "s")}
            onTouchStart={(e) => handleTouchResizeStart(e, "s")}
          />
          <div
            className="resize-handle absolute left-0 top-4 bottom-4 w-2 cursor-w-resize"
            onMouseDown={(e) => handleResizeStart(e, "w")}
            onTouchStart={(e) => handleTouchResizeStart(e, "w")}
          />
          <div
            className="resize-handle absolute right-0 top-4 bottom-4 w-2 cursor-e-resize"
            onMouseDown={(e) => handleResizeStart(e, "e")}
            onTouchStart={(e) => handleTouchResizeStart(e, "e")}
          />
        </>
      </div>
    </div>
  );
}
