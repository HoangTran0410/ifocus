import { VisualizeFnProps } from "../types";
import {
  copyToCanvas2D,
  createProgram,
  drawSharedQuad,
  ensureSharedCanvasSize,
  ensureSharedQuad,
  FULLSCREEN_VERTEX_SHADER,
  getSharedCanvas,
  getSharedGL,
  getUniforms,
} from "./utils";

const stateCached = new Map<
  string,
  {
    program: WebGLProgram | null;
    uniforms: Record<string, WebGLUniformLocation | null>;
    time: number;
  }
>();

export function renderShaderCode(props: VisualizeFnProps, shaderCode: string) {
  const {
    ctx,
    canvas,
    data,
    performanceMode = false,
    beatIntensity = 0,
    bass = 0,
    mid = 0,
    high = 0,
  } = props;

  // Use shared WebGL canvas and context
  if (!ensureSharedCanvasSize(canvas.width, canvas.height)) return;
  const glCanvas = getSharedCanvas();
  const gl = getSharedGL();
  if (!gl) return;

  // Initialize program if needed
  let state = stateCached.get(props.mode);
  if (!state) {
    state = {
      program: null,
      uniforms: {},
      time: 0,
    };
    stateCached.set(props.mode, state);
  }
  if (!state.program) {
    state.program = createProgram(gl, FULLSCREEN_VERTEX_SHADER, shaderCode);
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

export function cleanup(mode?: string | number): void {
  if (mode === 0) {
    stateCached.clear();
  } else if (typeof mode === "string") {
    const state = stateCached.get(mode);
    if (!state) return;
    state.program = null;
    state.uniforms = {};
  }
}
