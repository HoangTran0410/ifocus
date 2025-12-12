import { VisualizeFnProps } from "../types";

// Oscilloscope - Classic oscilloscope waveform display
export default function renderOscilloscope({
  ctx,
  canvas,
  data,
  performanceMode = false,
}: VisualizeFnProps) {
  const centerY = canvas.height / 2;
  const sliceWidth = canvas.width / (data.length - 1);

  // Draw grid
  if (!performanceMode) {
    ctx.strokeStyle = "rgba(34, 211, 238, 0.1)";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i < 10; i++) {
      const x = (i / 10) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i < 5; i++) {
      const y = (i / 5) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  // Center line
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw waveform with glow
  if (!performanceMode) {
    ctx.shadowColor = "rgba(34, 211, 238, 0.8)";
    ctx.shadowBlur = 15;
  }

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = i * sliceWidth;
    // Convert 0-1 to oscilloscope style wave
    const normalizedValue = (data[i] - 0.5) * 2;
    const y = centerY + normalizedValue * canvas.height * 0.4;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw bright dots at peaks
  if (!performanceMode) {
    for (let i = 0; i < data.length; i += 5) {
      if (data[i] > 0.6) {
        const x = i * sliceWidth;
        const normalizedValue = (data[i] - 0.5) * 2;
        const y = centerY + normalizedValue * canvas.height * 0.4;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fill();
      }
    }
  }
}
