import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import fragmentShader from './shader/fragment.glsl';
import vertexShader from './shader/vertex.glsl';

let d = 1;

export default class ThreeSketch {
	constructor(options) {
		this.scene = void 0;
		this.container = options.dom;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.xSegCount = Math.ceil(this.width * 0.06);
		this.ySegCount = Math.ceil(this.height * 0.16);
		this.renderer = void 0;
		this.camera = void 0;
		this.controls = void 0;
		this.uniforms = void 0;
		this.isPlaying = true;
		this.t = 1253106;
		this.last = 0;
		this.angle = 0;
		this.amp = 320;
		this.seed = 5;
		this.freqX = 14e-5;
		this.freqY = 29e-5;
		this.sectionColors = initGradientColors(this.container);

		// this.count = 0;
		// this.quadCount = this.xSegCount * this.ySegCount * 2;
		// this.vertexCount = (this.xSegCount + 1) * (this.ySegCount + 1);
		// this.sectionColors = initGradientColors(this.container);
		//

		// this.a = new THREE.Matrix4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
		// this.m = new THREE.Matrix4(2 / this.width, 0, 0, 0, 0, 2 / this.height, 0, 0, 0, 0, 2 / (-2e3 - 2e3, 0, 0, 0, 0, 1);

		this.init();
		this.addObjects();

		this.resize();
		this.render();
		this.setupResize();
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

		this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.001, 1000);
		this.camera.position.set(0, 0, 1);
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this));
	}

	resize() {
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.xSegCount = Math.ceil(this.width * 0.06);
		this.ySegCount = Math.ceil(this.height * 0.16);

		// this.imageAspect = 16 / 9;
		// let a1, a2;
		// if (this.height / this.width > this.imageAspect) {
		// 	a1 = (this.width / this.height) * this.imageAspect;
		// 	a2 = 1;
		// } else {
		// 	a1 = 1;
		// 	a2 = (this.height / this.width) * this.imageAspect;
		// }

		// this.material.uniforms.resolution.value.x = this.width;
		// this.material.uniforms.resolution.value.y = this.height;
		// this.material.uniforms.resolution.value.z = this.a1;
		// this.material.uniforms.resolution.value.w = this.a2;

		this.camera.updateProjectionMatrix();
	}

	initMaterial() {
		this.uniforms = {
			u_time: { value: 0 },
			u_shadow_power: { value: 5 },
			u_darken_top: { value: 0 },
			u_active_colors: { value: [1, 1, 1, 1] },
			u_global: {
				value: {
					noiseFreq: {
						value: [this.freqX, this.freqY]
					},
					noiseSpeed: {
						value: 5e-6
					}
				}
			},
			u_vertDeform: {
				value: {
					incline: {
						value: Math.sin(this.angle) / Math.cos(this.angle)
					},
					offsetTop: {
						value: -0.5
					},
					offsetBottom: {
						value: -0.5
					},
					noiseFreq: {
						value: [3, 4]
					},
					noiseAmp: {
						value: this.amp
					},
					noiseSpeed: {
						value: 10
					},
					noiseFlow: {
						value: 3
					},
					noiseSeed: {
						value: this.seed
					}
				}
			},
			u_baseColor: {
				value: this.sectionColors[0]
			},
			u_waveLayers: {
				value: waveLayers(this.sectionColors)
			},
			resolution: { value: new THREE.Vector2(this.width, this.height) }
		};

		function waveLayers(sectionColors) {
			let u_waveLayers = {
				value: []
			};
			for (let i = 1; i < sectionColors.length; i += 1) {
				u_waveLayers.value.push({
					value: {
						color: { value: sectionColors[i] },
						noiseFreq: { value: [2 + i / sectionColors.length, 3 + i / sectionColors.length] },
						noiseSpeed: { value: 11 + 0.3 * i },
						noiseFlow: { value: 6.5 + 0.3 * i },
						noiseSeed: { value: 5 + 10 * i },
						noiseFloor: { value: 0.1 },
						noiseCeil: { value: 0.63 + 0.07 * i }
					}
				});
			}
			return u_waveLayers;
		}
	}

	addObjects() {
		let threeSketch = this;
		this.initMaterial();
		this.material = new THREE.ShaderMaterial({
			extensions: { derivatives: '#extension GL_OES_standard_derivatives : enable' },
			side: THREE.DoubleSide,
			uniforms: this.uniforms,
			wireframe: true,
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
		this.isPlaying = false;
	}

	play() {
		if (!this.isPlaying) {
			this.isPlaying = true;
		}
	}

	render(e) {
		if (!this.isPlaying) return;
		if (!e) {
			e = 160;
		}
		if (((this.t += Math.min(e - this.last, 1e3 / 15)), (this.last = e))) {
			let e = 160;
			(e = -160), (this.t += e);
		}
		this.material.uniforms.u_time.value = this.t;
		requestAnimationFrame(this.render.bind(this));
		this.renderer.render(this.scene, this.camera);
	}
}
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
	// return new THREE.Color(rgbColor[0], rgbColor[1], rgbColor[2]);
}

new ThreeSketch({
	dom: document.querySelector(`[data-js-controller~=Gradient]`)
});
