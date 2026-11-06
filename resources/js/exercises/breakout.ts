// "Dichoptic Breakout": the ball and the bricks are seen by the lazy eye,
// the paddle by the good eye (reduced contrast), the frame by both eyes.
// Ported from Exercitii-ambliopie/breakout.html.
import Amb from '@/amb';
import type { Runtime } from '@/exercises/runtime';
import { t } from '@/i18n';

const ID = 'breakout';
const W = 720;
const H = 480;
const R = 7;
const PW = 110;
const PH = 14;
const PY = H - 34;
// inner edges of the frame (the bottom is open)
const FL = 3;
const FR = W - 3;
const FT = 3;
const COLS = 10;
const GAP = 6;
const BX0 = 20;
const BY0 = 54;
const BH = 20;
const BW = (W - 2 * BX0 - (COLS - 1) * GAP) / COLS;
const STEP = 1 / 240;
const PADDLE_SPEED = 620;

type Brick = {
    x: number;
    y: number;
    w: number;
    h: number;
    row: number;
    hp: number;
    alive: boolean;
};
type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
    color: string;
};
type State = 'idle' | 'running' | 'paused' | 'between' | 'over';

const clamp = (v: number, a: number, b: number): number =>
    Math.max(a, Math.min(b, v));

export default function start(rt: Runtime): void {
    const { $ } = rt;
    const canvas = $<HTMLCanvasElement>('game');
    let ctx: CanvasRenderingContext2D | null = null;
    let scale = 1;
    let bricks: Brick[] = [];
    let total = 0;
    let destroyed = 0;
    let particles: Particle[] = [];
    let score = 0;
    let lives = 3;
    let level = 1;
    let acc = 0;
    let paddleX = W / 2;
    const ball = { x: W / 2, y: PY - R - 1, vx: 0, vy: 0, stuck: true };
    const keys = { left: false, right: false };
    let state: State = 'idle';
    let last = performance.now();

    const speed = (): number => Math.min(650, 330 + 35 * (level - 1));
    const pct = (v: number): number => Math.round(v * 100);

    /* ---------- layout ---------- */
    function layout(): void {
        const iw = window.innerWidth;
        scale = Math.min(
            1,
            (iw - 32 - (iw > 1000 ? 280 : 0)) / W,
            (window.innerHeight - 120) / H,
        );
        scale = Math.max(0.3, scale);
        ctx = Amb.fitCanvas(canvas, W, H, scale);
        draw();
    }

    /* ---------- levels ---------- */
    function buildLevel(): void {
        const rows = Math.min(4 + level, 8);
        const pat = (level - 1) % 4;
        bricks = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < COLS; c++) {
                let on = true;

                if (pat === 1) {
                    // checker, full top row
                    on = r === 0 || (r + c) % 2 === 0;
                } else if (pat === 2) {
                    // pyramid
                    const w = Math.min(5, r + 1);
                    on = c >= 5 - w && c < 5 + w;
                } else if (pat === 3) {
                    // gap in the middle
                    on = c !== 4 && c !== 5;
                }

                if (!on) {
                    continue;
                }

                const hp = level >= 3 && r < 2 ? 2 : 1;
                bricks.push({
                    x: BX0 + c * (BW + GAP),
                    y: BY0 + r * (BH + GAP),
                    w: BW,
                    h: BH,
                    row: r,
                    hp,
                    alive: true,
                });
            }
        }

        total = bricks.length;
        destroyed = 0;
        resetBall();
    }

    function resetBall(): void {
        ball.stuck = true;
        ball.vx = 0;
        ball.vy = 0;
        ball.x = paddleX;
        ball.y = PY - R - 1;
        acc = 0;
    }

    function launch(): void {
        if (state !== 'running' || !ball.stuck) {
            return;
        }

        const a = ((Math.random() * 40 - 20) * Math.PI) / 180;
        const s = speed();
        ball.vx = s * Math.sin(a);
        ball.vy = -s * Math.cos(a);
        ball.stuck = false;
    }

    /* ---------- game flow ---------- */
    function newGame(): void {
        score = 0;
        lives = 3;
        level = 1;
        particles = [];
        buildLevel();
        state = 'running';
        sync();
    }

    function setPaused(p: boolean): void {
        if (state === 'running' && p) {
            state = 'paused';
        } else if (state === 'paused' && !p) {
            state = 'running';
        }

        keys.left = keys.right = false;
        sync();
    }

    function togglePause(): void {
        setPaused(state === 'running');
    }

    function loseLife(): void {
        lives--;
        Amb.beep('bad');

        if (lives <= 0) {
            gameOver();

            return;
        }

        resetBall();
        sync();
    }

    function nextLevel(): void {
        level++;
        buildLevel();
        state = 'running';
        sync();
    }

    function levelCleared(): void {
        state = 'between';
        keys.left = keys.right = false;
        sync();
        Amb.beep('win');
        let msg = '';
        const s = Amb.settings();

        if (Amb.isAnaglyph() && s.autoBalance) {
            const before = s.fellowContrast;
            const v = Amb.adjustFellow(0.05, ID);

            if (v !== before) {
                msg = t(
                    'The contrast for the good eye goes up to <b>:pct%</b>: the eyes work in better balance.',
                    { pct: pct(v) },
                );
            }
        }

        sync();
        Amb.overlay(
            `<h2>${t('Level :level complete', { level })}</h2><div class="result-grid">` +
                `<div><span>${t('Score')}</span><b>${score}</b></div>` +
                `<div><span>${t('Lives')}</span><b>${lives}</b></div></div>` +
                (msg ? `<p>${msg}</p>` : ''),
            [
                { label: t('Menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('Next level'), primary: true, onClick: nextLevel },
            ],
        );
    }

    function gameOver(): void {
        if (state === 'over') {
            return;
        }

        state = 'over';
        keys.left = keys.right = false;
        sync();
        const s = Amb.settings();
        Amb.saveResult(ID, {
            score,
            level,
            fc: s.fellowContrast,
            mode: s.viewMode,
        });
        let msg = '';

        if (
            Amb.isAnaglyph() &&
            s.autoBalance &&
            level === 1 &&
            total > 0 &&
            destroyed / total < 0.3
        ) {
            const before = s.fellowContrast;
            const v = Amb.adjustFellow(-0.05, ID);

            if (v !== before) {
                msg = t(
                    'The contrast for the good eye went down to <b>:pct%</b>, so the lazy eye can join the game more easily.',
                    { pct: pct(v) },
                );
            }
        }

        const best = Amb.results(ID).reduce(
            (m, r) => Math.max(m, Number(r.score) || 0),
            0,
        );
        sync();
        Amb.overlay(
            `<h2>${t('Game over')}</h2><div class="result-grid">` +
                `<div><span>${t('Score')}</span><b>${score}</b></div>` +
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

    /* ---------- physics ---------- */
    function circleRect(
        cx: number,
        cy: number,
        r: number,
        x: number,
        y: number,
        w: number,
        h: number,
    ): boolean {
        const px = clamp(cx, x, x + w);
        const py = clamp(cy, y, y + h);
        const dx = cx - px;
        const dy = cy - py;

        return dx * dx + dy * dy < r * r;
    }

    function update(dt: number): void {
        const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

        if (dir) {
            paddleX += dir * PADDLE_SPEED * dt;
        }

        paddleX = clamp(paddleX, FL + PW / 2, FR - PW / 2);
        acc += dt;

        while (acc >= STEP && state === 'running') {
            acc -= STEP;
            step(STEP);
        }
    }

    function step(h: number): void {
        if (ball.stuck) {
            ball.x = paddleX;
            ball.y = PY - R - 1;

            return;
        }

        ball.x += ball.vx * h;
        ball.y += ball.vy * h;

        // walls
        if (ball.x - R < FL) {
            ball.x = FL + R;
            ball.vx = Math.abs(ball.vx);
        }

        if (ball.x + R > FR) {
            ball.x = FR - R;
            ball.vx = -Math.abs(ball.vx);
        }

        if (ball.y - R < FT) {
            ball.y = FT + R;
            ball.vy = Math.abs(ball.vy);
        }

        // paddle
        if (
            ball.vy > 0 &&
            circleRect(ball.x, ball.y, R, paddleX - PW / 2, PY, PW, PH)
        ) {
            const rel = clamp((ball.x - paddleX) / (PW / 2), -1, 1);
            const a = (rel * Math.PI) / 3;
            const s = speed();
            ball.vx = s * Math.sin(a);
            ball.vy = -s * Math.cos(a);
            ball.y = PY - R - 0.5;
            Amb.beep('tick');
        }

        // lost
        if (ball.y - R > H) {
            loseLife();

            return;
        }

        // bricks: one per substep, reflect on the axis with the smaller overlap
        for (const b of bricks) {
            if (
                !b.alive ||
                !circleRect(ball.x, ball.y, R, b.x, b.y, b.w, b.h)
            ) {
                continue;
            }

            const ox = Math.min(ball.x + R - b.x, b.x + b.w - (ball.x - R));
            const oy = Math.min(ball.y + R - b.y, b.y + b.h - (ball.y - R));

            if (ox < oy) {
                const sign = ball.x < b.x + b.w / 2 ? -1 : 1;

                if (Math.sign(ball.vx) === sign) {
                    continue; // already moving away: no double hit
                }

                ball.vx = sign * Math.abs(ball.vx);
            } else {
                const sign = ball.y < b.y + b.h / 2 ? -1 : 1;

                if (Math.sign(ball.vy) === sign) {
                    continue;
                }

                ball.vy = sign * Math.abs(ball.vy);
            }

            hitBrick(b);
            break;
        }
    }

    function hitBrick(b: Brick): void {
        b.hp--;

        if (b.hp > 0) {
            Amb.beep('tick');

            return;
        }

        b.alive = false;
        destroyed++;
        score += 10 * level;
        burst(b);
        Amb.beep('ok');
        sync();

        if (destroyed >= total) {
            levelCleared();
        }
    }

    function burst(b: Brick): void {
        const color = brickColor(b);

        for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2;
            const v = 60 + Math.random() * 180;
            const life = 0.45 + Math.random() * 0.4;
            particles.push({
                x: b.x + b.w / 2,
                y: b.y + b.h / 2,
                vx: Math.cos(a) * v,
                vy: Math.sin(a) * v,
                life,
                max: life,
                color,
            });
        }
    }

    function updateParticles(dt: number): void {
        for (const p of particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 320 * dt;
            p.life -= dt;
        }

        particles = particles.filter((p) => p.life > 0);
    }

    /* ---------- rendering ---------- */
    function brickColor(b: Brick): string {
        if (Amb.isAnaglyph()) {
            return Amb.paint('lazy', '#fff', 1 - (b.row % 4) * 0.1);
        }

        return `hsl(${Math.round((b.row * 300) / 7)},85%,58%)`;
    }

    function draw(): void {
        if (!ctx) {
            return;
        }

        const c = ctx;
        const ana = Amb.isAnaglyph();
        c.fillStyle = '#000';
        c.fillRect(0, 0, W, H);

        // bricks -> lazy eye
        for (const b of bricks) {
            if (!b.alive) {
                continue;
            }

            c.fillStyle = brickColor(b);
            c.fillRect(b.x, b.y, b.w, b.h);

            if (b.hp > 1) {
                c.strokeStyle = ana ? '#000' : 'rgba(255,255,255,0.85)';
                c.lineWidth = 2;
                c.strokeRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
            }
        }

        // particles -> lazy eye
        for (const p of particles) {
            c.globalAlpha = Math.max(0, p.life / p.max);
            c.fillStyle = p.color;
            c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        }

        c.globalAlpha = 1;
        // paddle -> good eye
        c.fillStyle = Amb.paint('fellow', '#4fc3f7');
        c.fillRect(paddleX - PW / 2, PY, PW, PH);
        // ball -> lazy eye
        c.fillStyle = Amb.paint('lazy', '#ffffff', 1);
        c.beginPath();
        c.arc(ball.x, ball.y, R, 0, Math.PI * 2);
        c.fill();
        // frame (top, left, right) -> both eyes
        c.strokeStyle = Amb.paint('both', '#cfd8e3', 0.85);
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(1.5, H);
        c.lineTo(1.5, 1.5);
        c.lineTo(W - 1.5, 1.5);
        c.lineTo(W - 1.5, H);
        c.stroke();

        if (state === 'idle') {
            banner(c, t('Press Start'), t('or the Enter key'));
        } else if (state === 'paused') {
            banner(c, t('Pause'), t('press P to continue'));
        } else if (state === 'over') {
            banner(c, t('Game over'), t('Score: :score', { score }));
        } else if (state === 'running' && ball.stuck) {
            hint(c, t('Space, ↑ or click: launch the ball'));
        }
    }

    function banner(
        c: CanvasRenderingContext2D,
        title: string,
        sub: string,
    ): void {
        c.fillStyle = 'rgba(0,0,0,0.75)';
        c.fillRect(W / 2 - 220, H / 2 - 30, 440, 100);
        c.fillStyle = Amb.paint('both', '#ffffff', 1);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = '700 30px "Segoe UI", system-ui, sans-serif';
        c.fillText(title, W / 2, H / 2 + 6);
        c.font = '500 17px "Segoe UI", system-ui, sans-serif';
        c.fillText(sub, W / 2, H / 2 + 44);
    }

    function hint(c: CanvasRenderingContext2D, text: string): void {
        c.fillStyle = Amb.paint('both', '#ffffff', 0.8);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = '500 17px "Segoe UI", system-ui, sans-serif';
        c.fillText(text, W / 2, PY - 70);
    }

    /* ---------- side panel ---------- */
    function sync(): void {
        $('sScore').textContent = String(score);
        $('sLives').textContent = String(lives);
        $('sLevel').textContent = String(level);
        $('sFc').textContent = Amb.isAnaglyph()
            ? `${pct(Amb.settings().fellowContrast)}%`
            : t('patch');
        $('bStart').textContent =
            state === 'idle' || state === 'over' ? t('Start') : t('New game');
        const pauseBtn = $<HTMLButtonElement>('bPause');
        pauseBtn.textContent =
            state === 'paused' ? t('Resume (P)') : t('Pause (P)');
        pauseBtn.disabled = !(state === 'running' || state === 'paused');
        Amb.setActive(state === 'running');
        // hide the cursor (seen by both eyes) while playing
        canvas.style.cursor = state === 'running' ? 'none' : '';
    }

    /* ---------- loop ---------- */
    function frame(now: number): void {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;

        if (state === 'running' && !Amb.modalOpen()) {
            update(dt);
        }

        if (state !== 'paused') {
            updateParticles(dt);
        }

        draw();
        rt.raf(frame);
    }

    /* ---------- input ---------- */
    function pointerX(e: PointerEvent): void {
        const r = canvas.getBoundingClientRect();
        paddleX = clamp((e.clientX - r.left) / scale, FL + PW / 2, FR - PW / 2);
    }

    rt.on<PointerEvent>(canvas, 'pointermove', (e) => {
        if (state === 'running' && !Amb.modalOpen()) {
            pointerX(e);
        }
    });
    rt.on<PointerEvent>(canvas, 'pointerdown', (e) => {
        e.preventDefault();

        if (Amb.modalOpen()) {
            return;
        }

        if (state === 'idle' || state === 'over') {
            newGame();

            return;
        }

        if (state !== 'running') {
            return;
        }

        pointerX(e);
        launch();
    });
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

        if (
            (k === 'Enter' || k === ' ') &&
            (state === 'idle' || state === 'over')
        ) {
            e.preventDefault();
            newGame();

            return;
        }

        if (state !== 'running') {
            return;
        }

        if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
            keys.left = true;
        } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
            keys.right = true;
        } else if (k === ' ' || k === 'Spacebar' || k === 'ArrowUp') {
            launch();
        }
    });
    rt.on<KeyboardEvent>(window, 'keyup', (e) => {
        const k = e.key;

        if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
            keys.left = false;
        } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
            keys.right = false;
        }
    });
    rt.on(window, 'blur', () => {
        keys.left = keys.right = false;
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

    buildLevel();
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
        `<h2>${t('Dichoptic Breakout')}</h2><p>${Amb.setupText('dichoptic')}</p>` +
            `<p class="hint">${t('The ball and the bricks are seen by the lazy eye, the paddle by the good eye, and the frame by both. Move the paddle with the mouse, your finger or ← →; Space, ↑ or click launches the ball; P pauses.')}</p>` +
            calNote,
        [{ label: t('Start'), primary: true, onClick: newGame }],
    );
}
