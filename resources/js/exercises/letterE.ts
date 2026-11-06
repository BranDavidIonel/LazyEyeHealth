// "Litera E" (tumbling E acuity): a rotated E, optionally surrounded by four
// other E's (crowding). The stroke width follows an adaptive staircase, so the
// letter gets smaller after correct answers. Trains acuity and crowding of
// the lazy eye. Ported from Exercitii-ambliopie/litera-e.html.
import Amb from '@/amb';
import type { Runtime } from '@/exercises/runtime';
import { getLocale, t } from '@/i18n';

const ID = 'litera-e';
/** Crowding setting, remembered in this browser only. */
const OPT_KEY = 'amb.opt.litera-e';

type Dir = 'up' | 'right' | 'down' | 'left';
type Crowd = 'none' | 'light' | 'strong';

const DIRS: Dir[] = ['up', 'right', 'down', 'left'];
/** English labels (translation keys) of the crowding settings. */
const CROWD: Record<Crowd, string> = {
    none: 'No neighbours',
    light: 'Neighbours one letter away',
    strong: 'Close neighbours',
};
/** Points multiplier: crowding makes the task harder. */
const MUL: Record<Crowd, number> = { none: 1, light: 1.2, strong: 1.5 };
const KEYMAP: Record<string, Dir> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
};

const isCrowd = (v: unknown): v is Crowd =>
    typeof v === 'string' && v in CROWD;
const isDir = (v: unknown): v is Dir =>
    typeof v === 'string' && (DIRS as string[]).includes(v);

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
    const cv = $<HTMLCanvasElement>('cv');
    const crowdBox = $('crowd');
    // stroke widths in device px (letter height = 5 strokes)
    const SC = {
        levels: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20],
        startIndex: 10,
        down: 2,
        maxTrials: 48,
        maxReversals: 10,
    };

    let ctx: CanvasRenderingContext2D;
    let W = 0;
    let H = 0;
    let state: 'idle' | 'running' | 'paused' | 'done' = 'idle';
    let phase: '' | 'stim' | 'gap' = '';
    let sc: InstanceType<typeof Amb.Staircase> | null = null;
    let points = 0;
    let target: Dir = 'right';
    let crowd: Crowd = 'light';
    let timers: number[] = [];
    const later = (fn: () => void, ms: number): void => {
        timers.push(rt.timeout(fn, ms));
    };
    const clearTimers = (): void => {
        timers.forEach(rt.clearTimeout);
        timers = [];
    };
    const rndDir = (): Dir => DIRS[Math.floor(Math.random() * 4)];
    const crowdButtons = (): HTMLButtonElement[] =>
        Array.from(crowdBox.querySelectorAll<HTMLButtonElement>('button'));

    /* ---------- options (remembered in this browser only) ---------- */
    try {
        const o = JSON.parse(localStorage.getItem(OPT_KEY) || '{}') as {
            crowd?: unknown;
        } | null;

        if (isCrowd(o?.crowd)) {
            crowd = o.crowd;
        }
    } catch {
        // storage blocked
    }

    function saveOpts(): void {
        try {
            localStorage.setItem(OPT_KEY, JSON.stringify({ crowd }));
        } catch {
            // ignore
        }
    }

    function renderSeg(): void {
        crowdButtons().forEach((b) =>
            b.setAttribute(
                'aria-pressed',
                b.dataset.v === crowd ? 'true' : 'false',
            ),
        );
    }

    /* ---------- drawing ---------- */
    function setupCanvas(): void {
        const css = Math.min(560, Math.max(260, window.innerWidth - 34));
        ctx = Amb.deviceCanvas(cv, css, css);
        W = cv.width;
        H = cv.height;
    }

    function drawBlank(): void {
        ctx.fillStyle = Amb.monoColors().bg;
        ctx.fillRect(0, 0, W, H);
    }

    // 5x5 grid E with stroke s (integer device px), arms pointing `dir`
    function drawE(cx: number, cy: number, s: number, dir: Dir): void {
        const x0 = cx - Math.round(2.5 * s);
        const y0 = cy - Math.round(2.5 * s);

        for (let gy = 0; gy < 5; gy++) {
            for (let gx = 0; gx < 5; gx++) {
                if (!(gx === 0 || gy === 0 || gy === 2 || gy === 4)) {
                    continue;
                }

                let px = gx;
                let py = gy;

                if (dir === 'left') {
                    px = 4 - gx;
                    py = gy;
                } else if (dir === 'down') {
                    px = 4 - gy;
                    py = gx;
                } else if (dir === 'up') {
                    px = gy;
                    py = 4 - gx;
                }

                ctx.fillRect(x0 + px * s, y0 + py * s, s, s);
            }
        }
    }

    function drawTrial(): void {
        const col = Amb.monoColors();
        drawBlank();
        const s = sc!.value;
        const cx = Math.round(W / 2);
        const cy = Math.round(H / 2);
        target = rndDir();
        ctx.fillStyle = col.fg;
        drawE(cx, cy, s, target);

        if (crowd !== 'none') {
            const gap = crowd === 'light' ? 5 * s : Math.round(2.5 * s);
            const off = 5 * s + gap;
            const flankers: [number, number][] = [
                [off, 0],
                [-off, 0],
                [0, off],
                [0, -off],
            ];
            flankers.forEach(([dx, dy]) => drawE(cx + dx, cy + dy, s, rndDir()));
        }
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
        $('sTrial').textContent = `${live ? Math.min(n + 1, SC.maxTrials) : n} / ${SC.maxTrials}`;
        $('sAcc').textContent = n ? `${Math.round(sc!.accuracy * 100)}%` : '–';
        $('sPts').textContent = String(points);
        $('sNow').textContent = sc
            ? `${fmt(Amb.devPxToArcmin(sc.value * 5), 1)}′`
            : '–';
        $('prog').style.width = `${state === 'done' ? 100 : (n / SC.maxTrials) * 100}%`;
    }

    function ui(): void {
        const busy = state === 'running' || state === 'paused';
        crowdButtons().forEach((b) => {
            b.disabled = busy;
        });
        $('startBtn').textContent =
            state === 'running'
                ? t('Pause')
                : state === 'paused'
                  ? t('Continue')
                  : t('Start');
        stats();
    }

    /* ---------- trials ---------- */
    function startBlock(): void {
        clearTimers();
        setupCanvas();
        sc = new Amb.Staircase(SC);
        points = 0;
        state = 'running';
        phase = '';
        fb('');
        drawBlank();
        ui();
        Amb.setActive(true);
        later(nextTrial, 400);
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
        drawTrial();
        phase = 'stim';
        stats();
    }

    function answer(dir: Dir): void {
        if (state !== 'running' || phase !== 'stim') {
            return;
        }

        clearTimers();
        phase = 'gap';
        const s = sc!.value;
        const ok = dir === target;
        sc!.update(ok);

        if (ok) {
            points += Math.max(
                1,
                Math.round((5 + 15 * Math.log10(20 / s)) * MUL[crowd]),
            );
            Amb.beep('ok');
            fb(t('Correct'), true);
        } else {
            Amb.beep('bad');
            fb(t('Wrong'), false);
        }

        drawBlank();
        stats();
        later(nextTrial, 350);
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
            `<h2>${t('Pause')}</h2><p>${t('The exercise is stopped. When you are ready, check the glasses or the patch and press “Continue”.')}</p>`,
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
        later(nextTrial, 400);
    }

    function compare(
        cur: number,
        prev: number | null,
        higherBetter: boolean,
        prevMode?: string,
    ): string {
        let h: string;

        if (prev == null) {
            h = `<p>${t('This is your first result with this setting. Repeat the exercise in the coming days to see how you progress.')}</p>`;
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
        const stroke = sc!.threshold();
        const mar = Amb.devPxToArcmin(stroke);
        const a = Amb.acuityFromArcmin(mar);
        const atFloor = sc!.atFloor;
        const mode = Amb.settings().viewMode;
        const prev = Amb.results(ID)
            .filter((r) => r.crowd === crowd)
            .pop();
        Amb.saveResult(ID, {
            stroke: round(stroke, 3),
            mar: round(mar, 3),
            logMAR: round(a.logMAR, 3),
            decimal: round(a.decimal, 3),
            crowd,
            atFloor,
            trials: sc!.trials,
            acc: round(sc!.accuracy, 3),
            mode,
        });
        Amb.beep('win');
        Amb.overlay(
            `<h2>${t('Round finished')}</h2>` +
                '<div class="result-grid">' +
                cell(t('Estimated acuity'), fmt(a.decimal, 2)) +
                cell('logMAR', fmt(a.logMAR, 2)) +
                cell('Snellen', a.snellen) +
                cell(t('Correct answers'), `${Math.round(sc!.accuracy * 100)}%`) +
                cell(t('Points'), points) +
                '</div>' +
                `<p class="hint">${t(
                    'Setting: :crowd. Stroke width at the threshold: :mar minutes of arc.',
                    { crowd: t(CROWD[crowd]), mar: fmt(mar, 2) },
                )}` +
                (crowd === 'none'
                    ? ''
                    : ` ${t('With neighbouring letters the task is harder, so the value is usually lower than without neighbours.')}`) +
                '</p>' +
                (atFloor
                    ? `<p class="good">${t(
                          'You reached the limit of the screen: the smallest E possible at this distance. ' +
                              'Next time sit further away (for example at 1.5 m) and update the distance in the ' +
                              '<a href=":url">calibration</a>, so that we can measure more finely.',
                          { url: Amb.urls.calibration },
                      )}</p>`
                    : '') +
                compare(a.decimal, prev ? prev.decimal : null, true, prev?.mode) +
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

        const d = KEYMAP[e.key];

        if (!d || state !== 'running') {
            return;
        }

        e.preventDefault();

        if (e.repeat) {
            return;
        }

        answer(d);
    });
    rt.root
        .querySelectorAll<HTMLButtonElement>('.pad .resp')
        .forEach((b) =>
            rt.on(b, 'click', () => {
                if (isDir(b.dataset.d)) {
                    answer(b.dataset.d);
                }
            }),
        );
    rt.on<MouseEvent>(crowdBox, 'click', (e) => {
        const b = (e.target as Element).closest('button');

        if (!b || b.disabled || !isCrowd(b.dataset.v)) {
            return;
        }

        crowd = b.dataset.v;
        renderSeg();
        saveOpts();
    });
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
        }
    });

    /* ---------- init ---------- */
    const st = Amb.settings();
    const distLine = t('Sit about :cm cm from the screen.', {
        cm: st.distanceCm,
    });
    $('instr').innerHTML = `<p>${Amb.setupText('mono')}</p><p>${distLine}</p>`;
    const calText =
        t('The screen is not calibrated yet, so the acuity values are approximate.') +
        ` <a href="${Amb.urls.calibration}">${t('Calibrate the screen size')}</a>.`;

    if (!st.sizeCalibrated) {
        $('calHint').hidden = false;
        $('calHint').innerHTML = calText;
    }

    renderSeg();
    setupCanvas();
    drawBlank();
    ui();

    Amb.startTracking(ID, { onPause: pause, onResume: () => {} });

    Amb.overlay(
        `<h2>${t('Letter E: which way does it point?')}</h2>` +
            `<p>${Amb.setupText('mono')}</p>` +
            `<p>${distLine}</p>` +
            `<p>${t(
                'A rotated letter E appears in the middle. Say which way its “arms” point: up, down, left or right ' +
                    '(the arrow keys or the buttons). The letter gets smaller when you answer correctly. ' +
                    'When it is too small, guess: that is normal.',
            )}</p>` +
            `<p>${t('The letters around it (the neighbours) make the exercise harder, but also more useful for the lazy eye.')}</p>` +
            (st.sizeCalibrated ? '' : `<p class="hint">${calText}</p>`),
        [
            { label: t('Options') },
            { label: t('Start'), primary: true, onClick: startBlock },
        ],
    );
}
