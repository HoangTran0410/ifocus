import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

type VisualizerMode = "bars" | "wave" | "circular";

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const MODES: VisualizerMode[] = ["bars", "wave", "circular"];
const MODE_LABELS: Record<VisualizerMode, string> = {
  bars: "Bars",
  wave: "Wave",
  circular: "Circular",
};

const MIN_WIDTH = 200;
const MIN_HEIGHT = 120;
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 200;

export const Visualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // Persisted state using useLocalStorage
  const [mode, setMode] = useLocalStorage<VisualizerMode>(
    "zen_visualizer_mode",
    "bars"
  );
  const [position, setPosition] = useLocalStorage<Position>(
    "zen_visualizer_position",
    { x: 50, y: 50 }
  );
  const [size, setSize] = useLocalStorage<Size>("zen_visualizer_size", {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

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

  // Demo audio data (simulated)
  const audioDataRef = useRef<number[]>(new Array(64).fill(0));
  const timeRef = useRef(0);

  // Cycle mode on click
  const handleModeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const currentIndex = MODES.indexOf(mode);
      const nextMode = MODES[(currentIndex + 1) % MODES.length];
      setMode(nextMode);
    },
    [mode, setMode]
  );

  // PiP state
  const [isPiP, setIsPiP] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
        setIsPiP(false);
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
          setIsPiP(false);
        });

        setIsPiP(true);
      } catch (error) {
        console.error("PiP error:", error);
        alert(
          "Failed to activate Picture-in-Picture mode. Error: " +
            (error as Error).message
        );
        setIsPiP(false);
      }
    },
    [size]
  );

  // Cleanup PiP window on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  // Drag handlers
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
          x: Math.max(
            0,
            Math.min(
              window.innerWidth - size.width,
              dragStartRef.current.posX + dx
            )
          ),
          y: Math.max(
            0,
            Math.min(
              window.innerHeight - size.height,
              dragStartRef.current.posY + dy
            )
          ),
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

  // Animation loop with simulated audio data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 0.02;

      // Generate demo audio data with smooth movement
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

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const data = audioDataRef.current;
      const barCount = data.length;

      if (mode === "bars") {
        renderBars(ctx, canvas, data, barCount);
      } else if (mode === "wave") {
        renderWave(ctx, canvas, data, barCount);
      } else if (mode === "circular") {
        renderCircular(ctx, canvas, data, barCount);
      }

      // Also render to PiP canvas if active
      if (pipCanvasRef.current) {
        const pipCtx = pipCanvasRef.current.getContext("2d");
        if (pipCtx) {
          pipCtx.clearRect(
            0,
            0,
            pipCanvasRef.current.width,
            pipCanvasRef.current.height
          );
          if (mode === "bars") {
            renderBars(pipCtx, pipCanvasRef.current, data, barCount);
          } else if (mode === "wave") {
            renderWave(pipCtx, pipCanvasRef.current, data, barCount);
          } else if (mode === "circular") {
            renderCircular(pipCtx, pipCanvasRef.current, data, barCount);
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [mode, size, isPiP]);

  const renderBars = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    data: number[],
    barCount: number
  ) => {
    const barWidth = canvas.width / barCount;
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.8)");
    gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.8)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.8)");

    ctx.fillStyle = gradient;

    for (let i = 0; i < barCount; i++) {
      const barHeight = data[i] * canvas.height * 0.9;
      const x = i * barWidth;
      const y = canvas.height - barHeight;

      // Round top corners
      ctx.beginPath();
      ctx.roundRect(x + 1, y, barWidth - 2, barHeight, [4, 4, 0, 0]);
      ctx.fill();
    }
  };

  const renderWave = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    data: number[],
    barCount: number
  ) => {
    const sliceWidth = canvas.width / (barCount - 1);
    const centerY = canvas.height / 2;

    // Draw filled wave
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.6)");
    gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.6)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.6)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < barCount; i++) {
      const x = i * sliceWidth;
      const amplitude = data[i] * canvas.height * 0.4;
      const y = centerY - amplitude;

      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = (i - 1) * sliceWidth;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(
          prevX,
          centerY - data[i - 1] * canvas.height * 0.4,
          cpX,
          (centerY - data[i - 1] * canvas.height * 0.4 + y) / 2
        );
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }

    // Bottom wave (mirror)
    for (let i = barCount - 1; i >= 0; i--) {
      const x = i * sliceWidth;
      const amplitude = data[i] * canvas.height * 0.4;
      const y = centerY + amplitude;

      if (i === barCount - 1) {
        ctx.lineTo(x, y);
      } else {
        const nextX = (i + 1) * sliceWidth;
        const cpX = (nextX + x) / 2;
        ctx.quadraticCurveTo(
          nextX,
          centerY + data[i + 1] * canvas.height * 0.4,
          cpX,
          (centerY + data[i + 1] * canvas.height * 0.4 + y) / 2
        );
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }

    ctx.closePath();
    ctx.fill();

    // Draw stroke
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < barCount; i++) {
      const x = i * sliceWidth;
      const amplitude = data[i] * canvas.height * 0.4;
      const y = centerY - amplitude;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const renderCircular = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    data: number[],
    barCount: number
  ) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.4;
    const maxBarHeight = Math.min(centerX, centerY) * 0.5;

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius,
      centerX,
      centerY,
      radius + maxBarHeight
    );
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.8)");
    gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.8)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.8)");

    ctx.fillStyle = gradient;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const barHeight = data[i] * maxBarHeight;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = gradient;
      ctx.stroke();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15, 15, 25, 0.8)";
    ctx.fill();
    ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  return (
    <div
      ref={containerRef}
      className="fixed cursor-move select-none"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 9999,
      }}
      onMouseDown={handleDragStart}
    >
      {/* Main visualizer container */}
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden backdrop-blur-md"
        style={{
          background:
            "linear-gradient(135deg, rgba(15, 15, 30, 0.85), rgba(30, 20, 50, 0.85))",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(168, 85, 247, 0.1)",
        }}
      >
        {/* Header */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.4), transparent)",
          }}
        >
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
            Visualizer
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePiPClick}
              className={`p-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                isPiP
                  ? "text-purple-400 bg-purple-500/20 hover:bg-purple-500/30"
                  : "text-white/80 bg-white/10 hover:bg-white/20"
              }`}
              title={isPiP ? "Close PiP" : "Open in PiP"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <rect x="12" y="12" width="9" height="9" rx="1" />
              </svg>
            </button>
            <button
              onClick={handleModeClick}
              className="px-2 py-1 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
            >
              {MODE_LABELS[mode]}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={size.width}
          height={size.height}
          className="w-full h-full"
        />

        {/* Resize handles */}
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
      </div>
    </div>
  );
};
