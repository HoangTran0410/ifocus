import { getCachedGradient, VisualizeFnProps } from "./shared";

export default function renderWave({
  ctx,
  canvas,
  data,
  barCount,
  performanceMode = false,
}: VisualizeFnProps) {
  const sliceWidth = canvas.width / (barCount - 1);
  const centerY = canvas.height / 2;

  // Performance mode: simple fast rendering
  if (performanceMode) {
    const gradient = getCachedGradient(
      ctx,
      `wave-main-${canvas.width}-${canvas.height}`,
      () => {
        const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
        g.addColorStop(0, "rgba(99, 102, 241, 0.7)");
        g.addColorStop(0.5, "rgba(168, 85, 247, 0.7)");
        g.addColorStop(1, "rgba(236, 72, 153, 0.7)");
        return g;
      }
    );

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    // Top curve
    for (let i = 0; i < barCount; i++) {
      const x = i * sliceWidth;
      const amplitude = data[i] * canvas.height * 0.35;
      const y = centerY - amplitude;
      ctx.lineTo(x, y);
    }

    // Bottom curve (mirror)
    for (let i = barCount - 1; i >= 0; i--) {
      const x = i * sliceWidth;
      const amplitude = data[i] * canvas.height * 0.35;
      const y = centerY + amplitude;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();

    // Simple top stroke
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < barCount; i++) {
      const x = i * sliceWidth;
      const amplitude = data[i] * canvas.height * 0.35;
      const y = centerY - amplitude;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    return;
  }

  // Full quality mode
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // 1. Draw ambient glow lines in background
  for (let line = 0; line < 3; line++) {
    const offset = (line - 1) * 30;
    ctx.beginPath();
    ctx.moveTo(0, centerY + offset);
    ctx.lineTo(canvas.width, centerY + offset);
    ctx.strokeStyle = `rgba(99, 102, 241, ${0.05 + avgIntensity * 0.05})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 2. Draw outer glow wave (larger, more blurred)
  ctx.shadowColor = "rgba(168, 85, 247, 0.5)";
  ctx.shadowBlur = 20 + avgIntensity * 30;

  const glowGradient = ctx.createLinearGradient(
    0,
    centerY - canvas.height * 0.4,
    0,
    centerY + canvas.height * 0.4
  );
  glowGradient.addColorStop(0, "rgba(236, 72, 153, 0.3)");
  glowGradient.addColorStop(0.5, "rgba(168, 85, 247, 0.4)");
  glowGradient.addColorStop(1, "rgba(99, 102, 241, 0.3)");

  ctx.beginPath();
  ctx.moveTo(0, centerY);
  for (let i = 0; i < barCount; i++) {
    const x = i * sliceWidth;
    const amplitude = data[i] * canvas.height * 0.45;
    const y = centerY - amplitude;
    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      const prevX = (i - 1) * sliceWidth;
      const cpX = (prevX + x) / 2;
      ctx.quadraticCurveTo(
        prevX,
        centerY - data[i - 1] * canvas.height * 0.45,
        cpX,
        y
      );
    }
  }
  for (let i = barCount - 1; i >= 0; i--) {
    const x = i * sliceWidth;
    const amplitude = data[i] * canvas.height * 0.45;
    const y = centerY + amplitude;
    if (i === barCount - 1) {
      ctx.lineTo(x, y);
    } else {
      const nextX = (i + 1) * sliceWidth;
      const cpX = (nextX + x) / 2;
      ctx.quadraticCurveTo(
        nextX,
        centerY + data[i + 1] * canvas.height * 0.45,
        cpX,
        y
      );
    }
  }
  ctx.closePath();
  ctx.fillStyle = glowGradient;
  ctx.fill();
  ctx.shadowBlur = 0;

  // 3. Draw main filled wave with rich gradient
  const mainGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  mainGradient.addColorStop(0, "rgba(99, 102, 241, 0.75)");
  mainGradient.addColorStop(0.25, "rgba(139, 92, 246, 0.7)");
  mainGradient.addColorStop(0.5, "rgba(168, 85, 247, 0.75)");
  mainGradient.addColorStop(0.75, "rgba(217, 70, 239, 0.7)");
  mainGradient.addColorStop(1, "rgba(236, 72, 153, 0.75)");

  ctx.fillStyle = mainGradient;
  ctx.beginPath();
  ctx.moveTo(0, centerY);

  // Top curve
  for (let i = 0; i < barCount; i++) {
    const x = i * sliceWidth;
    const amplitude = data[i] * canvas.height * 0.35;
    const y = centerY - amplitude;
    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      const prevX = (i - 1) * sliceWidth;
      const cpX = (prevX + x) / 2;
      const prevY = centerY - data[i - 1] * canvas.height * 0.35;
      ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
      ctx.quadraticCurveTo(cpX, y, x, y);
    }
  }

  // Bottom curve (mirror)
  for (let i = barCount - 1; i >= 0; i--) {
    const x = i * sliceWidth;
    const amplitude = data[i] * canvas.height * 0.35;
    const y = centerY + amplitude;
    if (i === barCount - 1) {
      ctx.lineTo(x, y);
    } else {
      const nextX = (i + 1) * sliceWidth;
      const cpX = (nextX + x) / 2;
      const nextY = centerY + data[i + 1] * canvas.height * 0.35;
      ctx.quadraticCurveTo(nextX, nextY, cpX, (nextY + y) / 2);
      ctx.quadraticCurveTo(cpX, y, x, y);
    }
  }

  ctx.closePath();
  ctx.fill();

  // 4. Draw center line with glow
  ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + avgIntensity * 0.2})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 5. Draw top stroke line with gradient
  const strokeGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  strokeGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  strokeGradient.addColorStop(0.5, "rgba(236, 72, 153, 0.8)");
  strokeGradient.addColorStop(1, "rgba(255, 255, 255, 0.9)");

  ctx.strokeStyle = strokeGradient;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  for (let i = 0; i < barCount; i++) {
    const x = i * sliceWidth;
    const amplitude = data[i] * canvas.height * 0.35;
    const y = centerY - amplitude;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      const prevX = (i - 1) * sliceWidth;
      const cpX = (prevX + x) / 2;
      const prevY = centerY - data[i - 1] * canvas.height * 0.35;
      ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
    }
  }
  ctx.stroke();

  // 6. Draw bottom stroke line
  ctx.strokeStyle = `rgba(99, 102, 241, ${0.5 + avgIntensity * 0.3})`;
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < barCount; i++) {
    const x = i * sliceWidth;
    const amplitude = data[i] * canvas.height * 0.35;
    const y = centerY + amplitude;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      const prevX = (i - 1) * sliceWidth;
      const cpX = (prevX + x) / 2;
      const prevY = centerY + data[i - 1] * canvas.height * 0.35;
      ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
    }
  }
  ctx.stroke();

  // 7. Draw peak dots
  for (let i = 0; i < barCount; i++) {
    if (data[i] > 0.4) {
      const x = i * sliceWidth;
      const amplitude = data[i] * canvas.height * 0.35;
      const topY = centerY - amplitude;
      const bottomY = centerY + amplitude;
      const radius = 2 + data[i] * 4;

      // Top dot
      const topGlow = ctx.createRadialGradient(x, topY, 0, x, topY, radius * 2);
      topGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      topGlow.addColorStop(0.4, "rgba(236, 72, 153, 0.6)");
      topGlow.addColorStop(1, "rgba(236, 72, 153, 0)");
      ctx.beginPath();
      ctx.arc(x, topY, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = topGlow;
      ctx.fill();

      // Bottom dot (smaller)
      if (data[i] > 0.6) {
        const bottomGlow = ctx.createRadialGradient(
          x,
          bottomY,
          0,
          x,
          bottomY,
          radius * 1.5
        );
        bottomGlow.addColorStop(0, "rgba(99, 102, 241, 0.8)");
        bottomGlow.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx.beginPath();
        ctx.arc(x, bottomY, radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = bottomGlow;
        ctx.fill();
      }
    }
  }
}
