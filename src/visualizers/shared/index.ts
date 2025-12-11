export interface VisualizeFnProps {
  /** Canvas 2D rendering context */
  ctx: CanvasRenderingContext2D;
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** Normalized frequency data (0-1 values) */
  data: number[];
  /** Number of bars/data points to render */
  barCount: number;
  /** Enable performance mode for faster rendering */
  performanceMode?: boolean;
  /** Optional logo image for visualizers that support it (e.g., TrapNation) */
  logoImage?: HTMLImageElement | null;
}

// Gradient cache for performance optimization
export const gradientCache = new Map<string, CanvasGradient>();

// Clear gradient cache when canvas size changes
export const clearGradientCache = () => {
  gradientCache.clear();
};

export const getCachedGradient = (
  ctx: CanvasRenderingContext2D,
  key: string,
  createFn: () => CanvasGradient
): CanvasGradient => {
  if (!gradientCache.has(key)) {
    gradientCache.set(key, createFn());
  }
  return gradientCache.get(key)!;
};
