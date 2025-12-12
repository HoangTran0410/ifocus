const e=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform vec2 u_resolution;

  #define ITERATIONS 40
  #define SPEED 1.0

  #define STRIP_CHARS_MIN 7.0
  #define STRIP_CHARS_MAX 40.0
  #define STRIP_CHAR_HEIGHT 0.15
  #define STRIP_CHAR_WIDTH 0.10
  #define ZCELL_SIZE (1.0 * STRIP_CHAR_HEIGHT * STRIP_CHARS_MAX)
  #define XYCELL_SIZE (12.0 * STRIP_CHAR_WIDTH)

  #define BLOCK_SIZE 10
  #define BLOCK_GAP 2

  #define WALK_SPEED (1.0 * XYCELL_SIZE)
  #define BLOCKS_BEFORE_TURN 3.0

  #define PI 3.14159265359

  // Random functions
  float hash(float v) {
    return fract(sin(v) * 43758.5453123);
  }

  float hash2d(vec2 v) {
    return hash(dot(v, vec2(5.3983, 5.4427)));
  }

  vec2 hash2(vec2 v) {
    v = vec2(dot(v, vec2(127.1, 311.7)), dot(v, vec2(269.5, 183.3)));
    return fract(sin(v) * 43758.5453123);
  }

  vec4 hash4_2(vec2 v) {
    vec4 p = vec4(
      dot(v, vec2(127.1, 311.7)),
      dot(v, vec2(269.5, 183.3)),
      dot(v, vec2(113.5, 271.9)),
      dot(v, vec2(246.1, 124.6))
    );
    return fract(sin(p) * 43758.5453123);
  }

  vec4 hash4_3(vec3 v) {
    vec4 p = vec4(
      dot(v, vec3(127.1, 311.7, 74.7)),
      dot(v, vec3(269.5, 183.3, 246.1)),
      dot(v, vec3(113.5, 271.9, 124.6)),
      dot(v, vec3(271.9, 269.5, 311.7))
    );
    return fract(sin(p) * 43758.5453123);
  }

  // Rune symbol drawing
  float rune_line(vec2 p, vec2 a, vec2 b) {
    p -= a;
    b -= a;
    float h = clamp(dot(p, b) / dot(b, b), 0.0, 1.0);
    return length(p - b * h);
  }

  float rune(vec2 U, vec2 seed, float highlight) {
    float d = 1e5;
    for (int i = 0; i < 4; i++) {
      vec4 pos = hash4_2(seed);
      seed += 1.0;

      if (i == 0) pos.y = 0.0;
      if (i == 1) pos.x = 0.999;
      if (i == 2) pos.x = 0.0;
      if (i == 3) pos.y = 0.999;

      vec4 snaps = vec4(2.0, 3.0, 2.0, 3.0);
      pos = (floor(pos * snaps) + 0.5) / snaps;

      if (pos.xy != pos.zw)
        d = min(d, rune_line(U, pos.xy, pos.zw + 0.001));
    }
    return smoothstep(0.1, 0.0, d) + highlight * smoothstep(0.4, 0.0, d);
  }

  float random_char(vec2 outer, vec2 inner, float highlight) {
    vec2 seed = vec2(dot(outer, vec2(269.5, 183.3)), dot(outer, vec2(113.5, 271.9)));
    return rune(inner, seed, highlight);
  }

  // Digital rain
  vec3 rain(vec3 ro3, vec3 rd3, float time) {
    vec4 result = vec4(0.0);

    vec2 ro2 = vec2(ro3);
    vec2 rd2 = normalize(vec2(rd3));

    bool prefer_dx = abs(rd2.x) > abs(rd2.y);
    float t3_to_t2 = prefer_dx ? rd3.x / rd2.x : rd3.y / rd2.y;

    ivec3 cell_side = ivec3(step(0.0, rd3));
    ivec3 cell_shift = ivec3(sign(rd3));

    float t2 = 0.0;
    ivec2 next_cell = ivec2(floor(ro2 / XYCELL_SIZE));

    for (int i = 0; i < ITERATIONS; i++) {
      ivec2 cell = next_cell;
      float t2s = t2;

      vec2 side = vec2(next_cell + cell_side.xy) * XYCELL_SIZE;
      vec2 t2_side = (side - ro2) / rd2;

      if (t2_side.x < t2_side.y) {
        t2 = t2_side.x;
        next_cell.x += cell_shift.x;
      } else {
        t2 = t2_side.y;
        next_cell.y += cell_shift.y;
      }

      vec2 cell_in_block = fract(vec2(cell) / float(BLOCK_SIZE));
      float gap = float(BLOCK_GAP) / float(BLOCK_SIZE);
      if (cell_in_block.x < gap || cell_in_block.y < gap || (cell_in_block.x < (gap + 0.1) && cell_in_block.y < (gap + 0.1))) {
        continue;
      }

      float t3s = t2s / t3_to_t2;
      float pos_z = ro3.z + rd3.z * t3s;
      float xycell_hash = hash2d(vec2(cell));
      float z_shift = xycell_hash * 11.0 - time * (0.5 + xycell_hash * 1.0 + xycell_hash * xycell_hash * 1.0 + pow(xycell_hash, 16.0) * 3.0);
      float char_z_shift = floor(z_shift / STRIP_CHAR_HEIGHT);
      z_shift = char_z_shift * STRIP_CHAR_HEIGHT;
      int zcell = int(floor((pos_z - z_shift) / ZCELL_SIZE));

      for (int j = 0; j < 2; j++) {
        vec4 cell_hash = hash4_3(vec3(float(cell.x), float(cell.y), float(zcell)));
        vec4 cell_hash2 = fract(cell_hash * vec4(127.1, 311.7, 271.9, 124.6));

        float chars_count = cell_hash.w * (STRIP_CHARS_MAX - STRIP_CHARS_MIN) + STRIP_CHARS_MIN;
        float target_length = chars_count * STRIP_CHAR_HEIGHT;
        float target_rad = STRIP_CHAR_WIDTH / 2.0;
        float target_z = (float(zcell) * ZCELL_SIZE + z_shift) + cell_hash.z * (ZCELL_SIZE - target_length);
        vec2 target = vec2(cell) * XYCELL_SIZE + target_rad + cell_hash.xy * (XYCELL_SIZE - target_rad * 2.0);

        vec2 s = target - ro2;
        float tmin = dot(s, rd2);
        if (tmin >= t2s && tmin <= t2) {
          float u = s.x * rd2.y - s.y * rd2.x;
          if (abs(u) < target_rad) {
            u = (u / target_rad + 1.0) / 2.0;
            float z = ro3.z + rd3.z * tmin / t3_to_t2;
            float v = (z - target_z) / target_length;
            if (v >= 0.0 && v < 1.0) {
              float c = floor(v * chars_count);
              float q = fract(v * chars_count);
              vec2 char_hash = hash2(vec2(c + char_z_shift, cell_hash2.x));
              if (char_hash.x >= 0.1 || c == 0.0) {
                float time_factor = floor(c == 0.0 ? time * 5.0 :
                    time * (1.0 * cell_hash2.z + cell_hash2.w * cell_hash2.w * 4.0 * pow(char_hash.y, 4.0)));
                float a = random_char(vec2(char_hash.x, time_factor), vec2(u, q), max(1.0, 3.0 - c / 2.0) * 0.2);
                a *= clamp((chars_count - 0.5 - c) / 2.0, 0.0, 1.0);
                if (a > 0.0) {
                  float attenuation = 1.0 + pow(0.06 * tmin / t3_to_t2, 2.0);
                  vec3 col = (c == 0.0 ? vec3(0.67, 1.0, 0.82) : vec3(0.25, 0.80, 0.40)) / attenuation;
                  float a1 = result.a;
                  result.a = a1 + (1.0 - a1) * a;
                  result.xyz = (result.xyz * a1 + col * (1.0 - a1) * a) / result.a;
                  if (result.a > 0.98) return result.xyz;
                }
              }
            }
          }
        }
        zcell += cell_shift.z;
      }
    }

    return result.xyz * result.a;
  }

  mat3 rotateX(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
  }

  mat3 rotateZ(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 uv = (fragCoord * 2.0 - u_resolution) / u_resolution.y;

    // Zoom on beat
    float zoom = 1.0 - u_bass * 0.2;
    uv *= zoom;

    float time = u_time * SPEED;

    float level1_size = float(BLOCK_SIZE) * BLOCKS_BEFORE_TURN * XYCELL_SIZE;
    float gap_size = float(BLOCK_GAP) * XYCELL_SIZE;

    vec3 ro = vec3(gap_size / 2.0, gap_size / 2.0, 0.0);
    vec3 rd = vec3(uv.x, 2.0, uv.y);

    // Gentle sine wave camera sway (no continuous rotation)
    rd = rotateZ(sin(time * 0.05) * 0.1) * rd;
    rd = rotateX(sin(time * 0.03) * 0.05) * rd;

    // Slow forward movement
    ro.xy += vec2(time * WALK_SPEED * 0.2, time * WALK_SPEED * 0.1);

    ro += rd * 0.2;
    rd = normalize(rd);

    vec3 col = rain(ro, rd, time);

    // Beat affects glow
    col *= 1.0 + u_bass * 1.5;

    float alpha = clamp(length(col) * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;export{e as default};
