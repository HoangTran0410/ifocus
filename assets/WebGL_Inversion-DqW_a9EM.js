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

  const float width = 0.22;
  const float scale = 4.0;
  const float detail = 0.002;

  vec3 lightdir = -vec3(0.2, 0.5, 1.0);

  mat2 rot;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float de(vec3 p) {
    float t = u_time * 0.3; // Slowed down
    float dotp = dot(p, p);
    p.x += sin(t * 10.0) * 0.007; // Slowed down
    p = p / dotp * scale;
    p = sin(p + vec3(sin(1.0 + t) * 2.0, -t, -t * 2.0));
    float d = length(p.yz) - width;
    d = min(d, length(p.xz) - width);
    d = min(d, length(p.xy) - width);
    d = min(d, length(p * p * p) - width * 0.3);
    return d * dotp / scale;
  }

  vec3 normal(vec3 p) {
    vec3 e = vec3(0.0, detail, 0.0);
    return normalize(vec3(
      de(p + e.yxx) - de(p - e.yxx),
      de(p + e.xyx) - de(p - e.xyx),
      de(p + e.xxy) - de(p - e.xxy)
    ));
  }

  float light(in vec3 p, in vec3 dir) {
    vec3 ldir = normalize(lightdir);
    vec3 n = normal(p);
    float sh = 1.0;
    float diff = max(0.0, dot(ldir, -n)) + 0.1 * max(0.0, dot(normalize(dir), -n));
    vec3 r = reflect(ldir, n);
    float spec = max(0.0, dot(dir, -r)) * sh;
    return diff + pow(spec, 20.0) * 0.7;
  }

  float raymarch(in vec3 from, in vec3 dir, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / u_resolution.xy * 2.0 - 1.0;
    uv.y *= u_resolution.y / u_resolution.x;
    float st, d, col, totdist = 0.0;
    st = 0.0;
    vec3 p;
    float ra = rand(uv.xy * u_time) - 0.5;
    float ras = max(0.0, sign(-0.5 + rand(vec2(1.3456, 0.3573) * floor(30.0 + u_time * 20.0))));
    float rab = rand(vec2(1.2439, 2.3453) * floor(10.0 + u_time * 40.0)) * ras;

    // Audio-reactive glow - stronger effect
    rab += u_bass * 2.0;

    float rac = rand(vec2(1.1347, 1.0331) * floor(40.0 + u_time));
    float ral = rand(1.0 + floor(uv.yy * 300.0) * u_time) - 0.5;

    for (int i = 0; i < 60; i++) {
      p = from + totdist * dir;
      d = de(p);
      if (d < detail || totdist > 2.0) break;
      totdist += d;
      st += max(0.0, 0.04 - d);
    }

    vec2 li = uv * rot;
    float backg = 0.45 * pow(1.5 - min(1.0, length(li + vec2(0.0, -0.6))), 1.5);

    if (d < detail) {
      col = light(p - detail * dir, dir);
    } else {
      col = backg;
    }

    col += smoothstep(0.0, 1.0, st) * 0.8 * (0.1 + rab);
    col += pow(max(0.0, 1.0 - length(p)), 8.0) * (0.5 + 10.0 * rab);
    col += pow(max(0.0, 1.0 - length(p)), 30.0) * 50.0;
    col = mix(col, backg, 1.0 - exp(-0.25 * pow(totdist, 3.0)));

    // Reduce scan line effect
    if (rac > 0.9) col = col * 0.9 + (0.1 + ra + ral * 0.3) * mod(uv.y + u_time * 2.0, 0.25);

    return col + ra * 0.03 + (ral * 0.1 + ra * 0.1) * rab;
  }

  void main() {
    float t = u_time * 0.1; // Slowed down rotation
    vec2 fragCoord = v_uv * u_resolution;
    vec2 uv = fragCoord.xy / u_resolution.xy * 2.0 - 1.0;
    uv.y *= u_resolution.y / u_resolution.x;

    // Scale on beat - stronger effect
    float beatScale = 1.0 - u_bass * 0.3;

    vec3 from = vec3(0.0, 0.1, -1.2);
    vec3 dir = normalize(vec3(uv * beatScale, 1.0));
    rot = mat2(cos(t), sin(t), -sin(t), cos(t));
    dir.xy = dir.xy * rot;

    float col = raymarch(from, dir, fragCoord);

    // Glow on beat - stronger effect
    float glow = 1.0 + u_bass * 1.5 + u_beatIntensity * 1.0;
    col = pow(col, 1.25) * glow;

    // Dark background (no transparency)
    gl_FragColor = vec4(vec3(col), 1.0);
  }
`;export{o as default};
