// Rainbow - Audio-reactive rainbow spectrum visualizer
// GPU-accelerated WebGL visualizer
// https://www.shadertoy.com/view/ldX3D8

export default /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;
  uniform sampler2D u_audioData;

  float bump(float x) {
    return abs(x) > 1.0 ? 0.0 : 1.0 - x * x;
  }

  void main() {
    vec2 uv = v_uv;

    float c = 3.0;
    vec3 color = vec3(1.0);

    // Create rainbow gradient across X axis
    color.r = bump(c * (uv.x - 0.75));
    color.g = bump(c * (uv.x - 0.5));
    color.b = bump(c * (uv.x - 0.25));

    // Create horizontal line in the center
    float line = abs(0.01 / abs(0.5 - uv.y));
    uv.y = abs(uv.y - 0.5);

    // Sample audio spectrum texture (like Shadertoy's iChannel0)
    // abs(0.5-uv.x) means: center samples bass (0), edges sample higher frequencies
    vec4 soundWave = texture2D(u_audioData, vec2(abs(0.5 - uv.x) + 0.005, uv.y));

    // Combine line with rainbow colors and audio spectrum
    // Lower power = bigger bumps, higher multiplier = more visible
    color *= line * (1.0 - 2.0 * abs(0.5 - uv.x) + pow(soundWave.r, 3.0) * 50.0);

    // Alpha based on brightness for transparent background
    float alpha = max(max(color.r, color.g), color.b);
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;
