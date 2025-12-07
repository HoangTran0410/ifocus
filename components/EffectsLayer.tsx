import React, { useEffect, useRef } from 'react';
import { EffectType } from '../types';

interface EffectsLayerProps {
  type: EffectType;
}

export const EffectsLayer: React.FC<EffectsLayerProps> = ({ type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || type === 'none' || type === 'sun-rays') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Initialize particles based on type
    const initParticles = () => {
      particles = [];
      const isHeavy = type === 'heavy-rain';
      const count = isHeavy ? 800 : type === 'rain' ? 300 : type === 'snow' ? 150 : type === 'fireflies' ? 40 : type === 'cloud-shadows' ? 6 : 50;
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: Math.random() * 5 + (isHeavy ? 15 : type === 'rain' ? 10 : type === 'fireflies' ? 0.5 : type === 'cloud-shadows' ? 0.2 : 1),
          length: Math.random() * 20 + 10,
          size: type === 'cloud-shadows' ? Math.random() * 400 + 300 : Math.random() * 3 + 1,
          angle: Math.random() * Math.PI * 2,
          spin: Math.random() * 0.1 - 0.05,
          opacity: type === 'cloud-shadows' ? 0.15 : Math.random() * 0.5 + 0.1,
          oscillation: Math.random() * Math.PI * 2,
        });
      }
    };

    initParticles();

    const drawRain = (isHeavy = false) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
      ctx.lineWidth = isHeavy ? 2 : 1;
      ctx.lineCap = 'round';

      particles.forEach(p => {
        p.y += p.speed;
        if (isHeavy) p.x -= 1; // Slant for heavy rain

        if (p.y > canvas.height) {
          p.y = -p.length;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (isHeavy ? 5 : 0), p.y + p.length);
        ctx.stroke();
      });
    };

    const drawSnow = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

      particles.forEach(p => {
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

    const drawLeaves = (color = 'rgba(218, 165, 32,') => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
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
        ctx.fillStyle = `${color} ${p.opacity})`; 
        // Simple leaf shape
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    };

    const drawFireflies = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.y += Math.sin(p.oscillation) * 0.5;
        p.x += Math.cos(p.oscillation) * 0.5;
        p.oscillation += 0.02;

        // Wrap around
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.y > canvas.height + 10) p.y = -10;
        if (p.y < -10) p.y = canvas.height + 10;

        // Twinkle
        const currentOpacity = Math.abs(Math.sin(p.oscillation * 2)) * p.opacity + 0.2;

        ctx.fillStyle = `rgba(255, 255, 150, ${currentOpacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "yellow";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    const drawClouds = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = 'blur(60px)';
      ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // Opacity handled by globalAlpha or loop

      particles.forEach(p => {
        p.x += p.speed;
        if (p.x > canvas.width + p.size) {
          p.x = -p.size;
        }

        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
    };

    const render = () => {
      if (type === 'rain') drawRain(false);
      else if (type === 'heavy-rain') drawRain(true);
      else if (type === 'snow') drawSnow();
      else if (type === 'leaves') drawLeaves();
      else if (type === 'cherry-blossom') drawLeaves('rgba(255, 183, 197,');
      else if (type === 'fireflies') drawFireflies();
      else if (type === 'cloud-shadows') drawClouds();
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type]);

  if (type === 'none' || type === 'sun-rays') return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
