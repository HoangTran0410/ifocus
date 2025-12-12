// Sphere - Raymarched sphere with procedural patterns
// Converted from Shadertoy
// https://www.shadertoy.com/view/tfdBzr

export default /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  #define PI 3.141596
  #define s1(v) (sin(v) * 0.5 + 0.5)
  const float EPSILON = 1e-3;

  // Polyfill for tanh (not available in WebGL 1.0)
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

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 R = u_resolution.xy;
    vec2 uv = (fragCoord * 2.0 - R) / R.y;

    // Constant rotation speed
    mat2 mx = rotate(u_time * 0.3);
    mat2 my = rotate(u_time * 0.3);

    // Beat affects scale via camera distance (zoom in on beat)
    float camDist = 10.0 - u_bass * 2.0;
    vec3 ro = vec3(0.0, 0.0, -camDist);
    vec3 rd = normalize(vec3(uv, 1.0));

    float zMax = 50.0;
    float z = 0.1;

    vec3 col = vec3(0.0);
    vec3 C = vec3(3.0, 2.0, 1.0);

    for (float i = 0.0; i < 100.0; i++) {
      vec3 p = ro + rd * z;
      vec3 p0 = p;

      p.xz *= mx;
      p.yz *= my;

      float r = length(p);
      float the = acos(p.y / r);
      float phi = atan(p.z, p.x);
      vec3 q = vec3(the, phi, r);

      q.z -= u_time;

      q.xy = cos(q.xy * 6.0);
      q.xy += asin(sin(q.yx + u_time * 0.4));
      q.xy += asin(sin(q.yx * 2.0 + u_time * 0.4)) * 0.5;

      q.z = mod(q.z, 2.0) - 1.0;

      float radius = 0.0;
      float d = length(q.xz - vec2(0.0, radius)) - 0.2;
      {
        float d1 = length(q.yz - vec2(0.0, radius)) - 0.2;
        d = min(d, d1);
      }
      {
        float d1 = length(q - vec3(0.0, 0.0, radius)) - 0.4;
        d = min(d, d1);
      }
      {
        // Inner sphere cutoff
        float d1 = length(p0 - ro) - 3.0;
        d = max(d, -d1);
      }

      d = abs(d) * 0.2 + 0.01;

      col += s1(C + r) / d;

      if (d < EPSILON || z > zMax) break;
      z += d;
    }

    // Beat affects glow brightness
    float glow = 1.0 + u_bass * 1.5;
    col = tanh3(col / 2e3) * glow;

    // Calculate alpha for transparency
    float alpha = clamp(length(col) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;
