// Liquid effect - Original by localthunk (Balatro)
// Based on: https://www.shadertoy.com/view/XXtBRr

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

  #define SPIN_ROTATION -2.0
  #define SPIN_SPEED 7.0
  #define OFFSET vec2(0.0)
  #define COLOUR_1 vec4(0.871, 0.267, 0.231, 1.0)
  #define COLOUR_2 vec4(0.0, 0.42, 0.706, 1.0)
  #define COLOUR_3 vec4(0.086, 0.137, 0.145, 1.0)
  #define CONTRAST 3.5
  #define LIGHTING 0.4
  #define SPIN_AMOUNT 0.25
  #define PIXEL_FILTER 745.0
  #define SPIN_EASE 1.0
  #define PI 3.14159265359

  vec4 effect(vec2 screenSize, vec2 screen_coords) {
    float pixel_size = length(screenSize.xy) / PIXEL_FILTER;
    vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy) - OFFSET;
    float uv_len = length(uv);

    // Fixed spin amount (no audio)
    float spinAmount = SPIN_AMOUNT;

    float speed = (SPIN_ROTATION * SPIN_EASE * 0.2);
    speed += 302.2;
    float new_pixel_angle = atan(uv.y, uv.x) + speed - SPIN_EASE * 20.0 * (1.0 * spinAmount * uv_len + (1.0 - 1.0 * spinAmount));
    vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
    uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);

    uv *= 30.0;

    // Constant speed (no beat effect on time)
    float animSpeed = u_time * SPIN_SPEED * 0.3 + u_beatIntensity * 7.0;

    vec2 uv2 = vec2(uv.x + uv.y);

    for (int i = 0; i < 5; i++) {
      uv2 += sin(max(uv.x, uv.y)) + uv;
      uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + animSpeed * 0.131121), sin(uv2.x - 0.113 * animSpeed));
      uv -= 1.0 * cos(uv.x + uv.y) - 1.0 * sin(uv.x * 0.711 - uv.y);
    }

    // Fixed contrast (no audio)
    float contrast = CONTRAST;
    float contrast_mod = (0.25 * contrast + 0.5 * spinAmount + 1.2);
    float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
    float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
    float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
    float c3p = 1.0 - min(1.0, c1p + c2p);

    // Fixed lighting
    float lighting = LIGHTING;
    float light = (lighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + lighting * max(c2p * 5.0 - 4.0, 0.0);

    vec4 col = (0.3 / contrast) * COLOUR_1 + (1.0 - 0.3 / contrast) * (COLOUR_1 * c1p + COLOUR_2 * c2p + vec4(c3p * COLOUR_3.rgb, c3p * COLOUR_1.a)) + light;

    return col;
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;

    // Scale on beat
    vec2 center = u_resolution * 0.5;
    float scale = 1.0 - u_bass * 0.1;
    fragCoord = center + (fragCoord - center) * scale;

    vec4 col = effect(u_resolution, fragCoord);

    // Glow on beat
    // col.rgb *= 1.0 + u_bass * 0.8;

    gl_FragColor = col;
  }
`;
