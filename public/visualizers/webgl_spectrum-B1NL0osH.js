const o=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 p = (2.0 * fragCoord - u_resolution) / u_resolution.y;

    float a = atan(p.x, p.y);
    float r = length(p);
    vec2 uv = vec2(a / (2.0 * 3.1415926535), r);

    // Get the colour - rainbow rotation
    float xCol = (uv.x - (u_time / 8.0)) * 3.0;
    xCol = mod(xCol, 3.0);
    vec3 horColour = vec3(0.25, 0.25, 0.25);

    if (xCol < 1.0) {
      horColour.r += 1.0 - xCol;
      horColour.g += xCol;
    } else if (xCol < 2.0) {
      xCol -= 1.0;
      horColour.g += 1.0 - xCol;
      horColour.b += xCol;
    } else {
      xCol -= 2.0;
      horColour.b += 1.0 - xCol;
      horColour.r += xCol;
    }

    // Background lines
    float backValue = 1.0;
    float aspect = u_resolution.x / u_resolution.y;
    if (mod(uv.y * 100.0, 1.0) > 0.75 || mod(uv.x * 100.0 * aspect, 1.0) > 0.75) {
      backValue = 1.15;
    }

    vec3 backLines = vec3(backValue);

    // Main beam - audio affects beam width
    uv = (2.0 * uv) - 1.0;
    float beamWidth = abs(3.0 / (30.0 * uv.y));

    // Beat makes beam thicker
    beamWidth *= 1.0 + u_bass * 2.0;

    vec3 horBeam = vec3(beamWidth);

    vec3 col = (backLines * horBeam) * horColour;

    // Glow brighter on beat
    col *= 1.0 + u_bass * 1.0;

    // Calculate alpha
    float alpha = clamp(length(col) * 0.5, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;export{o as default};
