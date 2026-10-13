import { BoxGeometry, CylinderGeometry, Mesh, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const ROTATION_STEP = Math.PI / 2;

export default class Lego extends Object3D {
    constructor(options = {}) {
        super();

        this.size = options.size;
        this.color = options.color;
        this.altitude = options.altitude || 0;
        this.orientation = options.orientation;
        this.material = options.material;
        this.animation = options.animation;

        this.material.color.set(this.color);

        // this.lego = this.createLegoWithPrimitives();
        this.lego = this.createLegoWithModel();

        this.updateTransform();
    }

    createLegoWithPrimitives() {
        const container = new Object3D();

        const geometry = new BoxGeometry(1, 1, 1);
        const mesh = new Mesh(geometry, this.material);

        mesh.scale.x = this.size;

        mesh.position.x = (this.size - 1) / 2;

        container.add(mesh);

        for (let index = 1; index <= this.size; index++) {
            const cylinder = this.createCylinder();
            cylinder.position.x = index - 1;

            container.add(cylinder);
        }

        this.add(container);
    }

    async createLegoWithModel() {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync('legos.glb');
        const obj = gltf.scene.getObjectByName(`Lego_${this.size}`);

        console.log(`Lego_${this.size}`);

        obj.scale.set(0.5, 0.5, 0.5);
        obj.position.x = (this.size - 1) / 2;
        obj.rotation.y = Math.PI / 2;

        obj.traverse((child) => {
            if (child.isMesh) child.material = this.material;
        });

        this.add(obj);

        return obj;
    }

    createCylinder() {
        const geometry = new CylinderGeometry(1, 1, 1, 32, 1);
        const mesh = new Mesh(geometry, this.material);

        mesh.scale.set(0.2, 0.3, 0.2);
        mesh.position.y = 0.5;

        return mesh;
    }

    updateTransform() {
        this.position.y = this.altitude;
        this.rotation.y = ROTATION_STEP * this.orientation;
    }
}
