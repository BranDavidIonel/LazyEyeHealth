<template>
    <Head :title="$t('Letter chart')" />

    <TestShell :title="$t('Letter chart (visual acuity)')" :running="phase === 'test'">
        <!-- 1. Setup -->
        <template v-if="phase === 'setup'">
            <p class="mb-5 max-w-3xl text-muted">
                {{ $t('Like the chart at the eye doctor: lines of 5 letters, smaller and smaller. You type the letters you see; the result is counted letter by letter (ETDRS method), so even one more letter shows.') }}
            </p>
            <TestSetup
                v-model:eye="eye"
                v-model:distance="distance"
                :distances="[100, 150, 200, 300]"
                distance-hint="Recommended: 150–300 cm (the further, the finer the smallest lines). Use a wireless keyboard or keep the keyboard on your lap."
                :range="rangeText"
            >
                <button type="button" class="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-ink hover:brightness-110" @click="begin">
                    {{ $t('Start the test') }}
                </button>
            </TestSetup>
        </template>

        <!-- 2. Test -->
        <template v-else-if="phase === 'test'">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <span>{{ $t(eyeName) }} · {{ distance }} cm</span>
                <span>{{ $t('Line :n · size :size logMAR', { n: tested.length + 1, size: formatNumber(current, 1) }) }}</span>
            </div>
            <div ref="stage" class="overflow-hidden rounded-xl bg-white" :style="{ height: `${stageHeight}px` }">
                <canvas ref="canvas" class="block" />
            </div>
            <div class="mt-5">
                <LetterKeys :key="tested.length" :count="5" @submit="answer" />
            </div>
            <p class="mt-4 text-center">
                <button type="button" class="text-sm text-muted underline hover:text-fg" @click="phase = 'setup'">{{ $t('Stop the test') }}</button>
            </p>
        </template>

        <!-- 3. Saving / result -->
        <p v-else-if="phase === 'saving'" class="text-muted">{{ $t('Saving the result…') }}</p>
        <p v-else-if="phase === 'error'" class="text-bad">{{ $t('The result could not be saved. Check the connection and try again.') }}</p>

        <TestResult v-else-if="saved" :test="saved.test" :comparison="saved.comparison" @again="again">
            <template #score>
                <div class="mt-2 flex flex-wrap items-end gap-x-8 gap-y-3">
                    <div>
                        <p class="text-4xl font-semibold tabular-nums">{{ formatNumber(saved.test.score, 2) }} <span class="text-lg text-muted">logMAR</span></p>
                        <p class="text-sm text-muted">{{ $t('lower is better · 0.0 = normal vision') }}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-3 text-sm">
                        <div><span class="block text-muted">{{ $t('Decimal') }}</span><b class="text-lg tabular-nums">{{ formatNumber(logmarToDecimal(saved.test.score), 2) }}</b></div>
                        <div><span class="block text-muted">Snellen</span><b class="text-lg tabular-nums">{{ logmarToSnellen(saved.test.score) }}</b></div>
                        <div><span class="block text-muted">{{ $t('Letters read') }}</span><b class="text-lg tabular-nums">{{ saved.test.data.letters_correct }}</b></div>
                    </div>
                </div>
                <p v-if="saved.test.data.floor" class="mt-3 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
                    {{ $t('You could not read the biggest line that fits on the screen at this distance. Move closer (for example 100 or 50 cm) and repeat: the result is then measured exactly.') }}
                </p>
                <p v-if="saved.test.data.ceiling" class="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                    {{ $t('You read even the smallest line that the screen can show at this distance: the real acuity may be even better. Sit further away to measure it.') }}
                </p>
                <table class="table-base mt-4">
                    <thead>
                        <tr><th>logMAR</th><th>{{ $t('Shown') }}</th><th>{{ $t('You typed') }}</th><th class="text-right">{{ $t('Correct') }}</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="line in savedLines" :key="line.logmar">
                            <td class="tabular-nums">{{ formatNumber(line.logmar, 1) }}</td>
                            <td class="font-mono tracking-widest">{{ line.shown }}</td>
                            <td class="font-mono tracking-widest">{{ line.typed || '—' }}</td>
                            <td class="text-right tabular-nums">{{ line.correct }}/5</td>
                        </tr>
                    </tbody>
                </table>
            </template>
        </TestResult>
    </TestShell>
</template>

<script lang="ts">
import { Head } from '@inertiajs/vue3';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import LetterKeys from '@/components/vision/LetterKeys.vue';
import TestResult from '@/components/vision/TestResult.vue';
import TestSetup from '@/components/vision/TestSetup.vue';
import TestShell from '@/components/vision/TestShell.vue';
import type { EyeKey, VisionDay } from '@/types';
import { formatNumber, logmarToDecimal, logmarToSnellen } from '@/utils/format';
import { lastDistance, rememberDistance, saveVisionTest } from '@/vision/api';
import type { SavedTest } from '@/vision/api';
import { drawSloan, letterHeightPx, randomLetters, round1, round2 } from '@/vision/sloan';
import type { SloanLetter } from '@/vision/sloan';

type Line = { logmar: number; shown: string; typed: string; correct: number };

/** Lines from the biggest to the smallest the chart may use. */
const SIZES = Array.from({ length: 17 }, (_, i) => round1(1.3 - i * 0.1)); // 1.3 … -0.3

export default defineComponent({
    name: 'AcuityTest',

    components: { Head, LetterKeys, TestResult, TestSetup, TestShell },

    props: {
        type: { type: String, required: true },
        previous: { type: Object as PropType<Partial<Record<EyeKey, VisionDay | null>>>, default: () => ({}) },
    },

    data() {
        return {
            phase: 'setup' as 'setup' | 'test' | 'saving' | 'result' | 'error',
            eye: (Amb.settings().lazyEye ?? 'right') as EyeKey,
            distance: lastDistance('acuity', 150),
            stageHeight: 320,
            current: 1,
            direction: 'up' as 'up' | 'down',
            letters: [] as SloanLetter[],
            tested: [] as Line[],
            maxSize: 1,
            minSize: 0,
            saved: null as SavedTest | null,
        };
    },

    computed: {
        eyeName(): string {
            return { right: 'Right eye', left: 'Left eye', both: 'Both eyes' }[this.eye];
        },

        /** Biggest / smallest line that fit on this screen at this distance (estimated before the test). */
        rangeText(): string {
            const [max, min] = this.limits(Math.min(window.innerWidth - 48, 1100) * Amb.dpr(), Math.min(window.innerHeight * 0.45, 420) * Amb.dpr());

            return this.$t('At :cm cm this screen can show lines from :max logMAR (:maxSnellen) down to :min logMAR (:minSnellen).', {
                cm: this.distance,
                max: formatNumber(max, 1),
                maxSnellen: logmarToSnellen(max),
                min: formatNumber(min, 1),
                minSnellen: logmarToSnellen(min),
            });
        },

        savedLines(): Line[] {
            return (this.saved?.test.data.lines as Line[] | undefined) ?? [];
        },
    },

    methods: {
        formatNumber,
        logmarToDecimal,
        logmarToSnellen,

        /** [biggest, smallest] logMAR that fit a canvas of this size in device pixels. */
        limits(widthPx: number, heightPx: number): [number, number] {
            const h = (L: number): number => letterHeightPx(L, this.distance, Amb.devPxPerMm());
            // 5 letters + 4 spaces of one letter width, plus a margin.
            const fits = SIZES.filter((L) => h(L) * 9.6 <= widthPx && h(L) * 1.3 <= heightPx);
            // The stroke (1/5 of the letter) must be at least one screen pixel.
            const visible = fits.filter((L) => h(L) >= 5);

            return [visible[0] ?? SIZES[SIZES.length - 1], visible[visible.length - 1] ?? SIZES[SIZES.length - 1]];
        },

        begin(): void {
            rememberDistance('acuity', this.distance);
            this.tested = [];
            this.saved = null;
            this.stageHeight = Math.round(Math.min(window.innerHeight * 0.45, 420));
            this.phase = 'test';

            this.$nextTick(() => {
                const stage = this.$refs.stage as HTMLElement;
                const ctx = Amb.deviceCanvas(this.$refs.canvas as HTMLCanvasElement, stage.clientWidth, this.stageHeight);
                [this.maxSize, this.minSize] = this.limits(ctx.canvas.width, ctx.canvas.height);

                // Start 2 lines above the last result (an easy first line), or at 1.0 the first time.
                const previous = this.previous[this.eye]?.score;
                const start = previous !== undefined && previous !== null ? round1(previous + 0.2) : 1.0;
                this.current = round1(Math.min(this.maxSize, Math.max(this.minSize, start)));
                this.direction = 'up';
                this.showLine();
            });
        },

        showLine(): void {
            this.letters = randomLetters(5);
            const canvas = this.$refs.canvas as HTMLCanvasElement | undefined;

            if (!canvas) {
                return;
            }

            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const h = letterHeightPx(this.current, this.distance, Amb.devPxPerMm());
            const total = h * 9; // letters and spaces are one letter wide
            let x = Math.round((canvas.width - total) / 2);
            const y = Math.round((canvas.height - h) / 2);

            for (const letter of this.letters) {
                drawSloan(ctx, letter, x, y, h, '#000');
                x += h * 2;
            }
        },

        answer(typed: string[]): void {
            const correct = this.letters.filter((letter, i) => typed[i] === letter).length;
            this.tested.push({ logmar: this.current, shown: this.letters.join(''), typed: typed.join(''), correct });
            const next = this.nextSize(correct);

            if (next === null) {
                void this.finish();
            } else {
                this.current = next;
                this.$nextTick(() => this.showLine());
            }
        },

        /** ETDRS-like walk: up until a line has 4+ letters right, then down until a line has 2 or fewer. */
        nextSize(correct: number): number | null {
            const done = new Map(this.tested.map((l) => [l.logmar, l.correct]));

            if (this.direction === 'up') {
                if (correct < 4 && this.current < this.maxSize - 1e-9) {
                    return round1(this.current + 0.1);
                }

                if (correct < 3) {
                    return null; // even the biggest line is too small
                }

                this.direction = 'down';
            } else if (correct <= 2) {
                return null;
            }

            let next = round1(this.current - 0.1);

            while (done.has(next)) {
                if ((done.get(next) ?? 0) <= 2) {
                    return null;
                }

                next = round1(next - 0.1);
            }

            return next < this.minSize - 1e-9 ? null : next;
        },

        async finish(): Promise<void> {
            const lines = [...this.tested].sort((a, b) => b.logmar - a.logmar);
            const top = lines[0].logmar;
            const letters = lines.reduce((sum, l) => sum + l.correct, 0);
            // ETDRS letter-by-letter score: lines above the first one count as read.
            const score = round2(top + 0.1 - 0.02 * letters);
            const last = lines[lines.length - 1];

            this.phase = 'saving';

            try {
                this.saved = await saveVisionTest({
                    type: 'acuity',
                    eye: this.eye,
                    distance_cm: this.distance,
                    score,
                    data: {
                        letters_correct: letters,
                        lines,
                        top,
                        floor: top >= this.maxSize - 1e-9 && (lines[0]?.correct ?? 0) < 3,
                        ceiling: last.logmar <= this.minSize + 1e-9 && last.correct >= 3,
                        px_per_mm: Amb.settings().pxPerMm,
                        dpr: Amb.dpr(),
                        size_calibrated: Amb.settings().sizeCalibrated,
                    },
                });
                this.phase = 'result';
            } catch {
                this.phase = 'error';
            }
        },

        again(eye: EyeKey): void {
            this.eye = eye;
            this.begin();
        },
    },
});
</script>
