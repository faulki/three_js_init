import { BoxGeometry, CylinderGeometry, Mesh, MeshNormalMaterial, MeshPhongMaterial, Object3D } from 'three';

const ROTATION_STEP = Math.PI / 2;

export default class Lego extends Object3D {
    constructor(options = {}) {
        super();

        this.size = Math.max(options.size, 1);
        this.color = options.color;
        this.altitude = options.altitude;
        this.orientation = options.orientation;

        this.box = this.createBox();
        this.cylinders = this.createCylinders();

        this.updateTransform();
    }

    createBox() {
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshPhongMaterial({ color: this.color });
        const mesh = new Mesh(geometry, material);

        mesh.scale.x = this.size;

        mesh.position.x = (this.size - 1) / 2;

        this.add(mesh);

        return mesh;
    }

    createCylinders() {
        const cylinders = [];

        for (let index = 1; index <= this.size; index++) {
            const cylinder = this.createCylinder();
            cylinder.position.x = index - 1;
        }

        return cylinders;
    }

    createCylinder() {
        const geometry = new CylinderGeometry(1, 1, 1, 32, 1);
        const material = new MeshPhongMaterial({ color: this.color });
        const mesh = new Mesh(geometry, material);

        mesh.scale.set(0.2, 0.3, 0.2);
        mesh.position.y = 0.5;

        this.add(mesh);

        return mesh;
    }

    updateTransform() {
        this.position.y = this.altitude;
        this.rotation.y = ROTATION_STEP * this.orientation;
    }
}
