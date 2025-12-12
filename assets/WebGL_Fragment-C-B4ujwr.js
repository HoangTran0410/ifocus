import{e as p,d as h,f as d,b as v,i as _,j as b,k as C,l as S,F as x}from"./utils-E6iCwlZp.js";const y=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  // Polyfill for tanh (not available in WebGL 1.0)
  float tanhf(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  vec4 tanh4(vec4 v) {
    return vec4(tanhf(v.x), tanhf(v.y), tanhf(v.z), tanhf(v.w));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec3 r = vec3(u_resolution, 1.0);

    // Audio affects glow intensity and blob scale
    float glowBoost = 1.0 + u_bass * 1.5;
    float blobScale = 1.0 + u_bass * 0.4;  // Scale up on beat

    // Rotation matrix
    float angle = u_time / 2.0;
    mat2 R = mat2(cos(angle), cos(angle - 33.0), cos(angle - 11.0), cos(angle));

    float d = 0.0;
    float s;
    vec3 p;
    vec4 O = vec4(0.0);

    for (int iter = 0; iter < 100; iter++) {
      float i = float(iter);

      // Calculate position - apply scale to make blob larger on beat
      vec2 uv = (fragCoord + fragCoord - r.xy) / r.y * d / blobScale;
      p = vec3(R * uv, d - 8.0);
      p.xz = R * p.xz;

      // Distance calculation
      s = 0.012 + 0.07 * abs(max(sin(length(fract(p) * p)), length(p) - 4.0) - i / 100.0);
      d += s;

      // Accumulate color
      O += max(1.3 * sin(vec4(1.0, 2.0, 3.0, 1.0) + i * 0.3) / s, -length(p * p));
    }

    // Apply audio glow boost
    O *= glowBoost;

    // Tanh tonemapping
    O = tanh4(O * O / 800000.0);

    // Calculate alpha based on brightness
    float alpha = clamp(length(O.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(O.rgb, alpha);
  }
`,o={program:null,uniforms:{},time:0};function w({ctx:t,canvas:e,data:r,performanceMode:n=!1,beatIntensity:i=0,bass:l=0,mid:u=0,high:f=0}){if(!p(e.width,e.height))return;const s=h(),a=b();if(!a)return;if(!o.program){if(o.program=d(a,x,y),!o.program)return;o.uniforms=v(a,o.program)}if(_(),!o.program)return;o.time+=n?.012:.016;const m=r.reduce((g,c)=>g+c,0)/r.length;a.viewport(0,0,a.drawingBufferWidth,a.drawingBufferHeight),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.useProgram(o.program),a.uniform1f(o.uniforms.u_time,o.time),a.uniform1f(o.uniforms.u_intensity,m),a.uniform1f(o.uniforms.u_beatIntensity,i),a.uniform1f(o.uniforms.u_bass,l),a.uniform1f(o.uniforms.u_mid,u),a.uniform1f(o.uniforms.u_high,f),a.uniform2f(o.uniforms.u_resolution,e.width,e.height),a.enable(a.BLEND),a.blendFunc(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA),C(o.program),S(s,t,e)}function O(){o.program=null,o.uniforms={}}export{O as cleanup,w as default};
