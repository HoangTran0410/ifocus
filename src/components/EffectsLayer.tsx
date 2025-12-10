import React, { useEffect, useRef } from "react";
import { EffectType } from "../types";

interface Particle {
  x: number;
  y: number;
  speed: number;
  length: number;
  size: number;
  angle: number;
  spin: number;
  opacity: number;
  oscillation: number;
  vx?: number; // velocity x for random walk
  vy?: number; // velocity y for random walk
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  createdAt: number;
}

interface StackedParticle {
  x: number;
  y: number;
  size: number;
  angle: number;
  opacity: number;
  createdAt: number;
  color: string;
}

type RenderFunction = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  particles: Particle[],
  config: EffectConfig,
  extras?: {
    ripples?: Ripple[];
    stacked?: StackedParticle[];
  }
) => void;

interface EffectConfig {
  count: number;
  speedRange: { min: number; max: number };
  sizeRange: { min: number; max: number };
  lengthRange?: { min: number; max: number };
  opacityRange: { min: number; max: number };
  renderFunction: RenderFunction;
  color?: string;
  lineWidth?: number;
  slant?: number;
  blur?: number;
  hasRipples?: boolean;
  hasStacking?: boolean;
  stackDuration?: number; // milliseconds
  hasLightning?: boolean; // for heavy rain
}

// Wind state for dynamic rain direction
let windStrength = 0;
let windTarget = 0;
let lastWindChange = 0;

// Lightning state
let lightningOpacity = 0;
let lastLightning = 0;
let lightningPhase = 0; // 0 = off, 1 = first flash, 2 = dim, 3 = second flash
let lightningBoltPath: { x: number; y: number }[] = [];
let lightningBranches: { x: number; y: number }[][] = [];

// Generate procedural lightning bolt path
function generateLightningBolt(canvasWidth: number, canvasHeight: number) {
  lightningBoltPath = [];
  lightningBranches = [];

  // Start from random position near top
  let x = canvasWidth * (0.2 + Math.random() * 0.6);
  let y = 0;

  lightningBoltPath.push({ x, y });

  // Generate main bolt path going downward
  const segments = 12 + Math.floor(Math.random() * 8);
  const segmentHeight = (canvasHeight * 0.7) / segments;

  for (let i = 0; i < segments; i++) {
    // Random horizontal offset with tendency to straighten near bottom
    const jitter = (1 - i / segments) * 80;
    x += (Math.random() - 0.5) * jitter;
    y += segmentHeight + Math.random() * 20;

    lightningBoltPath.push({ x, y });

    // Occasionally create a branch (30% chance)
    if (Math.random() < 0.3 && i > 2 && i < segments - 2) {
      const branch: { x: number; y: number }[] = [{ x, y }];
      let bx = x;
      let by = y;
      const branchSegments = 3 + Math.floor(Math.random() * 4);
      const direction = Math.random() < 0.5 ? -1 : 1;

      for (let j = 0; j < branchSegments; j++) {
        bx += direction * (20 + Math.random() * 30);
        by += 15 + Math.random() * 25;
        branch.push({ x: bx, y: by });
      }
      lightningBranches.push(branch);
    }
  }
}

// Generic render functions
const renderRain: RenderFunction = (ctx, canvas, particles, config, extras) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update wind - smoothly transition to target, occasionally change target
  const now = Date.now();
  if (now - lastWindChange > 3000 + Math.random() * 5000) {
    // Change wind direction every 3-8 seconds
    windTarget = (Math.random() - 0.5) * 4; // Wind range: -2 to +2
    lastWindChange = now;
  }
  // Smoothly interpolate wind strength toward target
  windStrength += (windTarget - windStrength) * 0.01;

  // Calculate dynamic slant based on base slant + wind
  const dynamicSlant = (config.slant || 0) + windStrength;

  // Lightning effect for heavy rain
  if (config.hasLightning) {
    const timeSinceLightning = now - lastLightning;

    // Trigger new lightning every 5-25 seconds
    if (
      timeSinceLightning > 5000 + Math.random() * 20000 &&
      lightningPhase === 0
    ) {
      lightningPhase = 1;
      lastLightning = now;
      // Generate new lightning bolt path
      generateLightningBolt(canvas.width, canvas.height);
    }

    // Multi-phase lightning animation
    if (lightningPhase > 0) {
      const phaseTime = now - lastLightning;

      if (phaseTime < 80) {
        // First flash
        lightningOpacity = 0.8 + Math.random() * 0.2;
      } else if (phaseTime < 200) {
        // Quick dim
        lightningOpacity = 0.2;
        lightningPhase = 2;
      } else if (phaseTime < 280 && lightningPhase === 2) {
        // Second flash
        lightningOpacity = 0.5 + Math.random() * 0.2;
        lightningPhase = 3;
      } else if (phaseTime < 500) {
        // Fade out
        lightningOpacity *= 0.9;
      } else {
        // Reset
        lightningOpacity = 0;
        lightningPhase = 0;
      }
    }

    // Draw lightning bolt
    if (lightningOpacity > 0.01 && lightningBoltPath.length > 0) {
      // Subtle background flash
      ctx.fillStyle = `rgba(200, 210, 255, ${lightningOpacity * 0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = `rgba(180, 200, 255, ${lightningOpacity})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${lightningOpacity * 0.8})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw main bolt
      ctx.beginPath();
      ctx.moveTo(lightningBoltPath[0].x, lightningBoltPath[0].y);
      for (let i = 1; i < lightningBoltPath.length; i++) {
        ctx.lineTo(lightningBoltPath[i].x, lightningBoltPath[i].y);
      }
      ctx.stroke();

      // Draw branches
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(200, 220, 255, ${lightningOpacity * 0.6})`;
      lightningBranches.forEach((branch) => {
        ctx.beginPath();
        ctx.moveTo(branch[0].x, branch[0].y);
        for (let i = 1; i < branch.length; i++) {
          ctx.lineTo(branch[i].x, branch[i].y);
        }
        ctx.stroke();
      });

      ctx.shadowBlur = 0;
    }
  }

  // Draw ripples - single expanding ring for realistic water effect
  if (config.hasRipples && extras?.ripples) {
    extras.ripples.forEach((ripple) => {
      const progress = ripple.radius / ripple.maxRadius;
      // Smooth fade out using easing
      const fadeOpacity = ripple.opacity * (1 - progress) * (1 - progress);

      if (fadeOpacity > 0.01) {
        ctx.strokeStyle = `rgba(200, 220, 255, ${fadeOpacity})`;
        ctx.lineWidth = Math.max(0.5, 1.5 * (1 - progress));
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  // Draw rain with slight transparency gradient
  ctx.lineCap = "round";

  particles.forEach((p) => {
    p.y += p.speed;
    // Apply dynamic wind to horizontal movement
    p.x -= dynamicSlant;

    if (p.y > canvas.height) {
      // Only create ripple occasionally (15% chance) for subtle effect
      if (config.hasRipples && extras?.ripples && Math.random() < 0.15) {
        extras.ripples.push({
          x: p.x,
          y: canvas.height - 2,
          radius: 0,
          maxRadius: 15 + Math.random() * 10,
          opacity: 0.3 + Math.random() * 0.2,
          createdAt: Date.now(),
        });
      }

      p.y = -p.length;
      p.x = Math.random() * canvas.width;
    }
    // Wrap around horizontally
    if (p.x < -20) p.x = canvas.width + 20;
    if (p.x > canvas.width + 20) p.x = -20;

    // Add gradient to rain drops for realism
    const gradient = ctx.createLinearGradient(
      p.x,
      p.y,
      p.x - dynamicSlant * 2,
      p.y + p.length
    );
    gradient.addColorStop(
      0,
      config.color?.replace("0.5", "0.2") || "rgba(174, 194, 224, 0.2)"
    );
    gradient.addColorStop(1, config.color || "rgba(174, 194, 224, 0.5)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = config.lineWidth || 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - dynamicSlant * 2, p.y + p.length);
    ctx.stroke();
  });
};

const renderSnow: RenderFunction = (ctx, canvas, particles, config, extras) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw stacked snow at bottom
  if (config.hasStacking && extras?.stacked) {
    extras.stacked.forEach((s) => {
      const age = Date.now() - s.createdAt;
      const fadeStart = (config.stackDuration || 3000) * 0.7;
      const fadeOpacity =
        age > fadeStart
          ? s.opacity *
            (1 - (age - fadeStart) / ((config.stackDuration || 3000) * 0.3))
          : s.opacity;

      ctx.globalAlpha = fadeOpacity;
      ctx.fillStyle = config.color || "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Draw falling snow
  ctx.fillStyle = config.color || "rgba(255, 255, 255, 0.8)";

  particles.forEach((p) => {
    p.y += p.speed;
    p.x += Math.sin(p.y * 0.01) * 0.5;

    if (p.y > canvas.height - 5) {
      // Stack at bottom
      if (config.hasStacking && extras?.stacked) {
        extras.stacked.push({
          x: p.x,
          y: canvas.height - p.size,
          size: p.size,
          angle: 0,
          opacity: p.opacity,
          createdAt: Date.now(),
          color: config.color || "rgba(255, 255, 255, 0.8)",
        });
      }

      p.y = -5;
      p.x = Math.random() * canvas.width;
    }

    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

const renderLeaves: RenderFunction = (
  ctx,
  canvas,
  particles,
  config,
  extras
) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw stacked leaves at bottom
  if (config.hasStacking && extras?.stacked) {
    extras.stacked.forEach((s) => {
      const age = Date.now() - s.createdAt;
      const fadeStart = (config.stackDuration || 3000) * 0.7;
      const fadeOpacity =
        age > fadeStart
          ? s.opacity *
            (1 - (age - fadeStart) / ((config.stackDuration || 3000) * 0.3))
          : s.opacity;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.fillStyle = s.color.replace(/,\s*$/, `, ${fadeOpacity})`);
      ctx.beginPath();
      ctx.ellipse(0, 0, s.size * 2, s.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // Draw falling leaves
  particles.forEach((p) => {
    p.y += p.speed * 0.5;
    p.x += Math.sin(p.y * 0.005 + p.angle) * 1;
    p.angle += p.spin;

    if (p.y > canvas.height - 10) {
      // Stack at bottom
      if (config.hasStacking && extras?.stacked) {
        extras.stacked.push({
          x: p.x,
          y: canvas.height - p.size,
          size: p.size,
          angle: p.angle,
          opacity: p.opacity,
          createdAt: Date.now(),
          color: config.color || "rgba(218, 165, 32,",
        });
      }

      p.y = -10;
      p.x = Math.random() * canvas.width;
      p.angle = Math.random() * Math.PI * 2;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = `${config.color} ${p.opacity})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
};

const renderFireflies: RenderFunction = (ctx, canvas, particles) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p) => {
    // Initialize velocities if not present
    if (p.vx === undefined) p.vx = (Math.random() - 0.5) * 2;
    if (p.vy === undefined) p.vy = (Math.random() - 0.5) * 2;

    // Random walk with smoothing
    // Add random acceleration
    p.vx += (Math.random() - 0.5) * 0.3;
    p.vy += (Math.random() - 0.5) * 0.3;

    // Apply damping to keep speed reasonable
    p.vx *= 0.95;
    p.vy *= 0.95;

    // Clamp velocity
    const maxSpeed = 2;
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > maxSpeed) {
      p.vx = (p.vx / speed) * maxSpeed;
      p.vy = (p.vy / speed) * maxSpeed;
    }

    // Update position with random walk
    p.x += p.vx;
    p.y += p.vy;

    // Add slight oscillation on top of random walk for organic feel
    p.oscillation += 0.02;
    p.x += Math.sin(p.oscillation * 0.5) * 0.2;
    p.y += Math.cos(p.oscillation * 0.3) * 0.2;

    // Soft boundaries - turn around when near edge
    const margin = 50;
    if (p.x < margin) p.vx += 0.2;
    if (p.x > canvas.width - margin) p.vx -= 0.2;
    if (p.y < margin) p.vy += 0.2;
    if (p.y > canvas.height - margin) p.vy -= 0.2;

    // Hard wrap around
    if (p.x > canvas.width + 20) p.x = -20;
    if (p.x < -20) p.x = canvas.width + 20;
    if (p.y > canvas.height + 20) p.y = -20;
    if (p.y < -20) p.y = canvas.height + 20;

    // Twinkle effect with more variation
    const twinkle = Math.abs(Math.sin(p.oscillation * 2)) * 0.7 + 0.3;
    const currentOpacity = p.opacity * twinkle;

    // Draw firefly with glow
    const glowSize = p.size * (1 + twinkle);

    // Outer glow
    const gradient = ctx.createRadialGradient(
      p.x,
      p.y,
      0,
      p.x,
      p.y,
      glowSize * 3
    );
    gradient.addColorStop(0, `rgba(255, 255, 150, ${currentOpacity * 0.8})`);
    gradient.addColorStop(0.4, `rgba(255, 255, 150, ${currentOpacity * 0.3})`);
    gradient.addColorStop(1, `rgba(255, 255, 150, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowSize * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core light
    ctx.fillStyle = `rgba(255, 255, 200, ${currentOpacity})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(255, 255, 150, 0.8)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
};

const renderClouds: RenderFunction = (ctx, canvas, particles, config) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = `blur(${config.blur || 60}px)`;
  ctx.fillStyle = config.color || "rgba(0, 0, 0, 1)";

  particles.forEach((p) => {
    p.x += p.speed;
    if (p.x > canvas.width + p.size) {
      p.x = -p.size;
    }

    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.filter = "none";
  ctx.globalAlpha = 1;
};

// Configuration for each effect type
const EFFECT_CONFIGS: Record<
  Exclude<EffectType, "none" | "sun-rays">,
  EffectConfig
> = {
  rain: {
    count: 300,
    speedRange: { min: 10, max: 15 },
    sizeRange: { min: 1, max: 4 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderRain,
    color: "rgba(174, 194, 224, 0.5)",
    lineWidth: 1,
    hasRipples: true,
  },
  "heavy-rain": {
    count: 500,
    speedRange: { min: 10, max: 15 },
    sizeRange: { min: 1, max: 4 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderRain,
    color: "rgba(174, 194, 224, 0.2)",
    lineWidth: 2,
    slant: 1,
    hasRipples: true,
    hasLightning: true,
  },
  snow: {
    count: 150,
    speedRange: { min: 1, max: 2 },
    sizeRange: { min: 1, max: 4 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderSnow,
    color: "rgba(255, 255, 255, 0.8)",
    hasStacking: true,
    stackDuration: 4000,
  },
  leaves: {
    count: 50,
    speedRange: { min: 1, max: 4 },
    sizeRange: { min: 2, max: 6 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderLeaves,
    color: "rgba(218, 165, 32,",
    hasStacking: true,
    stackDuration: 5000,
  },
  "cherry-blossom": {
    count: 50,
    speedRange: { min: 1, max: 4 },
    sizeRange: { min: 2, max: 4 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderLeaves,
    color: "rgba(255, 183, 197,",
    hasStacking: true,
    stackDuration: 5000,
  },
  fireflies: {
    count: 40,
    speedRange: { min: 0.5, max: 1 },
    sizeRange: { min: 1, max: 4 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderFireflies,
  },
  "cloud-shadows": {
    count: 6,
    speedRange: { min: 0.2, max: 0.4 },
    sizeRange: { min: 300, max: 700 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.15, max: 0.15 },
    renderFunction: renderClouds,
    color: "rgba(0, 0, 0, 1)",
    blur: 60,
  },
};

interface EffectsLayerProps {
  type: EffectType;
}

export default function EffectsLayer({ type }: EffectsLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const stackedRef = useRef<StackedParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || type === "none" || type === "sun-rays") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = EFFECT_CONFIGS[type];
    if (!config) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    // Initialize particles using config
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < config.count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed:
            Math.random() * (config.speedRange.max - config.speedRange.min) +
            config.speedRange.min,
          length: config.lengthRange
            ? Math.random() *
                (config.lengthRange.max - config.lengthRange.min) +
              config.lengthRange.min
            : 20,
          size:
            Math.random() * (config.sizeRange.max - config.sizeRange.min) +
            config.sizeRange.min,
          angle: Math.random() * Math.PI * 2,
          spin: Math.random() * 0.1 - 0.05,
          opacity:
            Math.random() *
              (config.opacityRange.max - config.opacityRange.min) +
            config.opacityRange.min,
          oscillation: Math.random() * Math.PI * 2,
        });
      }
    };

    initParticles();

    const render = () => {
      // Update ripples
      if (config.hasRipples) {
        ripplesRef.current.forEach((ripple) => {
          ripple.radius += 0.5;
          ripple.opacity -= 0.01;
        });
        // Remove old ripples
        ripplesRef.current = ripplesRef.current.filter(
          (r) => r.opacity > 0 && r.radius < r.maxRadius
        );
      }

      // Update stacked particles
      if (config.hasStacking) {
        const now = Date.now();
        stackedRef.current = stackedRef.current.filter(
          (s) => now - s.createdAt < (config.stackDuration || 3000)
        );
      }

      config.renderFunction(ctx, canvas, particles, config, {
        ripples: ripplesRef.current,
        stacked: stackedRef.current,
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
      ripplesRef.current = [];
      stackedRef.current = [];
    };
  }, [type]);

  if (type === "none" || type === "sun-rays") return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
