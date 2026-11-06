<template>
    <Head :title="$t('Reading test')" />

    <TestShell :title="$t('Reading test (print size and speed)')" :running="phase === 'test'">
        <!-- 1. Setup -->
        <template v-if="phase === 'setup'">
            <p class="mb-5 max-w-3xl text-muted">
                {{ $t('Sentences of 10 words in smaller and smaller print. Read each one aloud, as fast as you can without mistakes. The test measures the smallest print you can read and your reading speed — what matters in daily life.') }}
            </p>
            <TestSetup
                v-model:eye="eye"
                v-model:distance="distance"
                :distances="[40, 50, 60]"
                distance-hint="Standard reading distance: 40 cm. If the smallest sentences cannot be shown at 40 cm, use 50 or 60 cm — always the same one."
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
                <span>{{ $t('Sentence :n · size :size logMAR', { n: lines.length + 1, size: formatNumber(current, 1) }) }}</span>
            </div>

            <div
                ref="stage"
                class="flex items-center justify-center overflow-hidden rounded-xl bg-white p-4 text-black"
                :style="{ minHeight: `${stageHeight}px` }"
            >
                <p
                    v-if="step === 'reading'"
                    class="m-0 text-left"
                    :style="sentenceStyle"
                >
                    {{ sentence }}
                </p>
                <p v-else-if="step === 'ready'" class="m-0 max-w-md text-center text-base text-neutral-600">
                    {{ $t('Press Space (or the button) to show the sentence. Read it aloud, then press Space again as soon as you finish.') }}
                </p>
                <p v-else class="m-0 text-center text-base text-neutral-600">{{ $t('How many words did you get wrong or skip?') }}</p>
            </div>

            <div class="mt-5 flex flex-wrap justify-center gap-2">
                <button v-if="step === 'ready'" type="button" class="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-ink" @click="show">
                    {{ $t('Show the sentence (Space)') }}
                </button>
                <button v-else-if="step === 'reading'" type="button" class="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-ink" @click="stopReading">
                    {{ $t('Done (Space)') }}
                </button>
                <template v-else>
                    <button
                        v-for="n in 6"
                        :key="n"
                        type="button"
                        class="size-12 rounded-lg border border-line-2 bg-panel text-lg font-bold hover:border-accent"
                        @click="errors(n - 1)"
                    >
                        {{ n === 6 ? '5+' : n - 1 }}
                    </button>
                    <button type="button" class="rounded-lg border border-line-2 bg-panel px-4 text-sm hover:border-accent" @click="couldNotRead">
                        {{ $t('I could not read it') }}
                    </button>
                </template>
            </div>
            <p class="mt-3 text-center text-xs text-muted">
                {{ step === 'errors' ? $t('Keys 0–5. Be honest: a wrong or skipped word counts as an error.') : $t('Sit still at the chosen distance; do not lean in.') }}
            </p>
            <p class="mt-4 text-center">
                <button type="button" class="text-sm text-muted underline hover:text-fg" @click="finishEarly">{{ $t('Finish the test here') }}</button>
            </p>
        </template>

        <p v-else-if="phase === 'saving'" class="text-muted">{{ $t('Saving the result…') }}</p>
        <p v-else-if="phase === 'error'" class="text-bad">{{ $t('The result could not be saved. Check the connection and try again.') }}</p>

        <!-- 3. Result -->
        <TestResult v-else-if="saved" :test="saved.test" :comparison="saved.comparison" @again="again">
            <template #score>
                <div class="mt-2 grid gap-4 sm:grid-cols-3">
                    <div>
                        <span class="text-sm text-muted">{{ $t('Reading acuity') }}</span>
                        <p class="text-3xl font-semibold tabular-nums">{{ formatNumber(saved.test.score, 2) }} <span class="text-base text-muted">logMAR</span></p>
                        <p class="text-xs text-muted">{{ $t('the smallest print you can read (lower is better)') }}</p>
                    </div>
                    <div>
                        <span class="text-sm text-muted">{{ $t('Best reading speed') }}</span>
                        <p class="text-3xl font-semibold tabular-nums">{{ formatNumber(saved.test.data.max_wpm ?? 0) }} <span class="text-base text-muted">{{ $t('words/min') }}</span></p>
                        <p class="text-xs text-muted">{{ $t('adults read aloud about 150–200 words/min') }}</p>
                    </div>
                    <div>
                        <span class="text-sm text-muted">{{ $t('Critical print size') }}</span>
                        <p class="text-3xl font-semibold tabular-nums">{{ saved.test.data.cps === null || saved.test.data.cps === undefined ? '—' : formatNumber(saved.test.data.cps, 1) }} <span class="text-base text-muted">logMAR</span></p>
                        <p class="text-xs text-muted">{{ $t('below this size reading gets slow') }}</p>
                    </div>
                </div>
                <div v-if="speedPoints.length > 1" class="mt-4">
                    <ChartCanvas type="line" :data="speedData" :options="speedOptions" :height="200" :label="$t('Reading speed by print size')" />
                </div>
                <p v-if="saved.test.data.ceiling" class="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                    {{ $t('You read even the smallest sentence the screen can show at this distance. Next time sit further away (50 or 60 cm) to measure finer.') }}
                </p>
            </template>
        </TestResult>
    </TestShell>
</template>

<script lang="ts">
import { Head } from '@inertiajs/vue3';
import type { ChartData, ChartOptions } from 'chart.js';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import ChartCanvas from '@/components/charts/ChartCanvas.vue';
import TestResult from '@/components/vision/TestResult.vue';
import TestSetup from '@/components/vision/TestSetup.vue';
import TestShell from '@/components/vision/TestShell.vue';
import { getLocale, t } from '@/i18n';
import type { EyeKey, VisionDay } from '@/types';
import { baseOptions, series } from '@/utils/charts';
import { formatNumber } from '@/utils/format';
import { lastDistance, rememberDistance, saveVisionTest } from '@/vision/api';
import type { SavedTest } from '@/vision/api';
import { SENTENCES, shuffled, wordCount } from '@/vision/sentences';
import { round1, round2 } from '@/vision/sloan';

type Line = { logmar: number; words: number; errors: number; seconds: number; wpm: number; read: boolean };

const FONT = 'Verdana, Arial, Helvetica, sans-serif';
const SIZES = Array.from({ length: 15 }, (_, i) => round1(1.1 - i * 0.1)); // 1.1 … -0.3

/** x-height of the font as a part of the font size, measured once. */
let xRatio = 0;

function xHeightRatio(): number {
    if (!xRatio) {
        const ctx = document.createElement('canvas').getContext('2d');

        if (ctx) {
            ctx.font = `100px ${FONT}`;
            const m = ctx.measureText('x');
            xRatio = m.actualBoundingBoxAscent > 0 ? m.actualBoundingBoxAscent / 100 : 0.545;
        } else {
            xRatio = 0.545;
        }
    }

    return xRatio;
}

export default defineComponent({
    name: 'ReadingTest',

    components: { ChartCanvas, Head, TestResult, TestSetup, TestShell },

    props: {
        type: { type: String, required: true },
        previous: { type: Object as PropType<Partial<Record<EyeKey, VisionDay | null>>>, default: () => ({}) },
    },

    data() {
        return {
            phase: 'setup' as 'setup' | 'test' | 'saving' | 'result' | 'error',
            step: 'ready' as 'ready' | 'reading' | 'errors',
            eye: (Amb.settings().lazyEye ?? 'right') as EyeKey,
            distance: lastDistance('reading', 40),
            stageHeight: 300,
            current: 0.8,
            start: 0.8,
            sentences: [] as string[],
            sentence: '',
            shownAt: 0,
            seconds: 0,
            lines: [] as Line[],
            maxSize: 1.1,
            minSize: 0,
            saved: null as SavedTest | null,
        };
    },

    computed: {
        eyeName(): string {
            return { right: 'Right eye', left: 'Left eye', both: 'Both eyes' }[this.eye];
        },

        sentenceStyle(): Record<string, string> {
            const px = this.fontPx(this.current);

            return {
                fontFamily: FONT,
                fontSize: `${px}px`,
                lineHeight: '1.25',
                // about 3 lines of a 10-word sentence
                width: `${Math.min(px * 11.5, (this.$refs.stage as HTMLElement | undefined)?.clientWidth ?? px * 11.5)}px`,
                textWrap: 'balance',
            };
        },

        rangeText(): string {
            const [max, min] = this.limits(Math.min(window.innerWidth - 80, 1000), Math.min(window.innerHeight * 0.5, 460));

            return t('At :cm cm this screen can show sentences from :max down to :min logMAR.', {
                cm: this.distance,
                max: formatNumber(max, 1),
                min: formatNumber(min, 1),
            });
        },

        speedPoints(): Line[] {
            return ((this.saved?.test.data.lines as Line[] | undefined) ?? []).filter((l) => l.read);
        },

        speedData(): ChartData<'line'> {
            return {
                labels: this.speedPoints.map((l) => formatNumber(l.logmar, 1)),
                datasets: [
                    {
                        label: t('Words per minute'),
                        data: this.speedPoints.map((l) => Math.round(l.wpm)),
                        borderColor: series(0),
                        backgroundColor: series(0),
                        borderWidth: 2,
                        pointRadius: 4,
                        tension: 0.2,
                    },
                ],
            };
        },

        speedOptions(): ChartOptions<'line'> {
            const options = baseOptions<'line'>((v) => `${formatNumber(v)}`);
            options.plugins = { ...options.plugins, legend: { display: false } };
            options.scales!.x = { ...options.scales!.x, title: { display: true, text: t('print size (logMAR), big → small') } };
            options.scales!.y = { ...options.scales!.y, title: { display: true, text: t('words per minute') } };

            return options;
        },
    },

    mounted() {
        window.addEventListener('keydown', this.onKey);
    },

    beforeUnmount() {
        window.removeEventListener('keydown', this.onKey);
    },

    methods: {
        formatNumber,

        /** CSS font size for a print size: x-height = 5 arcmin × 10^logMAR at the distance. */
        fontPx(logmar: number): number {
            const xHeightCss = Amb.arcminToDevPx(5 * Math.pow(10, logmar), this.distance) / Amb.dpr();

            return xHeightCss / xHeightRatio();
        },

        /** [biggest, smallest] logMAR whose sentence fits the stage and whose x-height is at least 3 screen pixels. */
        limits(widthCss: number, heightCss: number): [number, number] {
            const fits = SIZES.filter((L) => {
                const px = this.fontPx(L);

                return px * 11.5 <= widthCss && px * 1.25 * 3.4 <= heightCss;
            });
            const visible = fits.filter((L) => this.fontPx(L) * xHeightRatio() * Amb.dpr() >= 3);

            return [visible[0] ?? SIZES[0], visible[visible.length - 1] ?? SIZES[0]];
        },

        begin(): void {
            rememberDistance('reading', this.distance);
            this.lines = [];
            this.saved = null;
            this.sentences = shuffled(SENTENCES[getLocale()]);
            this.stageHeight = Math.round(Math.min(window.innerHeight * 0.5, 460));
            this.phase = 'test';

            this.$nextTick(() => {
                const stage = this.$refs.stage as HTMLElement;
                [this.maxSize, this.minSize] = this.limits(stage.clientWidth - 32, this.stageHeight - 32);
                const previous = this.previous[this.eye]?.score;
                const start = previous !== undefined && previous !== null ? round1(previous + 0.4) : 1.0;
                this.start = round1(Math.min(this.maxSize, Math.max(this.minSize, start)));
                this.current = this.start;
                this.step = 'ready';
            });
        },

        show(): void {
            this.sentence = this.sentences[this.lines.length % this.sentences.length];
            this.step = 'reading';
            this.shownAt = performance.now();
        },

        stopReading(): void {
            this.seconds = Math.max(0.5, (performance.now() - this.shownAt) / 1000);
            this.step = 'errors';
        },

        errors(count: number): void {
            const words = wordCount(this.sentence);
            const wrong = Math.min(words, count);
            this.lines.push({
                logmar: this.current,
                words,
                errors: wrong,
                seconds: Math.round(this.seconds * 10) / 10,
                wpm: Math.max(0, ((words - wrong) * 60) / this.seconds),
                read: true,
            });

            // Half of the sentence wrong, or the smallest size: stop.
            if (count >= 5 || this.current <= this.minSize + 1e-9) {
                void this.finish();

                return;
            }

            this.current = round1(this.current - 0.1);
            this.step = 'ready';
        },

        couldNotRead(): void {
            this.lines.push({ logmar: this.current, words: wordCount(this.sentence), errors: wordCount(this.sentence), seconds: 0, wpm: 0, read: false });
            void this.finish();
        },

        finishEarly(): void {
            if (this.lines.some((l) => l.read)) {
                void this.finish();
            } else {
                this.phase = 'setup';
            }
        },

        onKey(event: KeyboardEvent): void {
            if (this.phase !== 'test') {
                return;
            }

            if (event.key === ' ') {
                event.preventDefault();

                if (this.step === 'ready') {
                    this.show();
                } else if (this.step === 'reading') {
                    this.stopReading();
                }
            } else if (this.step === 'errors' && /^[0-5]$/.test(event.key)) {
                event.preventDefault();
                this.errors(Number(event.key));
            }
        },

        async finish(): Promise<void> {
            const read = this.lines.filter((l) => l.read);

            if (!read.length) {
                this.phase = 'setup';

                return;
            }

            // Reading acuity (MNREAD rule): every sentence read lowers it by 0.1, every wrong word adds 0.01.
            const wrongWords = read.reduce((sum, l) => sum + (l.errors * 10) / l.words, 0);
            const score = round2(this.start + 0.1 - 0.1 * read.length + 0.01 * wrongWords);

            // Best speed: best average of 3 sentences in a row (or of all when fewer were read).
            let maxWpm = 0;

            for (let i = 0; i < read.length; i++) {
                const group = read.slice(i, i + 3);

                if (group.length === Math.min(3, read.length)) {
                    maxWpm = Math.max(maxWpm, group.reduce((s, l) => s + l.wpm, 0) / group.length);
                }
            }

            // Critical print size: smallest size before the speed drops below 80% of the best.
            let cps: number | null = null;

            for (const line of read) {
                if (line.wpm >= 0.8 * maxWpm) {
                    cps = line.logmar;
                } else if (cps !== null) {
                    break;
                }
            }

            const last = this.lines[this.lines.length - 1];
            this.phase = 'saving';

            try {
                this.saved = await saveVisionTest({
                    type: 'reading',
                    eye: this.eye,
                    distance_cm: this.distance,
                    score,
                    data: {
                        max_wpm: Math.round(maxWpm),
                        cps,
                        start: this.start,
                        lines: this.lines.map((l) => ({ ...l, wpm: Math.round(l.wpm) })),
                        ceiling: last.read && last.logmar <= this.minSize + 1e-9 && last.errors < 5,
                        language: getLocale(),
                        px_per_mm: Amb.settings().pxPerMm,
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
