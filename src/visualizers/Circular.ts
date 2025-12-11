import { getCachedGradient } from "./shared";

export const renderCircular = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  performanceMode = false
) => {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const baseRadius = Math.min(centerX, centerY) * 0.3;
  const maxBarHeight = Math.min(centerX, centerY) * 0.4;

  // Calculate bar width based on bar count for proper spacing
  const barWidthAngle = (Math.PI * 2) / barCount;
  const gapRatio = 0.3;
  const barAngle = barWidthAngle * (1 - gapRatio);

  // Performance mode: simple fast rendering
  if (performanceMode) {
    const gradient = getCachedGradient(
      ctx,
      `circular-main-${canvas.width}-${canvas.height}`,
      () => {
        const g = ctx.createRadialGradient(
          centerX,
          centerY,
          baseRadius,
          centerX,
          centerY,
          baseRadius + maxBarHeight
        );
        g.addColorStop(0, "rgba(99, 102, 241, 0.85)");
        g.addColorStop(0.5, "rgba(168, 85, 247, 0.8)");
        g.addColorStop(1, "rgba(236, 72, 153, 0.75)");
        return g;
      }
    );

    // Draw bars only
    for (let i = 0; i < barCount; i++) {
      const startAngle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const endAngle = startAngle + barAngle;
      const barHeight = data[i] * maxBarHeight;

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, startAngle, endAngle);
      ctx.arc(
        centerX,
        centerY,
        baseRadius + barHeight,
        endAngle,
        startAngle,
        true
      );
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Simple base ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(99, 102, 241, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Simple center circle
    const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
    const innerRadius = baseRadius * 0.55 + avgIntensity * 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20, 20, 35, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }

  // Full quality mode
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Create gradients
  const outerGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    baseRadius,
    centerX,
    centerY,
    baseRadius + maxBarHeight
  );
  outerGradient.addColorStop(0, "rgba(99, 102, 241, 0.9)");
  outerGradient.addColorStop(0.4, "rgba(168, 85, 247, 0.85)");
  outerGradient.addColorStop(0.7, "rgba(236, 72, 153, 0.8)");
  outerGradient.addColorStop(1, "rgba(251, 146, 60, 0.7)");

  const innerGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    baseRadius * 0.3,
    centerX,
    centerY,
    baseRadius
  );
  innerGradient.addColorStop(0, "rgba(236, 72, 153, 0.7)");
  innerGradient.addColorStop(0.5, "rgba(168, 85, 247, 0.8)");
  innerGradient.addColorStop(1, "rgba(99, 102, 241, 0.9)");

  // 1. Draw outer glow ring (atmospheric effect)
  const glowIntensity = 0.15 + avgIntensity * 0.5;
  for (let i = 3; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      baseRadius + maxBarHeight * 0.5 + i * 20,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = `rgba(168, 85, 247, ${glowIntensity / i})`;
    ctx.lineWidth = 8 / i;
    ctx.stroke();
  }

  // 2. Draw mirrored bars (both inward and outward)
  for (let i = 0; i < barCount; i++) {
    const startAngle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const endAngle = startAngle + barAngle;
    const barHeight = data[i] * maxBarHeight;
    const innerBarHeight = data[i] * baseRadius * 0.5;

    // Outer bars (growing outward)
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, startAngle, endAngle);
    ctx.arc(
      centerX,
      centerY,
      baseRadius + barHeight,
      endAngle,
      startAngle,
      true
    );
    ctx.closePath();
    ctx.fillStyle = outerGradient;
    ctx.fill();

    // Add highlight to outer bars
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      baseRadius + barHeight - 2,
      startAngle + 0.02,
      endAngle - 0.02
    );
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + data[i] * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner bars (growing inward toward center)
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius - 4, startAngle, endAngle);
    ctx.arc(
      centerX,
      centerY,
      baseRadius - 4 - innerBarHeight,
      endAngle,
      startAngle,
      true
    );
    ctx.closePath();
    ctx.fillStyle = innerGradient;
    ctx.fill();
  }

  // 3. Draw particle dots at bar tips
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2 + barAngle / 2;
    const barHeight = data[i] * maxBarHeight;

    if (barHeight > maxBarHeight * 0.3) {
      const particleRadius = 2 + data[i] * 4;
      const x = centerX + Math.cos(angle) * (baseRadius + barHeight + 5);
      const y = centerY + Math.sin(angle) * (baseRadius + barHeight + 5);

      // Glow effect
      const particleGlow = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        particleRadius * 2
      );
      particleGlow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      particleGlow.addColorStop(0.5, "rgba(236, 72, 153, 0.6)");
      particleGlow.addColorStop(1, "rgba(236, 72, 153, 0)");

      ctx.beginPath();
      ctx.arc(x, y, particleRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = particleGlow;
      ctx.fill();
    }
  }

  // 4. Draw base ring with glow
  ctx.shadowColor = "rgba(168, 85, 247, 0.8)";
  ctx.shadowBlur = 15 + avgIntensity * 20;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 5. Draw pulsing center circle with concentric rings
  const innerRadius = baseRadius * 0.55 + avgIntensity * 8;

  // Outer ring of inner circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius + 5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Main inner circle
  const centerGradient = ctx.createRadialGradient(
    centerX - innerRadius * 0.3,
    centerY - innerRadius * 0.3,
    0,
    centerX,
    centerY,
    innerRadius
  );
  centerGradient.addColorStop(0, "rgba(40, 40, 60, 0.95)");
  centerGradient.addColorStop(0.7, "rgba(25, 25, 45, 0.95)");
  centerGradient.addColorStop(1, "rgba(15, 15, 30, 0.95)");

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = centerGradient;
  ctx.fill();

  // Inner circle border with glow
  ctx.shadowColor = "rgba(236, 72, 153, 0.6)";
  ctx.shadowBlur = 10 + avgIntensity * 15;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(168, 85, 247, ${0.5 + avgIntensity * 0.3})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Decorative inner ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 + avgIntensity * 0.2})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4 + avgIntensity * 3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + avgIntensity * 0.4})`;
  ctx.fill();
};
