<template>
    <Head :title="$t('Reports')" />

    <PageHeader :title="$t('Reports')" :description="$t('How much you practised, which days you reached the goal and how each exercise evolves.')">
        <a :href="exportUrl" class="flex items-center gap-1.5 rounded-lg border border-line-2 px-3 py-2 text-sm text-fg no-underline hover:border-accent hover:text-accent">
            <Download class="size-4" /> {{ $t('Export CSV (Excel)') }}
        </a>
    </PageHeader>

    <!-- Period -->
    <div class="mb-6 flex flex-wrap items-center gap-2">
        <div class="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-panel p-1" role="group" :aria-label="$t('Period')">
            <button
                v-for="option in periods"
                :key="option.key"
                type="button"
                class="rounded-md px-3 py-1.5 text-sm font-medium"
                :class="period.key === option.key ? 'bg-accent text-accent-ink' : 'text-muted hover:text-fg'"
                @click="go({ perioada: option.key })"
            >
                {{ $t(option.label) }}
            </button>
        </div>
        <label class="flex items-center gap-2 text-sm text-muted">
            {{ $t('Month:') }}
            <input type="month" class="form-control w-auto py-1.5" :value="period.month ?? ''" :max="maxMonth" @change="onMonth" />
        </label>
        <span class="ml-auto text-sm text-muted">{{ period.label }} · {{ formatDate(period.from) }} – {{ formatDate(period.to) }}</span>
    </div>

    <!-- Numbers -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard :label="$t('Total time')" :value="formatDuration(kpis.total_seconds)" :icon="icons.Clock" />
        <StatCard :label="$t('Days with practice')" :value="`${kpis.active_days} / ${kpis.days}`" :icon="icons.CalendarCheck" />
        <StatCard :label="$t('Days with the goal reached')" :value="String(kpis.goal_days)" :hint="$t('goal: :min min / day', { min: report.goal_minutes })" :icon="icons.Target" />
        <StatCard :label="$t('Average per active day')" :value="formatDuration(kpis.avg_active_seconds)" :icon="icons.Gauge" />
        <StatCard :label="$t('Current run')" :value="$t(':days days', { days: kpis.streak })" :hint="$t('best: :days days', { days: kpis.best_streak })" :icon="icons.Flame" />
        <StatCard :label="$t('Patching outside the app')" :value="formatDuration(kpis.patch_minutes * 60)" :icon="icons.EyeOff" />
    </div>

    <!-- Daily time -->
    <AppCard class="mt-4" :title="byWeek ? $t('Minutes per week') : $t('Minutes per day')" :description="$t('By kind of exercise. The dashed line is your daily goal.')">
        <ChartCanvas type="bar" :data="timeData" :options="timeOptions" :height="280" :label="$t('Minutes of practice by kind of exercise')" />
    </AppCard>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <!-- Calendar -->
        <AppCard :title="$t('Calendar')" :description="$t('Every square is a day; the stronger the colour, the more minutes. A ring marks the goal reached.')">
            <div class="overflow-x-auto">
                <div class="inline-grid grid-flow-col gap-1" style="grid-template-rows: repeat(7, minmax(0, 1fr))">
                    <span v-for="n in leadingBlanks" :key="`blank-${n}`" class="size-4" />
                    <span
                        v-for="day in report.daily"
                        :key="day.date"
                        class="size-4 rounded-[3px]"
                        :class="day.goal_met ? 'ring-1 ring-fg/70' : ''"
                        :style="{ background: heat(day.total) }"
                        :title="`${formatDate(day.date)}: ${formatDuration(day.total)}${day.patch_minutes ? ` + ${day.patch_minutes} min ${$t('patching')}` : ''}`"
                    />
                </div>
            </div>
            <div class="mt-3 flex items-center gap-1.5 text-xs text-muted">
                {{ $t('less') }}
                <span v-for="(color, i) in heatSteps" :key="i" class="size-3 rounded-[3px]" :style="{ background: color }" />
                {{ $t('more') }}
            </div>
        </AppCard>

        <!-- Time per exercise -->
        <AppCard :title="$t('Time per exercise')" flush>
            <table v-if="report.per_exercise.length" class="table-base">
                <thead>
                    <tr>
                        <th>{{ $t('Exercise') }}</th>
                        <th class="text-right">{{ $t('Time') }}</th>
                        <th class="text-right">{{ $t('Rounds') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in report.per_exercise" :key="row.slug">
                        <td>
                            <div class="flex items-center gap-2">
                                <span class="size-2.5 shrink-0 rounded-full" :style="{ background: groupColor(row.group) }" />
                                {{ row.title }}
                            </div>
                            <div class="mt-1 h-1.5 rounded-full bg-panel-2">
                                <div class="h-full rounded-full" :style="{ width: `${share(row.seconds)}%`, background: groupColor(row.group) }" />
                            </div>
                        </td>
                        <td class="text-right tabular-nums">{{ formatDuration(row.seconds) }}</td>
                        <td class="text-right tabular-nums">{{ row.rounds }}</td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="p-5 text-sm text-muted">{{ $t('No practice in this period.') }}</p>
        </AppCard>
    </div>

    <!-- Progress of every exercise -->
    <h2 class="mt-10 mb-1 text-lg font-semibold">{{ $t('How each exercise evolves') }}</h2>
    <p class="mb-4 text-sm text-muted">{{ $t('One point per finished round. On every chart, up means better. These are training estimates, not a diagnosis.') }}</p>
    <div v-if="metricCharts.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricChart v-for="chart in metricCharts" :key="chart.key" :title="chart.title" :metric="chart.metric" :results="chart.results" />
    </div>
    <p v-else class="panel p-5 text-sm text-muted">{{ $t('No finished round in this period yet.') }}</p>

    <!-- Vision tests and notes -->
    <div class="mt-10 grid gap-4 lg:grid-cols-2">
        <AppCard :title="$t('Vision tests in this period')" flush>
            <template #actions>
                <Link href="/test-vedere" class="text-sm">{{ $t('Comparison →') }}</Link>
            </template>
            <table v-if="report.vision_tests.length" class="table-base">
                <thead>
                    <tr>
                        <th>{{ $t('Date') }}</th>
                        <th>{{ $t('Test') }}</th>
                        <th>{{ $t('Eye') }}</th>
                        <th class="text-right">{{ $t('Result') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="test in report.vision_tests" :key="test.id">
                        <td class="whitespace-nowrap">{{ formatDate(test.date) }}</td>
                        <td>{{ $t(typeLabels[test.type]) }}</td>
                        <td>{{ $t(eyeLabels[test.eye]) }}</td>
                        <td class="text-right tabular-nums">{{ test.type === 'contrast' ? `${formatNumber(test.score, 2)} logCS` : `${formatNumber(test.score, 2)} logMAR` }}</td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="p-5 text-sm text-muted">{{ $t('No vision test in this period.') }}</p>
        </AppCard>

        <AppCard :title="$t('Journal notes')">
            <ul v-if="notes.length" class="space-y-2 text-sm">
                <li v-for="entry in notes" :key="entry.date" class="border-b border-line/60 pb-2 last:border-0">
                    <span class="text-muted">{{ formatDate(entry.date) }}</span>
                    <span v-if="entry.eye_comfort" class="ml-2 text-xs text-muted">· {{ $t('eyes: :n/5', { n: entry.eye_comfort }) }}</span>
                    <span v-if="entry.patch_minutes" class="ml-2 text-xs text-muted">· {{ $t(':min min patching', { min: entry.patch_minutes }) }}</span>
                    <p v-if="entry.note">{{ entry.note }}</p>
                </li>
            </ul>
            <p v-else class="text-sm text-muted">{{ $t('No notes in this period. You can write one every day on the home page.') }}</p>
        </AppCard>
    </div>
</template>

<script lang="ts">
import { CalendarCheck, Clock, Download, EyeOff, Flame, Gauge, Target } from '@lucide/vue';
import { Head, Link, router } from '@inertiajs/vue3';
import type { ChartData, ChartOptions } from 'chart.js';
import type { PropType } from 'vue';
import { defineComponent, markRaw } from 'vue';
import type { AmbResult } from '@/amb';
import ChartCanvas from '@/components/charts/ChartCanvas.vue';
import MetricChart from '@/components/charts/MetricChart.vue';
import AppCard from '@/components/general/AppCard.vue';
import PageHeader from '@/components/general/PageHeader.vue';
import StatCard from '@/components/general/StatCard.vue';
import { t } from '@/i18n';
import type { VisionTestRow } from '@/types';
import { baseOptions, GROUP_LABELS, GROUP_ORDER, groupColor, heatColors } from '@/utils/charts';
import { formatDate, formatDuration, formatNumber, formatShortDate } from '@/utils/format';
import { cssColor } from '@/utils/theme';
import { METRICS } from '@/utils/metrics';
import type { Metric } from '@/utils/metrics';

type Day = { date: string; total: number; exercises: Record<string, number>; patch_minutes: number; goal_met: boolean };
type PerExercise = { slug: string; title: string; group: string; seconds: number; rounds: number };
type Report = {
    goal_minutes: number;
    kpis: { total_seconds: number; active_days: number; days: number; goal_days: number; avg_active_seconds: number; streak: number; best_streak: number; patch_minutes: number };
    daily: Day[];
    per_exercise: PerExercise[];
    results: Record<string, AmbResult[]>;
    vision_tests: VisionTestRow[];
    journal: { date: string; patch_minutes: number; eye_comfort: number | null; note: string | null }[];
};
type Period = { key: string; label: string; from: string; to: string; month: string | null };

export default defineComponent({
    name: 'ReportsIndex',

    components: { AppCard, ChartCanvas, Download, Head, Link, MetricChart, PageHeader, StatCard },

    props: {
        period: { type: Object as PropType<Period>, required: true },
        report: { type: Object as PropType<Report>, required: true },
        titles: { type: Object as PropType<Record<string, string>>, required: true },
    },

    data() {
        return {
            icons: {
                CalendarCheck: markRaw(CalendarCheck),
                Clock: markRaw(Clock),
                EyeOff: markRaw(EyeOff),
                Flame: markRaw(Flame),
                Gauge: markRaw(Gauge),
                Target: markRaw(Target),
            },
            periods: [
                { key: '7', label: '7 days' },
                { key: '30', label: '30 days' },
                { key: '90', label: '3 months' },
                { key: '365', label: '1 year' },
                { key: 'toate', label: 'All' },
            ],
            typeLabels: { acuity: 'Letter chart', reading: 'Reading test', contrast: 'Contrast test' } as Record<string, string>,
            eyeLabels: { right: 'Right eye', left: 'Left eye', both: 'Both eyes' } as Record<string, string>,
        };
    },

    computed: {
        kpis(): Report['kpis'] {
            return this.report.kpis;
        },

        exportUrl(): string {
            const query = this.period.key === 'luna' && this.period.month ? `luna=${this.period.month}` : `perioada=${this.period.key}`;

            return `/rapoarte/export?${query}`;
        },

        maxMonth(): string {
            return new Date().toISOString().slice(0, 7);
        },

        /** Long periods are shown per week (a bar per day would be too thin). */
        byWeek(): boolean {
            return this.report.daily.length > 92;
        },

        groupOf(): Record<string, string> {
            const map: Record<string, string> = { 'test-vedere': 'test' };

            for (const row of this.report.per_exercise) {
                map[row.slug] = row.group === 'setup' ? 'mono' : row.group;
            }

            return map;
        },

        /** Minutes per day (or week) and group, plus patching. */
        buckets(): { label: string; days: number; values: Record<string, number> }[] {
            const out: { label: string; days: number; values: Record<string, number> }[] = [];

            this.report.daily.forEach((day, index) => {
                if (!this.byWeek || index % 7 === 0) {
                    out.push({ label: formatShortDate(day.date), days: 0, values: {} });
                }

                const bucket = out[out.length - 1];
                bucket.days++;

                for (const [slug, seconds] of Object.entries(day.exercises)) {
                    const group = this.groupOf[slug] ?? 'mono';
                    bucket.values[group] = (bucket.values[group] ?? 0) + seconds / 60;
                }

                bucket.values.patch = (bucket.values.patch ?? 0) + day.patch_minutes;
            });

            return out;
        },

        timeData(): ChartData<'bar'> {
            const used = GROUP_ORDER.filter((g) => this.buckets.some((b) => (b.values[g] ?? 0) > 0));

            return {
                labels: this.buckets.map((b) => b.label),
                datasets: (used.length ? used : (['dichoptic'] as const)).map((group) => ({
                    label: t(GROUP_LABELS[group]),
                    data: this.buckets.map((b) => Math.round((b.values[group] ?? 0) * 10) / 10),
                    backgroundColor: groupColor(group),
                    borderColor: cssColor('--color-panel', '#fff'),
                    borderWidth: { top: 2 },
                    borderRadius: 3,
                    maxBarThickness: 32,
                    stack: 'time',
                })),
            };
        },

        timeOptions(): ChartOptions<'bar'> {
            const options = baseOptions<'bar'>((v) => `${formatNumber(v)} min`);
            options.scales!.x = { ...options.scales!.x, stacked: true };
            options.scales!.y = {
                ...options.scales!.y,
                stacked: true,
                suggestedMax: this.byWeek ? undefined : Math.ceil(this.report.goal_minutes * 1.15),
                ticks: { precision: 0, callback: (v) => `${formatNumber(Number(v))} min` },
            };
            options.plugins = {
                ...options.plugins,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...({ goalLine: { value: this.byWeek ? 0 : this.report.goal_minutes } } as any),
            };

            return options;
        },

        /** Empty squares before the first day, so the calendar rows are Monday … Sunday. */
        leadingBlanks(): number {
            const first = this.report.daily[0]?.date;

            if (!first) {
                return 0;
            }

            const [y, m, d] = first.split('-').map(Number);

            return (new Date(y, m - 1, d).getDay() + 6) % 7;
        },

        totalSeconds(): number {
            return Math.max(1, ...this.report.per_exercise.map((r) => r.seconds));
        },

        metricCharts(): { key: string; title: string; metric: Metric; results: AmbResult[] }[] {
            const order = ['litera-e', 'contrast', 'vernier', 'inel', 'citire', 'relief', 'convergenta', 'fara-ecran', 'tetris', 'breakout', 'sarpe', 'balance'];

            return order
                .map((key) => ({
                    key,
                    title: this.titles[key] ?? key,
                    metric: METRICS[key],
                    results: this.report.results[key] ?? [],
                }))
                .filter((c) => c.metric && c.results.some((r) => c.metric.value(r) !== null));
        },

        /** Calendar colours of the current theme (sequential blue). */
        heatSteps(): string[] {
            return heatColors();
        },

        notes(): Report['journal'] {
            return [...this.report.journal].filter((j) => j.note || j.patch_minutes || j.eye_comfort).reverse();
        },
    },

    methods: {
        formatDate,
        formatDuration,
        formatNumber,

        go(query: Record<string, string>): void {
            router.get('/rapoarte', query, { preserveScroll: true });
        },

        onMonth(event: Event): void {
            const value = (event.target as HTMLInputElement).value;

            if (value) {
                this.go({ luna: value });
            }
        },

        groupColor(group: string): string {
            return groupColor(group);
        },

        share(seconds: number): number {
            return Math.round((seconds / this.totalSeconds) * 100);
        },

        heat(seconds: number): string {
            const goal = this.report.goal_minutes * 60;

            if (seconds <= 0) {
                return this.heatSteps[0];
            }

            const level = Math.min(4, 1 + Math.floor((seconds / Math.max(goal, 60)) * 3));

            return this.heatSteps[level];
        },
    },
});
</script>
