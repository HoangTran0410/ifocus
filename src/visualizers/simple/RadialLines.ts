import { VisualizeFnProps } from "../types";

// Radial Lines - Dynamic sun-burst with rotating layers
const radialState = {
  rotation: 0,
  pulsePhase: 0,
  innerRotation: 0,
};

export default function renderRadialLines({
  ctx,
  canvas,
  data,
  barCount,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
}: VisualizeFnProps) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(centerX, centerY) * 0.92;
  const minRadius = maxRadius * 0.12;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Update animations - bass drives rotation speed and pulse
  radialState.rotation += 0.003 + avgIntensity * 0.008 + bass * 0.02;
  radialState.innerRotation -= 0.005 + avgIntensity * 0.01;
  radialState.pulsePhase += 0.05 + bass * 0.12;

  const lineCount = performanceMode ? Math.min(barCount, 48) : barCount;

  // Outer glow rings
  if (!performanceMode) {
    for (let ring = 2; ring >= 0; ring--) {
      const ringRadius = maxRadius * (0.95 - ring * 0.08);
      const ringAlpha = 0.08 + avgIntensity * 0.1 - ring * 0.02;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(168, 85, 247, ${ringAlpha})`;
      ctx.lineWidth = 2 - ring * 0.5;
      ctx.stroke();
    }
  }

  // Draw secondary layer (shorter, different color, counter-rotating)
  if (!performanceMode) {
    const secondaryCount = Math.floor(lineCount / 2);
    for (let i = 0; i < secondaryCount; i++) {
      const angle =
        (i / secondaryCount) * Math.PI * 2 + radialState.innerRotation;
      const dataIndex = (i * 2) % data.length;
      const intensity = data[dataIndex] || avgIntensity;

      const innerStart = minRadius * 1.5;
      const lineLength = innerStart + intensity * maxRadius * 0.4;

      const x1 = centerX + Math.cos(angle) * innerStart;
      const y1 = centerY + Math.sin(angle) * innerStart;
      const x2 = centerX + Math.cos(angle) * lineLength;
      const y2 = centerY + Math.sin(angle) * lineLength;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `hsla(280, 80%, ${50 + intensity * 30}%, ${
        0.3 + intensity * 0.4
      })`;
      ctx.lineWidth = 1 + intensity * 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  // Draw main radial lines with wave effect
  for (let i = 0; i < lineCount; i++) {
    const baseAngle = (i / lineCount) * Math.PI * 2 - Math.PI / 2;
    const waveOffset = Math.sin(radialState.pulsePhase + i * 0.3) * 0.03;
    const angle = baseAngle + radialState.rotation + waveOffset;

    const dataIndex = Math.floor((i / lineCount) * data.length);
    const intensity = data[dataIndex] || avgIntensity;

    // Pulse effect on the line length
    const pulse = Math.sin(radialState.pulsePhase + i * 0.2) * 0.1;
    const lineLength =
      minRadius + (intensity + pulse) * (maxRadius - minRadius);

    const x1 = centerX + Math.cos(angle) * minRadius;
    const y1 = centerY + Math.sin(angle) * minRadius;
    const x2 = centerX + Math.cos(angle) * lineLength;
    const y2 = centerY + Math.sin(angle) * lineLength;

    // Color based on position and intensity
    const hue = 260 + (i / lineCount) * 60 + intensity * 30; // Purple to pink
    const lightness = 55 + intensity * 25;
    const alpha = 0.6 + intensity * 0.4;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsla(${hue}, 85%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = 2 + intensity * 4;
    ctx.lineCap = "round";
    ctx.stroke();

    // End particles on high intensity
    if (intensity > 0.5) {
      const particleSize = 2 + intensity * 4 + beatIntensity * 3;
      ctx.beginPath();
      ctx.arc(x2, y2, particleSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue + 20}, 100%, 75%, ${intensity})`;
      ctx.fill();

      // Glow
      if (!performanceMode && intensity > 0.7) {
        ctx.beginPath();
        ctx.arc(x2, y2, particleSize * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${intensity * 0.3})`;
        ctx.fill();
      }
    }
  }

  // Outer burst lines on beats
  if (beatIntensity > 0.4) {
    const burstCount = performanceMode ? 12 : 24;
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2 + radialState.rotation * 2;
      const burstLength = maxRadius * (0.85 + beatIntensity * 0.15);
      const burstStart = maxRadius * 0.7;

      const x1 = centerX + Math.cos(angle) * burstStart;
      const y1 = centerY + Math.sin(angle) * burstStart;
      const x2 = centerX + Math.cos(angle) * burstLength;
      const y2 = centerY + Math.sin(angle) * burstLength;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(255, 200, 255, ${beatIntensity * 0.6})`;
      ctx.lineWidth = 1 + beatIntensity * 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  // Animated center core
  const coreRadius =
    minRadius * (0.8 + avgIntensity * 0.3 + beatIntensity * 0.2);

  // Core glow
  const coreGlow = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    coreRadius * 1.5
  );
  coreGlow.addColorStop(0, `rgba(200, 150, 255, ${0.4 + avgIntensity * 0.4})`);
  coreGlow.addColorStop(0.5, `rgba(168, 85, 247, ${0.2 + avgIntensity * 0.2})`);
  coreGlow.addColorStop(1, "transparent");

  ctx.beginPath();
  ctx.arc(centerX, centerY, coreRadius * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = coreGlow;
  ctx.fill();

  // Solid core
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
  const coreGradient = ctx.createRadialGradient(
    centerX - coreRadius * 0.3,
    centerY - coreRadius * 0.3,
    0,
    centerX,
    centerY,
    coreRadius
  );
  coreGradient.addColorStop(
    0,
    `rgba(255, 255, 255, ${0.9 + avgIntensity * 0.1})`
  );
  coreGradient.addColorStop(
    0.4,
    `rgba(200, 150, 255, ${0.8 + avgIntensity * 0.2})`
  );
  coreGradient.addColorStop(
    1,
    `rgba(100, 50, 200, ${0.7 + avgIntensity * 0.3})`
  );
  ctx.fillStyle = coreGradient;
  ctx.fill();

  // Core ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + beatIntensity * 0.5})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}
