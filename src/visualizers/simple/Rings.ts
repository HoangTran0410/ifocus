import { VisualizeFnProps } from "../types";

// Concentric Rings - Pulsing rings that react to audio frequencies
const ringsState = {
  rotation: 0,
  pulsePhase: 0,
};

export default function renderRings({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
}: VisualizeFnProps) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(centerX, centerY) * 0.9;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Speed up rotation on bass
  ringsState.rotation += 0.005 + avgIntensity * 0.02 + bass * 0.06;
  ringsState.pulsePhase += 0.05 + bass * 0.15;

  const ringCount = performanceMode ? 5 : 8;
  const segmentsPerRing = performanceMode ? 32 : 64;

  // Beat-reactive radius expansion on bass
  const beatExpansion = bass * maxRadius * 0.15;

  // Draw from outer to inner for proper layering
  for (let ring = ringCount - 1; ring >= 0; ring--) {
    const ringRatio = ring / ringCount;
    const baseRadius = maxRadius * (0.2 + ringRatio * 0.8) + beatExpansion;
    const dataIndex = Math.floor(ringRatio * data.length);
    const intensity = data[dataIndex] || avgIntensity;

    // Ring color based on frequency band
    const hue = 260 - ringRatio * 60; // Purple to pink
    const saturation = 70 + intensity * 30;
    const lightness = 50 + intensity * 20;

    // Draw segmented ring
    ctx.beginPath();
    for (let i = 0; i < segmentsPerRing; i++) {
      const segmentRatio = i / segmentsPerRing;
      const angle =
        segmentRatio * Math.PI * 2 +
        ringsState.rotation * (ring % 2 === 0 ? 1 : -1);

      // Audio-reactive radius variation
      const segmentDataIndex = Math.floor(segmentRatio * data.length);
      const segmentIntensity = data[segmentDataIndex] || avgIntensity;

      // Add pulse effect
      const pulseOffset = Math.sin(ringsState.pulsePhase + ring * 0.5) * 5;
      const radiusVariation = segmentIntensity * maxRadius * 0.15;
      const radius = baseRadius + radiusVariation + pulseOffset;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Ring stroke with glow
    if (!performanceMode && intensity > 0.3) {
      ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.8)`;
      ctx.shadowBlur = 15 + intensity * 10;
    }

    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${
      0.5 + intensity * 0.5
    })`;
    ctx.lineWidth = 2 + intensity * 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw dots at high-intensity points
    if (!performanceMode) {
      for (let i = 0; i < segmentsPerRing; i += 4) {
        const segmentRatio = i / segmentsPerRing;
        const segmentDataIndex = Math.floor(segmentRatio * data.length);
        const segmentIntensity = data[segmentDataIndex] || avgIntensity;

        if (segmentIntensity > 0.5) {
          const angle =
            segmentRatio * Math.PI * 2 +
            ringsState.rotation * (ring % 2 === 0 ? 1 : -1);
          const pulseOffset = Math.sin(ringsState.pulsePhase + ring * 0.5) * 5;
          const radius =
            baseRadius + segmentIntensity * maxRadius * 0.15 + pulseOffset;

          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.arc(x, y, 2 + segmentIntensity * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue + 30}, 90%, 70%, ${segmentIntensity})`;
          ctx.fill();
        }
      }
    }
  }

  // Center orb - pulses with beat
  const orbRadius = 20 + avgIntensity * 30 + beatIntensity * 25;
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

  // Outer glow
  if (!performanceMode) {
    ctx.shadowColor = "rgba(168, 85, 247, 0.5)";
    ctx.shadowBlur = 30 + avgIntensity * 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
