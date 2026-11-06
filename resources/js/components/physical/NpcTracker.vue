<template>
    <div class="rounded-lg border border-line bg-panel-2 p-4">
        <h4 class="font-semibold">{{ $t('Measure your near point of convergence') }}</h4>
        <p class="mt-1 text-sm text-muted">
            {{
                $t(
                    'Write the distance from the pencil to the bridge of your nose (usual value of 3 tries).',
                )
            }}
        </p>

        <form class="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" @submit.prevent="save">
            <div>
                <label class="form-label" for="npc-break">{{ $t('It doubled at (cm)') }}</label>
                <input
                    id="npc-break"
                    v-model.number="breakCm"
                    type="number"
                    inputmode="decimal"
                    min="0.5"
                    max="60"
                    step="0.5"
                    required
                    class="form-control"
                />
            </div>
            <div>
                <label class="form-label" for="npc-rec">
                    {{ $t('Single again at (cm, optional)') }}
                </label>
                <input
                    id="npc-rec"
                    v-model.number="recoveryCm"
                    type="number"
                    inputmode="decimal"
                    min="0.5"
                    max="80"
                    step="0.5"
                    class="form-control"
                />
            </div>
            <button
                type="submit"
                class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110"
            >
                {{ $t('Save the measurement') }}
            </button>
        </form>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <p v-if="saved" class="mt-2 text-sm font-medium text-good" role="status">
            {{ $t('Saved.') }}
        </p>

        <div v-if="latest" class="mt-4 rounded-lg border p-3 text-sm" :class="latest.break_cm >= LIMIT ? 'border-warn/50 bg-warn/10' : 'border-good/40 bg-good/10'">
            <p class="font-medium">
                {{ $t('Last measurement (:date): doubled at :cm cm.', { date: formatDate(latest.d), cm: fmt(latest.break_cm) }) }}
                <template v-if="latest.recovery_cm">
                    {{ $t('Single again at :cm cm.', { cm: fmt(latest.recovery_cm) }) }}
                </template>
            </p>
            <p class="mt-1 text-muted">
                {{
                    latest.break_cm >= LIMIT
                        ? $t('That is 6 cm or more: in the CITT trial this counted as a receded near point of convergence. It is not a diagnosis – show it to the eye doctor.')
                        : $t('Under 6 cm: within the usual range by the CITT criterion.')
                }}
            </p>
        </div>

        <div v-if="points.length" class="mt-4">
            <div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <p class="text-sm font-medium">{{ $t('Break point over time') }}</p>
                <p class="text-xs text-muted">
                    {{ $t('lower is better (up on the chart = better)') }}
                </p>
            </div>
            <ChartCanvas
                type="line"
                :data="chartData"
                :options="chartOptions"
                :height="170"
                :label="$t('Break point over time')"
            />
            <p v-if="best !== null" class="mt-2 text-xs text-muted">
                {{ $t('Best: :cm cm · measurements: :n', { cm: fmt(best), n: points.length }) }}
            </p>
        </div>
        <p v-else class="mt-4 text-sm text-muted">
            {{ $t('No measurement yet. Your history will appear here as a chart.') }}
        </p>
    </div>
</template>

<script lang="ts">
import { Chart } from 'chart.js';
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import type { AmbResult } from '@/amb';
import ChartCanvas from '@/components/charts/ChartCanvas.vue';
import { t } from '@/i18n';
import { baseOptions, series } from '@/utils/charts';
import { formatDate, formatNumber, formatShortDate } from '@/utils/format';
import { cssColor } from '@/utils/theme';

const ID = 'fara-ecran';
/** CITT: a near point of convergence break of 6 cm or more counts as receded. */
const LIMIT = 6;

/** Dashed reference line (options.plugins.npcReference.value / .label). */
const npcReference: Plugin = {
    id: 'npcReference',
    afterDatasetsDraw(chart, _args, options) {
        const o = options as { value?: number; label?: string };
        const y = chart.scales.y;

        if (!o.value || !y) {
            return;
        }

        const pixel = y.getPixelForValue(o.value);
        const { left, right, top, bottom } = chart.chartArea;

        if (pixel < top || pixel > bottom) {
            return;
        }

        const ctx = chart.ctx;
        const color = cssColor('--color-warn', '#a35f00');
        ctx.save();
        ctx.strokeStyle = color;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(left, pixel);
        ctx.lineTo(right, pixel);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = "11px 'Instrument Sans', sans-serif";
        ctx.textAlign = 'right';
        ctx.fillText(o.label ?? '', right, pixel - 4);
        ctx.restore();
    },
};

let pluginRegistered = false;

/** Pencil push-ups: near point of convergence (break / recovery in cm) with history. */
export default defineComponent({
    name: 'NpcTracker',

    components: { ChartCanvas },

    data() {
        return {
            LIMIT,
            breakCm: null as number | null,
            recoveryCm: null as number | null,
            error: '',
            saved: false,
            list: [] as AmbResult[],
        };
    },

    computed: {
        points(): AmbResult[] {
            return this.list.filter(
                (r) => r.kind === 'npc' && typeof r.break_cm === 'number',
            );
        },

        latest(): AmbResult | null {
            return this.points[this.points.length - 1] ?? null;
        },

        best(): number | null {
            return this.points.length
                ? Math.min(...this.points.map((r) => r.break_cm as number))
                : null;
        },

        chartData(): ChartData<'line'> {
            const shown = this.points.slice(-60);

            return {
                labels: shown.map((r) => formatShortDate(r.d)),
                datasets: [
                    {
                        label: t('It doubled at (cm)'),
                        data: shown.map((r) => r.break_cm as number),
                        borderColor: series(0),
                        backgroundColor: series(0),
                        borderWidth: 2,
                        pointRadius: shown.length > 40 ? 0 : 3,
                        pointHoverRadius: 5,
                        tension: 0.25,
                    },
                ],
            };
        },

        chartOptions(): ChartOptions {
            const options = baseOptions<'line'>((v) => `${this.fmt(v)} cm`);
            const values = this.points.map((r) => r.break_cm as number);
            options.plugins = {
                ...options.plugins,
                legend: { display: false },
            };
            (options.plugins as Record<string, unknown>).npcReference = {
                value: LIMIT,
                label: t('6 cm – CITT reference'),
            };
            options.scales!.y = {
                ...options.scales!.y,
                beginAtZero: true,
                reverse: true,
                suggestedMax: Math.max(10, ...values) + 1,
            };

            return options as ChartOptions;
        },
    },

    created() {
        if (!pluginRegistered) {
            Chart.register(npcReference);
            pluginRegistered = true;
        }

        this.list = Amb.results(ID);
    },

    methods: {
        fmt(value: number): string {
            return formatNumber(value, Number.isInteger(value) ? 0 : 1);
        },

        formatDate,

        save(): void {
            this.saved = false;
            this.error = '';
            const brk = Number(this.breakCm);
            const rec =
                this.recoveryCm === null || (this.recoveryCm as unknown) === ''
                    ? null
                    : Number(this.recoveryCm);

            if (!Number.isFinite(brk) || brk <= 0 || brk > 60) {
                this.error = t('Write the break point in cm (between 0.5 and 60).');

                return;
            }

            if (rec !== null && (!Number.isFinite(rec) || rec <= 0 || rec > 80)) {
                this.error = t('Write the recovery point in cm (between 0.5 and 80), or leave it empty.');

                return;
            }

            if (rec !== null && rec < brk) {
                this.error = t('The recovery point is usually further away than the break point (a larger number). Check the two values.');

                return;
            }

            const data: Record<string, unknown> = {
                kind: 'npc',
                break_cm: Math.round(brk * 10) / 10,
            };

            if (rec !== null) {
                data.recovery_cm = Math.round(rec * 10) / 10;
            }

            Amb.saveResult(ID, data);
            this.list = Amb.results(ID);
            this.breakCm = null;
            this.recoveryCm = null;
            this.saved = true;
        },
    },
});
</script>
