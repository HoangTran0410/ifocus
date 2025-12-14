const o=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 p = fragCoord.xy / u_resolution.xy;

    // Audio affects zoom and brightness
    float zoom = 1.0 - u_bass * 0.3;  // Zoom in on beat (smaller = more zoomed)
    float brightness = 1.0 + u_bass * 0.3;

    // Apply zoom from center
    p = (p - 0.5) * zoom + 0.5;

    // Animate with slight beat shift
    p.x += 0.3 * u_time + u_bass * 0.1;

    // Get row index for random shift
    float row = floor(p.y * 7.0);
    float rowShift = sin(row * 2.3 + u_time * (0.3 + row * 0.1)) * 0.2;
    float px = p.x + rowShift;

    // Compute colors with row-specific shifts
    vec3 col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0), vec3(0.0, 0.33, 0.67));
    if (p.y > (1.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0), vec3(0.0, 0.10, 0.20));
    if (p.y > (2.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0), vec3(0.3, 0.20, 0.20));
    if (p.y > (3.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 0.5), vec3(0.8, 0.90, 0.30));
    if (p.y > (4.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 0.7, 0.4), vec3(0.0, 0.15, 0.20));
    if (p.y > (5.0 / 7.0)) col = pal(px, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25));
    if (p.y > (6.0 / 7.0)) col = pal(px, vec3(0.8, 0.5, 0.4), vec3(0.2, 0.4, 0.2), vec3(2.0, 1.0, 1.0), vec3(0.0, 0.25, 0.25));

    // Band
    float f = fract(p.y * 7.0);
    // Borders
    col *= smoothstep(0.49, 0.47, abs(f - 0.5));
    // Shadowing
    col *= 0.5 + 0.5 * sqrt(4.0 * f * (1.0 - f));

    // Apply brightness boost
    col *= brightness;

    gl_FragColor = vec4(col, 1.0);
  }
`;export{o as default};
