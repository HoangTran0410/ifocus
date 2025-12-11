import { getCachedGradient, VisualizeFnProps } from "./shared";

export default function renderBars({
  ctx,
  canvas,
  data,
  barCount,
  performanceMode = false,
}: VisualizeFnProps) {
  const barWidth = canvas.width / barCount;
  const gap = Math.max(2, barWidth * 0.15);
  const actualBarWidth = barWidth - gap;

  // Performance mode: simple fast rendering
  if (performanceMode) {
    const gradient = getCachedGradient(
      ctx,
      `bars-main-${canvas.width}-${canvas.height}`,
      () => {
        const g = ctx.createLinearGradient(0, canvas.height, 0, 0);
        g.addColorStop(0, "rgba(99, 102, 241, 0.9)");
        g.addColorStop(0.5, "rgba(168, 85, 247, 0.85)");
        g.addColorStop(1, "rgba(236, 72, 153, 0.85)");
        return g;
      }
    );
    ctx.fillStyle = gradient;

    for (let i = 0; i < barCount; i++) {
      const barHeight = data[i] * canvas.height * 0.75;
      const x = i * barWidth + gap / 2;
      const y = canvas.height - barHeight;
      ctx.beginPath();
      ctx.roundRect(x, y, actualBarWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();
    }
    return;
  }

  // Full quality mode
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // 1. Draw subtle background grid lines
  ctx.strokeStyle = `rgba(99, 102, 241, ${0.05 + avgIntensity * 0.1})`;
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 1; i <= gridLines; i++) {
    const y = canvas.height - (canvas.height / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 2. Draw reflection bars (bottom, faded)
  for (let i = 0; i < barCount; i++) {
    const barHeight = data[i] * canvas.height * 0.7;
    const reflectionHeight = barHeight * 0.3;
    const x = i * barWidth + gap / 2;

    const reflectionGradient = ctx.createLinearGradient(
      0,
      canvas.height,
      0,
      canvas.height + reflectionHeight
    );
    reflectionGradient.addColorStop(
      0,
      `rgba(99, 102, 241, ${0.15 + data[i] * 0.1})`
    );
    reflectionGradient.addColorStop(1, "rgba(99, 102, 241, 0)");

    ctx.fillStyle = reflectionGradient;
    ctx.beginPath();
    ctx.roundRect(
      x,
      canvas.height,
      actualBarWidth,
      reflectionHeight * 0.5,
      [0, 0, 4, 4]
    );
    ctx.fill();
  }

  // 3. Draw main bars with glow
  for (let i = 0; i < barCount; i++) {
    const barHeight = data[i] * canvas.height * 0.75;
    const x = i * barWidth + gap / 2;
    const y = canvas.height - barHeight;

    // Bar gradient
    const barGradient = ctx.createLinearGradient(x, canvas.height, x, y);
    barGradient.addColorStop(0, "rgba(99, 102, 241, 0.95)");
    barGradient.addColorStop(0.4, "rgba(139, 92, 246, 0.9)");
    barGradient.addColorStop(0.7, "rgba(168, 85, 247, 0.85)");
    barGradient.addColorStop(1, "rgba(236, 72, 153, 0.9)");

    // Glow effect for high bars
    if (data[i] > 0.4) {
      ctx.shadowColor = "rgba(168, 85, 247, 0.6)";
      ctx.shadowBlur = 10 + data[i] * 15;
    }

    ctx.fillStyle = barGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, actualBarWidth, barHeight, [6, 6, 0, 0]);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Highlight edge on left side of each bar
    const highlightGradient = ctx.createLinearGradient(
      x,
      y,
      x + actualBarWidth * 0.3,
      y
    );
    highlightGradient.addColorStop(
      0,
      `rgba(255, 255, 255, ${0.2 + data[i] * 0.2})`
    );
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, actualBarWidth * 0.3, barHeight, [6, 0, 0, 0]);
    ctx.fill();

    // Top cap glow (only if bar is wide enough)
    const capRadius = actualBarWidth / 2 - 2;
    if (barHeight > 20 && capRadius > 0) {
      ctx.beginPath();
      ctx.arc(x + actualBarWidth / 2, y + 3, capRadius, Math.PI, 0);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + data[i] * 0.3})`;
      ctx.fill();
    }
  }

  // 4. Draw particle dots on peaks
  for (let i = 0; i < barCount; i++) {
    if (data[i] > 0.5) {
      const barHeight = data[i] * canvas.height * 0.75;
      const x = i * barWidth + barWidth / 2;
      const y = canvas.height - barHeight - 8;
      const radius = 2 + data[i] * 3;

      const dotGlow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      dotGlow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      dotGlow.addColorStop(0.5, "rgba(236, 72, 153, 0.5)");
      dotGlow.addColorStop(1, "rgba(236, 72, 153, 0)");

      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = dotGlow;
      ctx.fill();
    }
  }

  // 5. Draw top line connecting peaks
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  for (let i = 0; i < barCount; i++) {
    const barHeight = data[i] * canvas.height * 0.75;
    const x = i * barWidth + barWidth / 2;
    const y = canvas.height - barHeight;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + avgIntensity * 0.3})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
