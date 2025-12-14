import { VisualizeFnProps } from "../types";
import { getCachedGradient } from "../utils";

// Reusable array to avoid allocations
const barsData: number[] = new Array(50).fill(0);

export default function renderBars({
  ctx,
  canvas,
  data,
  performanceMode = false,
}: VisualizeFnProps) {
  const barCount = performanceMode ? 30 : 50;
  const dataLen = data.length;

  // Resample data to exactly barCount values
  if (dataLen >= barCount) {
    // Downsample: average ranges
    const binSize = dataLen / barCount;
    for (let i = 0; i < barCount; i++) {
      const start = Math.floor(i * binSize);
      const end = Math.floor((i + 1) * binSize);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += data[j];
      }
      barsData[i] = sum / (end - start);
    }
  } else {
    // Upsample: linear interpolation
    const scale = (dataLen - 1) / (barCount - 1);
    for (let i = 0; i < barCount; i++) {
      const pos = i * scale;
      const low = Math.floor(pos);
      const high = Math.min(low + 1, dataLen - 1);
      const t = pos - low;
      barsData[i] = data[low] * (1 - t) + data[high] * t;
    }
  }

  const barWidth = canvas.width / barCount;
  const gap = Math.max(2, barWidth * 0.15);
  const actualBarWidth = barWidth - gap;
  const maxBarHeight = canvas.height * 0.75;

  // Cache the main gradient (shared by all bars)
  const mainGradient = getCachedGradient(
    ctx,
    `bars-main-${canvas.height}`,
    () => {
      const g = ctx.createLinearGradient(0, canvas.height, 0, 0);
      g.addColorStop(0, "rgba(99, 102, 241, 0.95)");
      g.addColorStop(0.4, "rgba(139, 92, 246, 0.9)");
      g.addColorStop(0.7, "rgba(168, 85, 247, 0.85)");
      g.addColorStop(1, "rgba(236, 72, 153, 0.9)");
      return g;
    }
  );

  // Performance mode: fast minimal rendering
  if (performanceMode) {
    ctx.fillStyle = mainGradient;
    for (let i = 0; i < barCount; i++) {
      const barHeight = barsData[i] * maxBarHeight;
      if (barHeight < 2) continue;
      const x = i * barWidth + gap / 2;
      const y = canvas.height - barHeight;
      ctx.fillRect(x, y, actualBarWidth, barHeight);
    }
    return;
  }

  // Full quality mode - enhanced visuals with optimized performance
  let avgIntensity = 0;
  for (let i = 0; i < barCount; i++) avgIntensity += barsData[i];
  avgIntensity /= barCount;

  // Cache glow gradient for bars
  const glowGradient = getCachedGradient(
    ctx,
    `bars-glow-${canvas.height}`,
    () => {
      const g = ctx.createLinearGradient(0, canvas.height, 0, 0);
      g.addColorStop(0, "rgba(99, 102, 241, 0.4)");
      g.addColorStop(0.5, "rgba(168, 85, 247, 0.5)");
      g.addColorStop(1, "rgba(236, 72, 153, 0.4)");
      return g;
    }
  );

  // Cache highlight gradient at origin
  const highlightGradient = getCachedGradient(
    ctx,
    `bars-highlight-${actualBarWidth}`,
    () => {
      const g = ctx.createLinearGradient(0, 0, actualBarWidth * 0.4, 0);
      g.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      g.addColorStop(1, "rgba(255, 255, 255, 0)");
      return g;
    }
  );

  // Cache stroke gradient for peak line
  const strokeGradient = getCachedGradient(
    ctx,
    `bars-stroke-${canvas.width}`,
    () => {
      const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
      g.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      g.addColorStop(0.5, "rgba(236, 72, 153, 0.8)");
      g.addColorStop(1, "rgba(255, 255, 255, 0.9)");
      return g;
    }
  );

  // 1. Draw ambient glow lines in background
  ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 + avgIntensity * 0.1})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const gridLines = 5;
  for (let i = 1; i <= gridLines; i++) {
    const y = canvas.height - (canvas.height / gridLines) * i;
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();

  // 2. Draw reflection bars (batched)
  const reflectionGradient = getCachedGradient(
    ctx,
    `bars-reflection-${canvas.height}`,
    () => {
      const g = ctx.createLinearGradient(
        0,
        canvas.height,
        0,
        canvas.height + 60
      );
      g.addColorStop(0, "rgba(99, 102, 241, 0.2)");
      g.addColorStop(1, "rgba(99, 102, 241, 0)");
      return g;
    }
  );
  ctx.fillStyle = reflectionGradient;
  ctx.beginPath();
  for (let i = 0; i < barCount; i++) {
    const barHeight = barsData[i] * maxBarHeight;
    if (barHeight < 5) continue;
    const reflectionHeight = barHeight * 0.2;
    const x = i * barWidth + gap / 2;
    ctx.roundRect(
      x,
      canvas.height,
      actualBarWidth,
      reflectionHeight,
      [0, 0, 4, 4]
    );
  }
  ctx.fill();

  // 3. Draw glow layer (single shadow pass for all bars)
  ctx.shadowColor = "rgba(168, 85, 247, 0.6)";
  ctx.shadowBlur = 15 + avgIntensity * 20;
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  for (let i = 0; i < barCount; i++) {
    const barHeight = barsData[i] * maxBarHeight;
    if (barHeight < 2) continue;
    const x = i * barWidth + gap / 2;
    const y = canvas.height - barHeight;
    ctx.roundRect(x, y, actualBarWidth, barHeight, [6, 6, 0, 0]);
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  // 4. Draw main bars (solid, no shadow)
  ctx.fillStyle = mainGradient;
  ctx.beginPath();
  for (let i = 0; i < barCount; i++) {
    const barHeight = barsData[i] * maxBarHeight;
    if (barHeight < 2) continue;
    const x = i * barWidth + gap / 2;
    const y = canvas.height - barHeight;
    ctx.roundRect(x, y, actualBarWidth, barHeight, [6, 6, 0, 0]);
  }
  ctx.fill();

  // 5. Draw edge highlights (using cached gradient + transform)
  ctx.save();
  ctx.fillStyle = highlightGradient;
  for (let i = 0; i < barCount; i++) {
    const barHeight = barsData[i] * maxBarHeight;
    if (barHeight < 8) continue;
    const x = i * barWidth + gap / 2;
    const y = canvas.height - barHeight;
    ctx.setTransform(1, 0, 0, 1, x, y);
    ctx.globalAlpha = 0.5 + barsData[i] * 0.5;
    ctx.fillRect(0, 0, actualBarWidth * 0.4, barHeight);
  }
  ctx.restore();

  // 6. Draw bright top caps (batched)
  const capRadius = actualBarWidth / 2 - 2;
  if (capRadius > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + avgIntensity * 0.4})`;
    ctx.beginPath();
    for (let i = 0; i < barCount; i++) {
      const barHeight = barsData[i] * maxBarHeight;
      if (barHeight > 15) {
        const x = i * barWidth + gap / 2;
        const y = canvas.height - barHeight;
        ctx.moveTo(x + actualBarWidth, y + 2);
        ctx.arc(x + actualBarWidth / 2, y + 2, capRadius, 0, Math.PI, true);
      }
    }
    ctx.fill();
  }

  // 7. Draw glowing peak dots (with single shadow for glow effect)
  ctx.shadowColor = "rgba(236, 72, 153, 0.8)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  for (let i = 0; i < barCount; i++) {
    if (barsData[i] > 0.45) {
      const barHeight = barsData[i] * maxBarHeight;
      const x = i * barWidth + barWidth / 2;
      const y = canvas.height - barHeight - 10;
      const radius = 2 + barsData[i] * 3;
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  // 8. Draw glowing peak line with gradient stroke
  ctx.strokeStyle = strokeGradient;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  for (let i = 0; i < barCount; i++) {
    const barHeight = barsData[i] * maxBarHeight;
    const x = i * barWidth + barWidth / 2;
    const y = canvas.height - barHeight;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}
