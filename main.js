import * as THREE from 'three';
import fragmentShader from './shader/fragment.glsl';
import vertexShader from './shader/vertex.glsl';
import './style.css';

let count = 1;
export default class Gradient {
  constructor(options) {
    this.conf = {
      wireframe: false,
      playing: true,
      density: [0.6, 0.16],
      darkenTop: false,
      activeColors: [1, 1, 1, 1],
      noiseFreq: [0.00014, 0.00029],
      noiseSpeed: 8.33,
      angle: 0,
      amp: 320,
      seed: 5
    };
    this.scene = void 0;
    this.container = options.dom;
    this.sectionColors = initGradientColors(this.container);
    this.width = this.container.offsetWidth;
    this.height = 600;
    this.xSegCount = Math.ceil(this.width * this.conf.density[0]);
    this.ySegCount = Math.ceil(this.height * this.conf.density[1]);
    this.renderer = void 0;
    this.camera = void 0;
    this.uniforms = void 0;
    this.t = 1253166;
    this.last = 0.0;

    function initGradientColors(canvas) {
      let computedCanvasStyle = getComputedStyle(canvas);
      let sectionColors = ['--gradientColorZero', '--gradientColorOne', '--gradientColorTwo', '--gradientColorThree']
        .map((color) => {
          let hex = computedCanvasStyle.getPropertyValue(color).trim();
          if (4 === hex.length) {
            const hexTemp = hex
              .substr(1)
              .split('')
              .map((hexTemp) => hexTemp + hexTemp)
              .join('');
            hex = hexTemp;
          }
          return hex;
        })
        .filter(Boolean)
        .map((color) => new THREE.Color(color));
      return sectionColors;
    }

    this.init();
    this.addObjects();
    this.onWindowResize();
    this.setupWindowResize();
    this.render();
    this.addIsLoadedClass();
  }

  init() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.container,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xeeeeee, 1);

    this.camera = new THREE.OrthographicCamera(this.width / -2, this.width / 2, this.height / 2, this.height / -2, -2000, 2000);
  }

  setupWindowResize() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  onWindowResize() {
    this.width = this.container.offsetWidth;
    this.container.width = this.width;
    this.renderer.setViewport(0, 0, this.width, this.height);
    this.uniforms.resolution.value = [this.width, this.height];
    this.camera.updateProjectionMatrix();
    this.xSegCount = Math.ceil(this.width * this.conf.density[0]);
    this.ySegCount = Math.ceil(this.height * this.conf.density[1]);
    this.mesh.geometry.parameters = {
      width: this.width,
      height: this.height,
      widthSegments: this.xSegCount,
      heightSegments: this.ySegCount
    };
    this.mesh.material.uniforms.u_shadow_power.value = this.width < 600 ? 5 : 6;
  }

  initMaterial() {
    this.uniforms = {
      resolution: { value: [this.width, this.height] },
      u_time: { value: 0 },
      u_shadow_power: { value: this.width < 600 ? 5 : 6 },
      u_darken_top: { value: '' === this.conf.darkenTop ? 1 : 0 },
      u_active_colors: { value: this.conf.activeColors },
      u_global: {
        value: {
          noiseFreq: this.conf.noiseFreq,
          noiseSpeed: 5e-6
        }
      },
      u_vertDeform: {
        value: {
          incline: Math.sin(this.conf.angle) / Math.cos(this.conf.angle),
          offsetTop: -0.25,
          offsetBottom: -0.25,
          noiseFreq: [3, 4],
          noiseAmp: this.conf.amp,
          noiseSpeed: 10,
          noiseFlow: 3,
          noiseSeed: this.conf.seed
        }
      },
      u_baseColor: {
        value: this.sectionColors[0]
      },
      u_waveLayers: {
        value: []
      }
    };
    for (let i = 1; i < this.sectionColors.length; i += 1) {
      this.uniforms.u_waveLayers.value.push({
        color: this.sectionColors[i],
        noiseFreq: new THREE.Vector2(2 + i / this.sectionColors.length, 3 + i / this.sectionColors.length),
        noiseSpeed: 11 + 0.3 * i,
        noiseFlow: 6.5 + 0.3 * i,
        noiseSeed: this.conf.seed + 10 * i,
        noiseFloor: 0.1,
        noiseCeil: 0.63 + 0.07 * i
      });
    }
  }

  addObjects() {
    let gradient = this;
    this.initMaterial();
    this.material = new THREE.ShaderMaterial({
      extensions: { derivatives: '#extension GL_OES_standard_derivatives : enable' },
      side: THREE.DoubleSide,
      uniforms: this.uniforms,
      wireframe: this.conf.wireframe,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    this.geometry = new THREE.PlaneGeometry(this.width, this.height, this.xSegCount, this.ySegCount);
    this.uvNorm = new THREE.Float32BufferAttribute(this.geometry.attributes.uv.array, 2);
    for (let e = 0; e <= this.ySegCount; e++) {
      for (let t = 0; t <= this.xSegCount; t++) {
        const i = e * (this.xSegCount + 1) + t;
        this.uvNorm.array[2 * i] = (t / this.xSegCount) * 2 - 1;
        this.uvNorm.array[2 * i + 1] = 1 - (e / this.ySegCount) * 2;
      }
    }
    this.geometry.setAttribute('uvNorm', this.uvNorm);

    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.mesh);
  }

  stop() {
    this.conf.playing = false;
  }

  play() {
    if (!this.conf.playing) {
      this.conf.playing = true;
    }
  }

  render(e) {
    if (this.conf.playing && e !== void 0) {
      if (!(parseInt(e, 10) % 2 == 0)) {
        this.t += this.conf.noiseSpeed;
        this.renderer.render(this.scene, this.camera);
      } else {
        this.t += this.conf.noiseSpeed;
        this.mesh.material.uniforms.u_time.value = this.t;
        this.renderer.render(this.scene, this.camera);
      }
    }
    requestAnimationFrame(this.render.bind(this));
  }

  addIsLoadedClass() {
    this.container.classList.add('isLoaded');
    setTimeout(() => {
      this.container.classList.add('isLoaded');
    }, 3e3);
  }
}

new Gradient({
  dom: document.querySelector(`[data-js-controller~=Gradient]`)
});
