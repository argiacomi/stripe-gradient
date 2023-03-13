precision highp float;

float PI = 3.141592653589793238;
uniform float u_time;
uniform float u_globalNoiseSpeed;
uniform float u_vertDeformNoiseAmp;
uniform float u_vertDeformNoiseFlow;
uniform float u_vertDeformIncline;
uniform float u_vertDeformNoiseSeed;
uniform float u_vertDeformNoiseSpeed;
uniform float u_vertDeformOffsetBottom;
uniform float u_vertDeformOffsetTop;
uniform vec2 u_globalNoiseFreq;
uniform vec2 u_resolution;
uniform vec2 u_vertDeformNoiseFreq;
uniform vec3 u_baseColor;

varying vec3 v_color;

#include "noise.glsl"
#include "blend.glsl"

void main() {

  float time = u_time * u_globalNoiseSpeed;

  vec2 noiseCoord = u_resolution * normal.xy * u_globalNoiseFreq;

    // Front-to-back tilt
  float tilt = u_resolution.y / 2.0 * normal.y;

  // Left-to-right angle
  float incline = u_resolution.x * normal.x / 2.0 * u_vertDeformIncline;

  // Up-down shift to offset incline
  float offset = u_resolution.x / 2.0 * u_vertDeformIncline * mix(u_vertDeformOffsetBottom, u_vertDeformOffsetTop, uv.y);

  //
  // Vertex noise
  //

  // Vertex noise
  float noise = snoise(vec3(uv, time * u_vertDeformNoiseSpeed + u_vertDeformNoiseSeed));

  // Fade noise to zero at edges
  noise *= 1.0 - pow(abs(normal.y), 2.0);

  // Clamp to 0
  noise = max(0.0, noise);

  vec3 pos = vec3(
    position.x,
    position.y+ tilt + incline + noise - offset,
    position.z
  );

  v_color = vec3(u_baseColor);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}