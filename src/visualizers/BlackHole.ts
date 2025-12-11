// 7. Black Hole - Audio-reactive black hole with accretion disk
const blackHoleState = {
  rotation: 0,
  particles: [] as Array<{
    angle: number;
    radius: number;
    speed: number;
    size: number;
    hue: number;
    opacity: number;
  }>,
};

export const renderBlackHole = (
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
  const eventHorizonRadius = maxRadius * 0.15 + avgIntensity * maxRadius * 0.05;

  // Update rotation
  blackHoleState.rotation += 0.02 + avgIntensity * 0.03;

  // Spawn particles for accretion disk
  const maxParticles = performanceMode ? 100 : 200;
  if (
    blackHoleState.particles.length < maxParticles &&
    Math.random() < 0.3 + avgIntensity * 0.5
  ) {
    blackHoleState.particles.push({
      angle: Math.random() * Math.PI * 2,
      radius: maxRadius * (0.6 + Math.random() * 0.4),
      speed: 0.01 + Math.random() * 0.02,
      size: 1 + Math.random() * 3,
      hue: 20 + Math.random() * 40, // Orange to red range
      opacity: 0.5 + Math.random() * 0.5,
    });
  }

  // Draw gravitational lensing effect (outer distortion rings)
  if (!performanceMode) {
    for (let ring = 5; ring >= 1; ring--) {
      const ringRadius = eventHorizonRadius * (1.5 + ring * 0.4);
      const distortion = Math.sin(blackHoleState.rotation * 2 + ring) * 0.1;

      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        ringRadius * (1 + distortion),
        ringRadius * (1 - distortion * 0.5),
        blackHoleState.rotation * 0.3,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = `rgba(147, 112, 219, ${0.05 + avgIntensity * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Draw accretion disk layers (from back to front)
  const diskLayers = performanceMode ? 3 : 5;
  for (let layer = diskLayers; layer >= 1; layer--) {
    const layerRadius = eventHorizonRadius * (2 + layer * 0.8);
    const layerWidth = maxRadius * 0.15;
    const tilt = 0.35; // Perspective tilt for the disk

    const diskGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      eventHorizonRadius,
      centerX,
      centerY,
      layerRadius + layerWidth
    );

    const intensity = (layer / diskLayers) * avgIntensity;
    diskGradient.addColorStop(
      0,
      `rgba(255, 100, 50, ${0.3 + intensity * 0.4})`
    );
    diskGradient.addColorStop(
      0.3,
      `rgba(255, 150, 50, ${0.2 + intensity * 0.3})`
    );
    diskGradient.addColorStop(
      0.6,
      `rgba(255, 200, 100, ${0.15 + intensity * 0.2})`
    );
    diskGradient.addColorStop(1, "rgba(255, 200, 100, 0)");

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(blackHoleState.rotation + layer * 0.1);
    ctx.scale(1, tilt);
    ctx.translate(-centerX, -centerY);

    ctx.beginPath();
    ctx.arc(centerX, centerY, layerRadius + layerWidth, 0, Math.PI * 2);
    ctx.fillStyle = diskGradient;
    ctx.fill();
    ctx.restore();
  }

  // Update and draw accretion disk particles
  blackHoleState.particles = blackHoleState.particles.filter((p) => {
    // Spiral inward
    p.angle += p.speed * (1 + (1 - p.radius / maxRadius) * 2);
    p.radius -= 0.5 + avgIntensity * 1.5;
    p.opacity -= 0.002;

    // Remove particles that reached event horizon or faded out
    if (p.radius <= eventHorizonRadius || p.opacity <= 0) return false;

    // Calculate position with perspective tilt
    const tilt = 0.35;
    const x = centerX + Math.cos(p.angle + blackHoleState.rotation) * p.radius;
    const y =
      centerY + Math.sin(p.angle + blackHoleState.rotation) * p.radius * tilt;

    // Draw particle
    const particleIntensity =
      1 - (p.radius - eventHorizonRadius) / (maxRadius - eventHorizonRadius);
    ctx.beginPath();
    ctx.arc(x, y, p.size * (1 + particleIntensity), 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue - particleIntensity * 20}, 100%, ${
      50 + particleIntensity * 30
    }%, ${p.opacity})`;
    ctx.fill();

    // Add glow for closer particles
    if (!performanceMode && particleIntensity > 0.5) {
      ctx.beginPath();
      ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.opacity * 0.3})`;
      ctx.fill();
    }

    return true;
  });

  // Draw frequency-reactive corona/jets
  if (!performanceMode) {
    for (let jet = 0; jet < 2; jet++) {
      const jetAngle = jet === 0 ? -Math.PI / 2 : Math.PI / 2;
      const jetLength = maxRadius * 0.5 * (0.3 + avgIntensity * 0.7);

      const jetGradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX,
        centerY + jetLength * (jet === 0 ? -1 : 1)
      );
      jetGradient.addColorStop(
        0,
        `rgba(200, 150, 255, ${0.4 + avgIntensity * 0.4})`
      );
      jetGradient.addColorStop(
        0.5,
        `rgba(150, 100, 255, ${0.2 + avgIntensity * 0.2})`
      );
      jetGradient.addColorStop(1, "rgba(100, 50, 200, 0)");

      ctx.beginPath();
      ctx.moveTo(centerX - eventHorizonRadius * 0.3, centerY);
      ctx.quadraticCurveTo(
        centerX,
        centerY + jetLength * 0.5 * (jet === 0 ? -1 : 1),
        centerX,
        centerY + jetLength * (jet === 0 ? -1 : 1)
      );
      ctx.quadraticCurveTo(
        centerX,
        centerY + jetLength * 0.5 * (jet === 0 ? -1 : 1),
        centerX + eventHorizonRadius * 0.3,
        centerY
      );
      ctx.fillStyle = jetGradient;
      ctx.fill();
    }
  }

  // Draw audio-reactive rings around event horizon
  const ringCount = performanceMode ? 3 : 6;
  for (let i = 0; i < ringCount; i++) {
    const dataIndex = Math.floor((i / ringCount) * data.length);
    const intensity = data[dataIndex] || 0;
    const ringRadius = eventHorizonRadius * (1.1 + i * 0.15 + intensity * 0.2);

    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, ${150 + i * 15}, ${50 + i * 20}, ${
      0.3 + intensity * 0.5
    })`;
    ctx.lineWidth = 1 + intensity * 2;
    ctx.stroke();
  }

  // Draw event horizon (the black hole center)
  const eventHorizonGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    eventHorizonRadius
  );
  eventHorizonGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
  eventHorizonGradient.addColorStop(0.7, "rgba(0, 0, 0, 1)");
  eventHorizonGradient.addColorStop(0.9, "rgba(20, 10, 30, 0.95)");
  eventHorizonGradient.addColorStop(1, "rgba(50, 30, 70, 0.8)");

  ctx.beginPath();
  ctx.arc(centerX, centerY, eventHorizonRadius, 0, Math.PI * 2);
  ctx.fillStyle = eventHorizonGradient;
  ctx.fill();

  // Draw photon sphere ring (bright ring just outside event horizon)
  if (!performanceMode) {
    ctx.shadowColor = `rgba(255, 200, 100, ${0.5 + avgIntensity * 0.5})`;
    ctx.shadowBlur = 15 + avgIntensity * 20;
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, eventHorizonRadius * 1.05, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 150, ${0.6 + avgIntensity * 0.4})`;
  ctx.lineWidth = 2 + avgIntensity * 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner glow at event horizon edge
  const innerGlow = ctx.createRadialGradient(
    centerX,
    centerY,
    eventHorizonRadius * 0.8,
    centerX,
    centerY,
    eventHorizonRadius * 1.2
  );
  innerGlow.addColorStop(0, "rgba(255, 150, 50, 0)");
  innerGlow.addColorStop(
    0.5,
    `rgba(255, 100, 50, ${0.2 + avgIntensity * 0.3})`
  );
  innerGlow.addColorStop(1, "rgba(255, 50, 0, 0)");

  ctx.beginPath();
  ctx.arc(centerX, centerY, eventHorizonRadius * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = innerGlow;
  ctx.fill();
};
