import type { VisualizeFnProps } from "./shared";

export type VisualizerRenderFn = (props: VisualizeFnProps) => void;
export type VisualizerCleanupFn = () => void;

const RenderMode = {
  "🔧 (Test)": () => import("./FrequencyBands"),
  "📊 Bars": () => import("./Bars"),
  "🌊 Wave": () => import("./Wave"),
  "🟣 Circular": () => import("./Circular"),
  "🔊 TrapNation": () => import("./TrapNation"),
  "🌈 Spectrum": () => import("./Spectrum"),
  "✨ Particles": () => import("./Particles"),
  "🧬 DnaHelix": () => import("./DnaHelix"),
  "〰️ Oscilloscope": () => import("./Oscilloscope"),
  "🔆 RadialLines": () => import("./RadialLines"),
  "🌌 Galaxy": () => import("./Galaxy"),
  "⚫ BlackHole": () => import("./BlackHole"),
  "💻 Matrix": () => import("./Matrix"),
  "🎆 Fireworks": () => import("./Fireworks"),
  "🌠 Aurora": () => import("./Aurora"),
  "💍 Rings": () => import("./Rings"),
  "📈 Waveform3D": () => import("./Waveform3D"),
  "⭐ Starfield": () => import("./Starfield"),
  "🌀 Plasma": () => import("./Plasma"),
  "⚡ Lightning": () => import("./Lightning"),
  "🐝 Hexagons": () => import("./Hexagons"),
  "🌿 Fractal": () => import("./Fractal"),
  "💧 Fluid (WebGL)": () => import("./WebGL_Fluid"),
  "🕳️ BlackHole (WebGL)": () => import("./WebGL_BlackHole"),
  "🌀 Accretion (WebGL)": () => import("./WebGL_Accretion"),
  "⚡ Lightning (WebGL)": () => import("./WebGL_Lightning"),
  "🌅 Sunset (WebGL)": () => import("./WebGL_Sunset"),
  "🎲 HoloDice (WebGL)": () => import("./WebGL_HoloDice"),
  "📦 Cube (WebGL)": () => import("./WebGL_Cube"),
  "☁️ Clouds (WebGL)": () => import("./WebGL_Clouds"),
  "🌌 Universe (WebGL)": () => import("./WebGL_Universe"),
  "✨ Kuko (WebGL)": () => import("./WebGL_Kuko"),
  "🧵 Fiber (WebGL)": () => import("./WebGL_Fiber"),
  "⚡ Zippy (WebGL)": () => import("./WebGL_Zippy"),
  "🎨 Art (WebGL)": () => import("./WebGL_Art"),
  "🌟 StarNest (WebGL)": () => import("./WebGL_StarNest"),
  "🏞️ Landscape (WebGL)": () => import("./WebGL_Landscape"),
  "🔥 Fire (WebGL)": () => import("./WebGL_Fire"),
  "💎 Fragment (WebGL)": () => import("./WebGL_Fragment"),
  "🪐 Orbital (WebGL)": () => import("./WebGL_Orbital"),
  "🎨 Palettes (WebGL)": () => import("./WebGL_Palettes"),
  "🍩 Torus (WebGL)": () => import("./WebGL_Torus"),
  "🔺 Fractal (WebGL)": () => import("./WebGL_FractalPyramid"),
  "🧊 4D (WebGL)": () => import("./WebGL_4D"),
};
export type VisualizerMode = keyof typeof RenderMode;
export const MODES = Object.keys(RenderMode) as VisualizerMode[];
export const DEFAULT_MODE = MODES[1];

// Cache for loaded render functions to avoid re-importing every frame
const renderFnCache = new Map<VisualizerMode, VisualizerRenderFn>();
// Cache for cleanup functions
const cleanupFnCache = new Map<VisualizerMode, VisualizerCleanupFn>();

// Track the previous mode to detect mode changes
let previousMode: VisualizerMode | null = null;

// Helper to check if a mode is WebGL-based
function isWebGLMode(mode: VisualizerMode): boolean {
  return mode.includes("(WebGL)");
}

export async function render(mode: VisualizerMode, props: VisualizeFnProps) {
  // Detect mode change and cleanup previous WebGL visualizer
  if (previousMode !== null && previousMode !== mode) {
    // Call cleanup function if available for the previous mode
    const cleanupFn = cleanupFnCache.get(previousMode);
    if (cleanupFn) {
      cleanupFn();
    }
  }
  previousMode = mode;

  // Check cache first
  let cachedRenderFn = renderFnCache.get(mode);

  if (!cachedRenderFn) {
    // Load and cache the render function
    const importFn = RenderMode[mode] || RenderMode[DEFAULT_MODE];
    const module = await importFn();
    if (!module.default) {
      throw new Error(`Invalid render function for mode: ${mode}`);
    }
    cachedRenderFn = module.default;
    renderFnCache.set(mode, cachedRenderFn);

    // Cache cleanup function if available
    const moduleWithCleanup = module as { cleanup?: VisualizerCleanupFn };
    if (moduleWithCleanup.cleanup) {
      cleanupFnCache.set(mode, moduleWithCleanup.cleanup);
    }
  }

  // Call the cached render function synchronously
  cachedRenderFn(props);
}

/**
 * Cleanup function to be called when the visualizer is unmounted
 * Releases all WebGL contexts
 */
export function cleanupAllVisualizers(): void {
  for (const cleanupFn of cleanupFnCache.values()) {
    cleanupFn();
  }
}
