precision highp float;

float PI = 3.141592653589793238;
uniform vec2 resolution;
uniform float aspectRatio;
uniform float u_time;
uniform float u_shadow_power;
uniform float u_darken_top;
uniform vec4 u_active_colors;
uniform vec3 u_baseColor;

uniform struct Global {
  vec2 noiseFreq; float noiseSpeed;
} u_global;

uniform struct VertDeform {
  float incline; float offsetTop; float offsetBottom; vec2 noiseFreq; float noiseAmp; float noiseSpeed; float noiseFlow; float noiseSeed;
} u_vertDeform;

uniform struct WaveLayers {
  vec3 color; vec2 noiseFreq; float noiseSpeed; float noiseFlow; float noiseSeed; float noiseFloor; float noiseCeil;
} u_waveLayers[3];

const int u_waveLayers_length = 3;

varying vec3 v_color;

#include "noise.glsl"
#include "blend.glsl"

void main() {

  float time = u_time * u_global.noiseSpeed;
  vec2 noiseCoord = resolution * normal.xy * u_global.noiseFreq;
  // Vertex noise
  float noise = snoise(vec3(uv, u_time * 0.01)) ;
  vec3 pos = vec3(position.x,position.y,position.z + noise * 0.5);

  v_color = vec3(u_baseColor);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}