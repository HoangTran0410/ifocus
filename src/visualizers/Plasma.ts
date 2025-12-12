import { VisualizeFnProps } from "./shared";

// Plasma effect - Organic flowing interference patterns
const plasmaState = {
  time: 0,
};

export default function renderPlasma({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
  mid = 0,
  high = 0,
}: VisualizeFnProps) {
  const width = canvas.width;
  const height = canvas.height;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Update time - speed influenced by mid frequencies
  plasmaState.time += 0.02 + avgIntensity * 0.03 + mid * 0.06;
  const t = plasmaState.time;

  // Resolution for performance - lower = faster but blockier
  const resolution = performanceMode ? 12 : 6;
  const cols = Math.ceil(width / resolution);
  const rows = Math.ceil(height / resolution);

  // Use passed frequency bands for wave modulation
  const bassIntensity = bass;
  const midIntensity = mid;
  const highIntensity = high;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x / cols;
      const py = y / rows;

      // Multiple sine waves with different frequencies create plasma interference
      const v1 = Math.sin(px * 10 + t + bassIntensity * 3);
      const v2 = Math.sin((py * 10 + t) * 0.7 + midIntensity * 2);
      const v3 = Math.sin((px + py) * 5 + t * 0.5);
      const v4 = Math.sin(
        Math.sqrt((px - 0.5) ** 2 + (py - 0.5) ** 2) * 12 +
          t +
          highIntensity * 4
      );

      // Combine waves
      const value = (v1 + v2 + v3 + v4) / 4;

      // Map to color - shift hue with audio
      const hueShift = avgIntensity * 60 + beatIntensity * 30;
      const hue = (value + 1) * 90 + 200 + hueShift; // Purple/blue/pink range
      const saturation = 70 + avgIntensity * 30;
      const lightness = 40 + (value + 1) * 20 + beatIntensity * 15;

      ctx.fillStyle = `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x * resolution, y * resolution, resolution, resolution);
    }
  }

  // Add glow overlay on bass hits
  if (!performanceMode && bass > 0.3) {
    const glowGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) / 2
    );
    glowGradient.addColorStop(0, `rgba(255, 100, 255, ${beatIntensity * 0.3})`);
    glowGradient.addColorStop(
      0.5,
      `rgba(100, 100, 255, ${beatIntensity * 0.15})`
    );
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Subtle vignette
  if (!performanceMode) {
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, `rgba(0, 0, 0, ${0.3 + avgIntensity * 0.2})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
}
