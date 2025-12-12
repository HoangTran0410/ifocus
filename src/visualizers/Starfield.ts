import { VisualizeFnProps } from "./shared";

// Starfield - Flying through space effect with audio-reactive speed
interface Star {
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
}

const starfieldState: {
  stars: Star[];
  initialized: boolean;
  shockwaves: { radius: number; alpha: number; hue: number }[];
  lastBeatTime: number;
  rotation: number;
  coronaExplosion: { size: number; alpha: number; maxSize: number } | null;
} = {
  stars: [],
  initialized: false,
  shockwaves: [],
  lastBeatTime: 0,
  rotation: 0,
  coronaExplosion: null,
};

export default function renderStarfield({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
}: VisualizeFnProps) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const starCount = performanceMode ? 50 : 100;
  const now = Date.now();

  // Initialize stars
  if (
    !starfieldState.initialized ||
    starfieldState.stars.length !== starCount
  ) {
    starfieldState.stars = [];
    for (let i = 0; i < starCount; i++) {
      starfieldState.stars.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
        prevX: 0,
        prevY: 0,
      });
    }
    starfieldState.initialized = true;
  }

  // Spawn shockwave on strong bass (kick drums)
  if (bass > 0.5 && now - starfieldState.lastBeatTime > 400) {
    starfieldState.lastBeatTime = now;
    starfieldState.shockwaves.push({
      radius: 10,
      alpha: 0.5,
      hue: 200 + Math.random() * 100, // Blue to purple
    });
  }

  // Speed based on bass frequencies - more responsive to kick drums
  const bassIntensity =
    data.slice(0, Math.floor(data.length / 4)).reduce((a, b) => a + b, 0) /
    (data.length / 4);
  const speed = 1 + bassIntensity * 4 + bass * 8; // Faster speed on bass

  // Color shift on beat - stars turn golden/warm (higher threshold)
  const beatColorShift = beatIntensity > 0.5;

  // Update and draw stars
  starfieldState.stars.forEach((star, i) => {
    // Save previous position for trail
    const prevZ = star.z;
    star.prevX = (star.x / prevZ) * canvas.width + centerX;
    star.prevY = (star.y / prevZ) * canvas.height + centerY;

    // Move star closer
    star.z -= speed;

    // Reset if too close
    if (star.z <= 0) {
      star.x = (Math.random() - 0.5) * canvas.width * 2;
      star.y = (Math.random() - 0.5) * canvas.height * 2;
      star.z = canvas.width;
      star.prevX = (star.x / star.z) * canvas.width + centerX;
      star.prevY = (star.y / star.z) * canvas.height + centerY;
    }

    // Project to 2D
    const x = (star.x / star.z) * canvas.width + centerX;
    const y = (star.y / star.z) * canvas.height + centerY;

    // Skip if off screen
    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

    // Size based on distance - bigger on beats
    const baseSize = Math.max(
      0.5,
      ((canvas.width - star.z) / canvas.width) * 3
    );
    const size = baseSize * (1 + beatIntensity * 0.5);

    // Brightness based on distance and audio
    const brightness = 0.5 + (canvas.width - star.z) / canvas.width;
    const dataIndex = i % data.length;
    const intensity = data[dataIndex];

    // Color based on frequency - shift to warm on beats
    let hue = 200 + (dataIndex / data.length) * 60; // Blue to purple range
    if (beatColorShift) {
      hue = 40 + (dataIndex / data.length) * 40; // Golden/orange on beat
    }

    // Draw trail - longer on beats
    const trailThreshold = beatIntensity > 0.3 ? 0.1 : 0.3;
    if (!performanceMode && brightness > trailThreshold) {
      ctx.beginPath();
      ctx.moveTo(star.prevX, star.prevY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `hsla(${hue}, 80%, ${60 + intensity * 30}%, ${
        brightness * (0.5 + beatIntensity * 0.3)
      })`;
      ctx.lineWidth = size * (0.5 + beatIntensity * 0.5);
      ctx.stroke();
    }

    // Draw star
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);

    // Create gradient for star glow - enhanced on beats
    if (!performanceMode && (brightness > 0.5 || beatIntensity > 0.4)) {
      const glowSize = size * (2 + beatIntensity * 2);
      const starGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      starGradient.addColorStop(0, `hsla(${hue}, 90%, 95%, 1)`);
      starGradient.addColorStop(
        0.3,
        `hsla(${hue}, 80%, 80%, ${brightness + beatIntensity * 0.3})`
      );
      starGradient.addColorStop(1, "transparent");
      ctx.fillStyle = starGradient;
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    } else {
      ctx.fillStyle = `hsla(${hue}, 70%, ${
        70 + brightness * 30
      }%, ${brightness})`;
    }
    ctx.fill();
  });

  // Draw and update shockwaves (slower expansion)
  if (!performanceMode) {
    starfieldState.shockwaves = starfieldState.shockwaves.filter((wave) => {
      wave.radius += 4 + avgIntensity * 3;
      wave.alpha -= 0.012;

      if (wave.alpha <= 0) return false;

      // Draw expanding ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${wave.hue}, 80%, 70%, ${wave.alpha})`;
      ctx.lineWidth = 2 + wave.alpha * 3;
      ctx.stroke();

      // Inner glow ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, wave.radius * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${wave.hue + 30}, 90%, 80%, ${wave.alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      return true;
    });
  }

  // Center flash on beat (subtle)
  if (!performanceMode && beatIntensity > 0.5) {
    const flashSize = 30 + beatIntensity * 80;
    const flashGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      flashSize
    );
    flashGradient.addColorStop(
      0,
      `rgba(255, 255, 255, ${beatIntensity * 0.3})`
    );
    flashGradient.addColorStop(
      0.3,
      `rgba(255, 200, 100, ${beatIntensity * 0.15})`
    );
    flashGradient.addColorStop(1, "transparent");
    ctx.fillStyle = flashGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, flashSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // ============================================
  // RED GIANT CENTER STAR
  // ============================================

  // Update rotation (slow)
  starfieldState.rotation += 0.003 + avgIntensity * 0.08;

  // Base size of the red giant - pulses with audio
  const redGiantBaseSize = 25 + avgIntensity * 15;
  const redGiantSize = redGiantBaseSize + beatIntensity * 15;

  // Trigger new corona explosion on beat
  if (
    beatIntensity > 0.5 &&
    (!starfieldState.coronaExplosion ||
      starfieldState.coronaExplosion.alpha < 0.3)
  ) {
    starfieldState.coronaExplosion = {
      size: redGiantSize * 1.2,
      alpha: 1,
      maxSize: redGiantSize * 5,
    };
  }

  // Update and draw persistent corona explosion
  if (starfieldState.coronaExplosion) {
    const corona = starfieldState.coronaExplosion;

    // Slow expansion
    corona.size += (corona.maxSize - corona.size) * 0.03;
    // Slow fade
    corona.alpha -= 0.008;

    if (corona.alpha > 0) {
      const coronaGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        redGiantSize * 0.8,
        centerX,
        centerY,
        corona.size
      );
      coronaGradient.addColorStop(
        0,
        `rgba(255, 100, 50, ${corona.alpha * 0.7})`
      );
      coronaGradient.addColorStop(
        0.3,
        `rgba(255, 50, 0, ${corona.alpha * 0.5})`
      );
      coronaGradient.addColorStop(
        0.6,
        `rgba(200, 0, 0, ${corona.alpha * 0.3})`
      );
      coronaGradient.addColorStop(1, "transparent");
      ctx.fillStyle = coronaGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, corona.size, 0, Math.PI * 2);
      ctx.fill();

      // Solar flare rays during explosion
      if (!performanceMode && corona.alpha > 0.4) {
        const flareCount = 8;
        for (let i = 0; i < flareCount; i++) {
          const angle =
            (i / flareCount) * Math.PI * 2 + starfieldState.rotation;
          const flareLength = corona.size * 0.8;
          const flareWidth = redGiantSize * 0.4;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle);

          const flareGradient = ctx.createLinearGradient(
            redGiantSize,
            0,
            flareLength,
            0
          );
          flareGradient.addColorStop(
            0,
            `rgba(255, 150, 50, ${corona.alpha * 0.6})`
          );
          flareGradient.addColorStop(
            0.5,
            `rgba(255, 80, 0, ${corona.alpha * 0.4})`
          );
          flareGradient.addColorStop(1, "transparent");

          ctx.fillStyle = flareGradient;
          ctx.beginPath();
          ctx.moveTo(redGiantSize * 0.8, 0);
          ctx.lineTo(flareLength, -flareWidth * 0.2);
          ctx.lineTo(flareLength, flareWidth * 0.2);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }
    } else {
      starfieldState.coronaExplosion = null;
    }
  }

  // Outer glow of red giant
  const outerGlowSize = redGiantSize * 1.8;
  const outerGlow = ctx.createRadialGradient(
    centerX,
    centerY,
    redGiantSize * 0.5,
    centerX,
    centerY,
    outerGlowSize
  );
  outerGlow.addColorStop(0, `rgba(255, 120, 50, ${0.6 + avgIntensity * 0.3})`);
  outerGlow.addColorStop(0.5, `rgba(255, 60, 20, ${0.3 + avgIntensity * 0.2})`);
  outerGlow.addColorStop(1, "transparent");
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerGlowSize, 0, Math.PI * 2);
  ctx.fill();

  // Main red giant body
  const redGiantGradient = ctx.createRadialGradient(
    centerX - redGiantSize * 0.2,
    centerY - redGiantSize * 0.2,
    0,
    centerX,
    centerY,
    redGiantSize
  );
  redGiantGradient.addColorStop(0, "#FFF5E0"); // Hot white-yellow center
  redGiantGradient.addColorStop(0.2, "#FFCC66"); // Yellow
  redGiantGradient.addColorStop(0.4, "#FF8844"); // Orange
  redGiantGradient.addColorStop(0.7, "#DD4422"); // Red-orange
  redGiantGradient.addColorStop(1, "#AA2200"); // Deep red edge

  ctx.fillStyle = redGiantGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, redGiantSize, 0, Math.PI * 2);
  ctx.fill();

  // Surface texture - rotating darker patches (sunspots)
  if (!performanceMode) {
    const spotCount = 3;
    for (let i = 0; i < spotCount; i++) {
      // Sunspots rotate with the star
      const spotAngle =
        (i / spotCount) * Math.PI * 2 + starfieldState.rotation * 0.5;
      const spotDist = redGiantSize * 0.4;
      const spotX = centerX + Math.cos(spotAngle) * spotDist;
      const spotY = centerY + Math.sin(spotAngle) * spotDist;
      const spotSize = redGiantSize * (0.12 + (i % 2) * 0.08);

      const spotGradient = ctx.createRadialGradient(
        spotX,
        spotY,
        0,
        spotX,
        spotY,
        spotSize
      );
      spotGradient.addColorStop(0, "rgba(80, 20, 5, 0.5)");
      spotGradient.addColorStop(1, "transparent");
      ctx.fillStyle = spotGradient;
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bright highlight (rotates slowly)
    // const highlightAngle = -Math.PI / 4 + starfieldState.rotation * 0.2;
    // const highlightX = centerX + Math.cos(highlightAngle) * redGiantSize * 0.35;
    // const highlightY = centerY + Math.sin(highlightAngle) * redGiantSize * 0.35;
    // const highlightGradient = ctx.createRadialGradient(
    //   highlightX,
    //   highlightY,
    //   0,
    //   highlightX,
    //   highlightY,
    //   redGiantSize * 0.35
    // );
    // highlightGradient.addColorStop(0, "rgba(255, 255, 220, 0.5)");
    // highlightGradient.addColorStop(1, "transparent");
    // ctx.fillStyle = highlightGradient;
    // ctx.beginPath();
    // ctx.arc(highlightX, highlightY, redGiantSize * 0.35, 0, Math.PI * 2);
    // ctx.fill();
  }

  // Speed lines at edges during beats - more dramatic
  //   if (!performanceMode && beatIntensity > 0.3) {
  //     const lineCount = Math.floor(10 + beatIntensity * 15);
  //     for (let i = 0; i < lineCount; i++) {
  //       const angle = (i / lineCount) * Math.PI * 2 + Math.random() * 0.3;
  //       const startRadius =
  //         Math.min(canvas.width, canvas.height) * (0.3 + beatIntensity * 0.1);
  //       const endRadius =
  //         Math.min(canvas.width, canvas.height) * (0.5 + beatIntensity * 0.15);

  //       const startX = centerX + Math.cos(angle) * startRadius;
  //       const startY = centerY + Math.sin(angle) * startRadius;
  //       const endX = centerX + Math.cos(angle) * endRadius;
  //       const endY = centerY + Math.sin(angle) * endRadius;

  //       ctx.beginPath();
  //       ctx.moveTo(startX, startY);
  //       ctx.lineTo(endX, endY);
  //       const lineHue = beatColorShift
  //         ? 40 + Math.random() * 30
  //         : 200 + Math.random() * 60;
  //       ctx.strokeStyle = `hsla(${lineHue}, 70%, 70%, ${
  //         0.2 + beatIntensity * 0.4
  //       })`;
  //       ctx.lineWidth = 1 + beatIntensity * 2;
  //       ctx.stroke();
  //     }
  //   }
}
