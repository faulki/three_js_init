import {
    BoxGeometry,
    Mesh,
    MeshBasicMaterial,
    Scene,
    PlaneGeometry,
    Fog,
    CanvasTexture,
    NearestFilter,
    RepeatWrapping,
    Raycaster,
    Vector2,
    MeshPhysicalMaterial,
    FloatType,
    EquirectangularReflectionMapping,
    Object3D,
} from 'three';
import { HDRLoader } from 'three/examples/jsm/Addons.js';
import Lego from './Lego';
import { PMREMGenerator } from 'three';
import CameraManager from './CameraManager';
import LightsManager from './LightsManager';
import LegoPropsManager from './LegoPropsManager';
import { animate, utils, createDraggable, spring } from 'animejs';

const GRID_SIZE = 51;

export default class SceneLego extends Scene {
    constructor(options = {}) {
        super();

        this.renderer = options.renderer;
        this.debugger = options.debugger;

        this.mouseCellX = 0;
        this.mouseCellY = 0;
        this.mouseCellIndex = 0;

        this.gridAltitudeData = this.createGridAltitudeData();

        this.raycaster = new Raycaster();
        this.mousePosition = new Vector2();
        this.mouseGridPosition = new Vector2();

        this.legoPropsManager = new LegoPropsManager();

        this.fog = this.createFog();
        this.debugFolder = this.createDebugFolder();
        this.cameraManager = this.createCameraManager();
        this.envmap = this.createEnvmap();
        this.legoMaterial = this.createLegoMaterial();
        this.lego = this.createLego();
        this.floorTexture = this.createFloorTexture();
        this.floor = this.createFloor();
        this.mouseGhost = this.createMouseGhost();
        this.lightsManager = this.createLightsManager();

        this.raycaster = new Raycaster();
        this.mousePosition = new Vector2();
        this.mouseGridPosition = new Vector2();

        this.updateGhostSize();
        this.setupEventListeners();
    }

    get camera() {
        return this.cameraManager.camera;
    }

    createGridAltitudeData() {
        const data = new Array(GRID_SIZE * GRID_SIZE).fill(0);

        return data;
    }

    createCameraManager() {
        const cameraManager = new CameraManager({
            renderer: this.renderer,
            debugger: this.debugFolder,
        });

        return cameraManager;
    }

    createFog() {
        const fog = new Fog(0xffffff, 10, 50);

        this.fog = fog;

        return fog;
    }

    createLightsManager() {
        const lightsManager = new LightsManager({
            scene: this,
            renderer: this.renderer,
            debugger: this.debugFolder,
            cameraManager: this.cameraManager,
        });

        return lightsManager;
    }

    createLegoMaterial() {
        const material = new MeshPhysicalMaterial({
            color: 'red',
            clearcoat: 0.1,
            metalness: 0.1,
            clearcoatRoughness: 0.1,
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

        this.add(mesh);

        return mesh;
    }

    createMouseGhost() {
        const container = new Object3D();

        this.add(container);

        const mouseGhostMesh = new Mesh(
            new BoxGeometry(1, 1, 1),
            new MeshBasicMaterial({ color: this.legoPropsManager.color, opacity: 0.1, transparent: true }),
        );

        mouseGhostMesh.material.depthTest = false;
        mouseGhostMesh.material.depthWrite = false;

        container.add(mouseGhostMesh);

        return container;
    }

    updateGhostSize() {
        this.mouseGhost.children[0].position.x = (this.legoPropsManager.size - 1) / 2;
        this.mouseGhost.children[0].scale.x = this.legoPropsManager.size;
    }

    createLego() {
        const orientation = this.legoPropsManager.orientation;
        const size = this.legoPropsManager.size;

        this.mouseCellX = this.mouseGridPosition.x + Math.floor(GRID_SIZE / 2);
        this.mouseCellY = this.mouseGridPosition.y + Math.floor(GRID_SIZE / 2);

        const altitude = this.getAltitude(this.mouseCellX, this.mouseCellY, this.legoPropsManager.size, orientation);

        const lego = new Lego({
            color: this.legoPropsManager.color,
            size: size,
            orientation: orientation,
            altitude: altitude,
            material: this.legoMaterial.clone(),
        });

        this.add(lego);

        this.updateAltitude(this.mouseCellX, this.mouseCellY, size, orientation);

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
            this.environment = generator.fromEquirectangular(texture, null).texture;
            generator.dispose();
        });
    }

    raycast() {
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
        const intersects = this.raycaster.intersectObject(this.floor, false);

        if (intersects.length === 0) return;

        const x = intersects[0].point.x;
        const y = intersects[0].point.z;

        this.mouseGridPosition.x = Math.round(x);
        this.mouseGridPosition.y = Math.round(y);

        this.mouseGhost.position.x = this.mouseGridPosition.x;
        this.mouseGhost.position.z = this.mouseGridPosition.y;

        this.mouseCellX = this.mouseGridPosition.x + Math.floor(GRID_SIZE / 2);
        this.mouseCellY = this.mouseGridPosition.y + Math.floor(GRID_SIZE / 2);
        this.mouseCellIndex = this.getFlatIndex(this.mouseCellX, this.mouseCellY);

        const altitude = this.getAltitude(
            this.mouseCellX,
            this.mouseCellY,
            this.legoPropsManager.size,
            this.legoPropsManager.orientation,
        );

        this.mouseGhost.position.y = altitude;
    }

    getOffset(orientation) {
        const offsets = [
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
        ];

        const offset = offsets[orientation];

        return offset;
    }

    getAltitude(x, y, size, orientation) {
        const baseAltitude = this.gridAltitudeData[this.getFlatIndex(x, y)];

        if (size === 1) return baseAltitude;

        const altitudes = [baseAltitude];

        const offset = this.getOffset(orientation);

        for (let i = 1; i < size; i++) {
            const newAltitude = this.gridAltitudeData[this.getFlatIndex(x + i * offset.x, y + i * offset.y)];
            altitudes.push(newAltitude);
        }

        const higherAltitude = altitudes.sort((a, b) => b - a)[0];

        return higherAltitude;
    }

    updateAltitude(x, y, size, orientation) {
        if (size === 1) {
            this.gridAltitudeData[this.getFlatIndex(x, y)]++;
            return;
        }

        const altitude = this.getAltitude(x, y, size, orientation);
        const offset = this.getOffset(orientation);

        this.gridAltitudeData[this.getFlatIndex(x, y)] = altitude + 1;

        for (let i = 1; i < size; i++) {
            this.gridAltitudeData[this.getFlatIndex(x + i * offset.x, y + i * offset.y)] = altitude + 1;
        }
    }

    getFlatIndex(x, y) {
        return x * GRID_SIZE + y;
    }

    resize(width, height) {
        this.renderWidth = width;
        this.renderHeight = height;

        this.cameraManager.resize(width, height);
    }

    /**
     * Events
     */
    setupEventListeners() {
        window.addEventListener('keydown', this.keydownHandler.bind(this));
        window.addEventListener('pointerdown', this.pointerdownHandler.bind(this));
        window.addEventListener('pointerup', this.pointerupHandler.bind(this));
        window.addEventListener('mousemove', this.mousemoveHandler.bind(this));
    }

    keydownHandler(e) {
        if (e.key === 'ArrowUp') {
            this.legoPropsManager.nextSize();
            this.updateGhostSize();
        }

        if (e.key === 'ArrowDown') {
            this.legoPropsManager.previousSize();
            this.updateGhostSize();
        }

        if (e.key === 'ArrowLeft') {
            const newRotation = this.legoPropsManager.previousOrientation();
            this.mouseGhost.rotation.y = newRotation;
        }

        if (e.key === 'ArrowRight') {
            const newRotation = this.legoPropsManager.nextOrientation();
            this.mouseGhost.rotation.y = newRotation;
        }

        if (e.code === 'Space') {
            const color = this.legoPropsManager.nextColor();
            this.mouseGhost.children[0].material.color.set(color);
        }
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

        this.createLego(2);
    }

    mousemoveHandler(e) {
        this.mousePosition.x = (e.clientX / this.renderWidth) * 2 - 1;
        this.mousePosition.y = -(e.clientY / this.renderHeight) * 2 + 1;

        this.raycast();
    }

    /**
     * Debug
     */
    createDebugFolder() {
        if (!this.debugger) return;

        const sceneFolder = this.debugger.addFolder({ title: 'Scene Lego', expanded: false });

        const fogFolder = sceneFolder.addFolder({ title: 'Fog' });
        fogFolder.addBinding(this.fog, 'near', { min: 0, max: 100 });
        fogFolder.addBinding(this.fog, 'far', { min: 0, max: 100 });
        fogFolder.addBinding(this.fog, 'color');

        return sceneFolder;
    }
}
