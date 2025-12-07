import React, { useEffect, useRef } from "react";
import { EffectType } from "../types";

interface EffectsLayerProps {
  type: EffectType;
}

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
}

// Generic render functions
const renderRain: RenderFunction = (ctx, canvas, particles, config, extras) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw ripples with multiple expanding circles for realism
  if (config.hasRipples && extras?.ripples) {
    extras.ripples.forEach((ripple) => {
      const age = Date.now() - ripple.createdAt;
      const progress = ripple.radius / ripple.maxRadius;

      // Draw multiple concentric ripples
      for (let i = 0; i < 3; i++) {
        const offset = i * 8;
        const currentRadius = ripple.radius - offset;

        if (currentRadius > 0) {
          const rippleOpacity = ripple.opacity * (1 - i * 0.3) * (1 - progress);
          ctx.strokeStyle = `rgba(174, 194, 224, ${rippleOpacity})`;
          ctx.lineWidth = 1.5 - (i * 0.3);
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, currentRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Add small splash particles
      if (age < 100) {
        const splashCount = 4;
        for (let i = 0; i < splashCount; i++) {
          const angle = (Math.PI * 2 * i) / splashCount;
          const splashDist = age * 0.15;
          const splashX = ripple.x + Math.cos(angle) * splashDist;
          const splashY = ripple.y + Math.sin(angle) * splashDist - age * 0.1;
          const splashOpacity = ripple.opacity * (1 - age / 100);

          ctx.fillStyle = `rgba(174, 194, 224, ${splashOpacity})`;
          ctx.beginPath();
          ctx.arc(splashX, splashY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  // Draw rain with slight transparency gradient
  ctx.lineCap = "round";

  particles.forEach((p) => {
    p.y += p.speed;
    if (config.slant) p.x -= config.slant;

    if (p.y > canvas.height) {
      // Create ripple when rain hits bottom
      if (config.hasRipples && extras?.ripples) {
        extras.ripples.push({
          x: p.x,
          y: canvas.height,
          radius: 0,
          maxRadius: 12 + Math.random() * 8,
          opacity: 0.6 + Math.random() * 0.2,
          createdAt: Date.now(),
        });
      }

      p.y = -p.length;
      p.x = Math.random() * canvas.width;
    }
    if (p.x < 0) p.x = canvas.width;

    // Add gradient to rain drops for realism
    const gradient = ctx.createLinearGradient(
      p.x, p.y,
      p.x - (config.slant || 0), p.y + p.length
    );
    gradient.addColorStop(0, config.color?.replace('0.5', '0.2') || "rgba(174, 194, 224, 0.2)");
    gradient.addColorStop(1, config.color || "rgba(174, 194, 224, 0.5)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = config.lineWidth || 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - (config.slant || 0), p.y + p.length);
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
      const fadeOpacity = age > fadeStart
        ? s.opacity * (1 - (age - fadeStart) / ((config.stackDuration || 3000) * 0.3))
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

const renderLeaves: RenderFunction = (ctx, canvas, particles, config, extras) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw stacked leaves at bottom
  if (config.hasStacking && extras?.stacked) {
    extras.stacked.forEach((s) => {
      const age = Date.now() - s.createdAt;
      const fadeStart = (config.stackDuration || 3000) * 0.7;
      const fadeOpacity = age > fadeStart
        ? s.opacity * (1 - (age - fadeStart) / ((config.stackDuration || 3000) * 0.3))
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
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize * 3);
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
    count: 800,
    speedRange: { min: 10, max: 15 },
    sizeRange: { min: 1, max: 4 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderRain,
    color: "rgba(174, 194, 224, 0.5)",
    lineWidth: 2,
    slant: 1,
    hasRipples: true,
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

export const EffectsLayer: React.FC<EffectsLayerProps> = ({ type }) => {
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
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
