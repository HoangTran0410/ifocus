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

  const int iters = 150;

  int fractal(vec2 p, vec2 point) {
    vec2 so = (-1.0 + 2.0 * point) * 0.4;
    vec2 seed = vec2(0.098386255 + so.x, 0.6387662 + so.y);

    for (int i = 0; i < iters; i++) {
      if (length(p) > 2.0) {
        return i;
      }
      vec2 r = p;
      p = vec2(p.x * p.x - p.y * p.y, 2.0 * p.x * p.y);
      p = vec2(p.x * r.x - p.y * r.y + seed.x, r.x * p.y + p.x * r.y + seed.y);
    }

    return 0;
  }

  vec3 color(int i) {
    float f = float(i) / float(iters) * 2.0;
    f = f * f * 2.0;
    return vec3(sin(f * 2.0), sin(f * 3.0), abs(sin(f * 7.0)));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;

    // Scale effect on beat - zoom in slightly
    float scale = 3.0 - u_bass * 0.6;

    vec2 position = scale * (-0.5 + fragCoord.xy / u_resolution.xy);
    position.x *= u_resolution.x / u_resolution.y;

    // Audio-reactive pulse
    float pulse = 0.5 + u_bass * 0.5;

    // Time-based animation
    float timeSpeed = u_time / 4.0;

    // Single fractal
    vec3 c = color(fractal(position, vec2(0.5 + sin(timeSpeed) / 2.0, 0.2 + pulse * 0.7)));

    // Glow effect on beat
    float glow = 1.0 + u_beatIntensity * 0.8;
    c *= glow;

    // Calculate alpha based on color intensity for transparent background
    vec3 finalColor = clamp(c, 0.0, 1.0);
    float alpha = clamp(length(finalColor) * 0.6, 0.0, 1.0);

    // Make darker areas more transparent
    alpha = smoothstep(0.1, 0.5, alpha);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;export{o as default};
