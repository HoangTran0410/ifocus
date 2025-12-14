// "Accretion" by @XorDev
// https://x.com/XorDev/status/1936884244128661986

export default /*glsl*/ `
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

  vec4 tanh4(vec4 v) {
    return vec4(tanhf(v.x), tanhf(v.y), tanhf(v.z), tanhf(v.w));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;

    // Audio modulation - bass affects center black hole radius
    float centerRadius = 5.0 + u_bass * 3.0;
    float audioGlow = 1.0 + u_bass * 0.3;

    vec4 O = vec4(0.0);

    // Raymarch depth
    float z = 0.0;
    // Step distance
    float d;

    // Raymarch 20 steps
    for (int iter = 0; iter < 20; iter++) {
      float i = float(iter);

      // Sample point (from ray direction)
      vec3 p = z * normalize(vec3(fragCoord + fragCoord, 0.0) - u_resolution.xyx) + 0.1;

      // Polar coordinates and additional transformations
      // centerRadius controls the black hole size at center
      p = vec3(atan(p.y / 0.2, p.x) * 2.0, p.z / 3.0, length(p.xy) - centerRadius - z * 0.2);

      // Apply turbulence and refraction effect
      for (int j = 1; j <= 7; j++) {
        float dj = float(j);
        p += sin(p.yzx * dj + u_time + 0.3 * i) / dj;
      }

      // Distance to cylinder and waves with refraction
      d = length(vec4(0.4 * cos(p) - 0.4, p.z));
      z += d;

      // Coloring and brightness
      O += (1.0 + cos(p.x + i * 0.4 + z + vec4(6.0, 1.0, 2.0, 0.0))) / d;
    }

    // Apply audio glow
    O.rgb *= audioGlow;

    // Tanh tonemap
    O = tanh4(O * O / 400.0);

    // Calculate alpha based on brightness
    float alpha = clamp(length(O.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(O.rgb, alpha);
  }
`;
