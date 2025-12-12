/**
 * WebGL Fluid Simulation Engine
 * Based on Pavel Dobryakov's WebGL-Fluid-Simulation (MIT License)
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 *
 * Ported to TypeScript and adapted for audio visualization
 */

import {
  compileShader,
  createProgramFromShaders,
  generateColor,
  getUniforms,
  hashCode,
} from "./utils";

// Configuration for the fluid simulation
export interface FluidConfig {
  SIM_RESOLUTION: number;
  DYE_RESOLUTION: number;
  DENSITY_DISSIPATION: number;
  VELOCITY_DISSIPATION: number;
  PRESSURE: number;
  PRESSURE_ITERATIONS: number;
  CURL: number;
  SPLAT_RADIUS: number;
  SPLAT_FORCE: number;
  SHADING: boolean;
  BLOOM: boolean;
  BLOOM_INTENSITY: number;
  BLOOM_THRESHOLD: number;
  BLOOM_SOFT_KNEE: number;
}

const DEFAULT_CONFIG: FluidConfig = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 1.0,
  VELOCITY_DISSIPATION: 0.2,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 30,
  SPLAT_RADIUS: 0.25,
  SPLAT_FORCE: 6000,
  SHADING: true,
  BLOOM: true,
  BLOOM_INTENSITY: 0.8,
  BLOOM_THRESHOLD: 0.6,
  BLOOM_SOFT_KNEE: 0.7,
};

const PERFORMANCE_CONFIG: Partial<FluidConfig> = {
  SIM_RESOLUTION: 64,
  DYE_RESOLUTION: 256,
  PRESSURE_ITERATIONS: 10,
  BLOOM: false,
  SHADING: false,
};

// WebGL extension info
interface GLExtensions {
  formatRGBA: { internalFormat: number; format: number } | null;
  formatRG: { internalFormat: number; format: number } | null;
  formatR: { internalFormat: number; format: number } | null;
  halfFloatTexType: number;
  supportLinearFiltering: boolean;
}

// Framebuffer object wrapper
interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

// Shader program wrapper
class Program {
  uniforms: Record<string, WebGLUniformLocation | null> = {};
  program: WebGLProgram;

  constructor(
    private gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) {
    this.program = createProgramFromShaders(gl, vertexShader, fragmentShader)!;
    this.uniforms = getUniforms(gl, this.program);
  }

  bind() {
    this.gl.useProgram(this.program);
  }
}

// Material with keyword support for conditional shader compilation
class Material {
  private vertexShader: WebGLShader;
  private fragmentShaderSource: string;
  private programs: Map<number, WebGLProgram> = new Map();
  activeProgram: WebGLProgram | null = null;
  uniforms: Record<string, WebGLUniformLocation | null> = {};

  constructor(
    private gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShaderSource: string
  ) {
    this.vertexShader = vertexShader;
    this.fragmentShaderSource = fragmentShaderSource;
  }

  setKeywords(keywords: string[]) {
    let hash = 0;
    for (const keyword of keywords) {
      hash += hashCode(keyword);
    }

    let program = this.programs.get(hash);
    if (!program) {
      const fragmentShader = compileShader(
        this.gl,
        this.gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords
      );
      program = createProgramFromShaders(
        this.gl,
        this.vertexShader,
        fragmentShader!
      )!;
      this.programs.set(hash, program);
    }

    if (program === this.activeProgram) return;

    this.uniforms = getUniforms(this.gl, program);
    this.activeProgram = program;
  }

  bind() {
    this.gl.useProgram(this.activeProgram);
  }
}

// Shader sources
const baseVertexShaderSource = /*glsl*/ `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;

  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const blurVertexShaderSource = /*glsl*/ `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  uniform vec2 texelSize;

  void main () {
    vUv = aPosition * 0.5 + 0.5;
    float offset = 1.33333333;
    vL = vUv - texelSize * offset;
    vR = vUv + texelSize * offset;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const blurShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  uniform sampler2D uTexture;

  void main () {
    vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
    sum += texture2D(uTexture, vL) * 0.35294117;
    sum += texture2D(uTexture, vR) * 0.35294117;
    gl_FragColor = sum;
  }
`;

const copyShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;

  void main () {
    gl_FragColor = texture2D(uTexture, vUv);
  }
`;

const clearShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const colorShaderSource = /*glsl*/ `
  precision mediump float;
  uniform vec4 color;

  void main () {
    gl_FragColor = color;
  }
`;

const displayShaderSource = /*glsl*/ `
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uTexture;
  uniform sampler2D uBloom;
  uniform vec2 texelSize;

  vec3 linearToGamma (vec3 color) {
    color = max(color, vec3(0));
    return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
  }

  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;

    #ifdef SHADING
      vec3 lc = texture2D(uTexture, vL).rgb;
      vec3 rc = texture2D(uTexture, vR).rgb;
      vec3 tc = texture2D(uTexture, vT).rgb;
      vec3 bc = texture2D(uTexture, vB).rgb;

      float dx = length(rc) - length(lc);
      float dy = length(tc) - length(bc);

      vec3 n = normalize(vec3(dx, dy, length(texelSize)));
      vec3 l = vec3(0.0, 0.0, 1.0);

      float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
      c *= diffuse;
    #endif

    #ifdef BLOOM
      vec3 bloom = texture2D(uBloom, vUv).rgb;
      bloom = linearToGamma(bloom);
      c += bloom;
    #endif

    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, a);
  }
`;

const bloomPrefilterShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec3 curve;
  uniform float threshold;

  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
    float br = max(c.r, max(c.g, c.b));
    float rq = clamp(br - curve.x, 0.0, curve.y);
    rq = curve.z * rq * rq;
    c *= max(rq, br - threshold) / max(br, 0.0001);
    gl_FragColor = vec4(c, 0.0);
  }
`;

const bloomBlurShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uTexture;

  void main () {
    vec4 sum = vec4(0.0);
    sum += texture2D(uTexture, vL);
    sum += texture2D(uTexture, vR);
    sum += texture2D(uTexture, vT);
    sum += texture2D(uTexture, vB);
    sum *= 0.25;
    gl_FragColor = sum;
  }
`;

const bloomFinalShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uTexture;
  uniform float intensity;

  void main () {
    vec4 sum = vec4(0.0);
    sum += texture2D(uTexture, vL);
    sum += texture2D(uTexture, vR);
    sum += texture2D(uTexture, vT);
    sum += texture2D(uTexture, vB);
    sum *= 0.25;
    gl_FragColor = sum * intensity;
  }
`;

const splatShaderSource = /*glsl*/ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;

  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const advectionShaderSource = /*glsl*/ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;

  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main () {
    #ifdef MANUAL_FILTERING
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      vec4 result = texture2D(uSource, coord);
    #endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

const divergenceShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const curlShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const vorticityShaderSource = /*glsl*/ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;

  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const pressureShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShaderSource = /*glsl*/ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

export class FluidSimulation {
  private gl: WebGLRenderingContext;
  private ext: GLExtensions;
  private config: FluidConfig;

  private dye!: DoubleFBO;
  private velocity!: DoubleFBO;
  private divergence!: FBO;
  private curl!: FBO;
  private pressure!: DoubleFBO;
  private bloom!: FBO;
  private bloomFramebuffers: FBO[] = [];

  private baseVertexShader!: WebGLShader;
  private blurVertexShader!: WebGLShader;

  private blurProgram!: Program;
  private copyProgram!: Program;
  private clearProgram!: Program;
  private colorProgram!: Program;
  private displayMaterial!: Material;
  private bloomPrefilterProgram!: Program;
  private bloomBlurProgram!: Program;
  private bloomFinalProgram!: Program;
  private splatProgram!: Program;
  private advectionProgram!: Program;
  private divergenceProgram!: Program;
  private curlProgram!: Program;
  private vorticityProgram!: Program;
  private pressureProgram!: Program;
  private gradientSubtractProgram!: Program;

  private blit: (target: FBO | null, clear?: boolean) => void;

  readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, performanceMode = false) {
    this.canvas = canvas;
    this.config = {
      ...DEFAULT_CONFIG,
      ...(performanceMode ? PERFORMANCE_CONFIG : {}),
    };

    // Get WebGL context
    const { gl, ext } = this.getWebGLContext(canvas);
    this.gl = gl;
    this.ext = ext;

    // Setup vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // Create blit function
    this.blit = (target: FBO | null, clear = false) => {
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (clear) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    // Compile shaders
    this.baseVertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      baseVertexShaderSource
    );
    this.blurVertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      blurVertexShaderSource
    );

    const blurShader = compileShader(gl, gl.FRAGMENT_SHADER, blurShaderSource);
    const copyShader = compileShader(gl, gl.FRAGMENT_SHADER, copyShaderSource);
    const clearShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      clearShaderSource
    );
    const colorShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      colorShaderSource
    );
    const bloomPrefilterShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      bloomPrefilterShaderSource
    );
    const bloomBlurShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      bloomBlurShaderSource
    );
    const bloomFinalShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      bloomFinalShaderSource
    );
    const splatShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      splatShaderSource
    );
    const advectionShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      advectionShaderSource,
      ext.supportLinearFiltering ? undefined : ["MANUAL_FILTERING"]
    );
    const divergenceShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      divergenceShaderSource
    );
    const curlShader = compileShader(gl, gl.FRAGMENT_SHADER, curlShaderSource);
    const vorticityShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      vorticityShaderSource
    );
    const pressureShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      pressureShaderSource
    );
    const gradientSubtractShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      gradientSubtractShaderSource
    );

    // Create programs
    this.blurProgram = new Program(gl, this.blurVertexShader, blurShader);
    this.copyProgram = new Program(gl, this.baseVertexShader, copyShader);
    this.clearProgram = new Program(gl, this.baseVertexShader, clearShader);
    this.colorProgram = new Program(gl, this.baseVertexShader, colorShader);
    this.bloomPrefilterProgram = new Program(
      gl,
      this.baseVertexShader,
      bloomPrefilterShader
    );
    this.bloomBlurProgram = new Program(
      gl,
      this.baseVertexShader,
      bloomBlurShader
    );
    this.bloomFinalProgram = new Program(
      gl,
      this.baseVertexShader,
      bloomFinalShader
    );
    this.splatProgram = new Program(gl, this.baseVertexShader, splatShader);
    this.advectionProgram = new Program(
      gl,
      this.baseVertexShader,
      advectionShader
    );
    this.divergenceProgram = new Program(
      gl,
      this.baseVertexShader,
      divergenceShader
    );
    this.curlProgram = new Program(gl, this.baseVertexShader, curlShader);
    this.vorticityProgram = new Program(
      gl,
      this.baseVertexShader,
      vorticityShader
    );
    this.pressureProgram = new Program(
      gl,
      this.baseVertexShader,
      pressureShader
    );
    this.gradientSubtractProgram = new Program(
      gl,
      this.baseVertexShader,
      gradientSubtractShader
    );

    this.displayMaterial = new Material(
      gl,
      this.baseVertexShader,
      displayShaderSource
    );

    this.updateKeywords();
    this.initFramebuffers();
  }

  private getWebGLContext(canvas: HTMLCanvasElement): {
    gl: WebGLRenderingContext;
    ext: GLExtensions;
  } {
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    let gl = canvas.getContext("webgl2", params) as WebGLRenderingContext;
    const isWebGL2 = !!gl;
    if (!isWebGL2) {
      gl =
        (canvas.getContext("webgl", params) as WebGLRenderingContext) ||
        (canvas.getContext(
          "experimental-webgl",
          params
        ) as WebGLRenderingContext);
    }

    let halfFloat: OES_texture_half_float | null = null;
    let supportLinearFiltering = false;

    if (isWebGL2) {
      gl.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = !!gl.getExtension("OES_texture_float_linear");
    } else {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = !!gl.getExtension(
        "OES_texture_half_float_linear"
      );
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    const gl2 = gl as WebGL2RenderingContext;
    const halfFloatTexType = isWebGL2
      ? gl2.HALF_FLOAT
      : halfFloat?.HALF_FLOAT_OES ?? gl.FLOAT;

    let formatRGBA: { internalFormat: number; format: number } | null = null;
    let formatRG: { internalFormat: number; format: number } | null = null;
    let formatR: { internalFormat: number; format: number } | null = null;

    if (isWebGL2) {
      formatRGBA = this.getSupportedFormat(
        gl2,
        gl2.RGBA16F,
        gl.RGBA,
        halfFloatTexType
      );
      formatRG = this.getSupportedFormat(
        gl2,
        gl2.RG16F,
        (gl2 as WebGL2RenderingContext).RG,
        halfFloatTexType
      );
      formatR = this.getSupportedFormat(
        gl2,
        gl2.R16F,
        (gl2 as WebGL2RenderingContext).RED,
        halfFloatTexType
      );
    } else {
      formatRGBA = this.getSupportedFormat(
        gl,
        gl.RGBA,
        gl.RGBA,
        halfFloatTexType
      );
      formatRG = formatRGBA;
      formatR = formatRGBA;
    }

    return {
      gl,
      ext: {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering,
      },
    };
  }

  private getSupportedFormat(
    gl: WebGLRenderingContext,
    internalFormat: number,
    format: number,
    type: number
  ): { internalFormat: number; format: number } | null {
    if (!this.supportRenderTextureFormat(gl, internalFormat, format, type)) {
      const gl2 = gl as WebGL2RenderingContext;
      if (gl2.R16F !== undefined) {
        if (internalFormat === gl2.R16F) {
          return this.getSupportedFormat(gl, gl2.RG16F, gl2.RG, type);
        }
        if (internalFormat === gl2.RG16F) {
          return this.getSupportedFormat(gl, gl2.RGBA16F, gl.RGBA, type);
        }
      }
      return null;
    }
    return { internalFormat, format };
  }

  private supportRenderTextureFormat(
    gl: WebGLRenderingContext,
    internalFormat: number,
    format: number,
    type: number
  ): boolean {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      4,
      4,
      0,
      format,
      type,
      null
    );

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(fbo);
    return status === gl.FRAMEBUFFER_COMPLETE;
  }

  private getResolution(resolution: number): { width: number; height: number } {
    const gl = this.gl;
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

    const min = Math.round(resolution);
    const max = Math.round(resolution * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
      return { width: max, height: min };
    } else {
      return { width: min, height: max };
    }
  }

  private createFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): FBO {
    const gl = this.gl;

    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      w,
      h,
      0,
      format,
      type,
      null
    );

    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const texelSizeX = 1.0 / w;
    const texelSizeY = 1.0 / h;

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX,
      texelSizeY,
      attach: (id: number) => {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  private createDoubleFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): DoubleFBO {
    let fbo1 = this.createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = this.createFBO(w, h, internalFormat, format, type, param);

    return {
      width: w,
      height: h,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      get read() {
        return fbo1;
      },
      set read(value) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value) {
        fbo2 = value;
      },
      swap() {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  }

  private resizeFBO(
    target: FBO,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): FBO {
    const newFBO = this.createFBO(w, h, internalFormat, format, type, param);
    this.copyProgram.bind();
    this.gl.uniform1i(this.copyProgram.uniforms.uTexture, target.attach(0));
    this.blit(newFBO);
    return newFBO;
  }

  private resizeDoubleFBO(
    target: DoubleFBO,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): DoubleFBO {
    if (target.width === w && target.height === h) return target;

    target.read = this.resizeFBO(
      target.read,
      w,
      h,
      internalFormat,
      format,
      type,
      param
    );
    target.write = this.createFBO(w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1.0 / w;
    target.texelSizeY = 1.0 / h;
    return target;
  }

  private initFramebuffers() {
    const gl = this.gl;
    const ext = this.ext;
    const config = this.config;

    const simRes = this.getResolution(config.SIM_RESOLUTION);
    const dyeRes = this.getResolution(config.DYE_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA!;
    const rg = ext.formatRG!;
    const r = ext.formatR!;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    gl.disable(gl.BLEND);

    if (!this.dye) {
      this.dye = this.createDoubleFBO(
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
    } else {
      this.dye = this.resizeDoubleFBO(
        this.dye,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
    }

    if (!this.velocity) {
      this.velocity = this.createDoubleFBO(
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );
    } else {
      this.velocity = this.resizeDoubleFBO(
        this.velocity,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );
    }

    this.divergence = this.createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );
    this.curl = this.createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );
    this.pressure = this.createDoubleFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );

    this.initBloomFramebuffers();
  }

  private initBloomFramebuffers() {
    const gl = this.gl;
    const ext = this.ext;

    const res = this.getResolution(256); // BLOOM_RESOLUTION
    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA!;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    this.bloom = this.createFBO(
      res.width,
      res.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering
    );

    this.bloomFramebuffers = [];
    for (let i = 0; i < 8; i++) {
      // BLOOM_ITERATIONS
      const width = res.width >> (i + 1);
      const height = res.height >> (i + 1);
      if (width < 2 || height < 2) break;

      const fbo = this.createFBO(
        width,
        height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
      this.bloomFramebuffers.push(fbo);
    }
  }

  private updateKeywords() {
    const displayKeywords: string[] = [];
    if (this.config.SHADING) displayKeywords.push("SHADING");
    if (this.config.BLOOM) displayKeywords.push("BLOOM");
    this.displayMaterial.setKeywords(displayKeywords);
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.initFramebuffers();
  }

  step(dt: number) {
    const gl = this.gl;
    const config = this.config;
    const ext = this.ext;

    gl.disable(gl.BLEND);

    // Curl
    this.curlProgram.bind();
    gl.uniform2f(
      this.curlProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.curlProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    this.blit(this.curl);

    // Vorticity
    this.vorticityProgram.bind();
    gl.uniform2f(
      this.vorticityProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.vorticityProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.curl.attach(1));
    gl.uniform1f(this.vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
    this.blit(this.velocity.write);
    this.velocity.swap();

    // Divergence
    this.divergenceProgram.bind();
    gl.uniform2f(
      this.divergenceProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.divergenceProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    this.blit(this.divergence);

    // Clear pressure
    this.clearProgram.bind();
    gl.uniform1i(
      this.clearProgram.uniforms.uTexture,
      this.pressure.read.attach(0)
    );
    gl.uniform1f(this.clearProgram.uniforms.value, config.PRESSURE);
    this.blit(this.pressure.write);
    this.pressure.swap();

    // Pressure iterations
    this.pressureProgram.bind();
    gl.uniform2f(
      this.pressureProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.pressureProgram.uniforms.uDivergence,
      this.divergence.attach(0)
    );
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(
        this.pressureProgram.uniforms.uPressure,
        this.pressure.read.attach(1)
      );
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    // Gradient subtract
    this.gradientSubtractProgram.bind();
    gl.uniform2f(
      this.gradientSubtractProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.gradientSubtractProgram.uniforms.uPressure,
      this.pressure.read.attach(0)
    );
    gl.uniform1i(
      this.gradientSubtractProgram.uniforms.uVelocity,
      this.velocity.read.attach(1)
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    // Advect velocity
    this.advectionProgram.bind();
    gl.uniform2f(
      this.advectionProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    if (!ext.supportLinearFiltering) {
      gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY
      );
    }
    const velocityId = this.velocity.read.attach(0);
    gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(this.advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
    gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      config.VELOCITY_DISSIPATION
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    // Advect dye
    if (!ext.supportLinearFiltering) {
      gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.dye.texelSizeX,
        this.dye.texelSizeY
      );
    }
    gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      this.dye.read.attach(1)
    );
    gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      config.DENSITY_DISSIPATION
    );
    this.blit(this.dye.write);
    this.dye.swap();
  }

  splat(
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: { r: number; g: number; b: number }
  ) {
    const gl = this.gl;
    const config = this.config;

    this.splatProgram.bind();
    gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.velocity.read.attach(0)
    );
    gl.uniform1f(
      this.splatProgram.uniforms.aspectRatio,
      this.canvas.width / this.canvas.height
    );
    gl.uniform2f(this.splatProgram.uniforms.point, x, y);
    gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(
      this.splatProgram.uniforms.radius,
      this.correctRadius(config.SPLAT_RADIUS / 100.0)
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    gl.uniform1i(this.splatProgram.uniforms.uTarget, this.dye.read.attach(0));
    gl.uniform3f(this.splatProgram.uniforms.color, color.r, color.g, color.b);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private correctRadius(radius: number): number {
    const aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio > 1) radius *= aspectRatio;
    return radius;
  }

  render() {
    const gl = this.gl;
    const config = this.config;

    if (config.BLOOM) {
      this.applyBloom(this.dye.read, this.bloom);
    }

    // Clear to transparent
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    // Draw directly without background
    this.drawDisplay(null);
  }

  private drawColor(
    target: FBO | null,
    color: { r: number; g: number; b: number; a: number }
  ) {
    this.colorProgram.bind();
    this.gl.uniform4f(
      this.colorProgram.uniforms.color,
      color.r,
      color.g,
      color.b,
      color.a
    );
    this.blit(target);
  }

  private drawDisplay(target: FBO | null) {
    const gl = this.gl;
    const config = this.config;

    const width = target == null ? gl.drawingBufferWidth : target.width;
    const height = target == null ? gl.drawingBufferHeight : target.height;

    this.displayMaterial.bind();
    if (config.SHADING) {
      gl.uniform2f(
        this.displayMaterial.uniforms.texelSize,
        1.0 / width,
        1.0 / height
      );
    }
    gl.uniform1i(
      this.displayMaterial.uniforms.uTexture,
      this.dye.read.attach(0)
    );
    if (config.BLOOM) {
      gl.uniform1i(this.displayMaterial.uniforms.uBloom, this.bloom.attach(1));
    }
    this.blit(target);
  }

  private applyBloom(source: FBO, destination: FBO) {
    const gl = this.gl;
    const config = this.config;

    if (this.bloomFramebuffers.length < 2) return;

    let last = destination;

    gl.disable(gl.BLEND);
    this.bloomPrefilterProgram.bind();
    const knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    const curve0 = config.BLOOM_THRESHOLD - knee;
    const curve1 = knee * 2;
    const curve2 = 0.25 / knee;
    gl.uniform3f(
      this.bloomPrefilterProgram.uniforms.curve,
      curve0,
      curve1,
      curve2
    );
    gl.uniform1f(
      this.bloomPrefilterProgram.uniforms.threshold,
      config.BLOOM_THRESHOLD
    );
    gl.uniform1i(
      this.bloomPrefilterProgram.uniforms.uTexture,
      source.attach(0)
    );
    this.blit(last);

    this.bloomBlurProgram.bind();
    for (let i = 0; i < this.bloomFramebuffers.length; i++) {
      const dest = this.bloomFramebuffers[i];
      gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
      this.blit(dest);
      last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = this.bloomFramebuffers.length - 2; i >= 0; i--) {
      const baseTex = this.bloomFramebuffers[i];
      gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
      gl.viewport(0, 0, baseTex.width, baseTex.height);
      this.blit(baseTex);
      last = baseTex;
    }

    gl.disable(gl.BLEND);
    this.bloomFinalProgram.bind();
    gl.uniform2f(
      this.bloomFinalProgram.uniforms.texelSize,
      last.texelSizeX,
      last.texelSizeY
    );
    gl.uniform1i(this.bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(
      this.bloomFinalProgram.uniforms.intensity,
      config.BLOOM_INTENSITY
    );
    this.blit(destination);
  }

  multipleSplats(amount: number) {
    for (let i = 0; i < amount; i++) {
      const color = generateColor();
      color.r *= 10.0;
      color.g *= 10.0;
      color.b *= 10.0;
      const x = Math.random();
      const y = Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      this.splat(x, y, dx, dy, color);
    }
  }

  setPerformanceMode(enabled: boolean) {
    const newConfig = {
      ...DEFAULT_CONFIG,
      ...(enabled ? PERFORMANCE_CONFIG : {}),
    };

    if (
      this.config.SIM_RESOLUTION !== newConfig.SIM_RESOLUTION ||
      this.config.DYE_RESOLUTION !== newConfig.DYE_RESOLUTION
    ) {
      this.config = newConfig;
      this.initFramebuffers();
      this.updateKeywords();
    } else {
      this.config = newConfig;
      this.updateKeywords();
    }
  }

  destroy() {
    // Cleanup WebGL resources
    const gl = this.gl;

    // Delete framebuffers and textures
    const deleteFBO = (fbo: FBO) => {
      gl.deleteTexture(fbo.texture);
      gl.deleteFramebuffer(fbo.fbo);
    };

    if (this.dye) {
      deleteFBO(this.dye.read);
      deleteFBO(this.dye.write);
    }
    if (this.velocity) {
      deleteFBO(this.velocity.read);
      deleteFBO(this.velocity.write);
    }
    if (this.divergence) deleteFBO(this.divergence);
    if (this.curl) deleteFBO(this.curl);
    if (this.pressure) {
      deleteFBO(this.pressure.read);
      deleteFBO(this.pressure.write);
    }
    if (this.bloom) deleteFBO(this.bloom);
    for (const fbo of this.bloomFramebuffers) {
      deleteFBO(fbo);
    }

    // Release the WebGL context to prevent "too many active contexts" warning
    const loseContext = gl.getExtension("WEBGL_lose_context");
    if (loseContext) {
      loseContext.loseContext();
    }
  }
}
