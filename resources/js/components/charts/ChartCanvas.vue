<template>
    <div class="relative" :style="{ height: `${height}px` }">
        <canvas ref="canvas" role="img" :aria-label="label" />
    </div>
</template>

<script lang="ts">
import { Chart } from 'chart.js';
import type { ChartData, ChartOptions, ChartType } from 'chart.js';
import type { PropType } from 'vue';
import { defineComponent, markRaw, toRaw } from 'vue';
import '@/utils/charts';

/** Chart.js changes the data it gets: give it a copy without Vue proxies. */
function plainCopy<T>(value: T): T {
    try {
        return structuredClone(toRaw(value));
    } catch {
        return JSON.parse(JSON.stringify(value)) as T;
    }
}

/** Thin Chart.js wrapper: redraws when data/options change, destroyed with the component. */
export default defineComponent({
    name: 'ChartCanvas',

    props: {
        type: { type: String as PropType<ChartType>, required: true },
        data: { type: Object as PropType<ChartData>, required: true },
        options: {
            type: Object as PropType<ChartOptions>,
            default: () => ({}),
        },
        height: { type: Number, default: 260 },
        /** Text for screen readers. */
        label: { type: String, default: '' },
    },

    data() {
        return {
            chart: null as Chart | null,
        };
    },

    watch: {
        data: {
            deep: true,
            handler() {
                this.redraw();
            },
        },

        options: {
            deep: true,
            handler() {
                this.redraw();
            },
        },
    },

    mounted() {
        this.chart = markRaw(
            new Chart(this.$refs.canvas as HTMLCanvasElement, {
                type: this.type,
                data: plainCopy(this.data),
                options: toRaw(this.options),
            }),
        );
    },

    beforeUnmount() {
        this.chart?.destroy();
        this.chart = null;
    },

    methods: {
        redraw(): void {
            if (!this.chart) {
                return;
            }

            this.chart.data = plainCopy(this.data);
            this.chart.options = toRaw(this.options);
            this.chart.update();
        },
    },
});
</script>
