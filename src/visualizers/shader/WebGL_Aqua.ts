// Gemmarium by Jaenam
// License: Creative Commons (CC BY-NC-SA 4.0)
// https://x.com/Jaenam97/status/1994387530024718563
// https://www.shadertoy.com/view/WftcWs

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

  // Polyfill for tanh (not available in WebGL 1.0)
  float tanhf(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  vec4 tanh4(vec4 v) {
    return vec4(tanhf(v.x), tanhf(v.y), tanhf(v.z), tanhf(v.w));
  }

  void main() {
    vec2 I = v_uv * u_resolution;
    vec3 r = vec3(u_resolution, 1.0);

    // Zoom in on beat
    float zoom = 1.0 - u_bass * 0.3;

    float t = u_time;
    float m = 1.0;
    float d = 0.0;

    // Rotation matrix by pi/4
    float angle = sin(t / 2.0) * 0.785;
    mat2 R = mat2(cos(angle), cos(angle - 33.0), cos(angle - 11.0), cos(angle));

    vec4 O = vec4(0.0);

    for (float i = 0.0; i < 100.0; i++) {
      // Raymarch sample point with zoom
      vec3 p = vec3((I + I - r.xy) / r.y * zoom, d - 10.0);

      // Orb position with audio influence on movement
      float orbX = 0.2 + sin(t) / 4.0;
      float orbY = 0.3 + sin(t + t) / 6.0;
      float l = length(p.xy - vec2(orbX, orbY));

      p.xy *= d;

      // Performance optimization
      if (abs(p.x) > 6.0) break;

      // Rotate about y-axis
      p.xz *= R;

      // Mirrored floor hack
      if (p.y < -6.3) {
        p.y = -p.y - 9.0;
        m = 0.5;
      }

      // Save sample point
      vec3 k = p;
      // Scale
      p *= 0.5;

      // Turbulence (unrolled - WebGL 1.0 doesn't allow n += n)
      p.y += 0.9 + abs(dot(sin(p.x + 2.0 * t + p / 0.01), vec3(0.2))) * 0.01;
      p.y += 0.9 + abs(dot(sin(p.x + 2.0 * t + p / 0.02), vec3(0.2))) * 0.02;
      p.y += 0.9 + abs(dot(sin(p.x + 2.0 * t + p / 0.04), vec3(0.2))) * 0.04;
      p.y += 0.9 + abs(dot(sin(p.x + 2.0 * t + p / 0.08), vec3(0.2))) * 0.08;
      p.y += 0.9 + abs(dot(sin(p.x + 2.0 * t + p / 0.16), vec3(0.2))) * 0.16;
      p.y += 0.9 + abs(dot(sin(p.x + 2.0 * t + p / 0.32), vec3(0.2))) * 0.32;
      p.y += 0.9 + abs(dot(sin(p.x + 2.0 * t + p / 0.64), vec3(0.2))) * 0.64;

      // SDF mix
      float sd = mix(
        // Bottom half texture
        sin(length(ceil(k * 8.0).x + k)),
        // Upper half water/clouds noise + orb
        mix(sin(length(p) - 0.2), l, 0.3 - l),
        // Blend
        smoothstep(5.5, 6.0, p.y)
      );

      // Step distance to object
      float s = 0.012 + 0.08 * abs(max(sd, length(k) - 5.0) - i / 150.0);
      d += s;

      // Color accumulation with iridescence
      O += max(sin(vec4(1.0, 2.0, 3.0, 1.0) + i * 0.5) * 1.5 / s + vec4(1.0, 2.0, 3.0, 1.0) * 0.04 / l, -length(k * k));
    }

    // Beat affects glow brightness
    float glow = 1.0 + u_bass * 1.5;

    // Tanh tonemap and brightness multiplier
    O = tanh4(O * O / 8e5) * m * glow;

    // Calculate alpha
    float alpha = clamp(length(O.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(O.rgb, alpha);
  }
`;
