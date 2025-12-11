import type { VisualizeFnProps } from "./shared";

export type VisualizerRenderFn = (props: VisualizeFnProps) => void;

const RenderMode = {
  Bars: () => import("./Bars"),
  Wave: () => import("./Wave"),
  Circular: () => import("./Circular"),
  TrapNation: () => import("./TrapNation"),
  Spectrum: () => import("./Spectrum"),
  Particles: () => import("./Particles"),
  DnaHelix: () => import("./DnaHelix"),
  Oscilloscope: () => import("./Oscilloscope"),
  RadialLines: () => import("./RadialLines"),
  Galaxy: () => import("./Galaxy"),
  BlackHole: () => import("./BlackHole"),
};

export type VisualizerMode = keyof typeof RenderMode;

export const MODES = Object.keys(RenderMode) as VisualizerMode[];

// Cache for loaded render functions to avoid re-importing every frame
const renderFnCache = new Map<VisualizerMode, VisualizerRenderFn>();

export async function render(mode: VisualizerMode, props: VisualizeFnProps) {
  // Check cache first
  let cachedRenderFn = renderFnCache.get(mode);

  if (!cachedRenderFn) {
    // Load and cache the render function
    const importFn = RenderMode[mode] || RenderMode.Bars;
    const module = await importFn();
    if (!module.default) {
      throw new Error(`Invalid render function for mode: ${mode}`);
    }
    cachedRenderFn = module.default;
    renderFnCache.set(mode, cachedRenderFn);
  }

  // Call the cached render function synchronously
  cachedRenderFn(props);
}
