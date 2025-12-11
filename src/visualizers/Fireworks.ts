import { VisualizeFnProps } from "./shared";

// Fireworks - Exploding particles that react to audio peaks
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  trail: { x: number; y: number }[];
  isBeatParticle?: boolean;
}

interface Rocket {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
  trail: { x: number; y: number }[];
  isBeatRocket?: boolean;
}

const fireworksState = {
  particles: [] as Particle[],
  rockets: [] as Rocket[],
  lastBeatTime: 0,
  lastAmbientTime: 0,
  beatFlash: 0,
  lastCanvasHeight: 0, // Track canvas size to reset on resize
};

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#FF69B4",
  "#00CED1",
  "#FFD700",
  "#FF4500",
];

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default function renderFireworks({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
}: VisualizeFnProps) {
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const maxParticles = performanceMode ? 150 : 400;
  const now = Date.now();

  // Fixed physics values - NOT scaled by canvas size
  // This ensures consistent speed regardless of canvas dimensions
  const ROCKET_SPEED = 8;
  const ROCKET_GRAVITY = 0.15;
  const PARTICLE_SPEED = 4;
  const PARTICLE_GRAVITY = 0.1;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Reset state if canvas height changed significantly (resize detected)
  if (Math.abs(canvas.height - fireworksState.lastCanvasHeight) > 50) {
    fireworksState.rockets.length = 0;
    fireworksState.particles.length = 0;
    fireworksState.lastCanvasHeight = canvas.height;
  }

  // Update beat flash
  if (fireworksState.beatFlash > 0) {
    fireworksState.beatFlash -= 0.05;
  }

  // Launch rockets when beat is detected
  if (beatIntensity > 0.3 && now - fireworksState.lastBeatTime > 200) {
    fireworksState.lastBeatTime = now;
    fireworksState.beatFlash = beatIntensity;

    const rocketCount = Math.ceil(2 + beatIntensity * 3);
    for (let i = 0; i < rocketCount; i++) {
      fireworksState.rockets.push({
        x: canvas.width * (0.1 + Math.random() * 0.8),
        y: canvas.height,
        vy: -(ROCKET_SPEED + beatIntensity * 4 + Math.random() * 3),
        targetY: canvas.height * (0.15 + Math.random() * 0.35),
        color: randomColor(),
        trail: [],
        isBeatRocket: true,
      });
    }
  }

  // Continuous ambient rockets
  if (avgIntensity > 0.2 && now - fireworksState.lastAmbientTime > 400) {
    fireworksState.lastAmbientTime = now;
    fireworksState.rockets.push({
      x: canvas.width * (0.15 + Math.random() * 0.7),
      y: canvas.height,
      vy: -(ROCKET_SPEED * 0.7 + Math.random() * 2),
      targetY: canvas.height * (0.25 + Math.random() * 0.35),
      color: randomColor(),
      trail: [],
      isBeatRocket: false,
    });
  }

  // Draw beat flash effect
  if (fireworksState.beatFlash > 0 && !performanceMode) {
    const flashGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(canvas.width, canvas.height) * 0.6
    );
    flashGradient.addColorStop(
      0,
      `rgba(255, 200, 100, ${fireworksState.beatFlash * 0.5})`
    );
    flashGradient.addColorStop(
      0.5,
      `rgba(255, 100, 50, ${fireworksState.beatFlash * 0.15})`
    );
    flashGradient.addColorStop(1, "transparent");
    ctx.fillStyle = flashGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Update and draw rockets (iterate backwards for safe splice)
  for (let i = fireworksState.rockets.length - 1; i >= 0; i--) {
    const rocket = fireworksState.rockets[i];

    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 12) rocket.trail.shift();

    rocket.y += rocket.vy;
    rocket.vy += ROCKET_GRAVITY;

    // Draw rocket trail
    if (!performanceMode && rocket.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(rocket.trail[0].x, rocket.trail[0].y);
      rocket.trail.forEach((p) => ctx.lineTo(p.x, p.y));
      const trailGradient = ctx.createLinearGradient(
        rocket.trail[0].x,
        rocket.trail[0].y,
        rocket.x,
        rocket.y
      );
      trailGradient.addColorStop(0, "transparent");
      trailGradient.addColorStop(1, rocket.color);
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = rocket.isBeatRocket ? 3 : 2;
      ctx.stroke();
    }

    // Draw rocket head with glow
    const headSize = rocket.isBeatRocket ? 4 : 3;
    if (!performanceMode) {
      ctx.shadowColor = rocket.color;
      ctx.shadowBlur = 15;
    }
    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, headSize, 0, Math.PI * 2);
    ctx.fillStyle = "#FFF";
    ctx.fill();
    ctx.shadowBlur = 0;

    // Explode when reaching target
    if (rocket.y <= rocket.targetY || rocket.vy >= 0) {
      const baseCount = performanceMode ? 25 : 60;
      const particleCount = rocket.isBeatRocket ? baseCount * 1.5 : baseCount;
      const explosionSpeed = rocket.isBeatRocket ? 1.3 : 1;

      for (
        let j = 0;
        j < particleCount && fireworksState.particles.length < maxParticles;
        j++
      ) {
        const angle = (Math.PI * 2 * j) / particleCount + Math.random() * 0.3;
        const speed = (PARTICLE_SPEED + Math.random() * 3) * explosionSpeed;
        fireworksState.particles.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          color: rocket.color,
          size: rocket.isBeatRocket ? 4 : 3,
          trail: [],
          isBeatParticle: rocket.isBeatRocket,
        });
      }

      // Add explosion flash
      if (rocket.isBeatRocket && !performanceMode) {
        const flashSize = 40;
        ctx.beginPath();
        ctx.arc(rocket.x, rocket.y, flashSize, 0, Math.PI * 2);
        const flashGrad = ctx.createRadialGradient(
          rocket.x,
          rocket.y,
          0,
          rocket.x,
          rocket.y,
          flashSize
        );
        flashGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        flashGrad.addColorStop(0.5, `${rocket.color}80`);
        flashGrad.addColorStop(1, "transparent");
        ctx.fillStyle = flashGrad;
        ctx.fill();
      }

      // Remove rocket using splice
      fireworksState.rockets.splice(i, 1);
    }
  }

  // Update and draw particles (iterate backwards for safe splice)
  for (let i = fireworksState.particles.length - 1; i >= 0; i--) {
    const p = fireworksState.particles[i];

    if (!performanceMode) {
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.shift();
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vy += PARTICLE_GRAVITY;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= p.isBeatParticle ? 0.015 : 0.02;

    if (p.life <= 0) {
      // Remove dead particle using splice
      fireworksState.particles.splice(i, 1);
      continue;
    }

    const alpha = p.life;

    // Draw trail
    if (!performanceMode && p.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      p.trail.forEach((t) => ctx.lineTo(t.x, t.y));
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw particle with glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (!performanceMode && p.isBeatParticle && alpha > 0.4) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Enhanced ambient sparkles
  // if (!performanceMode) {
  //   const sparkleCount = Math.floor(3 + avgIntensity * 8 + beatIntensity * 10);
  //   for (let i = 0; i < sparkleCount; i++) {
  //     const x = Math.random() * canvas.width;
  //     const y = Math.random() * canvas.height;
  //     const size = 0.5 + Math.random() * 1.5;
  //     const sparkleAlpha = 0.2 + Math.random() * 0.4 + beatIntensity * 0.3;
  //     ctx.beginPath();
  //     ctx.arc(x, y, size, 0, Math.PI * 2);
  //     ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
  //     ctx.fill();
  //   }
  // }
}
