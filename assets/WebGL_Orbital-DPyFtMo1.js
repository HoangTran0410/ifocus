import{e as _,d as c,f as d,b as p,i as v,j as b,k as y,l as C,F as S}from"./utils-E6iCwlZp.js";const E=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  void main() {
    vec2 r = u_resolution.xy;
    vec2 fragCoord = v_uv * r;

    // Audio affects brightness and wave intensity
    float brightness = 1.0 + u_bass * 1.5;
    float waveIntensity = 1.0 + u_bass * 0.5;

    vec3 c;
    float l;
    float z = u_time;

    for (int i = 0; i < 3; i++) {
      vec2 uv;
      vec2 p = fragCoord.xy / r;
      uv = p;
      p -= 0.5;
      p.x *= r.x / r.y;
      z += 0.07;
      l = length(p);
      uv += p / l * (sin(z) + 1.0) * abs(sin(l * 9.0 * waveIntensity - z - z));
      c[i] = 0.01 / length(mod(uv, 1.0) - 0.5);
    }

    vec3 color = c / l * brightness;

    // Calculate alpha based on brightness
    float alpha = clamp(length(color) * 0.5, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`,i={program:null,uniforms:{},time:0};function R({ctx:n,canvas:o,data:e,performanceMode:a=!1,beatIntensity:t=0,bass:u=0,mid:f=0,high:s=0}){if(!_(o.width,o.height))return;const l=c(),r=b();if(!r)return;if(!i.program){if(i.program=d(r,S,E),!i.program)return;i.uniforms=p(r,i.program)}if(v(),!i.program)return;i.time+=a?.012:.016;const m=e.reduce((g,h)=>g+h,0)/e.length;r.viewport(0,0,r.drawingBufferWidth,r.drawingBufferHeight),r.clearColor(0,0,0,0),r.clear(r.COLOR_BUFFER_BIT),r.useProgram(i.program),r.uniform1f(i.uniforms.u_time,i.time),r.uniform1f(i.uniforms.u_intensity,m),r.uniform1f(i.uniforms.u_beatIntensity,t),r.uniform1f(i.uniforms.u_bass,u),r.uniform1f(i.uniforms.u_mid,f),r.uniform1f(i.uniforms.u_high,s),r.uniform2f(i.uniforms.u_resolution,o.width,o.height),r.enable(r.BLEND),r.blendFunc(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA),y(i.program),C(l,n,o)}function A(){i.program=null,i.uniforms={}}export{A as cleanup,R as default};
