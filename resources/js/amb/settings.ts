// Exercise settings (lazy eye, glasses, calibration...). They come from the
// server with every page (shared prop "settings") and are saved back with a
// short delay when an exercise or the settings page changes them.
import { reactive } from 'vue';
import { api } from '@/lib/http';

export type Side = 'left' | 'right';

export type AmbSettings = {
    lazyEye: Side;
    /** 'anaglyph' = red-cyan glasses, 'patch' = good eye covered */
    viewMode: 'anaglyph' | 'patch';
    /** eye that wears the red lens */
    redSide: Side;
    otherLens: 'cyan' | 'blue' | 'green';
    /** brightness of the red channel (lower it to cut ghosting) */
    redLevel: number;
    otherLevel: number;
    /** contrast for the good eye in the dichoptic games (0.1 - 1) */
    fellowContrast: number;
    autoBalance: boolean;
    dailyGoalMin: number;
    breakEveryMin: number;
    sound: boolean;
    /** CSS px per millimetre, set on the calibration page */
    pxPerMm: number;
    /** usual distance to the screen during the exercises */
    distanceCm: number;
    calibrated: boolean;
    sizeCalibrated: boolean;
};

export const DEFAULTS: AmbSettings = {
    lazyEye: 'right',
    viewMode: 'anaglyph',
    redSide: 'left',
    otherLens: 'cyan',
    redLevel: 255,
    otherLevel: 255,
    fellowContrast: 0.3,
    autoBalance: true,
    dailyGoalMin: 30,
    breakEveryMin: 20,
    sound: true,
    pxPerMm: 3.78,
    distanceCm: 60,
    calibrated: false,
    sizeCalibrated: false,
};

const state = reactive<AmbSettings>({ ...DEFAULTS });

let unsaved: Partial<AmbSettings> = {};
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

/** Called by the layouts with the settings sent by the server. */
export function initSettings(fromServer: Partial<AmbSettings> | null): void {
    // Changes not saved yet win over the (older) copy from the server.
    Object.assign(state, DEFAULTS, fromServer ?? {}, unsaved);
}

export function settings(): AmbSettings {
    return state;
}

/** Changes settings now and saves them on the server ~0.4 s later. */
export function set(patch: Partial<AmbSettings>): AmbSettings {
    Object.assign(state, patch);
    Object.assign(unsaved, patch);

    if (saveTimer) {
        clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => void flushSettings(), 400);
    listeners.forEach((fn) => fn());

    return state;
}

/** Saves pending changes right away (also when the page is closed). */
export async function flushSettings(keepalive = false): Promise<void> {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }

    const patch = unsaved;

    if (!Object.keys(patch).length) {
        return;
    }

    unsaved = {};

    try {
        await api('PUT', '/api/settings', patch, { keepalive });
    } catch {
        // try again with the next change
        unsaved = { ...patch, ...unsaved };
    }
}

/** Runs fn after every set() (the exercise header uses it to refresh the mode text). */
export function onSettingsChange(fn: () => void): () => void {
    listeners.add(fn);

    return () => listeners.delete(fn);
}

window.addEventListener('pagehide', () => void flushSettings(true));
