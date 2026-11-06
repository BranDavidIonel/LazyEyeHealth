// "Convergence training" (slug 'convergenta'): strabismus / convergence work
// with the red-cyan glasses, like the anaglyph vectograms orthoptists use.
// Each eye gets its own copy of a round fusion target in its lens colour
// (additive blending on black). Moving the copies apart "crossed" (base-out)
// asks the eyes to turn in (converge) to keep one single picture; "uncrossed"
// (base-in) asks them to turn out. Two small marks, one seen by each eye only
// (nonius lines), show suppression: if a mark disappears, that eye switched off.
//
// Geometry: a demand of P prism dioptres at viewing distance D (mm) needs an
// on-screen separation s = P × D / 100 mm between the two copies.
//
// Modes:
//   measure  demand ramps up from 0 (1Δ / 1.5 s) until it doubles (break),
//            then down until it is single again (recovery); base-out, then
//            optionally base-in.
//   train    jump vergence: alternates between 2Δ and an adaptive target demand.
//            After every jump a letter E split between the eyes (spine for one
//            eye, bars for the other) must be read: only a fused, clear target
//            shows the whole letter.
import Amb from '@/amb';
import type { AmbResult } from '@/amb';
import type { RGB } from '@/amb/display';
import type { Side } from '@/amb/settings';
import type { Runtime } from '@/exercises/runtime';
import { t } from '@/i18n';
import { formatDate, formatNumber } from '@/utils/format';

const ID = 'convergenta';
/** Speed of the measurement ramp: 1 prism dioptre every 1.5 s. */
const RAMP_PER_S = 1 / 1.5;
/** Low demand of the jumps (Δ, base-out). */
const LOW = 2;
/** First target demand of the jumps when there is no measurement yet. */
const DEFAULT_TARGET = 8;
const MIN_TARGET = 4;
/** No answer within this time = the target did not fuse. */
const ANSWER_TIMEOUT_MS = 10000;
/** A correct answer slower than this does not make the next jump harder. */
const FAST_MS = 6000;
/** Target kept fused (without the letter) after a correct answer. */
const HOLD_OK_MS = 1200;
/** Rest at a low demand after a failed jump. */
const REST_MS = 1800;
/** Longest exercise time per visit of the page (safety rule: max 10 minutes). */
const MAX_ACTIVE_MS = 10 * 60 * 1000;
/** Upper limit of the demand, whatever the screen allows. */
const MAX_DEMAND_CAP = 45;
const DISTANCES = [40, 50, 60];
const TRAIN_MINUTES = [3, 4, 5];

type Mode = 'measure' | 'train';
type Base = 'bo' | 'bi';
type Phase = 'idle' | 'ready' | 'up' | 'down' | 'jump' | 'rest';
type Centre = 'cross' | 'e';
type Measure = {
    bo_break?: number;
    bo_recovery?: number;
    bo_supp?: boolean;
    bo_limit?: boolean;
    bi_break?: number;
    bi_recovery?: number;
    bi_supp?: boolean;
    bi_limit?: boolean;
};

export default function start(rt: Runtime): void {
    const { $ } = rt;
    const cv = $<HTMLCanvasElement>('cv');

    /* ---------- small helpers ---------- */
    const round05 = (v: number): number => Math.round(v * 2) / 2;
    const fmtD = (v: number): string =>
        `${formatNumber(v, Number.isInteger(v) ? 0 : 1)}Δ`;
    const fmtS = (ms: number): string => `${formatNumber(ms / 1000, 1)} s`;
    const mmss = (ms: number): string => {
        const s = Math.max(0, Math.ceil(ms / 1000));

        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };
    const cell = (label: string, value: string | number): string =>
        `<div><span>${label}</span><b>${value}</b></div>`;
    const eyeName = (eye: Side): string => Amb.EYE[eye];
    const distanceCm = (): number => Amb.settings().distanceCm;

    /* ---------- state ---------- */
    let ctx: CanvasRenderingContext2D;
    let W = 0;
    let H = 0;
    let pxPerMm = 1;
    /** Outer radius of the fusion target (device px). */
    let R = 60;
    let eSize = 20;
    let maxDemand = 0;

    let mode: Mode = 'measure';
    let state: 'idle' | 'running' | 'paused' | 'done' = 'idle';
    let phase: Phase = 'idle';
    let base: Base = 'bo';
    let demand = 0;
    let rampFrom = 0;
    let rampT0 = 0;
    let lastFrame = 0;
    let activeMs = 0;
    /** Brightness of the good eye's picture (lower it when the lazy eye's mark disappears). */
    let goodLevel = 1;

    // measurement
    let meas: Measure = {};
    let measureUnsaved = false;

    // training
    let sc: InstanceType<typeof Amb.Staircase> | null = null;
    let trainMinutes = 4;
    let trainMs = 0;
    let trainUnsaved = false;
    let jumps = 0;
    let okCount = 0;
    let fuseSum = 0;
    let fuseN = 0;
    let maxBo = 0;
    let isHigh = false;
    let nextHigh = false;
    let lowFails = 0;
    let eDir = 0;
    let spineEye: Side = 'left';
    let jumpT0 = 0;
    let restUntil = 0;

    /* ---------- colours and geometry ---------- */
    function eyeColor(eye: Side): string {
        const s = Amb.settings();
        const c: RGB =
            eye === s.lazyEye
                ? Amb.eyeRGB('lazy', 1)
                : Amb.eyeRGB('fellow', goodLevel);

        return Amb.rgb(c);
    }

    /** On-screen separation (device px) of the two copies for a demand in Δ. */
    function sepPx(prism: number): number {
        return ((prism * distanceCm() * 10) / 100) * pxPerMm;
    }

    function setupCanvas(): void {
        const vw = document.documentElement.clientWidth || window.innerWidth;
        const wide = vw >= 1000;
        const cssW = wide
            ? Math.min(1100, vw - 360)
            : Math.max(260, vw - 34);
        const cssH = Math.round(
            Math.max(
                240,
                Math.min(cssW * 0.55, 520, window.innerHeight - 170),
            ),
        );
        ctx = Amb.deviceCanvas(cv, cssW, cssH);
        W = cv.width;
        H = cv.height;
        pxPerMm = Amb.devPxPerMm();
        R = Math.max(30, Math.min(H * 0.4, 18 * pxPerMm, W * 0.2));
        eSize = Math.min(
            Math.max(Amb.devPxPerDeg(distanceCm()) * 1.0, 14 * Amb.dpr()),
            0.34 * R,
        );
        const margin = 6 * Amb.dpr();
        const room = Math.max(0, W - 2 * R - 2 * margin);
        maxDemand = Math.min(
            MAX_DEMAND_CAP,
            Math.floor(((room / pxPerMm) * 100) / (distanceCm() * 10)),
        );
        limitHint();
    }

    /* ---------- drawing ---------- */
    function ringRow(
        cx: number,
        cy: number,
        r1: number,
        r2: number,
        n: number,
        odd: boolean,
    ): void {
        const step = (Math.PI * 2) / n;

        for (let i = odd ? 1 : 0; i < n; i += 2) {
            const a0 = i * step - Math.PI / 2;
            const a1 = a0 + step;
            ctx.beginPath();
            ctx.arc(cx, cy, r2, a0, a1);
            ctx.arc(cx, cy, r1, a1, a0, true);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawE(cx: number, cy: number, part: 'spine' | 'bars'): void {
        const h = eSize;
        const s = h / 5;
        ctx.save();
        ctx.translate(cx, cy);
        // eDir: 0 = legs to the right, 1 = down, 2 = left, 3 = up
        ctx.rotate((eDir * Math.PI) / 2);

        if (part === 'spine') {
            ctx.fillRect(-h / 2, -h / 2, s, h);
        } else {
            ctx.fillRect(-h / 2 + s, -h / 2, h - s, s);
            ctx.fillRect(-h / 2 + s, -s / 2, h - s, s);
            ctx.fillRect(-h / 2 + s, h / 2 - s, h - s, s);
        }

        ctx.restore();
    }

    /** One eye's picture: textured ring, its own suppression mark, the centre detail. */
    function drawEye(eye: Side, cx: number, cy: number, centre: Centre): void {
        const col = eyeColor(eye);
        const lw = Math.max(2, Math.round(R * 0.03));
        ctx.fillStyle = col;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;

        // outer and inner circles + two rows of alternating segments (fusion lock)
        ctx.beginPath();
        ctx.arc(cx, cy, R - lw / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 0.64 * R, 0, Math.PI * 2);
        ctx.stroke();
        ringRow(cx, cy, 0.7 * R, 0.83 * R, 20, false);
        ringRow(cx, cy, 0.85 * R, 0.95 * R, 20, true);

        // suppression mark: left eye above the centre, right eye below
        const mw = Math.max(2 * Amb.dpr(), R * 0.05);
        const y0 = eye === 'left' ? cy - 0.56 * R : cy + 0.36 * R;
        ctx.fillRect(cx - mw / 2, y0, mw, 0.2 * R);

        if (centre === 'cross') {
            const arm = 0.1 * R;
            ctx.fillRect(cx - arm, cy - lw / 2, arm * 2, lw);
            ctx.fillRect(cx - lw / 2, cy - arm, lw, arm * 2);
        } else {
            drawE(cx, cy, eye === spineEye ? 'spine' : 'bars');
        }
    }

    function draw(): void {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        // base-out (convergence) = crossed: left eye's copy to the right, right eye's to the left
        const dir = base === 'bi' && mode === 'measure' ? -1 : 1;
        const half = (sepPx(demand) / 2) * dir;
        const centre: Centre =
            mode === 'train' && phase === 'jump' ? 'e' : 'cross';
        ctx.globalCompositeOperation = 'lighter';
        drawEye('left', W / 2 + half, H / 2, centre);
        drawEye('right', W / 2 - half, H / 2, centre);
        ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- side panel ---------- */
    function fb(text: string, ok?: boolean): void {
        const el = $('fb');
        el.textContent = text;
        el.className =
            'feedback' + (ok === true ? ' good' : ok === false ? ' bad' : '');
    }

    function limitHint(): void {
        $('limitHint').textContent = t(
            'At :cm cm this screen allows up to :max.',
            { cm: distanceCm(), max: fmtD(maxDemand) },
        );
    }

    function lastMeasure(): AmbResult | undefined {
        return Amb.results(ID)
            .filter(
                (r) => r.kind === 'measure' && typeof r.bo_break === 'number',
            )
            .pop();
    }

    function lastTrain(): AmbResult | undefined {
        return Amb.results(ID)
            .filter((r) => r.kind === 'train' && typeof r.max_bo === 'number')
            .pop();
    }

    function pair(brk?: number, rec?: number, limit?: boolean): string {
        if (brk == null) {
            return '–';
        }

        return `${limit ? '≥ ' : ''}${fmtD(brk)} / ${rec == null ? '…' : fmtD(rec)}`;
    }

    function phaseText(): string {
        if (state === 'idle' || state === 'done') {
            return mode === 'measure'
                ? t('Choose the mode and press Start.')
                : t('Choose the length of the session and press Start.');
        }

        if (state === 'paused') {
            return t('Paused.');
        }

        if (mode === 'train') {
            return phase === 'jump'
                ? t('Make the target single and say which way the letter E points (arrow keys or buttons). If it does not join, press “I see double” (<kbd>D</kbd>).')
                : t('Keep the target single. The next jump comes in a moment.');
        }

        if (phase === 'ready') {
            return t('Look at the cross in the middle. When you see one single target and both small marks, press <kbd>Space</kbd> or the button.');
        }

        if (phase === 'up') {
            return base === 'bo'
                ? t('The pictures are slowly moving apart. Keep the target single and clear. Press <kbd>Space</kbd> as soon as it doubles. If a small mark disappears instead, press <kbd>S</kbd>.')
                : t('The pictures are slowly moving apart the other way. Press <kbd>Space</kbd> as soon as it doubles. If a small mark disappears instead, press <kbd>S</kbd>.');
        }

        return t('Now the pictures come back together. Press <kbd>Space</kbd> when you see one single target with both marks again.');
    }

    function ui(): void {
        const running = state === 'running' || state === 'paused';
        $('startBtn').textContent =
            state === 'running'
                ? t('Pause')
                : state === 'paused'
                  ? t('Continue')
                  : t('Start');
        $('segMode')
            .querySelectorAll<HTMLButtonElement>('button[data-mode]')
            .forEach((b) => {
                b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
                b.disabled = running;
            });
        $('segDur')
            .querySelectorAll<HTMLButtonElement>('button[data-min]')
            .forEach((b) => {
                b.setAttribute(
                    'aria-pressed',
                    String(Number(b.dataset.min) === trainMinutes),
                );
                b.disabled = running;
            });
        $<HTMLButtonElement>('infoBtn').disabled = running;
        $('pMeasure').hidden = mode !== 'measure';
        $('pTrain').hidden = mode !== 'train';
        $('durField').hidden = mode !== 'train';
        $('phaseText').innerHTML = phaseText();

        const main = $<HTMLButtonElement>('bMain');
        const supp = $<HTMLButtonElement>('bSupp');
        const live = state === 'running' && mode === 'measure';
        main.disabled = !live;
        supp.disabled = !live;
        supp.hidden = phase === 'down';
        main.textContent =
            phase === 'up'
                ? t('It doubled')
                : phase === 'down'
                  ? t('Single again')
                  : t('I see one – start');
        supp.textContent =
            phase === 'up'
                ? t('A small mark disappeared (S)')
                : t('I see double even now');

        const trainLive = state === 'running' && mode === 'train';
        $('pTrain')
            .querySelectorAll<HTMLButtonElement>('button')
            .forEach((b) => {
                b.disabled = !trainLive;
            });
        stats();
    }

    function stats(): void {
        const ramping =
            mode === 'measure' && (phase === 'up' || phase === 'down');
        $('sNow').textContent =
            state === 'running' || state === 'paused'
                ? ramping
                    ? t('hidden')
                    : fmtD(round05(demand))
                : '–';
        $('sBo').textContent = pair(
            meas.bo_break,
            meas.bo_recovery,
            meas.bo_limit,
        );
        $('sBi').textContent = pair(
            meas.bi_break,
            meas.bi_recovery,
            meas.bi_limit,
        );
        const prev = lastMeasure();
        $('sPrev').textContent = prev
            ? pair(prev.bo_break, prev.bo_recovery, prev.bo_limit)
            : '–';

        const total = trainMinutes * 60000;
        $('sLeft').textContent = mmss(
            mode === 'train' && sc ? total - trainMs : total,
        );
        $('sNowT').textContent =
            mode === 'train' && sc && state !== 'idle'
                ? fmtD(round05(demand))
                : '–';
        $('sOk').textContent = `${okCount} / ${jumps}`;
        $('sAvg').textContent = fuseN ? fmtS(fuseSum / fuseN) : '–';
        $('sMax').textContent = maxBo ? fmtD(maxBo) : '–';
        $('prog').style.width = `${Math.min(100, (trainMs / total) * 100)}%`;
    }

    /* ---------- main loop ---------- */
    function loop(now: number): void {
        if (state !== 'running') {
            return;
        }

        const dt = lastFrame ? Math.min(100, now - lastFrame) : 0;
        lastFrame = now;
        activeMs += dt;

        if (mode === 'measure') {
            stepMeasure(now);
        } else {
            trainMs += dt;
            stepTrain(now);
        }

        if (state !== 'running') {
            return;
        }

        draw();
        stats();

        if (activeMs >= MAX_ACTIVE_MS) {
            limitReached();

            return;
        }

        rt.raf(loop);
    }

    function run(): void {
        state = 'running';
        lastFrame = 0;
        Amb.setActive(true);
        ui();
        rt.raf(loop);
    }

    function stop(): void {
        state = 'done';
        Amb.setActive(false);
    }

    /* ---------- measurement ---------- */
    function startMeasure(): void {
        if (overLimit()) {
            return;
        }

        setupCanvas();
        mode = 'measure';
        meas = {};
        measureUnsaved = false;
        base = 'bo';
        startDirection();
    }

    function startDirection(): void {
        phase = 'ready';
        demand = 0;
        fb('');
        run();
    }

    function stepMeasure(now: number): void {
        const moved = (RAMP_PER_S * (now - rampT0)) / 1000;

        if (phase === 'up') {
            demand = Math.min(maxDemand, rampFrom + moved);

            if (demand >= maxDemand) {
                onBreak(false, true);
            }
        } else if (phase === 'down') {
            demand = Math.max(0, rampFrom - moved);

            if (demand <= 0) {
                onRecovery(true);
            }
        }
    }

    function startRamp(next: 'up' | 'down'): void {
        phase = next;
        rampFrom = demand;
        rampT0 = performance.now();
        ui();
    }

    function onBreak(suppressed: boolean, atLimit = false): void {
        const v = round05(demand);

        if (base === 'bo') {
            meas.bo_break = v;
            meas.bo_supp = suppressed || undefined;
            meas.bo_limit = atLimit || undefined;
        } else {
            meas.bi_break = v;
            meas.bi_supp = suppressed || undefined;
            meas.bi_limit = atLimit || undefined;
        }

        Amb.beep('tick');
        fb(
            atLimit
                ? t('The edge of the screen was reached without doubling.')
                : suppressed
                  ? t('Noted: a mark disappeared at :v.', { v: fmtD(v) })
                  : t('Noted: it doubled at :v.', { v: fmtD(v) }),
        );
        startRamp('down');
    }

    function onRecovery(never: boolean): void {
        const v = never ? 0 : round05(demand);

        if (base === 'bo') {
            meas.bo_recovery = v;
            measureUnsaved = true;
        } else {
            meas.bi_recovery = v;
        }

        Amb.beep('ok');
        fb(
            never
                ? t('The target did not become single again.')
                : t('Single again at :v.', { v: fmtD(v) }),
            !never,
        );
        phase = 'idle';
        demand = 0;
        stop();
        draw();
        ui();

        if (base === 'bo') {
            afterConvergence();
        } else {
            finishMeasure();
        }
    }

    function afterConvergence(): void {
        Amb.overlay(
            `<h2>${t('Convergence measured')}</h2>` +
                '<div class="result-grid">' +
                cell(t('Doubled at'), (meas.bo_limit ? '≥ ' : '') + fmtD(meas.bo_break ?? 0)) +
                cell(t('Single again at'), fmtD(meas.bo_recovery ?? 0)) +
                '</div>' +
                `<p>${t('You can also measure divergence (the pictures move apart the other way, the eyes turn outwards). It takes about a minute and is optional.')}</p>`,
            [
                {
                    label: t('Measure divergence too'),
                    onClick: () => {
                        base = 'bi';
                        startDirection();
                    },
                },
                { label: t('See the result'), primary: true, onClick: finishMeasure },
            ],
        );
    }

    function saveMeasure(): Record<string, unknown> {
        measureUnsaved = false;
        const data: Record<string, unknown> = {
            kind: 'measure',
            ...meas,
            distance_cm: distanceCm(),
            mode: Amb.settings().viewMode,
        };
        Amb.saveResult(ID, data);

        return data;
    }

    function compareMeasure(prev: AmbResult | undefined): string {
        if (!prev) {
            return `<p>${t('This is your first measurement. Repeat it every week or two, at the same distance and at the same time of day, to see the trend.')}</p>`;
        }

        let h = `<p>${t('Last time (:date): doubled at :brk, single again at :rec.', {
            date: formatDate(prev.d),
            brk: (prev.bo_limit ? '≥ ' : '') + fmtD(prev.bo_break),
            rec: fmtD(prev.bo_recovery ?? 0),
        })}</p>`;
        const diff = (meas.bo_break ?? 0) - prev.bo_break;

        if (Math.abs(diff) < 1.5) {
            h += `<p>${t('About the same as last time.')}</p>`;
        } else if (diff > 0) {
            h += `<p class="good">${t('Convergence held :diff more than last time.', { diff: fmtD(diff) })}</p>`;
        } else {
            h += `<p class="bad">${t('Convergence held :diff less than last time.', { diff: fmtD(-diff) })}</p>` +
                `<p>${t('Tiredness, light, the time of day and attention change the result a lot. The trend over several weeks is what counts.')}</p>`;
        }

        if (prev.distance_cm && prev.distance_cm !== distanceCm()) {
            h += `<p class="hint">${t('Last time you measured at :cm cm, so the comparison is only approximate.', { cm: prev.distance_cm })}</p>`;
        }

        return h;
    }

    function finishMeasure(): void {
        const prev = lastMeasure();
        saveMeasure();
        stop();
        ui();
        Amb.beep('win');
        const brk = meas.bo_break ?? 0;
        const low = !meas.bo_limit && brk < 12;
        Amb.overlay(
            `<h2>${t('Measurement result')}</h2>` +
                '<div class="result-grid">' +
                cell(t('Convergence – doubled'), (meas.bo_limit ? '≥ ' : '') + fmtD(brk)) +
                cell(t('Convergence – single again'), fmtD(meas.bo_recovery ?? 0)) +
                (meas.bi_break != null
                    ? cell(t('Divergence – doubled'), (meas.bi_limit ? '≥ ' : '') + fmtD(meas.bi_break)) +
                      cell(t('Divergence – single again'), fmtD(meas.bi_recovery ?? 0))
                    : '') +
                '</div>' +
                (meas.bo_supp || meas.bi_supp
                    ? `<p>${t('Instead of doubling, a small mark disappeared: one eye switched off (suppression). That is common with a lazy eye; tell the eye doctor.')}</p>`
                    : '') +
                (meas.bo_limit
                    ? `<p>${t('You reached the edge of the screen without the target doubling. Sit closer (40 cm) or use a wider screen to measure further.')}</p>`
                    : '') +
                `<p class="hint">${t('Approximate reference values at near (adults, usually measured with prisms): convergence doubles at around 19–21Δ and becomes single again at around 11–14Δ. On a screen with red-cyan glasses your values can differ. This is not a diagnosis.')}</p>` +
                (low
                    ? `<p class="bad">${t('Your value is below the usual reference. Discuss it with the eye doctor or an orthoptist: they can tell whether exercises are right for you.')}</p>`
                    : '') +
                compareMeasure(prev) +
                `<p class="hint">${t('Δ = prism dioptres: how strongly the eyes have to turn to keep one picture.')}</p>`,
            [
                { label: t('Main menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('Measure again'), onClick: startMeasure },
                {
                    label: t('Training (jumps)'),
                    primary: true,
                    onClick: () => {
                        mode = 'train';
                        ui();
                        startTrain();
                    },
                },
            ],
        );
    }

    function cannotFuse(): void {
        stop();
        phase = 'idle';
        ui();
        Amb.overlay(
            `<h2>${t('The pictures do not join')}</h2>` +
                `<p>${t('If you see two targets even when the pictures lie on top of each other, the eyes cannot join them right now. Do not force it.')}</p>` +
                `<p>${t('Check that the glasses sit well (red lens on the :red eye), blink a few times and try once more. If it happens every time, this exercise is not suitable without an eye examination: a strabismus that is not controlled at this moment is treated with glasses, prisms or surgery, not with exercises.', { red: eyeName(Amb.settings().redSide) })}</p>`,
            [
                { label: t('Main menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('Try again'), primary: true, onClick: startDirection },
            ],
        );
    }

    /* ---------- training (jump vergence) ---------- */
    function startTrain(): void {
        if (overLimit()) {
            return;
        }

        setupCanvas();
        mode = 'train';
        base = 'bo';
        const levels: number[] = [];

        // hardest first: the staircase moves to lower indexes after correct answers
        for (let v = maxDemand - (maxDemand % 2); v >= MIN_TARGET; v -= 2) {
            levels.push(v);
        }

        if (!levels.length) {
            state = 'idle';
            ui();
            Amb.overlay(
                `<h2>${t('The screen is too narrow')}</h2>` +
                    `<p>${t('To train, the two pictures must be able to move at least :min apart. Use a wider screen or sit closer (40 cm).', { min: fmtD(MIN_TARGET) })}</p>`,
                [{ label: t('Close'), primary: true }],
            );

            return;
        }

        const prev = lastMeasure();
        const wanted = prev
            ? Math.max(MIN_TARGET, Math.round(prev.bo_break * 0.6))
            : DEFAULT_TARGET;
        let startIndex = 0;

        levels.forEach((v, i) => {
            if (Math.abs(v - wanted) < Math.abs(levels[startIndex] - wanted)) {
                startIndex = i;
            }
        });

        sc = new Amb.Staircase({
            levels,
            startIndex,
            down: 2,
            maxTrials: 100000,
            maxReversals: 100000,
        });
        trainMs = 0;
        trainUnsaved = false;
        jumps = 0;
        okCount = 0;
        fuseSum = 0;
        fuseN = 0;
        maxBo = 0;
        lowFails = 0;
        isHigh = false;
        nextHigh = false;
        fb(
            wanted > levels[0]
                ? t('The starting demand is more than this screen can show; training starts at :v.', { v: fmtD(levels[0]) })
                : '',
        );
        jump();
        run();
    }

    function jump(): void {
        isHigh = nextHigh;
        demand = isHigh && sc ? sc.value : LOW;
        eDir = Math.floor(Math.random() * 4);
        spineEye = Math.random() < 0.5 ? 'left' : 'right';
        phase = 'jump';
        jumpT0 = performance.now();
        jumps++;
        trainUnsaved = true;
        ui();
    }

    function rest(ms: number, restDemand: number): void {
        phase = 'rest';
        demand = restDemand;
        restUntil = performance.now() + ms;
        ui();
    }

    function stepTrain(now: number): void {
        if (phase === 'jump' && now - jumpT0 > ANSWER_TIMEOUT_MS) {
            answer(null, true);

            return;
        }

        if (phase === 'rest' && now >= restUntil) {
            if (trainMs >= trainMinutes * 60000) {
                finishTrain();

                return;
            }

            jump();
        }
    }

    /** dirAnswer: direction of the E (0 right, 1 down, 2 left, 3 up), null = "I see double". */
    function answer(dirAnswer: number | null, timedOut = false): void {
        if (state !== 'running' || mode !== 'train' || phase !== 'jump') {
            return;
        }

        const ms = performance.now() - jumpT0;
        const ok = dirAnswer === eDir;

        if (ok) {
            okCount++;
            fuseSum += ms;
            fuseN++;

            if (isHigh) {
                maxBo = Math.max(maxBo, demand);
            }

            Amb.beep('ok');
            fb(t('Correct · :time', { time: fmtS(ms) }), true);
        } else {
            Amb.beep('bad');
            fb(
                timedOut
                    ? t('Time is up: it did not join.')
                    : dirAnswer === null
                      ? t('It did not join. Rest a moment.')
                      : t('Wrong direction.'),
                false,
            );
        }

        if (isHigh && sc) {
            if (!ok) {
                sc.update(false);
            } else if (ms <= FAST_MS) {
                sc.update(true);
            }
        }

        if (ok) {
            lowFails = 0;
            nextHigh = !isHigh;
            rest(HOLD_OK_MS, demand);

            return;
        }

        if (isHigh) {
            // back to an easy demand, then try the (now lower) target again
            nextHigh = true;
            rest(REST_MS, LOW);

            return;
        }

        lowFails++;

        if (lowFails >= 3) {
            tooHard();

            return;
        }

        nextHigh = false;
        rest(REST_MS, 0);
    }

    function tooHard(): void {
        stop();
        phase = 'idle';
        demand = 0;
        draw();
        ui();
        saveTrain();
        Amb.overlay(
            `<h2>${t('Take a break')}</h2>` +
                `<p>${t('The target did not join three times in a row, even at the easy demand. Take off the glasses, look far away and rest your eyes.')}</p>` +
                `<p>${t('If it happens often, stop this exercise and ask the eye doctor or an orthoptist first.')}</p>`,
            [
                { label: t('Main menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('Close'), primary: true },
            ],
        );
    }

    function saveTrain(): Record<string, unknown> | null {
        if (!trainUnsaved) {
            return null;
        }

        trainUnsaved = false;
        const data: Record<string, unknown> = {
            kind: 'train',
            max_bo: maxBo,
            jumps,
            ok: okCount,
            avg_ms: fuseN ? Math.round(fuseSum / fuseN) : undefined,
            level: sc ? sc.value : undefined,
            secs: Math.round(trainMs / 1000),
            distance_cm: distanceCm(),
            mode: Amb.settings().viewMode,
        };
        Amb.saveResult(ID, data);

        return data;
    }

    function compareTrain(prev: AmbResult | undefined): string {
        if (!prev) {
            return `<p>${t('This is your first training session. Repeat it on most days, a few minutes at a time.')}</p>`;
        }

        const diff = maxBo - prev.max_bo;

        if (Math.abs(diff) < 1) {
            return `<p>${t('The same highest demand as last time (:v).', { v: fmtD(prev.max_bo) })}</p>`;
        }

        return diff > 0
            ? `<p class="good">${t('Highest demand :diff more than last time.', { diff: fmtD(diff) })}</p>`
            : `<p>${t('Last time you reached :v. Some days are weaker; the trend over weeks is what counts.', { v: fmtD(prev.max_bo) })}</p>`;
    }

    function finishTrain(limitNote = false): void {
        const prev = lastTrain();
        stop();
        phase = 'idle';
        demand = 0;
        draw();
        ui();
        saveTrain();
        Amb.beep('win');
        const pct = jumps ? Math.round((okCount / jumps) * 100) : 0;
        Amb.overlay(
            `<h2>${t('Training finished')}</h2>` +
                '<div class="result-grid">' +
                cell(t('Jumps'), jumps) +
                cell(t('Joined and read'), `${okCount} (${pct}%)`) +
                cell(t('Average time to join'), fuseN ? fmtS(fuseSum / fuseN) : '–') +
                cell(t('Highest demand joined'), maxBo ? fmtD(maxBo) : '–') +
                '</div>' +
                compareTrain(prev) +
                (limitNote
                    ? `<p class="bad">${t('You have reached 10 minutes of convergence work. That is enough for today.')}</p>`
                    : '') +
                `<p class="hint">${t('Training helps only when it is regular (a few minutes, most days) and it does not cure a strabismus. Stop if you get a headache, nausea or double vision that stays after the exercise.')}</p>`,
            limitNote
                ? [{ label: t('Main menu'), primary: true, onClick: () => Amb.go(Amb.urls.home) }]
                : [
                      { label: t('Main menu'), onClick: () => Amb.go(Amb.urls.home) },
                      { label: t('One more round'), primary: true, onClick: startTrain },
                  ],
        );
    }

    /* ---------- pause, limit ---------- */
    function pause(): void {
        if (state !== 'running') {
            return;
        }

        state = 'paused';
        Amb.setActive(false);
        ui();
        Amb.overlay(
            `<h2>${t('Pause')}</h2><p>${t('The exercise is paused. Rest your eyes. When you are ready, check the glasses and press “Continue”.')}</p>`,
            [
                {
                    label: t('Main menu'),
                    onClick: () => {
                        saveOpen();
                        Amb.go(Amb.urls.home);
                    },
                },
                { label: t('Continue'), primary: true, onClick: resume },
            ],
        );
    }

    function resume(): void {
        if (state !== 'paused') {
            return;
        }

        if (mode === 'measure' && (phase === 'up' || phase === 'down')) {
            // the eyes rested: this direction starts again from 0
            if (base === 'bo') {
                meas = {};
            } else {
                meas.bi_break = meas.bi_recovery = undefined;
                meas.bi_supp = meas.bi_limit = undefined;
            }

            phase = 'ready';
            demand = 0;
            fb(t('The measurement was interrupted, so this direction starts again from 0.'));
        } else if (phase === 'jump') {
            jumpT0 = performance.now();
        } else if (phase === 'rest') {
            restUntil = performance.now() + 800;
        }

        run();
    }

    function overLimit(): boolean {
        if (activeMs < MAX_ACTIVE_MS) {
            return false;
        }

        Amb.overlay(
            `<h2>${t('Enough for today')}</h2>` +
                `<p>${t('You have done 10 minutes of convergence work. More is not better: the eyes need rest. Come back tomorrow.')}</p>`,
            [{ label: t('Main menu'), primary: true, onClick: () => Amb.go(Amb.urls.home) }],
        );

        return true;
    }

    function limitReached(): void {
        if (mode === 'train') {
            finishTrain(true);

            return;
        }

        stop();
        phase = 'idle';
        demand = 0;
        draw();
        ui();

        if (measureUnsaved) {
            saveMeasure();
        }

        overLimit();
    }

    /** Saves what was measured / trained when the page is left in the middle. */
    function saveOpen(): void {
        if (measureUnsaved) {
            saveMeasure();
        }

        if (mode === 'train' && trainMs >= 60000) {
            saveTrain();
        }
    }

    /* ---------- intro / safety ---------- */
    function worthNote(): string {
        const last = Amb.results('worth').pop();
        const s = Amb.settings();
        const red = s.redSide;
        const cyan = Amb.other(red);
        const markOf = (eye: Side): string =>
            eye === 'left' ? t('the top mark') : t('the bottom mark');

        if (!last) {
            return `<p class="hint">${t('Tip: do the Worth 4-dot test in the <a href=":url">calibration</a> first. It shows whether your eyes work together.', { url: Amb.urls.calibration })}</p>`;
        }

        switch (String(last.seen)) {
            case '5':
                return (
                    `<div class="notice"><p><b>${t('In the Worth test you saw 5 dots (double vision).')}</b></p>` +
                    `<p>${t('Please see an eye doctor (ophthalmologist) or an orthoptist before this training. Fusion exercises are not the right treatment for every strabismus, and in adults they can make double vision come out that does not go away.')}</p>` +
                    `<label class="check"><input type="checkbox" id="vgAck"> <span>${t('I have read this and I will stop if I see double after the exercise.')}</span></label></div>`
                );
            case '2':
            case '3': {
                const off = String(last.seen) === '2' ? cyan : red;

                return `<p>${t('In the Worth test you saw :n dots: the brain switched off the :eye eye (suppression). Here you will notice it by :mark (seen only by the :eye eye): if it disappears, that eye switched off. Blink and try to bring it back. If the lazy eye’s mark keeps disappearing, lower the brightness of the good eye’s picture in the side panel.', { n: String(last.seen), eye: eyeName(off), mark: markOf(off) })}</p>`;
            }
            case 'alt':
                return `<p>${t('In the Worth test the eyes took turns (alternating suppression). Watch both small marks: they should stay visible together.')}</p>`;
            default:
                return `<p class="good">${t('In the Worth test you saw 4 dots: your eyes worked together.')}</p>`;
        }
    }

    function distanceButtons(): string {
        const cur = distanceCm();
        const list = DISTANCES.includes(cur) ? DISTANCES : [...DISTANCES, cur];

        return list
            .map(
                (cm) =>
                    `<button type="button" data-dist="${cm}" aria-pressed="${cm === cur}">${cm} cm</button>`,
            )
            .join('');
    }

    function introHtml(): string {
        const s = Amb.settings();

        return (
            `<h2>${t('Convergence training')}</h2>` +
            `<p>${t('Put on the red-cyan glasses: the <b>red</b> lens on the <b>:red</b> eye, the <b>:lens</b> lens on the <b>:other</b> eye. Keep both eyes open. Work in a dim room if you can.', { red: eyeName(s.redSide), lens: Amb.LENS[s.otherLens], other: eyeName(Amb.other(s.redSide)) })}</p>` +
            `<p>${t('Each eye gets its own round target in the colour of its lens; the brain joins them into one. In the middle there are two small marks: the top one is seen only by the left eye, the bottom one only by the right eye. You should see <b>one</b> target and <b>both</b> marks. If a mark disappears, that eye has switched off (suppression).')}</p>` +
            `<p><b>${t('Measurement')}</b>: ${t('the pictures slowly move apart; you press <kbd>Space</kbd> when the target doubles and again when it is single again.')}<br>` +
            `<b>${t('Training (jumps)')}</b>: ${t('the demand jumps between easy and hard; after every jump you join the target and say which way the letter E points.')}</p>` +
            `<div class="field"><span class="label">${t('Distance from your eyes to the screen (measure it)')}</span><div class="seg" id="vgDist">${distanceButtons()}</div>` +
            `<span class="hint">${t('40 cm is recommended (reading distance). The distance is saved in the settings and used by the other exercises too.')}</span></div>` +
            worthNote() +
            `<div class="notice"><p><b>${t('Safety')}</b></p><ul class="vg-rules">` +
            `<li>${t('Ask the eye doctor or an orthoptist first, especially if the eye drifts out all the time (constant strabismus). Constant exotropia is usually treated with glasses, prisms or surgery.')}</li>` +
            `<li>${t('In adults with a long-standing strabismus, fusion exercises can bring out double vision that sometimes does not go away.')}</li>` +
            `<li>${t('Stop right away if you get a headache, nausea, dizziness or double vision that stays after the exercise.')}</li>` +
            `<li>${t('At most 10 minutes at a time. The exercise does not cure strabismus.')}</li></ul></div>` +
            `<p class="hint">${t('What the studies say: in the CITT trial (children 9–17 with convergence insufficiency), therapy in the office with an orthoptist or optometrist plus home practice worked best; computer exercises done only at home were not better than placebo. Use this as home practice next to the doctor’s plan.')}</p>`
        );
    }

    function showIntro(): void {
        if (!Amb.isAnaglyph()) {
            patchMode();

            return;
        }

        const needsAck = String(Amb.results('worth').pop()?.seen) === '5';
        const hasMeasure = !!lastMeasure();
        const modal = Amb.overlay(introHtml(), [
            {
                label: t('Measurement'),
                id: 'vgGoMeasure',
                primary: !hasMeasure,
                disabled: needsAck,
                onClick: () => {
                    mode = 'measure';
                    startMeasure();
                },
            },
            {
                label: t('Training (jumps)'),
                id: 'vgGoTrain',
                primary: hasMeasure,
                disabled: needsAck,
                onClick: () => {
                    mode = 'train';
                    ui();
                    startTrain();
                },
            },
        ]);

        const wire = (): void => {
            modal.el
                .querySelectorAll<HTMLButtonElement>('button[data-dist]')
                .forEach((b) => {
                    b.onclick = () => {
                        const cm = Number(b.dataset.dist);

                        if (cm !== distanceCm()) {
                            Amb.set({ distanceCm: cm });
                        }

                        modal.el
                            .querySelectorAll<HTMLButtonElement>('button[data-dist]')
                            .forEach((o) =>
                                o.setAttribute('aria-pressed', String(o === b)),
                            );
                        setupCanvas();
                        draw();
                    };
                });
        };

        wire();
        const ack = modal.el.querySelector<HTMLInputElement>('#vgAck');

        if (ack) {
            ack.onchange = () => {
                ['vgGoMeasure', 'vgGoTrain'].forEach((id) => {
                    const b = modal.el.querySelector<HTMLButtonElement>(`#${id}`);

                    if (b) {
                        b.disabled = !ack.checked;
                    }
                });
            };
        }
    }

    function patchMode(): void {
        $<HTMLButtonElement>('startBtn').disabled = true;
        $('instr').innerHTML = `<p>${t('This exercise needs the red-cyan glasses. Change the way you work in the <a href=":url">settings</a>.', { url: Amb.urls.settings })}</p>`;
        Amb.overlay(
            `<h2>${t('You need the red-cyan glasses')}</h2>` +
                `<p>${t('Convergence training works with both eyes at the same time: each eye sees a different picture through its lens. With the patch one eye is covered, so the exercise cannot work.')}</p>` +
                `<p>${t('Change the way you work in the <a href=":url">settings</a>, or press the button below if you have the glasses.', { url: Amb.urls.settings })}</p>`,
            [
                { label: t('Main menu'), onClick: () => Amb.go(Amb.urls.home) },
                {
                    label: t('I have red-cyan glasses'),
                    primary: true,
                    onClick: () => {
                        Amb.set({ viewMode: 'anaglyph' });
                        $<HTMLButtonElement>('startBtn').disabled = false;
                        instructions();
                        draw();
                        rt.timeout(showIntro, 0);
                    },
                },
            ],
        );
    }

    function instructions(): void {
        const s = Amb.settings();
        $('instr').innerHTML =
            `<p>${t('Red lens on the <b>:red</b> eye. Sit :cm cm from the screen.', { red: eyeName(s.redSide), cm: distanceCm() })}</p>` +
            `<p>${t('One target, both small marks: top = left eye, bottom = right eye.')}</p>`;
        $('calHint').hidden = s.sizeCalibrated;

        if (!s.sizeCalibrated) {
            $('calHint').innerHTML = t('The screen size is not calibrated yet, so the values in Δ are approximate. <a href=":url">Calibrate the screen size</a>.', { url: Amb.urls.calibration });
        }
    }

    /* ---------- input ---------- */
    function main(): void {
        if (state !== 'running' || mode !== 'measure') {
            return;
        }

        if (phase === 'ready') {
            startRamp('up');
        } else if (phase === 'up') {
            onBreak(false);
        } else if (phase === 'down') {
            onRecovery(false);
        }
    }

    function secondary(): void {
        if (state !== 'running' || mode !== 'measure') {
            return;
        }

        if (phase === 'ready') {
            cannotFuse();
        } else if (phase === 'up') {
            onBreak(true);
        }
    }

    const ARROWS: Record<string, number> = {
        ArrowRight: 0,
        ArrowDown: 1,
        ArrowLeft: 2,
        ArrowUp: 3,
    };

    rt.on<KeyboardEvent>(document, 'keydown', (e) => {
        if (Amb.modalOpen()) {
            return;
        }

        const k = e.key;

        if (k === 'Escape') {
            pause();

            return;
        }

        if (state !== 'running') {
            return;
        }

        if (k === ' ' || k in ARROWS) {
            e.preventDefault();

            // a focused button would also "click" on Space: only our handler may answer
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        }

        if (e.repeat) {
            return;
        }

        if (mode === 'measure') {
            if (k === ' ') {
                main();
            } else if (k === 's' || k === 'S') {
                secondary();
            }

            return;
        }

        if (k in ARROWS) {
            answer(ARROWS[k]);
        } else if (k === 'd' || k === 'D') {
            answer(null);
        }
    });

    rt.on($('bMain'), 'click', main);
    rt.on($('bSupp'), 'click', secondary);
    rt.on($('bUp'), 'click', () => answer(3));
    rt.on($('bLeft'), 'click', () => answer(2));
    rt.on($('bDown'), 'click', () => answer(1));
    rt.on($('bRight'), 'click', () => answer(0));
    rt.on($('bDouble'), 'click', () => answer(null));
    rt.on($('startBtn'), 'click', () => {
        if (state === 'running') {
            pause();
        } else if (state === 'paused') {
            resume();
        } else if (mode === 'measure') {
            startMeasure();
        } else {
            startTrain();
        }
    });
    rt.on($('infoBtn'), 'click', () => {
        if (state !== 'running' && state !== 'paused') {
            showIntro();
        }
    });
    rt.on<MouseEvent>($('segMode'), 'click', (e) => {
        const b = (e.target as Element).closest<HTMLButtonElement>(
            'button[data-mode]',
        );

        if (!b || state === 'running' || state === 'paused') {
            return;
        }

        mode = b.dataset.mode === 'train' ? 'train' : 'measure';
        phase = 'idle';
        demand = 0;
        fb('');
        draw();
        ui();
    });
    rt.on<MouseEvent>($('segDur'), 'click', (e) => {
        const b = (e.target as Element).closest<HTMLButtonElement>(
            'button[data-min]',
        );

        if (!b || state === 'running' || state === 'paused') {
            return;
        }

        trainMinutes = Number(b.dataset.min) || 4;
        ui();
    });

    const bal = $<HTMLInputElement>('bal');
    const balText = (): void => {
        $('balVal').textContent = `${Math.round(goodLevel * 100)}%`;
    };
    rt.on(bal, 'input', () => {
        goodLevel = Math.min(1, Math.max(0.4, Number(bal.value) / 100));
        balText();

        if (state !== 'running') {
            draw();
        }
    });
    rt.on(window, 'resize', () => {
        if (state !== 'running' && state !== 'paused') {
            setupCanvas();
            draw();
        }
    });
    rt.onCleanup(saveOpen);

    /* ---------- init ---------- */
    $('segDur').innerHTML = TRAIN_MINUTES.map(
        (m) => `<button type="button" data-min="${m}">${m} min</button>`,
    ).join('');
    bal.value = '100';
    balText();
    instructions();
    setupCanvas();
    draw();
    ui();

    Amb.startTracking(ID, { onPause: pause, onResume: () => {} });
    showIntro();
}
