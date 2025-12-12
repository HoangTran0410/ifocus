import { VisualizeFnProps } from "../types";
import {
  createProgram,
  getUniforms,
  FULLSCREEN_VERTEX_SHADER,
  copyToCanvas2D,
  getSharedCanvas,
  getSharedGL,
  ensureSharedCanvasSize,
  ensureSharedQuad,
  drawSharedQuad,
} from "./utils";

// Fragmentum by Jaenam
// License: Creative Commons (CC BY-NC-SA 4.0)
// https://x.com/Jaenam97/status/1982796343539118108
// https://www.shadertoy.com/view/t3SyzV

const FRAGMENT_SHADER = /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
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

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec3 r = vec3(u_resolution, 1.0);

    // Audio affects glow intensity and blob scale
    float glowBoost = 1.0 + u_bass * 1.5;
    float blobScale = 1.0 + u_bass * 0.4;  // Scale up on beat

    // Rotation matrix
    float angle = u_time / 2.0;
    mat2 R = mat2(cos(angle), cos(angle - 33.0), cos(angle - 11.0), cos(angle));

    float d = 0.0;
    float s;
    vec3 p;
    vec4 O = vec4(0.0);

    for (int iter = 0; iter < 100; iter++) {
      float i = float(iter);

      // Calculate position - apply scale to make blob larger on beat
      vec2 uv = (fragCoord + fragCoord - r.xy) / r.y * d / blobScale;
      p = vec3(R * uv, d - 8.0);
      p.xz = R * p.xz;

      // Distance calculation
      s = 0.012 + 0.07 * abs(max(sin(length(fract(p) * p)), length(p) - 4.0) - i / 100.0);
      d += s;

      // Accumulate color
      O += max(1.3 * sin(vec4(1.0, 2.0, 3.0, 1.0) + i * 0.3) / s, -length(p * p));
    }

    // Apply audio glow boost
    O *= glowBoost;

    // Tanh tonemapping
    O = tanh4(O * O / 800000.0);

    // Calculate alpha based on brightness
    float alpha = clamp(length(O.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(O.rgb, alpha);
  }
`;

// State for WebGL resources (uses shared canvas)
const state = {
  program: null as WebGLProgram | null,
  uniforms: {} as Record<string, WebGLUniformLocation | null>,
  time: 0,
};

export default function renderWebGLFragment({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
  mid = 0,
  high = 0,
}: VisualizeFnProps) {
  // Use shared WebGL canvas and context
  if (!ensureSharedCanvasSize(canvas.width, canvas.height)) return;
  const glCanvas = getSharedCanvas();
  const gl = getSharedGL();
  if (!gl) return;

  // Initialize program if needed
  if (!state.program) {
    state.program = createProgram(
      gl,
      FULLSCREEN_VERTEX_SHADER,
      FRAGMENT_SHADER
    );
    if (!state.program) return;
    state.uniforms = getUniforms(gl, state.program);
  }

  ensureSharedQuad();
  if (!state.program) return;

  // Update time
  state.time += performanceMode ? 0.012 : 0.016;

  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // Render
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(state.program);
  gl.uniform1f(state.uniforms.u_time, state.time);
  gl.uniform1f(state.uniforms.u_intensity, avgIntensity);
  gl.uniform1f(state.uniforms.u_beatIntensity, beatIntensity);
  gl.uniform1f(state.uniforms.u_bass, bass);
  gl.uniform1f(state.uniforms.u_mid, mid);
  gl.uniform1f(state.uniforms.u_high, high);
  gl.uniform2f(state.uniforms.u_resolution, canvas.width, canvas.height);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawSharedQuad(state.program);

  copyToCanvas2D(glCanvas, ctx, canvas);
}

export function cleanup(): void {
  state.program = null;
  state.uniforms = {};
}
