import { VisualizeFnProps } from "./shared";

// Galaxy/Spiral - Rotating spiral pattern
const galaxyState = { rotation: 0 };

export default function renderGalaxy({
  ctx,
  canvas,
  data,
  performanceMode = false,
  bass = 0,
}: VisualizeFnProps) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(centerX, centerY) * 0.85;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Update rotation - bass makes it spin faster
  galaxyState.rotation += 0.01 + avgIntensity * 0.02 + bass * 0.02;

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
}
