// Saving a finished vision test (POST /api/vision-tests) and the last used distances.
import { api } from '@/lib/http';
import type { EyeKey, VisionComparison, VisionTestRow, VisionTypeKey } from '@/types';

export type SavedTest = { test: VisionTestRow; comparison: VisionComparison | null };

export function saveVisionTest(payload: {
    type: VisionTypeKey;
    eye: EyeKey;
    distance_cm: number;
    score: number;
    data: Record<string, unknown>;
}): Promise<SavedTest> {
    return api<SavedTest>('POST', '/api/vision-tests', payload);
}

/** The distance used last time for a test type (kept in the browser, so it stays the same). */
export function lastDistance(type: VisionTypeKey, fallback: number): number {
    try {
        const value = Number(localStorage.getItem(`lazyeye.distance.${type}`));

        return value >= 20 && value <= 600 ? value : fallback;
    } catch {
        return fallback;
    }
}

export function rememberDistance(type: VisionTypeKey, cm: number): void {
    try {
        localStorage.setItem(`lazyeye.distance.${type}`, String(cm));
    } catch {
        // storage blocked: the default distance is used next time
    }
}
