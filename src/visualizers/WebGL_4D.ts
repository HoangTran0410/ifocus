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

// 4D Box Frame with turbulence

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

  // Polyfill for tanh
  float tanhf(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  vec3 tanh3(vec3 v) {
    return vec3(tanhf(v.x), tanhf(v.y), tanhf(v.z));
  }

  vec3 s1(vec3 v) {
    return sin(v) * 0.5 + 0.5;
  }

  mat2 rotate(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  float sdBoxFrame(vec3 p, vec3 b, float e) {
    p = abs(p) - b;
    vec3 q = abs(p + e) - e;
    return min(min(
        length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
        length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
        length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 R = u_resolution.xy;
    vec2 uv = (fragCoord * 2.0 - R) / R.y;

    // Audio affects glow and scale
    float brightness = 1.0 + u_bass * 2.0;
    float scale = 1.0 + u_bass * 0.3;

    vec3 ro = vec3(0.0, 0.0, -10.0);
    vec3 rd = normalize(vec3(uv / scale, 1.0));

    float z = 0.1;

    mat2 mx = rotate(u_time * 0.2);
    mat2 my = rotate(u_time * 0.2);

    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 80.0; i++) {
      vec3 p = ro + rd * z;

      float k = 20.0 / max(dot(p, p), 10.0);
      p *= k;

      p.xz = mx * p.xz;
      p.yz = my * p.yz;

      float d = sdBoxFrame(p, vec3(4.0), 0.5);

      // Turbulence
      vec3 q = p;
      q += cos(q.yzx + u_time * 1.0) * 0.2;
      q += cos(q.yzx * 2.0 - u_time * 1.0) * 0.4;
      q += cos(q.yzx * 4.0 + u_time * 2.0) * 0.6;
      float d1 = length(cos(q * 2.0)) - 0.1;
      d = min(d, d1);

      d = abs(d) * 0.3 + 0.01;

      col += s1(vec3(3.0, 2.0, 1.0) + i * 0.2 - u_time + dot(p, vec3(0.1))) / d;

      z += d;
    }

    col = tanh3(col / 900.0) * brightness;

    // Calculate alpha
    float alpha = clamp(length(col) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

// State for WebGL resources (uses shared canvas)
const state = {
  program: null as WebGLProgram | null,
  uniforms: {} as Record<string, WebGLUniformLocation | null>,
  time: 0,
};

export default function renderWebGL4D({
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
