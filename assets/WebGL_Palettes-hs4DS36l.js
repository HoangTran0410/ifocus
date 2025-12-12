import{e as v,d as g,f as h,F as _,j as d,b,i as y,k as w,l as S}from"./utils-E6iCwlZp.js";const x=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 p = fragCoord.xy / u_resolution.xy;

    // Audio affects zoom and brightness
    float zoom = 1.0 - u_bass * 0.3;  // Zoom in on beat (smaller = more zoomed)
    float brightness = 1.0 + u_bass * 0.3;

    // Apply zoom from center
    p = (p - 0.5) * zoom + 0.5;

    // Animate with slight beat shift
    p.x += 0.3 * u_time + u_bass * 0.1;

    // Get row index for random shift
    float row = floor(p.y * 7.0);
    float rowShift = sin(row * 2.3 + u_time * (0.3 + row * 0.1)) * 0.2;
    float px = p.x + rowShift;

    // Compute colors with row-specific shifts
    vec3 col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0), vec3(0.0, 0.33, 0.67));
    if (p.y > (1.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0), vec3(0.0, 0.10, 0.20));
    if (p.y > (2.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0), vec3(0.3, 0.20, 0.20));
    if (p.y > (3.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 0.5), vec3(0.8, 0.90, 0.30));
    if (p.y > (4.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 0.7, 0.4), vec3(0.0, 0.15, 0.20));
    if (p.y > (5.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25));
    if (p.y > (6.0 / 7.0)) col = pal(px, vec3(0.8, 0.5, 0.4), vec3(0.2, 0.4, 0.2), vec3(2.0, 1.0, 1.0), vec3(0.0, 0.25, 0.25));

    // Band
    float f = fract(p.y * 7.0);
    // Borders
    col *= smoothstep(0.49, 0.47, abs(f - 0.5));
    // Shadowing
    col *= 0.5 + 0.5 * sqrt(4.0 * f * (1.0 - f));

    // Apply brightness boost
    col *= brightness;

    gl_FragColor = vec4(col, 1.0);
  }
`,e={program:null,uniforms:{},time:0};function A({ctx:t,canvas:r,data:i,performanceMode:a=!1,beatIntensity:f=0,bass:n=0,mid:s=0,high:u=0}){if(!v(r.width,r.height))return;const c=g(),o=d();if(!o)return;if(!e.program){if(e.program=h(o,_,x),!e.program)return;e.uniforms=b(o,e.program)}if(y(),!e.program)return;e.time+=a?.012:.016;const l=i.reduce((m,p)=>m+p,0)/i.length;o.viewport(0,0,o.drawingBufferWidth,o.drawingBufferHeight),o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT),o.useProgram(e.program),o.uniform1f(e.uniforms.u_time,e.time),o.uniform1f(e.uniforms.u_intensity,l),o.uniform1f(e.uniforms.u_beatIntensity,f),o.uniform1f(e.uniforms.u_bass,n),o.uniform1f(e.uniforms.u_mid,s),o.uniform1f(e.uniforms.u_high,u),o.uniform2f(e.uniforms.u_resolution,r.width,r.height),o.enable(o.BLEND),o.blendFunc(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA),w(e.program),S(c,t,r)}function E(){e.program=null,e.uniforms={}}export{E as cleanup,A as default};
