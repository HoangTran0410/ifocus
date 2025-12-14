import { VisualizeFnProps } from "../types";

// Geometric Kaleidoscope - Symmetric rotating patterns
const kaleidoState = {
  rotation: 0,
  pulsePhase: 0,
};

export default function renderFractal({
  ctx,
  canvas,
  data,
  performanceMode = false,
  bass = 0,
  mid = 0,
}: VisualizeFnProps) {
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const maxRadius = Math.min(centerX, centerY) * 0.95;

  // Update animation - bass drives rotation, mid drives pulse
  kaleidoState.rotation += 0.005 + avgIntensity * 0.01 + bass * 0.025;
  kaleidoState.pulsePhase += 0.03 + mid * 0.06;

  const segments = performanceMode ? 6 : 8;
  const layers = performanceMode ? 4 : 6;
  const angleStep = (Math.PI * 2) / segments;

  // Draw each layer from outer to inner
  for (let layer = layers - 1; layer >= 0; layer--) {
    const layerRatio = layer / layers;
    const baseRadius = maxRadius * (0.2 + layerRatio * 0.8);

    // Get audio data for this layer
    const dataIndex = Math.floor(layerRatio * data.length);
    const intensity = data[dataIndex] || avgIntensity;

    // Pulse effect
    const pulse = Math.sin(kaleidoState.pulsePhase + layer * 0.5) * 0.1;
    const layerRadius =
      baseRadius * (1 + pulse + intensity * 0.15 + bass * 0.1);

    // Layer color
    const hue = (260 + layer * 30 + kaleidoState.rotation * 20) % 360;
    const saturation = 70 + intensity * 30;
    const lightness = 40 + intensity * 25;
    const alpha = 0.5 + intensity * 0.4;

    // Counter-rotation for alternating layers
    const layerRotation = kaleidoState.rotation * (layer % 2 === 0 ? 1 : -0.7);

    // Draw symmetric shapes for each segment
    for (let seg = 0; seg < segments; seg++) {
      const segAngle = seg * angleStep + layerRotation;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(segAngle);

      // Draw geometric shape
      const shapeType = layer % 3;

      if (shapeType === 0) {
        // Triangle
        const triRadius = layerRadius * (0.3 + intensity * 0.15);
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const px = layerRadius * 0.5 + Math.cos(angle) * triRadius;
          const py = Math.sin(angle) * triRadius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else if (shapeType === 1) {
        // Diamond
        const diamSize = layerRadius * (0.25 + intensity * 0.1);
        ctx.beginPath();
        ctx.moveTo(layerRadius * 0.5, -diamSize);
        ctx.lineTo(layerRadius * 0.5 + diamSize * 0.6, 0);
        ctx.lineTo(layerRadius * 0.5, diamSize);
        ctx.lineTo(layerRadius * 0.5 - diamSize * 0.6, 0);
        ctx.closePath();
      } else {
        // Arc segment
        const arcRadius = layerRadius * (0.2 + intensity * 0.1);
        ctx.beginPath();
        ctx.arc(layerRadius * 0.5, 0, arcRadius, 0, Math.PI, false);
        ctx.closePath();
      }

      // Fill with gradient
      if (!performanceMode) {
        const gradient = ctx.createRadialGradient(
          layerRadius * 0.5,
          0,
          0,
          layerRadius * 0.5,
          0,
          layerRadius * 0.3
        );
        gradient.addColorStop(
          0,
          `hsla(${hue + 20}, ${saturation}%, ${lightness + 20}%, ${alpha})`
        );
        gradient.addColorStop(
          1,
          `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.6})`
        );
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${
          alpha * 0.8
        })`;
      }
      ctx.fill();

      // Glow effect
      if (!performanceMode && intensity > 0.3) {
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
        ctx.shadowBlur = 8 + intensity * 12;
      }

      ctx.strokeStyle = `hsla(${hue + 30}, ${saturation + 20}%, ${
        lightness + 15
      }%, ${alpha})`;
      ctx.lineWidth = 1 + intensity * 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  }

  // Center orb
  const orbRadius = 20 + avgIntensity * 25 + bass * 20;
  const orbGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    orbRadius
  );
  orbGradient.addColorStop(
    0,
    `rgba(255, 255, 255, ${0.9 + avgIntensity * 0.1})`
  );
  orbGradient.addColorStop(
    0.3,
    `hsla(280, 80%, 70%, ${0.7 + avgIntensity * 0.3})`
  );
  orbGradient.addColorStop(
    0.7,
    `hsla(260, 70%, 50%, ${0.4 + avgIntensity * 0.3})`
  );
  orbGradient.addColorStop(1, "transparent");

  ctx.beginPath();
  ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
  ctx.fillStyle = orbGradient;
  ctx.fill();

  // Outer glow ring
  if (!performanceMode) {
    const ringRadius = maxRadius * (0.9 + avgIntensity * 0.1);
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(280, 80%, 60%, ${0.2 + avgIntensity * 0.3})`;
    ctx.lineWidth = 2 + bass * 3;
    ctx.shadowColor = `hsla(280, 100%, 70%, 0.8)`;
    ctx.shadowBlur = 15 + avgIntensity * 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Particles on beats
  if (!performanceMode && bass > 0.4) {
    const particleCount = Math.floor(bass * 15);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = maxRadius * (0.3 + Math.random() * 0.6);
      const px = centerX + Math.cos(angle) * dist;
      const py = centerY + Math.sin(angle) * dist;
      const size = 2 + Math.random() * 4;
      const hue = 260 + Math.random() * 60;

      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${0.4 + bass * 0.4})`;
      ctx.fill();
    }
  }
}
