// Colours per eye (red-cyan glasses) and screen geometry (pixels <-> degrees).
import { settings } from './settings';
import type { Side } from './settings';

export type RGB = [number, number, number];

export const EYE: Record<Side, string> = { left: 'stâng', right: 'drept' };
export const LENS: Record<'cyan' | 'blue' | 'green', string> = {
    cyan: 'cyan',
    blue: 'albastru',
    green: 'verde',
};

export function other(eye: Side): Side {
    return eye === 'left' ? 'right' : 'left';
}

export function goodEye(): Side {
    return other(settings().lazyEye);
}

export function isAnaglyph(): boolean {
    return settings().viewMode === 'anaglyph';
}

/* ---------- colours per eye ---------- */

function lensRGB(isRed: boolean): RGB {
    const s = settings();

    if (isRed) {
        return [s.redLevel, 0, 0];
    }

    const c = s.otherLevel;

    if (s.otherLens === 'blue') {
        return [0, 0, c];
    }

    if (s.otherLens === 'green') {
        return [0, c, 0];
    }

    return [0, c, c];
}

/** Colour seen by one eye: 'lazy' | 'fellow' | 'both', intensity 0..1. */
export function eyeRGB(
    eye: 'lazy' | 'fellow' | 'both',
    intensity = 1,
): RGB {
    if (eye === 'both') {
        const g = Math.round(255 * intensity);

        return [g, g, g];
    }

    const s = settings();
    const lazyRed = s.lazyEye === s.redSide;
    const isRed = eye === 'lazy' ? lazyRed : !lazyRed;

    return lensRGB(isRed).map((v) => Math.round(v * intensity)) as RGB;
}

export function rgb(a: RGB | number[]): string {
    return `rgb(${a[0]},${a[1]},${a[2]})`;
}

/**
 * Colour of a game element. With glasses it goes to one eye only; with the patch
 * the normal colour is used. For 'fellow' the default intensity is fellowContrast.
 */
export function paint(
    eye: 'lazy' | 'fellow' | 'both',
    normal: string,
    intensity?: number,
): string {
    if (!isAnaglyph()) {
        return normal;
    }

    const value =
        intensity ?? (eye === 'fellow' ? settings().fellowContrast : 1);

    return rgb(eyeRGB(eye, value));
}

/** Per-channel multipliers (0..1) that make a stimulus visible to the lazy eye only. */
export function channelMask(): RGB {
    if (!isAnaglyph()) {
        return [1, 1, 1];
    }

    return eyeRGB('lazy', 1).map((v) => v / 255) as RGB;
}

/** Background / foreground for high-contrast stimuli seen by the lazy eye only. */
export function monoColors(): { bg: string; fg: string } {
    if (isAnaglyph()) {
        return { bg: '#000', fg: rgb(eyeRGB('lazy', 1)) };
    }

    return { bg: '#fff', fg: '#000' };
}

/* ---------- geometry ---------- */

export function dpr(): number {
    return window.devicePixelRatio || 1;
}

export function devPxPerMm(): number {
    return settings().pxPerMm * dpr();
}

/** Device pixels per degree of visual angle at the exercise distance. */
export function devPxPerDeg(distanceCm = settings().distanceCm): number {
    return distanceCm * 10 * Math.tan(Math.PI / 180) * devPxPerMm();
}

export function devPxToArcmin(
    px: number,
    distanceCm = settings().distanceCm,
): number {
    return (
        ((Math.atan(px / devPxPerMm() / (distanceCm * 10)) * 180) / Math.PI) *
        60
    );
}

export function devPxToArcsec(px: number, distanceCm?: number): number {
    return devPxToArcmin(px, distanceCm) * 60;
}

/** Device pixels for a size in minutes of arc at a distance. */
export function arcminToDevPx(
    arcmin: number,
    distanceCm = settings().distanceCm,
): number {
    return (
        Math.tan(((arcmin / 60) * Math.PI) / 180) *
        distanceCm *
        10 *
        devPxPerMm()
    );
}

export function acuityFromArcmin(mar: number): {
    mar: number;
    logMAR: number;
    decimal: number;
    snellen: string;
} {
    return {
        mar,
        logMAR: Math.log10(mar),
        decimal: 1 / mar,
        snellen: `6/${Math.round(6 * mar)}`,
    };
}

/** Game canvas: draw in logical units w x h; shown at w*scale x h*scale CSS px, sharp on HiDPI. */
export function fitCanvas(
    canvas: HTMLCanvasElement,
    w: number,
    h: number,
    scale = 1,
): CanvasRenderingContext2D {
    const r = dpr();
    canvas.width = Math.round(w * scale * r);
    canvas.height = Math.round(h * scale * r);
    canvas.style.width = `${w * scale}px`;
    canvas.style.height = `${h * scale}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(r * scale, 0, 0, r * scale, 0, 0);

    return ctx;
}

/** Stimulus canvas: draw in DEVICE pixels (canvas.width x canvas.height), one canvas px = one screen px. */
export function deviceCanvas(
    canvas: HTMLCanvasElement,
    cssW: number,
    cssH: number,
): CanvasRenderingContext2D {
    const r = dpr();
    canvas.width = Math.round(cssW * r);
    canvas.height = Math.round(cssH * r);
    canvas.style.width = `${canvas.width / r}px`;
    canvas.style.height = `${canvas.height / r}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return ctx;
}

/* ---------- texts ---------- */

export function modeText(): string {
    const s = settings();
    const lazy = EYE[s.lazyEye];

    return isAnaglyph()
        ? `Ochi leneș: ${lazy} · ochelari roșu-${LENS[s.otherLens]}`
        : `Ochi leneș: ${lazy} · ocluzor pe ochiul ${EYE[goodEye()]}`;
}

/** How to set up the eyes before an exercise. kind: 'dichoptic' | 'mono'. Returns HTML. */
export function setupText(kind: 'dichoptic' | 'mono'): string {
    const s = settings();
    const lazy = EYE[s.lazyEye];
    const good = EYE[goodEye()];

    if (isAnaglyph()) {
        const glasses =
            `Pune ochelarii: lentila <b>roșie</b> pe ochiul <b>${EYE[s.redSide]}</b>, ` +
            `lentila <b>${LENS[s.otherLens]}</b> pe ochiul <b>${EYE[other(s.redSide)]}</b>. Ține ambii ochi deschiși.`;

        if (kind === 'dichoptic') {
            return (
                `${glasses} Ochiul leneș (${lazy}) vede piesele care se mișcă, ochiul bun (${good}) ` +
                'vede restul, mai estompat. Ai nevoie de amândoi ca să joci.'
            );
        }

        return `${glasses} Imaginea o vede doar ochiul leneș (${lazy}).`;
    }

    return (
        `Acoperă ochiul <b>${good}</b> (cel bun) cu un ocluzor sau cu palma, fără să apeși pe ochi. ` +
        `Lucrezi doar cu ochiul leneș (${lazy}).`
    );
}
