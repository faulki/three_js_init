import {
    AmbientLight,
    DirectionalLight,
    DirectionalLightHelper,
    SpotLight,
    Mesh,
    CylinderGeometry,
    ShaderMaterial,
    AdditiveBlending,
    DoubleSide,
    Color,
} from 'three';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import gsap from 'gsap';
import beamVertexShader from './shaders/beam/vertex.glsl?raw';
import beamFragmentShader from './shaders/beam/fragment.glsl?raw';

const SPOT_COUNT = 6;

export default class LightsManager {
    constructor(options = {}) {
        this.scene = options.scene;
        this.renderer = options.renderer;
        this.debugger = options.debugger;
        this.cameraManager = options.cameraManager;

        this.settings = {
            helper: false,
            color: new Color(0x3b4288),
            intensity: 300,
            beamOpacity: 0.35,
            decayDistance: 1,
            decayIntensity: 0.7,
            edgeSoftness: 0.5,
            fadeDuration: 1.2,
            angle: Math.PI / 12,
            penumbra: 0.4,
            beams: true,
        };

        // this.ambient = this.createAmbient();
        this.directional = this.createDirectional();

        this.spots = this.createSpots();
        this.lastSpotIndex = -1;

        this.audioManager = options.audioManager;
        this.audioManager?.onNote(() => this.flashRandomSpot());

        this.debugFolder = this.createDebugFolder();

        this.setupEventListeners();
    }

    createSpots() {
        const spots = [];

        for (let i = 0; i < SPOT_COUNT; i++) {
            const angle = (i / SPOT_COUNT) * Math.PI * 2;
            const x = Math.cos(angle) * 12;
            const y = i % 2 === 0 ? 10 : -10;
            const z = Math.sin(angle) * 12;

            const spot = this.createSpot(x, y, z);
            spot.beam = this.createBeam();

            spots.push(spot);
        }

        return spots;
    }

    createSpot(x, y, z) {
        const spot = new SpotLight(this.settings.color, 0, 0, this.settings.angle, this.settings.penumbra, 2);
        spot.position.set(x, y, z);

        this.scene.add(spot);
        this.scene.add(spot.target);

        return spot;
    }

    createBeam() {
        const geometry = new CylinderGeometry(0.0, 1, 1, 64, 1, true);
        geometry.translate(0, -0.5, 0);
        geometry.rotateX(-Math.PI / 2);

        const material = new ShaderMaterial({
            vertexShader: beamVertexShader,
            fragmentShader: beamFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            side: DoubleSide,
            uniforms: {
                uColor: { value: new Color() },
                uOpacity: { value: 0 },
                uDecayIntensity: { value: this.settings.decayIntensity },
                uDecayDistance: { value: this.settings.decayDistance },
                uEdgeSoftness: { value: this.settings.edgeSoftness },
            },
        });

        const beam = new Mesh(geometry, material);
        this.scene.add(beam);

        return beam;
    }

    flashRandomSpot() {
        let index = Math.floor(Math.random() * SPOT_COUNT);
        if (index === this.lastSpotIndex) index = (index + 1) % SPOT_COUNT;
        this.lastSpotIndex = index;

        this.flash(this.spots[index]);
    }

    flash(spot) {
        const { intensity, beamOpacity, fadeDuration } = this.settings;

        const beamOpacityUniform = spot.beam.material.uniforms.uOpacity;

        gsap.killTweensOf([spot, beamOpacityUniform]);

        spot.intensity = intensity;
        beamOpacityUniform.value = beamOpacity;

        gsap.to(spot, { intensity: 0, duration: fadeDuration, ease: 'power2.out' });
        gsap.to(beamOpacityUniform, { value: 0, duration: fadeDuration, ease: 'power2.out' });
    }

    update(targetPosition) {
        for (const spot of this.spots) {
            spot.target.position.copy(targetPosition);
            spot.angle = this.settings.angle;
            spot.penumbra = this.settings.penumbra;
            spot.color.copy(this.settings.color);

            const beam = spot.beam;
            beam.visible = this.settings.beams;
            beam.position.copy(spot.position);
            beam.lookAt(targetPosition);

            const length = spot.position.distanceTo(targetPosition) * 1.3;
            const radius = Math.tan(spot.angle) * length;
            beam.scale.set(radius, radius, length);

            const uniforms = beam.material.uniforms;
            uniforms.uColor.value.copy(spot.color);
            uniforms.uDecayDistance.value = this.settings.decayDistance;
            uniforms.uDecayIntensity.value = this.settings.decayIntensity;
            uniforms.uEdgeSoftness.value = this.settings.edgeSoftness;
        }
    }

        createAmbient() {
            const ambient = new AmbientLight(0xffffff, 1.5);

            this.scene.add(ambient);

            return ambient;
        }

    createDirectional() {
        const directional = new DirectionalLight(0xffffff, 2);
        directional.position.set(10, 10, 5);
        directional.target.position.set(0, 0, 0);

        directional.helper = new DirectionalLightHelper(directional, 1, 0xff0000);
        directional.controls = new TransformControls(this.cameraManager.camera, this.renderer.domElement);

        this.scene.add(directional.controls.getHelper());

        this.scene.add(directional);
        this.scene.add(directional.helper);

        if (this.settings.helper) directional.controls.attach(directional);
        if (!this.settings.helper) directional.helper.visible = false;

        return directional;
    }

    /**
     * Events
     */
    setupEventListeners() {
        this.directional.controls.addEventListener('change', this.lightControlsChangeHandler.bind(this));
        this.directional.controls.addEventListener('mouseDown', this.lightControlsMouseDownHandler.bind(this));
        this.directional.controls.addEventListener('mouseUp', this.lightControlsMouseUpHandler.bind(this));
    }

    lightControlsChangeHandler() {
        this.directional.target.position.set(0, 0, 0);
        this.directional.helper.update();
    }

    lightControlsMouseDownHandler() {
        this.cameraManager.controls.enabled = false;
    }

    lightControlsMouseUpHandler() {
        this.cameraManager.controls.enabled = true;
    }

    /**
     * Debug
     */
    createDebugFolder() {
        if (!this.debugger) return;

        const lightsFolder = this.debugger.addFolder({ title: 'Lights' });
        const spotFolder = lightsFolder.addFolder({ title: 'Spots' });

        spotFolder.addBinding(this.settings, 'color', { color: { type: 'float' } });
        spotFolder.addBinding(this.settings, 'intensity', { min: 0, max: 1000 });
        spotFolder.addBinding(this.settings, 'beamOpacity', { min: 0, max: 1 });
        spotFolder.addBinding(this.settings, 'fadeDuration', { min: 0.1, max: 3 });
        spotFolder.addBinding(this.settings, 'angle', { min: 0.05, max: Math.PI / 4 });
        spotFolder.addBinding(this.settings, 'penumbra', { min: 0, max: 1 });
        spotFolder.addBinding(this.settings, 'beams', { label: 'Beams on' });
        spotFolder.addBinding(this.settings, 'decayDistance', { min: 0, max: 1.5 });
        spotFolder.addBinding(this.settings, 'decayIntensity', { min: 0, max: 1.5 });
        spotFolder.addBinding(this.settings, 'edgeSoftness', { min: 0.01, max: 1 });
        spotFolder.addButton({ title: 'Test flash' }).on('click', () => this.flashRandomSpot());

        lightsFolder.addBinding(this.directional, 'color', { label: 'Directional Color', color: { type: 'float' } });
        lightsFolder.addBinding(this.directional, 'intensity', { label: 'Directional Intensity' });
        lightsFolder.addBinding(this.settings, 'helper', { label: 'Helper' }).on('change', () => {
            if (this.settings.helper) {
                this.directional.controls.attach(this.directional);
                this.directional.helper.visible = true;
            } else {
                this.directional.controls.detach();
                this.directional.helper.visible = false;
            }
        });

        return lightsFolder;
    }
}
