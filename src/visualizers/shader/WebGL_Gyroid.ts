/*
    "Gyroid" effect adapted for ifocus
    Original by Shadertoy
*/

export default /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  #define FAR 30.
  #define PI 3.14159265359

  int m = 0;

  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  mat3 lookAt(vec3 dir) {
      vec3 up = vec3(0., 1., 0.);
      vec3 rt = normalize(cross(dir, up));
      return mat3(rt, cross(rt, dir), dir);
  }

  float gyroid(vec3 p) { return dot(cos(p), sin(p.zxy)) + 1.; }

  float map(vec3 p) {
      float r = 1e5, d;

      d = gyroid(p);
      if (d < r) { r = d; m = 1; }

      d = gyroid(p - vec3(0, 0, PI));
      if (d < r) { r = d; m = 2; }

      return r;
  }

  float raymarch(vec3 ro, vec3 rd) {
      float t = 0.;
      for (int i = 0; i < 150; i++) {
          float d = map(ro + rd * t);
          if (abs(d) < .001) break;
          t += d;
          if (t > FAR) break;
      }
      return t;
  }

  float getAO(vec3 p, vec3 sn) {
      float occ = 0.;
      for (float i = 0.; i < 4.; i++) {
          float t = i * .08;
          float d = map(p + sn * t);
          occ += t - d;
      }
      return clamp(1. - occ, 0., 1.);
  }

  vec3 getNormal(vec3 p) {
      vec2 e = vec2(0.5773, -0.5773) * 0.001;
      return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
  }

  vec3 trace(vec3 ro, vec3 rd) {
      vec3 C = vec3(0);
      vec3 throughput = vec3(1);

      for (int bounce = 0; bounce < 2; bounce++) {
          float d = raymarch(ro, rd);
          if (d > FAR) { break; }

          // fog
          float fog = 1. - exp(-.008 * d * d);
          C += throughput * fog * vec3(0); throughput *= 1. - fog;

          vec3 p = ro + rd * d;
          vec3 sn = normalize(getNormal(p) + pow(abs(cos(p * 64.)), vec3(16.)) * .1);

          // lighting
          vec3 lp = vec3(10., -10., -10. + ro.z);
          vec3 ld = normalize(lp - p);
          float diff = max(0., .5 + 2. * dot(sn, ld));
          float diff2 = pow(length(sin(sn * 2.) * .5 + .5), 2.0);
          float diff3 = max(0., .5 + .5 * dot(sn, vec2(1, 0).yyx));

          float spec = max(0., dot(reflect(-ld, sn), -rd));
          float fres = 1. - max(0., dot(-rd, sn));
          vec3 col = vec3(0), alb = vec3(0);

          col += vec3(.4, .6, .9) * diff;
          col += vec3(.5, .1, .1) * diff2;
          col += vec3(.9, .1, .4) * diff3;
          col += vec3(.3, .25, .25) * pow(spec, 4.0) * 8.0;

          float freck = dot(cos(p * 23.), vec3(1));
          if (m == 1) { alb = vec3(.2, .1, .9);  alb *= max(.6, step(2.5, freck)); }
          if (m == 2) { alb = vec3(.6, .3, .1);  alb *= max(.8, step(-2.5, freck)); }
          col *= alb;

          col *= getAO(p, sn);
          C += throughput * col;

          // reflection
          rd = reflect(rd, sn);
          ro = p + sn * .01;
          throughput *= .9 * pow(fres, 1.0);
      }
      return C;
  }

  void main() {
      vec2 fragCoord = v_uv * u_resolution;
      vec2 uv = (fragCoord.xy - u_resolution.xy * .5) / u_resolution.y;

      // Handle potential mouse input (fallback to time-based if mouse is zero or not present)
      // Pulsate camera position with bass
      float zoom = 1.0 + u_bass * 0.2;
      vec3 ro = vec3(PI / 2., 0, -u_time * .5);

      // Scale coordinates for "breathing" effect
      vec2 p_uv = uv * (1.0 - u_intensity * 0.1);
      vec3 rd = normalize(vec3(p_uv, -.5 * zoom));

      // Simple time-based rotation if no mouse
      // Modulate rotation speed with intensity
      float rotSpeed = u_time * .2 + u_intensity * 0.5;
      rd.xy = rot(sin(rotSpeed)) * rd.xy;
      vec3 ta = vec3(cos(u_time * .4), sin(u_time * .4), 4.);
      rd = lookAt(normalize(ta)) * rd;

      // Dynamic color shift based on audio
      vec3 col = trace(ro, rd);

      // Add audio-driven color tint
      vec3 colorShift = vec3(u_bass, u_mid, u_high) * 0.3;
      col += colorShift * col;

      col *= smoothstep(0., 1., 1.2 - length(uv * .9));
      col = pow(col, vec3(0.4545));

      // Calculate alpha based on brightness and audio intensity
      float alpha = clamp(length(col) * (2.0 + u_intensity), 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
  }
`;
