function modulo(value, n) {
    return ((value % n) + n) % n;
}

export default class LegoPropsManager {
    constructor(options = {}) {
        this.colorIndex = 0;
        this.orientation = 0;
        this.oritentationMax = 3;
        this.colors = [0xff0000, 0x0000ff, 0x00ffff];
        this.maxSize = 3;
        this.size = 1;
    }

    get color() {
        return this.colors[this.colorIndex];
    }

    get rotation() {
        return this.orientation * (Math.PI / 2);
    }

    nextColor() {
        this.colorIndex += 1;
        this.colorIndex = this.colorIndex % this.colors.length;

        return this.color;
    }

    nextSize() {
        if (this.size === this.maxSize) return this.size;
        return this.size++;
    }

    previousSize() {
        if (this.size === 1) return 1;
        return (this.size -= 1);
    }

    nextOrientation() {
        this.orientation = modulo(this.orientation + 1, this.oritentationMax + 1);
        return this.rotation;
    }

    previousOrientation() {
        this.orientation = modulo(this.orientation - 1, this.oritentationMax + 1);
        return this.rotation;
    }
}
