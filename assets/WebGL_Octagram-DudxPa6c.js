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

  float gTime = 0.0;

  // Rotation matrix
  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
  }

  float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
  }

  float box(vec3 pos, float scale) {
    pos *= scale;
    float base = sdBox(pos, vec3(0.4, 0.4, 0.1)) / 1.5;
    pos.xy *= 5.0;
    pos.y -= 3.5;
    pos.xy *= rot(0.75);
    float result = -base;
    return result;
  }

  float box_set(vec3 pos) {
    vec3 pos_origin = pos;

    pos = pos_origin;
    pos.y += sin(gTime * 0.4) * 2.5;
    pos.xy *= rot(0.8);
    float box1 = box(pos, 2.0 - abs(sin(gTime * 0.4)) * 1.5);

    pos = pos_origin;
    pos.y -= sin(gTime * 0.4) * 2.5;
    pos.xy *= rot(0.8);
    float box2 = box(pos, 2.0 - abs(sin(gTime * 0.4)) * 1.5);

    pos = pos_origin;
    pos.x += sin(gTime * 0.4) * 2.5;
    pos.xy *= rot(0.8);
    float box3 = box(pos, 2.0 - abs(sin(gTime * 0.4)) * 1.5);

    pos = pos_origin;
    pos.x -= sin(gTime * 0.4) * 2.5;
    pos.xy *= rot(0.8);
    float box4 = box(pos, 2.0 - abs(sin(gTime * 0.4)) * 1.5);

    pos = pos_origin;
    pos.xy *= rot(0.8);
    float box5 = box(pos, 0.5) * 6.0;

    pos = pos_origin;
    float box6 = box(pos, 0.5) * 6.0;

    float result = max(max(max(max(max(box1, box2), box3), box4), box5), box6);
    return result;
  }

  float map(vec3 pos) {
    return box_set(pos);
  }

  void main() {
    vec2 p = (v_uv * 2.0 - 1.0);
    p.x *= u_resolution.x / u_resolution.y;

    // Steady time - no audio affecting camera position
    float animTime = u_time;

    // Camera movement - moderate speed
    vec3 ro = vec3(0.0, -0.2, animTime * 2.5);
    vec3 ray = normalize(vec3(p, 1.5));
    ray.xy = ray.xy * rot(sin(animTime * 0.03) * 5.0);
    ray.yz = ray.yz * rot(sin(animTime * 0.05) * 0.2);

    float t = 0.1;
    vec3 col = vec3(0.0);
    float ac = 0.0;

    // Subtle beat glow (reduced intensity)
    float glowMultiplier = 23.0 - u_beatIntensity * 3.0 - u_bass * 2.0;

    for (int i = 0; i < 99; i++) {
      vec3 pos = ro + ray * t;
      pos = mod(pos - 2.0, 4.0) - 2.0;

      // Subtle box scale on beat (reduced)
      pos *= 1.0 - u_beatIntensity * 0.08 - u_bass * 0.04;

      gTime = animTime - float(i) * 0.01;

      float d = map(pos);
      d = max(abs(d), 0.01);
      ac += exp(-d * glowMultiplier);

      t += d * 0.55;
    }

    // Reduced base glow multiplier
    col = vec3(ac * (0.015 + u_beatIntensity * 0.01));

    // Subtle audio-reactive colors
    col += vec3(
      u_bass * 0.15,
      0.2 * abs(sin(animTime)) + u_mid * 0.1,
      0.5 + sin(animTime) * 0.2 + u_high * 0.1
    );

    // Reduced brightness boost on beats
    col *= 1.0 + u_beatIntensity * 0.3;

    float alpha = 1.0 - t * (0.02 + 0.02 * sin(animTime));
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;export{o as default};
