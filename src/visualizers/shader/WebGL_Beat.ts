// Beat - Raymarched 3D box frame with audio-reactive glow
// GPU-accelerated WebGL visualizer
// Based on Shadertoy effect

export default /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  #define PI 3.1415926
  #define S smoothstep
  #define s1(v) (sin(v) * 0.5 + 0.5)

  // Polyfill for tanh
  float tanhf(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  vec3 tanh3(vec3 v) {
    return vec3(tanhf(v.x), tanhf(v.y), tanhf(v.z));
  }

  mat2 rotate(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  float sdBoxFrame(vec3 p, vec3 b, float e) {
    p = abs(p) - b;
    vec3 q = abs(p + e) - e;
    return min(min(
        length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
        length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
        length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
  }

  void main() {
    vec2 uv = v_uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    // Use pre-calculated audio uniforms instead of texture sampling
    float freq = u_bass * 0.6 + u_mid * 0.4;

    vec3 ro = vec3(0.0, 0.0, -10.0);
    vec3 rd = normalize(vec3(uv, 1.0));

    float z = 0.1;
    float t = u_time;

    // Audio affects rotation speed (slowed down)
    float ang = mix(t * 0.3, t * 0.3 + freq * 2.0, 0.6);
    mat2 mx = rotate(ang);
    mat2 my = rotate(ang);

    vec3 col = vec3(0.0);

    for (int i = 0; i < 80; i++) {
      vec3 p = ro + rd * z;

      p.xz *= mx;
      p.yz *= my;

      // Audio affects scale
      p /= (0.8 + freq * 0.3);

      float d = sdBoxFrame(p, vec3(4.0), 0.5);
      d = abs(d) * 0.3 + 0.01;

      // Glow based on frequency
      float range = 4.0 * freq + 0.0;
      float glow = S(range, 0.0, abs(p.y)) + S(range, 0.0, abs(p.x)) + S(range, 0.0, abs(p.z));
      glow = glow * 50.0 + 1.0;

      col += s1(vec3(3.0, 2.0, 1.0) + freq * 1.0 + dot(abs(p), vec3(0.2))) * glow / d;

      z += d;
    }

    col = tanh3(col / 500.0);

    // Beat boost
    col *= 1.0 + u_bass * 0.5;

    // Alpha based on brightness
    float alpha = clamp(length(col) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;
