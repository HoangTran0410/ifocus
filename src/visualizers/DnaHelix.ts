import { VisualizeFnProps } from "./shared";

// DNA Helix - Pulsing double helix
export default function renderDnaHelix({
  ctx,
  canvas,
  data,
  performanceMode = false,
}: VisualizeFnProps) {
  const centerY = canvas.height / 2;
  const amplitude = canvas.height * 0.3;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const time = Date.now() * 0.002;
  const points = performanceMode ? 30 : 60;

  // Draw connecting bars first
  ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
  ctx.lineWidth = 1;

  for (let i = 0; i < points; i++) {
    const x = (i / points) * canvas.width;
    const dataIndex = Math.floor((i / points) * data.length);
    const intensity = data[dataIndex] || 0;

    const phase = (i / points) * Math.PI * 4 + time;
    const y1 = centerY + Math.sin(phase) * amplitude * (0.5 + intensity * 0.5);
    const y2 =
      centerY + Math.sin(phase + Math.PI) * amplitude * (0.5 + intensity * 0.5);

    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  }

  // Draw helix strands
  for (let strand = 0; strand < 2; strand++) {
    const phaseOffset = strand * Math.PI;
    const color =
      strand === 0
        ? `rgba(168, 85, 247, ${0.7 + avgIntensity * 0.3})`
        : `rgba(236, 72, 153, ${0.7 + avgIntensity * 0.3})`;

    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * canvas.width;
      const dataIndex = Math.floor((i / points) * data.length);
      const intensity = data[dataIndex] || 0;

      const phase = (i / points) * Math.PI * 4 + time + phaseOffset;
      const y = centerY + Math.sin(phase) * amplitude * (0.5 + intensity * 0.5);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 3 + avgIntensity * 2;
    ctx.stroke();

    // Draw nodes
    for (let i = 0; i < points; i += 3) {
      const x = (i / points) * canvas.width;
      const dataIndex = Math.floor((i / points) * data.length);
      const intensity = data[dataIndex] || 0;

      const phase = (i / points) * Math.PI * 4 + time + phaseOffset;
      const y = centerY + Math.sin(phase) * amplitude * (0.5 + intensity * 0.5);

      ctx.beginPath();
      ctx.arc(x, y, 4 + intensity * 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}
