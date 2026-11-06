// "Linii aliniate" (vernier acuity): two vertical lines, the lower one is
// shifted left or right by a few seconds of arc. Trains position precision
// (hyperacuity) of the lazy eye. Ported from Exercitii-ambliopie/vernier.html.
import Amb from '@/amb';
import { t } from '@/i18n';
import type { Runtime } from '@/exercises/runtime';

const ID = 'vernier';

export default function start(rt: Runtime): void {
    const { $ } = rt;
    const fmt = (n: number, d: number): string =>
        Number(n).toFixed(d).replace('.', ',');
    const round = (n: number, d: number): number =>
        Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
    const cell = (label: string, value: string | number): string =>
        `<div><span>${label}</span><b>${value}</b></div>`;
    const sec = (a: number): string => `${fmt(a, a < 10 ? 1 : 0)}″`;
    const cv = $<HTMLCanvasElement>('cv');
    const SC = {
        start: 6,
        min: 0.15,
        max: 40,
        down: 3,
        stepsLog: [0.3, 0.15, 0.1],
        maxTrials: 60,
        maxReversals: 12,
    };

    let ctx: CanvasRenderingContext2D;
    let W = 0;
    let H = 0;
    let state: 'idle' | 'running' | 'paused' | 'done' = 'idle';
    let phase = '';
    let sc: InstanceType<typeof Amb.Staircase> | null = null;
    let points = 0;
    let side = 1;
    let timers: number[] = [];
    const later = (fn: () => void, ms: number): void => {
        timers.push(rt.timeout(fn, ms));
    };
    const clearTimers = (): void => {
        timers.forEach(rt.clearTimeout);
        timers = [];
    };

    /* ---------- drawing ---------- */
    function setupCanvas(): void {
        const cssW = Math.min(560, Math.max(260, window.innerWidth - 34));
        ctx = Amb.deviceCanvas(cv, cssW, Math.round(cssW * 0.75));
        W = cv.width;
        H = cv.height;
    }

    function drawBlank(): void {
        ctx.fillStyle = Amb.monoColors().bg;
        ctx.fillRect(0, 0, W, H);
    }

    function drawTrial(): void {
        const col = Amb.monoColors();
        const r = Amb.dpr();
        const ppd = Amb.devPxPerDeg();
        const lw = Math.max(2, Math.round(2 * r));
        const len = Math.max(30, Math.round(0.6 * ppd));
        const gap = Math.max(4, Math.round(0.12 * ppd));
        const jx = Math.round((Math.random() * 2 - 1) * 40 * r);
        let jy = Math.round((Math.random() * 2 - 1) * 30 * r);
        // keep the pair inside the canvas on small screens
        const half = len + gap / 2;
        const room = Math.max(0, Math.floor(H / 2 - half - 4));
        jy = Math.max(-room, Math.min(room, jy));
        side = Math.random() < 0.5 ? -1 : 1;
        const d = sc!.value;
        const xU = Math.round(W / 2 + jx - lw / 2);
        const yTop = Math.round(H / 2 + jy - gap / 2 - len);
        drawBlank();
        ctx.fillStyle = col.fg;
        ctx.fillRect(xU, yTop, lw, len);
        // fractional offset: canvas antialiasing renders the sub-pixel shift
        ctx.fillRect(xU + side * d, yTop + len + gap, lw, len);
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
        $('sNow').textContent = sc ? sec(Amb.devPxToArcsec(sc.value)) : '–';
        $('prog').style.width = `${state === 'done' ? 100 : (n / SC.maxTrials) * 100}%`;
    }

    function ui(): void {
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

    function answer(a: number): void {
        if (state !== 'running' || phase !== 'stim') {
            return;
        }

        clearTimers();
        phase = 'gap';
        const d = sc!.value;
        const ok = a === side;
        sc!.update(ok);

        if (ok) {
            points += Math.max(1, Math.round(5 + 10 * Math.log10(40 / d)));
            Amb.beep('ok');
            fb(t('Correct'), true);
        } else {
            Amb.beep('bad');
            fb(t('Wrong'), false);
        }

        drawBlank();
        stats();
        later(nextTrial, 400);
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
            `<h2>${t('Pause')}</h2><p>${t('The exercise is paused. When you are ready, check the glasses or the patch and press “Continue”.')}</p>`,
            [
                { label: t('Main menu'), onClick: () => Amb.go(Amb.urls.home) },
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
            h = `<p>${t('This is your first result. Repeat the exercise in the next days to see how you progress.')}</p>`;
        } else {
            const p =
                prev > 0
                    ? ((higherBetter ? cur - prev : prev - cur) / prev) * 100
                    : 0;

            if (Math.abs(p) < 3) {
                h = `<p>${t('Almost the same as last time. Being steady is a good sign, keep going!')}</p>`;
            } else if (p > 0) {
                h = `<p class="good">${t('Better by :pct% than last time.', { pct: Math.round(p) })}</p><p>${t('Well done! Regular practice pays off.')}</p>`;
            } else {
                h =
                    `<p class="bad">${t('Weaker by :pct% than last time.', { pct: Math.round(-p) })}</p>` +
                    `<p>${t('Do not worry: tiredness, light and attention change the result from one day to the next. The trend over several days is what counts.')}</p>`;
            }

            if (prevMode && prevMode !== Amb.settings().viewMode) {
                h += `<p class="hint">${t('Last time you worked in another mode (glasses / patch), so the comparison is only approximate.')}</p>`;
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
        const mode = Amb.settings().viewMode;
        const prev = Amb.results(ID).pop();
        Amb.saveResult(ID, {
            px: round(px, 3),
            arcsec: round(arcsec, 1),
            trials: sc!.trials,
            acc: round(sc!.accuracy, 3),
            mode,
        });
        Amb.beep('win');
        Amb.overlay(
            `<h2>${t('Round finished')}</h2>` +
                `<p>${t('Alignment threshold: <b>:value</b> (seconds of arc)', { value: sec(arcsec) })}</p>` +
                '<div class="result-grid">' +
                cell(t('Alignment threshold'), sec(arcsec)) +
                cell(t('In screen pixels'), fmt(px, 2)) +
                cell(t('Correct answers'), `${Math.round(sc!.accuracy * 100)}%`) +
                cell(t('Points'), points) +
                '</div>' +
                `<p class="hint">${t('Lower is better. As a rough guide, a healthy eye usually gets to about 10–30″ (it depends a lot on the screen, the distance and the light).')}</p>` +
                (sc!.atFloor
                    ? `<p class="good">${t('You reached the smallest shift of the program. To measure finer, sit further from the screen and update the distance in the <a href=":url">calibration</a>.', { url: Amb.urls.calibration })}</p>`
                    : '') +
                compare(arcsec, prev ? prev.arcsec : null, false, prev?.mode) +
                `<p class="hint">${t('The numbers are training estimates, not a medical diagnosis.')}</p>`,
            [
                { label: t('Main menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('One more round'), primary: true, onClick: startBlock },
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
    rt.on(window, 'resize', () => {
        if (state !== 'running') {
            setupCanvas();
            drawBlank();
        }
    });

    /* ---------- init ---------- */
    const st = Amb.settings();
    const distLine = t('Sit about :cm cm from the screen.', { cm: st.distanceCm });
    $('instr').innerHTML = `<p>${Amb.setupText('mono')}</p><p>${distLine}</p>`;
    const calText = t(
        'The screen is not calibrated yet, so the values in seconds of arc are approximate. <a href=":url">Calibrate the screen size</a>.',
        { url: Amb.urls.calibration },
    );

    if (!st.sizeCalibrated) {
        $('calHint').hidden = false;
        $('calHint').innerHTML = calText;
    }

    setupCanvas();
    drawBlank();
    ui();

    Amb.startTracking(ID, { onPause: pause, onResume: () => {} });

    Amb.overlay(
        `<h2>${t('Aligned lines')}</h2>` +
            `<p>${Amb.setupText('mono')}</p>` +
            `<p>${distLine}</p>` +
            `<p>${t('Two vertical lines appear, one above the other. The lower line is shifted a little to the left or to the right. Say which way (<kbd>←</kbd> or <kbd>→</kbd>). The shift gets smaller when you answer correctly; when you no longer see the difference, guess: that is normal.')}</p>` +
            (st.sizeCalibrated ? '' : `<p class="hint">${calText}</p>`),
        [{ label: t('Start'), primary: true, onClick: startBlock }],
    );
}
