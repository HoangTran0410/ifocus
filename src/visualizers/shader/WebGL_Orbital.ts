// Credits: Danilo Guanabara
// http://www.pouet.net/prod.php?which=57245

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

  void main() {
    vec2 r = u_resolution.xy;
    vec2 fragCoord = v_uv * r;

    // Audio affects brightness and wave intensity
    float brightness = 1.0 + u_bass * 1.5;
    float waveIntensity = 1.0 + u_bass * 0.5;

    vec3 c;
    float l;
    float z = u_time;

    for (int i = 0; i < 3; i++) {
      vec2 uv;
      vec2 p = fragCoord.xy / r;
      uv = p;
      p -= 0.5;
      p.x *= r.x / r.y;
      z += 0.07;
      l = length(p);
      uv += p / l * (sin(z) + 1.0) * abs(sin(l * 9.0 * waveIntensity - z - z));
      c[i] = 0.01 / length(mod(uv, 1.0) - 0.5);
    }

    vec3 color = c / l * brightness;

    // Calculate alpha based on brightness
    float alpha = clamp(length(color) * 0.5, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;
