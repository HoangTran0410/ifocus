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

// Fractal Pyramid
// https://www.shadertoy.com/view/tsXBzS

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

  vec3 palette(float d) {
    return mix(vec3(0.2, 0.7, 0.9), vec3(1.0, 0.0, 1.0), d);
  }

  vec2 rotate(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return p * mat2(c, s, -s, c);
  }

  float map(vec3 p, float t) {
    for (int i = 0; i < 8; ++i) {
      p.xz = rotate(p.xz, t);
      p.xy = rotate(p.xy, t * 1.89);
      p.xz = abs(p.xz);
      p.xz -= 0.5;
    }
    return dot(sign(p), p) / 5.0;
  }

  vec4 rm(vec3 ro, vec3 rd, float t, float brightness) {
    float rayT = 0.0;
    vec3 col = vec3(0.0);
    float d;
    for (float i = 0.0; i < 64.0; i++) {
      vec3 p = ro + rd * rayT;
      d = map(p, t) * 0.5;
      if (d < 0.02) {
        break;
      }
      if (d > 100.0) {
        break;
      }
      col += palette(length(p) * 0.1) / (400.0 * d) * brightness;
      rayT += d;
    }
    return vec4(col, 1.0 / (d * 100.0));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 uv = (fragCoord - (u_resolution.xy / 2.0)) / u_resolution.x;

    // Audio affects brightness and size only
    float brightness = 1.0 + u_bass * 2.0;
    float scale = 1.0 + u_bass * 0.3;  // Size scales up on beat
    float t = u_time * 0.2;  // Constant rotation speed

    // Apply scale to uv
    uv /= scale;

    vec3 ro = vec3(0.0, 0.0, -50.0);
    ro.xz = rotate(ro.xz, u_time * 0.2);
    vec3 cf = normalize(-ro);
    vec3 cs = normalize(cross(cf, vec3(0.0, 1.0, 0.0)));
    vec3 cu = normalize(cross(cf, cs));

    vec3 uuv = ro + cf * 3.0 + uv.x * cs + uv.y * cu;

    vec3 rd = normalize(uuv - ro);

    vec4 col = rm(ro, rd, t, brightness);

    // Calculate alpha based on brightness
    float alpha = clamp(length(col.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(col.rgb, alpha);
  }
`;

// State for WebGL resources (uses shared canvas)
const state = {
  program: null as WebGLProgram | null,
  uniforms: {} as Record<string, WebGLUniformLocation | null>,
  time: 0,
};

export default function renderWebGLFractalPyramid({
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
