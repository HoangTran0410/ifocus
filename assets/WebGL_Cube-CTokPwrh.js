import{d as g,e as m,b as d,s as p,f as v,i as h,r as C,F as y}from"./utils-BleFf0sD.js";const _=`
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_beatIntensity;
  uniform float u_bass;
  uniform float u_mid;
  uniform vec2 u_resolution;

  #define M 1e-3

  // Rotation matrix
  mat2 R;

  // Distance and glow tracking
  float d = 1.0;
  float G = 9.0;

  // Distance function (SDF)
  float D(vec3 p, float bassPulse) {
    // Apply rotations
    p.xy *= R;
    p.xz *= R;

    // High frequency detail
    vec3 S = sin(123.0 * p);

    // Glow sphere radius pulses with bass (kick drums)
    float sphereRadius = 0.6 + bassPulse * 0.2;

    // Glow effect - track minimum distance
    G = min(
      G,
      max(
        abs(length(p) - sphereRadius),
        // Superquadric (rounded cube) using L8-norm
        d = pow(dot(p *= p * p * p, p), 0.125) - 0.5
          // Surface detail
          - pow(1.0 + S.x * S.y * S.z, 8.0) / 1e5
      )
    );

    return d;
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec3 r = vec3(u_resolution, 1.0);

    // Ray direction
    vec3 I = normalize(vec3(fragCoord - 0.5 * r.xy, r.y));

    // Base glow color (bluish tint)
    vec3 B = vec3(1.0, 2.0, 9.0) * M;

    // Reset globals
    d = 1.0;
    G = 9.0;

    // Calculate rotation matrix - constant smooth rotation
    float angle = 0.3 * u_time;
    R = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    // Raymarching
    float z = 0.0;
    vec3 p;

    for (int i = 0; i < 100; i++) {
      if (z >= 9.0 || d <= M) break;

      p = z * I;
      p.z -= 2.0;
      z += D(p, u_bass);
    }

    vec3 O = vec3(0.0);

    // Hit condition
    if (z < 9.0) {
      // Calculate surface normal via central differences
      vec3 n = vec3(0.0);
      vec3 e = vec3(M, 0.0, 0.0);
      n.x = D(p + e.xyy, u_bass) - D(p - e.xyy, u_bass);
      n.y = D(p + e.yxy, u_bass) - D(p - e.yxy, u_bass);
      n.z = D(p + e.yyx, u_bass) - D(p - e.yyx, u_bass);
      n = normalize(n);

      // Fresnel factor
      float fresnel = 1.0 + dot(n, I);

      // Reflection vector
      vec3 refl = reflect(I, n);

      // Calculate reflection sample point
      vec2 C = (p + refl * (5.0 - p.y) / abs(refl.y)).xz;

      // Calculate color based on reflection direction
      if (refl.y > 0.0) {
        // Sky reflection
        float dist = sqrt(length(C * C)) + 1.0;
        O = fresnel * fresnel * 5e2 * smoothstep(5.0, 4.0, dist) * dist * B;
      } else {
        // Floor reflection
        O = fresnel * fresnel * exp(-2.0 * length(C)) * (B / M - 1.0);
      }

      // Add rim lighting
      O += pow(1.0 + n.y, 5.0) * B;
    }

    // Add glow contribution
    vec3 glow = B / G;

    // Mid frequencies enhance glow (synths, vocals)
    glow *= 1.0 + u_mid * 4.0;

    // Tonemapping
    vec3 color = sqrt(O + glow);

    // Intensity boost
    color *= 1.0 + u_intensity * 0.2;

    // Calculate alpha for transparent background
    float alpha = clamp(length(color) * 1.5, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`,e={program:null,uniforms:{},initialized:!1,lastCanvas:null,glCanvas:null,time:0};function w({ctx:t,canvas:n,data:i,performanceMode:o=!1,beatIntensity:l=0,bass:r=0,mid:s=0}){(!e.glCanvas||e.lastCanvas!==n)&&(e.glCanvas=document.createElement("canvas"),e.initialized=!1),(e.glCanvas.width!==n.width||e.glCanvas.height!==n.height)&&(e.glCanvas.width=n.width,e.glCanvas.height=n.height,e.initialized=!1);const a=g(e.glCanvas);if(!a)return;if(!e.initialized){if(e.program=m(a,y,_),!e.program)return;e.uniforms=d(a,e.program),p(a),e.initialized=!0,e.lastCanvas=n}if(!e.program)return;e.time+=o?.012:.016;const u=i.reduce((f,c)=>f+c,0)/i.length;a.viewport(0,0,a.drawingBufferWidth,a.drawingBufferHeight),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.useProgram(e.program),a.uniform1f(e.uniforms.u_time,e.time),a.uniform1f(e.uniforms.u_intensity,u),a.uniform1f(e.uniforms.u_beatIntensity,l),a.uniform1f(e.uniforms.u_bass,r),a.uniform1f(e.uniforms.u_mid,s),a.uniform2f(e.uniforms.u_resolution,n.width,n.height),a.enable(a.BLEND),a.blendFunc(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA),v(a,e.program),h(e.glCanvas,t,n)}function R(){e.glCanvas&&(C(e.glCanvas),e.glCanvas=null,e.program=null,e.initialized=!1,e.lastCanvas=null)}export{R as cleanup,w as default};
