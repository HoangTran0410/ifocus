const t=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  // IQ's palette function
  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  // Sky palette
  vec3 sp(float t) {
    return palette(t, vec3(0.26, 0.76, 0.77), vec3(1.0, 0.3, 1.0), vec3(0.8, 0.4, 0.7), vec3(0.0, 0.12, 0.54));
  }

  // Hue function
  vec4 hue(float v) {
    return 0.6 + 0.76 * cos(6.3 * v + vec4(0.0, 23.0, 21.0, 0.0));
  }

  // Hash functions by Dave_Hoskins
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }

  vec2 rotate2D(vec2 st, float a) {
    return mat2(cos(a), -sin(a), sin(a), cos(a)) * st;
  }

  float st(float a, float b, float s) {
    return smoothstep(a - s, a + s, b);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 r = u_resolution.xy;
    vec2 uv = (fragCoord + fragCoord - r) / r.y;

    // Audio affects sun radius in the sky
    float sunRadius = 1.0 - u_bass * 0.3;  // Smaller value = larger sun

    vec2 sun_pos = vec2(r.x / r.y * 0.42, -0.53);
    vec2 tree_pos = vec2(-r.x / r.y * 0.42, -0.2);

    vec3 f = vec3(0.0);
    float sm = 3.0 / r.y;

    vec2 sh = rotate2D(sun_pos, noise(uv + u_time * 0.25) * 0.3);

    // Drawing the sky
    if (uv.y > -0.4) {
      vec2 u = uv + sh;
      float yd = 60.0;
      vec2 id = vec2((length(u) * sunRadius + 0.01) * yd, 0.0);
      float xd = floor(id.x) * 0.09;
      float h = (hash12(floor(id.xx)) * 0.5 + 0.25) * (u_time + 10.0) * 0.25;
      vec2 t = rotate2D(u, h);

      id.y = atan(t.y, t.x) * xd;
      vec2 lc = fract(id);
      id -= lc;

      t = vec2(cos((id.y + 0.5) / xd) * (id.x + 0.5) / yd, sin((id.y + 0.5) / xd) * (id.x + 0.5) / yd);
      t = rotate2D(t, -h) - sh;

      h = noise(t * vec2(0.5, 1.0) - vec2(u_time * 0.2, 0.0)) * step(-0.25, t.y);
      h = smoothstep(0.052, 0.055, h);

      lc += noise(lc * vec2(1.0, 4.0) + id) * vec2(0.7, 0.2);

      f = mix(sp(sin(length(u) - 0.1)) * 0.35,
              mix(sp(sin(length(u) - 0.1) + (hash12(id) - 0.5) * 0.15), vec3(1.0), h),
              st(abs(lc.x - 0.5), 0.4, sm * yd) * st(abs(lc.y - 0.5), 0.48, sm * xd));
    }

    // Drawing water
    if (uv.y < -0.35) {
      float cld = noise(-sh * vec2(0.5, 1.0) - vec2(u_time * 0.2, 0.0));
      cld = 1.0 - smoothstep(0.0, 0.15, cld) * 0.5;

      vec2 u = uv * vec2(1.0, 15.0);
      vec2 id = floor(u);

      for (int ii = 1; ii >= -1; ii--) {
        float i = float(ii);
        if (id.y + i < -5.0) {
          vec2 lc = fract(u) - 0.5;
          lc.y = (lc.y + sin(uv.x * 12.0 - u_time * 3.0 + id.y + i) * 0.25 - i) * 4.0;
          float h = hash12(vec2(id.y + i, floor(lc.y)));

          float xd = 6.0 + h * 4.0;
          float yd = 30.0;
          lc.x = uv.x * xd + sh.x * 9.0;
          lc.x += sin(u_time * (0.5 + h * 2.0)) * 0.5;
          h = 0.8 * smoothstep(5.0, 0.0, abs(floor(lc.x))) * cld + 0.1;
          f = mix(f, mix(vec3(0.0, 0.1, 0.5), vec3(0.35, 0.35, 0.0), h), st(lc.y, 0.0, sm * yd));
          lc += noise(lc * vec2(3.0, 0.5)) * vec2(0.1, 0.6);

          f = mix(f,
              mix(hue(hash12(floor(lc)) * 0.1 + 0.56).rgb * (1.2 + floor(lc.y) * 0.17), vec3(1.0, 1.0, 0.0), h),
              st(lc.y, 0.0, sm * xd) * st(abs(fract(lc.x) - 0.5), 0.48, sm * xd) * st(abs(fract(lc.y) - 0.5), 0.3, sm * yd));
        }
      }
    }

    vec4 O = vec4(f, 1.0);

    // Drawing the grass
    float a = 0.0;
    vec2 u = uv + noise(uv * 2.0) * 0.1 + vec2(0.0, sin(uv.x * 1.0 + 3.0) * 0.4 + 0.8);

    f = mix(vec3(0.7, 0.6, 0.2), vec3(0.0, 1.0, 0.0), sin(u_time * 0.2) * 0.5 + 0.5);
    O = mix(O, vec4(f * 0.4, 1.0), step(u.y, 0.0));

    float xd = 60.0;
    u = u * vec2(xd, xd / 3.5);

    if (u.y < 1.2) {
      for (int yi = 0; yi > -3; yi--) {
        for (int xi = -2; xi < 3; xi++) {
          float x = float(xi);
          float y = float(yi);
          vec2 id = floor(u) + vec2(x, y);
          vec2 lc = (fract(u) + vec2(1.0 - x, -y)) / vec2(5.0, 3.0);
          float h = (hash12(id) - 0.5) * 0.25 + 0.5;

          lc -= vec2(0.3, 0.5 - h * 0.4);
          lc.x += sin(((u_time * 1.7 + h * 2.0 - id.x * 0.05 - id.y * 0.05) * 1.1 + id.y * 0.5) * 2.0) * (lc.y + 0.5) * 0.5;
          vec2 t = abs(lc) - vec2(0.02, 0.5 - h * 0.5);
          float l = length(max(t, 0.0)) + min(max(t.x, t.y), 0.0);

          l -= noise(lc * 7.0 + id) * 0.1;
          vec4 C = vec4(f * 0.25, st(l, 0.1, sm * xd * 0.09));
          C = mix(C, vec4(f * (1.2 + lc.y * 2.0) * (1.8 - h * 2.5), 1.0), st(l, 0.04, sm * xd * 0.09));

          O = mix(O, C, C.a * step(id.y, -1.0));
          a = max(a, C.a * step(id.y, -5.0));
        }
      }
    }

    float T = sin(u_time * 0.5);

    // Drawing the tree
    if (abs(uv.x + tree_pos.x - 0.1 - T * 0.1) < 0.6) {
      u = uv + tree_pos;
      u.x -= sin(u.y + 1.0) * 0.2 * (T + 0.75);
      u += noise(u * 4.5 - 7.0) * 0.25;

      xd = 10.0;
      float yd = 60.0;
      vec2 t = u * vec2(1.0, yd);
      float h = hash12(floor(t.yy));
      t.x += h * 0.01;
      t.x *= xd;

      vec2 lc = fract(t);

      float m = st(abs(t.x - 0.5), 0.5, sm * xd) * step(abs(t.y + 20.0), 45.0);
      vec4 C = mix(vec4(0.07, 0.07, 0.07, 1.0), vec4(0.5, 0.3, 0.0, 1.0) * (0.4 + h * 0.4),
                   st(abs(lc.y - 0.5), 0.4, sm * yd) * st(abs(lc.x - 0.5), 0.45, sm * xd));
      C.a = m;

      xd = 30.0;
      yd = 15.0;

      for (int xsi = 0; xsi < 4; xsi++) {
        float xs = float(xsi);
        u = uv + tree_pos + vec2(xs / xd * 0.5 - (T + 0.75) * 0.15, -0.7);
        u += noise(u * vec2(2.0, 1.0) + vec2(-u_time + xs * 0.05, 0.0)) * vec2(-0.25, 0.1) * smoothstep(0.5, -1.0, u.y + 0.7) * 0.75;

        t = u * vec2(xd, 1.0);
        h = hash12(floor(t.xx) + xs * 1.4);

        yd = 5.0 + h * 7.0;
        t.y *= yd;

        vec2 shh = t;
        lc = fract(t);
        h = hash12(t - lc);

        t = (t - lc) / vec2(xd, yd) + vec2(0.0, 0.7);

        m = (step(0.0, t.y) * step(length(t), 0.45)
            + step(t.y, 0.0) * step(-0.7 + sin((floor(u.x) + xs * 0.5) * 15.0) * 0.2, t.y))
            * step(abs(t.x), 0.5)
            * st(abs(lc.x - 0.5), 0.35, sm * xd * 0.5);

        lc += noise(shh * vec2(1.0, 3.0)) * vec2(0.3, 0.3);

        vec3 ff = hue((h + (sin(u_time * 0.2) * 0.5 + 0.5)) * 0.2).rgb - t.x;

        C = mix(C,
                vec4(mix(ff * 0.15, ff * 0.6 * (0.7 + xs * 0.2),
                    st(abs(lc.y - 0.5), 0.47, sm * yd) * st(abs(lc.x - 0.5), 0.2, sm * xd)), m),
                m);
      }

      O = mix(O, C, C.a * (1.0 - a));
    }

    gl_FragColor = O;
  }
`;export{t as default};
