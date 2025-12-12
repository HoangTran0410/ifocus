import { VisualizeFnProps } from "../types";

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

const spectrumCache: number[][] = [];

export default function renderTrapNation({
  ctx,
  canvas,
  data,
  logoImage,
  performanceMode = false,
  bass = 0,
}: VisualizeFnProps) {
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
  // Add bass pulse to radius
  const curRadius =
    multiplier * (maxRadius - minRadius) + minRadius + bass * maxRadius * 0.1;

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
}
