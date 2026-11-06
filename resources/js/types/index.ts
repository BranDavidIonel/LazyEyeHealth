export * from './auth';

import type { AmbResult } from '@/amb';

/** One entry of App\Support\ExerciseCatalog. */
export type ExerciseMeta = {
    slug: string;
    title: string;
    group: 'dichoptic' | 'stereo' | 'mono' | 'setup';
    page: string;
    description: string;
    trains: string;
    minutes: string;
};

/** Previous results per series ("contrast", "balance", ...), oldest first. */
export type ResultMap = Record<string, AmbResult[]>;

export type VisionTypeKey = 'acuity' | 'reading' | 'contrast';
export type EyeKey = 'right' | 'left' | 'both';

export type VisionTestRow = {
    id: number;
    type: VisionTypeKey;
    eye: EyeKey;
    date: string;
    time: string | null;
    distance_cm: number;
    score: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>;
    note: string | null;
};

export type VisionDay = {
    date: string;
    score: number;
    count: number;
    extra: { max_wpm: number | null; cps: number | null; letters: number | null };
};

export type VisionDelta = {
    gain: number;
    lines: number;
    letters: number;
    verdict: 'better' | 'maybe_better' | 'stable' | 'maybe_worse' | 'worse';
    speed_change_pct?: number;
};

export type VisionComparison = {
    type: VisionTypeKey;
    type_label: string;
    eye: EyeKey;
    eye_label: string;
    lower_is_better: boolean;
    noise: number;
    latest: VisionDay;
    baseline: (VisionDay & { gap: number }) | null;
    approximate: boolean;
    tests: number;
    month: VisionDelta | null;
    since_start: VisionDelta | null;
    first: VisionDay;
};
