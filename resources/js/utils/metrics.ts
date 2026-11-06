// The number followed over time for each exercise (Reports page charts).
import type { AmbResult } from '@/amb';

export type Metric = {
    /** English label of the measured value (translated where shown). */
    label: string;
    unit: string;
    /** true when a smaller value is better (thresholds); the chart axis is flipped so up = better. */
    lowerIsBetter: boolean;
    decimals: number;
    value: (r: AmbResult) => number | null;
};

const num = (v: unknown): number | null =>
    v === null || v === undefined || v === '' || Number.isNaN(Number(v))
        ? null
        : Number(v);

export const METRICS: Record<string, Metric> = {
    'litera-e': {
        label: 'Estimated acuity (decimal)',
        unit: '',
        lowerIsBetter: false,
        decimals: 2,
        value: (r) => num(r.decimal),
    },
    contrast: {
        label: 'Contrast threshold',
        unit: '%',
        lowerIsBetter: true,
        decimals: 2,
        value: (r) => (num(r.thr) === null ? null : Number(r.thr) * 100),
    },
    vernier: {
        label: 'Alignment threshold',
        unit: '″',
        lowerIsBetter: true,
        decimals: 0,
        value: (r) => num(r.arcsec),
    },
    relief: {
        label: 'Depth (stereo) threshold',
        unit: '″',
        lowerIsBetter: true,
        decimals: 0,
        value: (r) => num(r.arcsec),
    },
    citire: {
        label: 'Smallest easy print',
        unit: ' logMAR',
        lowerIsBetter: true,
        decimals: 1,
        value: (r) => num(r.logmar_easy ?? r.logmar_min),
    },
    inel: {
        label: 'Score',
        unit: '',
        lowerIsBetter: false,
        decimals: 0,
        value: (r) => num(r.score),
    },
    tetris: {
        label: 'Score',
        unit: '',
        lowerIsBetter: false,
        decimals: 0,
        value: (r) => num(r.score),
    },
    breakout: {
        label: 'Score',
        unit: '',
        lowerIsBetter: false,
        decimals: 0,
        value: (r) => num(r.score),
    },
    sarpe: {
        label: 'Score',
        unit: '',
        lowerIsBetter: false,
        decimals: 0,
        value: (r) => num(r.score),
    },
    convergenta: {
        label: 'Convergence break (base-out)',
        unit: ' Δ',
        lowerIsBetter: false,
        decimals: 0,
        value: (r) => num(r.bo_break ?? r.max_bo),
    },
    'fara-ecran': {
        label: 'Near point of convergence',
        unit: ' cm',
        lowerIsBetter: true,
        decimals: 0,
        value: (r) => (r.kind === 'npc' ? num(r.break_cm) : null),
    },
    balance: {
        label: 'Contrast for the good eye',
        unit: '%',
        lowerIsBetter: false,
        decimals: 0,
        value: (r) => (num(r.v) === null ? null : Number(r.v) * 100),
    },
};
