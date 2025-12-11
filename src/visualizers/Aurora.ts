import { VisualizeFnProps } from "./shared";

// Aurora Borealis - Flowing northern lights effect
const auroraState = {
  time: 0,
  waves: [] as { offset: number; speed: number; amplitude: number }[],
};

export default function renderAurora({
  ctx,
  canvas,
  data,
  performanceMode = false,
}: VisualizeFnProps) {
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  auroraState.time += 0.02;

  // Initialize waves
  const waveCount = performanceMode ? 4 : 5;
  if (auroraState.waves.length !== waveCount) {
    auroraState.waves = Array.from({ length: waveCount }, (_, i) => ({
      offset: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.02,
      amplitude: 0.3 + Math.random() * 0.4,
    }));
  }

  // Dark gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, "#000011");
  bgGradient.addColorStop(0.5, "#001122");
  bgGradient.addColorStop(1, "#000000");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Aurora colors
  const auroraColors = [
    { h: 120, s: 80, l: 50 }, // Green
    { h: 160, s: 70, l: 45 }, // Teal
    { h: 280, s: 60, l: 55 }, // Purple
    { h: 200, s: 75, l: 50 }, // Blue
    { h: 340, s: 65, l: 50 }, // Pink
  ];

  // Draw aurora layers
  auroraState.waves.forEach((wave, layerIndex) => {
    const color = auroraColors[layerIndex % auroraColors.length];
    const layerOffset = layerIndex * 0.15;
    const baseY = canvas.height * (0.2 + layerOffset);
    const dataOffset = Math.floor((layerIndex / waveCount) * data.length);

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    const segments = performanceMode ? 30 : 60;
    const rawPoints: { x: number; y: number }[] = [];

    // Generate raw points using raw data (full intensity)
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * canvas.width;
      const dataIndex = Math.floor((i / segments) * data.length);
      const intensity =
        data[(dataIndex + dataOffset) % data.length] || avgIntensity;

      // Multiple sine waves combined
      const wave1 = Math.sin(
        auroraState.time * wave.speed * 50 + x * 0.01 + wave.offset
      );
      const wave2 =
        Math.sin(
          auroraState.time * wave.speed * 30 + x * 0.02 + wave.offset * 2
        ) * 0.5;
      const wave3 =
        Math.sin(auroraState.time * wave.speed * 70 + x * 0.005) * 0.3;

      const waveValue = (wave1 + wave2 + wave3) * wave.amplitude;
      const heightVariation = intensity * canvas.height * 0.3;

      const y = baseY + waveValue * 50 - heightVariation;
      rawPoints.push({ x, y });
    }

    // Apply spatial smoothing (weighted moving average) to smooth neighboring points
    const smoothRadius = 3; // Number of neighbors on each side
    const points: { x: number; y: number }[] = rawPoints.map((p, i) => {
      let sumY = 0;
      let totalWeight = 0;

      for (let j = -smoothRadius; j <= smoothRadius; j++) {
        const idx = Math.max(0, Math.min(rawPoints.length - 1, i + j));
        // Gaussian-like weight: closer neighbors have more influence
        const weight = 1 / (1 + Math.abs(j));
        sumY += rawPoints[idx].y * weight;
        totalWeight += weight;
      }

      return { x: p.x, y: sumY / totalWeight };
    });

    // Draw the filled shape using Catmull-Rom spline for smooth curves
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(points[0].x, points[0].y);

    // Catmull-Rom spline interpolation for smooth curves through all points
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Control points for cubic bezier derived from Catmull-Rom
      const tension = 0.5; // Smoothness factor (0.5 is standard Catmull-Rom)
      const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
      const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
      const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
      const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, baseY - 100, 0, canvas.height);
    gradient.addColorStop(
      0,
      `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.6 + avgIntensity * 0.3})`
    );
    gradient.addColorStop(
      0.3,
      `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.3 + avgIntensity * 0.2})`
    );
    gradient.addColorStop(
      0.7,
      `hsla(${color.h + 20}, ${color.s}%, ${color.l - 10}%, 0.1)`
    );
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.fill();

    // Add glow effect
    if (!performanceMode) {
      ctx.shadowColor = `hsla(${color.h}, ${color.s}%, ${color.l + 20}%, 0.5)`;
      ctx.shadowBlur = 30 + avgIntensity * 20;

      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, ${color.l + 30}%, ${
        0.3 + avgIntensity * 0.4
      })`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    wave.offset += wave.speed * (1 + avgIntensity);
  });

  // Add stars - randomly scattered with twinkling
  // if (!performanceMode) {
  //   const starCount = 40;
  //   for (let i = 0; i < starCount; i++) {
  //     // Use prime-based pseudo-random for consistent but scattered positions
  //     const seed = i * 7919;
  //     const hash1 = ((seed * 15731 + 789221) * seed) % 1000000;
  //     const hash2 = ((seed * 23497 + 321139) * seed) % 1000000;

  //     const x = (hash1 / 1000000) * canvas.width;
  //     const y = (hash2 / 1000000) * canvas.height * 0.5; // Upper half only

  //     // Twinkling effect - each star twinkles at different rate
  //     const twinkleSpeed = 2 + (i % 5);
  //     const twinkleOffset = i * 0.7;
  //     const twinkle =
  //       Math.sin(auroraState.time * twinkleSpeed + twinkleOffset) * 0.5 + 0.5;
  //     const size = 0.5 + twinkle * 1.5;

  //     ctx.beginPath();
  //     ctx.arc(x, y, size, 0, Math.PI * 2);
  //     ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + twinkle * 0.8})`;
  //     ctx.fill();
  //   }
  // }
}
