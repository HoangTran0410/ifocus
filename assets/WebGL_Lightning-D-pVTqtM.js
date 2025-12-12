import{d as p,e as d,b as v,s as g,f as _,i as y,r as C,F as w}from"./utils-BleFf0sD.js";const x=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_high;
  uniform vec2 u_resolution;
  uniform float u_frequencies[8];
  uniform float u_lastBeat;

  #define PI 3.14159265359
  #define MAX_BOLTS 6

  // Hash functions for randomness
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // Noise function
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractal brownian motion for cloud/glow effects
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // Lightning bolt distance field
  // Creates a jagged line from top to bottom
  float lightningBolt(vec2 uv, float seed, float width, float intensity) {
    float y = uv.y;
    float t = u_time * 3.0 + seed * 100.0;

    // Start position (random x at top)
    float startX = 0.3 + hash(seed) * 0.4;

    // Build the bolt path with fractal displacement
    float x = startX;
    float displacement = 0.0;
    float freq = 1.0;
    float amp = 0.15 * (1.0 + intensity * 0.5);

    // Multiple octaves of displacement
    for (int i = 0; i < 6; i++) {
      displacement += amp * sin(y * freq * 15.0 + t + seed * float(i) * 10.0);
      displacement += amp * 0.5 * noise(vec2(y * freq * 10.0 + t, seed));
      freq *= 2.0;
      amp *= 0.5;
    }

    x += displacement;

    // Distance to bolt
    float d = abs(uv.x - x);

    // Taper width towards bottom
    float taper = 1.0 - y * 0.3;
    float w = width * taper * (1.0 + intensity * 0.5);

    // Sharp core with glow falloff
    float bolt = smoothstep(w, 0.0, d);
    bolt += smoothstep(w * 4.0, 0.0, d) * 0.3; // Outer glow

    return bolt;
  }

  // Branching bolt (recursive-like with manual unrolling)
  float branchingBolt(vec2 uv, float seed, float intensity) {
    float bolt = 0.0;

    // Main bolt
    bolt += lightningBolt(uv, seed, 0.015, intensity);

    // Branches (simulate with offset UVs)
    for (int i = 0; i < 3; i++) {
      float branchSeed = seed + float(i) * 0.1;
      float branchY = 0.2 + hash(branchSeed) * 0.5;

      if (uv.y > branchY) {
        vec2 branchUV = uv;
        branchUV.y = (uv.y - branchY) / (1.0 - branchY);

        // Offset x based on main bolt position
        float offset = (hash(branchSeed + 0.5) - 0.5) * 0.3;
        branchUV.x += offset;

        float branch = lightningBolt(branchUV, branchSeed + 1.0, 0.008, intensity * 0.7);
        branch *= (1.0 - branchUV.y) * 0.7; // Fade out branches
        bolt += branch;
      }
    }

    return bolt;
  }

  void main() {
    vec2 uv = v_uv;

    // Aspect ratio correction
    float aspect = u_resolution.x / u_resolution.y;
    vec2 center = uv - 0.5;
    center.x *= aspect;

    vec3 color = vec3(0.0);
    float alpha = 0.0;

    // Storm clouds at top
    float cloudY = uv.y;
    if (cloudY < 0.25) {
      float cloud = fbm(vec2(uv.x * 3.0 + u_time * 0.1, cloudY * 5.0));
      cloud *= smoothstep(0.25, 0.0, cloudY);
      cloud *= 1.0 + u_intensity * 0.5;

      vec3 cloudColor = mix(
        vec3(0.1, 0.1, 0.2),
        vec3(0.3, 0.35, 0.5),
        cloud
      );

      // Internal cloud lighting
      float internalLight = fbm(vec2(uv.x * 5.0 - u_time * 0.2, cloudY * 8.0));
      internalLight = pow(internalLight, 2.0) * u_intensity;
      cloudColor += vec3(0.4, 0.5, 0.8) * internalLight;

      color += cloudColor * cloud;
      alpha = max(alpha, cloud * 0.8);
    }

    // Dynamic lightning bolts based on beat
    float boltIntensity = 0.0;

    // Calculate number of active bolts based on beat intensity
    float beatPhase = mod(u_time, 2.0);
    float boltCount = floor(1.0 + u_bass * 5.0);

    for (int i = 0; i < MAX_BOLTS; i++) {
      float fi = float(i);

      // Skip bolts beyond count by making them invisible
      float boltVisible = step(fi, boltCount - 0.5);
      if (boltVisible < 0.5) continue;

      float seed = floor(u_time * 0.5) + fi * 0.17;

      // Bolt lifetime
      float boltTime = mod(u_time + fi * 0.3, 1.5);
      float boltAlpha = 1.0;

      // Quick flash then fade
      if (boltTime < 0.1) {
        boltAlpha = boltTime / 0.1;
      } else if (boltTime > 0.3) {
        boltAlpha = max(0.0, 1.0 - (boltTime - 0.3) / 0.5);
      }

      // Increase bolt visibility during beats
      boltAlpha *= 0.3 + u_bass * 0.7 + u_frequencies[i] * 0.5;

      if (boltAlpha > 0.01) {
        float bolt = branchingBolt(uv, seed, u_intensity);
        boltIntensity += bolt * boltAlpha;
      }
    }

    // Lightning colors - electric blue/white core with purple edges
    vec3 boltCore = vec3(0.9, 0.95, 1.0);
    vec3 boltGlow = vec3(0.4, 0.5, 1.0);
    vec3 boltEdge = vec3(0.6, 0.3, 0.9);

    float coreMask = smoothstep(0.0, 1.0, boltIntensity);
    vec3 boltColor = mix(boltEdge, boltGlow, coreMask);
    boltColor = mix(boltColor, boltCore, smoothstep(0.5, 2.0, boltIntensity));

    color += boltColor * boltIntensity;
    alpha = max(alpha, min(boltIntensity, 1.0));

    // Electric particles/sparks
    float sparks = 0.0;
    for (int i = 0; i < 20; i++) {
      float fi = float(i);
      vec2 sparkPos = vec2(
        hash(fi * 0.1) * aspect - aspect * 0.5 + 0.5,
        hash(fi * 0.2 + 10.0) * 0.7
      );

      float sparkTime = mod(u_time * (1.0 + hash(fi) * 0.5) + fi, 2.0);
      float sparkLife = 1.0 - sparkTime / 2.0;

      if (sparkLife > 0.0) {
        sparkPos.y += sparkTime * 0.1; // Fall slightly
        float d = length(center - (sparkPos - 0.5));
        float spark = exp(-d * 100.0) * sparkLife;
        spark *= u_intensity + u_high;
        sparks += spark;
      }
    }
    color += vec3(0.7, 0.8, 1.0) * sparks;
    alpha = max(alpha, sparks);

    // Ambient electric field effect
    float field = fbm(center * 8.0 + u_time * 0.5) * 0.5 + 0.5;
    field *= fbm(center * 12.0 - u_time * 0.3) * 0.5 + 0.5;
    field = pow(field, 3.0) * u_intensity * 0.3;
    color += vec3(0.3, 0.4, 0.7) * field;
    alpha = max(alpha, field * 0.5);

    // Screen flash on strong beats
    if (u_bass > 0.6) {
      float flash = (u_bass - 0.6) / 0.4;
      flash *= 0.3;
      color += vec3(0.7, 0.8, 1.0) * flash;
      alpha = max(alpha, flash);
    }

    // Frequency-reactive glow from bottom
    float bottomGlow = (1.0 - uv.y) * (1.0 - uv.y);
    bottomGlow *= u_intensity * 0.3;
    color += vec3(0.2, 0.3, 0.5) * bottomGlow;
    alpha = max(alpha, bottomGlow * 0.5);

    // Slight ambient illumination
    float ambient = 0.02 + u_intensity * 0.03;
    color += vec3(0.1, 0.15, 0.25) * ambient;

    gl_FragColor = vec4(color, alpha);
  }
`,t={program:null,uniforms:{},initialized:!1,lastCanvas:null,glCanvas:null,time:0,lastBeat:0};function B({ctx:u,canvas:o,data:l,performanceMode:c=!1,beatIntensity:r=0,bass:h=0,high:m=0}){(!t.glCanvas||t.lastCanvas!==o)&&(t.glCanvas=document.createElement("canvas"),t.initialized=!1),(t.glCanvas.width!==o.width||t.glCanvas.height!==o.height)&&(t.glCanvas.width=o.width,t.glCanvas.height=o.height,t.initialized=!1);const e=p(t.glCanvas);if(!e)return;if(!t.initialized){if(t.program=d(e,w,x),!t.program)return;t.uniforms=v(e,t.program),g(e),t.initialized=!0,t.lastCanvas=o}if(!t.program)return;r>.5&&(t.lastBeat=t.time),t.time+=c?.014:.016;const b=l.reduce((a,i)=>a+i,0)/l.length,f=new Float32Array(8),n=Math.floor(l.length/8);for(let a=0;a<8;a++){let i=0;for(let s=0;s<n;s++)i+=l[a*n+s]||0;f[a]=i/n}e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.useProgram(t.program),e.uniform1f(t.uniforms.u_time,t.time),e.uniform1f(t.uniforms.u_intensity,b),e.uniform1f(t.uniforms.u_beatIntensity,r),e.uniform1f(t.uniforms.u_bass,h),e.uniform1f(t.uniforms.u_high,m),e.uniform2f(t.uniforms.u_resolution,o.width,o.height),e.uniform1fv(t.uniforms["u_frequencies[0]"],f),e.uniform1f(t.uniforms.u_lastBeat,t.lastBeat),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),_(e,t.program),y(t.glCanvas,u,o)}function L(){t.glCanvas&&(C(t.glCanvas),t.glCanvas=null,t.program=null,t.initialized=!1,t.lastCanvas=null)}export{L as cleanup,B as default};
