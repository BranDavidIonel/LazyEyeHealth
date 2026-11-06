// Adaptive staircase: the task gets harder after correct answers and easier
// after mistakes, so you always work at the limit of what you see.
// Smaller value = harder. Continuous mode works in log10 steps; discrete mode
// walks an ascending `levels` list.

export type StaircaseOptions = {
    levels?: number[];
    startIndex?: number;
    /** correct answers in a row needed to go one step harder (after the first mistake) */
    down?: number;
    start?: number;
    min?: number;
    max?: number;
    stepsLog?: number[];
    maxTrials?: number;
    maxReversals?: number;
};

export class Staircase {
    levels: number[] | null;
    down: number;
    min: number;
    max: number;
    steps: number[];
    maxTrials: number;
    maxReversals: number;
    idx: number;
    logV: number;
    run = 0;
    lastDir = 0;
    reversals: number[] = [];
    trials = 0;
    correct = 0;
    history: { v: number; ok: boolean }[] = [];

    constructor(o: StaircaseOptions) {
        this.levels = o.levels ?? null;
        this.down = o.down ?? 3;
        this.min = o.min ?? 0;
        this.max = o.max ?? 1;
        this.steps = o.stepsLog ?? [0.3, 0.15, 0.1];
        this.maxTrials = o.maxTrials ?? 60;
        this.maxReversals = o.maxReversals ?? 12;
        this.idx = this.levels
            ? (o.startIndex ?? this.levels.length - 1)
            : 0;
        this.logV = this.levels ? 0 : Math.log10(o.start ?? 1);
    }

    get value(): number {
        return this.levels ? this.levels[this.idx] : Math.pow(10, this.logV);
    }

    get done(): boolean {
        return (
            this.trials >= this.maxTrials ||
            this.reversals.length >= this.maxReversals
        );
    }

    get accuracy(): number {
        return this.trials ? this.correct / this.trials : 0;
    }

    get atFloor(): boolean {
        return this.levels
            ? this.idx === 0
            : this.logV <= Math.log10(this.min) + 1e-9;
    }

    update(ok: boolean): void {
        this.history.push({ v: this.value, ok });
        this.trials++;

        if (ok) {
            this.correct++;
        }

        // fast descent until the first mistake
        const need = this.reversals.length === 0 ? 1 : this.down;

        if (ok) {
            this.run++;

            if (this.run >= need) {
                this.run = 0;
                this.move(-1);
            }
        } else {
            this.run = 0;
            this.move(1);
        }
    }

    move(dir: number): void {
        if (this.lastDir !== 0 && dir !== this.lastDir) {
            this.reversals.push(this.value);
        }

        this.lastDir = dir;

        if (this.levels) {
            this.idx = Math.max(
                0,
                Math.min(this.levels.length - 1, this.idx + dir),
            );

            return;
        }

        const step =
            this.steps[Math.min(this.reversals.length, this.steps.length - 1)];
        this.logV = Math.max(
            Math.log10(this.min),
            Math.min(Math.log10(this.max), this.logV + dir * step),
        );
    }

    /** Geometric mean of the last reversals (skipping the first two when there are enough). */
    threshold(): number {
        let r = this.reversals
            .slice(this.reversals.length > 4 ? 2 : 0)
            .slice(-6);

        if (!r.length) {
            r = this.history.slice(-8).map((h) => h.v);
        }

        if (!r.length) {
            return this.value;
        }

        return Math.pow(
            10,
            r.reduce((a, v) => a + Math.log10(v), 0) / r.length,
        );
    }
}
