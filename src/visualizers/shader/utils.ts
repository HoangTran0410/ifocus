/**
 * WebGL Shader Utilities
 * Shared helpers for creating WebGL shader-based visualizers
 */

// WebGL context cache per canvas
const glContextCache = new WeakMap<HTMLCanvasElement, WebGLRenderingContext>();
// Track all active contexts for cleanup
const activeContexts = new Set<{
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
}>();

/**
 * Get or create a WebGL context for a canvas
 */
export function getWebGLContext(
  canvas: HTMLCanvasElement
): WebGLRenderingContext | null {
  let gl = glContextCache.get(canvas);
  if (gl) return gl;

  const params = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  gl = (canvas.getContext("webgl2", params) ||
    canvas.getContext("webgl", params) ||
    canvas.getContext("experimental-webgl", params)) as WebGLRenderingContext;

  if (gl) {
    glContextCache.set(canvas, gl);
    activeContexts.add({ canvas, gl });
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    // Warn if too many contexts are active (browser typically limits to 8-16)
    if (activeContexts.size > 6) {
      console.warn(
        `[WebGL] WARNING: ${activeContexts.size} active WebGL contexts! Risk of context loss.`
      );
    }
  }

  return gl;
}

/**
 * Release a WebGL context to free up resources
 * This helps prevent "Too many active WebGL contexts" warnings
 */
export function releaseWebGLContext(canvas: HTMLCanvasElement): void {
  const gl = glContextCache.get(canvas);
  if (gl) {
    // Use WEBGL_lose_context extension to explicitly release the context
    const loseContext = gl.getExtension("WEBGL_lose_context");
    if (loseContext) {
      loseContext.loseContext();
    }
    glContextCache.delete(canvas);

    // Remove from active contexts set
    for (const entry of activeContexts) {
      if (entry.canvas === canvas) {
        activeContexts.delete(entry);
        break;
      }
    }
  }
}

/**
 * Get the number of active WebGL contexts
 */
export function getActiveContextCount(): number {
  return activeContexts.size;
}

// ============================================
// Shared WebGL State Manager
// ============================================
// Single canvas and context shared by all WebGL visualizers
// This prevents "Too many active WebGL contexts" warnings

interface SharedWebGLState {
  glCanvas: HTMLCanvasElement | null;
  gl: WebGLRenderingContext | null;
  quadBuffer: WebGLBuffer | null;
  quadSetup: boolean;
}

const sharedState: SharedWebGLState = {
  glCanvas: null,
  gl: null,
  quadBuffer: null,
  quadSetup: false,
};

/**
 * Get the shared WebGL canvas, creating it if necessary
 */
export function getSharedCanvas(): HTMLCanvasElement {
  if (!sharedState.glCanvas) {
    sharedState.glCanvas = document.createElement("canvas");
  }
  return sharedState.glCanvas;
}

/**
 * Ensure the shared canvas is the correct size and has a valid GL context
 */
export function ensureSharedCanvasSize(width: number, height: number): boolean {
  const canvas = getSharedCanvas();

  // Resize if needed
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  // Ensure we have a GL context
  if (!sharedState.gl) {
    console.log("[WebGL] Creating shared WebGL context");
    sharedState.gl = getWebGLContext(canvas);
    sharedState.quadSetup = false;

    if (!sharedState.gl) {
      console.warn("[WebGL] Failed to create shared WebGL context!");
    }
  }

  return sharedState.gl !== null;
}

/**
 * Get the shared WebGL context
 */
export function getSharedGL(): WebGLRenderingContext | null {
  return sharedState.gl;
}

/**
 * Setup the shared fullscreen quad (call once per visualizer switch if needed)
 */
export function ensureSharedQuad(): void {
  const gl = sharedState.gl;
  if (!gl || sharedState.quadSetup) return;

  // Create quad buffer if not exists
  if (!sharedState.quadBuffer) {
    sharedState.quadBuffer = gl.createBuffer();
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, sharedState.quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  sharedState.quadSetup = true;
}

/**
 * Draw a fullscreen quad using the shared buffer
 */
export function drawSharedQuad(program: WebGLProgram): void {
  const gl = sharedState.gl;
  if (!gl || !sharedState.quadBuffer) return;

  const posLoc = gl.getAttribLocation(program, "a_position");
  gl.bindBuffer(gl.ARRAY_BUFFER, sharedState.quadBuffer);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

/**
 * Release the shared WebGL resources
 */
export function releaseSharedContext(): void {
  console.log("[WebGL] Releasing shared WebGL context");
  if (sharedState.gl && sharedState.glCanvas) {
    releaseWebGLContext(sharedState.glCanvas);
  }
  sharedState.glCanvas = null;
  sharedState.gl = null;
  sharedState.quadBuffer = null;
  sharedState.quadSetup = false;
}

/**
 * Compile a shader from source
 * @param keywords Optional array of keywords to prepend as #define statements
 */
export function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
  keywords?: string[]
): WebGLShader | null {
  // Prepend keywords as #define statements
  if (keywords && keywords.length > 0) {
    const keywordsString = keywords.map((k) => `#define ${k}\n`).join("");
    source = keywordsString + source;
  }

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

/**
 * Create a shader program from vertex and fragment shader sources
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) return null;

  return createProgramFromShaders(gl, vertexShader, fragmentShader);
}

/**
 * Create a shader program from pre-compiled vertex and fragment shaders
 */
export function createProgramFromShaders(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

/**
 * Get uniform locations from a program
 */
export function getUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram
): Record<string, WebGLUniformLocation | null> {
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  for (let i = 0; i < uniformCount; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
  }

  return uniforms;
}

/**
 * Standard fullscreen quad vertex shader
 */
export const FULLSCREEN_VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

/**
 * Create and setup fullscreen quad geometry
 */
export function setupFullscreenQuad(gl: WebGLRenderingContext): void {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]),
    gl.STATIC_DRAW
  );
}

/**
 * Draw fullscreen quad
 */
export function drawFullscreenQuad(
  gl: WebGLRenderingContext,
  program: WebGLProgram
): void {
  const positionLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

/**
 * Copy WebGL canvas to 2D canvas
 */
export function copyToCanvas2D(
  glCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(glCanvas, 0, 0);
}

/**
 * HSV to RGB conversion for shaders (returns values 0-1)
 */
export function hsvToRgb(
  h: number,
  s: number,
  v: number
): [number, number, number] {
  let r = 0,
    g = 0,
    b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return [r, g, b];
}

// Helper function for hashing keywords
export function hashCode(s: string): number {
  if (s.length === 0) return 0;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return hash;
}

// HSV to RGB wrapper for fluid colors
export function HSVtoRGB(h: number, s: number, v: number) {
  const [r, g, b] = hsvToRgb(h, s, v);
  return { r, g, b };
}

export function generateColor() {
  const c = HSVtoRGB(Math.random(), 1.0, 1.0);
  c.r *= 0.15;
  c.g *= 0.15;
  c.b *= 0.15;
  return c;
}
