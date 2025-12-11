// Gradient cache for performance optimization
const gradientCache = new Map<string, CanvasGradient>();

const getCachedGradient = (
  ctx: CanvasRenderingContext2D,
  key: string,
  createFn: () => CanvasGradient
): CanvasGradient => {
  if (!gradientCache.has(key)) {
    gradientCache.set(key, createFn());
  }
  return gradientCache.get(key)!;
};

// Clear gradient cache when canvas size changes
export const clearGradientCache = () => {
  gradientCache.clear();
};

export const renderBars = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  performanceMode = false
) => {
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
};

export const renderWave = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  performanceMode = false
) => {
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
};

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

// Trap Nation ghost configuration
const TRAP_NATION_GHOSTS = [
  {
    exponent: 1,
    color: "#FFFFFF",
    smoothMargin: 0,
    delay: 0,
    blurRadius: 5,
  },
  {
    exponent: 1.12,
    color: "#FFFF00",
    smoothMargin: 2,
    delay: 1,
    blurRadius: 5,
  },
  {
    exponent: 1.14,
    color: "#FF0000",
    smoothMargin: 2,
    delay: 2,
    blurRadius: 5,
  },
  {
    exponent: 1.3,
    color: "#FF66FF",
    smoothMargin: 3,
    delay: 3,
    blurRadius: 5,
  },
  {
    exponent: 1.33,
    color: "#333399",
    smoothMargin: 3,
    delay: 4,
    blurRadius: 5,
  },
  {
    exponent: 1.36,
    color: "#0000FF",
    smoothMargin: 3,
    delay: 5,
    blurRadius: 5,
  },
  {
    exponent: 1.5,
    color: "#33CCFF",
    smoothMargin: 5,
    delay: 6,
    blurRadius: 5,
  },
  {
    exponent: 1.52,
    color: "#00FF00",
    smoothMargin: 5,
    delay: 7,
    blurRadius: 5,
  },
];

export const renderTrapNation = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  spectrumCache: number[][],
  logoImage?: HTMLImageElement | null,
  performanceMode = false
) => {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(canvas.width, canvas.height) / 4;
  const minRadius = maxRadius / 5;
  const HALF_PI = Math.PI / 2;

  // Cache spectrum for ghost delays
  if (spectrumCache.length >= TRAP_NATION_GHOSTS.length) {
    spectrumCache.shift();
  }
  spectrumCache.push([...data]);

  // Calculate multiplier based on average spectrum intensity
  const sum = data.reduce((a, b) => a + b, 0);
  const intermediate = sum / data.length;
  const transformer = 1.2;
  const multiplier = Math.min(
    1,
    Math.max(
      0.3,
      (1 / (transformer - 1)) *
        (-Math.pow(intermediate, transformer) + transformer * intermediate)
    )
  );
  const curRadius = multiplier * (maxRadius - minRadius) + minRadius;

  const ghostsToRender = TRAP_NATION_GHOSTS;

  // Draw ghosts from back to front
  for (let s = ghostsToRender.length - 1; s >= 0; s--) {
    const ghost = ghostsToRender[s];
    const cacheIndex = Math.max(spectrumCache.length - ghost.delay - 1, 0);
    const curSpectrum = spectrumCache[cacheIndex] || data;

    // Calculate points for the semicircle
    const points: { x: number; y: number }[] = [];
    const len = curSpectrum.length;

    for (let i = 0; i < len; i++) {
      const t = Math.PI * (i / (len - 1)) - HALF_PI;
      const r =
        curRadius + Math.pow(curSpectrum[i] * maxRadius * 0.3, ghost.exponent);
      const x = r * Math.cos(t);
      const y = r * Math.sin(t);
      points.push({ x, y });
    }

    // Set ghost styling
    ctx.fillStyle = ghost.color;
    if (!performanceMode) {
      ctx.shadowColor = ghost.color;
      ctx.shadowBlur = ghost.blurRadius;
    }

    // Draw the curved shape (mirrored)
    ctx.beginPath();

    for (let neg = 0; neg <= 1; neg++) {
      const xMult = neg ? -1 : 1;
      ctx.moveTo(centerX, points[0].y + centerY);

      for (let i = 1; i < points.length - 2; i++) {
        const c = (xMult * (points[i].x + points[i + 1].x)) / 2 + centerX;
        const d = (points[i].y + points[i + 1].y) / 2 + centerY;
        ctx.quadraticCurveTo(
          xMult * points[i].x + centerX,
          points[i].y + centerY,
          c,
          d
        );
      }

      const lastIdx = points.length - 1;
      ctx.quadraticCurveTo(
        xMult * points[lastIdx - 1].x + centerX + neg * 2,
        points[lastIdx - 1].y + centerY,
        xMult * points[lastIdx].x + centerX,
        points[lastIdx].y + centerY
      );
    }

    ctx.fill();
  }

  // Reset shadow
  ctx.shadowBlur = 0;

  // Draw logo at center if provided (cropped to circle)
  if (logoImage) {
    const logoSize = curRadius * 2;
    const logoRadius = logoSize / 2;

    ctx.save();

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw the image within the circular clip
    const logoX = centerX - logoRadius;
    const logoY = centerY - logoRadius;
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

    ctx.restore();
  }
};

// =============================================
// NEW VISUALIZER TYPES
// =============================================

// 1. Spectrum - Horizontal frequency spectrum with mirrored reflection
export const renderSpectrum = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  performanceMode = false
) => {
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
};

// 2. Particles - Audio-reactive particles
const particleState: {
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
  }>;
} = {
  particles: [],
};

export const renderParticles = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  performanceMode = false
) => {
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const maxParticles = performanceMode ? 50 : 150;

  // Spawn new particles based on audio intensity
  const spawnRate = Math.floor(avgIntensity * 5) + 1;
  for (
    let i = 0;
    i < spawnRate && particleState.particles.length < maxParticles;
    i++
  ) {
    const freqIndex = Math.floor(Math.random() * data.length);
    const intensity = data[freqIndex];
    if (intensity > 0.2) {
      particleState.particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * intensity * 8,
        vy: (Math.random() - 0.5) * intensity * 8,
        size: 2 + intensity * 6,
        life: 1.0,
      });
    }
  }

  // Update and draw particles
  const gradient = getCachedGradient(
    ctx,
    `particles-center-${canvas.width}-${canvas.height}`,
    () => {
      const g = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      g.addColorStop(0, "rgba(168, 85, 247, 0.8)");
      g.addColorStop(0.5, "rgba(236, 72, 153, 0.6)");
      g.addColorStop(1, "rgba(99, 102, 241, 0.3)");
      return g;
    }
  );

  particleState.particles = particleState.particles.filter((p) => {
    // Update position
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.015;
    p.vx *= 0.98;
    p.vy *= 0.98;

    if (p.life <= 0) return false;

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(168, 85, 247, ${p.life * 0.8})`;
    ctx.fill();

    if (!performanceMode && p.size > 4) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(236, 72, 153, ${p.life * 0.3})`;
      ctx.fill();
    }

    return true;
  });

  // Draw center glow
  if (!performanceMode) {
    const centerGlow = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      50 + avgIntensity * 100
    );
    centerGlow.addColorStop(
      0,
      `rgba(168, 85, 247, ${0.3 + avgIntensity * 0.4})`
    );
    centerGlow.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      50 + avgIntensity * 100,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = centerGlow;
    ctx.fill();
  }
};

// 3. DNA Helix - Pulsing double helix
export const renderDnaHelix = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  performanceMode = false
) => {
  const centerY = canvas.height / 2;
  const amplitude = canvas.height * 0.3;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const time = Date.now() * 0.002;
  const points = performanceMode ? 30 : 60;

  // Draw connecting bars first
  ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
  ctx.lineWidth = 1;

  for (let i = 0; i < points; i++) {
    const x = (i / points) * canvas.width;
    const dataIndex = Math.floor((i / points) * data.length);
    const intensity = data[dataIndex] || 0;

    const phase = (i / points) * Math.PI * 4 + time;
    const y1 = centerY + Math.sin(phase) * amplitude * (0.5 + intensity * 0.5);
    const y2 =
      centerY + Math.sin(phase + Math.PI) * amplitude * (0.5 + intensity * 0.5);

    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  }

  // Draw helix strands
  for (let strand = 0; strand < 2; strand++) {
    const phaseOffset = strand * Math.PI;
    const color =
      strand === 0
        ? `rgba(168, 85, 247, ${0.7 + avgIntensity * 0.3})`
        : `rgba(236, 72, 153, ${0.7 + avgIntensity * 0.3})`;

    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * canvas.width;
      const dataIndex = Math.floor((i / points) * data.length);
      const intensity = data[dataIndex] || 0;

      const phase = (i / points) * Math.PI * 4 + time + phaseOffset;
      const y = centerY + Math.sin(phase) * amplitude * (0.5 + intensity * 0.5);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 3 + avgIntensity * 2;
    ctx.stroke();

    // Draw nodes
    for (let i = 0; i < points; i += 3) {
      const x = (i / points) * canvas.width;
      const dataIndex = Math.floor((i / points) * data.length);
      const intensity = data[dataIndex] || 0;

      const phase = (i / points) * Math.PI * 4 + time + phaseOffset;
      const y = centerY + Math.sin(phase) * amplitude * (0.5 + intensity * 0.5);

      ctx.beginPath();
      ctx.arc(x, y, 4 + intensity * 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
};

// 4. Oscilloscope - Classic oscilloscope waveform display
export const renderOscilloscope = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  performanceMode = false
) => {
  const centerY = canvas.height / 2;
  const sliceWidth = canvas.width / (data.length - 1);

  // Draw grid
  if (!performanceMode) {
    ctx.strokeStyle = "rgba(34, 211, 238, 0.1)";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i < 10; i++) {
      const x = (i / 10) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i < 5; i++) {
      const y = (i / 5) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  // Center line
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw waveform with glow
  if (!performanceMode) {
    ctx.shadowColor = "rgba(34, 211, 238, 0.8)";
    ctx.shadowBlur = 15;
  }

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = i * sliceWidth;
    // Convert 0-1 to oscilloscope style wave
    const normalizedValue = (data[i] - 0.5) * 2;
    const y = centerY + normalizedValue * canvas.height * 0.4;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw bright dots at peaks
  if (!performanceMode) {
    for (let i = 0; i < data.length; i += 5) {
      if (data[i] > 0.6) {
        const x = i * sliceWidth;
        const normalizedValue = (data[i] - 0.5) * 2;
        const y = centerY + normalizedValue * canvas.height * 0.4;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fill();
      }
    }
  }
};

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

// 6. Galaxy/Spiral - Rotating spiral pattern
const galaxyState = { rotation: 0 };

export const renderGalaxy = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number,
  performanceMode = false
) => {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(centerX, centerY) * 0.85;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Update rotation
  galaxyState.rotation += 0.01 + avgIntensity * 0.02;

  const arms = 3;
  const pointsPerArm = performanceMode ? 40 : 80;

  // Draw spiral arms
  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (arm / arms) * Math.PI * 2;
    const hue = 260 + arm * 40; // Purple to pink range

    ctx.beginPath();
    for (let i = 0; i < pointsPerArm; i++) {
      const t = i / pointsPerArm;
      const dataIndex = Math.floor(t * data.length);
      const intensity = data[dataIndex] || 0;

      const radius = t * maxRadius * (0.8 + intensity * 0.2);
      const angle = t * Math.PI * 4 + armOffset + galaxyState.rotation;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.4 + avgIntensity * 0.4})`;
    ctx.lineWidth = 3 + avgIntensity * 2;
    ctx.stroke();

    // Draw stars along the arm
    if (!performanceMode) {
      for (let i = 0; i < pointsPerArm; i += 4) {
        const t = i / pointsPerArm;
        const dataIndex = Math.floor(t * data.length);
        const intensity = data[dataIndex] || 0;

        if (intensity > 0.3) {
          const radius = t * maxRadius * (0.8 + intensity * 0.2);
          const angle = t * Math.PI * 4 + armOffset + galaxyState.rotation;

          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.arc(x, y, 1 + intensity * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
          ctx.fill();
        }
      }
    }
  }

  // Center glow
  const centerGlow = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    30 + avgIntensity * 30
  );
  centerGlow.addColorStop(
    0,
    `rgba(255, 255, 255, ${0.8 + avgIntensity * 0.2})`
  );
  centerGlow.addColorStop(
    0.3,
    `rgba(168, 85, 247, ${0.5 + avgIntensity * 0.3})`
  );
  centerGlow.addColorStop(1, "rgba(168, 85, 247, 0)");

  ctx.beginPath();
  ctx.arc(centerX, centerY, 30 + avgIntensity * 30, 0, Math.PI * 2);
  ctx.fillStyle = centerGlow;
  ctx.fill();
};
