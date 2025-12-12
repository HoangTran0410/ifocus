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
    audioTexture: WebGLTexture | null;
    audioData: Uint8Array | null;
  }
>();

// Audio texture size (like Shadertoy's iChannel0: 512 frequencies x 2 rows)
const AUDIO_TEXTURE_SIZE = 512;

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
  const mode = props.mode || "default";
  let state = stateCached.get(mode);
  if (!state) {
    state = {
      program: null,
      uniforms: {},
      time: 0,
      audioTexture: null,
      audioData: null,
    };
    stateCached.set(mode, state);
  }
  if (!state.program) {
    state.program = createProgram(gl, FULLSCREEN_VERTEX_SHADER, shaderCode);
    if (!state.program) return;
    state.uniforms = getUniforms(gl, state.program);
  }

  // Create audio texture if needed (like Shadertoy's iChannel0)
  // Only create/update if shader uses u_audioData uniform (getUniforms returns null for missing uniforms)
  const needsAudioTexture = state.uniforms.u_audioData != null;

  if (needsAudioTexture) {
    if (!state.audioTexture) {
      state.audioTexture = gl.createTexture();
      state.audioData = new Uint8Array(AUDIO_TEXTURE_SIZE * 2 * 4); // 512x2 RGBA
    }

    // Update audio texture with frequency data
    if (state.audioTexture && state.audioData) {
      // Fill first row with frequency data (scaled to 0-255)
      for (let i = 0; i < AUDIO_TEXTURE_SIZE; i++) {
        const dataIndex = Math.floor((i / AUDIO_TEXTURE_SIZE) * data.length);
        const value = Math.floor((data[dataIndex] || 0) * 255);
        const pixelIndex = i * 4;
        state.audioData[pixelIndex] = value; // R
        state.audioData[pixelIndex + 1] = value; // G
        state.audioData[pixelIndex + 2] = value; // B
        state.audioData[pixelIndex + 3] = 255; // A
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, state.audioTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        AUDIO_TEXTURE_SIZE,
        2,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        state.audioData
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
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

  // Bind audio texture to sampler only if shader needs it
  if (needsAudioTexture && state.audioTexture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.audioTexture);
    gl.uniform1i(state.uniforms.u_audioData, 0);
  }

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
    state.time = 0;
    stateCached.delete(mode);
  }
}
