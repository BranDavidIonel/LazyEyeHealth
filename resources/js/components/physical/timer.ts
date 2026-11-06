// One countdown timer shared by every card of the "Physical exercises" page:
// starting a timer on one card stops the one running on another. While a
// tracked timer runs, the time counts as practice ("fara-ecran") in the daily
// progress; a finished or stopped session of at least 60 s is saved as a result.
// Patching is not tracked (it can last hours, mostly away from the screen):
// its minutes go into the daily journal instead.
import { reactive } from 'vue';
import Amb from '@/amb';

const ID = 'fara-ecran';

export const timer = reactive({
    /** exercise key of the running / paused / finished timer ('' = none) */
    key: '',
    total: 0,
    elapsed: 0,
    running: false,
    finished: false,
    tracked: true,
    /** paused by the page (hidden tab, break reminder), not by the user */
    interrupted: false,
});

let handle: number | null = null;
let last = 0;
let wake: { release: () => Promise<void> } | null = null;

function clearTick(): void {
    if (handle !== null) {
        window.clearInterval(handle);
        handle = null;
    }
}

/** Keeps the phone screen on while the timer runs (where the browser allows it). */
async function holdScreen(): Promise<void> {
    try {
        const nav = navigator as Navigator & {
            wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
        };

        if (nav.wakeLock && !wake) {
            wake = await nav.wakeLock.request('screen');
        }
    } catch {
        // not allowed / not supported
    }
}

function releaseScreen(): void {
    const lock = wake;
    wake = null;
    void lock?.release().catch(() => {});
}

function save(): void {
    const seconds = Math.round(timer.elapsed);

    if (timer.key && seconds >= 60) {
        Amb.saveResult(ID, { kind: timer.key, seconds });
    }
}

function tick(): void {
    if (!timer.running) {
        return;
    }

    const now = Date.now();
    timer.elapsed = Math.min(timer.total, timer.elapsed + (now - last) / 1000);
    last = now;

    if (timer.elapsed >= timer.total) {
        finish();
    }
}

function finish(): void {
    clearTick();
    timer.running = false;
    timer.finished = true;
    Amb.beep('win');
    save();

    if (timer.tracked) {
        Amb.setActive(false);
        Amb.stopTracking();
    }

    releaseScreen();
}

export function startTimer(key: string, seconds: number, tracked: boolean): void {
    stopTimer();
    Object.assign(timer, {
        key,
        total: seconds,
        elapsed: 0,
        running: false,
        finished: false,
        tracked,
        interrupted: false,
    });

    if (tracked) {
        Amb.startTracking(ID, { onPause: () => pauseTimer(true) });
    }

    resumeTimer();
}

export function pauseTimer(interrupted = false): void {
    if (!timer.running) {
        return;
    }

    tick();

    if (!timer.running) {
        return;
    }

    clearTick();
    timer.running = false;
    timer.interrupted = interrupted;

    if (timer.tracked) {
        Amb.setActive(false);
    }

    releaseScreen();
}

export function resumeTimer(): void {
    if (!timer.key || timer.running || timer.finished) {
        return;
    }

    timer.running = true;
    timer.interrupted = false;
    last = Date.now();
    handle = window.setInterval(tick, 250);

    if (timer.tracked) {
        Amb.setActive(true);
    }

    void holdScreen();
}

/** Stops the timer (saving a session of 60 s or more) and clears it. */
export function stopTimer(): void {
    if (!timer.key) {
        return;
    }

    if (timer.running) {
        tick();
    }

    clearTick();

    if (!timer.finished) {
        save();

        if (timer.tracked) {
            Amb.setActive(false);
            Amb.stopTracking();
        }
    }

    releaseScreen();
    Object.assign(timer, {
        key: '',
        total: 0,
        elapsed: 0,
        running: false,
        finished: false,
        interrupted: false,
    });
}
