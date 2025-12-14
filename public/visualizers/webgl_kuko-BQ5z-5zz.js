const o=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  // Polyfill for tanh (not available in WebGL 1.0)
  float tanhf(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  vec4 tanh4(vec4 v) {
    return vec4(tanhf(v.x), tanhf(v.y), tanhf(v.z), tanhf(v.w));
  }

  // Two by two rotation matrix constructor
  mat2 rot2D(float a) {
    return mat2(cos(a), sin(a), -sin(a), cos(a));
  }

  // Hash function for random sparkle generation
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5);
  }

  // Second hash for sparkle animation phase
  float hash2(vec3 p) {
    return fract(sin(dot(p, vec3(43.7, 78.2, 123.4))) * 127.1);
  }

  // Foil gyroid pattern
  float foilGyroid(vec3 p, float t) {
    float freq = 0.6;
    p *= freq;

    // Animated gyroid + time to phase-shift the surface
    float gyroid = dot(sin(p + t), cos(p.yzx));

    return abs(gyroid) * 1.0;
  }

  // Main raymarching function with chromatic offset
  float raymarch(vec2 I, vec2 R, mat2 rotX, mat2 rotY, float chromaticOffset, float time, float audioMod) {
    float colorAccum = 0.0;
    float dt = 0.0;

    for(float i = 0.0; i < 80.0; i++) {
      // Ray position
      vec3 p = vec3((I + I - R) / R.y * dt, dt - 5.0);

      // Early exit if ray goes too far off screen
      if (abs(p.x) > 5.0) break;

      // Apply rotations for camera orientation - auto rotate
      p.xy *= rotY;

      // Move along z direction
      p.z += time;

      // Voxel grid position for sparkle lookup
      vec3 gridPos = floor(p * 6.0);
      vec3 localPos = fract(p * 6.0) - 0.5;

      // Determine if this voxel contains a sparkle
      float sparkleAmount = step(length(localPos), hash(gridPos) * 0.3 + 0.1);

      // Random phase offset for sparkle animation
      float sparklePhase = hash2(gridPos) * 6.28;

      // Calculate foil pattern distance
      float foilDist = foilGyroid(p, time * 0.5);

      // Calculate cube SDF
      float cubeDist = foilGyroid(p, time);

      // Add sine wave modulation for extra surface detail
      float sineDist = length(sin(cubeDist)) - 0.13;

      // Combine distances with chromatic offset for holographic effect
      float combinedDist = max(max(cubeDist, foilDist - 0.1), sineDist)
                           + chromaticOffset * 0.001 - i / 130.0;

      // Adaptive step size
      float stepSize = 0.01 + 0.15 * abs(combinedDist);
      dt += stepSize;

      // Smooth factor for glow intensity near surfaces
      float stepFactor = smoothstep(0.02, 0.01, stepSize);

      // Audio-reactive sparkle intensity
      float sparkleIntensity = 1.0 + audioMod * 3.0;

      // Accumulate volumetric glow with sparkle contribution
      colorAccum += 2.3 / stepSize * sparkleIntensity *
        (0.5 + 0.5 * sin(i * 0.3 + chromaticOffset * 5.0) +
         stepFactor * 4.0 * sparkleAmount *
         sin(sparklePhase + i * 0.04 + chromaticOffset * 5.0));
    }

    return colorAccum;
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 R = u_resolution;

    // Auto-rotate based on time
    vec2 Ma = vec2(u_time / 6.0);

    // Rotation matrices for 3D camera orientation
    mat2 rotX = rot2D(Ma.x);
    mat2 rotY = rot2D(Ma.y);

    // Audio modulation
    float audioMod = u_bass * 0.4 + u_mid * 0.3 + u_high * 0.3;

    // Raymarch three times with chromatic offset for RGB channels
    vec4 O;
    O.r = raymarch(fragCoord, R, rotX, rotY, -1.0, u_time, audioMod);
    O.g = raymarch(fragCoord, R, rotX, rotY,  0.0, u_time, audioMod);
    O.b = raymarch(fragCoord, R, rotX, rotY,  1.0, u_time, audioMod);
    O.a = 1.0;

    // Tone mapping
    O = tanh4(O * O / 1e7);

    // Audio-reactive brightness boost
    O.rgb *= 1.0 + u_bass * 1.5;

    // Calculate alpha based on brightness
    float alpha = clamp(length(O.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(O.rgb, alpha);
  }
`;export{o as default};
