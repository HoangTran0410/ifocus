import{e as c,d as h,f as g,b as v,i as d,j as _,k as b,l as y,F as x}from"./utils-E6iCwlZp.js";const C=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_high;
  uniform vec2 u_resolution;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  mat2 rotate2d(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat2(c, -s, s, c);
  }

  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    float a = hash12(ip);
    float b = hash12(ip + vec2(1.0, 0.0));
    float c = hash12(ip + vec2(0.0, 1.0));
    float d = hash12(ip + vec2(1.0, 1.0));

    vec2 t = smoothstep(0.0, 1.0, fp);
    return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
  }

  float fbm(vec2 p, int octaveCount) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 10; i++) {
      if (i >= octaveCount) break;
      value += amplitude * noise(p);
      p *= rotate2d(0.45);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = v_uv;
    uv = 2.0 * uv - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    // Audio affects lightning intensity, distortion, and scale
    float scale = 1.0 - u_bass * 0.3;  // Zoom in on beat
    float distortionAmount = 1.0 + u_bass * 2.0;  // More wiggly on beat
    float brightness = 0.3 + u_bass * 5.0;  // Much brighter on beat
    float glowWidth = 0.01 + u_bass * 0.5;  // Thicker glow on beat

    // Apply scale
    uv *= scale;

    uv += (2.0 * fbm(uv + 0.8 * u_time, 10) - 1.0) * distortionAmount;

    float dist = abs(uv.x);
    vec3 col = vec3(0.2, 0.3, 0.8) * pow(mix(0.0, glowWidth, hash11(u_time)) / dist, 1.0);

    // Apply brightness boost
    col *= brightness;

    col = pow(col, vec3(1.0));

    // Calculate alpha based on brightness
    float alpha = clamp(length(col) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`,o={program:null,uniforms:{},time:0};function A({ctx:i,canvas:a,data:e,performanceMode:r=!1,beatIntensity:n=0,bass:u=0,high:s=0}){if(!c(a.width,a.height))return;const f=h(),t=_();if(!t)return;if(!o.program){if(o.program=g(t,x,C),!o.program)return;o.uniforms=v(t,o.program)}if(d(),!o.program)return;o.time+=r?.012:.016;const l=e.reduce((p,m)=>p+m,0)/e.length;t.viewport(0,0,t.drawingBufferWidth,t.drawingBufferHeight),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.useProgram(o.program),t.uniform1f(o.uniforms.u_time,o.time),t.uniform1f(o.uniforms.u_intensity,l),t.uniform1f(o.uniforms.u_beatIntensity,n),t.uniform1f(o.uniforms.u_bass,u),t.uniform1f(o.uniforms.u_high,s),t.uniform2f(o.uniforms.u_resolution,a.width,a.height),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),b(o.program),y(f,i,a)}function S(){o.program=null,o.uniforms={}}export{S as cleanup,A as default};
