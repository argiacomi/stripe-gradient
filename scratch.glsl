let right = 1,
  left = -1,
  top = 1,
  bottom = -1,
  near = 0.1,
  far = 2000,
  zoom = 1;

const dx = (right - left) / (2 * zoom);
const dy = (top - bottom) / (2 * zoom);
const cx = (right + left) / 2;
const cy = (top + bottom) / 2;

left = cx - dx;
right = cx + dx;
top = cy + dy;
bottom = cy - dy;

let te = [0.0011111111111111111, 0, 0, 0, 0, 0.0035087719298245615, 0, 0, 0, 0, -0.0005, 0, 0, 0, 0, 1];
const pm = [0.0011111111111111111, 0, 0, 0, 0, 0.0035087719298245615, 0, 0, 0, 0, -0.0005, 0, 0, 0, 0, 1];
const w = 1.0 / (right - left);
const h = 1.0 / (top - bottom);
const p = 1.0 / (far - near);

const x = (right + left) * w;
const y = (top + bottom) * h;
const z = (far + near) * p;

console.log(pm[1] == 0, pm[2] == 0, pm[3] == 0, pm[4] == 0, pm[6] == 0, pm[7] == 0, pm[8] == 0, pm[9] == 0, pm[11] == 0);

te[0] = 2 * w;
te[5] = 2 * h;
te[10] = -2 * p;
te[12] = -x;
te[13] = -y;
te[14] = -z;

te[15] = 1;

console.log(pm[1]);
