/*
    "Rocaille" by @XorDev

    This time I added multiple layers of turbulence
    with time and color offsets. Loved the shapes.

    -1 Thanks to GregRostami
    Adapted for ifocus by Antigravity

    https://www.shadertoy.com/view/WXyczK
*/

export default /*glsl*/ `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  vec4 tanh_vec4(vec4 x) {
    vec4 exp2x = exp(2.0 * x);
    return (exp2x - 1.0) / (exp2x + 1.0);
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;

    // Vector for scaling and turbulence
    vec2 v = u_resolution.xy;
    // Centered and scaled coordinates
    vec2 p = (fragCoord + fragCoord - v) / v.y / .3;

    // Iterators for layers and turbulence frequency
    float i = 0.0;
    float f = 0.0;
    vec4 O = vec4(0.0);

    // Audio modulation
    float audioScale = 1.0 + u_bass * 0.2;
    p *= audioScale;

    for(int j = 0; j < 9; j++) {
        i += 1.0;
        // Add coloring, attenuating with turbulent coordinates
        O += (cos(i + vec4(0,1,2,3)) + 1.0) / 6.0 / length(v);

        // Turbulence loop
        v = p;
        f = 0.0;
        for(int k = 0; k < 9; k++) {
            f += 1.0;
            v += sin(v.yx * f + i + u_time) / f;
        }
    }

    // Tanh tonemapping
    O = tanh_vec4(O * O);

    // Calculate alpha based on brightness
    float alpha = clamp(length(O.rgb) * 1.5, 0.0, 1.0);

    gl_FragColor = vec4(O.rgb, alpha);
  }
`;
