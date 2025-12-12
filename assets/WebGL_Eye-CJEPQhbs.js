const t=`
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
  vec4 tanh4(vec4 v) {
    vec4 e2x = exp(2.0 * v);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  void main() {
    vec2 C = v_uv * u_resolution;
    vec2 r = u_resolution;

    float i = 0.0;
    float d;
    float z = fract(dot(C, sin(C))) - 0.5;

    vec4 o = vec4(0.0);
    vec4 p;
    vec4 O;

    float t = u_time;

    for (int iter = 0; iter < 77; iter++) {
      i += 1.0;

      // Convert 2D pixel to 3D ray direction
      p = vec4(z * normalize(vec3(C - 0.5 * r, r.y)), 0.1 * t);

      // Move through 3D space over time
      p.z += t * 0.2;

      // Save position for lighting calculations
      O = p;

      // Apply rotation matrices to create fractal patterns
      // Original: p.xy *= mat2(cos(2.+O.z+vec4(0,11,33,0)))
      // Audio affects rotation offset
      vec4 a1 = 2.0 + O.z + u_mid * 0.5 + vec4(0.0, 11.0, 33.0, 0.0);
      p.xy *= mat2(cos(a1.x), cos(a1.y), cos(a1.z), cos(a1.w));

      // The "happy accident" rotation
      // Original: p.xy *= mat2(cos(O+vec4(0,11,33,0)))
      vec4 a2 = O + vec4(0.0, 11.0, 33.0, 0.0);
      p.xy *= mat2(cos(a2.x), cos(a2.y), cos(a2.z), cos(a2.w));

      // Calculate color based on position and space distortion
      // Audio shifts the color palette
      O = (1.0 + sin(0.5 * O.z + length(p - O) + vec4(0.0, 4.0, 3.0, 6.0) + u_high * 2.0))
         / (0.5 + 2.0 * dot(O.xy, O.xy));

      // Domain repetition
      p = abs(fract(p) - 0.5);

      // Calculate distance to nearest surface
      // Bass affects cylinder size - expands on bass
      float cylinderSize = 0.125 + u_bass * 0.1;
      d = abs(min(length(p.xy) - cylinderSize, min(p.x, p.y) + 1e-3)) + 1e-3;

      // Add lighting contribution - beat makes glow more intense
      float glowBoost = 1.0 + u_beatIntensity * 2.0;
      o += O.w / d * O * glowBoost;

      // Step forward
      z += 0.6 * d;
    }

    // Tone mapping - beat affects zoom/intensity
    float toneDiv = 20000.0 - u_beatIntensity * 5000.0;
    O = tanh4(o / toneDiv);

    // Audio reactivity - brightness boost on beat
    O.rgb *= 1.0 + u_beatIntensity * 0.5 + u_bass * 0.3;

    // Alpha based on brightness
    float alpha = clamp(length(O.rgb) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(O.rgb, 1.0);
  }
`;export{t as default};
