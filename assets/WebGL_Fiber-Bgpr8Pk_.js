import{e as h,f as E,i as _}from"./comp-visualizer-dpYbgoWi.js";import"./vendor-7n6RyNsU.js";import"./comp-audiocontroller-C9_egn6F.js";import"./comp-background-2KjCJFop.js";const n=`
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`,v=`
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
`,p=`
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
`,r={bufferAProgram:null,imageProgram:null,framebuffer:null,texture:null,quadBuffer:null,uniforms:{bufferA:{},image:{}},textureWidth:0,textureHeight:0,time:0};function m(e,o,u){const a=e.createShader(o);return a?(e.shaderSource(a,u),e.compileShader(a),e.getShaderParameter(a,e.COMPILE_STATUS)?a:(console.error("Shader compile error:",e.getShaderInfoLog(a)),e.deleteShader(a),null)):null}function s(e,o,u){const a=m(e,e.VERTEX_SHADER,o),f=m(e,e.FRAGMENT_SHADER,u);if(!a||!f)return null;const i=e.createProgram();return i?(e.attachShader(i,a),e.attachShader(i,f),e.linkProgram(i),e.getProgramParameter(i,e.LINK_STATUS)?(e.deleteShader(a),e.deleteShader(f),i):(console.error("Program link error:",e.getProgramInfoLog(i)),e.deleteProgram(i),null)):null}function R(e,o,u){return r.bufferAProgram=s(e,n,v),r.imageProgram=s(e,n,p),!r.bufferAProgram||!r.imageProgram?!1:(r.uniforms.bufferA={u_time:e.getUniformLocation(r.bufferAProgram,"u_time"),u_resolution:e.getUniformLocation(r.bufferAProgram,"u_resolution")},r.uniforms.image={u_texture:e.getUniformLocation(r.imageProgram,"u_texture"),u_beatIntensity:e.getUniformLocation(r.imageProgram,"u_beatIntensity"),u_bass:e.getUniformLocation(r.imageProgram,"u_bass"),u_mid:e.getUniformLocation(r.imageProgram,"u_mid")},r.quadBuffer=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,r.quadBuffer),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),e.STATIC_DRAW),r.framebuffer=e.createFramebuffer(),r.texture=e.createTexture(),e.bindTexture(e.TEXTURE_2D,r.texture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,o,u,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,r.framebuffer),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,r.texture,0),e.bindFramebuffer(e.FRAMEBUFFER,null),r.textureWidth=o,r.textureHeight=u,!0)}function T(e,o,u){r.textureWidth===o&&r.textureHeight===u||(e.bindTexture(e.TEXTURE_2D,r.texture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,o,u,0,e.RGBA,e.UNSIGNED_BYTE,null),r.textureWidth=o,r.textureHeight=u)}function c(e,o){const u=e.getAttribLocation(o,"a_position");e.bindBuffer(e.ARRAY_BUFFER,r.quadBuffer),e.enableVertexAttribArray(u),e.vertexAttribPointer(u,2,e.FLOAT,!1,0,0),e.drawArrays(e.TRIANGLES,0,6)}function U({ctx:e,canvas:o,data:u,performanceMode:a=!1,beatIntensity:f=0,bass:i=0,mid:l=0}){if(!h(o.width,o.height))return;const b=E(),t=_();if(!t||!r.bufferAProgram&&!R(t,o.width,o.height)||!r.bufferAProgram||!r.imageProgram)return;T(t,o.width,o.height),r.time+=a?.012:.016;const d=u.reduce((A,x)=>A+x,0)/u.length;t.bindFramebuffer(t.FRAMEBUFFER,r.framebuffer),t.viewport(0,0,o.width,o.height),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.useProgram(r.bufferAProgram),t.uniform1f(r.uniforms.bufferA.u_time,r.time),t.uniform1f(r.uniforms.bufferA.u_intensity,d),t.uniform1f(r.uniforms.bufferA.u_beatIntensity,f),t.uniform1f(r.uniforms.bufferA.u_bass,i),t.uniform1f(r.uniforms.bufferA.u_mid,l),t.uniform2f(r.uniforms.bufferA.u_resolution,o.width,o.height),t.disable(t.BLEND),c(t,r.bufferAProgram),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,t.drawingBufferWidth,t.drawingBufferHeight),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.useProgram(r.imageProgram),t.uniform1i(r.uniforms.image.u_texture,0),t.uniform2f(r.uniforms.image.u_resolution,o.width,o.height),t.uniform1f(r.uniforms.image.u_beatIntensity,f),t.uniform1f(r.uniforms.image.u_bass,i),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,r.texture),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),c(t,r.imageProgram),e.clearRect(0,0,o.width,o.height),e.drawImage(b,0,0)}function D(){const e=_();e&&(r.bufferAProgram&&e.deleteProgram(r.bufferAProgram),r.imageProgram&&e.deleteProgram(r.imageProgram),r.framebuffer&&e.deleteFramebuffer(r.framebuffer),r.texture&&e.deleteTexture(r.texture),r.quadBuffer&&e.deleteBuffer(r.quadBuffer)),r.bufferAProgram=null,r.imageProgram=null,r.framebuffer=null,r.texture=null,r.quadBuffer=null,r.textureWidth=0,r.textureHeight=0}export{D as cleanup,U as default};
