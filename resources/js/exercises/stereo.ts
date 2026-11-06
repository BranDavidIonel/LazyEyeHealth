// "Relief 3D": stereo perceptual learning with random-dot stereograms
// (the kind of training in Ding & Levi 2011, PNAS, where adults with abnormal
// binocular vision recovered some stereopsis).
//
// Each eye gets its own random-dot picture through the red-cyan glasses: the
// left-eye picture in the colour that passes the left lens, the right-eye
// picture in the colour of the right lens, added together on black (a dot both
// eyes share looks white). A square of dots above, below, left or right of the
// fixation cross is shifted horizontally in one eye's picture (crossed
// disparity, so it floats in front of the screen). Each eye alone sees only
// uniform random dots: there is no monocular cue, the square exists only when
// the two pictures are fused. The disparity (whole device pixels) follows an
// adaptive staircase from ~20 arcmin down to 1 px.
//
// 4-AFC on the POSITION of the square (not its shape): detecting where the
// depth is needs only stereopsis, while naming a shape near threshold also
// needs the much coarser form resolution of depth-defined edges, which would
// inflate the threshold and mix two abilities. A big patch away from the
// centre also suits amblyopic eyes, whose coarse stereo works better for
// large, slightly peripheral targets.
import Amb from '@/amb';
import type { RGB } from '@/amb/display';
import type { Side } from '@/amb/settings';
import type { Runtime } from '@/exercises/runtime';
import { getLocale, t } from '@/i18n';

const ID = 'relief';
/** Largest disparity (start of the staircase), minutes of arc. */
const START_ARCMIN = 20;

type Pos = 'up' | 'down' | 'left' | 'right';
type Rect = { x0: number; y0: number; x1: number; y1: number };

const POSITIONS: Pos[] = ['up', 'down', 'left', 'right'];
const KEYMAP: Record<string, Pos> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    '1': 'up',
    '2': 'down',
    '3': 'left',
    '4': 'right',
};

const isPos = (v: unknown): v is Pos =>
    typeof v === 'string' && (POSITIONS as string[]).includes(v);

/** Ascending whole-pixel disparities from 1 px to maxPx, about 25% apart. */
function disparityLevels(maxPx: number): number[] {
    const levels: number[] = [];

    for (let v = 1; v < maxPx; v = Math.max(v + 1, Math.round(v * 1.25))) {
        levels.push(v);
    }

    // avoid two almost equal steps at the top
    const last = levels[levels.length - 1];

    if (levels.length > 1 && maxPx - last < last * 0.12) {
        levels.pop();
    }

    levels.push(maxPx);

    return levels;
}

export default function start(rt: Runtime): void {
    const { $ } = rt;
    const fmt = (n: number, d: number): string => {
        const s = Number(n).toFixed(d);

        return getLocale() === 'en' ? s : s.replace('.', ',');
    };
    const round = (n: number, d: number): number =>
        Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
    const cell = (label: string, value: string | number): string =>
        `<div><span>${label}</span><b>${value}</b></div>`;
    const sec = (a: number): string => `${fmt(a, a < 10 ? 1 : 0)}″`;
    const cv = $<HTMLCanvasElement>('cv');
    const st = Amb.settings();

    let ctx: CanvasRenderingContext2D;
    let W = 0;
    let H = 0;
    /** dot side, device px */
    let dot = 2;
    let levels: number[] = [1, 2, 3, 4];
    const maxTrials = 50;
    let state: 'idle' | 'running' | 'paused' | 'done' | 'blocked' = 'idle';
    let phase: '' | 'stim' | 'gap' = '';
    let sc: InstanceType<typeof Amb.Staircase> | null = null;
    let points = 0;
    let target: Pos = 'up';
    let targetRect: Rect = { x0: 0, y0: 0, x1: 0, y1: 0 };
    let timers: number[] = [];
    const later = (fn: () => void, ms: number): void => {
        timers.push(rt.timeout(fn, ms));
    };
    const clearTimers = (): void => {
        timers.forEach(rt.clearTimeout);
        timers = [];
    };
    /** Disparity levels of the running round (a resize may rebuild `levels`). */
    const roundLevels = (): number[] => sc?.levels ?? levels;

    /* ---------- geometry ---------- */
    function setupCanvas(): void {
        const css = Math.min(520, Math.max(260, window.innerWidth - 34));
        ctx = Amb.deviceCanvas(cv, css, css);
        W = cv.width;
        H = cv.height;
        dot = Math.max(2, Math.min(3, Math.round(1.5 * Amb.dpr())));
        // keep the shifted square inside the field
        const maxPx = Math.max(
            4,
            Math.min(
                Math.floor(0.08 * W),
                Math.round(Amb.arcminToDevPx(START_ARCMIN)),
            ),
        );
        levels = disparityLevels(maxPx);
    }

    /** Square of the hidden target for a position (device px, x1/y1 exclusive). */
    function rectFor(pos: Pos): Rect {
        const side = Math.round(0.3 * W);
        const off = Math.round(0.27 * W);
        let cx = W / 2;
        let cy = H / 2;

        if (pos === 'up') {
            cy -= off;
        } else if (pos === 'down') {
            cy += off;
        } else if (pos === 'left') {
            cx -= off;
        } else {
            cx += off;
        }

        const x0 = Math.round(cx - side / 2);
        const y0 = Math.round(cy - side / 2);

        return { x0, y0, x1: x0 + side, y1: y0 + side };
    }

    /* ---------- colours ---------- */
    /** Colour that passes the lens in front of this eye (the red-lens eye gets red). */
    function eyeColour(side: Side): RGB {
        return Amb.eyeRGB(side === st.lazyEye ? 'lazy' : 'fellow', 1);
    }

    /* ---------- drawing ---------- */
    /** Fixation cross + frame, white = seen by both eyes, at zero disparity (helps the eyes stay aligned). */
    function drawLocks(): void {
        const r = Amb.dpr();
        const cx = Math.round(W / 2);
        const cy = Math.round(H / 2);
        const clear = Math.round(12 * r);
        const arm = Math.round(8 * r);
        const th = Math.max(2, Math.round(2 * r));
        const frame = Math.max(2, Math.round(2 * r));
        ctx.fillStyle = '#000';
        ctx.fillRect(cx - clear, cy - clear, 2 * clear, 2 * clear);
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - arm, cy - Math.round(th / 2), 2 * arm, th);
        ctx.fillRect(cx - Math.round(th / 2), cy - arm, th, 2 * arm);
        ctx.fillRect(0, 0, W, frame);
        ctx.fillRect(0, H - frame, W, frame);
        ctx.fillRect(0, 0, frame, H);
        ctx.fillRect(W - frame, 0, frame, H);
    }

    function drawBlank(): void {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);

        if (Amb.isAnaglyph()) {
            drawLocks();
        }
    }

    /**
     * One stereogram. Dot positions (top-left corners) form a uniform random
     * field, so each eye's picture alone is plain random dots:
     * - the other eye gets every dot where it is;
     * - the shifted eye gets the dots of the square moved by `shift`, drops the
     *   dots now covered by the moved square, and gets fresh random dots in the
     *   strip the square uncovered.
     */
    function drawStereogram(rect: Rect, shift: number, shiftedEye: Side): void {
        const n = W * H;
        const left = new Uint8Array(n);
        const right = new Uint8Array(n);
        const moved = shiftedEye === 'left' ? left : right;
        const still = shiftedEye === 'left' ? right : left;
        // dot corners per pixel for ~50% of the area covered
        const p = Math.LN2 / (dot * dot);
        const inRect = (x: number, y: number): boolean =>
            x >= rect.x0 && x < rect.x1 && y >= rect.y0 && y < rect.y1;
        const stamp = (m: Uint8Array, x: number, y: number): void => {
            const xa = Math.max(0, x);
            const xb = Math.min(W, x + dot);
            const ya = Math.max(0, y);
            const yb = Math.min(H, y + dot);

            for (let yy = ya; yy < yb; yy++) {
                const row = yy * W;

                for (let xx = xa; xx < xb; xx++) {
                    m[row + xx] = 1;
                }
            }
        };

        for (let y = 1 - dot; y < H; y++) {
            for (let x = 1 - dot; x < W; x++) {
                if (Math.random() >= p) {
                    continue;
                }

                stamp(still, x, y);

                if (inRect(x, y)) {
                    stamp(moved, x + shift, y);
                } else if (!inRect(x - shift, y)) {
                    stamp(moved, x, y);
                }
                // else: covered by the moved square
            }
        }

        // fresh dots in the uncovered strip (inside the square, outside its moved copy)
        for (let y = rect.y0; y < rect.y1; y++) {
            for (let x = rect.x0; x < rect.x1; x++) {
                if (!inRect(x - shift, y) && Math.random() < p) {
                    stamp(moved, x, y);
                }
            }
        }

        // add the two pictures (like globalCompositeOperation 'lighter', but a
        // dot covering another dot of the same eye does not get brighter)
        const [lr, lg, lb] = eyeColour('left');
        const [rr, rg, rb] = eyeColour('right');
        const img = ctx.createImageData(W, H);
        const d = img.data;

        for (let i = 0, j = 0; i < n; i++, j += 4) {
            const a = left[i];
            const b = right[i];
            d[j] = a * lr + b * rr;
            d[j + 1] = a * lg + b * rg;
            d[j + 2] = a * lb + b * rb;
            d[j + 3] = 255;
        }

        ctx.putImageData(img, 0, 0);
        drawLocks();
    }

    /** White outline (both eyes) around the square, shown after a wrong answer. */
    function drawOutline(rect: Rect): void {
        const lw = Math.max(2, Math.round(2 * Amb.dpr()));
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = lw;
        ctx.strokeRect(
            rect.x0 - lw,
            rect.y0 - lw,
            rect.x1 - rect.x0 + 2 * lw,
            rect.y1 - rect.y0 + 2 * lw,
        );
    }

    /* ---------- UI ---------- */
    function fb(text: string, ok?: boolean): void {
        const el = $('fb');
        el.textContent = text;
        el.className =
            'feedback' + (ok === true ? ' good' : ok === false ? ' bad' : '');
    }

    function stats(): void {
        const n = sc ? sc.trials : 0;
        const live = state === 'running' || state === 'paused';
        $('sTrial').textContent = `${live ? Math.min(n + 1, maxTrials) : n} / ${maxTrials}`;
        $('sAcc').textContent = n ? `${Math.round(sc!.accuracy * 100)}%` : '–';
        $('sPts').textContent = String(points);
        $('sNow').textContent = sc ? sec(Amb.devPxToArcsec(sc.value)) : '–';
        $('sMin').textContent = sec(Amb.devPxToArcsec(1));
        $('prog').style.width = `${state === 'done' ? 100 : (n / maxTrials) * 100}%`;
    }

    function ui(): void {
        const btn = $<HTMLButtonElement>('startBtn');
        btn.disabled = state === 'blocked';
        btn.textContent =
            state === 'running'
                ? t('Pause')
                : state === 'paused'
                  ? t('Continue')
                  : t('Start');
        rt.root
            .querySelectorAll<HTMLButtonElement>('.pad .resp')
            .forEach((b) => {
                b.disabled = state === 'blocked';
            });
        stats();
    }

    /* ---------- trials ---------- */
    function startBlock(): void {
        if (state === 'blocked') {
            return;
        }

        clearTimers();
        setupCanvas();
        sc = new Amb.Staircase({
            levels,
            startIndex: levels.length - 1,
            // 2 right in a row to go one step down: ~71% correct at threshold (chance is 25%)
            down: 2,
            maxTrials,
            maxReversals: 10,
        });
        points = 0;
        state = 'running';
        phase = '';
        fb('');
        drawBlank();
        ui();
        Amb.setActive(true);
        later(nextTrial, 500);
    }

    function nextTrial(): void {
        if (state !== 'running') {
            return;
        }

        if (sc!.done) {
            finish();

            return;
        }

        fb('');
        target = POSITIONS[Math.floor(Math.random() * 4)];
        targetRect = rectFor(target);
        const d = sc!.value;
        // crossed disparity: the left eye's copy moves right or the right eye's copy moves left
        const shiftedEye: Side = Math.random() < 0.5 ? 'left' : 'right';
        drawStereogram(targetRect, shiftedEye === 'left' ? d : -d, shiftedEye);
        phase = 'stim';
        stats();
    }

    function answer(pos: Pos): void {
        if (state !== 'running' || phase !== 'stim') {
            return;
        }

        clearTimers();
        phase = 'gap';
        const d = sc!.value;
        const ok = pos === target;
        sc!.update(ok);

        if (ok) {
            points += Math.max(
                1,
                Math.round(
                    5 + 10 * Math.log10(roundLevels()[roundLevels().length - 1] / d),
                ),
            );
            Amb.beep('ok');
            fb(t('Correct'), true);
            drawBlank();
            stats();
            later(nextTrial, 450);

            return;
        }

        Amb.beep('bad');
        fb(t('Wrong: the square was where the white frame is.'), false);
        drawOutline(targetRect);
        stats();
        later(() => {
            if (state !== 'running') {
                return;
            }

            drawBlank();
            later(nextTrial, 350);
        }, 1100);
    }

    function pause(): void {
        if (state !== 'running') {
            return;
        }

        clearTimers();
        state = 'paused';
        phase = '';
        Amb.setActive(false);
        drawBlank();
        fb('');
        ui();
        Amb.overlay(
            `<h2>${t('Pause')}</h2><p>${t('The exercise is stopped. When you are ready, put the glasses back on and press “Continue”.')}</p>`,
            [
                { label: t('Menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('Continue'), primary: true, onClick: resume },
            ],
        );
    }

    function resume(): void {
        if (state !== 'paused') {
            return;
        }

        state = 'running';
        Amb.setActive(true);
        ui();
        later(nextTrial, 500);
    }

    function compare(
        cur: number,
        prev: number | null,
        higherBetter: boolean,
        prevMode?: string,
    ): string {
        let h: string;

        if (prev == null) {
            h = `<p>${t('This is your first result. Repeat the exercise in the coming days to see how you progress.')}</p>`;
        } else {
            const p =
                prev > 0
                    ? ((higherBetter ? cur - prev : prev - cur) / prev) * 100
                    : 0;

            if (Math.abs(p) < 3) {
                h = `<p>${t('Almost the same as last time. Consistency is a good sign, keep going!')}</p>`;
            } else if (p > 0) {
                h =
                    `<p class="good">${t('Better by :pct% than last time.', { pct: Math.round(p) })}</p>` +
                    `<p>${t('Well done! Regular practice pays off.')}</p>`;
            } else {
                h =
                    `<p class="bad">${t(':pct% weaker than last time.', { pct: Math.round(-p) })}</p>` +
                    `<p>${t('Do not worry: tiredness, light and attention change the result from one day to the next. What matters is the trend over several days.')}</p>`;
            }

            if (prevMode && prevMode !== Amb.settings().viewMode) {
                h += `<p class="hint">${t('Last time you worked in a different mode (glasses / patch), so the comparison is only a rough guide.')}</p>`;
            }
        }

        return h;
    }

    function finish(): void {
        clearTimers();
        state = 'done';
        phase = '';
        Amb.setActive(false);
        drawBlank();
        ui();
        const px = sc!.threshold();
        const arcsec = Amb.devPxToArcsec(px);
        const minArcsec = Amb.devPxToArcsec(1);
        const lv = roundLevels();
        const maxArcsec = Amb.devPxToArcsec(lv[lv.length - 1]);
        const acc = sc!.accuracy;
        // never saw the square, even with the largest disparity (chance is 25%)
        const ceiling = acc < 0.4 && px >= lv[Math.max(0, lv.length - 2)];
        const atFloor = sc!.atFloor;
        const mode = Amb.settings().viewMode;
        const prev = Amb.results(ID).pop();
        Amb.saveResult(ID, {
            px: round(px, 3),
            arcsec: round(arcsec, 1),
            trials: sc!.trials,
            acc: round(acc, 3),
            ceiling,
            atFloor,
            mode,
        });
        Amb.beep('win');
        const summary = ceiling
            ? `<p>${t('You did not see the relief yet, not even with the largest difference (:max).', { max: sec(maxArcsec) })}</p>` +
              `<p>${t('That is expected at the beginning: many people with a lazy eye see no relief at first. Repeated practice can help; the dichoptic games also train the eyes to work together.')}</p>`
            : `<p>${t('Relief threshold: <b>:value</b> (seconds of arc)', { value: sec(arcsec) })}</p>`;
        Amb.overlay(
            `<h2>${t('Round finished')}</h2>` +
                summary +
                '<div class="result-grid">' +
                cell(
                    t('Relief threshold'),
                    ceiling ? `> ${sec(maxArcsec)}` : sec(arcsec),
                ) +
                cell(t('In screen pixels'), fmt(px, 2)) +
                cell(t('Correct answers'), `${Math.round(acc * 100)}%`) +
                cell(t('Points'), points) +
                cell(t('Smallest step here'), sec(minArcsec)) +
                '</div>' +
                `<p class="hint">${t(
                    'Lower is better. Normal stereo vision reaches about 20–60″. On this screen, at :cm cm, the smallest step that can be shown is :min (one pixel).',
                    { cm: Amb.settings().distanceCm, min: sec(minArcsec) },
                )}</p>` +
                (atFloor
                    ? `<p class="good">${t(
                          'You reached the smallest step of the screen. To measure finer, sit further from the screen and update the distance in the <a href=":url">calibration</a>.',
                          { url: Amb.urls.calibration },
                      )}</p>`
                    : '') +
                compare(arcsec, prev ? Number(prev.arcsec) : null, false, prev?.mode) +
                `<p class="hint">${t('Stop if you get double vision that does not go away, a headache or dizziness.')}</p>` +
                `<p class="hint">${t('The figures are training estimates, not a medical diagnosis.')}</p>`,
            [
                { label: t('Menu'), onClick: () => Amb.go(Amb.urls.home) },
                {
                    label: t('One more round'),
                    primary: true,
                    onClick: startBlock,
                },
            ],
        );
    }

    /* ---------- input ---------- */
    rt.on<KeyboardEvent>(document, 'keydown', (e) => {
        if (Amb.modalOpen()) {
            return;
        }

        const pos = KEYMAP[e.key];

        if (!pos || state !== 'running') {
            return;
        }

        e.preventDefault();

        if (e.repeat) {
            return;
        }

        answer(pos);
    });
    rt.root
        .querySelectorAll<HTMLButtonElement>('.pad .resp')
        .forEach((b) =>
            rt.on(b, 'click', () => {
                if (isPos(b.dataset.d)) {
                    answer(b.dataset.d);
                }
            }),
        );
    rt.on($('startBtn'), 'click', () => {
        if (state === 'running') {
            pause();
        } else if (state === 'paused') {
            resume();
        } else {
            startBlock();
        }
    });
    rt.on(window, 'resize', () => {
        if (state !== 'running') {
            setupCanvas();
            drawBlank();
            stats();
        }
    });

    /* ---------- init ---------- */
    const distLine = t('Sit about :cm cm from the screen.', {
        cm: st.distanceCm,
    });
    const glasses = t(
        'Put on the glasses: the <b>red</b> lens on the <b>:red</b> eye, the <b>:lens</b> lens on the <b>:other</b> eye. Keep both eyes open.',
        {
            red: Amb.EYE[st.redSide],
            lens: Amb.LENS[st.otherLens],
            other: Amb.EYE[Amb.other(st.redSide)],
        },
    );
    const howTo = t(
        'Look at the cross in the middle. Somewhere around it (up, down, left or right) a square of dots stands out in relief, towards you. ' +
            'With one eye alone there is nothing to see: only both eyes together can find it. ' +
            'Say where it is (<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> or the keys <kbd>1</kbd>–<kbd>4</kbd>). ' +
            'Take your time: sometimes the relief appears only after a few seconds. If you see nothing, guess.',
    );
    const expect = t(
        'Normal stereo vision reaches about 20–60″ (seconds of arc). Many people with a lazy eye see no relief at first: that is expected, and practice can help.',
    );
    const safety = t(
        'Stop if you get double vision that does not go away, a headache or dizziness.',
    );
    const calText =
        t('The screen is not calibrated yet, so the values in seconds of arc are approximate.') +
        ` <a href="${Amb.urls.calibration}">${t('Calibrate the screen size')}</a>.`;

    /** Advice from the last Worth test (calibration page), if there is one. */
    function worthNote(): string {
        const last = Amb.results('worth').pop();
        const seen = last ? String(last.seen) : '';

        if (seen === '5') {
            return `<p class="bad">${t('At your last Worth test you saw 5 dots (double vision). Ask your eye doctor before doing this exercise, and stop if you see double.')}</p>`;
        }

        if (seen === '2' || seen === '3' || seen === 'alt') {
            return `<p class="hint">${t('At your last Worth test one eye was suppressed. You may not see the relief at first; the dichoptic games (Tetris, Breakout) train exactly that.')}</p>`;
        }

        if (!last) {
            return `<p class="hint">${t('Tip: do the Worth fusion test in the <a href=":url">calibration</a> first.', { url: Amb.urls.calibration })}</p>`;
        }

        return '';
    }

    setupCanvas();

    if (!Amb.isAnaglyph()) {
        // Patch mode: one eye only, so there can be no relief.
        state = 'blocked';
        const msg = t(
            'Relief 3D needs the red-cyan glasses: each eye must get a different picture. With a patch (one eye only) the exercise cannot work. ' +
                'Put on the red-cyan glasses and choose “Red-cyan glasses” in the <a href=":url">settings</a>.',
            { url: Amb.urls.settings },
        );
        $('instr').innerHTML = `<p>${msg}</p>`;
        drawBlank();
        ui();
        Amb.overlay(
            `<h2>${t('Red-cyan glasses needed')}</h2><p>${msg}</p>`,
            [
                { label: t('Menu'), onClick: () => Amb.go(Amb.urls.home) },
                {
                    label: t('Settings'),
                    primary: true,
                    onClick: () => Amb.go(Amb.urls.settings),
                },
            ],
        );

        return;
    }

    $('instr').innerHTML = `<p>${glasses}</p><p>${distLine}</p>`;

    if (!st.sizeCalibrated) {
        $('calHint').hidden = false;
        $('calHint').innerHTML = calText;
    }

    drawBlank();
    ui();

    Amb.startTracking(ID, { onPause: pause, onResume: () => {} });

    Amb.overlay(
        `<h2>${t('Relief 3D')}</h2>` +
            `<p>${glasses}</p>` +
            `<p>${distLine}</p>` +
            `<p>${howTo}</p>` +
            `<p>${expect}</p>` +
            `<p>${safety}</p>` +
            worthNote() +
            `<p class="hint">${t('If, with one eye closed, you still see faint copies of the dots in the other colour, lower that colour in the <a href=":url">calibration</a> (the “Colour test” step).', { url: Amb.urls.calibration })}</p>` +
            (st.sizeCalibrated ? '' : `<p class="hint">${calText}</p>`),
        [{ label: t('Start'), primary: true, onClick: startBlock }],
    );
}
