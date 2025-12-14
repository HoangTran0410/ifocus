const e=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  #define iterations 12
  #define formuparam 0.57
  #define volsteps 10
  #define stepsize 0.2
  #define zoom 1.2
  #define tile 1.0
  #define speed 0.010
  #define brightness 0.0015
  #define darkmatter 1.0
  #define distfading 0.73
  #define saturation 1.0
  #define blackholeRadius 1.2
  #define blackholeIntensity 1.0

  float iSphere(vec3 ray, vec3 dir, vec3 center, float radius) {
    vec3 rc = ray - center;
    float c = dot(rc, rc) - (radius * radius);
    float b = dot(dir, rc);
    float d = b * b - c;
    float t = -b - sqrt(abs(d));
    float st = step(0.0, min(t, d));
    return mix(-1.0, t, st);
  }

  vec3 iPlane(vec3 ro, vec3 rd, vec3 po, vec3 pd) {
    float d = dot(po - ro, pd) / dot(rd, pd);
    return d * rd + ro;
  }

  vec3 rotateVec(vec3 v, vec2 r) {
    vec4 t = sin(vec4(r, r + 1.5707963268));
    float g = dot(v.yz, t.yw);
    return vec3(
      v.x * t.z - g * t.x,
      v.y * t.w - v.z * t.y,
      v.x * t.x + g * t.z
    );
  }

  void main() {
    vec2 uv = v_uv - 0.5;
    uv.y *= u_resolution.y / u_resolution.x;

    vec3 dir = vec3(uv * zoom, 1.0);
    float time = u_time * speed + 0.25;

    vec3 blackholeCenter = vec3(time * 2.0, time, -2.0);

    vec2 mo = vec2(0.0);

    vec3 from = vec3(0.0, 0.0, -15.0);
    from = rotateVec(from, mo / 10.0);
    dir = rotateVec(dir, mo / 10.0);
    from += blackholeCenter;

    vec3 nml = normalize(blackholeCenter - from);
    vec3 pos = iPlane(from, dir, blackholeCenter, nml);
    pos = blackholeCenter - pos;
    float intensity = dot(pos, pos);

    vec4 fragColor = vec4(0.0, 0.0, 0.0, 1.0);

    if (intensity > blackholeRadius * blackholeRadius) {
      intensity = 1.0 / intensity;
      dir = mix(dir, pos * sqrt(intensity), (1.0 + u_bass) * intensity);

      float s = 0.1;
      float fade = 1.0;
      vec3 v = vec3(0.0);

      for (int r = 0; r < volsteps; r++) {
        vec3 p = from + s * dir * 0.5;
        p = abs(vec3(tile) - mod(p, vec3(tile * 2.0)));

        float pa = 0.0;
        float a = 0.0;

        for (int i = 0; i < iterations; i++) {
          p = abs(p) / dot(p, p) - formuparam;
          a += abs(length(p) - pa);
          pa = length(p);
        }

        float dm = max(0.0, darkmatter - a * a * 0.001);
        a *= a * a;

        if (r > 6) fade *= 1.0 - dm;

        v += fade;
        v += vec3(s, s * s, s * s * s * s) * a * brightness * fade;
        fade *= distfading;
        s += stepsize;
      }

      v = mix(vec3(length(v)), v, saturation);
      fragColor = vec4(v * 0.01, 1.0);
    }

    gl_FragColor = fragColor;
  }
`;export{e as default};
