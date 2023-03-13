uniform float u_time;
uniform float u_globalNoiseSpeed;
uniform vec2 u_globalNoiseFreq;
uniform vec2 u_resolution;

varying vec3 v_color;

void main() {
  vec3 color = v_color;
  gl_FragColor = vec4(color, 1.0);
}