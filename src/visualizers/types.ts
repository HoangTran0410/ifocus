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
  /** Beat intensity from detectBeat() (0-1, with decay) */
  beatIntensity?: number;
  /** Bass frequency energy (0-1, ~20-250Hz) - best for kick drums */
  bass?: number;
  /** Mid frequency energy (0-1, ~250-2000Hz) - best for vocals, synths */
  mid?: number;
  /** High frequency energy (0-1, ~2000-16000Hz) - best for hi-hats, cymbals */
  high?: number;

  mode?: string;
}
