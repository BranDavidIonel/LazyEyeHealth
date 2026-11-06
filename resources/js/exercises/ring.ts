// "Inelul deschis" (visual search with Landolt rings): a board of closed
// rings with one open ring (a C). Click it as fast as possible; the rings get
// smaller after each hit and bigger after a miss. 60 s per round. Trains
// acuity, visual search and eye movements of the lazy eye.
// Ported from Exercitii-ambliopie/inel.html.
import Amb from '@/amb';
import type { Runtime } from '@/exercises/runtime';
import { getLocale, t } from '@/i18n';

const ID = 'inel';
const ROUND_MS = 60000;
const BOARD_MS = 12000;

type Board = {
    /** stroke width = gap width, device px */
    s: number;
    /** outer diameter (5 strokes), device px */
    D: number;
    /** grid cell size, device px */
    cell: number;
    rings: { x: number; y: number }[];
    /** index of the open ring */
    ti: number;
    /** gap direction, 0..7 (steps of 45°) */
    dir: number;
};

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
    const maxStroke = (): number => 14 * Amb.dpr();

    let ctx: CanvasRenderingContext2D;
    let W = 0;
    let H = 0;
    let state: 'idle' | 'running' | 'paused' | 'done' = 'idle';
    let stroke = 6 * Amb.dpr();
    let board: Board | null = null;
    let boardStart = 0;
    let roundEnd = 0;
    let pausedAt = 0;
    let revealing = false;
    let score = 0;
    let found = 0;
    let misses = 0;
    let minStroke = Infinity;
    let loopId = 0;
    let timers: number[] = [];
    const later = (fn: () => void, ms: number): void => {
        timers.push(rt.timeout(fn, ms));
    };
    const clearTimers = (): void => {
        timers.forEach(rt.clearTimeout);
        timers = [];
        rt.clearInterval(loopId);
        loopId = 0;
    };

    /* ---------- drawing ---------- */
    // Canvas fits the viewport instead of being CSS-scaled, so one canvas px stays one screen px
    function setupCanvas(): void {
        const cssW = Math.min(720, Math.max(280, window.innerWidth - 34));
        const cssH = cssW >= 640 ? 480 : Math.round(Math.min(480, cssW));
        ctx = Amb.deviceCanvas(cv, cssW, cssH);
        W = cv.width;
        H = cv.height;
    }

    function drawBlank(): void {
        ctx.fillStyle = Amb.monoColors().bg;
        ctx.fillRect(0, 0, W, H);
    }

    function newBoard(): void {
        const s = stroke;
        const D = 5 * s;
        const c0 = Math.max(2.2 * D, W / 8);
        const cols = Math.max(2, Math.min(8, Math.floor(W / c0)));
        const rows = Math.max(2, Math.min(5, Math.floor(H / c0)));
        const cw = W / cols;
        const ch = H / rows;
        const cellSize = Math.min(cw, ch);
        const jit = Math.max(0, cellSize - D) * 0.35;
        const rings: Board['rings'] = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                rings.push({
                    x: (c + 0.5) * cw + (Math.random() * 2 - 1) * jit,
                    y: (r + 0.5) * ch + (Math.random() * 2 - 1) * jit,
                });
            }
        }

        board = {
            s,
            D,
            cell: cellSize,
            rings,
            ti: Math.floor(Math.random() * rings.length),
            dir: Math.floor(Math.random() * 8),
        };
        boardStart = performance.now();
        drawBoard(false);
        stats();
    }

    function drawBoard(highlight: boolean): void {
        if (!board) {
            return;
        }

        const col = Amb.monoColors();
        const b = board;
        drawBlank();
        ctx.strokeStyle = col.fg;
        ctx.lineWidth = b.s;
        b.rings.forEach((r) => {
            ctx.beginPath();
            ctx.arc(r.x, r.y, (b.D - b.s) / 2, 0, Math.PI * 2);
            ctx.stroke();
        });
        // cut the gap (width = stroke) into the target ring
        const tr = b.rings[b.ti];
        ctx.save();
        ctx.translate(tr.x, tr.y);
        ctx.rotate((b.dir * Math.PI) / 4);
        ctx.fillStyle = col.bg;
        ctx.fillRect(0, -b.s / 2, b.D / 2 + 1, b.s);
        ctx.restore();

        if (highlight) {
            ctx.beginPath();
            ctx.arc(
                tr.x,
                tr.y,
                Math.max(b.D * 0.9, b.D / 2 + 6 * Amb.dpr()),
                0,
                Math.PI * 2,
            );
            ctx.lineWidth = Math.max(2, Math.round(2 * Amb.dpr()));
            ctx.strokeStyle = col.fg;
            ctx.stroke();
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
        let left = ROUND_MS;

        if (state === 'running') {
            left = roundEnd - performance.now();
        } else if (state === 'paused') {
            left = roundEnd - pausedAt;
        } else if (state === 'done') {
            left = 0;
        }

        left = Math.max(0, left);
        $('sTime').textContent = `${Math.ceil(left / 1000)} s`;
        $('prog').style.width = `${Math.min(100, (1 - left / ROUND_MS) * 100)}%`;
        $('sFound').textContent = String(found);
        $('sPts').textContent = String(score);
        const s = board && state !== 'idle' ? board.s : stroke;
        $('sSize').textContent = `${fmt(Amb.devPxToArcmin(s), 1)}′`;
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

    /* ---------- game flow ---------- */
    function startBlock(): void {
        clearTimers();
        setupCanvas();
        stroke = 6 * Amb.dpr();
        score = 0;
        found = 0;
        misses = 0;
        minStroke = Infinity;
        revealing = false;
        state = 'running';
        roundEnd = performance.now() + ROUND_MS;
        fb('');
        ui();
        Amb.setActive(true);
        newBoard();
        loopId = rt.interval(loop, 100);
    }

    function loop(): void {
        if (state !== 'running') {
            return;
        }

        const now = performance.now();
        stats();

        if (roundEnd - now <= 0) {
            finish();

            return;
        }

        if (!revealing && now - boardStart >= BOARD_MS) {
            reveal();
        }
    }

    // Board timed out: show where the target was, then make the rings bigger
    function reveal(): void {
        revealing = true;
        drawBoard(true);
        Amb.beep('tick');
        fb(t('Time is up: the open ring was here.'));
        later(() => {
            revealing = false;
            stroke = Math.min(maxStroke(), stroke * 1.2);
            fb('');
            newBoard();
        }, 1000);
    }

    function hit(): void {
        const b = board!;
        const sec = (performance.now() - boardStart) / 1000;
        const mar = Amb.devPxToArcmin(b.s);
        const pts =
            10 +
            Math.round(40 / mar) +
            Math.round(10 * Math.max(0, 1 - sec / 12));
        score += pts;
        found++;
        minStroke = Math.min(minStroke, b.s);
        stroke = Math.max(1, stroke * 0.85);
        Amb.beep('ok');
        fb(t('Correct! +:pts', { pts }), true);
        newBoard();
    }

    function miss(): void {
        misses++;
        stroke = Math.min(maxStroke(), stroke * 1.15);
        Amb.beep('bad');
        fb(t('Wrong'), false);
        stats();
    }

    rt.on<PointerEvent>(cv, 'pointerdown', (e) => {
        if (state !== 'running' || revealing || Amb.modalOpen() || !board) {
            return;
        }

        e.preventDefault();
        const rect = cv.getBoundingClientRect();
        const x = ((e.clientX - rect.left) * cv.width) / cv.clientWidth;
        const y = ((e.clientY - rect.top) * cv.height) / cv.clientHeight;
        let best = -1;
        let bd = Infinity;
        board.rings.forEach((r, i) => {
            const d = Math.hypot(r.x - x, r.y - y);

            if (d < bd) {
                bd = d;
                best = i;
            }
        });

        if (best < 0 || bd > Math.max(0.75 * board.D, 0.45 * board.cell)) {
            return;
        }

        if (best === board.ti) {
            hit();
        } else {
            miss();
        }
    });

    function pause(): void {
        if (state !== 'running') {
            return;
        }

        const wasRevealing = revealing;
        clearTimers();
        pausedAt = performance.now();

        if (wasRevealing) {
            stroke = Math.min(maxStroke(), stroke * 1.2);
        }

        revealing = false;
        state = 'paused';
        Amb.setActive(false);
        drawBlank();
        fb('');
        ui();
        Amb.overlay(
            `<h2>${t('Pause')}</h2><p>${t('The game is stopped, the clock does not run. When you are ready, check the glasses or the patch and press “Continue”.')}</p>`,
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

        roundEnd += performance.now() - pausedAt;
        state = 'running';
        Amb.setActive(true);
        ui();
        newBoard();
        loopId = rt.interval(loop, 100);
    }

    function compare(
        cur: number,
        prev: number | null,
        prevMode?: string,
    ): string {
        let h: string;

        if (prev == null) {
            h = `<p>${t('This is your first saved game. Play again in the coming days to see how you progress.')}</p>`;
        } else if (!(prev > 0)) {
            h =
                cur > 0
                    ? `<p class="good">${t('Better than last time.')}</p><p>${t('Well done! Regular practice pays off.')}</p>`
                    : `<p>${t('Try again, without hurrying: look at each ring in turn.')}</p>`;
        } else {
            const p = ((cur - prev) / prev) * 100;

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
        }

        if (prevMode && prevMode !== Amb.settings().viewMode) {
            h += `<p class="hint">${t('Last time you worked in a different mode (glasses / patch), so the comparison is only a rough guide.')}</p>`;
        }

        return h;
    }

    function finish(): void {
        clearTimers();
        state = 'done';
        revealing = false;
        Amb.setActive(false);
        drawBlank();
        fb('');
        ui();
        const all = Amb.results(ID);
        const prev = all[all.length - 1];
        const best = all.reduce(
            (m, r) => Math.max(m, Number(r.score) || 0),
            0,
        );
        const ms = isFinite(minStroke) ? minStroke : null;
        const mar = ms ? Amb.devPxToArcmin(ms) : null;
        const mode = Amb.settings().viewMode;
        Amb.saveResult(ID, {
            score,
            found,
            misses,
            minStroke: ms ? round(ms, 3) : null,
            mar: mar ? round(mar, 3) : null,
            decimal: mar ? round(1 / mar, 3) : null,
            mode,
        });
        Amb.beep('win');
        const record =
            all.length && score > best
                ? `<p class="good">${t('New record! The old record was :best points.', { best })}</p>`
                : `<p>${t('Your best score: <b>:best</b> points.', { best: Math.max(best, score) })}</p>`;
        Amb.overlay(
            `<h2>${t('Time is up!')}</h2>` +
                '<div class="result-grid">' +
                cell(t('Points'), score) +
                cell(t('Rings found'), found) +
                cell(t('Mistakes'), misses) +
                cell(
                    t('Smallest gap found'),
                    mar ? `${fmt(mar, 1)}′` : '–',
                ) +
                cell(t('Estimated acuity'), mar ? fmt(1 / mar, 2) : '–') +
                '</div>' +
                record +
                (mar
                    ? `<p class="hint">${t('The gap is measured in minutes of arc (′); smaller is better.')}</p>`
                    : '') +
                compare(score, prev ? Number(prev.score) : null, prev?.mode) +
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

    setupCanvas();
    drawBlank();
    ui();

    Amb.startTracking(ID, { onPause: pause, onResume: () => {} });

    Amb.overlay(
        `<h2>${t('Find the open ring')}</h2>` +
            `<p>${Amb.setupText('mono')}</p>` +
            `<p>${distLine}</p>` +
            `<p>${t(
                'Several rings appear on the screen. They are all closed, except one that has a small gap, like the letter C. ' +
                    'Tap (or click) it as fast as you can. After each ring you find, the next ones get smaller; ' +
                    'if you make a mistake, they get bigger. If you do not find it in 12 seconds, I show it to you and we move on.',
            )}</p>` +
            `<p>${t('The round lasts 60 seconds. Small rings found quickly bring more points.')}</p>` +
            (st.sizeCalibrated ? '' : `<p class="hint">${calText}</p>`),
        [{ label: t('Start'), primary: true, onClick: startBlock }],
    );
}
