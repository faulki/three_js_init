import {
    AmbientLight,
    DirectionalLight,
    DirectionalLightHelper,
    SpotLight,
    Mesh,
    CylinderGeometry,
     MeshBasicMaterial,
    AdditiveBlending,
    DoubleSide,
} from 'three';
import { TransformControls } from 'three/examples/jsm/Addons.js';

export default class LightsManager {
    constructor(options = {}) {
        this.scene = options.scene;
        this.renderer = options.renderer;
        this.debugger = options.debugger;
        this.cameraManager = options.cameraManager;

        this.settings = {
            helper: false,
        };

        // this.ambient = this.createAmbient();
        this.directional = this.createDirectional();

        this.spot = this.createSpot();
        this.beam = this.createBeam();

        this.debugFolder = this.createDebugFolder();

        this.setupEventListeners();
    }

    createSpot() {
        const spot = new SpotLight(0xffffff, 300, 0, Math.PI / 12, 0.4, 2);
        spot.position.set(0, 12, 0);

        this.scene.add(spot);
        this.scene.add(spot.target);

        return spot;
    }

    createBeam() {
        const geometry = new CylinderGeometry(0.0, 1, 1, 64, 1, true);
        geometry.translate(0, -0.5, 0);
        geometry.rotateX(-Math.PI / 2);

        const material = new MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
            side: DoubleSide,
        });

        const beam = new Mesh(geometry, material);
        this.scene.add(beam);

        return beam;
    }

    update(targetPosition) {
        this.spot.target.position.copy(targetPosition);

        this.beam.position.copy(this.spot.position);
        this.beam.lookAt(targetPosition);   

        const length = this.spot.position.distanceTo(targetPosition) * 1.3;
        const radius = Math.tan(this.spot.angle) * length;
        this.beam.scale.set(radius, radius, length);

        this.beam.material.color.copy(this.spot.color);
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
        const spotFolder = lightsFolder.addFolder({ title: 'Spot' });

        console.log(this.directional.controls);

        spotFolder.addBinding(this.spot, 'color', { color: { type: 'float' } });
        spotFolder.addBinding(this.spot, 'intensity', { min: 0, max: 1000 });
        spotFolder.addBinding(this.spot, 'angle', { min: 0.05, max: Math.PI / 4 });
        spotFolder.addBinding(this.spot, 'penumbra', { min: 0, max: 1 });
        spotFolder.addBinding(this.spot, 'position');
        spotFolder.addBinding(this.beam, 'visible', { label: 'Beam on' });
        spotFolder.addBinding(this.beam.material, 'color', { label: 'Beam Color', color: { type: 'float' }});
        spotFolder.addBinding(this.beam.material, 'opacity', {label: 'Beam Opacity',min: 0,max: 1,step: 0.01,});

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
