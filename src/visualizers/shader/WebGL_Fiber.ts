import { VisualizeFnProps } from "../types";
import { getSharedCanvas, getSharedGL, ensureSharedCanvasSize } from "./utils";

// Fiber Zooming - by Leon Denise 2025
// Inspired by motion design in "Kurzgesagt - Trees Are So Weird"
// https://youtu.be/ZSch_NgZpQs?t=193
// Multi-pass version with framebuffer for proper blur effect
// https://www.shadertoy.com/view/3fKyDG

const VERTEX_SHADER = /*glsl*/ `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Pass 1: Render fiber pattern to texture (Buffer A)
const BUFFER_A_SHADER = /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform vec2 u_resolution;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  float sineInOut(float t) {
    return -0.5 * (cos(3.1415 * t) - 1.0);
  }

  float sdBox(in vec2 p, in vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 p = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;

    p.x = log(0.1 + abs(p.x) * 1.0);

    float tt = u_time * 0.1;
    tt = sineInOut(fract(tt)) + floor(tt);
    tt *= 4.0;

    float columns = 5.0;
    float column_index = floor(p.x * columns - tt);
    float t = tt * (hash11(column_index + 73.0) - 0.5) * 4.0;
    float rows = mix(0.5, 10.0, hash11(column_index + 753.0));
    float row_index = floor(p.y * rows + t);

    p.x = fract(p.x * columns - tt) - 0.5;
    p.y = fract(p.y * rows + t) - 0.5;

    float shape = sdBox(p, vec2(0.3, 0.4));
    float shade = smoothstep(0.1, 0.0, shape);

    float value = hash11(row_index + column_index + 357.0);
    float hue = length(vec2(column_index, row_index * 10.0)) * 0.01;

    float paletteShift = u_time;
    vec3 palette = cos(vec3(1.0, 2.0, 3.0) * 5.5 + paletteShift + hue);

    vec3 color = value * palette * shade;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Pass 2: Sample texture with mipmap blur (Image pass)
const IMAGE_SHADER = /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform sampler2D u_texture;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;

  // Interleaved gradient noise for dithering
  float InterleavedGradientNoise(vec2 uv) {
    const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(uv, magic.xy)));
  }

  void main() {
    vec2 uv = v_uv;
    float rng = InterleavedGradientNoise(gl_FragCoord.xy);

    // Sample with blur - mix between sharp and blurred based on noise
    // In WebGL 1.0, we simulate mipmap blur by sampling at different offsets
    float blurAmount = 0.01 + rng * 0.02;

    vec3 color = vec3(0.0);
    // 9-sample blur pattern
    color += texture2D(u_texture, uv).rgb * 0.25;
    color += texture2D(u_texture, uv + vec2(-blurAmount, 0.0)).rgb * 0.125;
    color += texture2D(u_texture, uv + vec2(blurAmount, 0.0)).rgb * 0.125;
    color += texture2D(u_texture, uv + vec2(0.0, -blurAmount)).rgb * 0.125;
    color += texture2D(u_texture, uv + vec2(0.0, blurAmount)).rgb * 0.125;
    color += texture2D(u_texture, uv + vec2(-blurAmount, -blurAmount)).rgb * 0.0625;
    color += texture2D(u_texture, uv + vec2(blurAmount, -blurAmount)).rgb * 0.0625;
    color += texture2D(u_texture, uv + vec2(-blurAmount, blurAmount)).rgb * 0.0625;
    color += texture2D(u_texture, uv + vec2(blurAmount, blurAmount)).rgb * 0.0625;

    // Apply brightness based on horizontal position (like original)
    float brightness = (abs(uv.x - 0.5) + 0.5) * 5.0;
    color *= brightness;

    // Audio-reactive boost
    float audioBoost = 0.3 + u_bass * 2.5 + u_mid * 1.5 + u_beatIntensity * 3.0;
    color *= audioBoost;

    // Color punch on beats
    color = mix(color, color * 2.0 + vec3(0.3), u_beatIntensity * 0.5);

    float alpha = clamp(length(color) * 0.8, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

// State for WebGL resources (framebuffer stuff stays per-visualizer, but uses shared canvas)
const state = {
  bufferAProgram: null as WebGLProgram | null,
  imageProgram: null as WebGLProgram | null,
  framebuffer: null as WebGLFramebuffer | null,
  texture: null as WebGLTexture | null,
  quadBuffer: null as WebGLBuffer | null,
  uniforms: {
    bufferA: {} as Record<string, WebGLUniformLocation | null>,
    image: {} as Record<string, WebGLUniformLocation | null>,
  },
  textureWidth: 0,
  textureHeight: 0,
  time: 0,
};

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram | null {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function initWebGL(
  gl: WebGLRenderingContext,
  width: number,
  height: number
): boolean {
  // Create programs
  state.bufferAProgram = createProgram(gl, VERTEX_SHADER, BUFFER_A_SHADER);
  state.imageProgram = createProgram(gl, VERTEX_SHADER, IMAGE_SHADER);

  if (!state.bufferAProgram || !state.imageProgram) return false;

  // Get uniforms for Buffer A
  state.uniforms.bufferA = {
    u_time: gl.getUniformLocation(state.bufferAProgram, "u_time"),
    u_resolution: gl.getUniformLocation(state.bufferAProgram, "u_resolution"),
  };

  // Get uniforms for Image pass
  state.uniforms.image = {
    u_texture: gl.getUniformLocation(state.imageProgram, "u_texture"),
    u_beatIntensity: gl.getUniformLocation(
      state.imageProgram,
      "u_beatIntensity"
    ),
    u_bass: gl.getUniformLocation(state.imageProgram, "u_bass"),
    u_mid: gl.getUniformLocation(state.imageProgram, "u_mid"),
  };

  // Create quad buffer
  state.quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, state.quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  // Create framebuffer and texture
  state.framebuffer = gl.createFramebuffer();
  state.texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, state.texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    state.texture,
    0
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  state.textureWidth = width;
  state.textureHeight = height;

  return true;
}

function resizeTexture(
  gl: WebGLRenderingContext,
  width: number,
  height: number
) {
  if (state.textureWidth === width && state.textureHeight === height) return;

  gl.bindTexture(gl.TEXTURE_2D, state.texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  state.textureWidth = width;
  state.textureHeight = height;
}

function drawQuad(gl: WebGLRenderingContext, program: WebGLProgram) {
  const posLoc = gl.getAttribLocation(program, "a_position");
  gl.bindBuffer(gl.ARRAY_BUFFER, state.quadBuffer);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export default function renderWebGLFiber({
  ctx,
  canvas,
  data,
  performanceMode = false,
  beatIntensity = 0,
  bass = 0,
  mid = 0,
}: VisualizeFnProps) {
  // Use shared WebGL canvas and context
  if (!ensureSharedCanvasSize(canvas.width, canvas.height)) return;
  const glCanvas = getSharedCanvas();
  const gl = getSharedGL();
  if (!gl) return;

  // Initialize WebGL resources if needed
  if (!state.bufferAProgram) {
    if (!initWebGL(gl, canvas.width, canvas.height)) return;
  }

  if (!state.bufferAProgram || !state.imageProgram) return;

  // Resize texture if needed
  resizeTexture(gl, canvas.width, canvas.height);

  // Update time
  state.time += performanceMode ? 0.012 : 0.016;

  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;

  // PASS 1: Render fiber pattern to framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(state.bufferAProgram);
  gl.uniform1f(state.uniforms.bufferA.u_time, state.time);
  gl.uniform1f(state.uniforms.bufferA.u_intensity, avgIntensity);
  gl.uniform1f(state.uniforms.bufferA.u_beatIntensity, beatIntensity);
  gl.uniform1f(state.uniforms.bufferA.u_bass, bass);
  gl.uniform1f(state.uniforms.bufferA.u_mid, mid);
  gl.uniform2f(
    state.uniforms.bufferA.u_resolution,
    canvas.width,
    canvas.height
  );

  gl.disable(gl.BLEND);
  drawQuad(gl, state.bufferAProgram);

  // PASS 2: Apply blur and render to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(state.imageProgram);
  gl.uniform1i(state.uniforms.image.u_texture, 0);
  gl.uniform2f(state.uniforms.image.u_resolution, canvas.width, canvas.height);
  gl.uniform1f(state.uniforms.image.u_beatIntensity, beatIntensity);
  gl.uniform1f(state.uniforms.image.u_bass, bass);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.texture);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawQuad(gl, state.imageProgram);

  // Copy to 2D canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(glCanvas, 0, 0);
}

export function cleanup(): void {
  const gl = getSharedGL();
  if (gl) {
    if (state.bufferAProgram) gl.deleteProgram(state.bufferAProgram);
    if (state.imageProgram) gl.deleteProgram(state.imageProgram);
    if (state.framebuffer) gl.deleteFramebuffer(state.framebuffer);
    if (state.texture) gl.deleteTexture(state.texture);
    if (state.quadBuffer) gl.deleteBuffer(state.quadBuffer);
  }

  state.bufferAProgram = null;
  state.imageProgram = null;
  state.framebuffer = null;
  state.texture = null;
  state.quadBuffer = null;
  state.textureWidth = 0;
  state.textureHeight = 0;
}
