import { WebGLRenderer, ACESFilmicToneMapping, Vector2, Vector3 } from 'three';
import { EffectComposer, RenderPass, UnrealBloomPass, OutputPass } from 'three/examples/jsm/Addons.js';
import { Pane } from 'tweakpane';
import SceneLego from './SceneLego';
import AudioManager from './AudioManager';

const GRID_SIZE = 101;

export default class WebGLApplication {
    constructor() {
        this.renderWidth = window.innerWidth;
        this.renderHeight = window.innerHeight;

        this.renderer = this.createRenderer();
        this.debugger = this.createDebugger();
        this.audioManager = new AudioManager({ debugger: this.debugger });
        this.sceneLego = this.createSceneLego();
        this.composer = this.createComposer();

        this.departureSettings = {
            duration: 12,
            distance: 80,
        };
        this.departureDirection = new Vector3();
        this.createDepartureDebug();

        this.resize();  

        this.setupEventListeners();
    }

    /**
     * Public
     */

    /**
     * Private
     */

    createRenderer() {
        const renderer = new WebGLRenderer({
            canvas: document.querySelector('canvas'),
        });
        
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.setClearColor(0x000000);

        return renderer;
    }

    createComposer() {
        const composer = new EffectComposer(this.renderer);

        composer.addPass(new RenderPass(this.sceneLego, this.sceneLego.camera));

        this.bloomPass = new UnrealBloomPass(new Vector2(this.renderWidth, this.renderHeight), 0.6, 0.4, 0.8);
        composer.addPass(this.bloomPass);

        composer.addPass(new OutputPass());

        if (this.debugger) {
            const bloomFolder = this.debugger.addFolder({ title: 'Bloom' });
            bloomFolder.addBinding(this.bloomPass, 'strength', { min: 0, max: 3 });
            bloomFolder.addBinding(this.bloomPass, 'radius', { min: 0, max: 1 });
            bloomFolder.addBinding(this.bloomPass, 'threshold', { min: 0, max: 1 });
            bloomFolder.addBinding(this.bloomPass, 'enabled', { label: 'Bloom on' });
        }

        return composer;
    }

    createSceneLego() {
        const scene = new SceneLego({
            renderer: this.renderer,
            debugger: this.debugger,
            audioManager: this.audioManager,
        });

        return scene;
    }

    resize() {
        this.renderer.setSize(this.renderWidth, this.renderHeight);

        this.sceneLego.resize(this.renderWidth, this.renderHeight);

        this.composer.setSize(this.renderWidth, this.renderHeight);
    }

    update() {
        this.audioManager.update();

        const r = Date.now() * 0.0003;
        const t = Date.now() * 0.0005;

        this.sceneLego.lego.position.x = 5 * Math.cos(r);
        this.sceneLego.lego.position.y = 5 * Math.sin(r);
        this.sceneLego.lego.position.z = 5 * Math.sin(r);

        this.sceneLego.lego.rotation.x = t
        this.sceneLego.lego.rotation.y = t

        this.updateDeparture();

        this.sceneLego.cameraManager.controls.target.copy(this.sceneLego.lego.position);
        this.sceneLego.cameraManager.controls.update();
        this.sceneLego.lightsManager.update(this.sceneLego.lego.position);

        this.sceneLego.update();
    }

    updateDeparture() {
        const lego = this.sceneLego.lego;
        const camera = this.sceneLego.camera;
        const { duration, distance } = this.departureSettings;

        const elapsed = this.audioManager.audio.currentTime - this.audioManager.lastNoteTime;
        const progress = Math.min(Math.max(elapsed / duration, 0), 1);

        const eased = progress * progress;

        this.departureDirection.subVectors(lego.position, camera.position).normalize();
        lego.position.addScaledVector(this.departureDirection, eased * distance);
    }

    render() {
        this.composer.render();
    }

    /**
     * Events
     */
    setupEventListeners() {
        window.addEventListener('resize', this.resizeHandler.bind(this));
        this.tickHandler();
    }

    resizeHandler() {
        this.renderWidth = window.innerWidth;
        this.renderHeight = window.innerHeight;

        this.resize();
    }

    tickHandler() {
        window.requestAnimationFrame(this.tickHandler.bind(this));

        this.update();
        this.render();
    }

    /**
     * Debug
     */
    createDepartureDebug() {
        const departureFolder = this.debugger.addFolder({ title: 'Départ du lego' });
        departureFolder.addBinding(this.departureSettings, 'duration', { min: 1, max: 15 });
        departureFolder.addBinding(this.departureSettings, 'distance', { min: 10, max: 150 });
        departureFolder.addButton({ title: 'Aller au dernier coup' }).on('click', () => {
            this.audioManager.audio.currentTime = this.audioManager.lastNoteTime - 3;
        });
    }

    createDebugger() {
        const pane = new Pane({ title: 'WebGL App' });

        return pane;
    }
}
