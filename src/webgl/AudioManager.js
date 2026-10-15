export default class AudioManager {
    constructor(options = {}) {
        this.debugger = options.debugger;

        this.audio = document.querySelector('#audio');

        this.noteCallbacks = new Set();
        this.lastNoteIndex = -1;

        this.settings = {
            pianoStart: 85.94,
            pianoEnd: 146.3,
            interval: 0.536,
        };

        this.createDebug();
    }

    get lastNoteTime() {
        const { pianoStart, pianoEnd, interval } = this.settings;
        const lastNoteIndex = Math.floor((pianoEnd - pianoStart) / interval);

        return pianoStart + lastNoteIndex * interval;
    }

    onNote(callback) {
        this.noteCallbacks.add(callback);
    }

    createDebug() {
        if (!this.debugger) return;

        const audioFolder = this.debugger.addFolder({ title: 'Piano rythme' });
        audioFolder.addBinding(this.settings, 'pianoStart', { min: 0, max: 161, step: 0.01 });
        audioFolder.addBinding(this.settings, 'pianoEnd', { min: 0, max: 161, step: 1 });
        audioFolder.addBinding(this.settings, 'interval', { min: 0.2, max: 2, step: 0.001 });
        audioFolder.addButton({ title: 'Aller au piano' }).on('click', () => {
            this.audio.currentTime = this.settings.pianoStart;
            this.audio.play();
        });
    }

    update() {
        if (this.audio.paused) return;

        const time = this.audio.currentTime;
        const { pianoStart, pianoEnd, interval } = this.settings;

        if (time < pianoStart || time > pianoEnd) {
            this.lastNoteIndex = -1;
            return;
        }

        const noteIndex = Math.floor((time - pianoStart) / interval);

        if (noteIndex !== this.lastNoteIndex) {
            this.lastNoteIndex = noteIndex;
            this.noteCallbacks.forEach((cb) => cb());
        }
    }
}
