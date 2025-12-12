import { VisualizeFnProps } from "./shared";

// Particles - Dynamic audio-reactive particle system
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  type: "burst" | "orbit" | "trail";
}

const particleState: {
  particles: Particle[];
  orbitAngle: number;
  lastBeat: number;
  trailPoints: Array<{ x: number; y: number; age: number }>;
} = {
  particles: [],
  orbitAngle: 0,
  lastBeat: 0,
  trailPoints: [],
};

export default function renderParticles({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
  high = 0,
}: VisualizeFnProps) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const maxParticles = performanceMode ? 80 : 200;

  particleState.orbitAngle += 0.02 + avgIntensity * 0.03;

  // Burst particles on bass (kick drums)
  if (bass > 0.4 && Date.now() - particleState.lastBeat > 100) {
    const burstCount = performanceMode ? 8 : 20;
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 4 + bass * 10 + Math.random() * 4;
      particleState.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + bass * 5,
        life: 1.0,
        maxLife: 1.0,
        hue: 280 + Math.random() * 60,
        type: "burst",
      });
    }
    particleState.lastBeat = Date.now();
  }

  // Spawn ambient particles based on audio
  const spawnRate = Math.floor(avgIntensity * 4) + 1;
  for (
    let i = 0;
    i < spawnRate && particleState.particles.length < maxParticles;
    i++
  ) {
    const freqIndex = Math.floor(Math.random() * data.length);
    const intensity = data[freqIndex];

    if (intensity > 0.25) {
      const spawnType = Math.random();

      if (spawnType < 0.6) {
        // Orbiting particles
        const orbitRadius = 50 + Math.random() * 100;
        const angle = particleState.orbitAngle + Math.random() * Math.PI * 2;
        particleState.particles.push({
          x: centerX + Math.cos(angle) * orbitRadius,
          y: centerY + Math.sin(angle) * orbitRadius,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: 2 + intensity * 4,
          life: 1.0,
          maxLife: 1.0,
          hue: 260 + (freqIndex / data.length) * 80,
          type: "orbit",
        });
      } else {
        // Rising trail particles
        particleState.particles.push({
          x: centerX + (Math.random() - 0.5) * canvas.width * 0.6,
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 1,
          vy: -2 - intensity * 4 - Math.random() * 2,
          size: 2 + intensity * 3,
          life: 1.0,
          maxLife: 1.0,
          hue: 320 + Math.random() * 40,
          type: "trail",
        });
      }
    }
  }

  // Update and draw particles
  particleState.particles = particleState.particles.filter((p) => {
    // Update physics based on type
    if (p.type === "orbit") {
      // Orbital motion around center
      const dx = centerX - p.x;
      const dy = centerY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = 0.1 + avgIntensity * 0.15;

      // Tangential + slight inward force
      p.vx += (dy / dist) * force - (dx / dist) * 0.02;
      p.vy += (-dx / dist) * force - (dy / dist) * 0.02;
      p.vx *= 0.99;
      p.vy *= 0.99;
    } else if (p.type === "trail") {
      // Rising with slight wave
      p.vx += Math.sin(p.y * 0.02) * 0.1;
      p.vy *= 0.995;
    } else {
      // Burst - slow down
      p.vx *= 0.96;
      p.vy *= 0.96;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.type === "trail" ? 0.008 : 0.012;

    if (p.life <= 0) return false;
    if (p.y < -20 || p.x < -20 || p.x > canvas.width + 20) return false;

    const lifeRatio = p.life / p.maxLife;
    const currentSize = p.size * lifeRatio;

    // Draw glow first
    if (!performanceMode && currentSize > 2) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${lifeRatio * 0.2})`;
      ctx.fill();
    }

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
    const lightness = 55 + lifeRatio * 25;
    ctx.fillStyle = `hsla(${p.hue}, 90%, ${lightness}%, ${lifeRatio * 0.9})`;
    ctx.fill();

    // Bright core for burst particles
    if (p.type === "burst" && lifeRatio > 0.5) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${lifeRatio * 0.8})`;
      ctx.fill();
    }

    return true;
  });

  // Draw connecting lines between nearby orbit particles
  if (!performanceMode) {
    const orbitParticles = particleState.particles.filter(
      (p) => p.type === "orbit" && p.life > 0.3
    );
    for (let i = 0; i < orbitParticles.length; i++) {
      for (let j = i + 1; j < orbitParticles.length; j++) {
        const p1 = orbitParticles[i];
        const p2 = orbitParticles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80) {
          const alpha = (1 - dist / 80) * 0.3 * Math.min(p1.life, p2.life);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  // Center core
  const coreRadius = 20 + avgIntensity * 30 + beatIntensity * 20;

  const coreGlow = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    coreRadius * 2
  );
  coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.5 + avgIntensity * 0.3})`);
  coreGlow.addColorStop(
    0.3,
    `rgba(200, 100, 255, ${0.4 + avgIntensity * 0.3})`
  );
  coreGlow.addColorStop(0.6, `rgba(168, 85, 247, ${0.2 + avgIntensity * 0.2})`);
  coreGlow.addColorStop(1, "transparent");

  ctx.beginPath();
  ctx.arc(centerX, centerY, coreRadius * 2, 0, Math.PI * 2);
  ctx.fillStyle = coreGlow;
  ctx.fill();

  // Inner core
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreRadius * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + beatIntensity * 0.4})`;
  ctx.fill();

  // Orbiting rings
  if (!performanceMode) {
    for (let ring = 0; ring < 2; ring++) {
      const ringRadius = 60 + ring * 40 + avgIntensity * 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 + avgIntensity * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}
