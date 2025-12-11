import { getCachedGradient } from "./shared";

// 5. Radial Lines - Lines radiating from center
export const renderRadialLines = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  performanceMode = false
) => {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(centerX, centerY) * 0.9;
  const minRadius = 30;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Draw outer glow ring
  if (!performanceMode) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 + avgIntensity * 0.2})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  const gradient = getCachedGradient(
    ctx,
    `radial-lines-${canvas.width}-${canvas.height}`,
    () => {
      const g = ctx.createRadialGradient(
        centerX,
        centerY,
        minRadius,
        centerX,
        centerY,
        maxRadius
      );
      g.addColorStop(0, "rgba(99, 102, 241, 0.9)");
      g.addColorStop(0.5, "rgba(168, 85, 247, 0.8)");
      g.addColorStop(1, "rgba(236, 72, 153, 0.7)");
      return g;
    }
  );

  // Draw lines
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const intensity = data[i];
    const lineLength = minRadius + intensity * (maxRadius - minRadius);

    const x1 = centerX + Math.cos(angle) * minRadius;
    const y1 = centerY + Math.sin(angle) * minRadius;
    const x2 = centerX + Math.cos(angle) * lineLength;
    const y2 = centerY + Math.sin(angle) * lineLength;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2 + intensity * 3;
    ctx.lineCap = "round";
    ctx.stroke();

    // End dot
    if (!performanceMode && intensity > 0.4) {
      ctx.beginPath();
      ctx.arc(x2, y2, 3 + intensity * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + intensity * 0.5})`;
      ctx.fill();
    }
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, minRadius - 5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(15, 15, 30, 0.9)";
  ctx.fill();
  ctx.strokeStyle = `rgba(168, 85, 247, ${0.5 + avgIntensity * 0.3})`;
  ctx.lineWidth = 2;
  ctx.stroke();
};
