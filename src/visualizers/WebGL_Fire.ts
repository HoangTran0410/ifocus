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

// "3D Fire" by @XorDev
// https://mini.gmshaders.com/p/turbulence
// https://www.shadertoy.com/view/3XXSWS

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

    // Audio affects fire height and intensity
    float fireHeight = 1.0 + u_bass * 0.8;
    float fireBrightness = 1.0 + u_bass * 2.0;

    float t = u_time;
    float z = 0.0;
    float d;

    vec4 O = vec4(0.0);

    // Raymarching loop with 50 iterations
    for (int iter = 0; iter < 50; iter++) {
      // Compute raymarch sample point
      vec3 p = z * normalize(vec3(fragCoord + fragCoord, 0.0) - u_resolution.xyy);

      // Shift back and animate
      p.z += 5.0 + cos(t);

      // Twist and rotate using mat2
      float angle = p.y * 0.5;
      mat2 rotMat = mat2(cos(angle), cos(angle - 33.0), cos(angle - 11.0), cos(angle));

      // Expand upward - audio affects the expansion
      float expand = max(p.y * 0.1 / fireHeight + 1.0, 0.1);
      p.xz = rotMat * p.xz / expand;

      // Turbulence loop
      d = 2.0;
      for (int j = 0; j < 8; j++) {
        if (d >= 15.0) break;
        p += cos((p.yzx - vec3(t / 0.1, t, d)) * d) / d;
        d /= 0.6;
      }

      // Sample approximate distance to hollow cone
      d = 0.01 + abs(length(p.xz) + p.y * 0.3 - 0.5) / 7.0;
      z += d;

      // Add color and glow attenuation
      O += (sin(z / 3.0 + vec4(7.0, 2.0, 3.0, 0.0)) + 1.1) / d;
    }

    // Apply audio brightness boost
    O *= fireBrightness;

    // Tanh tonemapping
    O = tanh4(O / 1000.0);

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

export default function renderWebGLFire({
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
