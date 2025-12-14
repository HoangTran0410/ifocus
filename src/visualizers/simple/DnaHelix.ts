import { BriefcaseBusinessIcon } from "lucide-react";
import { VisualizeFnProps } from "../types";

// DNA Helix - 3D double helix with depth effect
const dnaState = {
  time: 0,
};

export default function renderDnaHelix({
  ctx,
  canvas,
  data,
  performanceMode = false,
  bass = 0,
}: VisualizeFnProps) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const amplitude = Math.min(canvas.height * 0.3, canvas.width * 0.2);
  const helixLength = canvas.width * 0.85;
  const startX = (canvas.width - helixLength) / 2;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Animate rotation - bass makes it spin faster
  dnaState.time += 0.03 + avgIntensity * 0.02 + bass * 0.05;

  const segments = performanceMode ? 50 : 80;
  const twists = 1.5;

  // Pre-calculate all points with 3D coordinates
  const allPoints: Array<{
    x: number;
    y: number;
    z: number;
    size: number;
    intensity: number;
    strand: number;
  }> = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = startX + t * helixLength;
    const dataIndex = Math.floor(t * data.length);
    const intensity = data[dataIndex] || avgIntensity;

    const phase = t * Math.PI * 2 * twists + dnaState.time;
    const dynamicAmplitude = amplitude * (0.7 + intensity * 0.4);

    // Strand 1
    const z1 = Math.cos(phase);
    const y1 = centerY + Math.sin(phase) * dynamicAmplitude;
    const size1 = 4 + intensity * 5 + bass * 3;

    allPoints.push({
      x,
      y: y1,
      z: z1,
      size: size1 * (0.5 + (z1 + 1) * 0.35), // Size varies with depth
      intensity,
      strand: 0,
    });

    // Strand 2 (opposite phase)
    const z2 = Math.cos(phase + Math.PI);
    const y2 = centerY + Math.sin(phase + Math.PI) * dynamicAmplitude;
    const size2 = 4 + intensity * 5 + bass * 3;

    allPoints.push({
      x,
      y: y2,
      z: z2,
      size: size2 * (0.5 + (z2 + 1) * 0.35),
      intensity,
      strand: 1,
    });
  }

  // Sort all points by z-depth (back to front)
  allPoints.sort((a, b) => a.z - b.z);

  // Draw each point as a sphere with 3D shading
  for (const p of allPoints) {
    const depthFactor = (p.z + 1) / 2; // 0 = back, 1 = front

    // Base colors for each strand
    const hue = p.strand === 0 ? 270 : 320; // Purple vs Pink
    const saturation = 80 + depthFactor * 20;
    const lightness = 35 + depthFactor * 30 + p.intensity * 15;
    const alpha = 0.4 + depthFactor * 0.5 + p.intensity * 0.1;

    // Glow behind sphere
    if (!performanceMode && p.size > 3 && depthFactor > 0.3) {
      const glowSize = p.size * 2.5;
      const glowGradient = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        glowSize
      );
      glowGradient.addColorStop(
        0,
        `hsla(${hue}, 100%, 70%, ${depthFactor * 0.25})`
      );
      glowGradient.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
    }

    // Main sphere with 3D gradient
    const gradient = ctx.createRadialGradient(
      p.x - p.size * 0.3,
      p.y - p.size * 0.3,
      0,
      p.x,
      p.y,
      p.size
    );
    gradient.addColorStop(
      0,
      `hsla(${hue}, ${saturation}%, ${Math.min(90, lightness + 25)}%, ${alpha})`
    );
    gradient.addColorStop(
      0.5,
      `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
    );
    gradient.addColorStop(
      1,
      `hsla(${hue}, ${saturation}%, ${Math.max(20, lightness - 20)}%, ${alpha})`
    );

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Specular highlight
    if (depthFactor > 0.4 && p.size > 2) {
      ctx.beginPath();
      ctx.arc(
        p.x - p.size * 0.25,
        p.y - p.size * 0.25,
        p.size * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + depthFactor * 0.4})`;
      ctx.fill();
    }
  }

  // Draw strand connection lines (gives spine effect)
  if (!performanceMode) {
    for (let strand = 0; strand < 2; strand++) {
      const strandPoints = allPoints
        .filter((p) => p.strand === strand)
        .sort((a, b) => a.x - b.x);

      ctx.beginPath();
      for (let i = 0; i < strandPoints.length; i++) {
        const p = strandPoints[i];
        const depthFactor = (p.z + 1) / 2;

        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }

      const hue = strand === 0 ? 270 : 320;
      ctx.strokeStyle = `hsla(${hue}, 80%, 55%, 0.3)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Ambient glow at center
  if (!performanceMode) {
    const centerGlow = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      amplitude * 1.5
    );
    centerGlow.addColorStop(0, `rgba(168, 85, 247, ${avgIntensity * 0.1})`);
    centerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
