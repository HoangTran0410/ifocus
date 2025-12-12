const o=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  const float PI = 3.141592653589793;
  const float TAU = 2.0 * PI;

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c);
  }

  float tiledHash21(vec2 p, float period) {
    return hash21(mod(p, period));
  }

  float tiledValueNoise(vec2 p, float period) {
    p *= period;
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = tiledHash21(i, period);
    float b = tiledHash21(i + vec2(1.0, 0.0), period);
    float c = tiledHash21(i + vec2(0.0, 1.0), period);
    float d = tiledHash21(i + vec2(1.0, 1.0), period);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float ridgedFbm1(vec2 uv, float period) {
    float amp = 1.0;
    float sum = 0.0;
    float norm = 0.0;
    for (int i = 1; i < 5; i++) {
      sum += abs(2.0 * tiledValueNoise(uv, period) - 1.0) * amp;
      norm += amp;
      amp *= 0.707;
      uv = uv * 2.0;
    }
    return sum / norm;
  }

  float adaptedNoise(vec2 uv, float time) {
    float r = 4.0 * atan(uv.y, uv.x) / TAU;
    vec2 p = vec2(r, length(uv));
    p.y += time * 0.5;
    return ridgedFbm1(p, 8.0);
  }

  float dualNoise(vec2 p, float time) {
    vec2 p2 = p * 0.5;
    vec2 q = vec2(
      adaptedNoise(1.2 * p2, time),
      adaptedNoise(1.4 * p2 + vec2(20.0), time)) - 0.5;
    return smoothstep(0.0, 1.2, adaptedNoise((p + 0.1 * q) * rotate2D(mix(0.1, 1.1, smoothstep(0.0, 1.7, length(p)))) * rotate2D(-0.2 * time), time));
  }

  float circle(vec2 p, float time) {
    return abs(mod(log(length(p)), 7.0) - 5.0) * 3.0 + 0.5;
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    float time = u_time * 1.9;

    vec2 p = 3.5 * (fragCoord - 0.5 * u_resolution) / u_resolution.y;

    // Zoom in on beat
    p *= 1.0 - u_bass * 0.2;

    float noise = dualNoise(p, time);
    noise *= pow(abs(circle(vec2(p.x / (5.0 + sin(0.9 * time)), p.y / (7.0 + 2.0 * cos(0.9 * time))), time)), 3.0);

    vec3 color = vec3(0.7, 0.3, 0.1) / clamp(noise, 1e-3, 1e3);
    color = mix(color, vec3(0.0), pow(smoothstep(0.0, 4.1, length(p * vec2(1.6, 1.0)) - 0.5), 0.7));

    // Glow brighter on beat
    color *= 1.0 + u_bass * 1.5;

    float alpha = clamp(length(color) * 0.5, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;export{o as default};
