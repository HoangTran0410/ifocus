import { VisualizeFnProps } from "./shared";

// Hexagon Grid - Honeycomb pattern with multiple pulsing rings
interface Pulse {
  x: number;
  y: number;
  startTime: number;
}

const hexState = {
  time: 0,
  pulses: [] as Pulse[],
  lastBeat: 0,
};

// Pre-calculate hexagon vertices for reuse
const HEX_ANGLES = Array.from({ length: 6 }, (_, i) => ({
  cos: Math.cos((Math.PI / 3) * i - Math.PI / 6),
  sin: Math.sin((Math.PI / 3) * i - Math.PI / 6),
}));

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.beginPath();
  ctx.moveTo(x + size * HEX_ANGLES[0].cos, y + size * HEX_ANGLES[0].sin);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(x + size * HEX_ANGLES[i].cos, y + size * HEX_ANGLES[i].sin);
  }
  ctx.closePath();
}

export default function renderHexagons({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
}: VisualizeFnProps) {
  const width = canvas.width;
  const height = canvas.height;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  hexState.time += 0.03 + avgIntensity * 0.02;

  const now = Date.now();

  // Add new pulse on beats
  if (beatIntensity > 0.6 && now - hexState.lastBeat > 150) {
    hexState.pulses.push({
      x: Math.random() * width,
      y: Math.random() * height,
      startTime: now,
    });
    hexState.lastBeat = now;
  }

  // Remove expired pulses (older than 1.5 seconds)
  hexState.pulses = hexState.pulses.filter((p) => now - p.startTime < 1500);

  // Limit max pulses to prevent performance issues
  const maxPulses = performanceMode ? 3 : 6;
  if (hexState.pulses.length > maxPulses) {
    hexState.pulses = hexState.pulses.slice(-maxPulses);
  }

  // Hexagon grid settings
  const hexSize = performanceMode ? 45 : 35;
  const hexWidth = hexSize * 2;
  const hexHeight = hexSize * 1.732;

  const cols = Math.ceil(width / (hexWidth * 0.75)) + 2;
  const rows = Math.ceil(height / (hexHeight * 0.5)) + 2;

  // Pre-calculate center values
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  // Pre-calculate pulse data for this frame
  const activePulses = hexState.pulses
    .map((p) => {
      const age = (now - p.startTime) / 1000;
      return {
        x: p.x,
        y: p.y,
        radius: age * 350,
        alpha: 1 - age / 1.5,
      };
    })
    .filter((p) => p.alpha > 0);

  ctx.shadowBlur = 0;

  for (let row = -1; row < rows; row++) {
    const offsetX = row % 2 === 0 ? 0 : hexWidth * 0.375;
    const y = row * hexHeight * 0.5;

    for (let col = -1; col < cols; col++) {
      const x = col * hexWidth * 0.75 + offsetX;

      // Skip hexagons outside canvas
      if (
        x < -hexSize ||
        x > width + hexSize ||
        y < -hexSize ||
        y > height + hexSize
      ) {
        continue;
      }

      // Distance calculations
      const dx = x - centerX;
      const dy = y - centerY;
      const normalizedDist = Math.sqrt(dx * dx + dy * dy) / maxDist;

      // Audio data
      const dataIndex = Math.floor(((col + row) / (cols + rows)) * data.length);
      const intensity = data[Math.abs(dataIndex) % data.length] || avgIntensity;

      // Calculate combined pulse effect from all active pulses
      let pulseEffect = 0;
      for (const pulse of activePulses) {
        const pdx = x - pulse.x;
        const pdy = y - pulse.y;
        const distFromPulse = Math.sqrt(pdx * pdx + pdy * pdy);
        const pulseDiff = Math.abs(distFromPulse - pulse.radius);
        if (pulseDiff < 60) {
          pulseEffect = Math.max(
            pulseEffect,
            (1 - pulseDiff / 60) * pulse.alpha
          );
        }
      }

      // Animation wave
      const wave = Math.sin(hexState.time + normalizedDist * 2) * 0.15;
      const animatedIntensity = intensity + wave;

      // Size variation
      const sizeMultiplier =
        0.75 + animatedIntensity * 0.35 + pulseEffect * 0.25;
      const currentSize = hexSize * sizeMultiplier;

      // Color
      const hue = 220 + normalizedDist * 50 + intensity * 35;
      const saturation = 65 + intensity * 35;
      const lightness = 35 + animatedIntensity * 30 + pulseEffect * 20;
      const alpha = 0.45 + animatedIntensity * 0.45 + pulseEffect * 0.25;

      // Draw hexagon
      drawHexagon(ctx, x, y, currentSize);

      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue + 25}, ${saturation + 15}%, ${
        lightness + 15
      }%, ${alpha * 0.9})`;
      ctx.lineWidth = 1 + intensity * 0.5;
      ctx.stroke();
    }
  }

  // Draw pulse glow rings
  if (!performanceMode) {
    for (const pulse of activePulses) {
      const gradient = ctx.createRadialGradient(
        pulse.x,
        pulse.y,
        Math.max(0, pulse.radius - 40),
        pulse.x,
        pulse.y,
        pulse.radius + 40
      );
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(0.4, `rgba(100, 150, 255, ${pulse.alpha * 0.3})`);
      gradient.addColorStop(0.6, `rgba(150, 100, 255, ${pulse.alpha * 0.3})`);
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Center ambient glow
  if (!performanceMode && avgIntensity > 0.2) {
    const centerGlow = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(width, height) / 3
    );
    centerGlow.addColorStop(0, `rgba(100, 150, 255, ${avgIntensity * 0.12})`);
    centerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);
  }
}
