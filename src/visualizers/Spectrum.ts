import { getCachedGradient, VisualizeFnProps } from "./shared";

export default function renderSpectrum({
  ctx,
  canvas,
  data,
  barCount,
  performanceMode = false,
}: VisualizeFnProps) {
  const barWidth = canvas.width / barCount;
  const gap = 1;
  const actualBarWidth = barWidth - gap;
  const centerY = canvas.height / 2;

  const gradient = getCachedGradient(
    ctx,
    `spectrum-${canvas.width}-${canvas.height}`,
    () => {
      const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
      g.addColorStop(0, "rgba(34, 211, 238, 0.9)");
      g.addColorStop(0.25, "rgba(99, 102, 241, 0.9)");
      g.addColorStop(0.5, "rgba(168, 85, 247, 0.9)");
      g.addColorStop(0.75, "rgba(236, 72, 153, 0.9)");
      g.addColorStop(1, "rgba(251, 146, 60, 0.9)");
      return g;
    }
  );

  ctx.fillStyle = gradient;

  for (let i = 0; i < barCount; i++) {
    const barHeight = data[i] * canvas.height * 0.45;
    const x = i * barWidth;

    // Top bars (going up from center)
    ctx.fillRect(x, centerY - barHeight, actualBarWidth, barHeight);

    // Bottom bars (going down from center - mirror)
    ctx.fillRect(x, centerY, actualBarWidth, barHeight);
  }

  if (!performanceMode) {
    // Center line glow
    ctx.shadowColor = "rgba(168, 85, 247, 0.8)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
