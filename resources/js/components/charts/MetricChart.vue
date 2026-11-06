<template>
    <div class="panel p-4">
        <div class="mb-1 flex items-start justify-between gap-2">
            <div class="min-w-0">
                <h3 class="font-semibold">{{ title }}</h3>
                <p class="text-xs text-muted">
                    {{ $t(metric.label) }} ·
                    {{ metric.lowerIsBetter ? $t('lower is better (up on the chart = better)') : $t('higher is better') }}
                </p>
            </div>
            <div class="text-right">
                <p class="text-lg font-semibold tabular-nums">{{ lastText }}</p>
                <p class="text-xs text-muted">{{ $t(':count results', { count: points.length }) }}</p>
            </div>
        </div>
        <ChartCanvas
            type="line"
            :data="data"
            :options="options"
            :height="150"
            :label="`${title}: ${$t(metric.label)}`"
        />
    </div>
</template>

<script lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import type { AmbResult } from '@/amb';
import ChartCanvas from '@/components/charts/ChartCanvas.vue';
import { baseOptions, series } from '@/utils/charts';
import { formatNumber, formatShortDate } from '@/utils/format';
import type { Metric } from '@/utils/metrics';

/** Line chart of one exercise's measured value over time (one point per result). */
export default defineComponent({
    name: 'MetricChart',

    components: { ChartCanvas },

    props: {
        title: { type: String, required: true },
        metric: { type: Object as PropType<Metric>, required: true },
        results: { type: Array as PropType<AmbResult[]>, required: true },
    },

    computed: {
        points(): { date: string; value: number }[] {
            return this.results
                .map((r) => ({ date: r.d, value: this.metric.value(r) }))
                .filter((p): p is { date: string; value: number } => p.value !== null);
        },

        lastText(): string {
            const last = this.points[this.points.length - 1];

            return last ? this.format(last.value) : '—';
        },

        data(): ChartData<'line'> {
            return {
                labels: this.points.map((p) => formatShortDate(p.date)),
                datasets: [
                    {
                        label: this.$t(this.metric.label),
                        data: this.points.map((p) => p.value),
                        borderColor: series(0),
                        backgroundColor: series(0),
                        borderWidth: 2,
                        pointRadius: this.points.length > 40 ? 0 : 3,
                        pointHoverRadius: 5,
                        tension: 0.25,
                    },
                ],
            };
        },

        options(): ChartOptions<'line'> {
            const options = baseOptions<'line'>((v) => this.format(v));
            options.plugins = { ...options.plugins, legend: { display: false } };
            options.scales!.y = {
                ...options.scales!.y,
                beginAtZero: false,
                reverse: this.metric.lowerIsBetter,
            };

            return options;
        },
    },

    methods: {
        format(value: number): string {
            return `${formatNumber(value, this.metric.decimals)}${this.metric.unit}`;
        },
    },
});
</script>
