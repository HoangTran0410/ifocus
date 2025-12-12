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

// Star Nest by Pablo Roman Andrioli
// License: MIT
// https://www.shadertoy.com/view/XlfGRj

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

  #define iterations 17
  #define formuparam 0.53

  #define volsteps 20
  #define stepsize 0.1

  #define zoom   0.800
  #define tile   0.850
  #define speed  0.002

  #define brightness 0.0015
  #define darkmatter 0.300
  #define distfading 0.730
  #define saturation 0.850

  void main() {
    vec2 fragCoord = v_uv * u_resolution;

    // Beat only affects star glow
    float beatGlow = 1.0 + u_bass * 0.8;

    // Get coords and direction
    vec2 uv = fragCoord.xy / u_resolution.xy - 0.5;
    uv.y *= u_resolution.y / u_resolution.x;
    vec3 dir = vec3(uv * zoom, 1.0);
    float time = u_time * speed + 0.25;

    // Static rotation - fixed camera angle for smooth forward flight
    float a1 = 0.5;
    float a2 = 0.8;

    mat2 rot1 = mat2(cos(a1), sin(a1), -sin(a1), cos(a1));
    mat2 rot2 = mat2(cos(a2), sin(a2), -sin(a2), cos(a2));
    dir.xz *= rot1;
    dir.xy *= rot2;
    vec3 from = vec3(1.0, 0.5, 0.5);
    from += vec3(time * 2.0, time, -2.0);
    from.xz *= rot1;
    from.xy *= rot2;

    // Volumetric rendering
    float s = 0.1;
    float fade = 1.0;
    vec3 v = vec3(0.0);

    for (int r = 0; r < volsteps; r++) {
      vec3 p = from + s * dir * 0.5;
      p = abs(vec3(tile) - mod(p, vec3(tile * 2.0))); // tiling fold

      float pa = 0.0;
      float a = 0.0;

      for (int i = 0; i < iterations; i++) {
        p = abs(p) / dot(p, p) - formuparam; // the magic formula
        a += abs(length(p) - pa); // absolute sum of average change
        pa = length(p);
      }

      float dm = max(0.0, darkmatter - a * a * 0.001); // dark matter
      a *= a * a; // add contrast

      if (r > 6) fade *= 1.0 - dm; // dark matter, don't render near

      v += fade;
      v += vec3(s, s * s, s * s * s * s) * a * brightness * fade; // coloring based on distance
      fade *= distfading; // distance fading
      s += stepsize;
    }

    v = mix(vec3(length(v)), v, saturation); // color adjust
    v *= 0.01 * beatGlow;

    // Deep space background gradient
    vec2 bgUv = fragCoord.xy / u_resolution.xy;
    vec3 deepSpace = mix(
      vec3(0.02, 0.01, 0.05),  // Dark purple
      vec3(0.0, 0.02, 0.08),   // Dark blue
      bgUv.y
    );

    // Blend stars over deep space background
    v = v + deepSpace * (1.0 - clamp(length(v) * 2.0, 0.0, 1.0));

    gl_FragColor = vec4(v, 1.0);
  }
`;

// State for WebGL resources (uses shared canvas)
const state = {
  program: null as WebGLProgram | null,
  uniforms: {} as Record<string, WebGLUniformLocation | null>,
  time: 0,
};

export default function renderWebGLStarNest({
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
