// "Contrast fin" (contrast sensitivity): a Gabor patch (striped blob) on a
// mean-grey background, tilted left or right, with a contrast that follows an
// adaptive staircase. Trains contrast sensitivity of the lazy eye.
// Ported from Exercitii-ambliopie/contrast.html.
import Amb from '@/amb';
import type { RGB } from '@/amb/display';
import type { Runtime } from '@/exercises/runtime';
import { getLocale, t } from '@/i18n';

const ID = 'contrast';
/** Mean grey level (0..255) of the background and of the Gabor. */
const L0 = 127.5;
/** Spatial frequency and display time, remembered in this browser only. */
const OPT_KEY = 'amb.opt.contrast';

type Geometry = {
    /** chosen spatial frequency (cycles / degree) */
    sf: number;
    /** wavelength in device px */
    lam: number;
    /** Gaussian envelope sigma in device px */
    sig: number;
    /** the chosen frequency needs stripes thinner than 3 px */
    tooFine: boolean;
    /** frequency actually drawn (cycles / degree) */
    sfReal: number;
};

export default function start(rt: Runtime): void {
    const { $ } = rt;
    const fmt = (n: number, d: number): string => {
        const s = Number(n).toFixed(d);

        return getLocale() === 'en' ? s : s.replace('.', ',');
    };
    const round = (n: number, d: number): number =>
        Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
    const pct = (c: number): string => `${fmt(c * 100, c < 0.01 ? 2 : 1)}%`;
    const cell = (label: string, value: string | number): string =>
        `<div><span>${label}</span><b>${value}</b></div>`;
    const cv = $<HTMLCanvasElement>('cv');
    const sfSel = $<HTMLSelectElement>('sf');
    const durSel = $<HTMLSelectElement>('dur');
    const SC = {
        start: 0.3,
        min: 0.004,
        max: 1,
        down: 3,
        stepsLog: [0.3, 0.15, 0.1],
        maxTrials: 70,
        maxReversals: 12,
    };

    let ctx: CanvasRenderingContext2D;
    let W = 0;
    let H = 0;
    let mask: RGB = [1, 1, 1];
    let bgImg: ImageData;
    let stimImg: ImageData;
    let G: Geometry;
    let state: 'idle' | 'running' | 'paused' | 'done' = 'idle';
    let phase: '' | 'fix' | 'stim' | 'wait' | 'gap' = '';
    let sc: InstanceType<typeof Amb.Staircase> | null = null;
    let points = 0;
    let tilt = 1;
    let timers: number[] = [];
    const later = (fn: () => void, ms: number): void => {
        timers.push(rt.timeout(fn, ms));
    };
    const clearTimers = (): void => {
        timers.forEach(rt.clearTimeout);
        timers = [];
    };

    /* ---------- options (remembered in this browser only) ---------- */
    function setSel(sel: HTMLSelectElement, v: unknown): void {
        if (
            typeof v === 'string' &&
            Array.from(sel.options).some((o) => o.value === v)
        ) {
            sel.value = v;
        }
    }

    try {
        const o = JSON.parse(localStorage.getItem(OPT_KEY) || '{}') as {
            sf?: unknown;
            dur?: unknown;
        } | null;
        setSel(sfSel, o?.sf);
        setSel(durSel, o?.dur);
    } catch {
        // storage blocked
    }

    function saveOpts(): void {
        try {
            localStorage.setItem(
                OPT_KEY,
                JSON.stringify({ sf: sfSel.value, dur: durSel.value }),
            );
        } catch {
            // ignore
        }
    }

    /* ---------- canvas + stimulus ---------- */
    function setupCanvas(): void {
        const css = Math.min(440, Math.max(240, window.innerWidth - 34));
        ctx = Amb.deviceCanvas(cv, css, css);
        W = cv.width;
        H = cv.height;
        mask = Amb.channelMask();
        // Dithered mean-grey background, reused for blank, fixation and stimulus frames
        bgImg = ctx.createImageData(W, H);
        const d = bgImg.data;

        for (let i = 0; i < d.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                d[i + c] = mask[c] ? L0 * mask[c] + Math.random() - 0.5 : 0;
            }

            d[i + 3] = 255;
        }

        stimImg = ctx.createImageData(W, H);
    }

    function geometry(): Geometry {
        const ppd = Amb.devPxPerDeg();
        const sf = parseFloat(sfSel.value);
        let lam = ppd / sf;
        const tooFine = lam < 3;

        if (tooFine) {
            lam = 3;
        }

        const sig = Math.min(Math.max(0.35 * ppd, 0.9 * lam), W / 7);

        return { sf, lam, sig, tooFine, sfReal: ppd / lam };
    }

    function updateWarn(): void {
        const g = geometry();
        const el = $('sfWarn');
        el.hidden = !g.tooFine;

        if (g.tooFine) {
            el.textContent = t(
                'The chosen frequency is too high for this screen and this distance (the stripes would be thinner than 3 pixels). ' +
                    'About :sf cycles/degree are used. Choose a lower frequency or sit further from the screen ' +
                    '(and change the distance in the calibration).',
                { sf: fmt(g.sfReal, 1) },
            );
        }
    }

    function drawBlank(): void {
        ctx.putImageData(bgImg, 0, 0);
    }

    function drawFix(): void {
        drawBlank();
        const r = Amb.dpr();
        const a = Math.round(8 * r);
        const th = Math.max(2, Math.round(2 * r));
        const cx = Math.round(W / 2);
        const cy = Math.round(H / 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(cx - a, cy - Math.round(th / 2), 2 * a, th);
        ctx.fillRect(cx - Math.round(th / 2), cy - a, th, 2 * a);
    }

    // dir: 1 = "/" (tilted right), -1 = "\" (tilted left); y points down
    function drawGabor(c: number, dir: number): void {
        const d = stimImg.data;
        d.set(bgImg.data);
        const cx = W / 2;
        const cy = H / 2;
        const R = Math.ceil(3.5 * G.sig);
        const R2 = R * R;
        const x0 = Math.max(0, Math.floor(cx - R));
        const x1 = Math.min(W - 1, Math.ceil(cx + R));
        const y0 = Math.max(0, Math.floor(cy - R));
        const y1 = Math.min(H - 1, Math.ceil(cy + R));
        const k = (2 * Math.PI) / G.lam;
        const inv = 1 / (2 * G.sig * G.sig);
        const ph = Math.random() * 2 * Math.PI;
        const [m0, m1, m2] = mask;
        const s2 = Math.SQRT1_2;

        for (let y = y0; y <= y1; y++) {
            const dy = y + 0.5 - cy;

            for (let x = x0; x <= x1; x++) {
                const dx = x + 0.5 - cx;
                const r2 = dx * dx + dy * dy;

                if (r2 > R2) {
                    continue;
                }

                const v =
                    L0 *
                    (1 +
                        c *
                            Math.exp(-r2 * inv) *
                            Math.cos(k * (dx + dir * dy) * s2 + ph));
                const i = (y * W + x) * 4;

                // random dithering so contrasts below 1/128 still show on average
                if (m0) {
                    d[i] = v * m0 + Math.random() - 0.5;
                }

                if (m1) {
                    d[i + 1] = v * m1 + Math.random() - 0.5;
                }

                if (m2) {
                    d[i + 2] = v * m2 + Math.random() - 0.5;
                }
            }
        }

        ctx.putImageData(stimImg, 0, 0);
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
        $('sNow').textContent = sc ? pct(sc.value) : '–';
        $('prog').style.width = `${state === 'done' ? 100 : (n / SC.maxTrials) * 100}%`;
    }

    function ui(): void {
        const busy = state === 'running' || state === 'paused';
        sfSel.disabled = busy;
        durSel.disabled = busy;
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
        G = geometry();
        updateWarn();
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
        phase = 'fix';
        drawFix();
        stats();
        later(showStim, 500 + Math.random() * 300);
    }

    function showStim(): void {
        if (state !== 'running') {
            return;
        }

        tilt = Math.random() < 0.5 ? 1 : -1;
        drawGabor(sc!.value, tilt);
        phase = 'stim';
        const dur = parseFloat(durSel.value);

        if (dur > 0) {
            later(() => {
                if (phase === 'stim') {
                    drawBlank();
                    phase = 'wait';
                }
            }, dur * 1000);
        }
    }

    function answer(a: number): void {
        if (state !== 'running' || (phase !== 'stim' && phase !== 'wait')) {
            return;
        }

        clearTimers();
        phase = 'gap';
        const c = sc!.value;
        const ok = a === tilt;
        sc!.update(ok);

        if (ok) {
            points += Math.max(1, Math.round(5 + 10 * Math.log10(1 / c)));
            Amb.beep('ok');
            fb(t('Correct'), true);
        } else {
            Amb.beep('bad');
            fb(t('Wrong'), false);
        }

        drawBlank();
        stats();
        later(nextTrial, 450);
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
        const thr = sc!.threshold();
        const cs = 1 / thr;
        const mode = Amb.settings().viewMode;
        const prev = Amb.results(ID)
            .filter((r) => r.sf === G.sf)
            .pop();
        Amb.saveResult(ID, {
            thr: round(thr, 5),
            cs: round(cs, 2),
            sf: G.sf,
            trials: sc!.trials,
            acc: round(sc!.accuracy, 3),
            mode,
        });
        Amb.beep('win');
        const limit = G.tooFine
            ? t(' (limited to about :sf by the screen)', {
                  sf: fmt(G.sfReal, 1),
              })
            : '';
        Amb.overlay(
            `<h2>${t('Round finished')}</h2>` +
                '<div class="result-grid">' +
                cell(t('Contrast threshold'), pct(thr)) +
                cell(t('Contrast sensitivity'), fmt(cs, cs < 10 ? 1 : 0)) +
                cell(t('Correct answers'), `${Math.round(sc!.accuracy * 100)}%`) +
                cell(t('Points'), points) +
                '</div>' +
                `<p class="hint">${t(
                    'Frequency: :sf cycles/degree:limit. A lower threshold means you see fainter stripes, that is a higher sensitivity.',
                    { sf: fmt(G.sf, G.sf % 1 ? 1 : 0), limit },
                )}</p>` +
                (sc!.atFloor
                    ? `<p class="good">${t('You reached the lowest contrast in the program (0.4%). Very good!')}</p>`
                    : '') +
                compare(cs, prev ? prev.cs : null, true, prev?.mode) +
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

        const k = e.key;

        if (
            k !== 'ArrowLeft' &&
            k !== 'ArrowRight' &&
            k !== 'ArrowUp' &&
            k !== 'ArrowDown'
        ) {
            return;
        }

        if (state !== 'running') {
            return;
        }

        e.preventDefault();

        if (e.repeat) {
            return;
        }

        if (k === 'ArrowLeft') {
            answer(-1);
        } else if (k === 'ArrowRight') {
            answer(1);
        }
    });
    rt.on($('bL'), 'click', () => answer(-1));
    rt.on($('bR'), 'click', () => answer(1));
    rt.on($('startBtn'), 'click', () => {
        if (state === 'running') {
            pause();
        } else if (state === 'paused') {
            resume();
        } else {
            startBlock();
        }
    });
    rt.on(sfSel, 'change', () => {
        updateWarn();
        saveOpts();
    });
    rt.on(durSel, 'change', saveOpts);
    rt.on(window, 'resize', () => {
        if (state !== 'running') {
            setupCanvas();
            G = geometry();
            updateWarn();
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
        t(
            'The screen is not calibrated yet, so the stripe frequency and the values are approximate.',
        ) +
        ` <a href="${Amb.urls.calibration}">${t('Calibrate the screen size')}</a>.`;

    if (!st.sizeCalibrated) {
        $('calHint').hidden = false;
        $('calHint').innerHTML = calText;
    }

    setupCanvas();
    G = geometry();
    drawBlank();
    updateWarn();
    ui();

    Amb.startTracking(ID, { onPause: pause, onResume: () => {} });

    Amb.overlay(
        `<h2>${t('Contrast sensitivity')}</h2>` +
            `<p>${Amb.setupText('mono')}</p>` +
            `<p>${distLine}</p>` +
            `<p>${t(
                'A cross appears in the centre. Look at it. Then a striped patch appears briefly, sometimes very faint. ' +
                    'Say whether the stripes are tilted to the left ╲ (<kbd>←</kbd>) or to the right ╱ (<kbd>→</kbd>). ' +
                    'If you see nothing, guess: that is normal, this is how we find the threshold.',
            )}</p>` +
            (st.sizeCalibrated ? '' : `<p class="hint">${calText}</p>`),
        [
            { label: t('Options') },
            { label: t('Start'), primary: true, onClick: startBlock },
        ],
    );
}
