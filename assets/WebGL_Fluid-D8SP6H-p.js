import{c as v,a as _,b as B,d as A,h as O}from"./comp-visualizer-DEbmw2UW.js";import"./vendor-7n6RyNsU.js";import"./comp-audiocontroller-C9_egn6F.js";import"./comp-background-2KjCJFop.js";const F={SIM_RESOLUTION:128,DYE_RESOLUTION:512,DENSITY_DISSIPATION:1,VELOCITY_DISSIPATION:.2,PRESSURE:.8,PRESSURE_ITERATIONS:20,CURL:30,SPLAT_RADIUS:.25,SPLAT_FORCE:6e3,SHADING:!0,BLOOM:!0,BLOOM_INTENSITY:.8,BLOOM_THRESHOLD:.6,BLOOM_SOFT_KNEE:.7},D={SIM_RESOLUTION:64,DYE_RESOLUTION:256,PRESSURE_ITERATIONS:10,BLOOM:!1,SHADING:!1};class x{constructor(t,i,e){this.gl=t,this.uniforms={},this.program=B(t,i,e),this.uniforms=A(t,this.program)}bind(){this.gl.useProgram(this.program)}}class U{constructor(t,i,e){this.gl=t,this.programs=new Map,this.activeProgram=null,this.uniforms={},this.vertexShader=i,this.fragmentShaderSource=e}setKeywords(t){let i=0;for(const o of t)i+=O(o);let e=this.programs.get(i);if(!e){const o=v(this.gl,this.gl.FRAGMENT_SHADER,this.fragmentShaderSource,t);e=B(this.gl,this.vertexShader,o),this.programs.set(i,e)}e!==this.activeProgram&&(this.uniforms=A(this.gl,e),this.activeProgram=e)}bind(){this.gl.useProgram(this.activeProgram)}}const M=`
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
`,w=`
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
`,I=`
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
`,N=`
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;

  void main () {
    gl_FragColor = texture2D(uTexture, vUv);
  }
`,z=`
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`,C=`
  precision mediump float;
  uniform vec4 color;

  void main () {
    gl_FragColor = color;
  }
`,G=`
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
`,V=`
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
`,H=`
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
`,X=`
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
`,Y=`
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
`,W=`
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
`,q=`
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
`,k=`
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
`,K=`
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
`,j=`
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
`,J=`
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
`;class Q{constructor(t,i=!1){this.bloomFramebuffers=[],this.canvas=t,this.config={...F,...i?D:{}};const{gl:e,ext:o}=this.getWebGLContext(t);this.gl=e,this.ext=o,e.bindBuffer(e.ARRAY_BUFFER,e.createBuffer()),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),e.STATIC_DRAW),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,e.createBuffer()),e.bufferData(e.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),e.STATIC_DRAW),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.enableVertexAttribArray(0),this.blit=(R,y=!1)=>{R==null?(e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),e.bindFramebuffer(e.FRAMEBUFFER,null)):(e.viewport(0,0,R.width,R.height),e.bindFramebuffer(e.FRAMEBUFFER,R.fbo)),y&&(e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT)),e.drawElements(e.TRIANGLES,6,e.UNSIGNED_SHORT,0)},this.baseVertexShader=v(e,e.VERTEX_SHADER,M),this.blurVertexShader=v(e,e.VERTEX_SHADER,w);const s=v(e,e.FRAGMENT_SHADER,I),a=v(e,e.FRAGMENT_SHADER,N),r=v(e,e.FRAGMENT_SHADER,z),n=v(e,e.FRAGMENT_SHADER,C),u=v(e,e.FRAGMENT_SHADER,V),c=v(e,e.FRAGMENT_SHADER,H),m=v(e,e.FRAGMENT_SHADER,X),g=v(e,e.FRAGMENT_SHADER,Y),f=v(e,e.FRAGMENT_SHADER,W,o.supportLinearFiltering?void 0:["MANUAL_FILTERING"]),d=v(e,e.FRAGMENT_SHADER,q),S=v(e,e.FRAGMENT_SHADER,k),T=v(e,e.FRAGMENT_SHADER,K),p=v(e,e.FRAGMENT_SHADER,j),E=v(e,e.FRAGMENT_SHADER,J);this.blurProgram=new x(e,this.blurVertexShader,s),this.copyProgram=new x(e,this.baseVertexShader,a),this.clearProgram=new x(e,this.baseVertexShader,r),this.colorProgram=new x(e,this.baseVertexShader,n),this.bloomPrefilterProgram=new x(e,this.baseVertexShader,u),this.bloomBlurProgram=new x(e,this.baseVertexShader,c),this.bloomFinalProgram=new x(e,this.baseVertexShader,m),this.splatProgram=new x(e,this.baseVertexShader,g),this.advectionProgram=new x(e,this.baseVertexShader,f),this.divergenceProgram=new x(e,this.baseVertexShader,d),this.curlProgram=new x(e,this.baseVertexShader,S),this.vorticityProgram=new x(e,this.baseVertexShader,T),this.pressureProgram=new x(e,this.baseVertexShader,p),this.gradientSubtractProgram=new x(e,this.baseVertexShader,E),this.displayMaterial=new U(e,this.baseVertexShader,G),this.updateKeywords(),this.initFramebuffers()}getWebGLContext(t){const i={alpha:!0,depth:!1,stencil:!1,antialias:!1,preserveDrawingBuffer:!1};let e=t.getContext("webgl2",i);const o=!!e;o||(e=t.getContext("webgl",i)||t.getContext("experimental-webgl",i));let s=null,a=!1;o?(e.getExtension("EXT_color_buffer_float"),a=!!e.getExtension("OES_texture_float_linear")):(s=e.getExtension("OES_texture_half_float"),a=!!e.getExtension("OES_texture_half_float_linear")),e.clearColor(0,0,0,0);const r=e,n=o?r.HALF_FLOAT:(s==null?void 0:s.HALF_FLOAT_OES)??e.FLOAT;let u=null,c=null,m=null;return o?(u=this.getSupportedFormat(r,r.RGBA16F,e.RGBA,n),c=this.getSupportedFormat(r,r.RG16F,r.RG,n),m=this.getSupportedFormat(r,r.R16F,r.RED,n)):(u=this.getSupportedFormat(e,e.RGBA,e.RGBA,n),c=u,m=u),{gl:e,ext:{formatRGBA:u,formatRG:c,formatR:m,halfFloatTexType:n,supportLinearFiltering:a}}}getSupportedFormat(t,i,e,o){if(!this.supportRenderTextureFormat(t,i,e,o)){const s=t;if(s.R16F!==void 0){if(i===s.R16F)return this.getSupportedFormat(t,s.RG16F,s.RG,o);if(i===s.RG16F)return this.getSupportedFormat(t,s.RGBA16F,t.RGBA,o)}return null}return{internalFormat:i,format:e}}supportRenderTextureFormat(t,i,e,o){const s=t.createTexture();t.bindTexture(t.TEXTURE_2D,s),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,i,4,4,0,e,o,null);const a=t.createFramebuffer();t.bindFramebuffer(t.FRAMEBUFFER,a),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,s,0);const r=t.checkFramebufferStatus(t.FRAMEBUFFER);return t.deleteTexture(s),t.deleteFramebuffer(a),r===t.FRAMEBUFFER_COMPLETE}getResolution(t){const i=this.gl;let e=i.drawingBufferWidth/i.drawingBufferHeight;e<1&&(e=1/e);const o=Math.round(t),s=Math.round(t*e);return i.drawingBufferWidth>i.drawingBufferHeight?{width:s,height:o}:{width:o,height:s}}createFBO(t,i,e,o,s,a){const r=this.gl;r.activeTexture(r.TEXTURE0);const n=r.createTexture();r.bindTexture(r.TEXTURE_2D,n),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,a),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,a),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),r.texImage2D(r.TEXTURE_2D,0,e,t,i,0,o,s,null);const u=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,u),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,n,0),r.viewport(0,0,t,i),r.clear(r.COLOR_BUFFER_BIT);const c=1/t,m=1/i;return{texture:n,fbo:u,width:t,height:i,texelSizeX:c,texelSizeY:m,attach:g=>(r.activeTexture(r.TEXTURE0+g),r.bindTexture(r.TEXTURE_2D,n),g)}}createDoubleFBO(t,i,e,o,s,a){let r=this.createFBO(t,i,e,o,s,a),n=this.createFBO(t,i,e,o,s,a);return{width:t,height:i,texelSizeX:r.texelSizeX,texelSizeY:r.texelSizeY,get read(){return r},set read(u){r=u},get write(){return n},set write(u){n=u},swap(){const u=r;r=n,n=u}}}resizeFBO(t,i,e,o,s,a,r){const n=this.createFBO(i,e,o,s,a,r);return this.copyProgram.bind(),this.gl.uniform1i(this.copyProgram.uniforms.uTexture,t.attach(0)),this.blit(n),n}resizeDoubleFBO(t,i,e,o,s,a,r){return t.width===i&&t.height===e||(t.read=this.resizeFBO(t.read,i,e,o,s,a,r),t.write=this.createFBO(i,e,o,s,a,r),t.width=i,t.height=e,t.texelSizeX=1/i,t.texelSizeY=1/e),t}initFramebuffers(){const t=this.gl,i=this.ext,e=this.config,o=this.getResolution(e.SIM_RESOLUTION),s=this.getResolution(e.DYE_RESOLUTION),a=i.halfFloatTexType,r=i.formatRGBA,n=i.formatRG,u=i.formatR,c=i.supportLinearFiltering?t.LINEAR:t.NEAREST;t.disable(t.BLEND),this.dye?this.dye=this.resizeDoubleFBO(this.dye,s.width,s.height,r.internalFormat,r.format,a,c):this.dye=this.createDoubleFBO(s.width,s.height,r.internalFormat,r.format,a,c),this.velocity?this.velocity=this.resizeDoubleFBO(this.velocity,o.width,o.height,n.internalFormat,n.format,a,c):this.velocity=this.createDoubleFBO(o.width,o.height,n.internalFormat,n.format,a,c),this.divergence=this.createFBO(o.width,o.height,u.internalFormat,u.format,a,t.NEAREST),this.curl=this.createFBO(o.width,o.height,u.internalFormat,u.format,a,t.NEAREST),this.pressure=this.createDoubleFBO(o.width,o.height,u.internalFormat,u.format,a,t.NEAREST),this.initBloomFramebuffers()}initBloomFramebuffers(){const t=this.gl,i=this.ext,e=this.getResolution(256),o=i.halfFloatTexType,s=i.formatRGBA,a=i.supportLinearFiltering?t.LINEAR:t.NEAREST;this.bloom=this.createFBO(e.width,e.height,s.internalFormat,s.format,o,a),this.bloomFramebuffers=[];for(let r=0;r<8;r++){const n=e.width>>r+1,u=e.height>>r+1;if(n<2||u<2)break;const c=this.createFBO(n,u,s.internalFormat,s.format,o,a);this.bloomFramebuffers.push(c)}}updateKeywords(){const t=[];this.config.SHADING&&t.push("SHADING"),this.config.BLOOM&&t.push("BLOOM"),this.displayMaterial.setKeywords(t)}resize(t,i){this.canvas.width=t,this.canvas.height=i,this.initFramebuffers()}step(t){const i=this.gl,e=this.config,o=this.ext;i.disable(i.BLEND),this.curlProgram.bind(),i.uniform2f(this.curlProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),i.uniform1i(this.curlProgram.uniforms.uVelocity,this.velocity.read.attach(0)),this.blit(this.curl),this.vorticityProgram.bind(),i.uniform2f(this.vorticityProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),i.uniform1i(this.vorticityProgram.uniforms.uVelocity,this.velocity.read.attach(0)),i.uniform1i(this.vorticityProgram.uniforms.uCurl,this.curl.attach(1)),i.uniform1f(this.vorticityProgram.uniforms.curl,e.CURL),i.uniform1f(this.vorticityProgram.uniforms.dt,t),this.blit(this.velocity.write),this.velocity.swap(),this.divergenceProgram.bind(),i.uniform2f(this.divergenceProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),i.uniform1i(this.divergenceProgram.uniforms.uVelocity,this.velocity.read.attach(0)),this.blit(this.divergence),this.clearProgram.bind(),i.uniform1i(this.clearProgram.uniforms.uTexture,this.pressure.read.attach(0)),i.uniform1f(this.clearProgram.uniforms.value,e.PRESSURE),this.blit(this.pressure.write),this.pressure.swap(),this.pressureProgram.bind(),i.uniform2f(this.pressureProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),i.uniform1i(this.pressureProgram.uniforms.uDivergence,this.divergence.attach(0));for(let a=0;a<e.PRESSURE_ITERATIONS;a++)i.uniform1i(this.pressureProgram.uniforms.uPressure,this.pressure.read.attach(1)),this.blit(this.pressure.write),this.pressure.swap();this.gradientSubtractProgram.bind(),i.uniform2f(this.gradientSubtractProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),i.uniform1i(this.gradientSubtractProgram.uniforms.uPressure,this.pressure.read.attach(0)),i.uniform1i(this.gradientSubtractProgram.uniforms.uVelocity,this.velocity.read.attach(1)),this.blit(this.velocity.write),this.velocity.swap(),this.advectionProgram.bind(),i.uniform2f(this.advectionProgram.uniforms.texelSize,this.velocity.texelSizeX,this.velocity.texelSizeY),o.supportLinearFiltering||i.uniform2f(this.advectionProgram.uniforms.dyeTexelSize,this.velocity.texelSizeX,this.velocity.texelSizeY);const s=this.velocity.read.attach(0);i.uniform1i(this.advectionProgram.uniforms.uVelocity,s),i.uniform1i(this.advectionProgram.uniforms.uSource,s),i.uniform1f(this.advectionProgram.uniforms.dt,t),i.uniform1f(this.advectionProgram.uniforms.dissipation,e.VELOCITY_DISSIPATION),this.blit(this.velocity.write),this.velocity.swap(),o.supportLinearFiltering||i.uniform2f(this.advectionProgram.uniforms.dyeTexelSize,this.dye.texelSizeX,this.dye.texelSizeY),i.uniform1i(this.advectionProgram.uniforms.uVelocity,this.velocity.read.attach(0)),i.uniform1i(this.advectionProgram.uniforms.uSource,this.dye.read.attach(1)),i.uniform1f(this.advectionProgram.uniforms.dissipation,e.DENSITY_DISSIPATION),this.blit(this.dye.write),this.dye.swap()}splat(t,i,e,o,s){const a=this.gl,r=this.config;this.splatProgram.bind(),a.uniform1i(this.splatProgram.uniforms.uTarget,this.velocity.read.attach(0)),a.uniform1f(this.splatProgram.uniforms.aspectRatio,this.canvas.width/this.canvas.height),a.uniform2f(this.splatProgram.uniforms.point,t,i),a.uniform3f(this.splatProgram.uniforms.color,e,o,0),a.uniform1f(this.splatProgram.uniforms.radius,this.correctRadius(r.SPLAT_RADIUS/100)),this.blit(this.velocity.write),this.velocity.swap(),a.uniform1i(this.splatProgram.uniforms.uTarget,this.dye.read.attach(0)),a.uniform3f(this.splatProgram.uniforms.color,s.r,s.g,s.b),this.blit(this.dye.write),this.dye.swap()}correctRadius(t){const i=this.canvas.width/this.canvas.height;return i>1&&(t*=i),t}render(){const t=this.gl;this.config.BLOOM&&this.applyBloom(this.dye.read,this.bloom),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,t.drawingBufferWidth,t.drawingBufferHeight),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.enable(t.BLEND),this.drawDisplay(null)}drawColor(t,i){this.colorProgram.bind(),this.gl.uniform4f(this.colorProgram.uniforms.color,i.r,i.g,i.b,i.a),this.blit(t)}drawDisplay(t){const i=this.gl,e=this.config,o=t==null?i.drawingBufferWidth:t.width,s=t==null?i.drawingBufferHeight:t.height;this.displayMaterial.bind(),e.SHADING&&i.uniform2f(this.displayMaterial.uniforms.texelSize,1/o,1/s),i.uniform1i(this.displayMaterial.uniforms.uTexture,this.dye.read.attach(0)),e.BLOOM&&i.uniform1i(this.displayMaterial.uniforms.uBloom,this.bloom.attach(1)),this.blit(t)}applyBloom(t,i){const e=this.gl,o=this.config;if(this.bloomFramebuffers.length<2)return;let s=i;e.disable(e.BLEND),this.bloomPrefilterProgram.bind();const a=o.BLOOM_THRESHOLD*o.BLOOM_SOFT_KNEE+1e-4,r=o.BLOOM_THRESHOLD-a,n=a*2,u=.25/a;e.uniform3f(this.bloomPrefilterProgram.uniforms.curve,r,n,u),e.uniform1f(this.bloomPrefilterProgram.uniforms.threshold,o.BLOOM_THRESHOLD),e.uniform1i(this.bloomPrefilterProgram.uniforms.uTexture,t.attach(0)),this.blit(s),this.bloomBlurProgram.bind();for(let c=0;c<this.bloomFramebuffers.length;c++){const m=this.bloomFramebuffers[c];e.uniform2f(this.bloomBlurProgram.uniforms.texelSize,s.texelSizeX,s.texelSizeY),e.uniform1i(this.bloomBlurProgram.uniforms.uTexture,s.attach(0)),this.blit(m),s=m}e.blendFunc(e.ONE,e.ONE),e.enable(e.BLEND);for(let c=this.bloomFramebuffers.length-2;c>=0;c--){const m=this.bloomFramebuffers[c];e.uniform2f(this.bloomBlurProgram.uniforms.texelSize,s.texelSizeX,s.texelSizeY),e.uniform1i(this.bloomBlurProgram.uniforms.uTexture,s.attach(0)),e.viewport(0,0,m.width,m.height),this.blit(m),s=m}e.disable(e.BLEND),this.bloomFinalProgram.bind(),e.uniform2f(this.bloomFinalProgram.uniforms.texelSize,s.texelSizeX,s.texelSizeY),e.uniform1i(this.bloomFinalProgram.uniforms.uTexture,s.attach(0)),e.uniform1f(this.bloomFinalProgram.uniforms.intensity,o.BLOOM_INTENSITY),this.blit(i)}multipleSplats(t){for(let i=0;i<t;i++){const e=_();e.r*=10,e.g*=10,e.b*=10;const o=Math.random(),s=Math.random(),a=1e3*(Math.random()-.5),r=1e3*(Math.random()-.5);this.splat(o,s,a,r,e)}}setPerformanceMode(t){const i={...F,...t?D:{}};this.config.SIM_RESOLUTION!==i.SIM_RESOLUTION||this.config.DYE_RESOLUTION!==i.DYE_RESOLUTION?(this.config=i,this.initFramebuffers(),this.updateKeywords()):(this.config=i,this.updateKeywords())}destroy(){const t=this.gl,i=o=>{t.deleteTexture(o.texture),t.deleteFramebuffer(o.fbo)};this.dye&&(i(this.dye.read),i(this.dye.write)),this.velocity&&(i(this.velocity.read),i(this.velocity.write)),this.divergence&&i(this.divergence),this.curl&&i(this.curl),this.pressure&&(i(this.pressure.read),i(this.pressure.write)),this.bloom&&i(this.bloom);for(const o of this.bloomFramebuffers)i(o);const e=t.getExtension("WEBGL_lose_context");e&&e.loseContext()}}const l={simulation:null,lastCanvas:null,lastSize:{width:0,height:0},lastTime:0,performanceMode:!1,splatPoints:[],lastSplatTime:0,hue:0};function Z(){const h=[];for(let i=0;i<12;i++){const e=i/12*Math.PI*2,o=.3+Math.random()*.15;h.push({x:.5+Math.cos(e)*o,y:.5+Math.sin(e)*o,angle:e+Math.PI,freqIndex:Math.floor(i/12*64)})}return h}function re({canvas:h,data:t,performanceMode:i=!1,beatIntensity:e=0,bass:o=0,mid:s=0}){const a=performance.now();if(!l.simulation||l.lastCanvas!==h||l.lastSize.width!==h.width||l.lastSize.height!==h.height){l.simulation&&l.simulation.destroy();const g=document.createElement("canvas");g.width=h.width,g.height=h.height;try{l.simulation=new Q(g,i),l.simulation.multipleSplats(Math.floor(Math.random()*5)+5)}catch(f){console.error("Failed to create fluid simulation:",f);return}l.lastCanvas=h,l.lastSize={width:h.width,height:h.height},l.performanceMode=i,l.splatPoints=Z(),l.lastTime=a}l.performanceMode!==i&&(l.simulation.setPerformanceMode(i),l.performanceMode=i);const r=l.simulation;if(!r)return;const n=Math.min((a-l.lastTime)/1e3,.016666);if(l.lastTime=a,l.hue=(l.hue+n*.1)%1,a-l.lastSplatTime>(i?80:50)){l.lastSplatTime=a;const g=t.reduce((f,d)=>f+d,0)/t.length;if(o>.5){const f=Math.floor(o*5)+2;for(let d=0;d<f;d++){const S=Math.random(),T=Math.random(),p=Math.random()*Math.PI*2,E=3e3+o*1e4,R=Math.cos(p)*E,y=Math.sin(p)*E,L=(l.hue+Math.random()*.3)%1,b=P(L,1,1);b.r*=.3*o,b.g*=.3*o,b.b*=.3*o,r.splat(S,T,R,y,b)}}for(const f of l.splatPoints){const d=t[f.freqIndex]||0;if(d>.35+Math.random()*.2){const S=1500+d*4e3+s*3e3,T=Math.cos(f.angle)*S,p=Math.sin(f.angle)*S,E=f.freqIndex/64,R=(l.hue+E*.5)%1,y=P(R,.8+d*.2,1);y.r*=.15+d*.2,y.g*=.15+d*.2,y.b*=.15+d*.2,r.splat(f.x,f.y,T,p,y)}}if(Math.random()<.1+g*.3){const f=_();f.r*=5+g*10,f.g*=5+g*10,f.b*=5+g*10;const d=.2+Math.random()*.6,S=.2+Math.random()*.6,T=Math.random()*Math.PI*2,p=500+g*2e3;r.splat(d,S,Math.cos(T)*p,Math.sin(T)*p,f)}}r.step(n),r.render();const m=h.getContext("2d");m&&(m.clearRect(0,0,h.width,h.height),m.drawImage(r.canvas,0,0))}function P(h,t,i){let e=0,o=0,s=0;const a=Math.floor(h*6),r=h*6-a,n=i*(1-t),u=i*(1-r*t),c=i*(1-(1-r)*t);switch(a%6){case 0:e=i,o=c,s=n;break;case 1:e=u,o=i,s=n;break;case 2:e=n,o=i,s=c;break;case 3:e=n,o=u,s=i;break;case 4:e=c,o=n,s=i;break;case 5:e=i,o=n,s=u;break}return{r:e,g:o,b:s}}function oe(){l.simulation&&(l.simulation.destroy(),l.simulation=null,l.lastCanvas=null,l.lastSize={width:0,height:0})}export{oe as cleanup,re as default};
