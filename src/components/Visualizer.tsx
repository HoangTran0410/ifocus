import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  getNormalizedFrequencyData,
  isAudioCaptureActive,
  startAudioCapture,
  stopAudioCapture,
  getAnalyzerConfig,
  getDefaultAnalyzerConfig,
  updateAnalyzerConfig,
  AudioAnalyzerConfig,
  detectBeat,
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
} from "lucide-react";
import {
  useVisualizerMode as useVisualizerDisplayMode,
  useSetVisualizerMode as useSetVisualizerDisplayMode,
} from "../stores/useAppStore";
import { DEFAULT_MODE, MODES, render, VisualizerMode } from "../visualizers";
import { clearGradientCache, VisualizeFnProps } from "../visualizers/shared";

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

export default function Visualizer({
  onClose,
  isInPiP = false,
  forceCenter = false,
  stop = false,
}: VisualizerProps) {
  // Get visualizer display mode from Zustand
  const visualizerMode = useVisualizerDisplayMode();
  const setVisualizerMode = useSetVisualizerDisplayMode();

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

  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  // Mode panel state
  const [showModePanel, setShowModePanel] = useState(false);
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

  const performanceModeRef = useRef(performanceMode);
  useEffect(() => {
    performanceModeRef.current = performanceMode;
  }, [performanceMode]);

  useEffect(() => {
    if (!showModePanel) {
      setModeSearch("");
    }
  }, [showModePanel]);

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

  // Handle mode change from selector
  const handleModeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.stopPropagation();
      setMode(e.target.value as VisualizerMode);
    },
    [setMode]
  );

  // Handle close button click
  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.();
    },
    [onClose]
  );

  // Audio capture state - initialize with current capture status (persists across mode switches)
  const [isCapturing, setIsCapturing] = useState(() => isAudioCaptureActive());

  // Handle audio capture toggle
  const handleCaptureClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isCapturing) {
        stopAudioCapture();
        setIsCapturing(false);
      } else {
        const success = await startAudioCapture();
        setIsCapturing(success);
      }
    },
    [isCapturing]
  );

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
    setShowSettings((prev) => !prev);
    setShowModePanel(false);
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

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
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

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
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

    const animate = async () => {
      if (stop) return;

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

      // Get beat intensity for enhanced effects
      const beatIntensity = isAudioCaptureActive()
        ? detectBeat()
        : Math.sin(timeRef.current * 4) * 0.3 + 0.3;

      // Get frequency band energies for precise audio-reactive effects
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

      const visualizerProps: VisualizeFnProps = {
        ctx: _ctx,
        canvas: _canvas,
        data,
        barCount,
        performanceMode: performanceModeRef.current,
        logoImage: logoImageRef.current,
        beatIntensity,
        bass: frequencyBands.bass,
        mid: frequencyBands.mid,
        high: frequencyBands.high,
      };

      await render(mode, visualizerProps);

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
      cancelAnimationFrame(animationRef.current);
    };
  }, [mode, stop]);
  // #endregion

  const renderSettings = () => (
    <div
      className="absolute top-10 left-0 right-0 z-20 p-3 mx-2 rounded-lg"
      style={{
        background: "rgba(15, 15, 30, 0.45)",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        maxHeight: size.height - 50,
        overflowY: "auto",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="space-y-3">
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
            {[32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768].map(
              (val) => (
                <option key={val} value={val} className="bg-gray-900">
                  {val}
                </option>
              )
            )}
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
            <span className="text-purple-400">{config.freqStartIndex}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1024"
            step="1"
            value={config.freqStartIndex}
            onChange={(e) =>
              handleConfigChange("freqStartIndex", parseInt(e.target.value))
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

        {/* Performance Mode Toggle */}
        <div className="pt-2 border-t border-white/10">
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
            className={`w-full mt-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              showFps
                ? "text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30"
                : "text-white/80 bg-white/10 hover:bg-white/20"
            }`}
            title="Show FPS counter on the visualizer"
          >
            Show FPS {showFps ? "ON" : "OFF"}
          </button>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleResetConfig}
          className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
          title="Reset to defaults"
        >
          <RotateCcw size={14} />
          Reset to Defaults
        </button>
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
        background: "rgba(15, 15, 30, 0.45)",
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
          autoFocus
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main visualizer container */}
      <div
        className={`relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 ${
          isCenterMode && !isHovered && !showSettings && !showModePanel
            ? ""
            : "backdrop-blur-md"
        }`}
        style={{
          background:
            isCenterMode && !isHovered && !showSettings && !showModePanel
              ? "transparent"
              : "linear-gradient(135deg, rgba(15, 15, 30, 0.85), rgba(30, 20, 50, 0.85))",
          border:
            isCenterMode && !isHovered && !showSettings && !showModePanel
              ? "1px solid transparent"
              : "1px solid rgba(168, 85, 247, 0.3)",
          boxShadow:
            isCenterMode && !isHovered && !showSettings && !showModePanel
              ? "none"
              : "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(168, 85, 247, 0.1)",
        }}
      >
        {/* Header - in center mode, hide toolbar buttons unless hovered */}
        <div
          className={`absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10 transition-opacity duration-300 ${
            isCenterMode && !isHovered && !showSettings && !showModePanel
              ? "opacity-0"
              : ""
          }`}
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.4), transparent)",
            opacity: isHovered || showSettings || showModePanel ? 1 : 0,
          }}
        >
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
            Visualizer
          </span>
          <div className="flex items-center gap-1">
            {/* Audio Capture Button */}
            <button
              onClick={handleCaptureClick}
              className={`p-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                isCapturing
                  ? "text-green-400 bg-green-500/20 hover:bg-green-500/30"
                  : "text-white/80 bg-white/10 hover:bg-white/20"
              }`}
              title={isCapturing ? "Stop audio capture" : "Capture tab audio"}
            >
              <Mic size={14} />
            </button>
            {/* PiP Button */}
            {!isInPiP && (
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
            {/* Settings Button */}
            <button
              onClick={handleSettingsClick}
              className={`p-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                showSettings
                  ? "text-amber-400 bg-amber-500/20 hover:bg-amber-500/30"
                  : "text-white/80 bg-white/10 hover:bg-white/20"
              }`}
              title="Audio analyzer settings"
            >
              <Settings size={14} />
            </button>
            {/* Mode Panel Button */}
            <button
              onClick={() => {
                setShowModePanel(!showModePanel);
                setShowSettings(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                showModePanel
                  ? "text-purple-400 bg-purple-500/20 hover:bg-purple-500/30"
                  : "text-white/80 bg-white/10 hover:bg-white/20"
              }`}
              title="Select visualizer mode"
            >
              <Sparkle size={12} />
              <span className="max-w-[80px] truncate">{mode}</span>
            </button>
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

        {/* Settings Panel */}
        {showSettings && renderSettings()}

        {/* Mode Panel */}
        {showModePanel && renderModePanel()}

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
          />
          <div
            className="resize-handle absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="resize-handle absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
          {/* Edges */}
          <div
            className="resize-handle absolute top-0 left-4 right-4 h-2 cursor-n-resize"
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="resize-handle absolute bottom-0 left-4 right-4 h-2 cursor-s-resize"
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            className="resize-handle absolute left-0 top-4 bottom-4 w-2 cursor-w-resize"
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
          <div
            className="resize-handle absolute right-0 top-4 bottom-4 w-2 cursor-e-resize"
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
        </>
      </div>
    </div>
  );
}
