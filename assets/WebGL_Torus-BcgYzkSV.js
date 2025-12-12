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

  // Polyfill for tanh
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

    // Audio affects scale and brightness
    float beatScale = 1.0 + u_bass * 0.3;
    float beatBrightness = 0.7 + u_bass * 2.0;

    float t = u_time;
    float d = 0.0;
    float w;
    float m = 1.0;
    vec3 p;
    vec3 k;

    // Rotation matrix
    float angle = sin(t / 2.0) * 0.785;
    mat2 R = mat2(cos(angle), cos(angle - 33.0), cos(angle - 11.0), cos(angle));

    vec4 O = vec4(0.0);

    for (int iter = 0; iter < 100; iter++) {
      float i = float(iter);

      // Ray position
      p = vec3((fragCoord + fragCoord - r.xy) / r.y * d / beatScale, d - 10.0);

      if (abs(p.x) > 6.0) break;

      // Apply rotation
      p.xz = R * p.xz;

      // Mirror for reflection
      if (p.y < -6.3) {
        p.y = -p.y - 9.0;
        m = 0.5;
      }

      k = p;

      // Turbulence loop - creates the stormy cloud effect
      p *= 0.5;
      float n = 0.01;
      for (int j = 0; j < 5; j++) {
        if (n >= 0.2) break;
        vec3 sinVal = sin(0.02 * p.z + 0.03 * p.y + 2.0 * t + 0.3 * p / n);
        float dotVal = dot(sinVal, vec3(n));
        p.yz += cos(p.xy * 0.01) - abs(dotVal);
        n += n;  // Double n each iteration
      }

      // Distance calculations
      float s = length(k.xy) - 4.0;
      float shape1 = sin(length(ceil(k * 4.0).z + k));
      float shape2 = sin(length(p) - 1.0);
      float blend = smoothstep(5.0, 5.5, p.y);
      float mixed = mix(shape1, shape2, blend);
      float torusDist = sqrt(s * s + k.z * k.z) - 1.5;

      w = 0.01 + 0.07 * abs(max(mixed, torusDist) - i / 150.0);
      d += w;

      // Accumulate color
      O += max(1.3 / w * sin(vec4(1.0, 2.0, 3.0, 1.0) + i * 0.5), -length(k * k));
    }

    // Apply audio brightness
    O *= beatBrightness;

    // Tanh tonemapping
    O = tanh4(O * O / 1000000.0) * m;

    // Calculate alpha
    float alpha = clamp(length(O.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(O.rgb, alpha);
  }
`;export{t as default};
