import { VisualizeFnProps } from "../types";

// Matrix rain effect - Digital rain that reacts to audio
interface Raindrop {
  // Store as ratio (0-1) instead of absolute position
  yRatio: number;
  speed: number;
  length: number;
  chars: string[];
}

const matrixState: {
  drops: Raindrop[];
  lastColumns: number;
  initialized: boolean;
} = {
  drops: [],
  lastColumns: 0,
  initialized: false,
};

const MATRIX_CHARS =
  "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";

function randomChar(): string {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

function createDrop(): Raindrop {
  const length = Math.floor(Math.random() * 15) + 5;
  return {
    yRatio: Math.random(), // 0-1 ratio of canvas height
    speed: Math.random() * 2 + 1,
    length,
    chars: Array.from({ length }, () => randomChar()),
  };
}

export default function renderMatrix({
  ctx,
  canvas,
  data,
  performanceMode = false,
  bass = 0,
}: VisualizeFnProps) {
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Base font size with bass-reactive scaling (kick drums make it pulse)
  const baseFontSize = performanceMode ? 16 : 14;
  const beatScale = 1 + bass * 1.2; // Scale up to 120% larger on bass
  const fontSize = Math.round(baseFontSize * beatScale);

  const columns = Math.floor(canvas.width / baseFontSize); // Use base size for consistent column count

  // Initialize or adjust drops when column count changes
  if (!matrixState.initialized) {
    matrixState.drops = [];
    for (let i = 0; i < columns; i++) {
      matrixState.drops.push(createDrop());
    }
    matrixState.lastColumns = columns;
    matrixState.initialized = true;
  } else if (columns !== matrixState.lastColumns) {
    // Resize: adjust number of drops but preserve existing ones
    if (columns > matrixState.lastColumns) {
      // Add new drops
      for (let i = matrixState.lastColumns; i < columns; i++) {
        matrixState.drops.push(createDrop());
      }
    } else {
      // Remove excess drops
      matrixState.drops = matrixState.drops.slice(0, columns);
    }
    matrixState.lastColumns = columns;
  }

  // Semi-transparent black to create trail effect - faster on beats
  // ctx.fillStyle = `rgba(0, 0, 0, ${
  //   0.08 + avgIntensity * 0.08 + bass * 0.1
  // })`;
  // ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${fontSize}px monospace`;

  // Fixed speed factor - independent of canvas size, boosted on beats
  const baseSpeedFactor = 0.005 + bass * 0.003;

  // Update and draw each drop
  matrixState.drops.forEach((drop, i) => {
    const dataIndex = Math.floor((i / columns) * data.length);
    const intensity = data[dataIndex] || avgIntensity;

    // Use baseFontSize for positioning to keep lanes stable
    const x = i * baseFontSize;

    // Adjust speed based on audio - use normalized speed
    const speedMultiplier = 1 + intensity;
    drop.yRatio += drop.speed * baseSpeedFactor * speedMultiplier;

    // Convert ratio to actual Y position (using baseFontSize for consistent positioning)
    const dropLength = drop.length * baseFontSize;
    const totalHeight = canvas.height + dropLength;
    const y = drop.yRatio * totalHeight;

    // Offset to center the scaled font in its lane
    const scaleOffset = (fontSize - baseFontSize) / 2;

    // Draw characters in the drop
    for (let j = 0; j < drop.length; j++) {
      // Use baseFontSize for position calculation, keep lanes stable
      const charY = y - j * baseFontSize;
      if (charY < 0 || charY > canvas.height + baseFontSize) continue;

      // Color gradient from white (head) to green (tail)
      const alpha = 1 - j / drop.length;
      if (j === 0) {
        // Head of the drop - white/bright green
        ctx.fillStyle = `rgba(180, 255, 180, ${alpha})`;
        if (!performanceMode) {
          ctx.shadowColor = "#0f0";
          ctx.shadowBlur = 10;
        }
      } else {
        // Trail - green with varying intensity
        const greenValue = Math.floor(200 + intensity * 55);
        ctx.fillStyle = `rgba(0, ${greenValue}, 70, ${alpha * 0.8})`;
        ctx.shadowBlur = 0;
      }

      // Randomly change some characters
      if (Math.random() < 0.02) {
        drop.chars[j] = randomChar();
      }

      // Draw at lane position with centering offset for scaled font
      ctx.fillText(drop.chars[j], x - scaleOffset, charY);
    }

    ctx.shadowBlur = 0;

    // Reset drop when it goes off screen
    if (drop.yRatio > 1) {
      drop.yRatio = (-drop.length * fontSize) / totalHeight;
      drop.speed = Math.random() * 2 + 1;
      drop.length = Math.floor(Math.random() * 15) + 5;
      drop.chars = Array.from({ length: drop.length }, () => randomChar());
    }
  });

  // Add glow effect based on audio intensity
  if (!performanceMode && avgIntensity > 0.1) {
    const glowGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    );
    glowGradient.addColorStop(0, `rgba(0, 255, 70, ${avgIntensity * 0.5})`);
    glowGradient.addColorStop(1, "rgba(0, 255, 70, 0)");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
