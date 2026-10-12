import {
    AmbientLight,
    BoxGeometry,
    DirectionalLight,
    DirectionalLightHelper,
    Mesh,
    MeshBasicMaterial,
    DoubleSide,
    MeshPhongMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    PlaneGeometry,
} from 'three';
import { OrbitControls, TransformControls } from 'three/examples/jsm/Addons.js';
import { Pane } from 'tweakpane';
import Lego from './Lego';

export default class WebGLApplication {
    constructor() {
        console.log('Hello WebGL Application');

        this.renderWidth = window.innerWidth;
        this.renderHeight = window.innerHeight;

        this.renderer = this.createRenderer();
        this.scene = this.createScene();
        this.camera = this.createCamera();
        this.controls = this.createControls();
        this.mesh = this.createMesh();
        this.lights = this.createLights();
        this.floor = this.createFloor();
        this.lego = this.createLego();

        this.debugger = this.createDebugger();

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

    createScene() {
        const scene = new Scene();

        return scene;
    }

    createCamera() {
        const camera = new PerspectiveCamera(75, this.renderWidth / this.renderHeight, 0.1, 1000);

        camera.position.z = 5;

        return camera;
    }

    createFog() {
        const fog = new Fog();

        this.scene.fog
    }

    resetCameraPosition() {
        this.camera.position.set(0, 0, 5);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    createControls() {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);

        const savedPosition = JSON.parse(sessionStorage.getItem('cameraPosition'));
        const savedTarget = JSON.parse(sessionStorage.getItem('cameraTarget'));

        if (savedPosition) this.camera.position.set(savedPosition.x, savedPosition.y, savedPosition.z);
        if (savedTarget) controls.target.set(savedTarget.x, savedTarget.y, savedTarget.z);

        controls.update();

        return controls;
    }

    createMesh() {
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshPhongMaterial({ color: 'white' });
        const mesh = new Mesh(geometry, material);

        this.scene.add(mesh);

        return mesh;
    }

    createLights() {
        const lights = {};

        lights.ambient = new AmbientLight(0xffffff, 1);

        this.scene.add(lights.ambient);

        lights.directional = new DirectionalLight(0xffffff);
        lights.directional.position.x = 10;
        lights.directional.position.y = 10;
        lights.directional.target.position.set(0, 0, 0);

        lights.directional.helper = new DirectionalLightHelper(lights.directional, 1, 0xff0000);
        lights.directional.controls = new TransformControls(this.camera, this.renderer.domElement);

        lights.directional.controls.attach(lights.directional);
        // this.scene.add(lights.directional.controls.getHelper());

        this.scene.add(lights.directional);
        // this.scene.add(lights.directional.helper);

        return lights;
    }

    createFloor() {
        const geometry = new PlaneGeometry(1, 1, 1);
        const material = new MeshPhongMaterial();
        const mesh = new Mesh(geometry, material);

        mesh.scale.set(100, 100, 100);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = -0.5;

        this.scene.add(mesh);

        return mesh;
    }

    createLego() {
        const lego = new Lego({
            color: 0xff0000,
            size: 1,
        });

        this.scene.add(lego);

        return lego;
    }

    resize() {
        this.renderer.setSize(this.renderWidth, this.renderHeight);
        this.camera.aspect = this.renderWidth / this.renderHeight;
        this.camera.updateProjectionMatrix();
    }

    update() {}

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Events
     */
    setupEventListeners() {
        window.addEventListener('resize', this.resizeHandler.bind(this));
        this.controls.addEventListener('change', this.controlsChangeHandler.bind(this));
        this.lights.directional.controls.addEventListener('change', this.lightControlsChangeHandler.bind(this));

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

    controlsChangeHandler() {
        sessionStorage.setItem('cameraPosition', JSON.stringify(this.camera.position));
        sessionStorage.setItem('cameraTarget', JSON.stringify(this.controls.target));
    }

    lightControlsChangeHandler() {
        this.lights.directional.target.position.set(0, 0, 0);
        this.lights.directional.helper.update();
    }

    /**
     * Debug
     */
    createDebugger() {
        const pane = new Pane({ title: 'WebGL App' });

        const cameraChangedHandler = () => {
            this.camera.updateProjectionMatrix();
        };

        const cameraFolder = pane.addFolder({ title: 'Camera' });

        cameraFolder.addBinding(this.camera, 'fov', { min: 15, max: 100 }).on('change', cameraChangedHandler);
        cameraFolder.addBinding(this.camera, 'near', { min: 0.00001, max: 10 }).on('change', cameraChangedHandler);
        cameraFolder.addBinding(this.camera, 'far', { min: 1, max: 1000 }).on('change', cameraChangedHandler);
        cameraFolder.addBinding(this.controls, 'enabled');
        cameraFolder.addButton({ title: 'Reset Camera' }).on('click', () => {
            sessionStorage.removeItem('cameraPosition');
            sessionStorage.removeItem('cameraTarget');
            this.resetCameraPosition();
        });

        return pane;
    }
}
