<template>
    <Head :title="$t('Vision test')" />

    <PageHeader
        :title="$t('Vision test')"
        :description="$t('Check whether your vision really improves: the same tests, in the same conditions, compared month by month.')"
    />

    <!-- The three tests -->
    <div class="grid gap-4 md:grid-cols-3">
        <Link
            v-for="test in tests_"
            :key="test.type"
            :href="`/test-vedere/${test.type}`"
            class="panel group flex flex-col gap-2 p-5 text-fg no-underline transition hover:-translate-y-0.5 hover:border-accent"
        >
            <div class="flex items-center gap-3">
                <span class="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <component :is="test.icon" class="size-6" />
                </span>
                <div>
                    <h2 class="font-semibold group-hover:text-accent">{{ $t(test.title) }}</h2>
                    <p class="text-xs text-muted">{{ $t(test.when) }}</p>
                </div>
            </div>
            <p class="text-sm text-muted">{{ $t(test.text) }}</p>
            <p class="mt-auto pt-2 text-sm font-semibold text-accent">{{ $t('Start the test →') }}</p>
        </Link>
    </div>

    <!-- How to read the results -->
    <div class="panel mt-4 p-5 text-sm">
        <h2 class="mb-2 font-semibold">{{ $t('Real progress or chance?') }}</h2>
        <ul class="list-disc space-y-1 pl-5 text-muted">
            <li>{{ $t('A letter chart test can vary by about one line (5 letters) from one day to the next, even when the eye does not change: tiredness, light, attention.') }}</li>
            <li>{{ $t('A change of 2 lines (0.2 logMAR) or more is a sure change. One line is "possible": confirm it with another test.') }}</li>
            <li>{{ $t('Take each test twice in a row; the comparison uses the average of the day. Same distance, same screen, same light, ideally at the same time of day.') }}</li>
            <li>{{ $t('These are home measurements, good for following the trend. The diagnosis and the official measurement are made by the eye doctor.') }}</li>
        </ul>
    </div>

    <!-- Monthly comparison -->
    <h2 class="mt-10 mb-1 text-lg font-semibold">{{ $t('Now vs. one month ago') }}</h2>
    <p class="mb-4 text-sm text-muted">{{ $t('For every test and eye: the latest test day compared with the test day closest to 30 days earlier.') }}</p>

    <div v-if="comparisons.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div v-for="row in comparisons" :key="`${row.type}-${row.eye}`" class="panel p-5">
            <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p class="font-semibold">{{ row.eye_label }}</p>
                    <p class="text-xs text-muted">{{ row.type_label }} · {{ $t(':count test days', { count: row.tests }) }}</p>
                </div>
                <VerdictBadge v-if="row.month" :verdict="row.month.verdict" />
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-lg bg-panel-2 p-3">
                    <p class="text-xs text-muted">{{ row.baseline ? formatDate(row.baseline.date) : $t('one month ago') }}</p>
                    <p class="text-lg font-semibold tabular-nums">{{ row.baseline ? score(row, row.baseline.score) : '—' }}</p>
                    <p v-if="row.baseline && row.type === 'reading' && row.baseline.extra.max_wpm" class="text-xs text-muted">{{ $t(':wpm words/min', { wpm: formatNumber(row.baseline.extra.max_wpm) }) }}</p>
                </div>
                <div class="rounded-lg bg-panel-2 p-3">
                    <p class="text-xs text-muted">{{ formatDate(row.latest.date) }}</p>
                    <p class="text-lg font-semibold tabular-nums">{{ score(row, row.latest.score) }}</p>
                    <p v-if="row.type === 'reading' && row.latest.extra.max_wpm" class="text-xs text-muted">{{ $t(':wpm words/min', { wpm: formatNumber(row.latest.extra.max_wpm) }) }}</p>
                </div>
            </div>

            <p v-if="row.month" class="mt-3 text-sm">
                <b>{{ deltaText(row, row.month) }}</b>
                <span v-if="row.approximate" class="text-xs text-muted"> · {{ $t('not exactly a month apart') }}</span>
            </p>
            <p v-else class="mt-3 text-sm text-muted">{{ $t('The comparison appears when you have a test at least a week older (ideally a month).') }}</p>
            <p v-if="row.since_start" class="mt-1 text-xs text-muted">
                {{ $t('Since the first test (:date):', { date: formatDate(row.first.date) }) }} {{ deltaText(row, row.since_start) }}
            </p>
        </div>
    </div>
    <div v-else class="panel p-5 text-sm text-muted">
        {{ $t('No vision test yet. Start with the letter chart for the lazy eye, then for the good eye: these are your starting point.') }}
    </div>

    <!-- Charts -->
    <template v-for="chart in charts" :key="chart.type">
        <AppCard class="mt-4" :title="chart.title" :description="chart.description">
            <ChartCanvas type="line" :data="chart.data" :options="chart.options" :height="240" :label="chart.title" />
        </AppCard>
    </template>

    <!-- History -->
    <AppCard class="mt-10" :title="$t('All tests')" flush>
        <div v-if="tests.length" class="relative overflow-x-auto">
            <table class="table-base">
                <thead>
                    <tr>
                        <th>{{ $t('Date') }}</th>
                        <th>{{ $t('Test') }}</th>
                        <th>{{ $t('Eye') }}</th>
                        <th class="text-right">{{ $t('Distance') }}</th>
                        <th class="text-right">{{ $t('Result') }}</th>
                        <th>{{ $t('Note') }}</th>
                        <th class="w-10"><span class="sr-only">{{ $t('Delete') }}</span></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="test in tests" :key="test.id">
                        <td class="whitespace-nowrap">{{ formatDate(test.date) }} <span class="text-xs text-muted">{{ test.time }}</span></td>
                        <td>{{ typeLabel(test.type) }}</td>
                        <td>{{ eyeLabel(test.eye) }}</td>
                        <td class="text-right tabular-nums">{{ test.distance_cm }} cm</td>
                        <td class="text-right whitespace-nowrap tabular-nums">
                            {{ test.type === 'contrast' ? `${formatNumber(test.score, 2)} logCS` : `${formatNumber(test.score, 2)} logMAR` }}
                            <span v-if="test.type === 'reading' && test.data.max_wpm" class="block text-xs text-muted">{{ $t(':wpm words/min', { wpm: formatNumber(test.data.max_wpm) }) }}</span>
                        </td>
                        <td class="max-w-56 truncate text-muted" :title="test.note ?? ''">{{ test.note ?? '' }}</td>
                        <td>
                            <button type="button" class="rounded p-1 text-muted hover:text-bad" :title="$t('Delete')" @click="remove(test.id)">
                                <Trash2 class="size-4" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p v-else class="p-5 text-sm text-muted">{{ $t('No test yet.') }}</p>
    </AppCard>
</template>

<script lang="ts">
import { BookOpen, Contrast, Eye, Trash2 } from '@lucide/vue';
import { Head, Link, router } from '@inertiajs/vue3';
import type { ChartData, ChartOptions } from 'chart.js';
import type { Component, PropType } from 'vue';
import { defineComponent, markRaw } from 'vue';
import ChartCanvas from '@/components/charts/ChartCanvas.vue';
import AppCard from '@/components/general/AppCard.vue';
import PageHeader from '@/components/general/PageHeader.vue';
import VerdictBadge from '@/components/vision/VerdictBadge.vue';
import { t } from '@/i18n';
import type { EyeKey, VisionComparison, VisionDay, VisionDelta, VisionTestRow, VisionTypeKey } from '@/types';
import { baseOptions, eyeColor } from '@/utils/charts';
import { formatDate, formatNumber, formatShortDate, signed } from '@/utils/format';

type Option = { value: string; label: string };
type ChartSpec = { type: VisionTypeKey; title: string; description: string; data: ChartData<'line'>; options: ChartOptions<'line'> };

export default defineComponent({
    name: 'VisionIndex',

    components: { AppCard, ChartCanvas, Head, Link, PageHeader, Trash2, VerdictBadge },

    props: {
        comparisons: { type: Array as PropType<VisionComparison[]>, required: true },
        series: { type: Object as PropType<Partial<Record<VisionTypeKey, Partial<Record<EyeKey, VisionDay[]>>>>>, required: true },
        tests: { type: Array as PropType<VisionTestRow[]>, required: true },
        types: { type: Array as PropType<Option[]>, required: true },
        eyes: { type: Array as PropType<Option[]>, required: true },
    },

    data() {
        return {
            tests_: [
                {
                    type: 'acuity',
                    title: 'Letter chart',
                    when: 'every week · 5 min per eye',
                    text: 'Lines of letters, smaller and smaller, like at the eye doctor. The main measure of the lazy eye.',
                    icon: markRaw(Eye) as Component,
                },
                {
                    type: 'reading',
                    title: 'Reading test',
                    when: 'every 2 weeks · 5 min per eye',
                    text: 'How small you can read and how fast — the closest to daily life.',
                    icon: markRaw(BookOpen) as Component,
                },
                {
                    type: 'contrast',
                    title: 'Contrast test',
                    when: 'every month · 3 min per eye',
                    text: 'Letters fainter and fainter. Amblyopia often lowers contrast sensitivity too.',
                    icon: markRaw(Contrast) as Component,
                },
            ],
        };
    },

    computed: {
        charts(): ChartSpec[] {
            const specs: { type: VisionTypeKey; title: string; description: string; unit: string; lowerIsBetter: boolean }[] = [
                { type: 'acuity', title: t('Letter chart over time'), description: t('logMAR per eye (average of the day). Up = better.'), unit: 'logMAR', lowerIsBetter: true },
                { type: 'reading', title: t('Reading acuity over time'), description: t('logMAR per eye (average of the day). Up = better.'), unit: 'logMAR', lowerIsBetter: true },
                { type: 'contrast', title: t('Contrast sensitivity over time'), description: t('logCS per eye (average of the day). Up = better.'), unit: 'logCS', lowerIsBetter: false },
            ];

            return specs
                .filter((s) => Object.values(this.series[s.type] ?? {}).some((days) => (days?.length ?? 0) > 0))
                .map((s) => {
                    const byEye = this.series[s.type] ?? {};
                    const dates = [...new Set(Object.values(byEye).flatMap((days) => (days ?? []).map((d) => d.date)))].sort();
                    const datasets = (['right', 'left', 'both'] as EyeKey[])
                        .filter((eye) => (byEye[eye]?.length ?? 0) > 0)
                        .map((eye) => {
                            const map = new Map((byEye[eye] ?? []).map((d) => [d.date, d.score]));

                            return {
                                label: this.eyeLabel(eye),
                                data: dates.map((date) => map.get(date) ?? null),
                                borderColor: eyeColor(eye),
                                backgroundColor: eyeColor(eye),
                                borderWidth: 2,
                                pointRadius: 4,
                                spanGaps: true,
                                tension: 0.2,
                            };
                        });

                    const options = baseOptions<'line'>((v) => `${formatNumber(v, 2)} ${s.unit}`);
                    options.scales!.y = { ...options.scales!.y, beginAtZero: false, reverse: s.lowerIsBetter };

                    return {
                        type: s.type,
                        title: s.title,
                        description: s.description,
                        data: { labels: dates.map((d) => formatShortDate(d)), datasets },
                        options,
                    };
                });
        },
    },

    methods: {
        formatDate,
        formatNumber,

        typeLabel(type: string): string {
            return this.types.find((o) => o.value === type)?.label ?? type;
        },

        eyeLabel(eye: string): string {
            return this.eyes.find((o) => o.value === eye)?.label ?? eye;
        },

        score(row: VisionComparison, value: number): string {
            return row.type === 'contrast' ? `${formatNumber(value, 2)} logCS` : `${formatNumber(value, 2)} logMAR`;
        },

        deltaText(row: VisionComparison, delta: VisionDelta): string {
            if (row.type === 'contrast') {
                return t(':change logCS', { change: signed(delta.gain, 2) });
            }

            const text = t(':lines lines (:letters letters)', { lines: signed(delta.lines), letters: signed(delta.letters, 0) });

            return delta.speed_change_pct !== undefined
                ? `${text} · ${t('speed :pct%', { pct: `${delta.speed_change_pct > 0 ? '+' : ''}${formatNumber(delta.speed_change_pct)}` })}`
                : text;
        },

        remove(id: number): void {
            if (window.confirm(t('Delete this test? It disappears from the comparisons too.'))) {
                router.delete(`/test-vedere/${id}`, { preserveScroll: true });
            }
        },
    },
});
</script>
