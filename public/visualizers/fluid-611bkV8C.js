import{c as l,g as _,a as p,b as S,h as P}from"./utils-DsFqD6CR.js";const d={SIM_RESOLUTION:128,DYE_RESOLUTION:512,DENSITY_DISSIPATION:1,VELOCITY_DISSIPATION:.2,PRESSURE:.8,PRESSURE_ITERATIONS:20,CURL:30,SPLAT_RADIUS:.25,SPLAT_FORCE:6e3,SHADING:!0,BLOOM:!0,BLOOM_INTENSITY:.8,BLOOM_THRESHOLD:.6,BLOOM_SOFT_KNEE:.7},x={SIM_RESOLUTION:64,DYE_RESOLUTION:256,PRESSURE_ITERATIONS:10,BLOOM:!1,SHADING:!1};class v{constructor(t,r,e){this.gl=t,this.uniforms={},this.program=p(t,r,e),this.uniforms=S(t,this.program)}bind(){this.gl.useProgram(this.program)}}class B{constructor(t,r,e){this.gl=t,this.programs=new Map,this.activeProgram=null,this.uniforms={},this.vertexShader=r,this.fragmentShaderSource=e}setKeywords(t){let r=0;for(const o of t)r+=P(o);let e=this.programs.get(r);if(!e){const o=l(this.gl,this.gl.FRAGMENT_SHADER,this.fragmentShaderSource,t);e=p(this.gl,this.vertexShader,o),this.programs.set(r,e)}e!==this.activeProgram&&(this.uniforms=S(this.gl,e),this.activeProgram=e)}bind(){this.gl.useProgram(this.activeProgram)}}const A=`
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
`,L=`
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
`,O=`
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
`,U=`
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;

  void main () {
    gl_FragColor = texture2D(uTexture, vUv);
  }
`,w=`
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`,N=`
  precision mediump float;
  uniform vec4 color;

  void main () {
    gl_FragColor = color;
  }
`,M=`
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
`,I=`
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
`,z=`
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
`,C=`
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
`,G=`
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
`,V=`
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
`,X=`
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
`,H=`
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
`,Y=`
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
`,W=`
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
`,K=`
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
`;class k{constructor(t,r=!1){this.bloomFramebuffers=[],this.canvas=t,this.config={...d,...r?x:{}};const{gl:e,ext:o}=this.getWebGLContext(t);this.gl=e,this.ext=o,e.bindBuffer(e.ARRAY_BUFFER,e.createBuffer()),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),e.STATIC_DRAW),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,e.createBuffer()),e.bufferData(e.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),e.STATIC_DRAW),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.enableVertexAttribArray(0),this.blit=(f,D=!1)=>{f==null?(e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),e.bindFramebuffer(e.FRAMEBUFFER,null)):(e.viewport(0,0,f.width,f.height),e.bindFramebuffer(e.FRAMEBUFFER,f.fbo)),D&&(e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT)),e.drawElements(e.TRIANGLES,6,e.UNSIGNED_SHORT,0)},this.baseVertexShader=l(e,e.VERTEX_SHADER,A),this.blurVertexShader=l(e,e.VERTEX_SHADER,L);const s=l(e,e.FRAGMENT_SHADER,O),a=l(e,e.FRAGMENT_SHADER,U),i=l(e,e.FRAGMENT_SHADER,w),u=l(e,e.FRAGMENT_SHADER,N),n=l(e,e.FRAGMENT_SHADER,I),c=l(e,e.FRAGMENT_SHADER,z),h=l(e,e.FRAGMENT_SHADER,C),m=l(e,e.FRAGMENT_SHADER,G),T=l(e,e.FRAGMENT_SHADER,V,o.supportLinearFiltering?void 0:["MANUAL_FILTERING"]),R=l(e,e.FRAGMENT_SHADER,X),E=l(e,e.FRAGMENT_SHADER,H),y=l(e,e.FRAGMENT_SHADER,Y),b=l(e,e.FRAGMENT_SHADER,W),F=l(e,e.FRAGMENT_SHADER,K);this.blurProgram=new v(e,this.blurVertexShader,s),this.copyProgram=new v(e,this.baseVertexShader,a),this.clearProgram=new v(e,this.baseVertexShader,i),this.colorProgram=new v(e,this.baseVertexShader,u),this.bloomPrefilterProgram=new v(e,this.baseVertexShader,n),this.bloomBlurProgram=new v(e,this.baseVertexShader,c),this.bloomFinalProgram=new v(e,this.baseVertexShader,h),this.splatProgram=new v(e,this.baseVertexShader,m),this.advectionProgram=new v(e,this.baseVertexShader,T),this.divergenceProgram=new v(e,this.baseVertexShader,R),this.curlProgram=new v(e,this.baseVertexShader,E),this.vorticityProgram=new v(e,this.baseVertexShader,y),this.pressureProgram=new v(e,this.baseVertexShader,b),this.gradientSubtractProgram=new v(e,this.baseVertexShader,F),this.displayMaterial=new B(e,this.baseVertexShader,M),this.updateKeywords(),this.initFramebuffers()}getWebGLContext(t){const r={alpha:!0,depth:!1,stencil:!1,antialias:!1,preserveDrawingBuffer:!1};let e=t.getContext("webgl2",r);const o=!!e;o||(e=t.getContext("webgl",r)||t.getContext("experimental-webgl",r));let s=null,a=!1;o?(e.getExtension("EXT_color_buffer_float"),a=!!e.getExtension("OES_texture_float_linear")):(s=e.getExtension("OES_texture_half_float"),a=!!e.getExtension("OES_texture_half_float_linear")),e.clearColor(0,0,0,0);const i=e,u=o?i.HALF_FLOAT:(s==null?void 0:s.HALF_FLOAT_OES)??e.FLOAT;let n=null,c=null,h=null;return o?(n=this.getSupportedFormat(i,i.RGBA16F,e.RGBA,u),c=this.getSupportedFormat(i,i.RG16F,i.RG,u),h=this.getSupportedFormat(i,i.R16F,i.RED,u)):(n=this.getSupportedFormat(e,e.RGBA,e.RGBA,u),c=n,h=n),{gl:e,ext:{formatRGBA:n,formatRG:c,formatR:h,halfFloatTexType:u,supportLinearFiltering:a}}}getSupportedFormat(t,r,e,o){if(!this.supportRenderTextureFormat(t,r,e,o)){const s=t;if(s.R16F!==void 0){if(r===s.R16F)return this.getSupportedFormat(t,s.RG16F,s.RG,o);if(r===s.RG16F)return this.getSupportedFormat(t,s.RGBA16F,t.RGBA,o)}return null}return{internalFormat:r,format:e}}supportRenderTextureFormat(t,r,e,o){const s=t.createTexture();t.bindTexture(t.TEXTURE_2D,s),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,r,4,4,0,e,o,null);const a=t.createFramebuffer();t.bindFramebuffer(t.FRAMEBUFFER,a),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,s,0);const i=t.checkFramebufferStatus(t.FRAMEBUFFER);return t.deleteTexture(s),t.deleteFramebuffer(a),i===t.FRAMEBUFFER_COMPLETE}getResolution(t){const r=this.gl;let e=r.drawingBufferWidth/r.drawingBufferHeight;e<1&&(e=1/e);const o=Math.round(t),s=Math.round(t*e);return r.drawingBufferWidth>r.drawingBufferHeight?{width:s,height:o}:{width:o,height:s}}createFBO(t,r,e,o,s,a){const i=this.gl;i.activeTexture(i.TEXTURE0);const u=i.createTexture();i.bindTexture(i.TEXTURE_2D,u),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,a),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,a),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.texImage2D(i.TEXTURE_2D,0,e,t,r,0,o,s,null);const n=i.createFramebuffer();i.bindFramebuffer(i.FRAMEBUFFER,n),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,u,0),i.viewport(0,0,t,r),i.clear(i.COLOR_BUFFER_BIT);const c=1/t,h=1/r;return{texture:u,fbo:n,width:t,height:r,texelSizeX:c,texelSizeY:h,attach:m=>(i.activeTexture(i.TEXTURE0+m),i.bindTexture(i.TEXTURE_2D,u),m)}}createDoubleFBO(t,r,e,o,s,a){let i=this.createFBO(t,r,e,o,s,a),u=this.createFBO(t,r,e,o,s,a);return{width:t,height:r,texelSizeX:i.texelSizeX,texelSizeY:i.texelSizeY,get read(){return i},set read(n){i=n},get write(){return u},set write(n){u=n},swap(){const n=i;i=u,u=n}}}resizeFBO(t,r,e,o,s,a,i){const u=this.createFBO(r,e,o,s,a,i);return this.copyProgram.bind(),this.gl.uniform1i(this.copyProgram.uniforms.uTexture,t.attach(0)),this.blit(u),u}resizeDoubleFBO(t,r,e,o,s,a,i){return t.width===r&&t.height===e||(t.read=this.resizeFBO(t.read,r,e,o,s,a,i),t.write=this.createFBO(r,e,o,s,a,i),t.width=r,t.height=e,t.texelSizeX=1/r,t.texelSizeY=1/e),t}initFramebuffers(){const t=this.gl,r=this.ext,e=this.config,o=this.getResolution(e.SIM_RESOLUTION),s=this.getResolution(e.DYE_RESOLUTION),a=r.halfFloatTexType,i=r.formatRGBA,u=r.formatRG,n=r.formatR,c=r.supportLinearFiltering?t.LINEAR:t.NEAREST;t.disable(t.BLEND),this.dye?this.dye=this.resizeDoubleFBO(this.dye,s.width,s.height,i.internalFormat,i.format,a,c):this.dye=this.createDoubleFBO(s.width,s.height,i.internalFormat,i.format,a,c),this.velocity?this.velocity=this.resizeDoubleFBO(this.velocity,o.width,o.height,u.internalFormat,u.format,a,c):this.velocity=this.createDoubleFBO(o.width,o.height,u.internalFormat,u.format,a,c),this.divergence=this.createFBO(o.width,o.height,n.internalFormat,n.format,a,t.NEAREST),this.curl=this.createFBO(o.width,o.height,n.internalFormat,n.format,a,t.NEAREST),this.pressure=this.createDoubleFBO(o.width,o.height,n.internalFormat,n.format,a,t.NEAREST),this.initBloomFramebuffers()}initBloomFramebuffers(){const t=this.gl,r=this.ext,e=this.getResolution(256),o=r.halfFloatTexType,s=r.formatRGBA,a=r.supportLinearFiltering?t.LINEAR:t.NEAREST;this.bloom=this.createFBO(e.width,e.height,s.internalFormat,s.format,o,a),this.bloomFramebuffers=[];for(let i=0;i<8;i++){const u=e.width>>i+1,n=e.height>>i+1;if(u<2||n<2)break;const c=this.createFBO(u,n,s.internalFormat,s.format,o,a);this.bloomFramebuffers.push(c)}}updateKeywords(){const t=[];this.config.SHADING&&t.push("SHADING"),this.config.BLOOM&&t.push("BLOOM"),this.displayMaterial.setKeywords(t)}resize(t,r){this.canvas.width=t,this.canvas.height=r,this.initFramebuffers()}step(t){const r=this.gl,e=this.config,o=this.ext;r.disable(r.BLEND),this.curlProgram.bind(),r.uniform2f(this.curlProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),r.uniform1i(this.curlProgram.uniforms.uVelocity,this.velocity.read.attach(0)),this.blit(this.curl),this.vorticityProgram.bind(),r.uniform2f(this.vorticityProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),r.uniform1i(this.vorticityProgram.uniforms.uVelocity,this.velocity.read.attach(0)),r.uniform1i(this.vorticityProgram.uniforms.uCurl,this.curl.attach(1)),r.uniform1f(this.vorticityProgram.uniforms.curl,e.CURL),r.uniform1f(this.vorticityProgram.uniforms.dt,t),this.blit(this.velocity.write),this.velocity.swap(),this.divergenceProgram.bind(),r.uniform2f(this.divergenceProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),r.uniform1i(this.divergenceProgram.uniforms.uVelocity,this.velocity.read.attach(0)),this.blit(this.divergence),this.clearProgram.bind(),r.uniform1i(this.clearProgram.uniforms.uTexture,this.pressure.read.attach(0)),r.uniform1f(this.clearProgram.uniforms.value,e.PRESSURE),this.blit(this.pressure.write),this.pressure.swap(),this.pressureProgram.bind(),r.uniform2f(this.pressureProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),r.uniform1i(this.pressureProgram.uniforms.uDivergence,this.divergence.attach(0));for(let a=0;a<e.PRESSURE_ITERATIONS;a++)r.uniform1i(this.pressureProgram.uniforms.uPressure,this.pressure.read.attach(1)),this.blit(this.pressure.write),this.pressure.swap();this.gradientSubtractProgram.bind(),r.uniform2f(this.gradientSubtractProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),r.uniform1i(this.gradientSubtractProgram.uniforms.uPressure,this.pressure.read.attach(0)),r.uniform1i(this.gradientSubtractProgram.uniforms.uVelocity,this.velocity.read.attach(1)),this.blit(this.velocity.write),this.velocity.swap(),this.advectionProgram.bind(),r.uniform2f(this.advectionProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),o.supportLinearFiltering||r.uniform2f(this.advectionProgram.uniforms.dyeTexelSize,this.velocity.texelSizeX,this.velocity.texelSizeY);const s=this.velocity.read.attach(0);r.uniform1i(this.advectionProgram.uniforms.uVelocity,s),r.uniform1i(this.advectionProgram.uniforms.uSource,s),r.uniform1f(this.advectionProgram.uniforms.dt,t),r.uniform1f(this.advectionProgram.uniforms.dissipation,e.VELOCITY_DISSIPATION),this.blit(this.velocity.write),this.velocity.swap(),o.supportLinearFiltering||r.uniform2f(this.advectionProgram.uniforms.dyeTexelSize,this.dye.texelSizeX,this.dye.texelSizeY),r.uniform1i(this.advectionProgram.uniforms.uVelocity,this.velocity.read.attach(0)),r.uniform1i(this.advectionProgram.uniforms.uSource,this.dye.read.attach(1)),r.uniform1f(this.advectionProgram.uniforms.dissipation,e.DENSITY_DISSIPATION),this.blit(this.dye.write),this.dye.swap()}splat(t,r,e,o,s){const a=this.gl,i=this.config;this.splatProgram.bind(),a.uniform1i(this.splatProgram.uniforms.uTarget,this.velocity.read.attach(0)),a.uniform1f(this.splatProgram.uniforms.aspectRatio,this.canvas.width/this.canvas.height),a.uniform2f(this.splatProgram.uniforms.point,t,r),a.uniform3f(this.splatProgram.uniforms.color,e,o,0),a.uniform1f(this.splatProgram.uniforms.radius,this.correctRadius(i.SPLAT_RADIUS/100)),this.blit(this.velocity.write),this.velocity.swap(),a.uniform1i(this.splatProgram.uniforms.uTarget,this.dye.read.attach(0)),a.uniform3f(this.splatProgram.uniforms.color,s.r,s.g,s.b),this.blit(this.dye.write),this.dye.swap()}correctRadius(t){const r=this.canvas.width/this.canvas.height;return r>1&&(t*=r),t}render(){const t=this.gl;this.config.BLOOM&&this.applyBloom(this.dye.read,this.bloom),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,t.drawingBufferWidth,t.drawingBufferHeight),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.enable(t.BLEND),this.drawDisplay(null)}drawColor(t,r){this.colorProgram.bind(),this.gl.uniform4f(this.colorProgram.uniforms.color,r.r,r.g,r.b,r.a),this.blit(t)}drawDisplay(t){const r=this.gl,e=this.config,o=t==null?r.drawingBufferWidth:t.width,s=t==null?r.drawingBufferHeight:t.height;this.displayMaterial.bind(),e.SHADING&&r.uniform2f(this.displayMaterial.uniforms.texelSize,1/o,1/s),r.uniform1i(this.displayMaterial.uniforms.uTexture,this.dye.read.attach(0)),e.BLOOM&&r.uniform1i(this.displayMaterial.uniforms.uBloom,this.bloom.attach(1)),this.blit(t)}applyBloom(t,r){const e=this.gl,o=this.config;if(this.bloomFramebuffers.length<2)return;let s=r;e.disable(e.BLEND),this.bloomPrefilterProgram.bind();const a=o.BLOOM_THRESHOLD*o.BLOOM_SOFT_KNEE+1e-4,i=o.BLOOM_THRESHOLD-a,u=a*2,n=.25/a;e.uniform3f(this.bloomPrefilterProgram.uniforms.curve,i,u,n),e.uniform1f(this.bloomPrefilterProgram.uniforms.threshold,o.BLOOM_THRESHOLD),e.uniform1i(this.bloomPrefilterProgram.uniforms.uTexture,t.attach(0)),this.blit(s),this.bloomBlurProgram.bind();for(let c=0;c<this.bloomFramebuffers.length;c++){const h=this.bloomFramebuffers[c];e.uniform2f(this.bloomBlurProgram.uniforms.texelSize,s.texelSizeX,s.texelSizeY),e.uniform1i(this.bloomBlurProgram.uniforms.uTexture,s.attach(0)),this.blit(h),s=h}e.blendFunc(e.ONE,e.ONE),e.enable(e.BLEND);for(let c=this.bloomFramebuffers.length-2;c>=0;c--){const h=this.bloomFramebuffers[c];e.uniform2f(this.bloomBlurProgram.uniforms.texelSize,s.texelSizeX,s.texelSizeY),e.uniform1i(this.bloomBlurProgram.uniforms.uTexture,s.attach(0)),e.viewport(0,0,h.width,h.height),this.blit(h),s=h}e.disable(e.BLEND),this.bloomFinalProgram.bind(),e.uniform2f(this.bloomFinalProgram.uniforms.texelSize,s.texelSizeX,s.texelSizeY),e.uniform1i(this.bloomFinalProgram.uniforms.uTexture,s.attach(0)),e.uniform1f(this.bloomFinalProgram.uniforms.intensity,o.BLOOM_INTENSITY),this.blit(r)}multipleSplats(t){for(let r=0;r<t;r++){const e=_();e.r*=10,e.g*=10,e.b*=10;const o=Math.random(),s=Math.random(),a=1e3*(Math.random()-.5),i=1e3*(Math.random()-.5);this.splat(o,s,a,i,e)}}setPerformanceMode(t){const r={...d,...t?x:{}};this.config.SIM_RESOLUTION!==r.SIM_RESOLUTION||this.config.DYE_RESOLUTION!==r.DYE_RESOLUTION?(this.config=r,this.initFramebuffers(),this.updateKeywords()):(this.config=r,this.updateKeywords())}destroy(){const t=this.gl,r=o=>{t.deleteTexture(o.texture),t.deleteFramebuffer(o.fbo)};this.dye&&(r(this.dye.read),r(this.dye.write)),this.velocity&&(r(this.velocity.read),r(this.velocity.write)),this.divergence&&r(this.divergence),this.curl&&r(this.curl),this.pressure&&(r(this.pressure.read),r(this.pressure.write)),this.bloom&&r(this.bloom);for(const o of this.bloomFramebuffers)r(o);const e=t.getExtension("WEBGL_lose_context");e&&e.loseContext()}}export{k as F};
