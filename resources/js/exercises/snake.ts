// "Dichoptic Snake": classic snake on a 20 x 16 grid. The snake (head + body)
// is seen by the lazy eye at full contrast, the food and the obstacles by the
// good eye at reduced contrast (fellowContrast), the border by both eyes in
// dim grey (fusion lock). With the patch the normal colours are used.
// Same structure and look as tetris.ts.
import Amb from '@/amb';
import type { Runtime } from '@/exercises/runtime';
import { t } from '@/i18n';

const ID = 'sarpe';
const COLS = 20;
const ROWS = 16;
const CELL = 30;
/** room around the playfield for the border */
const M = 8;
const BW = COLS * CELL;
const BH = ROWS * CELL;
const W = BW + 2 * M;
const H = BH + 2 * M;
const START_LENGTH = 3;
const FOODS_PER_LEVEL = 5;
const MAX_BARS = 10;
/** room for the on-screen buttons under the board on touch screens */
const TOUCH_PAD_H = 132;
/** auto-balance: foods eaten in one game that raise / lower the good eye's contrast */
const BALANCE_UP_FOODS = 10;
const BALANCE_DOWN_FOODS = 2;

const COLOR_HEAD = '#a6ff6b';
const COLOR_BODY = '#33dd55';
const COLOR_FOOD = '#ff3b3b';
const COLOR_OBSTACLE = '#8d99ab';
const COLOR_BORDER = '#59626e';

type Dir = 'up' | 'down' | 'left' | 'right';
type Cell = { x: number; y: number };
type State = 'idle' | 'running' | 'paused' | 'over';
type End = 'wall' | 'obstacle' | 'self' | 'full';

const DIRS: Record<Dir, Cell> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Dir, Dir> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
};
const KEY_DIRS: Record<string, Dir> = {
    arrowup: 'up',
    w: 'up',
    arrowdown: 'down',
    s: 'down',
    arrowleft: 'left',
    a: 'left',
    arrowright: 'right',
    d: 'right',
};

const rand = (n: number): number => Math.floor(Math.random() * n);
const cellIndex = (x: number, y: number): number => y * COLS + x;

export default function start(rt: Runtime): void {
    const { $ } = rt;
    const canvas = $<HTMLCanvasElement>('board');
    let ctx: CanvasRenderingContext2D | null = null;

    let snake: Cell[] = [];
    let dir: Dir = 'right';
    /** turns pressed but not made yet (so quick double turns work) */
    let queue: Dir[] = [];
    let food: Cell | null = null;
    let obstacles = new Set<number>();
    let bars = 0;
    let score = 0;
    let foods = 0;
    let level = 1;
    let stepAcc = 0;
    let state: State = 'idle';
    let last = performance.now();
    let levelShownAt = -Infinity;
    let best = bestScore();

    function bestScore(): number {
        return Amb.results(ID).reduce(
            (m, r) => Math.max(m, Number(r.score) || 0),
            0,
        );
    }

    const pct = (v: number): number => Math.round(v * 100);
    const onSnake = (x: number, y: number): boolean =>
        snake.some((c) => c.x === x && c.y === y);

    /* ---------- layout ---------- */
    function layout(): void {
        const iw = window.innerWidth;
        const touch = window.matchMedia('(pointer: coarse)').matches;
        const byWidth = (iw - 34 - (iw > 1000 ? 280 : 0)) / W;
        const byHeight =
            (window.innerHeight - 110 - (touch ? TOUCH_PAD_H : 0)) / H;
        const scale = Math.min(1, Math.max(0.3, Math.min(byWidth, byHeight)));
        ctx = Amb.fitCanvas(canvas, W, H, scale);
        draw();
    }

    /* ---------- board ---------- */
    function placeFood(): boolean {
        const free: Cell[] = [];

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (!obstacles.has(cellIndex(x, y)) && !onSnake(x, y)) {
                    free.push({ x, y });
                }
            }
        }

        food = free.length ? free[rand(free.length)] : null;

        return food !== null;
    }

    /** May an obstacle go on this cell? Keeps it fair and the free area connected. */
    function obstacleFits(x: number, y: number): boolean {
        // one free cell to the walls and to the other obstacles: the free area stays connected
        if (x < 1 || y < 1 || x > COLS - 2 || y > ROWS - 2) {
            return false;
        }

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (obstacles.has(cellIndex(x + dx, y + dy))) {
                    return false;
                }
            }
        }

        if (onSnake(x, y) || (food && food.x === x && food.y === y)) {
            return false;
        }

        // not too close to the head, and not on the way it is going
        const head = snake[0];

        if (Math.abs(head.x - x) + Math.abs(head.y - y) < 4) {
            return false;
        }

        const d = DIRS[dir];

        for (let i = 1; i <= 6; i++) {
            if (head.x + d.x * i === x && head.y + d.y * i === y) {
                return false;
            }
        }

        return true;
    }

    /** Adds one short wall (2-3 cells, horizontal or vertical). */
    function addBar(): boolean {
        for (let tries = 0; tries < 200; tries++) {
            const horizontal = Math.random() < 0.5;
            const len = 2 + rand(2);
            const x0 = 1 + rand(COLS - 2 - (horizontal ? len - 1 : 0));
            const y0 = 1 + rand(ROWS - 2 - (horizontal ? 0 : len - 1));
            const cells: Cell[] = [];

            for (let i = 0; i < len; i++) {
                cells.push(
                    horizontal ? { x: x0 + i, y: y0 } : { x: x0, y: y0 + i },
                );
            }

            if (cells.every((c) => obstacleFits(c.x, c.y))) {
                cells.forEach((c) => obstacles.add(cellIndex(c.x, c.y)));

                return true;
            }
        }

        return false;
    }

    /** From level 2: 3 short walls, then one more per level (at most MAX_BARS). */
    function addObstacles(): void {
        const wanted = level >= 2 ? Math.min(MAX_BARS, level + 1) : 0;

        while (bars < wanted && addBar()) {
            bars++;
        }
    }

    /* ---------- game flow ---------- */
    function newGame(): void {
        const y = Math.floor(ROWS / 2);
        snake = [];

        for (let i = 0; i < START_LENGTH; i++) {
            snake.push({ x: 5 - i, y });
        }

        dir = 'right';
        queue = [];
        obstacles = new Set();
        bars = 0;
        score = 0;
        foods = 0;
        level = 1;
        stepAcc = 0;
        levelShownAt = -Infinity;
        best = bestScore();
        placeFood();
        state = 'running';
        last = performance.now();
        sync();
    }

    function stepInterval(): number {
        return Math.max(70, 170 * Math.pow(0.9, level - 1));
    }

    function turn(d: Dir): void {
        if (state !== 'running' || Amb.modalOpen()) {
            return;
        }

        const prev = queue.length ? queue[queue.length - 1] : dir;

        if (d === prev || d === OPPOSITE[prev] || queue.length >= 3) {
            return;
        }

        queue.push(d);
    }

    function step(): void {
        const next = queue.shift();

        if (next) {
            dir = next;
        }

        const head = snake[0];
        const x = head.x + DIRS[dir].x;
        const y = head.y + DIRS[dir].y;

        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) {
            gameOver('wall');

            return;
        }

        if (obstacles.has(cellIndex(x, y))) {
            gameOver('obstacle');

            return;
        }

        const eating = food !== null && food.x === x && food.y === y;
        // the tail moves out of the way, unless the snake grows
        const body = eating ? snake : snake.slice(0, -1);

        if (body.some((c) => c.x === x && c.y === y)) {
            gameOver('self');

            return;
        }

        snake.unshift({ x, y });

        if (eating) {
            eat();
        } else {
            snake.pop();
        }
    }

    function eat(): void {
        foods++;
        score += 10 * level;
        const newLevel = 1 + Math.floor(foods / FOODS_PER_LEVEL);

        if (newLevel > level) {
            level = newLevel;
            levelShownAt = performance.now();
            addObstacles();
            Amb.beep('win');
        } else {
            Amb.beep('ok');
        }

        if (!placeFood()) {
            gameOver('full');

            return;
        }

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

    function endText(end: End): string {
        switch (end) {
            case 'wall':
                return t('The snake hit the edge.');
            case 'obstacle':
                return t('The snake hit an obstacle.');
            case 'self':
                return t('The snake bit its own tail.');
            case 'full':
                return t('The snake filled the whole board. Bravo!');
        }
    }

    function gameOver(end: End): void {
        if (state === 'over') {
            return;
        }

        state = 'over';
        queue = [];
        sync();
        Amb.beep(end === 'full' ? 'win' : 'bad');
        const s = Amb.settings();
        Amb.saveResult(ID, {
            score,
            length: snake.length,
            level,
            fc: s.fellowContrast,
            mode: s.viewMode,
        });
        let msg = '';

        // same rule as Tetris: a good game raises the good eye's contrast, a very short one lowers it
        if (Amb.isAnaglyph() && s.autoBalance) {
            const before = s.fellowContrast;

            if (foods >= BALANCE_UP_FOODS) {
                const v = Amb.adjustFellow(0.05, ID);

                if (v !== before) {
                    msg = t(
                        'Very good! The contrast for the good eye goes up to <b>:pct%</b>: the eyes work in better balance.',
                        { pct: pct(v) },
                    );
                }
            } else if (foods <= BALANCE_DOWN_FOODS) {
                const v = Amb.adjustFellow(-0.05, ID);

                if (v !== before) {
                    msg = t(
                        'The contrast for the good eye went down to <b>:pct%</b>, so the lazy eye can join the game more easily.',
                        { pct: pct(v) },
                    );
                }
            }
        }

        best = bestScore();
        sync();
        Amb.overlay(
            `<h2>${t('Game over')}</h2>` +
                `<p>${endText(end)}</p>` +
                '<div class="result-grid">' +
                `<div><span>${t('Score')}</span><b>${score}</b></div>` +
                `<div><span>${t('Length')}</span><b>${snake.length}</b></div>` +
                `<div><span>${t('Level')}</span><b>${level}</b></div>` +
                `<div><span>${t('Best score')}</span><b${best === score && score > 0 ? ' class="good"' : ''}>${best}</b></div>` +
                '</div>' +
                (msg ? `<p>${msg}</p>` : ''),
            [
                { label: t('Menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('One more game'), primary: true, onClick: newGame },
            ],
        );
    }

    /* ---------- side panel ---------- */
    function sync(): void {
        $('sScore').textContent = String(score);
        $('sLength').textContent = String(
            snake.length || START_LENGTH,
        );
        $('sLevel').textContent = String(level);
        $('sBest').textContent = String(Math.max(best, score));
        $('sFc').textContent = Amb.isAnaglyph()
            ? `${pct(Amb.settings().fellowContrast)}%`
            : t('patch');
        $('bStart').textContent =
            state === 'running' || state === 'paused'
                ? t('New game')
                : t('Start');
        const pauseBtn = $<HTMLButtonElement>('bPause');
        pauseBtn.textContent =
            state === 'paused' ? t('Resume (P)') : t('Pause (P)');
        pauseBtn.disabled = !(state === 'running' || state === 'paused');
        $<HTMLButtonElement>('tPause').disabled = pauseBtn.disabled;
        Amb.setActive(state === 'running');
    }

    /* ---------- rendering ---------- */
    const cellX = (x: number): number => M + x * CELL;
    const cellY = (y: number): number => M + y * CELL;

    function draw(): void {
        if (!ctx) {
            return;
        }

        const c = ctx;
        c.fillStyle = '#000';
        c.fillRect(0, 0, W, H);

        // grid, seen by both eyes
        c.strokeStyle = Amb.paint('both', 'rgba(255,255,255,0.06)', 0.08);
        c.lineWidth = 1;
        c.beginPath();

        for (let x = 1; x < COLS; x++) {
            c.moveTo(cellX(x) + 0.5, M);
            c.lineTo(cellX(x) + 0.5, M + BH);
        }

        for (let y = 1; y < ROWS; y++) {
            c.moveTo(M, cellY(y) + 0.5);
            c.lineTo(M + BW, cellY(y) + 0.5);
        }

        c.stroke();

        if (snake.length) {
            drawObstacles(c);
            drawFood(c);
            drawSnake(c);
        }

        // border, seen by both eyes (fusion lock)
        c.strokeStyle = Amb.paint('both', COLOR_BORDER, 0.25);
        c.lineWidth = 3;
        c.strokeRect(M - 2.5, M - 2.5, BW + 5, BH + 5);

        if (state === 'running' && performance.now() - levelShownAt < 1400) {
            c.fillStyle = Amb.paint('both', '#ffffff', 0.8);
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.font = '700 24px "Segoe UI", system-ui, sans-serif';
            c.fillText(t('Level :level', { level }), W / 2, M + 34);
        }

        if (state === 'idle') {
            banner(c, t('Press Start'), t('or the Enter key'));
        } else if (state === 'paused') {
            banner(c, t('Pause'), t('press P or Space to continue'));
        } else if (state === 'over') {
            banner(c, t('Game over'), t('Score: :score', { score }));
        }
    }

    /** obstacles -> good eye: squares with a dark cross */
    function drawObstacles(c: CanvasRenderingContext2D): void {
        const color = Amb.paint('fellow', COLOR_OBSTACLE);
        c.lineWidth = 3;
        c.strokeStyle = '#000';

        obstacles.forEach((i) => {
            const px = cellX(i % COLS);
            const py = cellY(Math.floor(i / COLS));
            c.fillStyle = color;
            c.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
            c.beginPath();
            c.moveTo(px + 8, py + 8);
            c.lineTo(px + CELL - 8, py + CELL - 8);
            c.moveTo(px + CELL - 8, py + 8);
            c.lineTo(px + 8, py + CELL - 8);
            c.stroke();
        });
    }

    /** food -> good eye: a round dot */
    function drawFood(c: CanvasRenderingContext2D): void {
        if (!food) {
            return;
        }

        c.fillStyle = Amb.paint('fellow', COLOR_FOOD);
        c.beginPath();
        c.arc(
            cellX(food.x) + CELL / 2,
            cellY(food.y) + CELL / 2,
            CELL * 0.34,
            0,
            Math.PI * 2,
        );
        c.fill();
    }

    /** snake -> lazy eye, full contrast */
    function drawSnake(c: CanvasRenderingContext2D): void {
        // body: one rectangle over every pair of neighbouring segments, so it reads as one tube
        c.fillStyle = Amb.paint('lazy', COLOR_BODY);

        for (let i = snake.length - 1; i > 0; i--) {
            const a = snake[i];
            const b = snake[i - 1];
            const x0 = Math.min(cellX(a.x), cellX(b.x)) + 4;
            const y0 = Math.min(cellY(a.y), cellY(b.y)) + 4;
            c.fillRect(
                x0,
                y0,
                Math.abs(cellX(a.x) - cellX(b.x)) + CELL - 8,
                Math.abs(cellY(a.y) - cellY(b.y)) + CELL - 8,
            );
        }

        // head: a full cell with two dark eyes looking where it goes
        const head = snake[0];
        const hx = cellX(head.x);
        const hy = cellY(head.y);
        c.fillStyle = Amb.paint('lazy', COLOR_HEAD);
        c.fillRect(hx + 1, hy + 1, CELL - 2, CELL - 2);

        const d = DIRS[dir];
        const cx = hx + CELL / 2 + d.x * 6;
        const cy = hy + CELL / 2 + d.y * 6;
        // the two eyes sit across the direction of travel
        const ex = d.y !== 0 ? 6 : 0;
        const ey = d.x !== 0 ? 6 : 0;
        c.fillStyle = '#000';
        c.beginPath();
        c.arc(cx - ex, cy - ey, 3, 0, Math.PI * 2);
        c.arc(cx + ex, cy + ey, 3, 0, Math.PI * 2);
        c.fill();
    }

    function banner(
        c: CanvasRenderingContext2D,
        title: string,
        sub: string,
    ): void {
        c.fillStyle = 'rgba(0,0,0,0.75)';
        c.fillRect(60, H / 2 - 50, W - 120, 100);
        c.fillStyle = Amb.paint('both', '#ffffff', 1);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = '700 28px "Segoe UI", system-ui, sans-serif';
        c.fillText(title, W / 2, H / 2 - 14);
        c.font = '500 16px "Segoe UI", system-ui, sans-serif';
        c.fillText(sub, W / 2, H / 2 + 22);
    }

    /* ---------- loop ---------- */
    function frame(now: number): void {
        const dt = Math.min(100, now - last);
        last = now;

        if (state === 'running' && !Amb.modalOpen()) {
            stepAcc += dt;
            const iv = stepInterval();

            while (stepAcc >= iv && state === 'running') {
                stepAcc -= iv;
                step();
            }
        }

        draw();
        rt.raf(frame);
    }

    /* ---------- input ---------- */
    rt.on<KeyboardEvent>(window, 'keydown', (e) => {
        if (Amb.modalOpen()) {
            return;
        }

        const k = e.key.toLowerCase();
        const isSpace = k === ' ' || k === 'spacebar';

        if (k.startsWith('arrow') || isSpace) {
            e.preventDefault();
        }

        if (
            (k === 'enter' || isSpace) &&
            (state === 'idle' || state === 'over')
        ) {
            e.preventDefault();
            newGame();

            return;
        }

        if (k === 'p' || isSpace) {
            if (!e.repeat) {
                togglePause();
            }

            return;
        }

        const d = KEY_DIRS[k];

        if (d) {
            turn(d);
        }
    });

    // on-screen arrows
    $('touchPad')
        .querySelectorAll<HTMLButtonElement>('[data-dir]')
        .forEach((b) => {
            rt.on<PointerEvent>(b, 'pointerdown', (e) => {
                e.preventDefault();
                turn(b.dataset.dir as Dir);
            });
        });
    rt.on<PointerEvent>($('tPause'), 'pointerdown', (e) => {
        e.preventDefault();

        if (!Amb.modalOpen()) {
            togglePause();
        }
    });

    // swipe on the board; a tap starts a game when none is running
    let swipe: { x: number; y: number; id: number } | null = null;
    rt.on<PointerEvent>(canvas, 'pointerdown', (e) => {
        e.preventDefault();
        swipe = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    rt.on<PointerEvent>(canvas, 'pointerup', (e) => {
        if (!swipe || swipe.id !== e.pointerId || Amb.modalOpen()) {
            swipe = null;

            return;
        }

        const dx = e.clientX - swipe.x;
        const dy = e.clientY - swipe.y;
        swipe = null;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
            if (state === 'idle' || state === 'over') {
                newGame();
            }

            return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            turn(dx > 0 ? 'right' : 'left');
        } else {
            turn(dy > 0 ? 'down' : 'up');
        }
    });
    rt.on(canvas, 'pointercancel', () => {
        swipe = null;
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
        `<h2>${t('Dichoptic Snake')}</h2><p>${Amb.setupText('dichoptic')}</p>` +
            `<p class="hint">${t('The snake is seen by the lazy eye, the food and the obstacles by the good eye, and the frame by both. Eat the round dots to grow; avoid the edge, the squares with an X (obstacles, from level 2) and your own tail. Keys: arrows or W A S D, Space or P pause.')}</p>` +
            calNote,
        [{ label: t('Start'), primary: true, onClick: newGame }],
    );
}
