// "Calibration": lazy eye + way of working, colour test for the glasses,
// Worth 4-dot fusion test, balance between the eyes and screen size /
// distance. Ported from Exercitii-ambliopie/calibrare.html.
import Amb from '@/amb';
import type { AmbSettings } from '@/amb';
import type { RGB } from '@/amb/display';
import type { Runtime } from '@/exercises/runtime';
import { intlLocale, t } from '@/i18n';

type Side = AmbSettings['lazyEye'];
type SegKey = 'lazyEye' | 'viewMode' | 'redSide' | 'otherLens';
type SegOption<K extends SegKey> = [AmbSettings[K], string];
type WorthSeen = number | 'alt';

export default function start(rt: Runtime): void {
    const { $ } = rt;
    const S = (): AmbSettings => Amb.settings();
    const segs: { el: HTMLElement; key: SegKey }[] = [];

    /* ---------- helpers ---------- */
    function otherRGB(level: number): RGB {
        const l = S().otherLens;

        if (l === 'blue') {
            return [0, 0, level];
        }

        if (l === 'green') {
            return [0, level, 0];
        }

        return [0, level, level];
    }

    const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
    // Amb.EYE / Amb.LENS give the names in the current language
    const eyeName = (side: Side): string => Amb.EYE[side];
    const redCol = (): string => Amb.rgb([S().redLevel, 0, 0]);
    const otherCol = (): string => Amb.rgb(otherRGB(S().otherLevel));
    const redEye = (): string => eyeName(S().redSide);
    const otherEye = (): string => eyeName(Amb.other(S().redSide));
    const lensName = (): string => Amb.LENS[S().otherLens];
    const lazyName = (): string => eyeName(S().lazyEye);
    const goodName = (): string => eyeName(Amb.goodEye());
    const pct = (v: number): number => Math.round(v * 100);
    /** 'YYYY-MM-DD' as a local date */
    const showDate = (d: string): string => {
        const date = new Date(`${d}T12:00:00`);

        return Number.isNaN(date.getTime())
            ? d
            : date.toLocaleDateString(intlLocale());
    };

    function makeSeg<K extends SegKey>(
        el: HTMLElement,
        key: K,
        opts: SegOption<K>[],
    ): void {
        opts.forEach(([value, label]) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.dataset.v = String(value);
            b.onclick = () => {
                const patch: Partial<AmbSettings> = {};
                patch[key] = value;
                Amb.set(patch);
                refresh();
            };
            el.appendChild(b);
        });
        segs.push({ el, key });
    }

    makeSeg($('segLazy'), 'lazyEye', [
        ['left', cap(Amb.EYE.left)],
        ['right', cap(Amb.EYE.right)],
    ]);
    makeSeg($('segMode'), 'viewMode', [
        ['anaglyph', t('Red-cyan glasses (recommended)')],
        ['patch', t('Patch on the good eye')],
    ]);
    makeSeg($('segRed'), 'redSide', [
        ['left', cap(Amb.EYE.left)],
        ['right', cap(Amb.EYE.right)],
    ]);
    makeSeg($('segLens'), 'otherLens', [
        ['cyan', cap(Amb.LENS.cyan)],
        ['blue', cap(Amb.LENS.blue)],
        ['green', cap(Amb.LENS.green)],
    ]);

    /** Scales a logical canvas so it fits the card width. */
    function fit(
        canvas: HTMLCanvasElement,
        w: number,
        h: number,
    ): CanvasRenderingContext2D {
        const holder = canvas.closest<HTMLElement>('.cal-canvas');
        const avail = Math.max(160, (holder ? holder.clientWidth : w) - 4);

        return Amb.fitCanvas(canvas, w, h, Math.min(1, avail / w));
    }

    /* ---------- step 2: colour test ---------- */
    function drawColors(): void {
        const ctx = fit($<HTMLCanvasElement>('cColors'), 520, 220);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 520, 220);
        ctx.fillStyle = redCol();
        ctx.fillRect(80, 30, 130, 130);
        ctx.fillStyle = otherCol();
        ctx.fillRect(310, 30, 130, 130);
        ctx.fillStyle = '#fff';
        ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t('Red – :eye eye', { eye: redEye() }), 145, 190);
        ctx.fillText(
            t(':lens – :eye eye', { lens: cap(lensName()), eye: otherEye() }),
            375,
            190,
        );
    }

    /* ---------- step 3: Worth 4 dot ---------- */
    function drawWorth(): void {
        const ctx = fit($<HTMLCanvasElement>('cWorth'), 320, 320);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 320, 320);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 20, 280, 280);
        const dot = (x: number, y: number, c: string): void => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(x, y, 22, 0, Math.PI * 2);
            ctx.fill();
        };
        dot(160, 85, redCol());
        dot(85, 160, otherCol());
        dot(235, 160, otherCol());
        dot(160, 235, '#fff');
    }

    function worthText(seen: WorthSeen): string {
        const r = redEye();
        const o = otherEye();
        const lens = lensName();
        const lazyNote = (eye: string): string =>
            eye === lazyName()
                ? ` ${t('This is the lazy eye: the dichoptic exercises work exactly on this. Start with a low contrast for the good eye (Step 4).')}`
                : '';

        switch (String(seen)) {
            case '4':
                return t(
                    '<b class="good">Fusion.</b> Both eyes work together. You can do the dichoptic exercises.',
                );
            case '2':
                return (
                    t(
                        '<b>You see only with the :eye eye</b> (red lens). The :other eye (:lens lens) is suppressed: the brain ignores its image.',
                        { eye: r, other: o, lens },
                    ) + lazyNote(o)
                );
            case '3':
                return (
                    t(
                        '<b>You see only with the :eye eye</b> (:lens lens). The :other eye (red lens) is suppressed: the brain ignores its image.',
                        { eye: o, other: r, lens },
                    ) + lazyNote(r)
                );
            case '5':
                return t(
                    '<b class="bad">Double vision.</b> It can be a sign of strabismus. Talk to an ophthalmologist before the dichoptic exercises and stop if the double vision persists.',
                );
            case 'alt':
                return t(
                    '<b>Alternating suppression.</b> The eyes take over the image in turns, they do not work together. The dichoptic exercises help with this; repeat the test from time to time and discuss the result with your ophthalmologist.',
                );
        }

        return '';
    }

    function showWorth(seen: WorthSeen, when?: string): void {
        $('worthBtns')
            .querySelectorAll<HTMLButtonElement>('button')
            .forEach((b) =>
                b.setAttribute(
                    'aria-pressed',
                    String(b.dataset.seen === String(seen)),
                ),
            );
        $('worthOut').innerHTML =
            (when
                ? `<span class="hint">${t('Last result (:date):', { date: showDate(when) })} </span>`
                : '') + worthText(seen);
    }

    rt.on<MouseEvent>($('worthBtns'), 'click', (e) => {
        const b = (e.target as Element).closest<HTMLButtonElement>(
            'button[data-seen]',
        );

        if (!b) {
            return;
        }

        const seen: WorthSeen =
            b.dataset.seen === 'alt' ? 'alt' : Number(b.dataset.seen);
        Amb.saveResult('worth', { seen });
        showWorth(seen);
    });

    const lastWorth = Amb.results('worth').slice(-1)[0];

    if (lastWorth) {
        showWorth(lastWorth.seen as WorthSeen, lastWorth.d);
    }

    /* ---------- step 4: balance ---------- */
    const bal = $<HTMLInputElement>('balance');
    bal.value = String(Math.max(5, Math.round(S().fellowContrast * 20) * 5));

    function drawBalance(): void {
        const v = Number(bal.value) / 100;
        const ctx = fit($<HTMLCanvasElement>('cBalance'), 360, 360);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 360, 360);
        // overlapping bars add up, each eye keeps its whole bar
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = Amb.paint('lazy', '#fff', 1);
        ctx.fillRect(40, 162, 280, 36);
        ctx.fillStyle = Amb.paint('fellow', '#fff', v);
        ctx.fillRect(162, 40, 36, 280);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#fff';
        ctx.fillRect(172, 172, 16, 16);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(14, 14, 332, 332);
        $('balVal').textContent = `${pct(v)}%`;
    }

    rt.on(bal, 'input', () => {
        $('balSaved').textContent = '';
        drawBalance();
    });
    rt.on($('saveBalance'), 'click', () => {
        const v = Number(bal.value) / 100;
        Amb.set({ fellowContrast: v });
        Amb.saveResult('balance', { v, reason: 'calibrare' });
        $('balSaved').textContent = t('Saved ✓');
        refresh();
    });

    /* ---------- step 5: size + distance ---------- */
    const ppm = $<HTMLInputElement>('ppm');

    function setPpm(value: number): void {
        const v = Math.round(Math.min(8, Math.max(2, value)) * 100) / 100;
        ppm.value = String(v);
        Amb.set({ pxPerMm: v });
        $('sizeSaved').textContent = '';
        drawRect();
    }

    function drawRect(): void {
        const v = Number(ppm.value);
        const r = $('cardRect');
        r.style.width = `${85.6 * v}px`;
        r.style.height = `${53.98 * v}px`;
        r.style.borderRadius = `${3.18 * v}px`;
        $('ppmVal').textContent = v.toLocaleString(intlLocale(), {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    rt.on(ppm, 'input', () => setPpm(Number(ppm.value)));
    rt.on($('ppmMinus'), 'click', () => setPpm(Number(ppm.value) - 0.02));
    rt.on($('ppmPlus'), 'click', () => setPpm(Number(ppm.value) + 0.02));

    const dist = $<HTMLInputElement>('dist');

    function readDist(): number {
        let d = Math.round(Number(dist.value));

        if (!Number.isFinite(d) || d <= 0) {
            d = 60;
        }

        d = Math.min(300, Math.max(30, d));
        dist.value = String(d);

        return d;
    }

    rt.on(dist, 'change', () => {
        Amb.set({ distanceCm: readDist() });
        $('sizeSaved').textContent = '';
    });
    rt.on($('saveSize'), 'click', () => {
        Amb.set({
            pxPerMm: Number(ppm.value),
            distanceCm: readDist(),
            sizeCalibrated: true,
        });
        $('sizeSaved').textContent = t('Saved ✓');
    });

    /* ---------- sliders of step 2 ---------- */
    const redLevel = $<HTMLInputElement>('redLevel');
    const otherLevel = $<HTMLInputElement>('otherLevel');
    rt.on(redLevel, 'input', () => {
        Amb.set({ redLevel: Number(redLevel.value) });
        refresh();
    });
    rt.on(otherLevel, 'input', () => {
        Amb.set({ otherLevel: Number(otherLevel.value) });
        refresh();
    });

    /* ---------- finish ---------- */
    rt.on($('finish'), 'click', () => {
        Amb.set({ calibrated: true });
        const s = S();
        const balance = Amb.isAnaglyph()
            ? `<p>${t('Contrast for the good eye in the games: <b>:pct%</b>.', { pct: pct(s.fellowContrast) })}</p>`
            : '';
        const sizeNote = s.sizeCalibrated
            ? ''
            : `<p class="hint">${t('The screen size is not saved yet (Step 5). The precision exercises will use an approximate value.')}</p>`;
        Amb.overlay(
            `<h2>${t('Calibration done')}</h2>` +
                `<p>${Amb.modeText()}</p>` +
                balance +
                sizeNote +
                `<p class="hint">${t('You can repeat the calibration at any time, for example if you change the glasses, the screen or the light in the room.')}</p>`,
            [
                { label: t('Stay here') },
                {
                    label: t('Go to the menu'),
                    primary: true,
                    // save first, so the menu already shows the new settings
                    onClick: () => {
                        void Amb.flushSettings().then(() => {
                            if (!rt.disposed) {
                                Amb.go(Amb.urls.home);
                            }
                        });
                    },
                },
            ],
        );
    });

    /* ---------- refresh everything from the settings ---------- */
    function refresh(): void {
        const s = S();
        const ana = Amb.isAnaglyph();
        segs.forEach((g) =>
            g.el
                .querySelectorAll<HTMLButtonElement>('button')
                .forEach((b) =>
                    b.setAttribute(
                        'aria-pressed',
                        String(b.dataset.v === String(s[g.key])),
                    ),
                ),
        );
        rt.root.querySelectorAll<HTMLElement>('.anag').forEach((el) => {
            el.style.opacity = ana ? '' : '.45';
        });
        rt.root.querySelectorAll<HTMLElement>('.patch-note').forEach((el) => {
            el.hidden = ana;
        });
        $('patchTip').hidden = ana;

        const names = { lazy: lazyName(), good: goodName(), lens: lensName() };

        if (!ana) {
            $('summary1').innerHTML = t(
                'Cover the <b>:good</b> eye (the good one) with the patch. You work only with the lazy eye (<b>:lazy</b>).',
                names,
            );
        } else if (s.lazyEye === s.redSide) {
            $('summary1').innerHTML = t(
                'The lazy eye (<b>:lazy</b>) wears the <b>red</b> lens, the good eye (<b>:good</b>) wears the <b>:lens</b> lens.',
                names,
            );
        } else {
            $('summary1').innerHTML = t(
                'The lazy eye (<b>:lazy</b>) wears the <b>:lens</b> lens, the good eye (<b>:good</b>) wears the <b>red</b> lens.',
                names,
            );
        }

        $('colorInstr').innerHTML = t(
            'Put on the glasses. Close the <b>:other</b> eye (:lens lens): you should see only the <b>red</b> square. Close the <b>:red</b> eye (red lens): you should see only the <b>:lens</b> square. If you still see a faint shadow of the other square, lower its brightness with the slider below.',
            { other: otherEye(), red: redEye(), lens: lensName() },
        );
        redLevel.value = String(s.redLevel);
        otherLevel.value = String(s.otherLevel);
        $('redVal').textContent = String(s.redLevel);
        $('otherLabel').innerHTML =
            `${t(':lens brightness', { lens: lensName() })}: ` +
            `<span class="val">${s.otherLevel}</span>`;

        $('balanceInstr').innerHTML = t(
            'Look at the small white square in the centre. The horizontal bar is seen by the lazy eye (:lazy), the vertical bar by the good eye (:good). Start from a high value and lower it until you see <b>both bars</b> (a whole cross), about equally clear. The value you find is the starting point for the games.',
            names,
        );
        $('balCurrent').textContent = `${pct(s.fellowContrast)}%`;

        ppm.value = String(s.pxPerMm);

        if (document.activeElement !== dist) {
            dist.value = String(s.distanceCm);
        }

        drawColors();
        drawWorth();
        drawBalance();
        drawRect();
    }

    let resizeTimer = 0;
    rt.on(window, 'resize', () => {
        rt.clearTimeout(resizeTimer);
        resizeTimer = rt.timeout(refresh, 120);
    });

    refresh();
}
