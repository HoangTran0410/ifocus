const a=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  #define PI 3.14159265359

  // Polyfill for tanh (not available in WebGL 1.0)
  float tanhf(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  vec3 tanh3(vec3 v) {
    return vec3(tanhf(v.x), tanhf(v.y), tanhf(v.z));
  }

  // Rotation matrix for XZ
  mat2 rotMat(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  // Hash function for pseudo-random values
  float hash(vec3 g) {
    return fract(sin(dot(g, vec3(127.1, 311.7, 74.7))) * 43758.5);
  }

  float hash2(vec3 g) {
    return fract(sin(dot(g, vec3(43.7, 78.2, 123.4))) * 127.1);
  }

  // Render one color channel of the dice
  float renderChannel(vec2 I, vec3 r, mat2 Rx, mat2 Ry, float Z) {
    float O = 0.0;

    for (float i = 0.0; i < 80.0; i++) {
      float d = 0.0;
      vec3 p = vec3((I + I - r.xy) / r.y * d, d - 8.0);

      // Accumulator for this ray march step
      float stepAccum = 0.0;

      for (float j = 0.0; j < 80.0; j++) {
        p = vec3((I + I - r.xy) / r.y * d, d - 8.0);

        if (abs(p.x) > 5.0) break;

        // Apply rotation based on time
        p.xz = p.xz * Rx;
        p.xy = p.xy * Ry;

        // Grid coordinates for dot pattern
        vec3 g = floor(p * 6.0);
        vec3 f = fract(p * 6.0) - 0.5;

        // Dot pattern based on hash
        float h = step(length(f), hash(g) * 0.3 + 0.1);

        // Random angle for color variation
        float a = hash2(g) * 6.28;

        // Fractal edge calculation
        float e = 1.0;
        float sc = 2.0;
        for (int k = 0; k < 3; k++) {
          vec3 gAbs = abs(mod(p * sc, 2.0) - 1.0);
          e = min(e, min(max(gAbs.x, gAbs.y), min(max(gAbs.y, gAbs.z), max(gAbs.x, gAbs.z))) / sc);
          sc *= 0.6;
        }

        // Dice shape - rounded cube with beveled edges
        float c = max(max(max(abs(p.x), abs(p.y)), abs(p.z)), dot(abs(p), vec3(0.577)) * 0.9) - 3.0;

        // Distance and step calculation
        float s = 0.01 + 0.15 * abs(max(max(c, e - 0.1), length(sin(c)) - 0.3) + Z * 0.02 - j / 130.0);
        d += s;

        float sf = smoothstep(0.02, 0.01, s);

        // Accumulate color with holographic effect
        stepAccum += 1.6 / s * (0.5 + 0.5 * sin(j * 0.3 + Z * 5.0) + sf * 4.0 * h * sin(a + j * 0.4 + Z * 5.0));

        if (j >= 79.0) break;
      }

      O += stepAccum;
      break;
    }

    return O;
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec3 r = vec3(u_resolution.xy, 1.0);

    // Scale on beat - zoom in when bass hits
    float beatScale = 1.0 + u_bass * 0.25;
    fragCoord = (fragCoord - r.xy * 0.5) / beatScale + r.xy * 0.5;

    // Automatic rotation
    vec2 m = vec2(u_time / 2.0);

    // Create rotation matrices
    mat2 Rx = rotMat(m.x);
    mat2 Ry = rotMat(m.y);

    // Render each color channel with offset for holographic effect
    float red = renderChannel(fragCoord, r, Rx, Ry, -1.0);
    float green = renderChannel(fragCoord, r, Rx, Ry, 0.0);
    float blue = renderChannel(fragCoord, r, Rx, Ry, 1.0);

    vec4 O = vec4(red, green, blue, 1.0);

    // Tone mapping with tanh for HDR compression
    vec3 tonemapped = tanh3(O.rgb * O.rgb / 1e7);

    // Add intensity-based brightness boost
    tonemapped *= 1.0 + u_intensity * 0.3;

    // Beat pulse effect - bass makes it shine brighter
    tonemapped *= 1.0 + u_bass * 2.0;

    // Calculate alpha based on brightness for transparent background
    float alpha = clamp(length(tonemapped) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(tonemapped, alpha);
  }
`;export{a as default};
