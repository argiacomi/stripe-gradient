import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import fragmentShader from './shader/fragment.glsl';
import vertexShader from './shader/vertex.glsl';

let count = 1;
export default class Gradient {
  constructor(options) {
    this.conf = {
      wireframe: true,
      density: [0.06, 0.16],
      playing: true
    };
    this.scene = void 0;
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.xSegCount = Math.ceil(this.width * this.conf.density[0]);
    this.ySegCount = Math.ceil(this.height * this.conf.density[1]);
    this.renderer = void 0;
    this.camera = void 0;
    this.controls = void 0;
    this.uniforms = void 0;
    this.t = 1253106.0;
    this.last = 0.0;
    this.angle = 0.0;
    this.freqX = 14e-5;
    this.freqY = 29e-5;
    this.sectionColors = initGradientColors(this.container);
    this.m = new THREE.Matrix4(2 / this.width, 0, 0, 0, 0, 2 / this.height, 0, 0, 0, 0, 2 / (-2e3 - 2e3, 0, 0, 0, 0, 1));

    // this.quadCount = this.xSegCount * this.ySegCount * 2;
    // this.vertexCount = (this.xSegCount + 1) * (this.ySegCount + 1);
    // this.a = new THREE.Matrix4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

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
          return '0x' + hex.substring(1);
        })
        .filter(Boolean)
        .map(normalizeColor);
      return sectionColors;
    }

    function normalizeColor(hexCode) {
      return [((hexCode >> 16) & 255) / 255, ((hexCode >> 8) & 255) / 255, (255 & hexCode) / 255];
    }

    this.init();
    this.addObjects();
    this.onWindowResize();
    this.setupWindowResize();
    this.render();
  }

  init() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.container,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // this.camera = new THREE.OrthographicCamera(this.width / -2, this.width / 2, this.height / 2, this.height / -2, 1, 1000);
    // this.camera.projectionMatrix = this.m;
    // console.log(this.camera);
    // console.log(this.m);

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.001, 1000);
    this.camera.position.set(0, 0, 1);
    this.camera.projectionMatrix = this.m;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  setupWindowResize() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  onWindowResize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.xSegCount = Math.ceil(this.width * 0.06);
    this.ySegCount = Math.ceil(this.height * 0.16);

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  initMaterial() {
    function waveLayers(sectionColors) {
      let u_waveLayers = {
        value: []
      };
      for (let i = 1; i < sectionColors.length; i += 1) {
        u_waveLayers.value.push({
          value: {
            color: { value: sectionColors[i] },
            noiseFreq: { value: new THREE.Vector2(2.0 + i / sectionColors.length, 3.0 + i / sectionColors.length) },
            noiseSpeed: { value: 11.0 + 0.3 * i },
            noiseFlow: { value: 6.5 + 0.3 * i },
            noiseSeed: { value: 5.0 + 10.0 * i },
            noiseFloor: { value: 0.1 },
            noiseCeil: { value: 0.63 + 0.07 * i }
          }
        });
      }
      return u_waveLayers;
    }
    this.uniforms = {
      u_time: { value: 0 },
      u_baseColor: { value: this.sectionColors[0] },
      u_globalNoiseFreq: { value: new THREE.Vector2(this.freqX, this.freqY) },
      u_globalNoiseSpeed: { value: 5e-6 },
      u_resolution: { value: new THREE.Vector2(this.width, this.height) },
      u_vertDeformNoiseAmp: { value: 320.0 },
      u_vertDeformNoiseFlow: { value: 3.0 },
      u_vertDeformNoiseFreq: { value: new THREE.Vector2(3.0, 4.0) },
      u_vertDeformIncline: { value: Math.sin(this.angle) / Math.cos(this.angle) },
      u_vertDeformNoiseSeed: { value: 5.0 },
      u_vertDeformNoiseSpeed: { value: 10.0 },
      u_vertDeformOffsetBottom: { value: -0.5 },
      u_vertDeformOffsetTop: { value: -0.5 }
    };
  }

  addObjects() {
    let gradient = this;
    this.initMaterial();
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      wireframe: this.conf.wireframe,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    // geometry = new THREE.PlaneGeometry(width, height, xSegCount, ySegCount);
    this.geometry = new THREE.PlaneGeometry(1, 1, this.xSegCount, this.ySegCount);

    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.mesh);
  }

  addLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.5);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(0.5, 0, 0.866);
    this.scene.add(light1, light2);
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
    if (this.conf.playing) {
      if (e) {
        this.t += Math.min(e - this.last, 1e3 / 15);
        this.last = e;
        this.mesh.material.uniforms.u_time.value = this.t;
        this.renderer.render(this.scene, this.camera);

        if (0 !== this.last) {
          this.renderer.render(this.scene, this.camera);
        }
      }
      requestAnimationFrame(this.render.bind(this));
    }
  }
}

new Gradient({
  dom: document.querySelector(`[data-js-controller~=Gradient]`)
});
