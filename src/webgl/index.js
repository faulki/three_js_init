import { WebGLRenderer, ACESFilmicToneMapping, Vector2 } from 'three';
import { EffectComposer, RenderPass, UnrealBloomPass, OutputPass } from 'three/examples/jsm/Addons.js';
import { Pane } from 'tweakpane';
import SceneLego from './SceneLego';

const GRID_SIZE = 101;

export default class WebGLApplication {
    constructor() {
        this.renderWidth = window.innerWidth;
        this.renderHeight = window.innerHeight;

        this.renderer = this.createRenderer();
        this.debugger = this.createDebugger();
        this.sceneLego = this.createSceneLego();
        this.composer = this.createComposer();

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
        });

        return scene;
    }

    resize() {
        this.renderer.setSize(this.renderWidth, this.renderHeight);

        this.sceneLego.resize(this.renderWidth, this.renderHeight);

        this.composer.setSize(this.renderWidth, this.renderHeight);
    }

    update() {
        const r = Date.now() * 0.0003;
        const t = Date.now() * 0.0005;

        this.sceneLego.lego.position.x = 5 * Math.cos(r);
        this.sceneLego.lego.position.y = 5 * Math.sin(r);
        this.sceneLego.lego.position.z = 5 * Math.sin(r);

        this.sceneLego.lego.rotation.x = t
        this.sceneLego.lego.rotation.y = t

        this.sceneLego.cameraManager.controls.target.copy(this.sceneLego.lego.position);
        this.sceneLego.cameraManager.controls.update();
        this.sceneLego.lightsManager.update(this.sceneLego.lego.position);
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
    createDebugger() {
        const pane = new Pane({ title: 'WebGL App' });

        return pane;
    }
}
