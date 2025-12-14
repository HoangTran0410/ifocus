const o=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  vec3 palette(float d) {
    return mix(vec3(0.2, 0.7, 0.9), vec3(1.0, 0.0, 1.0), d);
  }

  vec2 rotate(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return p * mat2(c, s, -s, c);
  }

  float map(vec3 p, float t) {
    for (int i = 0; i < 8; ++i) {
      p.xz = rotate(p.xz, t);
      p.xy = rotate(p.xy, t * 1.89);
      p.xz = abs(p.xz);
      p.xz -= 0.5;
    }
    return dot(sign(p), p) / 5.0;
  }

  vec4 rm(vec3 ro, vec3 rd, float t, float brightness) {
    float rayT = 0.0;
    vec3 col = vec3(0.0);
    float d;
    for (float i = 0.0; i < 64.0; i++) {
      vec3 p = ro + rd * rayT;
      d = map(p, t) * 0.5;
      if (d < 0.02) {
        break;
      }
      if (d > 100.0) {
        break;
      }
      col += palette(length(p) * 0.1) / (400.0 * d) * brightness;
      rayT += d;
    }
    return vec4(col, 1.0 / (d * 100.0));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 uv = (fragCoord - (u_resolution.xy / 2.0)) / u_resolution.x;

    // Audio affects brightness and size only
    float brightness = 1.0 + u_bass * 2.0;
    float scale = 1.0 + u_bass * 0.3;  // Size scales up on beat
    float t = u_time * 0.2;  // Constant rotation speed

    // Apply scale to uv
    uv /= scale;

    vec3 ro = vec3(0.0, 0.0, -50.0);
    ro.xz = rotate(ro.xz, u_time * 0.2);
    vec3 cf = normalize(-ro);
    vec3 cs = normalize(cross(cf, vec3(0.0, 1.0, 0.0)));
    vec3 cu = normalize(cross(cf, cs));

    vec3 uuv = ro + cf * 3.0 + uv.x * cs + uv.y * cu;

    vec3 rd = normalize(uuv - ro);

    vec4 col = rm(ro, rd, t, brightness);

    // Calculate alpha based on brightness
    float alpha = clamp(length(col.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(col.rgb, alpha);
  }
`;export{o as default};
