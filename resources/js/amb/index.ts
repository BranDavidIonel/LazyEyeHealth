// "Amb": the helpers every exercise uses (same names as in the first version,
// Exercitii-ambliopie/assets/common.js), now saving to the server:
//   settings / set          exercise settings (lazy eye, glasses, calibration)
//   paint / monoColors ...   colours that reach only one eye through red-cyan glasses
//   devPxPerDeg ...          screen geometry (pixels <-> degrees, from the calibration)
//   saveResult / results     results of finished rounds
//   startTracking / setActive practice time + break reminder
//   overlay                  pop-up windows
//   Staircase                adaptive difficulty
import { router } from '@inertiajs/vue3';
import * as display from './display';
import { closeOverlays, modalOpen, overlay } from './overlay';
import { results, saveResult, seedResults } from './results';
import { flushSettings, initSettings, set, settings } from './settings';
import { beep } from './sound';
import { Staircase } from './staircase';
import { dayKey } from './time';
import {
    flush,
    setActive,
    setTodayBase,
    startTracking,
    stopTracking,
    todaySeconds,
    tracker,
} from './tracking';

export type { AmbSettings } from './settings';
export type { AmbResult } from './results';
export type { OverlayButton } from './overlay';
export type { StaircaseOptions } from './staircase';

/** App pages the exercises link to. */
export const urls = {
    home: '/',
    exercises: '/exercitii',
    calibration: '/calibrare',
    settings: '/setari',
    vision: '/test-vedere',
} as const;

/** Changes the good eye's contrast in the dichoptic games (0.1..1) and logs it as a "balance" result. */
function adjustFellow(delta: number, reason = ''): number {
    const before = settings().fellowContrast;
    const value =
        Math.round(Math.min(1, Math.max(0.1, before + delta)) * 100) / 100;

    if (value !== before) {
        set({ fellowContrast: value });
        saveResult('balance', { v: value, reason });
    }

    return value;
}

/** Opens an app page without reloading (e.g. Amb.go(Amb.urls.home) for a "Meniu" button). */
function go(url: string): void {
    closeOverlays();
    router.visit(url);
}

export const Amb = {
    ...display,
    urls,
    settings,
    set,
    initSettings,
    flushSettings,
    dayKey,
    todaySeconds,
    setTodayBase,
    seedResults,
    saveResult,
    results,
    adjustFellow,
    beep,
    overlay,
    modalOpen,
    closeOverlays,
    startTracking,
    stopTracking,
    setActive,
    flush,
    tracker,
    go,
    Staircase,
};

export default Amb;
