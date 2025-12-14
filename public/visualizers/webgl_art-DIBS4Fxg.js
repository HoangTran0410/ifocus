const o=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  // https://iquilezles.org/articles/palettes/
  vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;

    // Audio modulation
    float audioScale = 1.5 + u_bass * 0.5;
    float audioGlow = 1.0 + u_bass * 0.5;

    vec2 uv = (fragCoord * 2.0 - u_resolution.xy) / u_resolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      uv = fract(uv * audioScale) - 0.5;

      float d = length(uv) * exp(-length(uv0));

      vec3 col = palette(length(uv0) + fi * 0.4 + u_time * 0.4);

      d = sin(d * 8.0 + u_time) / 8.0;
      d = abs(d);

      d = pow(0.01 / d, 1.2);

      finalColor += col * d;
    }

    // Apply audio glow
    finalColor *= audioGlow;

    // Calculate alpha based on brightness
    float alpha = clamp(length(finalColor) * 0.5, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;export{o as default};
