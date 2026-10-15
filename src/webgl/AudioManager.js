export default class AudioManager {
    constructor(options = {}) {
        this.debugger = options.debugger;

        this.audio = new Audio('../../public/deadmau5.mp3');
        this.audio.loop = true;

        this.context = null;
        this.analyser = null;
        this.data = null;
        this.beatCallbacks = new Set();

        this.bassHistory = [];
        this.lastBeatTime = 0;
        this.beatSettings = { sensitivity: 1.3, minEnergy: 0.3, cooldown: 200 };

        this.createDebug();
    }

    onBeat(callback) {
        this.beatCallbacks.add(callback);
    }

    async toggle() {
        if (!this.context) this.setupAnalyser();
        await this.context.resume();

        if (this.audio.paused) await this.audio.play();
        else this.audio.pause();
    }

    createDebug() {
        if (!this.debugger) return;
        this.debugger.addButton({ title: 'Play / Pause' }).on('click', () => this.toggle());
        this.debugger.addBinding(this.beatSettings, 'sensitivity', { min: 1, max: 2});
        this.debugger.addBinding(this.beatSettings, 'minEnergy', { min: 0, max: 1});
        this.debugger.addBinding(this.beatSettings, 'cooldown', { min: 50, max: 600});
    }

    setupAnalyser() {
        this.context = new AudioContext();

        const source = this.context.createMediaElementSource(this.audio);
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 1024; 
        this.analyser.smoothingTimeConstant = 0.8; 

        source.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        this.data = new Uint8Array(this.analyser.frequencyBinCount);
    }

    getFrequence(minHz, maxHz) {
        const binWidth = this.context.sampleRate / this.analyser.fftSize;
        const start = Math.floor(minHz / binWidth);
        const end = Math.max(start + 1, Math.ceil(maxHz / binWidth));

        let sum = 0;
        for (let i = start; i < end; i++) sum += this.data[i];

        return sum / (end - start) / 255;
    }

    update() {
        if(!this.analyser || this.audio.paused) return;

        this.analyser.getByteFrequencyData(this.data);

        const bass = this.getFrequence(20, 150);

        this.bassHistory.push(bass);
        if (this.bassHistory.lenght > 43) this.bassHistory.shift();

        const average = this.bassHistory.reduce((a,b) => a + b, 0) / this.bassHistory.length;
        const now = performance.now();
        const { sensitivity, minEnergy, cooldown } = this.beatSettings;

        const isBeat = bass > average * sensitivity && bass > minEnergy && now - this.lastBeatTime > cooldown

        if (isBeat) {
            this.lastBeatTime = now;
            this.beatCallbacks.forEach((cb) => cb(bass))
        }
    }
}

