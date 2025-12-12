import { VisualizeFnProps } from "./shared";
import { FluidSimulation } from "./shader/fluid";
import { generateColor } from "./shader/utils";

// Persistent state across frames
const fluidState = {
  simulation: null as FluidSimulation | null,
  lastCanvas: null as HTMLCanvasElement | null,
  lastSize: { width: 0, height: 0 },
  lastTime: 0,
  performanceMode: false,
  // Audio-reactive splat positions - distributed around the canvas
  splatPoints: [] as Array<{
    x: number;
    y: number;
    angle: number;
    freqIndex: number;
  }>,
  lastSplatTime: 0,
  hue: 0,
};

// Initialize splat points around the canvas
function initSplatPoints() {
  const points = [];
  const numPoints = 12;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Distribute points in a ring pattern
    const radius = 0.3 + Math.random() * 0.15;
    points.push({
      x: 0.5 + Math.cos(angle) * radius,
      y: 0.5 + Math.sin(angle) * radius,
      angle: angle + Math.PI, // Point towards center
      freqIndex: Math.floor((i / numPoints) * 64), // Map to frequency bands
    });
  }

  return points;
}

export default function renderFluid({
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
  mid = 0,
}: VisualizeFnProps) {
  const now = performance.now();

  // Initialize or reinitialize simulation if needed
  if (
    !fluidState.simulation ||
    fluidState.lastCanvas !== canvas ||
    fluidState.lastSize.width !== canvas.width ||
    fluidState.lastSize.height !== canvas.height
  ) {
    // Cleanup old simulation
    if (fluidState.simulation) {
      fluidState.simulation.destroy();
    }

    // Create a hidden canvas for WebGL
    const webglCanvas = document.createElement("canvas");
    webglCanvas.width = canvas.width;
    webglCanvas.height = canvas.height;

    try {
      fluidState.simulation = new FluidSimulation(webglCanvas, performanceMode);

      // Initial splats to get things started
      fluidState.simulation.multipleSplats(Math.floor(Math.random() * 5) + 5);
    } catch (e) {
      console.error("Failed to create fluid simulation:", e);
      return;
    }

    fluidState.lastCanvas = canvas;
    fluidState.lastSize = { width: canvas.width, height: canvas.height };
    fluidState.performanceMode = performanceMode;
    fluidState.splatPoints = initSplatPoints();
    fluidState.lastTime = now;
  }

  // Update performance mode if changed
  if (fluidState.performanceMode !== performanceMode) {
    fluidState.simulation.setPerformanceMode(performanceMode);
    fluidState.performanceMode = performanceMode;
  }

  const simulation = fluidState.simulation;
  if (!simulation) return;

  // Calculate delta time (capped to avoid instability)
  const dt = Math.min((now - fluidState.lastTime) / 1000, 0.016666);
  fluidState.lastTime = now;

  // Shift hue over time for color variety
  fluidState.hue = (fluidState.hue + dt * 0.1) % 1;

  // Generate audio-reactive splats
  const timeSinceLastSplat = now - fluidState.lastSplatTime;
  const splatInterval = performanceMode ? 80 : 50; // ms between splat checks

  if (timeSinceLastSplat > splatInterval) {
    fluidState.lastSplatTime = now;

    // Calculate average intensity from audio data
    const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

    // Strong bass detection splats - create multiple random splats
    if (bass > 0.5) {
      const numSplats = Math.floor(bass * 5) + 2;
      for (let i = 0; i < numSplats; i++) {
        const x = Math.random();
        const y = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const force = 3000 + bass * 10000;
        const dx = Math.cos(angle) * force;
        const dy = Math.sin(angle) * force;

        // Vibrant color based on shifting hue
        const hue = (fluidState.hue + Math.random() * 0.3) % 1;
        const color = HSVtoRGB(hue, 1.0, 1.0);
        color.r *= 0.3 * bass;
        color.g *= 0.3 * bass;
        color.b *= 0.3 * bass;

        simulation.splat(x, y, dx, dy, color);
      }
    }

    // Frequency-band reactive splats
    for (const point of fluidState.splatPoints) {
      const freqValue = data[point.freqIndex] || 0;

      // Only splat if frequency band has significant energy
      if (freqValue > 0.35 + Math.random() * 0.2) {
        const force = 1500 + freqValue * 4000 + mid * 3000;
        const dx = Math.cos(point.angle) * force;
        const dy = Math.sin(point.angle) * force;

        // Color based on frequency position and shifting hue
        const hueOffset = point.freqIndex / 64; // Lower freq = different hue
        const hue = (fluidState.hue + hueOffset * 0.5) % 1;
        const color = HSVtoRGB(hue, 0.8 + freqValue * 0.2, 1.0);
        color.r *= 0.15 + freqValue * 0.2;
        color.g *= 0.15 + freqValue * 0.2;
        color.b *= 0.15 + freqValue * 0.2;

        simulation.splat(point.x, point.y, dx, dy, color);
      }
    }

    // Occasional random splats for ambient motion
    if (Math.random() < 0.1 + avgIntensity * 0.3) {
      const color = generateColor();
      color.r *= 5.0 + avgIntensity * 10;
      color.g *= 5.0 + avgIntensity * 10;
      color.b *= 5.0 + avgIntensity * 10;

      const x = 0.2 + Math.random() * 0.6;
      const y = 0.2 + Math.random() * 0.6;
      const angle = Math.random() * Math.PI * 2;
      const force = 500 + avgIntensity * 2000;

      simulation.splat(
        x,
        y,
        Math.cos(angle) * force,
        Math.sin(angle) * force,
        color
      );
    }
  }

  // Run simulation step
  simulation.step(dt);

  // Render to the WebGL canvas
  simulation.render();

  // Copy WebGL canvas to the 2D canvas
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(simulation.canvas, 0, 0);
  }
}

// HSV to RGB helper
function HSVtoRGB(h: number, s: number, v: number) {
  let r = 0,
    g = 0,
    b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }

  return { r, g, b };
}

/**
 * Cleanup function to release WebGL resources
 */
export function cleanup(): void {
  if (fluidState.simulation) {
    fluidState.simulation.destroy();
    fluidState.simulation = null;
    fluidState.lastCanvas = null;
    fluidState.lastSize = { width: 0, height: 0 };
  }
}
