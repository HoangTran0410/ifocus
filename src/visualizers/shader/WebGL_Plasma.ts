// Plasma - WebGL version of organic flowing interference patterns
// GPU-accelerated for better performance

export default /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  // HSL to RGB conversion
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    vec2 uv = v_uv;
    float px = uv.x;
    float py = uv.y;

    float t = u_time;

    // Multiple sine waves with different frequencies create plasma interference
    float v1 = sin(px * 10.0 + t + u_bass * 3.0);
    float v2 = sin((py * 10.0 + t) * 0.7 + u_mid * 2.0);
    float v3 = sin((px + py) * 5.0 + t * 0.5);
    float v4 = sin(sqrt(pow(px - 0.5, 2.0) + pow(py - 0.5, 2.0)) * 12.0 + t + u_high * 4.0);

    // Combine waves
    float value = (v1 + v2 + v3 + v4) / 4.0;

    // Map to color - shift hue with audio
    float hueShift = u_intensity * 0.17 + u_bass * 0.08;
    float hue = (value + 1.0) * 0.25 + 0.56 + hueShift; // Purple/blue/pink range (200-380 deg -> 0.56-1.05)
    float saturation = 0.7 + u_intensity * 0.3;
    float lightness = 0.4 + (value + 1.0) * 0.2 + u_bass * 0.15;

    vec3 color = hsl2rgb(vec3(mod(hue, 1.0), saturation, lightness));

    // Add glow overlay on bass hits
    if (u_bass > 0.3) {
      float dist = length(uv - 0.5);
      float glow = (1.0 - smoothstep(0.0, 0.7, dist)) * u_bass * 0.4;
      color += vec3(1.0, 0.4, 1.0) * glow;
    }

    // Subtle vignette
    float vignette = 1.0 - smoothstep(0.3, 1.0, length((uv - 0.5) * 1.4));
    color *= 0.7 + vignette * 0.3;

    // Glow brighter on beat
    color *= 1.0 + u_bass * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`;
