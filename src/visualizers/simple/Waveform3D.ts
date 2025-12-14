import { VisualizeFnProps } from "../types";

// 3D Terrain - Pseudo-3D terrain mesh that flows with audio
const terrain3DState = {
  history: [] as number[][],
  maxHistory: 25,
};

export default function renderWaveform3D({
  ctx,
  canvas,
  data,
  performanceMode = false,
}: VisualizeFnProps) {
  const maxHistory = performanceMode ? 15 : 25;
  terrain3DState.maxHistory = maxHistory;

  // Add current frame to history
  terrain3DState.history.push([...data]);
  if (terrain3DState.history.length > maxHistory) {
    terrain3DState.history.shift();
  }

  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // 3D perspective parameters - pre-calculate constants
  const horizonY = canvas.height * 0.35;
  const groundY = canvas.height * 0.95;
  const vanishX = canvas.width * 0.5;
  const groundToHorizon = groundY - horizonY;
  const fov = 0.7;

  const rows = terrain3DState.history.length;
  const cols = performanceMode ? 24 : 40;
  const colsMinusOne = cols - 1;
  const heightScaleBase = canvas.height * 0.25;
  const dataLengthMinusOne = data.length - 1;

  // Draw terrain from back to front (far to near)
  for (let z = 0; z < rows - 1; z++) {
    const rowData = terrain3DState.history[z];
    const nextRowData = terrain3DState.history[z + 1];
    if (!rowData || !nextRowData) continue;

    // Z depth factor (0 = far, 1 = near)
    const zDepth = z / rows;
    const nextZDepth = (z + 1) / rows;

    // Y position with perspective (exponential for better depth)
    const perspZ = Math.pow(zDepth, fov);
    const nextPerspZ = Math.pow(nextZDepth, fov);
    const y = horizonY + groundToHorizon * perspZ;
    const nextY = horizonY + groundToHorizon * nextPerspZ;

    // Width gets wider as it gets closer
    const rowWidth = canvas.width * (0.15 + perspZ * 0.85);
    const nextRowWidth = canvas.width * (0.15 + nextPerspZ * 0.85);
    const rowStartX = vanishX - rowWidth * 0.5;
    const nextRowStartX = vanishX - nextRowWidth * 0.5;

    // Height based on perspective - pre-calculate per row
    const heightScale = heightScaleBase * (0.3 + perspZ * 0.7);
    const nextHeightScale = heightScaleBase * (0.3 + nextPerspZ * 0.7);

    // Pre-calculate base alpha for this row
    const baseAlpha = 0.4 + zDepth * 0.5;
    const baseLightness = 35 + zDepth * 25;
    const drawWireframe = !performanceMode || z % 2 === 0;
    const lineWidth = 0.5 + zDepth;

    // Draw quads between rows
    for (let x = 0; x < colsMinusOne; x++) {
      const xRatio = x / colsMinusOne;
      const nextXRatio = (x + 1) / colsMinusOne;

      // Sample data points
      const dataIdx = (xRatio * dataLengthMinusOne) | 0;
      const nextDataIdx = (nextXRatio * dataLengthMinusOne) | 0;
      const intensity1 = rowData[dataIdx] || 0;
      const intensity2 = rowData[nextDataIdx] || 0;
      const intensity3 = nextRowData[nextDataIdx] || 0;
      const intensity4 = nextRowData[dataIdx] || 0;

      // Calculate 4 corners of the quad
      const x1 = rowStartX + xRatio * rowWidth;
      const y1 = y - intensity1 * heightScale;
      const x2 = rowStartX + nextXRatio * rowWidth;
      const y2 = y - intensity2 * heightScale;
      const x3 = nextRowStartX + nextXRatio * nextRowWidth;
      const y3 = nextY - intensity3 * nextHeightScale;
      const x4 = nextRowStartX + xRatio * nextRowWidth;
      const y4 = nextY - intensity4 * nextHeightScale;

      // Color based on depth and intensity
      const avgQuadIntensity =
        (intensity1 + intensity2 + intensity3 + intensity4) * 0.25;
      const hue = (260 + avgQuadIntensity * 60) | 0;
      const saturation = (70 + avgQuadIntensity * 30) | 0;
      const lightness = (baseLightness + avgQuadIntensity * 20) | 0;

      // Draw filled quad
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();

      ctx.fillStyle = `hsla(${hue},${saturation}%,${lightness}%,${baseAlpha})`;
      ctx.fill();

      // Draw wireframe edges for 3D effect
      if (drawWireframe) {
        ctx.strokeStyle = `hsla(${hue + 30},90%,${lightness + 20}%,${
          baseAlpha * 0.8
        })`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    }
  }

  // Draw front edge glow for latest data
  if (!performanceMode && terrain3DState.history.length > 0) {
    const frontData = terrain3DState.history[terrain3DState.history.length - 1];
    const frontY = groundY;
    const frontWidth = canvas.width * 0.97;
    const frontStartX = vanishX - frontWidth * 0.5;
    const frontDataLen = frontData.length - 1;

    ctx.beginPath();
    for (let x = 0; x < cols; x++) {
      const xRatio = x / colsMinusOne;
      const dataIdx = (xRatio * frontDataLen) | 0;
      const intensity = frontData[dataIdx] || 0;
      const px = frontStartX + xRatio * frontWidth;
      const py = frontY - intensity * heightScaleBase;

      if (x === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    // Glow effect
    ctx.shadowColor = "rgba(236, 72, 153, 0.8)";
    ctx.shadowBlur = 15 + avgIntensity * 20;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + avgIntensity * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Horizon glow
  // if (!performanceMode && avgIntensity > 0.2) {
  //   const horizonGlow = ctx.createRadialGradient(
  //     vanishX,
  //     horizonY,
  //     0,
  //     vanishX,
  //     horizonY,
  //     canvas.width * 0.5
  //   );
  //   horizonGlow.addColorStop(0, `rgba(168, 85, 247, ${avgIntensity * 0.3})`);
  //   horizonGlow.addColorStop(0.5, `rgba(168, 85, 247, ${avgIntensity * 0.1})`);
  //   horizonGlow.addColorStop(1, "transparent");
  //   ctx.fillStyle = horizonGlow;
  //   ctx.fillRect(0, 0, canvas.width, horizonY + 50);
  // }
}
