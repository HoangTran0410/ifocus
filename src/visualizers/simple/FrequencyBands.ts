import { VisualizeFnProps } from "../types";

// Simple frequency bands test visualizer
// Displays bass/mid/high values as bars and text for debugging

export default function renderFrequencyBands({
  ctx,
  canvas,
  bass = 0,
  mid = 0,
  high = 0,
}: VisualizeFnProps) {
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Save context state
  ctx.save();

  // Vertical offset - shift everything down 20px
  const offsetY = 25;

  // Background
  ctx.fillStyle = "rgba(15, 15, 30, 0.3)";
  ctx.fillRect(0, 0, width, height);

  // Bar dimensions
  const barWidth = Math.min(120, width / 4);
  const maxBarHeight = height * 0.6;
  const barSpacing = (width - barWidth * 3) / 4;
  const barY = height * 0.15 + offsetY;

  // Band data
  const bands = [
    { name: "BASS", value: bass, color: "#ff4444", subColor: "#ff666688" },
    { name: "MID", value: mid, color: "#44ff44", subColor: "#66ff6688" },
    { name: "HIGH", value: high, color: "#4488ff", subColor: "#66aaff88" },
  ];

  bands.forEach((band, i) => {
    const x = barSpacing + i * (barWidth + barSpacing);
    const barHeight = band.value * maxBarHeight;

    // Bar background (outline)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, barY, barWidth, maxBarHeight);

    // Filled bar
    const gradient = ctx.createLinearGradient(
      x,
      barY + maxBarHeight,
      x,
      barY + maxBarHeight - barHeight
    );
    gradient.addColorStop(0, band.color);
    gradient.addColorStop(1, band.subColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, barY + maxBarHeight - barHeight, barWidth, barHeight);

    // Glow effect on high values
    if (band.value > 0.5) {
      ctx.shadowColor = band.color;
      ctx.shadowBlur = 20 * band.value;
      ctx.fillRect(x, barY + maxBarHeight - barHeight, barWidth, barHeight);
      ctx.shadowBlur = 0;
    }

    // Label
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.min(18, width / 20)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(band.name, x + barWidth / 2, barY + maxBarHeight + 30);

    // Value text
    ctx.fillStyle = band.color;
    ctx.font = `bold ${Math.min(24, width / 15)}px monospace`;
    ctx.fillText(
      (band.value * 100).toFixed(0) + "%",
      x + barWidth / 2,
      barY + maxBarHeight + 60
    );

    // Raw value
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = `${Math.min(12, width / 30)}px monospace`;
    ctx.fillText(
      band.value.toFixed(3),
      x + barWidth / 2,
      barY + maxBarHeight + 80
    );
  });

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.min(16, width / 25)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("FREQUENCY BANDS TEST", width / 2, 30 + offsetY);

  // Frequency ranges info
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = `${Math.min(11, width / 35)}px monospace`;
  ctx.fillText("20-250Hz", barSpacing + barWidth / 2, barY - 10);
  ctx.fillText(
    "250-2000Hz",
    barSpacing + barWidth + barSpacing + barWidth / 2,
    barY - 10
  );
  ctx.fillText(
    "2000-16000Hz",
    barSpacing + 2 * (barWidth + barSpacing) + barWidth / 2,
    barY - 10
  );

  // Restore context state
  ctx.restore();
}
