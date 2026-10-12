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
    Fog,
    CanvasTexture,
    NearestFilter,
    RepeatWrapping,
    Raycaster,
    Vector3,
    Vector2,
    MeshPhysicalMaterial,
    FloatType,
    EquirectangularReflectionMapping,
} from 'three';
import { HDRLoader, OrbitControls, TransformControls } from 'three/examples/jsm/Addons.js';
import { Pane } from 'tweakpane';
import Lego from './Lego';
import { PMREMGenerator } from 'three';

const GRID_SIZE = 101;

export default class WebGLApplication {
    constructor() {
        this.renderWidth = window.innerWidth;
        this.renderHeight = window.innerHeight;

        this.altitude = 0;

        this.renderer = this.createRenderer();
        this.scene = this.createScene();
        this.fog = this.createFog();
        this.camera = this.createCamera();
        this.controls = this.createControls();
        this.mesh = this.createMesh();
        this.lights = this.createLights();
        this.envmap = this.createEnvmap();
        this.legoMaterial = this.createLegoMaterial();
        this.lego = this.createLego();
        this.floorTexture = this.createFloorTexture();
        this.floor = this.createFloor();
        this.mouseGhost = this.createMouseGhost();
        this.raycaster = new Raycaster();
        this.mousePosition = new Vector2();
        this.mouseGridPosition = new Vector2();

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
        const camera = new PerspectiveCamera(45, this.renderWidth / this.renderHeight, 0.1, 500);

        camera.position.z = 5;

        return camera;
    }

    createFog() {
        const fog = new Fog(0xffffff, 10, 50);

        this.scene.fog = fog;

        return fog;
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

        // this.scene.add(mesh);

        return mesh;
    }

    createLights() {
        const lights = {};

        lights.ambient = new AmbientLight(0xffffff, 1);

        this.scene.add(lights.ambient);

        lights.directional = new DirectionalLight(0xffffff, 1.5);
        lights.directional.position.x = 5;
        lights.directional.position.y = 5;
        lights.directional.position.z = 5;
        lights.directional.target.position.set(0, 0, 0);

        lights.directional.helper = new DirectionalLightHelper(lights.directional, 1, 0xff0000);
        lights.directional.controls = new TransformControls(this.camera, this.renderer.domElement);

        lights.directional.controls.attach(lights.directional);
        this.scene.add(lights.directional.controls.getHelper());

        this.scene.add(lights.directional);
        this.scene.add(lights.directional.helper);

        return lights;
    }

    createLegoMaterial() {
        const material = new MeshPhysicalMaterial({
            color: 'red',
            roughness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            // map: diffuse,
            // normalMap: normalMap,
        });

        return material;
    }

    createFloorTexture() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = 2;
        canvas.height = 2;

        context.fillStyle = '#F1F1F1';
        context.fillRect(0, 0, 1, 1);
        context.fillRect(1, 1, 1, 1);

        context.fillStyle = '#BFBFBF';
        context.fillRect(1, 0, 1, 1);
        context.fillRect(0, 1, 1, 1);

        const canvasTexture = new CanvasTexture(canvas);
        canvasTexture.minFilter = NearestFilter;
        canvasTexture.magFilter = NearestFilter;
        canvasTexture.wrapS = RepeatWrapping;
        canvasTexture.wrapT = RepeatWrapping;
        canvasTexture.repeat.set(GRID_SIZE / 2, GRID_SIZE / 2);

        return canvasTexture;
    }

    createFloor() {
        const geometry = new PlaneGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({ map: this.floorTexture });
        const mesh = new Mesh(geometry, material);

        mesh.scale.set(GRID_SIZE, GRID_SIZE, GRID_SIZE);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = -0.5;

        this.scene.add(mesh);

        return mesh;
    }

    createMouseGhost() {
        this.debugMouseMesh = new Mesh(
            new BoxGeometry(1, 1, 1),
            new MeshBasicMaterial({ color: 'red', opacity: 0.1, transparent: true }),
        );
        this.debugMouseMesh.material.depthTest = false;
        this.debugMouseMesh.material.depthWrite = false;
        this.scene.add(this.debugMouseMesh);
    }

    createLego() {
        const colors = [0xff0000, 0x0000ff, 0xffff00];
        const randomColorIndex = Math.floor(Math.random() * colors.length);
        const randomSize = Math.floor(Math.random() * 2) + 1;
        const orientation = Math.floor(Math.random() * 3);

        const lego = new Lego({
            color: colors[randomColorIndex],
            size: randomSize,
            orientation: orientation,
            altitude: this.altitude,
            material: this.legoMaterial,
        });

        this.scene.add(lego);

        // this.altitude++;

        if (this.mouseGridPosition) {
            lego.position.x = this.mouseGridPosition.x;
            lego.position.z = this.mouseGridPosition.y;
        }

        return lego;
    }

    async createEnvmap() {
        const loader = new HDRLoader();
        loader.setDataType(FloatType);

        loader.load('/01.hdr', (texture) => {
            texture.mapping = EquirectangularReflectionMapping;
            const generator = new PMREMGenerator(this.renderer);
            this.scene.environment = generator.fromEquirectangular(texture, null).texture;
            generator.dispose();
        });
    }

    raycast() {
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
        const intersects = this.raycaster.intersectObject(this.floor, false);

        if (intersects.length > 0) {
            const x = intersects[0].point.x;
            const y = intersects[0].point.z;

            this.mouseGridPosition.x = Math.round(x);
            this.mouseGridPosition.y = Math.round(y);

            this.debugMouseMesh.position.x = Math.round(this.mouseGridPosition.x);
            this.debugMouseMesh.position.z = Math.round(this.mouseGridPosition.y);
        }
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
        window.addEventListener('keydown', this.keydownHandler.bind(this));
        this.lights.directional.controls.addEventListener('change', this.lightControlsChangeHandler.bind(this));
        this.lights.directional.controls.addEventListener('mouseDown', this.lightControlsMouseDownHandler.bind(this));
        this.lights.directional.controls.addEventListener('mouseUp', this.lightControlsMouseUpHandler.bind(this));
        window.addEventListener('pointerdown', this.pointerdownHandler.bind(this));
        window.addEventListener('pointerup', this.pointerupHandler.bind(this));
        window.addEventListener('mousemove', this.mousemoveHandler.bind(this));

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

    keydownHandler() {
        // this.createLego();
    }

    lightControlsChangeHandler() {
        this.lights.directional.target.position.set(0, 0, 0);
        this.lights.directional.helper.update();
    }

    lightControlsMouseDownHandler() {
        this.controls.enabled = false;
    }

    lightControlsMouseUpHandler() {
        this.controls.enabled = true;
    }

    pointerdownHandler(e) {
        this.isPointerDown = true;

        this.pointerStartPosition = {
            x: e.clientX,
            y: e.clientY,
        };
    }

    pointerupHandler(e) {
        this.isPointerDown = false;

        const x = e.clientX;
        const y = e.clientY;

        const distX = x - this.pointerStartPosition.x;
        const distY = y - this.pointerStartPosition.y;
        const dist = Math.sqrt(distX * distX + distY * distY);

        const threshold = 5;

        if (dist > threshold) return;

        this.createLego();
    }

    mousemoveHandler(e) {
        this.mousePosition.x = (e.clientX / this.renderWidth) * 2 - 1;
        this.mousePosition.y = -(e.clientY / this.renderHeight) * 2 + 1;

        this.raycast();
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

        const fogFolder = pane.addFolder({ title: 'Fog' });
        fogFolder.addBinding(this.fog, 'near', { min: 0, max: 100 });
        fogFolder.addBinding(this.fog, 'far', { min: 0, max: 100 });
        fogFolder.addBinding(this.fog, 'color');

        const materialFolder = pane.addFolder({ title: 'Material' });
        materialFolder.addBinding(this.legoMaterial, 'roughness');
        materialFolder.addBinding(this.legoMaterial, 'metalness');
        materialFolder.addBinding(this.legoMaterial, 'clearcoat');
        materialFolder.addBinding(this.legoMaterial, 'clearcoatRoughness');
        materialFolder.addBinding(this.legoMaterial, 'iridescence');

        return pane;
    }
}
