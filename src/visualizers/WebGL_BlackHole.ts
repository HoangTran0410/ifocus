import { VisualizeFnProps } from "./shared";
import {
  getWebGLContext,
  createProgram,
  getUniforms,
  FULLSCREEN_VERTEX_SHADER,
  setupFullscreenQuad,
  drawFullscreenQuad,
  copyToCanvas2D,
  releaseWebGLContext,
} from "./shader/utils";

// WebGL Black Hole - GPU-accelerated with gravitational lensing and accretion disk

const FRAGMENT_SHADER = /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform vec2 u_resolution;
  uniform float u_frequencies[8];

  #define PI 3.14159265359
  #define TWO_PI 6.28318530718

  // Noise function for organic variation
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractal Brownian Motion
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // Color palette for accretion disk
  vec3 accretionColor(float t, float intensity) {
    // Hot plasma colors: white -> yellow -> orange -> red -> dark red
    vec3 white = vec3(1.0, 0.95, 0.9);
    vec3 yellow = vec3(1.0, 0.8, 0.3);
    vec3 orange = vec3(1.0, 0.4, 0.1);
    vec3 red = vec3(0.8, 0.1, 0.05);
    vec3 darkRed = vec3(0.3, 0.02, 0.02);

    if (t < 0.2) return mix(white, yellow, t * 5.0);
    if (t < 0.4) return mix(yellow, orange, (t - 0.2) * 5.0);
    if (t < 0.6) return mix(orange, red, (t - 0.4) * 5.0);
    return mix(red, darkRed, (t - 0.6) * 2.5);
  }

  void main() {
    vec2 uv = v_uv;
    vec2 center = vec2(0.5);
    vec2 pos = uv - center;

    // Correct for aspect ratio
    float aspect = u_resolution.x / u_resolution.y;
    pos.x *= aspect;

    float dist = length(pos);
    float angle = atan(pos.y, pos.x);

    // Black hole parameters
    float eventHorizonRadius = 0.08 + u_intensity * 0.02;
    float photonSphereRadius = eventHorizonRadius * 1.5;
    float diskInnerRadius = eventHorizonRadius * 1.8;
    float diskOuterRadius = 0.5 + u_intensity * 0.1;

    vec3 color = vec3(0.0);
    float alpha = 0.0;

    // Gravitational lensing distortion
    float lensStrength = eventHorizonRadius * 2.0 / max(dist, 0.01);
    lensStrength = pow(lensStrength, 1.5) * 0.15;
    vec2 lensedPos = pos + normalize(pos) * lensStrength;
    float lensedDist = length(lensedPos);
    float lensedAngle = atan(lensedPos.y, lensedPos.x);

    // Accretion disk with doppler effect
    if (dist > eventHorizonRadius && dist < diskOuterRadius) {
      float diskT = (dist - diskInnerRadius) / (diskOuterRadius - diskInnerRadius);
      diskT = clamp(diskT, 0.0, 1.0);

      // Rotation with doppler shift simulation
      float rotationSpeed = 1.0 / max(dist, 0.1);
      float rotAngle = angle + u_time * rotationSpeed * 0.5;

      // Spiral arms with audio reactivity
      float spiralDensity = 0.0;
      for (int i = 0; i < 4; i++) {
        float armAngle = rotAngle + float(i) * PI * 0.5;
        float spiral = sin(armAngle * 3.0 - dist * 15.0 + u_time * 2.0);
        float freqMod = u_frequencies[i * 2] * 0.5;
        spiralDensity += (spiral * 0.5 + 0.5) * (1.0 + freqMod);
      }
      spiralDensity /= 4.0;

      // Hot spots from audio frequencies
      float hotSpots = 0.0;
      for (int i = 0; i < 8; i++) {
        float spotAngle = float(i) * TWO_PI / 8.0 + u_time * 0.3;
        float spotDist = 0.15 + float(i) * 0.04;
        vec2 spotPos = vec2(cos(spotAngle), sin(spotAngle)) * spotDist;
        float d = length(pos - spotPos);
        hotSpots += u_frequencies[i] * exp(-d * 30.0);
      }

      // Disk brightness with turbulence
      float turbulence = fbm(vec2(rotAngle * 2.0, dist * 10.0) + u_time * 0.5);
      float brightness = (1.0 - diskT) * (0.4 + spiralDensity * 0.4 + turbulence * 0.2);
      brightness += hotSpots * 2.0;
      brightness *= 1.0 + u_bass * 0.8;

      // Perspective tilt simulation
      float tiltFactor = 1.0 - abs(sin(angle)) * 0.3;
      brightness *= tiltFactor;

      // Doppler effect - approaching vs receding
      float doppler = 1.0 + cos(angle - u_time * 0.5) * 0.2 * u_intensity;

      vec3 diskColor = accretionColor(diskT, u_intensity);
      diskColor *= brightness * doppler;
      diskColor += hotSpots * vec3(1.0, 0.7, 0.4);

      color += diskColor;
      alpha = max(alpha, brightness * 0.9);
    }

    // Relativistic jets
    float jetWidth = 0.06 + u_bass * 0.05;
    float jetStrength = 0.0;
    for (int jet = 0; jet < 2; jet++) {
      float jetAngle = float(jet) * PI; // Top and bottom
      vec2 jetDir = vec2(cos(jetAngle + PI/2.0), sin(jetAngle + PI/2.0));
      float jetDist = dot(pos, jetDir);
      float jetPerp = length(pos - jetDir * jetDist);

      if (jetDist > 0.0 && jetDist < 0.6) {
        float jetCone = jetWidth + jetDist * 0.15;
        float jet = smoothstep(jetCone, 0.0, jetPerp);
        jet *= (1.0 - jetDist * 1.5);
        jet *= 0.5 + u_intensity * 0.5;

        // Plasma turbulence in jet
        float jetNoise = fbm(vec2(jetPerp * 20.0, jetDist * 10.0 - u_time * 3.0));
        jet *= 0.7 + jetNoise * 0.5;

        jetStrength += jet;
      }
    }
    color += vec3(0.4, 0.3, 1.0) * jetStrength;
    alpha = max(alpha, jetStrength);

    // Photon sphere ring
    float photonRing = smoothstep(0.015, 0.0, abs(dist - photonSphereRadius));
    photonRing *= 0.8 + sin(angle * 8.0 + u_time * 5.0) * 0.2;
    photonRing *= 1.0 + u_bass * 0.7;
    color += vec3(1.0, 0.9, 0.7) * photonRing * 2.0;
    alpha = max(alpha, photonRing);

    // Audio-reactive rings
    for (int i = 0; i < 6; i++) {
      float ringRadius = eventHorizonRadius * (1.2 + float(i) * 0.15);
      float ringWidth = 0.005 + u_frequencies[i] * 0.01;
      float ring = smoothstep(ringWidth, 0.0, abs(dist - ringRadius - u_frequencies[i] * 0.05));
      vec3 ringColor = vec3(1.0, 0.5 + float(i) * 0.08, 0.2 + float(i) * 0.1);
      color += ringColor * ring * (0.5 + u_frequencies[i]);
      alpha = max(alpha, ring * 0.5);
    }

    // Event horizon with edge glow
    float horizon = smoothstep(eventHorizonRadius, eventHorizonRadius * 0.8, dist);
    float edgeGlow = smoothstep(eventHorizonRadius * 1.2, eventHorizonRadius, dist);
    edgeGlow *= (1.0 - horizon);
    color = mix(color, vec3(0.0), horizon);
    color += vec3(1.0, 0.6, 0.2) * edgeGlow * (0.5 + u_intensity * 0.5);
    alpha = mix(alpha, 1.0, horizon);
    alpha = max(alpha, edgeGlow * 0.8);

    // Gravitational lensing rings
    for (int i = 1; i <= 4; i++) {
      float lensRing = eventHorizonRadius * (1.6 + float(i) * 0.25);
      float distortion = sin(u_time * 1.5 + float(i) * 0.7) * 0.03;
      float ring = smoothstep(0.008, 0.0, abs(lensedDist - lensRing - distortion));
      color += vec3(0.5, 0.4, 0.8) * ring * 0.15 * (1.0 + u_intensity * 0.3);
      alpha = max(alpha, ring * 0.2);
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

// State for WebGL resources
const state = {
  program: null as WebGLProgram | null,
  uniforms: {} as Record<string, WebGLUniformLocation | null>,
  initialized: false,
  lastCanvas: null as HTMLCanvasElement | null,
  glCanvas: null as HTMLCanvasElement | null,
  time: 0,
};

export default function renderWebGLBlackHole({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
}: VisualizeFnProps) {
  // Create or get WebGL canvas
  if (!state.glCanvas || state.lastCanvas !== canvas) {
    state.glCanvas = document.createElement("canvas");
    state.initialized = false;
  }

  // Resize if needed
  if (
    state.glCanvas.width !== canvas.width ||
    state.glCanvas.height !== canvas.height
  ) {
    state.glCanvas.width = canvas.width;
    state.glCanvas.height = canvas.height;
    state.initialized = false;
  }

  const gl = getWebGLContext(state.glCanvas);
  if (!gl) return;

  // Initialize WebGL resources
  if (!state.initialized) {
    state.program = createProgram(
      gl,
      FULLSCREEN_VERTEX_SHADER,
      FRAGMENT_SHADER
    );
    if (!state.program) return;

    state.uniforms = getUniforms(gl, state.program);
    setupFullscreenQuad(gl);
    state.initialized = true;
    state.lastCanvas = canvas;
  }

  if (!state.program) return;

  // Update time
  state.time += 0.016 * (1.0 + beatIntensity * 0.5);

  // Calculate frequency bands
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const frequencies = new Float32Array(8);
  const bandSize = Math.floor(data.length / 8);
  for (let i = 0; i < 8; i++) {
    let sum = 0;
    for (let j = 0; j < bandSize; j++) {
      sum += data[i * bandSize + j] || 0;
    }
    frequencies[i] = sum / bandSize;
  }

  // Render
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(state.program);

  // Set uniforms
  gl.uniform1f(state.uniforms.u_time, state.time);
  gl.uniform1f(state.uniforms.u_intensity, avgIntensity);
  gl.uniform1f(state.uniforms.u_beatIntensity, beatIntensity);
  gl.uniform1f(state.uniforms.u_bass, bass);
  gl.uniform2f(state.uniforms.u_resolution, canvas.width, canvas.height);
  gl.uniform1fv(state.uniforms["u_frequencies[0]"], frequencies);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  drawFullscreenQuad(gl, state.program);

  // Copy to 2D canvas
  copyToCanvas2D(state.glCanvas, ctx, canvas);
}

/**
 * Cleanup function to release WebGL resources
 */
export function cleanup(): void {
  if (state.glCanvas) {
    releaseWebGLContext(state.glCanvas);
    state.glCanvas = null;
    state.program = null;
    state.initialized = false;
    state.lastCanvas = null;
  }
}
