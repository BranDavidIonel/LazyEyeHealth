// "Tetris dihoptic": the falling piece is seen by the lazy eye, the settled
// blocks by the good eye (reduced contrast), the frame by both eyes.
// Ported from Exercitii-ambliopie/tetris.html.
import Amb from '@/amb';
import type { Runtime } from '@/exercises/runtime';
import { t } from '@/i18n';

const ID = 'tetris';
const COLS = 10;
const ROWS = 20;
const CELL = 30;
const W = COLS * CELL;
const H = ROWS * CELL;
// I O T S Z J L
const COLORS = [
    '#00e5ff',
    '#ffd600',
    '#b14dff',
    '#33dd55',
    '#ff3b3b',
    '#2f6bff',
    '#ff9100',
];
const SHAPES: number[][][] = [
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    [
        [1, 1],
        [1, 1],
    ],
    [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
    ],
    [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
    ],
    [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
    ],
];
const LINE_SCORE = [0, 100, 300, 500, 800];
const KICKS = [0, -1, 1, -2, 2];
/** room for the on-screen buttons under the board on touch screens */
const TOUCH_PAD_H = 76;

type Piece = { k: number; m: number[][]; x: number; y: number };
type Action = 'left' | 'right' | 'rotate' | 'down' | 'drop';
type State = 'idle' | 'running' | 'paused' | 'over';

export default function start(rt: Runtime): void {
    const { $ } = rt;
    const canvas = $<HTMLCanvasElement>('board');
    const nextCanvas = $<HTMLCanvasElement>('next');
    let ctx: CanvasRenderingContext2D | null = null;
    let nctx: CanvasRenderingContext2D | null = null;

    let board: number[][] = [];
    let piece: Piece | null = null;
    let nextK: number | undefined;
    let bag: number[] = [];
    let score = 0;
    let lines = 0;
    let level = 1;
    let dropAcc = 0;
    let state: State = 'idle';
    let last = performance.now();

    /* ---------- layout ---------- */
    function layout(): void {
        const touch = window.matchMedia('(pointer: coarse)').matches;
        const byHeight =
            (window.innerHeight - 110 - (touch ? TOUCH_PAD_H : 0)) / H;
        const byWidth = (window.innerWidth - 34) / W;
        const scale = Math.min(1, Math.max(0.3, Math.min(byHeight, byWidth)));
        ctx = Amb.fitCanvas(canvas, W, H, scale);
        nctx = Amb.fitCanvas(nextCanvas, 96, 64, 1);
        draw();
        drawNext();
    }

    /* ---------- pieces ---------- */
    function takeFromBag(): number {
        if (!bag.length) {
            bag = [0, 1, 2, 3, 4, 5, 6];

            for (let i = bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bag[i], bag[j]] = [bag[j], bag[i]];
            }
        }

        return bag.pop()!;
    }

    function rotateCW(m: number[][]): number[][] {
        const n = m.length;
        const r = m.map((row) => row.map(() => 0));

        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                r[x][n - 1 - y] = m[y][x];
            }
        }

        return r;
    }

    function emptyTop(m: number[][]): number {
        let n = 0;

        while (n < m.length && !m[n].some(Boolean)) {
            n++;
        }

        return n;
    }

    function makePiece(k: number): Piece {
        const m = SHAPES[k].map((r) => r.slice());

        return { k, m, x: Math.floor((COLS - m.length) / 2), y: -emptyTop(m) };
    }

    function collides(m: number[][], px: number, py: number): boolean {
        for (let y = 0; y < m.length; y++) {
            for (let x = 0; x < m.length; x++) {
                if (!m[y][x]) {
                    continue;
                }

                const bx = px + x;
                const by = py + y;

                if (bx < 0 || bx >= COLS || by >= ROWS) {
                    return true;
                }

                if (by >= 0 && board[by][bx]) {
                    return true;
                }
            }
        }

        return false;
    }

    /* ---------- game flow ---------- */
    function newGame(): void {
        board = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
        bag = [];
        score = 0;
        lines = 0;
        level = 1;
        dropAcc = 0;
        nextK = takeFromBag();
        state = 'running';
        last = performance.now();
        spawn();
        sync();
    }

    function spawn(): void {
        piece = makePiece(nextK ?? takeFromBag());
        nextK = takeFromBag();

        if (collides(piece.m, piece.x, piece.y)) {
            gameOver();
        }
    }

    function dropInterval(): number {
        return Math.max(90, 850 * Math.pow(0.85, level - 1));
    }

    function move(p: Piece, dx: number): void {
        if (!collides(p.m, p.x + dx, p.y)) {
            p.x += dx;
        }
    }

    function rotate(p: Piece): void {
        const r = rotateCW(p.m);

        for (const k of KICKS) {
            if (!collides(r, p.x + k, p.y)) {
                p.m = r;
                p.x += k;

                return;
            }
        }
    }

    function softDrop(p: Piece): void {
        if (!collides(p.m, p.x, p.y + 1)) {
            p.y++;
            score++;
            dropAcc = 0;
        } else {
            lock(p);
        }
    }

    function hardDrop(p: Piece): void {
        let n = 0;

        while (!collides(p.m, p.x, p.y + 1)) {
            p.y++;
            n++;
        }

        score += n * 2;
        lock(p);
    }

    function lock(p: Piece): void {
        const m = p.m;

        for (let y = 0; y < m.length; y++) {
            for (let x = 0; x < m.length; x++) {
                if (!m[y][x]) {
                    continue;
                }

                const by = p.y + y;

                if (by < 0) {
                    gameOver();

                    return;
                }

                board[by][p.x + x] = p.k + 1;
            }
        }

        let cleared = 0;

        for (let y = ROWS - 1; y >= 0; y--) {
            if (board[y].every(Boolean)) {
                board.splice(y, 1);
                board.unshift(new Array<number>(COLS).fill(0));
                cleared++;
                y++;
            }
        }

        if (cleared) {
            score += LINE_SCORE[cleared] * level;
            lines += cleared;
            level = 1 + Math.floor(lines / 10);
            Amb.beep(cleared === 4 ? 'win' : 'ok');
        }

        dropAcc = 0;
        spawn();
        sync();
    }

    function setPaused(p: boolean): void {
        if (state === 'running' && p) {
            state = 'paused';
        } else if (state === 'paused' && !p) {
            state = 'running';
            last = performance.now();
        }

        sync();
    }

    function togglePause(): void {
        setPaused(state === 'running');
    }

    function gameOver(): void {
        if (state === 'over') {
            return;
        }

        state = 'over';
        sync();
        Amb.beep('bad');
        const s = Amb.settings();
        Amb.saveResult(ID, {
            score,
            lines,
            level,
            fc: s.fellowContrast,
            mode: s.viewMode,
        });
        let msg = '';

        if (Amb.isAnaglyph() && s.autoBalance) {
            const before = s.fellowContrast;

            if (lines >= 10) {
                const v = Amb.adjustFellow(0.05, ID);

                if (v !== before) {
                    msg = t(
                        'Very good! The contrast for the good eye goes up to <b>:pct%</b>: the eyes work in better balance.',
                        { pct: Math.round(v * 100) },
                    );
                }
            } else if (lines <= 2) {
                const v = Amb.adjustFellow(-0.05, ID);

                if (v !== before) {
                    msg = t(
                        'The contrast for the good eye went down to <b>:pct%</b>, so the lazy eye can join the game more easily.',
                        { pct: Math.round(v * 100) },
                    );
                }
            }
        }

        const best = Amb.results(ID).reduce(
            (m, r) => Math.max(m, Number(r.score) || 0),
            0,
        );
        sync();
        Amb.overlay(
            `<h2>${t('Game over')}</h2>` +
                '<div class="result-grid">' +
                `<div><span>${t('Score')}</span><b>${score}</b></div>` +
                `<div><span>${t('Lines')}</span><b>${lines}</b></div>` +
                `<div><span>${t('Level')}</span><b>${level}</b></div>` +
                `<div><span>${t('Best score')}</span><b${best === score && score > 0 ? ' class="good"' : ''}>${best}</b></div>` +
                '</div>' +
                (msg ? `<p>${msg}</p>` : ''),
            [
                { label: t('Menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('Play again'), primary: true, onClick: newGame },
            ],
        );
    }

    /* ---------- side panel ---------- */
    function sync(): void {
        $('sScore').textContent = String(score);
        $('sLines').textContent = String(lines);
        $('sLevel').textContent = String(level);
        $('sFc').textContent = Amb.isAnaglyph()
            ? `${Math.round(Amb.settings().fellowContrast * 100)}%`
            : t('patch');
        $('bStart').textContent =
            state === 'running' || state === 'paused'
                ? t('New game')
                : t('Start');
        const pauseBtn = $<HTMLButtonElement>('bPause');
        pauseBtn.textContent =
            state === 'paused' ? t('Resume (P)') : t('Pause (P)');
        pauseBtn.disabled = !(state === 'running' || state === 'paused');
        Amb.setActive(state === 'running');
        drawNext();
    }

    /* ---------- rendering ---------- */
    function cell(
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        k: number,
        eye: 'lazy' | 'fellow',
    ): void {
        const px = x * CELL;
        const py = y * CELL;
        c.fillStyle = Amb.paint(eye, COLORS[k]);
        c.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);

        if (!Amb.isAnaglyph()) {
            c.fillStyle = 'rgba(255,255,255,0.35)';
            c.fillRect(px + 1, py + 1, CELL - 2, 4);
        }
    }

    function draw(): void {
        if (!ctx) {
            return;
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        // grid, seen by both eyes
        ctx.strokeStyle = Amb.paint('both', 'rgba(255,255,255,0.07)', 0.1);
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 1; x < COLS; x++) {
            ctx.moveTo(x * CELL + 0.5, 0);
            ctx.lineTo(x * CELL + 0.5, H);
        }

        for (let y = 1; y < ROWS; y++) {
            ctx.moveTo(0, y * CELL + 0.5);
            ctx.lineTo(W, y * CELL + 0.5);
        }

        ctx.stroke();

        if (board.length) {
            // settled blocks -> good eye (reduced contrast)
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (board[y][x]) {
                        cell(ctx, x, y, board[y][x] - 1, 'fellow');
                    }
                }
            }

            // falling piece -> lazy eye
            if (piece && state !== 'over') {
                const m = piece.m;

                for (let y = 0; y < m.length; y++) {
                    for (let x = 0; x < m.length; x++) {
                        if (m[y][x] && piece.y + y >= 0) {
                            cell(ctx, piece.x + x, piece.y + y, piece.k, 'lazy');
                        }
                    }
                }
            }
        }

        // frame, seen by both eyes
        ctx.strokeStyle = Amb.paint('both', '#cfd8e3', 0.85);
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, W - 3, H - 3);

        if (state === 'idle') {
            banner(ctx, t('Press Start'), t('or the Enter key'));
        } else if (state === 'paused') {
            banner(ctx, t('Pause'), t('press P to continue'));
        } else if (state === 'over') {
            banner(ctx, t('Game over'), t('Score: :score', { score }));
        }
    }

    function banner(
        c: CanvasRenderingContext2D,
        title: string,
        sub: string,
    ): void {
        c.fillStyle = 'rgba(0,0,0,0.75)';
        c.fillRect(20, H / 2 - 50, W - 40, 100);
        c.fillStyle = Amb.paint('both', '#ffffff', 1);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = '700 28px "Segoe UI", system-ui, sans-serif';
        c.fillText(title, W / 2, H / 2 - 14);
        c.font = '500 16px "Segoe UI", system-ui, sans-serif';
        c.fillText(sub, W / 2, H / 2 + 22);
    }

    function drawNext(): void {
        if (!nctx) {
            return;
        }

        const c = nctx;
        c.fillStyle = '#000';
        c.fillRect(0, 0, 96, 64);

        if (nextK === undefined || state === 'idle') {
            return;
        }

        const m = SHAPES[nextK];
        const size = 20;
        const top = emptyTop(m);
        let rows = 0;
        let minX = 9;
        let maxX = -1;
        m.forEach((row, y) =>
            row.forEach((v, x) => {
                if (v) {
                    rows = Math.max(rows, y - top + 1);
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                }
            }),
        );
        const ox = (96 - (maxX - minX + 1) * size) / 2 - minX * size;
        const oy = (64 - rows * size) / 2 - top * size;
        c.fillStyle = Amb.paint('lazy', COLORS[nextK]);
        m.forEach((row, y) =>
            row.forEach((v, x) => {
                if (v) {
                    c.fillRect(
                        ox + x * size + 1,
                        oy + y * size + 1,
                        size - 2,
                        size - 2,
                    );
                }
            }),
        );
    }

    /* ---------- loop ---------- */
    function frame(now: number): void {
        const dt = Math.min(100, now - last);
        last = now;

        if (state === 'running' && !Amb.modalOpen()) {
            dropAcc += dt;
            const iv = dropInterval();

            while (dropAcc >= iv && state === 'running' && piece) {
                dropAcc -= iv;

                if (!collides(piece.m, piece.x, piece.y + 1)) {
                    piece.y++;
                } else {
                    lock(piece);
                }
            }
        }

        draw();
        rt.raf(frame);
    }

    /* ---------- input ---------- */
    function act(a: Action): void {
        if (state !== 'running' || Amb.modalOpen() || !piece) {
            return;
        }

        if (a === 'left') {
            move(piece, -1);
        } else if (a === 'right') {
            move(piece, 1);
        } else if (a === 'rotate') {
            rotate(piece);
        } else if (a === 'down') {
            softDrop(piece);
        } else if (a === 'drop') {
            hardDrop(piece);
        }

        sync();
    }

    rt.on<KeyboardEvent>(window, 'keydown', (e) => {
        if (Amb.modalOpen()) {
            return;
        }

        const k = e.key;

        if (
            k === 'ArrowLeft' ||
            k === 'ArrowRight' ||
            k === 'ArrowUp' ||
            k === 'ArrowDown' ||
            k === ' ' ||
            k === 'Spacebar'
        ) {
            e.preventDefault();
        }

        if (k === 'p' || k === 'P') {
            togglePause();

            return;
        }

        if ((k === 'Enter' || k === ' ') && (state === 'idle' || state === 'over')) {
            e.preventDefault();
            newGame();

            return;
        }

        if (k === 'ArrowLeft') {
            act('left');
        } else if (k === 'ArrowRight') {
            act('right');
        } else if (k === 'ArrowUp') {
            act('rotate');
        } else if (k === 'ArrowDown') {
            act('down');
        } else if ((k === ' ' || k === 'Spacebar') && !e.repeat) {
            act('drop');
        }
    });

    // touch buttons, with auto-repeat while held (except rotate and hard drop)
    $('touchPad')
        .querySelectorAll<HTMLButtonElement>('[data-act]')
        .forEach((b) => {
            let t1 = 0;
            let t2 = 0;
            const stop = (): void => {
                rt.clearTimeout(t1);
                rt.clearInterval(t2);
            };
            rt.on<PointerEvent>(b, 'pointerdown', (e) => {
                e.preventDefault();
                const a = b.dataset.act as Action;
                act(a);

                if (a === 'rotate' || a === 'drop') {
                    return;
                }

                stop();
                t1 = rt.timeout(() => {
                    t2 = rt.interval(() => act(a), 70);
                }, 200);
            });
            ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
                rt.on(b, ev, stop),
            );
        });

    rt.on<MouseEvent>($('bStart'), 'click', (e) => {
        (e.currentTarget as HTMLElement).blur();
        newGame();
    });
    rt.on<MouseEvent>($('bPause'), 'click', (e) => {
        (e.currentTarget as HTMLElement).blur();
        togglePause();
    });

    /* ---------- start ---------- */
    $('instr').innerHTML = Amb.setupText('dichoptic');
    Amb.startTracking(ID, {
        onPause: () => {
            if (state === 'running') {
                setPaused(true);
            }
        },
    });

    let resizeTimer = 0;
    rt.on(window, 'resize', () => {
        rt.clearTimeout(resizeTimer);
        resizeTimer = rt.timeout(layout, 100);
    });

    layout();
    sync();
    rt.raf((time) => {
        last = time;
        frame(time);
    });

    const calNote = Amb.settings().calibrated
        ? ''
        : `<p class="hint">${t('Tip: do the <a href=":url">calibration</a> first, so the game suits your eyes.', { url: Amb.urls.calibration })}</p>`;
    Amb.overlay(
        `<h2>${t('Dichoptic Tetris')}</h2><p>${Amb.setupText('dichoptic')}</p>` +
            `<p class="hint">${t('The falling piece is seen by the lazy eye, the settled pieces by the good eye, and the frame by both. Keys: ← → move, ↑ rotate, ↓ down, Space drop, P pause.')}</p>` +
            calNote,
        [{ label: t('Start'), primary: true, onClick: newGame }],
    );
}
