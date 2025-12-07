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
}

type RenderFunction = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  particles: Particle[],
  config: EffectConfig
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
}

// Generic render functions
const renderRain: RenderFunction = (ctx, canvas, particles, config) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = config.color || "rgba(174, 194, 224, 0.5)";
  ctx.lineWidth = config.lineWidth || 1;
  ctx.lineCap = "round";

  particles.forEach((p) => {
    p.y += p.speed;
    if (config.slant) p.x -= config.slant;

    if (p.y > canvas.height) {
      p.y = -p.length;
      p.x = Math.random() * canvas.width;
    }
    if (p.x < 0) p.x = canvas.width;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - (config.slant || 0), p.y + p.length);
    ctx.stroke();
  });
};

const renderSnow: RenderFunction = (ctx, canvas, particles, config) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = config.color || "rgba(255, 255, 255, 0.8)";

  particles.forEach((p) => {
    p.y += p.speed;
    p.x += Math.sin(p.y * 0.01) * 0.5;

    if (p.y > canvas.height) {
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

const renderLeaves: RenderFunction = (ctx, canvas, particles, config) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p) => {
    p.y += p.speed * 0.5;
    p.x += Math.sin(p.y * 0.005 + p.angle) * 1;
    p.angle += p.spin;

    if (p.y > canvas.height) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
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

const renderFireflies: RenderFunction = (ctx, canvas, particles, config) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p) => {
    p.y += Math.sin(p.oscillation) * 0.5;
    p.x += Math.cos(p.oscillation) * 0.5;
    p.oscillation += 0.02;

    // Wrap around
    if (p.x > canvas.width + 10) p.x = -10;
    if (p.x < -10) p.x = canvas.width + 10;
    if (p.y > canvas.height + 10) p.y = -10;
    if (p.y < -10) p.y = canvas.height + 10;

    // Twinkle
    const currentOpacity =
      Math.abs(Math.sin(p.oscillation * 2)) * p.opacity + 0.2;

    ctx.fillStyle = `rgba(255, 255, 150, ${currentOpacity})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "yellow";
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
  },
  snow: {
    count: 150,
    speedRange: { min: 1, max: 2 },
    sizeRange: { min: 1, max: 4 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderSnow,
    color: "rgba(255, 255, 255, 0.8)",
  },
  leaves: {
    count: 50,
    speedRange: { min: 1, max: 4 },
    sizeRange: { min: 2, max: 6 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderLeaves,
    color: "rgba(218, 165, 32,",
  },
  "cherry-blossom": {
    count: 50,
    speedRange: { min: 1, max: 4 },
    sizeRange: { min: 2, max: 4 },
    lengthRange: { min: 10, max: 30 },
    opacityRange: { min: 0.1, max: 0.6 },
    renderFunction: renderLeaves,
    color: "rgba(255, 183, 197,",
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
      config.renderFunction(ctx, canvas, particles, config);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
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
