export default class AudioManager {
    constructor(options = {}) {
        this.debugger = options.debugger;

        this.audio = new Audio('/music.mp3');
        this.audio.loop = true;

        this.context = null;
        this.analyser = null;
        this.data = null;
        this.beatCallbacks = new Set();

        this.createDebug();
    }

    async toggle() {
        if (!this.context) this.setupAnalyser(); // créé au premier clic
        await this.context.resume();

        if (this.audio.paused) await this.audio.play();
        else this.audio.pause();
    }

    createDebug() {
        if (!this.debugger) return;
        this.debugger.addButton({ title: 'Play / Pause' }).on('click', () => this.toggle());
    }

  setupAnalyser() {
    this.context = new AudioContext();

    const source = this.context.createMediaElementSource(this.audio);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 1024;               // → 512 bins de fréquences
    this.analyser.smoothingTimeConstant = 0.8;  // lissage entre frames

    source.connect(this.analyser);
    this.analyser.connect(this.context.destination); // sinon plus de son

    this.data = new Uint8Array(this.analyser.frequencyBinCount);
}

// Chaque bin couvre sampleRate / fftSize Hz (≈ 43 Hz à 44.1 kHz avec fftSize 1024)
getBandEnergy(minHz, maxHz) {
    const binWidth = this.context.sampleRate / this.analyser.fftSize;
    const start = Math.floor(minHz / binWidth);
    const end = Math.max(start + 1, Math.ceil(maxHz / binWidth));

    let sum = 0;
    for (let i = start; i < end; i++) sum += this.data[i];

    return sum / (end - start) / 255; // normalisé 0 → 1
}
}

