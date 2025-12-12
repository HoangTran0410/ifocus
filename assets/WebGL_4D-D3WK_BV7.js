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

  // Polyfill for tanh
  float tanhf(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  vec3 tanh3(vec3 v) {
    return vec3(tanhf(v.x), tanhf(v.y), tanhf(v.z));
  }

  vec3 s1(vec3 v) {
    return sin(v) * 0.5 + 0.5;
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
    vec2 fragCoord = v_uv * u_resolution;
    vec2 R = u_resolution.xy;
    vec2 uv = (fragCoord * 2.0 - R) / R.y;

    // Audio affects glow and scale
    float brightness = 1.0 + u_bass * 2.0;
    float scale = 1.0 + u_bass * 0.3;

    vec3 ro = vec3(0.0, 0.0, -10.0);
    vec3 rd = normalize(vec3(uv / scale, 1.0));

    float z = 0.1;

    mat2 mx = rotate(u_time * 0.2);
    mat2 my = rotate(u_time * 0.2);

    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 80.0; i++) {
      vec3 p = ro + rd * z;

      float k = 20.0 / max(dot(p, p), 10.0);
      p *= k;

      p.xz = mx * p.xz;
      p.yz = my * p.yz;

      float d = sdBoxFrame(p, vec3(4.0), 0.5);

      // Turbulence
      vec3 q = p;
      q += cos(q.yzx + u_time * 1.0) * 0.2;
      q += cos(q.yzx * 2.0 - u_time * 1.0) * 0.4;
      q += cos(q.yzx * 4.0 + u_time * 2.0) * 0.6;
      float d1 = length(cos(q * 2.0)) - 0.1;
      d = min(d, d1);

      d = abs(d) * 0.3 + 0.01;

      col += s1(vec3(3.0, 2.0, 1.0) + i * 0.2 - u_time + dot(p, vec3(0.1))) / d;

      z += d;
    }

    col = tanh3(col / 900.0) * brightness;

    // Calculate alpha
    float alpha = clamp(length(col) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;export{a as default};
