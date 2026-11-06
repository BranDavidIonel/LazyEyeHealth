// Sloan letters (C D H K N O R S V Z): the 10 letters of standard eye charts
// (ETDRS). Each is drawn on a 5 × 5 grid with strokes 1 unit thick, so the
// stroke is 1/5 of the letter height - the detail that defines acuity
// (logMAR 0 = letter 5 arcmin tall, stroke 1 arcmin).

export const SLOAN = ['C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z'] as const;

export type SloanLetter = (typeof SLOAN)[number];

/** n different random letters (a letter never repeats inside a line). */
export function randomLetters(n: number): SloanLetter[] {
    const pool = [...SLOAN];
    const out: SloanLetter[] = [];

    for (let i = 0; i < n && pool.length; i++) {
        out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }

    return out;
}

function ring(ctx: CanvasRenderingContext2D, from = 0, to = Math.PI * 2): void {
    ctx.beginPath();
    ctx.arc(2.5, 2.5, 2, from, to);
    ctx.stroke();
}

function poly(ctx: CanvasRenderingContext2D, points: number[]): void {
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);

    for (let i = 2; i < points.length; i += 2) {
        ctx.lineTo(points[i], points[i + 1]);
    }

    ctx.closePath();
    ctx.fill();
}

/** Draws one letter with its top-left corner at (x, y) and height h (pixels of the canvas). */
export function drawSloan(
    ctx: CanvasRenderingContext2D,
    letter: SloanLetter,
    x: number,
    y: number,
    h: number,
    color: string,
): void {
    const u = h / 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(u, u);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

    switch (letter) {
        case 'C':
            // ring with the opening on the right, as wide as the stroke
            ring(ctx, 0.26, Math.PI * 2 - 0.26);
            break;
        case 'O':
            ring(ctx);
            break;
        case 'D':
            // one outline with a hole (no seams between the pieces)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(2.5, 0);
            ctx.arc(2.5, 2.5, 2.5, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(0, 5);
            ctx.closePath();
            ctx.moveTo(1, 1);
            ctx.lineTo(2.5, 1);
            ctx.arc(2.5, 2.5, 1.5, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(1, 4);
            ctx.closePath();
            ctx.fill('evenodd');
            break;
        case 'H':
            ctx.fillRect(0, 0, 1, 5);
            ctx.fillRect(4, 0, 1, 5);
            ctx.fillRect(0, 2, 5, 1);
            break;
        case 'K':
            ctx.fillRect(0, 0, 1, 5);
            poly(ctx, [1, 2.4, 3.6, 0, 5, 0, 1, 3.75]);
            poly(ctx, [1.9, 2.55, 2.85, 1.7, 5, 5, 3.75, 5]);
            break;
        case 'N':
            ctx.fillRect(0, 0, 1, 5);
            ctx.fillRect(4, 0, 1, 5);
            poly(ctx, [0, 0, 1.25, 0, 5, 5, 3.75, 5]);
            break;
        case 'R':
            // stem + bowl as one outline with a hole, then the leg
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(3, 0);
            ctx.arc(3, 1.5, 1.5, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(1, 3);
            ctx.lineTo(1, 5);
            ctx.lineTo(0, 5);
            ctx.closePath();
            ctx.moveTo(1, 1);
            ctx.lineTo(3, 1);
            ctx.arc(3, 1.5, 0.5, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(1, 2);
            ctx.closePath();
            ctx.fill('evenodd');
            poly(ctx, [2, 2.95, 3.3, 2.95, 5, 5, 3.7, 5]);
            break;
        case 'S':
            ctx.beginPath();
            ctx.ellipse(2.5, 1.5, 2, 1, 0, -0.15 * Math.PI, Math.PI / 2, true);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(2.5, 3.5, 2, 1, 0, -Math.PI / 2, 0.85 * Math.PI, false);
            ctx.stroke();
            break;
        case 'V':
            poly(ctx, [0, 0, 1.1, 0, 2.5, 3.9, 3.9, 0, 5, 0, 3.05, 5, 1.95, 5]);
            break;
        case 'Z':
            ctx.fillRect(0, 0, 5, 1);
            ctx.fillRect(0, 4, 5, 1);
            poly(ctx, [3.7, 1, 5, 1, 1.3, 4, 0, 4]);
            break;
    }

    ctx.restore();
}

/** Letter height in device pixels for a logMAR size at a distance (5 arcmin × 10^logMAR). */
export function letterHeightPx(
    logmar: number,
    distanceCm: number,
    devPxPerMm: number,
): number {
    const arcmin = 5 * Math.pow(10, logmar);

    return Math.tan((arcmin / 60) * (Math.PI / 180)) * distanceCm * 10 * devPxPerMm;
}

/** Rounds to one decimal without "-0.0" or 0.30000000000000004. */
export function round1(v: number): number {
    return Math.round(v * 10) / 10 || 0;
}

export function round2(v: number): number {
    return Math.round(v * 100) / 100 || 0;
}
