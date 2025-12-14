const o=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  // Polyfill for tanh (not available in WebGL 1.0)
  float tanhf(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  // Clamped tanh to prevent black artifacts (from Common shader)
  vec2 stanh(vec2 a) {
    a = clamp(a, -40.0, 40.0);
    return vec2(tanhf(a.x), tanhf(a.y));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;

    // Audio modulation for color reactivity (not speed)
    float audioMod = 1.0 + u_bass * 0.5; // + u_mid * 0.2 + u_high * 0.1;

    vec2 v = u_resolution.xy;
    vec2 u = 0.2 * (fragCoord + fragCoord - v) / v.y;

    vec4 z = vec4(1.0, 2.0, 3.0, 0.0);
    vec4 o = z;

    float a = 0.5;
    float t = u_time;  // Constant speed, no beat influence

    for (int i = 0; i < 19; i++) {
      float fi = float(i);

      // Accumulate color
      o += (1.0 + cos(z + t))
         / length((1.0 + fi * dot(v, v))
                * sin(1.5 * u / (0.5 - dot(u, u)) - 9.0 * u.yx + t));

      t += 1.0;
      a += 0.03;
      v = cos(t - 7.0 * u * pow(a, fi)) - 5.0 * u;

      // Apply rotation matrix: mat2(cos(i + 0.02*t - vec4(0,11,33,0)))
      float angle1 = fi + 0.02 * t;
      mat2 rotMat = mat2(
        cos(angle1),           cos(angle1 - 11.0),
        cos(angle1 - 33.0),    cos(angle1)
      );
      u *= rotMat;

      // Use stanh (clamped tanh) to prevent black artifacts
      u += stanh(40.0 * dot(u, u) * cos(100.0 * u.yx + t)) / 200.0
         + 0.2 * a * u
         + cos(4.0 / exp(dot(o, o) / 100.0) + t) / 300.0;
    }

    o = 25.6 / (min(o, 13.0) + 164.0 / o)
      - dot(u, u) / 250.0;

    // Beat affects glow/brightness, audio affects color intensity
    o.rgb *= audioMod;// * beatGlow;

    // Calculate alpha based on brightness
    float alpha = clamp(length(o.rgb) * 1.5, 0.0, 1.0);

    gl_FragColor = vec4(o.rgb, alpha);
  }
`;export{o as default};
