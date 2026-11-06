<template>
    <Head :title="$t('Contrast test')" />

    <TestShell :title="$t('Contrast test (Pelli-Robson)')" :running="phase === 'test'">
        <!-- 1. Setup -->
        <template v-if="phase === 'setup'">
            <p class="mb-5 max-w-3xl text-muted">
                {{ $t('Like the Pelli-Robson chart: groups of 3 big letters that get fainter and fainter. You type the letters you see; the test stops at the first group where you miss 2 of the 3 letters. Every letter counts, and the result is in logCS: higher is better.') }}
            </p>
            <TestSetup
                v-model:eye="eye"
                v-model:distance="distance"
                :distances="[60, 100]"
                distance-hint="Recommended: 100 cm, like the Pelli-Robson chart. If the letters do not fit on the screen, sit at 60 cm: they are drawn at the same apparent size."
                :range="sizeText"
            >
                <p class="mb-4 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
                    {{ $t('The result depends on the screen and its brightness. Always use the same screen, the same brightness and the same room light, otherwise the tests cannot be compared.') }}
                </p>
                <button type="button" class="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-ink hover:brightness-110" @click="begin">
                    {{ $t('Start the test') }}
                </button>
            </TestSetup>
        </template>

        <!-- 2. Test -->
        <template v-else-if="phase === 'test'">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <span>{{ $t(eyeName) }} · {{ distance }} cm</span>
                <span>{{ $t('Group :n of :total', { n: index + 1, total: steps.length }) }}</span>
            </div>
            <!-- The test card has its own light grey background in every theme. -->
            <div ref="stage" class="overflow-hidden rounded-xl border border-line" :style="{ height: `${stageHeight}px`, background: bgCss }">
                <canvas ref="canvas" class="block" />
            </div>
            <div class="mt-5">
                <LetterKeys :key="tested.length" :count="3" @submit="answer" />
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
                        <p class="text-4xl font-semibold tabular-nums">{{ formatNumber(saved.test.score, 2) }} <span class="text-lg text-muted">logCS</span></p>
                        <p class="text-sm text-muted">{{ $t('higher is better · healthy adults: about 1.65–2.00 (approximate)') }}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-3 text-sm">
                        <div>
                            <span class="block text-muted">{{ $t('Last group with 2+ letters') }}</span>
                            <b class="text-lg tabular-nums">{{ lastFull === null ? '—' : `${formatNumber(lastFull, 2)} logCS` }}</b>
                        </div>
                        <div>
                            <span class="block text-muted">{{ $t('Its contrast') }}</span>
                            <b class="text-lg tabular-nums">{{ lastFull === null ? '—' : contrastText(lastFull) }}</b>
                        </div>
                        <div>
                            <span class="block text-muted">{{ $t('Letters read') }}</span>
                            <b class="text-lg tabular-nums">{{ saved.test.data.letters_correct }}</b>
                        </div>
                    </div>
                </div>
                <p v-if="saved.test.data.floor" class="mt-3 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
                    {{ $t('You could not read 2 letters even in the first, black group. Check the distance and your glasses and repeat. If the letters are too blurred to recognise, the letter chart is the better test for now.') }}
                </p>
                <p v-if="saved.test.data.ceiling" class="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                    {{ $t('You read even the faintest group of the test: your contrast sensitivity may be even higher than this score.') }}
                </p>
                <p class="mt-3 text-sm text-muted">
                    {{ $t('Letter size: :deg° (the Pelli-Robson standard is 2.8°). The result depends on the screen and its brightness: compare only tests made on the same screen, with the same brightness.', { deg: formatNumber(Number(saved.test.data.letter_deg ?? 0), 1) }) }}
                </p>
                <table class="table-base mt-4">
                    <thead>
                        <tr>
                            <th>logCS</th>
                            <th>{{ $t('Contrast') }}</th>
                            <th>{{ $t('Shown') }}</th>
                            <th>{{ $t('You typed') }}</th>
                            <th class="text-right">{{ $t('Correct') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in savedTriplets" :key="row.logcs">
                            <td class="tabular-nums">{{ formatNumber(row.logcs, 2) }}</td>
                            <td class="tabular-nums">{{ contrastText(row.logcs) }}</td>
                            <td class="font-mono tracking-widest">{{ row.shown }}</td>
                            <td class="font-mono tracking-widest">{{ row.typed || '—' }}</td>
                            <td class="text-right tabular-nums">{{ row.correct }}/3</td>
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
import { formatNumber } from '@/utils/format';
import { lastDistance, rememberDistance, saveVisionTest } from '@/vision/api';
import type { SavedTest } from '@/vision/api';
import { drawSloan, randomLetters, round2 } from '@/vision/sloan';
import type { SloanLetter } from '@/vision/sloan';

type Triplet = { logcs: number; shown: string; typed: string; correct: number };

/** Contrast of the groups, from black letters (0.00) to the faintest (2.25), in steps of 0.15 logCS. */
const STEPS = Array.from({ length: 16 }, (_, i) => round2(i * 0.15));
/** Background grey (sRGB level): light, with some room below white. */
const BG = 230;
/** Letter height of the Pelli-Robson chart, degrees of visual angle. */
const LETTER_DEG = 2.8;
/** Width of a group in letter heights: 3 letters + 2 spaces of one letter, plus a margin. */
const GROUP_WIDTH = 5.4;

/** sRGB transfer function: level 0..1 → linear luminance 0..1, and back. */
function toLinear(v: number): number {
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function toSrgb(l: number): number {
    return l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
}

/** Linear luminance of each 8-bit level. */
const LEVELS = Array.from({ length: 256 }, (_, i) => toLinear(i / 255));

/**
 * 8-bit level for a luminance, dithered: a random choice between the two
 * nearest levels, weighted so that the average luminance is exact. This way
 * contrasts smaller than one 8-bit step still show on average.
 */
function ditheredLevel(l: number): number {
    let lo = Math.max(0, Math.min(254, Math.floor(toSrgb(l) * 255 + 1e-9)));

    while (lo < 254 && LEVELS[lo + 1] <= l) {
        lo++;
    }

    while (lo > 0 && LEVELS[lo] > l) {
        lo--;
    }

    const f = (l - LEVELS[lo]) / (LEVELS[lo + 1] - LEVELS[lo]);

    return Math.random() < f ? lo + 1 : lo;
}

/**
 * Pelli-Robson style contrast sensitivity test: groups of 3 Sloan letters,
 * 2.8° tall, darker than a light grey background by a Weber contrast of
 * 10^-logCS. Score letter by letter: 0.05 logCS per letter, minus 0.15.
 */
export default defineComponent({
    name: 'ContrastTest',

    components: { Head, LetterKeys, TestResult, TestSetup, TestShell },

    props: {
        type: { type: String, required: true },
        previous: { type: Object as PropType<Partial<Record<EyeKey, VisionDay | null>>>, default: () => ({}) },
    },

    data() {
        return {
            phase: 'setup' as 'setup' | 'test' | 'saving' | 'result' | 'error',
            eye: (Amb.settings().lazyEye ?? 'right') as EyeKey,
            distance: lastDistance('contrast', 100),
            stageHeight: 320,
            index: 0,
            letters: [] as SloanLetter[],
            tested: [] as Triplet[],
            letterPx: 0,
            letterDeg: LETTER_DEG,
            saved: null as SavedTest | null,
            steps: STEPS,
            bgCss: `rgb(${BG}, ${BG}, ${BG})`,
        };
    },

    computed: {
        eyeName(): string {
            return { right: 'Right eye', left: 'Left eye', both: 'Both eyes' }[this.eye];
        },

        /** Letter size at this distance, estimated before the test. */
        sizeText(): string {
            const size = this.letterSize(
                Math.min(window.innerWidth - 48, 992) * Amb.dpr(),
                Math.min(window.innerHeight * 0.45, 420) * Amb.dpr(),
            );

            return size.capped
                ? this.$t('At :cm cm the letters would not fit on this screen at 2.8°: they are drawn at :deg°. Sit at 60 cm for the full size.', { cm: this.distance, deg: formatNumber(size.deg, 1) })
                : this.$t('At :cm cm the letters are 2.8° tall, as on the Pelli-Robson chart.', { cm: this.distance });
        },

        savedTriplets(): Triplet[] {
            return (this.saved?.test.data.triplets as Triplet[] | undefined) ?? [];
        },

        lastFull(): number | null {
            const value = this.saved?.test.data.last_full_triplet;

            return typeof value === 'number' ? value : null;
        },
    },

    methods: {
        formatNumber,

        /** "100%", "1,4%", "0,56%" */
        contrastText(logcs: number): string {
            const c = 100 * Math.pow(10, -logcs);

            return `${formatNumber(c, c >= 10 ? 0 : c >= 1 ? 1 : 2)}%`;
        },

        /** Letter height (device px) for 2.8° at this distance, made smaller only if the group does not fit. */
        letterSize(widthPx: number, heightPx: number): { px: number; deg: number; capped: boolean } {
            const mmPerPx = 1 / Amb.devPxPerMm();
            const want = Math.tan((LETTER_DEG * Math.PI) / 180) * this.distance * 10 * Amb.devPxPerMm();
            const px = Math.floor(Math.min(want, widthPx / GROUP_WIDTH, heightPx / 1.3));
            const deg = (Math.atan((px * mmPerPx) / (this.distance * 10)) * 180) / Math.PI;

            return { px, deg, capped: px < want * 0.97 };
        },

        begin(): void {
            rememberDistance('contrast', this.distance);
            this.tested = [];
            this.saved = null;
            this.index = 0;
            this.stageHeight = Math.round(Math.min(window.innerHeight * 0.45, 420));
            this.phase = 'test';

            this.$nextTick(() => {
                const stage = this.$refs.stage as HTMLElement;
                const ctx = Amb.deviceCanvas(this.$refs.canvas as HTMLCanvasElement, stage.clientWidth, this.stageHeight);
                const size = this.letterSize(ctx.canvas.width, ctx.canvas.height);
                this.letterPx = size.px;
                this.letterDeg = size.deg;
                this.showTriplet();
            });
        },

        showTriplet(): void {
            this.letters = randomLetters(3);
            const canvas = this.$refs.canvas as HTMLCanvasElement | undefined;

            if (!canvas) {
                return;
            }

            const W = canvas.width;
            const H = canvas.height;
            const h = this.letterPx;

            // 1. Where the letters are: black letters on a transparent canvas, the
            //    alpha channel is how much of each pixel the letter covers (smooth edges).
            const mask = document.createElement('canvas');
            mask.width = W;
            mask.height = H;
            const mctx = mask.getContext('2d', { willReadFrequently: true })!;
            let x = Math.round((W - h * 5) / 2);
            const y = Math.round((H - h) / 2);

            for (const letter of this.letters) {
                drawSloan(mctx, letter, x, y, h, '#000');
                x += h * 2;
            }

            const cover = mctx.getImageData(0, 0, W, H).data;

            // 2. Luminance: background Lb, letter Lb × (1 − C), mixed in linear light at the edges.
            const lb = LEVELS[BG];
            const lt = lb * (1 - Math.pow(10, -STEPS[this.index]));
            const ctx = canvas.getContext('2d')!;
            const img = ctx.createImageData(W, H);
            const d = img.data;

            for (let i = 0; i < d.length; i += 4) {
                const a = cover[i + 3] / 255;
                const v = a > 0 ? ditheredLevel(lb + (lt - lb) * a) : BG;
                d[i] = v;
                d[i + 1] = v;
                d[i + 2] = v;
                d[i + 3] = 255;
            }

            ctx.putImageData(img, 0, 0);
        },

        answer(typed: string[]): void {
            const correct = this.letters.filter((letter, i) => typed[i] === letter).length;
            this.tested.push({ logcs: STEPS[this.index], shown: this.letters.join(''), typed: typed.join(''), correct });

            // Go on while 2 of 3 letters are right.
            if (correct <= 1 || this.index >= STEPS.length - 1) {
                void this.finish();
            } else {
                this.index++;
                this.$nextTick(() => this.showTriplet());
            }
        },

        async finish(): Promise<void> {
            const triplets = this.tested;
            const letters = triplets.reduce((sum, t) => sum + t.correct, 0);
            // Pelli-Robson letter-by-letter score, counting from the first group.
            const score = round2(Math.max(0, 0.05 * letters - 0.15));
            const full = triplets.filter((t) => t.correct >= 2);
            const last = triplets[triplets.length - 1];

            this.phase = 'saving';

            try {
                this.saved = await saveVisionTest({
                    type: 'contrast',
                    eye: this.eye,
                    distance_cm: this.distance,
                    score,
                    data: {
                        letters_correct: letters,
                        triplets,
                        last_full_triplet: full.length ? full[full.length - 1].logcs : null,
                        floor: triplets[0].correct <= 1,
                        ceiling: last.logcs >= STEPS[STEPS.length - 1] && last.correct >= 2,
                        letter_deg: Math.round(this.letterDeg * 100) / 100,
                        letter_px: this.letterPx,
                        bg_level: BG,
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
