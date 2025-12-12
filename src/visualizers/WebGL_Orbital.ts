import { VisualizeFnProps } from "./shared";
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
} from "./shader/utils";

// Credits: Danilo Guanabara
// http://www.pouet.net/prod.php?which=57245

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

  void main() {
    vec2 r = u_resolution.xy;
    vec2 fragCoord = v_uv * r;

    // Audio affects brightness and wave intensity
    float brightness = 1.0 + u_bass * 1.5;
    float waveIntensity = 1.0 + u_bass * 0.5;

    vec3 c;
    float l;
    float z = u_time;

    for (int i = 0; i < 3; i++) {
      vec2 uv;
      vec2 p = fragCoord.xy / r;
      uv = p;
      p -= 0.5;
      p.x *= r.x / r.y;
      z += 0.07;
      l = length(p);
      uv += p / l * (sin(z) + 1.0) * abs(sin(l * 9.0 * waveIntensity - z - z));
      c[i] = 0.01 / length(mod(uv, 1.0) - 0.5);
    }

    vec3 color = c / l * brightness;

    // Calculate alpha based on brightness
    float alpha = clamp(length(color) * 0.5, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

// State for WebGL resources (uses shared canvas)
const state = {
  program: null as WebGLProgram | null,
  uniforms: {} as Record<string, WebGLUniformLocation | null>,
  time: 0,
};

export default function renderWebGLOrbital({
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
