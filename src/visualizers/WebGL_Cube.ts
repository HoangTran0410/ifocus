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

// WebGL Cube - Glowing raymarched cube with reflections
// Adapted from Shadertoy shader (CC0 License)
// Original: https://twigl.app?ol=true&ss=-OW-y9xgRgWubwKcn0Nd

const FRAGMENT_SHADER = /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform vec2 u_resolution;

  #define M 1e-3

  // Rotation matrix
  mat2 R;

  // Distance and glow tracking
  float d = 1.0;
  float G = 9.0;

  // Distance function (SDF)
  float D(vec3 p, float bassPulse) {
    // Apply rotations
    p.xy *= R;
    p.xz *= R;

    // High frequency detail
    vec3 S = sin(123.0 * p);

    // Glow sphere radius pulses with bass (kick drums)
    float sphereRadius = 0.6 + bassPulse * 0.2;

    // Glow effect - track minimum distance
    G = min(
      G,
      max(
        abs(length(p) - sphereRadius),
        // Superquadric (rounded cube) using L8-norm
        d = pow(dot(p *= p * p * p, p), 0.125) - 0.5
          // Surface detail
          - pow(1.0 + S.x * S.y * S.z, 8.0) / 1e5
      )
    );

    return d;
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec3 r = vec3(u_resolution, 1.0);

    // Ray direction
    vec3 I = normalize(vec3(fragCoord - 0.5 * r.xy, r.y));

    // Base glow color (bluish tint)
    vec3 B = vec3(1.0, 2.0, 9.0) * M;

    // Reset globals
    d = 1.0;
    G = 9.0;

    // Calculate rotation matrix - constant smooth rotation
    float angle = 0.3 * u_time;
    R = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    // Raymarching
    float z = 0.0;
    vec3 p;

    for (int i = 0; i < 100; i++) {
      if (z >= 9.0 || d <= M) break;

      p = z * I;
      p.z -= 2.0;
      z += D(p, u_bass);
    }

    vec3 O = vec3(0.0);

    // Hit condition
    if (z < 9.0) {
      // Calculate surface normal via central differences
      vec3 n = vec3(0.0);
      vec3 e = vec3(M, 0.0, 0.0);
      n.x = D(p + e.xyy, u_bass) - D(p - e.xyy, u_bass);
      n.y = D(p + e.yxy, u_bass) - D(p - e.yxy, u_bass);
      n.z = D(p + e.yyx, u_bass) - D(p - e.yyx, u_bass);
      n = normalize(n);

      // Fresnel factor
      float fresnel = 1.0 + dot(n, I);

      // Reflection vector
      vec3 refl = reflect(I, n);

      // Calculate reflection sample point
      vec2 C = (p + refl * (5.0 - p.y) / abs(refl.y)).xz;

      // Calculate color based on reflection direction
      if (refl.y > 0.0) {
        // Sky reflection
        float dist = sqrt(length(C * C)) + 1.0;
        O = fresnel * fresnel * 5e2 * smoothstep(5.0, 4.0, dist) * dist * B;
      } else {
        // Floor reflection
        O = fresnel * fresnel * exp(-2.0 * length(C)) * (B / M - 1.0);
      }

      // Add rim lighting
      O += pow(1.0 + n.y, 5.0) * B;
    }

    // Add glow contribution
    vec3 glow = B / G;

    // Mid frequencies enhance glow (synths, vocals)
    glow *= 1.0 + u_mid * 4.0;

    // Tonemapping
    vec3 color = sqrt(O + glow);

    // Intensity boost
    color *= 1.0 + u_intensity * 0.2;

    // Calculate alpha for transparent background
    float alpha = clamp(length(color) * 1.5, 0.0, 1.0);

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

export default function renderWebGLCube({
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

  // Calculate intensity from audio data
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
