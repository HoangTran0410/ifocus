import { VisualizeFnProps } from "./shared";

// Particles - Audio-reactive particles
const particleState: {
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
  }>;
} = {
  particles: [],
};

export default function renderParticles({
  ctx,
  canvas,
  data,
  performanceMode = false,
}: VisualizeFnProps) {
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const maxParticles = performanceMode ? 50 : 150;

  // Spawn new particles based on audio intensity
  const spawnRate = Math.floor(avgIntensity * 5) + 1;
  for (
    let i = 0;
    i < spawnRate && particleState.particles.length < maxParticles;
    i++
  ) {
    const freqIndex = Math.floor(Math.random() * data.length);
    const intensity = data[freqIndex];
    if (intensity > 0.2) {
      particleState.particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * intensity * 8,
        vy: (Math.random() - 0.5) * intensity * 8,
        size: 2 + intensity * 6,
        life: 1.0,
      });
    }
  }

  particleState.particles = particleState.particles.filter((p) => {
    // Update position
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.015;
    p.vx *= 0.98;
    p.vy *= 0.98;

    if (p.life <= 0) return false;

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(168, 85, 247, ${p.life * 0.8})`;
    ctx.fill();

    if (!performanceMode && p.size > 4) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(236, 72, 153, ${p.life * 0.3})`;
      ctx.fill();
    }

    return true;
  });

  // Draw center glow
  if (!performanceMode) {
    const centerGlow = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      50 + avgIntensity * 100
    );
    centerGlow.addColorStop(
      0,
      `rgba(168, 85, 247, ${0.3 + avgIntensity * 0.4})`
    );
    centerGlow.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      50 + avgIntensity * 100,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = centerGlow;
    ctx.fill();
  }
}
