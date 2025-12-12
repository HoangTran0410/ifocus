import { VisualizeFnProps } from "./shared";
import {
  getWebGLContext,
  createProgram,
  getUniforms,
  FULLSCREEN_VERTEX_SHADER,
  setupFullscreenQuad,
  drawFullscreenQuad,
  copyToCanvas2D,
} from "./shader/utils";

// WebGL Sunset - Synthwave sunset with procedural grid terrain
// Adapted from Shadertoy shader: https://www.shadertoy.com/view/tsScRK

const FRAGMENT_SHADER = /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform vec2 u_resolution;

  #define PI 3.14159265359
  #define speed 2.0
  #define audio_vibration_amplitude 0.125

  float jTime;

  float amp(vec2 p) {
    return smoothstep(1.0, 8.0, abs(p.x));
  }

  float pow512(float a) {
    a *= a; // ^2
    a *= a; // ^4
    a *= a; // ^8
    a *= a; // ^16
    a *= a; // ^32
    a *= a; // ^64
    a *= a; // ^128
    a *= a; // ^256
    return a * a;
  }

  float pow1d5(float a) {
    return a * sqrt(a);
  }

  float hash21(vec2 co) {
    return fract(sin(dot(co.xy, vec2(1.9898, 7.233))) * 45758.5433);
  }

  float hash(vec2 uv) {
    float a = amp(uv);
    // Wave effect
    float w = a > 0.0 ? (1.0 - 0.4 * pow512(0.51 + 0.49 * sin((0.02 * (uv.y + 0.5 * uv.x) - jTime) * 2.0))) : 0.0;
    return (a > 0.0 ? a * pow1d5(hash21(uv)) * w : 0.0);
  }

  float edgeMin(float dx, vec2 da, vec2 db, vec2 uv) {
    uv.x += 5.0;
    vec3 c = fract((floor(vec3(uv, uv.x + uv.y) + 0.5)) * (vec3(0.0, 1.0, 2.0) + 0.61803398875));
    return min(min((1.0 - dx) * db.y, da.x), da.y);
  }

  vec2 trinoise(vec2 uv) {
    const float sq = 1.2247448714; // sqrt(3.0/2.0)
    uv.x *= sq;
    uv.y -= 0.5 * uv.x;
    vec2 d = fract(uv);
    uv -= d;

    float cond = step(1.0, dot(d, vec2(1.0)));

    vec2 dd = 1.0 - d;
    vec2 da = mix(d, dd, cond);
    vec2 db = mix(dd, d, cond);

    float nn = hash(uv + cond);
    float n2 = hash(uv + vec2(1.0, 0.0));
    float n3 = hash(uv + vec2(0.0, 1.0));

    float nmid = mix(n2, n3, d.y);
    float ns = mix(nn, mix(n2, n3, cond), da.y);
    float dx = da.x / db.y;
    return vec2(mix(ns, nmid, dx), edgeMin(dx, da, db, uv + d));
  }

  vec2 map(vec3 p) {
    vec2 n = trinoise(p.xz);
    return vec2(p.y - 2.0 * n.x, n.y);
  }

  vec3 grad(vec3 p) {
    const vec2 e = vec2(0.005, 0.0);
    float a = map(p).x;
    return vec3(
      map(p + e.xyy).x - a,
      map(p + e.yxy).x - a,
      map(p + e.yyx).x - a
    ) / e.x;
  }

  vec2 intersect(vec3 ro, vec3 rd) {
    float d = 0.0;
    float h = 0.0;
    for (int i = 0; i < 80; i++) { // Reduced iterations for performance
      vec3 p = ro + d * rd;
      vec2 s = map(p);
      h = s.x;
      d += h * 0.5;
      if (abs(h) < 0.003 * d) {
        return vec2(d, s.y);
      }
      if (d > 150.0 || p.y > 2.0) break;
    }
    return vec2(-1.0);
  }

  void addsun(vec3 rd, vec3 ld, inout vec3 col) {
    float sun = smoothstep(0.21, 0.2, distance(rd, ld));

    if (sun > 0.0) {
      float yd = (rd.y - ld.y);
      float a = sin(3.1 * exp(-yd * 14.0));
      sun *= smoothstep(-0.8, 0.0, a);
      col = mix(col, vec3(1.0, 0.8, 0.4) * 0.75, sun);
    }
  }

  float starnoise(vec3 rd) {
    float c = 0.0;
    vec3 p = normalize(rd) * 300.0;
    for (int i = 0; i < 4; i++) {
      vec3 q = fract(p) - 0.5;
      vec3 id = floor(p);
      float c2 = smoothstep(0.5, 0.0, length(q));
      c2 *= step(hash21(id.xz / id.y), 0.06 - float(i * i) * 0.005);
      c += c2;
      p = p * 0.6 + 0.5 * p * mat3(0.6, 0.0, 0.8, 0.0, 1.0, 0.0, -0.8, 0.0, 0.6);
    }
    c *= c;
    float g = dot(sin(rd * 10.512), cos(rd.yzx * 10.512));
    c *= smoothstep(-3.14, -0.9, g) * 0.5 + 0.5 * smoothstep(-0.3, 1.0, g);
    return c * c;
  }

  vec3 gsky(vec3 rd, vec3 ld, float mask) {
    float haze = exp2(-5.0 * (abs(rd.y) - 0.2 * dot(rd, ld)));

    float st = mask > 0.5 ? starnoise(rd) * (1.0 - min(haze, 1.0)) : 0.0;
    vec3 back = vec3(0.4, 0.1, 0.7);

    vec3 col = clamp(mix(back, vec3(0.7, 0.1, 0.4), haze) + st, 0.0, 1.0);
    if (mask > 0.5) addsun(rd, ld, col);
    return col;
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;

    vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;

    // Motion blur - spatial variation only (no temporal jitter)
    // Using only fragCoord for hash, not iTime, so offset is stable per pixel
    float shutter_speed = 0.25;
    float dt = hash21(fragCoord) * shutter_speed;
    jTime = u_time - dt * 0.016;

    // Forward movement speed with mid frequencies boost
    float audioSpeed = speed + u_mid * 0.05;

    vec3 ro = vec3(0.0, 1.0, (-20000.0 + jTime * audioSpeed));
    vec3 rd = normalize(vec3(uv, 4.0 / 3.0));

    vec2 i = intersect(ro, rd);
    float d = i.x;

    // Sun position - stable
    vec3 ld = normalize(vec3(0.0, 0.125 + 0.05 * sin(0.1 * jTime), 1.0));

    vec3 fog = d > 0.0 ? exp2(-d * vec3(0.14, 0.1, 0.28)) : vec3(0.0);
    vec3 sky = gsky(rd, ld, d < 0.0 ? 1.0 : 0.0);

    vec3 p = ro + d * rd;
    vec3 n = normalize(grad(p));

    float diff = dot(n, ld) + 0.1 * n.y;
    vec3 col = vec3(0.1, 0.11, 0.18) * diff;

    vec3 rfd = reflect(rd, n);
    vec3 rfcol = gsky(rfd, ld, 1.0);

    col = mix(col, rfcol, 0.05 + 0.95 * pow(max(1.0 + dot(rd, n), 0.0), 5.0));

    // Grid lines - pulse brightness on bass
    float gridPulse = 1.0 + u_bass * 2.0; // Brightness boost on bass
    float gridWidth = 0.05 + u_bass * 0.04; // Slightly wider on bass
    vec3 gridColor = vec3(0.8, 0.1, 0.92) * gridPulse;
    col = mix(col, gridColor, smoothstep(gridWidth, 0.0, i.y));
    col = mix(sky, col, fog);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
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

export default function renderWebGLSunset({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
  mid = 0,
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
  state.time += performanceMode ? 0.012 : 0.016;

  // Calculate intensity
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

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
  gl.uniform1f(state.uniforms.u_mid, mid);
  gl.uniform2f(state.uniforms.u_resolution, canvas.width, canvas.height);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  drawFullscreenQuad(gl, state.program);

  // Copy to 2D canvas
  copyToCanvas2D(state.glCanvas, ctx, canvas);
}
