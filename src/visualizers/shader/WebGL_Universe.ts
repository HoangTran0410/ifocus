// The Universe Within - by Martijn Steinrucken aka BigWings 2018
// https://www.shadertoy.com/view/lscczl
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

export default /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  #define S(a, b, t) smoothstep(a, b, t)
  #define NUM_LAYERS 4.

  float N21(vec2 p) {
    vec3 a = fract(vec3(p.xyx) * vec3(213.897, 653.453, 253.098));
    a += dot(a, a.yzx + 79.76);
    return fract((a.x + a.y) * a.z);
  }

  vec2 GetPos(vec2 id, vec2 offs, float t) {
    float n = N21(id + offs);
    float n1 = fract(n * 10.);
    float n2 = fract(n * 100.);
    float a = t + n;
    return offs + vec2(sin(a * n1), cos(a * n2)) * 0.4;
  }

  float df_line(in vec2 a, in vec2 b, in vec2 p) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
    return length(pa - ba * h);
  }

  float line(vec2 a, vec2 b, vec2 uv) {
    float r1 = 0.04;
    float r2 = 0.01;

    float d = df_line(a, b, uv);
    float d2 = length(a - b);
    float fade = S(1.5, 0.5, d2);

    fade += S(0.05, 0.02, abs(d2 - 0.75));
    return S(r1, r2, d) * fade;
  }

  float NetLayer(vec2 st, float n, float t, float audioMod) {
    vec2 id = floor(st) + n;
    st = fract(st) - 0.5;

    // Manually unroll the 3x3 grid positions (WebGL 1.0 doesn't support dynamic indexing)
    vec2 p0 = GetPos(id, vec2(-1., -1.), t);
    vec2 p1 = GetPos(id, vec2(0., -1.), t);
    vec2 p2 = GetPos(id, vec2(1., -1.), t);
    vec2 p3 = GetPos(id, vec2(-1., 0.), t);
    vec2 p4 = GetPos(id, vec2(0., 0.), t);  // Center
    vec2 p5 = GetPos(id, vec2(1., 0.), t);
    vec2 p6 = GetPos(id, vec2(-1., 1.), t);
    vec2 p7 = GetPos(id, vec2(0., 1.), t);
    vec2 p8 = GetPos(id, vec2(1., 1.), t);

    float m = 0.;
    float sparkle = 0.;

    // Lines from center to all points
    m += line(p4, p0, st);
    m += line(p4, p1, st);
    m += line(p4, p2, st);
    m += line(p4, p3, st);
    m += line(p4, p4, st);
    m += line(p4, p5, st);
    m += line(p4, p6, st);
    m += line(p4, p7, st);
    m += line(p4, p8, st);

    // Sparkles for each point
    float d0 = length(st - p0);
    float d1 = length(st - p1);
    float d2 = length(st - p2);
    float d3 = length(st - p3);
    float d4 = length(st - p4);
    float d5 = length(st - p5);
    float d6 = length(st - p6);
    float d7 = length(st - p7);
    float d8 = length(st - p8);

    // Audio-reactive sparkle calculation for each point - glow brighter on beat
    float sparkleIntensity = 1.0 + audioMod * 4.0;

    float s0 = (0.005 / (d0 * d0)) * sparkleIntensity * S(1., 0.7, d0);
    float s1 = (0.005 / (d1 * d1)) * sparkleIntensity * S(1., 0.7, d1);
    float s2 = (0.005 / (d2 * d2)) * sparkleIntensity * S(1., 0.7, d2);
    float s3 = (0.005 / (d3 * d3)) * sparkleIntensity * S(1., 0.7, d3);
    float s4 = (0.005 / (d4 * d4)) * sparkleIntensity * S(1., 0.7, d4);
    float s5 = (0.005 / (d5 * d5)) * sparkleIntensity * S(1., 0.7, d5);
    float s6 = (0.005 / (d6 * d6)) * sparkleIntensity * S(1., 0.7, d6);
    float s7 = (0.005 / (d7 * d7)) * sparkleIntensity * S(1., 0.7, d7);
    float s8 = (0.005 / (d8 * d8)) * sparkleIntensity * S(1., 0.7, d8);

    // Pulse effect for each point
    float pulse0 = pow(sin((fract(p0.x) + fract(p0.y) + t) * 5.) * 0.4 + 0.6, 20.);
    float pulse1 = pow(sin((fract(p1.x) + fract(p1.y) + t) * 5.) * 0.4 + 0.6, 20.);
    float pulse2 = pow(sin((fract(p2.x) + fract(p2.y) + t) * 5.) * 0.4 + 0.6, 20.);
    float pulse3 = pow(sin((fract(p3.x) + fract(p3.y) + t) * 5.) * 0.4 + 0.6, 20.);
    float pulse4 = pow(sin((fract(p4.x) + fract(p4.y) + t) * 5.) * 0.4 + 0.6, 20.);
    float pulse5 = pow(sin((fract(p5.x) + fract(p5.y) + t) * 5.) * 0.4 + 0.6, 20.);
    float pulse6 = pow(sin((fract(p6.x) + fract(p6.y) + t) * 5.) * 0.4 + 0.6, 20.);
    float pulse7 = pow(sin((fract(p7.x) + fract(p7.y) + t) * 5.) * 0.4 + 0.6, 20.);
    float pulse8 = pow(sin((fract(p8.x) + fract(p8.y) + t) * 5.) * 0.4 + 0.6, 20.);

    sparkle = s0 * pulse0 + s1 * pulse1 + s2 * pulse2 +
              s3 * pulse3 + s4 * pulse4 + s5 * pulse5 +
              s6 * pulse6 + s7 * pulse7 + s8 * pulse8;

    // Grid lines
    m += line(p1, p3, st);
    m += line(p1, p5, st);
    m += line(p7, p5, st);
    m += line(p7, p3, st);

    float sPhase = (sin(t + n) + sin(t * 0.1)) * 0.25 + 0.5;
    sPhase += pow(sin(t * 0.1) * 0.5 + 0.5, 50.) * 5.;
    m += sparkle * sPhase;

    return m;
  }

  void main() {
    vec2 uv = (v_uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

    // Auto-animate mouse drift
    float mx = u_time * 0.03;
    float my = 0.5 + sin(u_time * 0.03) * 0.15;
    vec2 M = vec2(mx, my) * 0.5;

    float t = u_time * 0.05;  // Moderate rotation

    float s = sin(t);
    float c = cos(t);
    mat2 rot = mat2(c, -s, s, c);
    vec2 st = uv * rot;
    M *= rot * 2.;

    // Audio modulation
    float audioMod = u_bass * 0.5 + u_mid * 0.3 + u_high * 0.2;

    float m = 0.;
    for(float i = 0.; i < 1.; i += 1. / NUM_LAYERS) {
      float z = fract(t * 0.5 + i);  // Layer movement
      float size = mix(15., 1., z);
      float fade = S(0., 0.6, z) * S(1., 0.8, z);

      m += fade * NetLayer(st * size - M * z, i, u_time * 0.5, audioMod);
    }

    // Audio-reactive glow from bottom
    float glow = -uv.y * u_bass * 2.0;

    // Color shifting over time with audio influence
    vec3 baseCol = vec3(s, cos(t * 0.4), -sin(t * 0.24)) * 0.4 + 0.6;

    // Make colors more vibrant on beats
    baseCol = mix(baseCol, vec3(1.0, 0.5, 0.8), u_bass * 0.3);

    vec3 col = baseCol * m;
    col += baseCol * glow;

    // Vignette effect
    col *= 1. - dot(uv, uv);

    // Glow brighter on beat
    col *= 1.0 + u_bass * 1.5;

    // Calculate alpha based on brightness
    float alpha = clamp(length(col) * 1.5, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;
