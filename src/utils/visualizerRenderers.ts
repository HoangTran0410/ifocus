export const renderBars = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number
) => {
  const barWidth = canvas.width / barCount;
  const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
  gradient.addColorStop(0, "rgba(99, 102, 241, 0.8)");
  gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.8)");
  gradient.addColorStop(1, "rgba(236, 72, 153, 0.8)");

  ctx.fillStyle = gradient;

  for (let i = 0; i < barCount; i++) {
    const barHeight = data[i] * canvas.height * 0.9;
    const x = i * barWidth;
    const y = canvas.height - barHeight;

    // Round top corners
    ctx.beginPath();
    ctx.roundRect(x + 1, y, barWidth - 2, barHeight, [4, 4, 0, 0]);
    ctx.fill();
  }
};

export const renderWave = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number
) => {
  const sliceWidth = canvas.width / (barCount - 1);
  const centerY = canvas.height / 2;

  // Draw filled wave
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "rgba(99, 102, 241, 0.6)");
  gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.6)");
  gradient.addColorStop(1, "rgba(236, 72, 153, 0.6)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, centerY);

  for (let i = 0; i < barCount; i++) {
    const x = i * sliceWidth;
    const amplitude = data[i] * canvas.height * 0.4;
    const y = centerY - amplitude;

    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      const prevX = (i - 1) * sliceWidth;
      const cpX = (prevX + x) / 2;
      ctx.quadraticCurveTo(
        prevX,
        centerY - data[i - 1] * canvas.height * 0.4,
        cpX,
        (centerY - data[i - 1] * canvas.height * 0.4 + y) / 2
      );
      ctx.quadraticCurveTo(cpX, y, x, y);
    }
  }

  // Bottom wave (mirror)
  for (let i = barCount - 1; i >= 0; i--) {
    const x = i * sliceWidth;
    const amplitude = data[i] * canvas.height * 0.4;
    const y = centerY + amplitude;

    if (i === barCount - 1) {
      ctx.lineTo(x, y);
    } else {
      const nextX = (i + 1) * sliceWidth;
      const cpX = (nextX + x) / 2;
      ctx.quadraticCurveTo(
        nextX,
        centerY + data[i + 1] * canvas.height * 0.4,
        cpX,
        (centerY + data[i + 1] * canvas.height * 0.4 + y) / 2
      );
      ctx.quadraticCurveTo(cpX, y, x, y);
    }
  }

  ctx.closePath();
  ctx.fill();

  // Draw stroke
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, centerY);

  for (let i = 0; i < barCount; i++) {
    const x = i * sliceWidth;
    const amplitude = data[i] * canvas.height * 0.4;
    const y = centerY - amplitude;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
};

export const renderCircular = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: number[],
  barCount: number
) => {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) * 0.4;
  const maxBarHeight = Math.min(centerX, centerY) * 0.5;

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius,
    centerX,
    centerY,
    radius + maxBarHeight
  );
  gradient.addColorStop(0, "rgba(99, 102, 241, 0.8)");
  gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.8)");
  gradient.addColorStop(1, "rgba(236, 72, 153, 0.8)");

  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;

  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const barHeight = data[i] * maxBarHeight;

    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    const x2 = centerX + Math.cos(angle) * (radius + barHeight);
    const y2 = centerY + Math.sin(angle) * (radius + barHeight);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = gradient;
    ctx.stroke();
  }

  // Draw center circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(15, 15, 25, 0.8)";
  ctx.fill();
  ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
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
  logoImage?: HTMLImageElement | null
) => {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2; // Center vertically like original
  const maxRadius = Math.min(canvas.width, canvas.height) / 4;
  const minRadius = maxRadius / 5;
  const HALF_PI = Math.PI / 2;

  // Cache spectrum for ghost delays
  if (spectrumCache.length >= TRAP_NATION_GHOSTS.length) {
    spectrumCache.shift();
  }
  spectrumCache.push([...data]);

  // Calculate multiplier based on average spectrum intensity (like getMultiplier)
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

  // Draw ghosts from back to front
  for (let s = TRAP_NATION_GHOSTS.length - 1; s >= 0; s--) {
    const ghost = TRAP_NATION_GHOSTS[s];
    const cacheIndex = Math.max(spectrumCache.length - ghost.delay - 1, 0);
    const curSpectrum = spectrumCache[cacheIndex] || data;

    // Calculate points for the semicircle
    const points: { x: number; y: number }[] = [];
    const len = curSpectrum.length;

    for (let i = 0; i < len; i++) {
      const t = Math.PI * (i / (len - 1)) - HALF_PI;
      // Original used byte values (0-255) * 0.4, we have normalized (0-1)
      // So multiply by maxRadius * 0.3 to get visible frequency response
      const r =
        curRadius + Math.pow(curSpectrum[i] * maxRadius * 0.3, ghost.exponent);
      const x = r * Math.cos(t);
      const y = r * Math.sin(t);
      points.push({ x, y });
    }

    // Set ghost styling
    ctx.fillStyle = ghost.color;
    ctx.shadowColor = ghost.color;
    ctx.shadowBlur = ghost.blurRadius;

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
    const logoSize = curRadius * 2; // Logo size scales with audio intensity
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
