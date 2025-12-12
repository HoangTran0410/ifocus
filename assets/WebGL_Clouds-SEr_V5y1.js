import{d as u,e as v,b as p,s as d,f as h,i as g,r as x,F as y}from"./utils-BleFf0sD.js";const q=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  #define PI 3.14159265359

  // Smoother hash function
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  // Smooth 3D noise - critical for non-jittery clouds
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    // Smoother interpolation (quintic)
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    float n = p.x + p.y * 157.0 + 113.0 * p.z;
    return mix(
      mix(
        mix(hash(n + 0.0), hash(n + 1.0), f.x),
        mix(hash(n + 157.0), hash(n + 158.0), f.x),
        f.y
      ),
      mix(
        mix(hash(n + 113.0), hash(n + 114.0), f.x),
        mix(hash(n + 270.0), hash(n + 271.0), f.x),
        f.y
      ),
      f.z
    );
  }

  // Camera setup
  mat3 setCamera(vec3 ro, vec3 ta, float cr) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
  }

  // Sun direction
  const vec3 sundir = vec3(-0.7071, 0.0, -0.7071);

  // Cloud density with FBM - multiple octaves for detail
  float map5(vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * u_time;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q); q = q * 2.03;
    f += 0.12500 * noise(q); q = q * 2.01;
    f += 0.06250 * noise(q); q = q * 2.02;
    f += 0.03125 * noise(q);
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
  }

  float map4(vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * u_time;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q); q = q * 2.03;
    f += 0.12500 * noise(q); q = q * 2.01;
    f += 0.06250 * noise(q);
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
  }

  float map3(vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * u_time;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q); q = q * 2.03;
    f += 0.12500 * noise(q);
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
  }

  float map2(vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * u_time;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q);
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
  }

  // Raymarch through clouds with LOD
  vec4 raymarch(vec3 ro, vec3 rd, vec3 bgcol) {
    vec4 sum = vec4(0.0);
    float t = 0.0;

    // March with map5 (highest detail)
    for (int i = 0; i < 40; i++) {
      vec3 pos = ro + t * rd;
      if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
      float den = map5(pos);
      if (den > 0.01) {
        float dif = clamp((den - map5(pos + 0.3 * sundir)) / 0.6, 0.0, 1.0);
        vec3 lin = vec3(1.0, 0.6, 0.3) * dif + vec3(0.91, 0.98, 1.05);
        vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den), den);
        col.xyz *= lin;
        col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
        col.w *= 0.4;
        col.rgb *= col.a;
        sum += col * (1.0 - sum.a);
      }
      t += max(0.06, 0.05 * t);
    }

    // March with map4
    for (int i = 0; i < 40; i++) {
      vec3 pos = ro + t * rd;
      if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
      float den = map4(pos);
      if (den > 0.01) {
        float dif = clamp((den - map4(pos + 0.3 * sundir)) / 0.6, 0.0, 1.0);
        vec3 lin = vec3(1.0, 0.6, 0.3) * dif + vec3(0.91, 0.98, 1.05);
        vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den), den);
        col.xyz *= lin;
        col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
        col.w *= 0.4;
        col.rgb *= col.a;
        sum += col * (1.0 - sum.a);
      }
      t += max(0.06, 0.05 * t);
    }

    // March with map3
    for (int i = 0; i < 30; i++) {
      vec3 pos = ro + t * rd;
      if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
      float den = map3(pos);
      if (den > 0.01) {
        float dif = clamp((den - map3(pos + 0.3 * sundir)) / 0.6, 0.0, 1.0);
        vec3 lin = vec3(1.0, 0.6, 0.3) * dif + vec3(0.91, 0.98, 1.05);
        vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den), den);
        col.xyz *= lin;
        col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
        col.w *= 0.4;
        col.rgb *= col.a;
        sum += col * (1.0 - sum.a);
      }
      t += max(0.06, 0.05 * t);
    }

    // March with map2 (lowest detail, far away)
    for (int i = 0; i < 30; i++) {
      vec3 pos = ro + t * rd;
      if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
      float den = map2(pos);
      if (den > 0.01) {
        float dif = clamp((den - map2(pos + 0.3 * sundir)) / 0.6, 0.0, 1.0);
        vec3 lin = vec3(1.0, 0.6, 0.3) * dif + vec3(0.91, 0.98, 1.05);
        vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den), den);
        col.xyz *= lin;
        col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
        col.w *= 0.4;
        col.rgb *= col.a;
        sum += col * (1.0 - sum.a);
      }
      t += max(0.06, 0.05 * t);
    }

    return clamp(sum, 0.0, 1.0);
  }

  vec4 render(vec3 ro, vec3 rd) {
    float sun = clamp(dot(sundir, rd), 0.0, 1.0);

    // Background sky
    vec3 col = vec3(0.6, 0.71, 0.75) - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.15 * 0.5;
    col += 0.2 * vec3(1.0, 0.6, 0.1) * pow(sun, 8.0);

    // Raymarch clouds
    vec4 res = raymarch(ro, rd, col);
    col = col * (1.0 - res.w) + res.xyz;

    // Sun glare
    col += vec3(0.2, 0.08, 0.04) * pow(sun, 3.0);

    return vec4(col, 1.0);
  }

  void main() {
    vec2 p = (2.0 * v_uv - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);

    // Camera - orbiting around with mouse control
    vec2 m = u_mouse;
    vec3 ro = 4.0 * normalize(vec3(sin(3.0 * m.x), 0.8 * m.y, cos(3.0 * m.x))) - vec3(0.0, 0.1, 0.0);
    vec3 ta = vec3(0.0, -1.0, 0.0);
    mat3 ca = setCamera(ro, ta, 0.07 * cos(0.25 * u_time));

    // Ray direction
    vec3 rd = ca * normalize(vec3(p.xy, 1.5));

    vec4 color = render(ro, rd);

    gl_FragColor = color;
  }
`,e={program:null,uniforms:{},initialized:!1,lastCanvas:null,glCanvas:null,time:0,mouseX:.5,mouseY:.3};function C({ctx:n,canvas:i,data:a,performanceMode:r=!1,beatIntensity:t=0,bass:c=0,mid:l=0}){(!e.glCanvas||e.lastCanvas!==i)&&(e.glCanvas=document.createElement("canvas"),e.initialized=!1),(e.glCanvas.width!==i.width||e.glCanvas.height!==i.height)&&(e.glCanvas.width=i.width,e.glCanvas.height=i.height,e.initialized=!1);const o=u(e.glCanvas);if(!o)return;if(!e.initialized){if(e.program=v(o,y,q),!e.program)return;e.uniforms=p(o,e.program),d(o),e.initialized=!0,e.lastCanvas=i}if(!e.program)return;e.time+=(r?.012:.016)*(1+c*.3),e.mouseX+=3e-4,e.mouseY=.3+Math.sin(e.time*.1)*.1;const s=a.reduce((f,m)=>f+m,0)/a.length;o.viewport(0,0,o.drawingBufferWidth,o.drawingBufferHeight),o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT),o.useProgram(e.program),o.uniform1f(e.uniforms.u_time,e.time),o.uniform1f(e.uniforms.u_intensity,s),o.uniform1f(e.uniforms.u_beatIntensity,t),o.uniform1f(e.uniforms.u_bass,c),o.uniform1f(e.uniforms.u_mid,l),o.uniform2f(e.uniforms.u_resolution,i.width,i.height),o.uniform2f(e.uniforms.u_mouse,e.mouseX%1,e.mouseY%1),o.enable(o.BLEND),o.blendFunc(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA),h(o,e.program),g(e.glCanvas,n,i)}function w(){e.glCanvas&&(x(e.glCanvas),e.glCanvas=null,e.program=null,e.initialized=!1,e.lastCanvas=null)}export{w as cleanup,C as default};
