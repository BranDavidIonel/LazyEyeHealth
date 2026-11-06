<template>
    <Head :title="$t('Home')" />

    <PageHeader :title="greeting" :description="$t('Your vision training: today, this week and how your eyes are doing.')">
        <span class="text-sm text-muted">{{ todayLabel }}</span>
    </PageHeader>

    <!-- First time: calibration -->
    <div
        v-if="!calibrated"
        class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/10 p-4"
    >
        <p class="max-w-2xl text-sm">
            <b>{{ $t('Step 1: the calibration') }}</b>
            {{ $t('(5 minutes, only once). You choose the lazy eye, check the glasses, take the fusion test and find the balance between the eyes.') }}
        </p>
        <Link href="/calibrare" class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink no-underline hover:brightness-110">
            {{ $t('Start the calibration') }}
        </Link>
    </div>

    <div class="grid gap-4 lg:grid-cols-5">
        <!-- Today -->
        <AppCard :title="$t('Today')" class="lg:col-span-2">
            <div class="flex items-center gap-5">
                <ProgressRing
                    :value="todayMinutes"
                    :max="today.goal_minutes"
                    :caption="$t('of :goal min', { goal: today.goal_minutes })"
                />
                <div class="space-y-2 text-sm">
                    <p>{{ todayMessage }}</p>
                    <p class="text-muted">
                        <Flame class="mr-1 inline size-4 text-warn" />
                        {{ streakMessage }}
                    </p>
                    <p v-if="bestStreak > 1" class="text-xs text-muted">
                        {{ $t('Your best run: :days days in a row.', { days: bestStreak }) }}
                    </p>
                </div>
            </div>
        </AppCard>

        <!-- Last 14 days -->
        <AppCard :title="$t('Last 14 days')" :description="$t('Minutes of practice per day')" class="lg:col-span-3">
            <template #actions>
                <Link href="/rapoarte" class="text-sm">{{ $t('All reports →') }}</Link>
            </template>
            <ChartCanvas type="bar" :data="chartData" :options="chartOptions" :height="190" :label="$t('Minutes of practice per day, last 14 days')" />
        </AppCard>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-5">
        <!-- Today's program -->
        <AppCard :title="$t(`Today's program`)" :description="$t('It changes every day so you train everything. Breaks every 20 minutes.')" class="lg:col-span-3">
            <ol class="space-y-2.5">
                <li
                    v-for="(step, index) in plan"
                    :key="step.url"
                    class="flex items-center gap-3 rounded-lg border border-line bg-panel-2/60 p-3"
                >
                    <span
                        class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                        :class="step.done ? 'bg-good/20 text-good' : 'bg-line text-muted'"
                    >
                        <Check v-if="step.done" class="size-4" />
                        <template v-else>{{ index + 1 }}</template>
                    </span>
                    <div class="min-w-0 flex-1">
                        <p class="font-medium">
                            {{ step.title }}
                            <span class="ml-1 text-xs font-normal text-muted">{{ step.minutes }}</span>
                        </p>
                        <p class="text-xs text-muted">{{ step.text }}</p>
                    </div>
                    <Link
                        :href="step.url"
                        class="shrink-0 rounded-md border border-line-2 px-3 py-1.5 text-sm text-fg no-underline hover:border-accent hover:text-accent"
                    >
                        {{ step.done ? $t('Again') : $t('Start') }}
                    </Link>
                </li>
            </ol>
        </AppCard>

        <!-- Vision -->
        <AppCard :title="$t('How your eyes are doing')" :description="$t('Latest vision tests compared with one month before.')" class="lg:col-span-2">
            <template #actions>
                <Link href="/test-vedere" class="text-sm">{{ $t('Vision tests →') }}</Link>
            </template>
            <div v-if="visionRows.length" class="space-y-3">
                <div v-for="row in visionRows" :key="`${row.type}-${row.eye}`" class="rounded-lg border border-line bg-panel-2/60 p-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <p class="text-sm font-medium">{{ row.eye_label }} · <span class="text-muted">{{ row.type_label }}</span></p>
                        <VerdictBadge v-if="row.month" :verdict="row.month.verdict" />
                    </div>
                    <p class="mt-1 text-sm">
                        <b class="tabular-nums">{{ scoreText(row) }}</b>
                        <span class="text-muted"> · {{ formatDate(row.latest.date) }}</span>
                    </p>
                    <p v-if="row.month" class="mt-0.5 text-xs text-muted">
                        {{ deltaText(row) }}
                    </p>
                    <p v-else class="mt-0.5 text-xs text-muted">
                        {{ $t('No test from a month ago yet: the comparison appears after about 3–4 weeks.') }}
                    </p>
                </div>
            </div>
            <div v-else class="text-sm text-muted">
                <p class="mb-3">{{ $t('No vision test yet. The first test is your starting point: after a month you can see if the exercises really help.') }}</p>
                <Link href="/test-vedere/acuity" class="inline-block rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink no-underline">
                    {{ $t('Take the first test') }}
                </Link>
            </div>
        </AppCard>
    </div>

    <!-- Journal -->
    <AppCard class="mt-4" :title="$t(`Today's journal`)" :description="$t('Patching outside the app (reading, puzzles, work) also counts. A short note helps you remember how your eyes felt.')">
        <form class="grid gap-4 md:grid-cols-[10rem_14rem_1fr_auto] md:items-end" @submit.prevent="saveJournal">
            <div>
                <label class="form-label" for="patch">{{ $t('Patching (min)') }}</label>
                <input id="patch" v-model.number="journalForm.patch_minutes" type="number" min="0" max="1440" class="form-control" />
            </div>
            <div>
                <span class="form-label">{{ $t('How did your eyes feel?') }}</span>
                <div class="flex gap-1" role="group" :aria-label="$t('How did your eyes feel?')">
                    <button
                        v-for="n in 5"
                        :key="n"
                        type="button"
                        class="size-9 rounded-md border text-sm font-semibold"
                        :class="journalForm.eye_comfort === n ? 'border-accent bg-accent/20 text-accent' : 'border-line-2 text-muted hover:text-fg'"
                        :title="$t(comfortLabels[n - 1])"
                        @click="journalForm.eye_comfort = journalForm.eye_comfort === n ? null : n"
                    >
                        {{ n }}
                    </button>
                </div>
            </div>
            <div>
                <label class="form-label" for="note">{{ $t('Note') }}</label>
                <input id="note" v-model="journalForm.note" type="text" maxlength="2000" class="form-control" :placeholder="$t('e.g. tired eyes in the evening, saw double once')" />
            </div>
            <button type="submit" class="h-[38px] rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink hover:brightness-110 disabled:opacity-60" :disabled="saving">
                {{ $t('Save') }}
            </button>
        </form>
        <p v-if="journalError" class="form-error">{{ journalError }}</p>
    </AppCard>

    <!-- Exercises -->
    <div class="mt-10">
        <ExerciseGrid :exercises="exercises" :summaries="summaries" />
    </div>

    <p class="mt-10 text-xs text-muted">
        {{ $t('The exercises complement the treatment prescribed by your eye doctor, they do not replace it. Stop if you get double vision, a headache or dizziness.') }}
    </p>
</template>

<script lang="ts">
import { Check, Flame } from '@lucide/vue';
import { Head, Link, router } from '@inertiajs/vue3';
import type { ChartData, ChartOptions } from 'chart.js';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import ChartCanvas from '@/components/charts/ChartCanvas.vue';
import ExerciseGrid from '@/components/exercise/ExerciseGrid.vue';
import AppCard from '@/components/general/AppCard.vue';
import PageHeader from '@/components/general/PageHeader.vue';
import ProgressRing from '@/components/general/ProgressRing.vue';
import VerdictBadge from '@/components/vision/VerdictBadge.vue';
import { t } from '@/i18n';
import type { ExerciseMeta, VisionComparison } from '@/types';
import { baseOptions, series } from '@/utils/charts';
import type { ExerciseSummary } from '@/utils/exerciseStats';
import { formatDate, formatNumber, formatVisionPercent, signed, weekdayShort } from '@/utils/format';

type PlanStep = { kind: string; slug: string | null; title: string; text: string; minutes: string; done: boolean; url: string };
type Journal = { date: string; patch_minutes: number; eye_comfort: number | null; note: string | null };

export default defineComponent({
    name: 'DashboardPage',

    components: { AppCard, ChartCanvas, Check, ExerciseGrid, Flame, Head, Link, PageHeader, ProgressRing, VerdictBadge },

    props: {
        today: { type: Object as PropType<{ date: string; seconds: number; goal_minutes: number }>, required: true },
        streak: { type: Number, required: true },
        bestStreak: { type: Number, required: true },
        lastDays: { type: Array as PropType<{ date: string; total: number }[]>, required: true },
        plan: { type: Array as PropType<PlanStep[]>, required: true },
        exercises: { type: Array as PropType<ExerciseMeta[]>, required: true },
        summaries: { type: Object as PropType<Record<string, ExerciseSummary>>, required: true },
        vision: { type: Array as PropType<VisionComparison[]>, required: true },
        journal: { type: Object as PropType<Journal | null>, default: null },
    },

    data() {
        return {
            saving: false,
            journalForm: {
                patch_minutes: this.journal?.patch_minutes ?? 0,
                eye_comfort: this.journal?.eye_comfort ?? null,
                note: this.journal?.note ?? '',
            },
            comfortLabels: ['Very tired, painful', 'Tired', 'Normal', 'Good', 'Very good, rested'],
        };
    },

    computed: {
        greeting(): string {
            const hour = new Date().getHours();

            return hour < 12 ? t('Good morning!') : hour < 18 ? t('Good afternoon!') : t('Good evening!');
        },

        todayLabel(): string {
            return formatDate(this.today.date);
        },

        calibrated(): boolean {
            return !!this.$page.props.settings?.calibrated;
        },

        todayMinutes(): number {
            return Math.floor(Math.max(this.today.seconds, Amb.todaySeconds()) / 60);
        },

        todayMessage(): string {
            const left = this.today.goal_minutes - this.todayMinutes;

            if (this.todayMinutes === 0) {
                return t('You have not practised today yet. Start with the first step of the program below.');
            }

            return left > 0
                ? t('Well started! :min more minutes to the daily goal.', { min: left })
                : t('Goal reached today. Well done! You can stop here, rest matters too.');
        },

        streakMessage(): string {
            return this.streak > 0
                ? t(':days days in a row with at least 5 minutes.', { days: this.streak })
                : t('Practise at least 5 minutes a day to start a run of days.');
        },

        chartData(): ChartData<'bar'> {
            return {
                labels: this.lastDays.map((d) => `${weekdayShort(d.date)} ${Number(d.date.slice(8, 10))}`),
                datasets: [
                    {
                        label: t('Minutes'),
                        data: this.lastDays.map((d) => Math.round(d.total / 60)),
                        backgroundColor: this.lastDays.map((d) =>
                            d.total / 60 >= this.today.goal_minutes ? series(0) : `${series(0)}80`,
                        ),
                        borderRadius: 4,
                        maxBarThickness: 28,
                    },
                ],
            };
        },

        chartOptions(): ChartOptions<'bar'> {
            const options = baseOptions<'bar'>((v) => `${formatNumber(v)} min`);
            options.scales!.y = {
                ...options.scales!.y,
                suggestedMax: Math.ceil(this.today.goal_minutes * 1.15),
                ticks: { precision: 0, callback: (v) => `${formatNumber(Number(v))} min` },
            };
            options.plugins = {
                ...options.plugins,
                legend: { display: false },
                goalLine: { value: this.today.goal_minutes },
            };

            return options;
        },

        visionRows(): VisionComparison[] {
            // Letter chart first: lazy eye, good eye, both; then one row of every other test.
            return this.vision.filter((c) => c.type === 'acuity').concat(this.vision.filter((c) => c.type !== 'acuity')).slice(0, 4);
        },

        journalError(): string {
            const errors = this.$page.props.errors as Record<string, string> | undefined;

            return errors ? Object.values(errors)[0] ?? '' : '';
        },
    },

    methods: {
        formatDate,

        scoreText(row: VisionComparison): string {
            if (row.type === 'contrast') {
                return t(':value logCS', { value: formatNumber(row.latest.score, 2) });
            }

            return t(':percent of normal vision · :logmar logMAR', {
                percent: formatVisionPercent(row.latest.score),
                logmar: formatNumber(row.latest.score, 2),
            });
        },

        deltaText(row: VisionComparison): string {
            const month = row.month!;
            const days = row.baseline?.gap ?? 30;

            if (row.type === 'contrast') {
                return t(':change logCS compared with :days days ago', { change: signed(month.gain, 2), days });
            }

            const text = t(':lines lines (:letters letters) compared with :days days ago', {
                lines: signed(month.lines),
                letters: signed(month.letters, 0),
                days,
            });

            return row.baseline ? `${text} · ${formatVisionPercent(row.baseline.score)} → ${formatVisionPercent(row.latest.score)}` : text;
        },

        saveJournal(): void {
            this.saving = true;
            router.put('/jurnal', { ...this.journalForm, date: this.today.date }, {
                preserveScroll: true,
                onFinish: () => {
                    this.saving = false;
                },
            });
        },
    },
});
</script>
