<template>
    <div class="space-y-4">
        <div class="panel p-5">
            <p class="text-sm text-muted">{{ $t(eyeLabel) }} · {{ formatDate(test.date) }} · {{ test.distance_cm }} cm</p>
            <slot name="score" />
        </div>

        <!-- Comparison -->
        <div class="panel p-5">
            <h2 class="mb-3 font-semibold">{{ $t('Compared with earlier tests') }}</h2>
            <template v-if="comparison && (comparison.month || comparison.since_start)">
                <div class="grid gap-3 sm:grid-cols-2">
                    <div v-if="comparison.month" class="rounded-lg border border-line bg-panel-2/60 p-3">
                        <p class="text-xs text-muted">{{ $t('vs. :days days ago (:date)', { days: comparison.baseline?.gap ?? 0, date: formatDate(comparison.baseline?.date) }) }}</p>
                        <p class="mt-1 flex flex-wrap items-center gap-2">
                            <b class="text-lg tabular-nums">{{ deltaText(comparison.month, comparison.baseline?.score) }}</b>
                            <VerdictBadge :verdict="comparison.month.verdict" />
                        </p>
                        <p v-if="comparison.approximate" class="mt-1 text-xs text-muted">{{ $t('No test from exactly a month ago: compared with the closest older one.') }}</p>
                    </div>
                    <div v-if="comparison.since_start" class="rounded-lg border border-line bg-panel-2/60 p-3">
                        <p class="text-xs text-muted">{{ $t('vs. your first test (:date)', { date: formatDate(comparison.first.date) }) }}</p>
                        <p class="mt-1 flex flex-wrap items-center gap-2">
                            <b class="text-lg tabular-nums">{{ deltaText(comparison.since_start, comparison.first.score) }}</b>
                            <VerdictBadge :verdict="comparison.since_start.verdict" />
                        </p>
                    </div>
                </div>
                <p class="mt-3 text-xs text-muted">{{ $t(noiseText) }}</p>
            </template>
            <p v-else class="text-sm text-muted">
                {{ $t('This is the first test for this eye: it is your starting point. Repeat it every week; after about a month you will see a comparison here.') }}
            </p>
        </div>

        <!-- Note -->
        <form class="panel flex flex-wrap items-end gap-3 p-5" @submit.prevent="saveNote">
            <div class="min-w-60 flex-1">
                <label class="form-label" for="test-note">{{ $t('Note (optional)') }}</label>
                <input id="test-note" v-model="note" type="text" maxlength="1000" class="form-control" :placeholder="$t('e.g. tired, new glasses, evening light')" />
            </div>
            <button type="submit" class="rounded-lg border border-line-2 px-4 py-2 text-sm hover:border-accent">{{ $t('Save the note') }}</button>
        </form>

        <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink" @click="$emit('again', test.eye)">
                {{ $t('Repeat for the same eye') }}
            </button>
            <button v-if="otherEye" type="button" class="rounded-lg border border-line-2 px-4 py-2 text-sm hover:border-accent" @click="$emit('again', otherEye)">
                {{ $t('Test the :eye', { eye: $t(otherEyeLabel) }) }}
            </button>
            <Link href="/test-vedere" class="rounded-lg border border-line-2 px-4 py-2 text-sm text-fg no-underline hover:border-accent">
                {{ $t('All tests and charts') }}
            </Link>
        </div>
    </div>
</template>

<script lang="ts">
import { Link, router } from '@inertiajs/vue3';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import VerdictBadge from '@/components/vision/VerdictBadge.vue';
import { t } from '@/i18n';
import type { EyeKey, VisionComparison, VisionDelta, VisionTestRow } from '@/types';
import { formatDate, formatNumber, formatVisionPercent, signed } from '@/utils/format';

const EYE_LABELS: Record<EyeKey, string> = { right: 'Right eye', left: 'Left eye', both: 'Both eyes' };

/** End of a vision test: saved result, comparison with a month ago and with the first test, note. */
export default defineComponent({
    name: 'TestResult',

    components: { Link, VerdictBadge },

    props: {
        test: { type: Object as PropType<VisionTestRow>, required: true },
        comparison: { type: Object as PropType<VisionComparison | null>, default: null },
    },

    emits: ['again'],

    data() {
        return {
            note: this.test.note ?? '',
        };
    },

    computed: {
        eyeLabel(): string {
            return EYE_LABELS[this.test.eye];
        },

        otherEye(): EyeKey | null {
            return this.test.eye === 'right' ? 'left' : this.test.eye === 'left' ? 'right' : null;
        },

        otherEyeLabel(): string {
            return this.otherEye === 'left' ? 'left eye' : 'right eye';
        },

        noiseText(): string {
            return this.test.type === 'contrast'
                ? 'Measurement error: about ±0.15 logCS (one triplet). Only bigger changes are real.'
                : 'Measurement error: about ±0.1 logMAR (one line = 5 letters). A change of 2 lines or more is a sure one; one line may be tiredness or chance.';
        },
    },

    methods: {
        formatDate,

        deltaText(delta: VisionDelta, from?: number): string {
            if (this.test.type === 'contrast') {
                return t(':change logCS', { change: signed(delta.gain, 2) });
            }

            let text = t(':lines lines (:letters letters)', { lines: signed(delta.lines), letters: signed(delta.letters, 0) });

            if (from !== undefined && this.comparison) {
                text += ` · ${formatVisionPercent(from)} → ${formatVisionPercent(this.comparison.latest.score)}`;
            }

            return delta.speed_change_pct !== undefined
                ? `${text} · ${t('speed :pct%', { pct: `${delta.speed_change_pct > 0 ? '+' : ''}${formatNumber(delta.speed_change_pct)}` })}`
                : text;
        },

        saveNote(): void {
            router.patch(`/test-vedere/${this.test.id}`, { note: this.note || null }, { preserveState: true, preserveScroll: true });
        },
    },
});
</script>
