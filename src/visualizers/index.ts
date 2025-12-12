import { cleanup, renderShaderCode } from "./shader/renderer";
import type { VisualizeFnProps } from "./types";

const RenderMode: Record<
  string,
  () => Promise<{ default: string | VisualizerRenderFn }>
> = {
  // simple
  "🔧 (Test)": () => import("./simple/FrequencyBands"),
  "📊 Bars": () => import("./simple/Bars"),
  "🌊 Wave": () => import("./simple/Wave"),
  "🟣 Circular": () => import("./simple/Circular"),
  "🔊 TrapNation": () => import("./simple/TrapNation"),
  "🌈 Spectrum": () => import("./simple/Spectrum"),
  "✨ Particles": () => import("./simple/Particles"),
  "🧬 DnaHelix": () => import("./simple/DnaHelix"),
  "〰️ Oscilloscope": () => import("./simple/Oscilloscope"),
  "🔆 RadialLines": () => import("./simple/RadialLines"),
  "🌌 Galaxy": () => import("./simple/Galaxy"),
  "⚫ BlackHole": () => import("./simple/BlackHole"),
  "💻 Matrix": () => import("./simple/Matrix"),
  "🎆 Fireworks": () => import("./simple/Fireworks"),
  "🌠 Aurora": () => import("./simple/Aurora"),
  "💍 Rings": () => import("./simple/Rings"),
  "📈 Waveform3D": () => import("./simple/Waveform3D"),
  "⭐ Starfield": () => import("./simple/Starfield"),
  "⚛️ Plasma": () => import("./simple/Plasma"),
  "⚡ Lightning": () => import("./simple/Lightning"),
  "🐝 Hexagons": () => import("./simple/Hexagons"),
  "🌿 Fractal": () => import("./simple/Fractal"),

  // webgl
  "💧 Fluid (WebGL)": () => import("./shader/WebGL_Fluid"),
  "🕳️ BlackHole (WebGL)": () => import("./shader/WebGL_BlackHole"),
  "🌀 Accretion (WebGL)": () => import("./shader/WebGL_Accretion"),
  "⚡ Lightning (WebGL)": () => import("./shader/WebGL_Lightning"),
  "🌅 Sunset (WebGL)": () => import("./shader/WebGL_Sunset"),
  "🎲 HoloDice (WebGL)": () => import("./shader/WebGL_HoloDice"),
  "📦 Cube (WebGL)": () => import("./shader/WebGL_Cube"),
  "☁️ Clouds (WebGL)": () => import("./shader/WebGL_Clouds"),
  "🌌 Universe (WebGL)": () => import("./shader/WebGL_Universe"),
  "✨ Kuko (WebGL)": () => import("./shader/WebGL_Kuko"),
  "🧵 Fiber (WebGL)": () => import("./shader/WebGL_Fiber"),
  "⚡ Zippy (WebGL)": () => import("./shader/WebGL_Zippy"),
  "🎨 Art (WebGL)": () => import("./shader/WebGL_Art"),
  "🌟 StarNest (WebGL)": () => import("./shader/WebGL_StarNest"),
  "🏞️ Landscape (WebGL)": () => import("./shader/WebGL_Landscape"),
  "🔥 Fire (WebGL)": () => import("./shader/WebGL_Fire"),
  "💎 Fragment (WebGL)": () => import("./shader/WebGL_Fragment"),
  "🪐 Orbital (WebGL)": () => import("./shader/WebGL_Orbital"),
  "🎨 Palettes (WebGL)": () => import("./shader/WebGL_Palettes"),
  "🍩 Torus (WebGL)": () => import("./shader/WebGL_Torus"),
  "🐳 Aqua (WebGL)": () => import("./shader/WebGL_Aqua"),
  "🔺 Fractal (WebGL)": () => import("./shader/WebGL_FractalPyramid"),
  "🧊 4D (WebGL)": () => import("./shader/WebGL_4D"),
  "🔮 Sphere (WebGL)": () => import("./shader/WebGL_Sphere"),
  "💚 Matrix (WebGL)": () => import("./shader/WebGL_Matrix"),
  "🌈 Spectrum (WebGL)": () => import("./shader/WebGL_Spectrum"),
  "🔥 Flame (WebGL)": () => import("./shader/WebGL_Flame"),
  "🌀 Portal (WebGL)": () => import("./shader/WebGL_Portal"),
  "⚛️ Plasma (WebGL)": () => import("./shader/WebGL_Plasma"),
  "🚗 Drive (WebGL)": () => import("./shader/WebGL_Drive"),
  "🌈 Rainbow (WebGL)": () => import("./shader/WebGL_Rainbow"),
  "✡️ Octagram (WebGL)": () => import("./shader/WebGL_Octagram"),
};
export type VisualizerMode = keyof typeof RenderMode;
export const MODES = Object.keys(RenderMode) as VisualizerMode[];
export const DEFAULT_MODE = MODES[1];

export type VisualizerRenderFn = (props: VisualizeFnProps) => void;
export type VisualizerCleanupFn = () => void;

// Cache for loaded render functions to avoid re-importing every frame
const renderFnCache = new Map<VisualizerMode, VisualizerRenderFn>();

// Track the previous mode to detect mode changes
let previousMode: VisualizerMode | null = null;

export async function render(props: VisualizeFnProps) {
  const mode = props?.mode as VisualizerMode;

  // Detect mode change and cleanup previous WebGL visualizer
  if (previousMode !== null && previousMode !== mode) {
    cleanup(previousMode);
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

    cachedRenderFn =
      typeof module.default === "string"
        ? createShaderRenderFn(module.default)
        : module.default;

    renderFnCache.set(mode, cachedRenderFn);
  }

  // Call the cached render function synchronously
  cachedRenderFn(props);
}

function createShaderRenderFn(shaderCode: string): VisualizerRenderFn {
  return (props) => renderShaderCode(props, shaderCode);
}

/**
 * Cleanup function to be called when the visualizer is unmounted
 * Releases all WebGL contexts
 */
export function cleanupAllVisualizers(): void {
  cleanup(0);
}
