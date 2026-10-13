import { WebGLRenderer } from 'three';
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

        renderer.setClearColor(0xffffff);

        return renderer;
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
    }

    update() {}

    render() {
        this.renderer.render(this.sceneLego, this.sceneLego.camera);
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
