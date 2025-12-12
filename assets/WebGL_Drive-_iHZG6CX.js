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
  uniform vec2 u_mouse;

  #define S(a, b, t) smoothstep(a, b, t)

  struct Ray {
    vec3 ro;
    vec3 rd;
  };

  // Noise
  float Noise(float t) {
    return fract(sin(t * 3456.0) * 4547.0);
  }

  // Noise 1 Input and 4 Output
  vec4 Noise14(float t) {
    return fract(sin(t * vec4(123.0, 1024.0, 3456.0, 9564.0)) * vec4(6547.0, 345.0, 8799.0, 1564.0));
  }

  // Get Ray
  Ray GetRay(vec2 uv, vec3 camPos, float camZoom, vec3 lookAt) {
    Ray ray;
    ray.ro = camPos;

    vec3 F = normalize(lookAt - camPos);
    vec3 R = normalize(cross(vec3(0.0, 1.0, 0.0), F));
    vec3 U = cross(F, R);

    vec3 center = camPos + F * camZoom;
    vec3 intersectionPoint = center + uv.x * R + uv.y * U;

    ray.rd = normalize(intersectionPoint - camPos);

    return ray;
  }

  // Get Closest Point
  vec3 GetClosestPoint(Ray ray, vec3 targetPos) {
    return ray.ro + max(0.0, dot(targetPos - ray.ro, ray.rd)) * ray.rd;
  }

  // Get Distance
  float GetDistance(Ray ray, vec3 targetPos) {
    return length(targetPos - GetClosestPoint(ray, targetPos));
  }

  // Bokeh effect
  float Boke(Ray ray, vec3 targetPos, float lightDiameter, float blur) {
    float d = GetDistance(ray, targetPos);
    float expandLight = lightDiameter * length(targetPos);

    float c = S(expandLight, expandLight * (1.0 - blur), d);
    c *= mix(0.7, 1.0, S(expandLight * 0.8, expandLight, d));
    return c;
  }

  // Street Light
  vec3 StreetLight(Ray ray, float lightDiameter, float bokeBlur, float time) {
    float c = 0.0;

    float t = time * 0.03;
    float side = step(ray.rd.x, 0.0);
    ray.rd.x = abs(ray.rd.x);

    for (float i = 0.0; i < 1.0; i += 0.1) {
      float ti = fract(t + i + side * 0.05);
      vec3 targetPos = vec3(2.0, 2.0, 100.0 - ti * 100.0);
      c += Boke(ray, targetPos, lightDiameter, bokeBlur) * ti * ti * ti;
    }

    return vec3(1.0, 0.7, 0.3) * c;
  }

  // Head Light
  vec3 HeadLights(Ray ray, float lightDiameter, float bokeBlur, float time) {
    float headLightDelta = -0.25;
    float headLightDelta2 = headLightDelta * 1.2;

    time = time * 0.5;

    float c = 0.0;
    float t = time * 0.05;

    for (float i = 0.0; i < 1.0; i += 0.067) {
      float n = Noise(i);
      if (n > 0.1) continue;

      float ti = fract(t + i);
      float z = 100.0 - ti * 100.0;
      float fade = ti * ti * ti * ti * ti;
      float focus = S(0.8, 1.0, ti);
      float size = mix(lightDiameter, lightDiameter * 0.5, focus);

      c += Boke(ray, vec3(-headLightDelta - 1.0, 0.15, z), size, bokeBlur) * fade;
      c += Boke(ray, vec3(headLightDelta - 1.0, 0.15, z), size, bokeBlur) * fade;
      c += Boke(ray, vec3(-headLightDelta2 - 1.0, 0.15, z), size, bokeBlur) * fade;
      c += Boke(ray, vec3(headLightDelta2 - 1.0, 0.15, z), size, bokeBlur) * fade;

      // Reflection
      float reflection = 0.0;
      reflection += Boke(ray, vec3(-headLightDelta2 - 1.0, -0.15, z), size * 3.0, 1.0) * fade;
      reflection += Boke(ray, vec3(headLightDelta2 - 1.0, -0.15, z), size * 3.0, 1.0) * fade;
      c += reflection * focus;
    }

    return vec3(0.9, 0.9, 1.0) * c;
  }

  // Tail Light
  vec3 TailLights(Ray ray, float lightDiameter, float bokeBlur, float time) {
    float headLightDelta = -0.25;
    float headLightDelta2 = headLightDelta * 1.2;

    time = time * 0.03;

    float c = 0.0;
    float t = time;

    for (float i = 0.0; i < 1.0; i += 0.067) {
      float n = Noise(i);
      if (n > 0.5) continue;

      float ti = fract(t + i);
      float z = 100.0 - ti * 100.0;
      float fade = ti * ti * ti * ti * ti;
      float focus = S(0.8, 1.0, ti);
      float size = mix(lightDiameter, lightDiameter * 0.5, focus);

      float lane = step(0.25, n);
      float laneShift = S(0.99, 0.96, ti);
      float carPos = 1.5 - lane * laneShift;

      float blink = step(0.0, sin(t * 10000.0)) * 7.0 * lane * step(0.9, ti);

      c += Boke(ray, vec3(carPos - headLightDelta, 0.15, z), size, bokeBlur) * fade;
      c += Boke(ray, vec3(carPos + headLightDelta, 0.15, z), size, bokeBlur) * fade;
      c += Boke(ray, vec3(carPos - headLightDelta2, 0.15, z), size, bokeBlur) * fade;
      c += Boke(ray, vec3(carPos + headLightDelta2, 0.15, z), size, bokeBlur) * fade * (1.0 + blink);

      // Reflection
      float reflection = 0.0;
      reflection += Boke(ray, vec3(carPos - headLightDelta2, -0.15, z), size * 3.0, 1.0) * fade;
      reflection += Boke(ray, vec3(carPos + headLightDelta2, -0.15, z), size * 3.0, 1.0) * fade;
      c += reflection * focus;
    }

    return vec3(1.0, 0.1, 0.01) * c;
  }

  // Environment Light
  vec3 EnvironmentLight(Ray ray, float lightDiameter, float bokeBlur, float time) {
    vec3 c = vec3(0.0);

    float t = time * 0.03;
    float side = step(ray.rd.x, 0.0);
    ray.rd.x = abs(ray.rd.x);

    for (float i = 0.0; i < 1.0; i += 0.1) {
      float ti = fract(t + i + side * 0.05);

      vec4 n = Noise14(i + side * 100.0);
      float x = mix(2.5, 10.0, n.x);
      float y = mix(0.1, 1.5, n.y);

      float occlusion = sin(ti * 6.28 * 10.0) * 0.5 + 0.5;
      float fade = occlusion;

      vec3 targetPos = vec3(x, y, 50.0 - ti * 50.0);
      vec3 col = n.wzy;
      c += Boke(ray, targetPos, lightDiameter, bokeBlur) * fade * col * 0.5;
    }

    return c;
  }

  // Rain Distortion
  vec2 RainDistort(vec2 uv, float t) {
    t *= 1.0;
    vec2 aspectRatio = vec2(3.0, 1.0);

    vec2 st = uv * aspectRatio;
    st.y += t * 0.22;

    vec2 id = floor(st);
    float n = fract(sin(id.x * 716.34) * 768.34);
    st.y += n;
    uv.y += n;
    id = floor(st);

    st = fract(st) - 0.5;

    t += fract(sin(id.x * 76.34 + id.y * 1453.7) * 768.34) * 6.283;

    float y = -sin(t + sin(t + sin(t) * 0.5)) * 0.43;
    vec2 p = vec2(0.0, y);

    vec2 offset1 = (st - p) / aspectRatio;
    float d = length(offset1);
    float mask1 = S(0.07, 0.0, d);

    vec2 offset2 = (fract(uv * aspectRatio.x * vec2(1.0, 2.0)) - 0.5) / vec2(1.0, 2.0);
    d = length(offset2);

    float mask2 = S(0.3 * (0.5 - st.y), 0.0, d) * S(-0.1, 0.1, st.y - p.y);

    return mask1 * 30.0 * offset1 + mask2 * 30.0 * offset2;
  }

  void main() {
    vec2 uv = v_uv - 0.5;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    vec2 mouseUv = u_mouse / u_resolution;

    vec3 camPos = vec3(0.5, 0.2, 0.0);
    vec3 lookAt = vec3(0.5, 0.2, 1.0);
    float camZoom = 2.0;

    // Audio-reactive parameters
    float streetLightDiameter = 0.05 + u_bass * 0.02;
    float headLightDiameter = 0.05 + u_mid * 0.015;
    float bokeBlur = 0.1 + u_high * 0.05;

    // Rain distortion - enhanced by audio
    vec2 rainDistort = vec2(0.0);
    float rainIntensity = 0.5 + u_intensity * 0.3;
    rainDistort += RainDistort(uv * 5.0, u_time) * rainIntensity;
    rainDistort += RainDistort(uv * 7.0, u_time) * rainIntensity;

    // UV distortion - subtle wave effect
    uv.x += sin(uv.y * sin(u_time) * 50.0) * 0.005;
    uv.y += sin(uv.x * sin(u_time) * 30.0) * 0.003;

    Ray ray = GetRay(uv - rainDistort, camPos, camZoom, lookAt);

    // Animation time (no beat influence on speed)
    float animTime = u_time + mouseUv.x;

    // Light brightness multiplier based on audio
    float lightBrightness = 1.0 + u_beatIntensity * 0.8 + u_bass * 0.5;

    vec3 col = StreetLight(ray, streetLightDiameter, bokeBlur, animTime) * lightBrightness;
    col += HeadLights(ray, headLightDiameter, bokeBlur, animTime) * lightBrightness;
    col += TailLights(ray, headLightDiameter, bokeBlur, animTime) * lightBrightness;
    col += EnvironmentLight(ray, streetLightDiameter, bokeBlur, animTime) * lightBrightness;

    // Background gradient - pulsing with bass
    float gradientIntensity = 1.0 + u_bass * 0.4;
    col += (ray.rd.y + 0.25) * vec3(0.2, 0.1, 0.5) * gradientIntensity;

    gl_FragColor = vec4(col, 1.0);
  }
`;export{t as default};
