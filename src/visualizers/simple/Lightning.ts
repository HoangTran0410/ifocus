import { VisualizeFnProps } from "../types";

// Lightning effect - Bolts that grow/animate from top to bottom
interface LightningBolt {
  segments: Array<{ x: number; y: number }>;
  currentLength: number; // How many segments are visible (grows over time)
  maxLength: number;
  alpha: number;
  hue: number;
  width: number;
  speed: number; // How fast this bolt grows
}

const lightningState: {
  bolts: LightningBolt[];
  lastBeat: number;
  electricField: Array<{ x: number; y: number; age: number }>;
} = {
  bolts: [],
  lastBeat: 0,
  electricField: [],
};

function generateBoltPath(
  startX: number,
  startY: number,
  endY: number,
  intensity: number
): Array<{ x: number; y: number }> {
  const segments: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  let currentX = startX;
  let currentY = startY;
  const segmentLength = 12 + Math.random() * 8;

  while (currentY < endY) {
    currentY += segmentLength;
    // Horizontal displacement
    const displacement = (Math.random() - 0.5) * (40 + intensity * 50);
    currentX += displacement;
    segments.push({ x: currentX, y: currentY });
  }

  return segments;
}

function createGrowingBolt(
  startX: number,
  endY: number,
  intensity: number
): LightningBolt {
  const segments = generateBoltPath(startX, -10, endY, intensity);

  return {
    segments,
    currentLength: 1, // Start with just the first segment
    maxLength: segments.length,
    alpha: 1,
    hue: 180 + Math.random() * 60,
    width: 2 + intensity * 3,
    speed: 3 + intensity * 4 + Math.random() * 2, // Segments per frame
  };
}

export default function renderLightning({
  ctx,
  canvas,
  data,
  performanceMode = false,
  bass = 0,
}: VisualizeFnProps) {
  const width = canvas.width;
  const height = canvas.height;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Spawn bolts on bass (kick drums)
  if (bass > 0.35 && Date.now() - lightningState.lastBeat > 120) {
    const numBolts = performanceMode ? 1 : Math.floor(1 + bass * 2);
    for (let i = 0; i < numBolts; i++) {
      const startX = width * 0.2 + Math.random() * width * 0.6;
      const endY = height * (0.5 + Math.random() * 0.5);
      lightningState.bolts.push(createGrowingBolt(startX, endY, bass));
    }

    // Electric particles on beat
    const particleCount = Math.floor(bass * 12);
    for (let i = 0; i < particleCount; i++) {
      lightningState.electricField.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.7,
        age: 0,
      });
    }

    lightningState.lastBeat = Date.now();
  }

  // Random ambient lightning (less frequent)
  if (Math.random() < 0.015 + avgIntensity * 0.02) {
    const startX = width * 0.1 + Math.random() * width * 0.8;
    const endY = height * (0.3 + Math.random() * 0.4);
    lightningState.bolts.push(
      createGrowingBolt(startX, endY, avgIntensity * 0.6)
    );
  }

  // Draw electric field particles
  lightningState.electricField = lightningState.electricField.filter((p) => {
    p.age += 0.06;
    if (p.age > 1) return false;

    const alpha = 1 - p.age;
    const size = 1.5 + (1 - p.age) * 2;

    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150, 200, 255, ${alpha * 0.7})`;
    ctx.fill();

    return true;
  });

  // Draw and update bolts
  lightningState.bolts = lightningState.bolts.filter((bolt) => {
    if (bolt.alpha <= 0) return false;

    // Grow the bolt
    if (bolt.currentLength < bolt.maxLength) {
      bolt.currentLength = Math.min(
        bolt.currentLength + bolt.speed,
        bolt.maxLength
      );
    }

    const visibleSegments = Math.floor(bolt.currentLength);
    if (visibleSegments < 2) return true; // Need at least 2 points to draw

    // Draw the visible portion of the bolt
    ctx.beginPath();
    ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);

    for (let i = 1; i < visibleSegments; i++) {
      ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
    }

    // Interpolate to the current growth point for smooth animation
    if (visibleSegments < bolt.segments.length) {
      const fraction = bolt.currentLength - visibleSegments;
      const prev = bolt.segments[visibleSegments - 1];
      const next = bolt.segments[visibleSegments];
      const interpX = prev.x + (next.x - prev.x) * fraction;
      const interpY = prev.y + (next.y - prev.y) * fraction;
      ctx.lineTo(interpX, interpY);
    }

    // Glow effect
    if (!performanceMode) {
      ctx.shadowColor = `hsla(${bolt.hue}, 100%, 70%, ${bolt.alpha})`;
      ctx.shadowBlur = 20 + bass * 15;
    }

    ctx.strokeStyle = `hsla(${bolt.hue}, 100%, 75%, ${bolt.alpha})`;
    ctx.lineWidth = bolt.width * bolt.alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Bright core
    if (!performanceMode && bolt.alpha > 0.5) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha * 0.8})`;
      ctx.lineWidth = bolt.width * 0.35 * bolt.alpha;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Draw glowing tip at the growth point
    if (bolt.currentLength < bolt.maxLength) {
      const tipIndex = Math.min(visibleSegments, bolt.segments.length - 1);
      const fraction = bolt.currentLength - Math.floor(bolt.currentLength);
      let tipX, tipY;

      if (tipIndex < bolt.segments.length - 1) {
        const prev = bolt.segments[tipIndex];
        const next = bolt.segments[tipIndex + 1];
        tipX = prev.x + (next.x - prev.x) * fraction;
        tipY = prev.y + (next.y - prev.y) * fraction;
      } else {
        tipX = bolt.segments[tipIndex].x;
        tipY = bolt.segments[tipIndex].y;
      }

      // Glowing tip
      const tipGlow = ctx.createRadialGradient(
        tipX,
        tipY,
        0,
        tipX,
        tipY,
        15 + bass * 10
      );
      tipGlow.addColorStop(0, `hsla(${bolt.hue}, 100%, 90%, ${bolt.alpha})`);
      tipGlow.addColorStop(
        0.3,
        `hsla(${bolt.hue}, 100%, 70%, ${bolt.alpha * 0.6})`
      );
      tipGlow.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(tipX, tipY, 15 + bass * 10, 0, Math.PI * 2);
      ctx.fillStyle = tipGlow;
      ctx.fill();
    }

    // Start fading only after fully grown
    if (bolt.currentLength >= bolt.maxLength) {
      bolt.alpha -= performanceMode ? 0.06 : 0.035;
    }

    return bolt.alpha > 0;
  });

  // Ambient glow at top
  if (!performanceMode) {
    const topGlow = ctx.createLinearGradient(0, 0, 0, 60);
    topGlow.addColorStop(
      0,
      `rgba(100, 150, 255, ${0.1 + avgIntensity * 0.15})`
    );
    topGlow.addColorStop(1, "transparent");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, 60);
  }

  // Subtle flash on strong beats
  if (bass > 0.7) {
    const flashAlpha = (bass - 0.7) * 0.25;
    ctx.fillStyle = `rgba(180, 220, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, width, height);
  }
}
