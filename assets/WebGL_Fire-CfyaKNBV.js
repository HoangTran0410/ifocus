import{e as h,d as p,f as c,b as _,i as v,j as b,k as x,l as y,F as C}from"./utils-E6iCwlZp.js";const S=`
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

    // Audio affects fire height and intensity
    float fireHeight = 1.0 + u_bass * 0.8;
    float fireBrightness = 1.0 + u_bass * 2.0;

    float t = u_time;
    float z = 0.0;
    float d;

    vec4 O = vec4(0.0);

    // Raymarching loop with 50 iterations
    for (int iter = 0; iter < 50; iter++) {
      // Compute raymarch sample point
      vec3 p = z * normalize(vec3(fragCoord + fragCoord, 0.0) - u_resolution.xyy);

      // Shift back and animate
      p.z += 5.0 + cos(t);

      // Twist and rotate using mat2
      float angle = p.y * 0.5;
      mat2 rotMat = mat2(cos(angle), cos(angle - 33.0), cos(angle - 11.0), cos(angle));

      // Expand upward - audio affects the expansion
      float expand = max(p.y * 0.1 / fireHeight + 1.0, 0.1);
      p.xz = rotMat * p.xz / expand;

      // Turbulence loop
      d = 2.0;
      for (int j = 0; j < 8; j++) {
        if (d >= 15.0) break;
        p += cos((p.yzx - vec3(t / 0.1, t, d)) * d) / d;
        d /= 0.6;
      }

      // Sample approximate distance to hollow cone
      d = 0.01 + abs(length(p.xz) + p.y * 0.3 - 0.5) / 7.0;
      z += d;

      // Add color and glow attenuation
      O += (sin(z / 3.0 + vec4(7.0, 2.0, 3.0, 0.0)) + 1.1) / d;
    }

    // Apply audio brightness boost
    O *= fireBrightness;

    // Tanh tonemapping
    O = tanh4(O / 1000.0);

    // Calculate alpha based on brightness
    float alpha = clamp(length(O.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(O.rgb, alpha);
  }
`,e={program:null,uniforms:{},time:0};function z({ctx:o,canvas:r,data:t,performanceMode:n=!1,beatIntensity:i=0,bass:f=0,mid:u=0,high:s=0}){if(!h(r.width,r.height))return;const l=p(),a=b();if(!a)return;if(!e.program){if(e.program=c(a,C,S),!e.program)return;e.uniforms=_(a,e.program)}if(v(),!e.program)return;e.time+=n?.012:.016;const m=t.reduce((g,d)=>g+d,0)/t.length;a.viewport(0,0,a.drawingBufferWidth,a.drawingBufferHeight),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.useProgram(e.program),a.uniform1f(e.uniforms.u_time,e.time),a.uniform1f(e.uniforms.u_intensity,m),a.uniform1f(e.uniforms.u_beatIntensity,i),a.uniform1f(e.uniforms.u_bass,f),a.uniform1f(e.uniforms.u_mid,u),a.uniform1f(e.uniforms.u_high,s),a.uniform2f(e.uniforms.u_resolution,r.width,r.height),a.enable(a.BLEND),a.blendFunc(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA),x(e.program),y(l,o,r)}function E(){e.program=null,e.uniforms={}}export{E as cleanup,z as default};
