<template>
    <div class="relative size-32 shrink-0">
        <svg
            class="-rotate-90"
            width="128"
            height="128"
            viewBox="0 0 128 128"
            aria-hidden="true"
        >
            <circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke="var(--color-line)"
                stroke-width="12"
            />
            <circle
                v-if="value > 0"
                cx="64"
                cy="64"
                r="54"
                fill="none"
                :stroke="done ? 'var(--color-good)' : 'var(--color-accent)'"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="offset"
                class="transition-[stroke-dashoffset] duration-500"
            />
        </svg>
        <div
            class="absolute inset-0 grid place-items-center text-center leading-tight"
        >
            <div>
                <b class="block text-3xl tabular-nums">{{ value }}</b>
                <span class="text-xs text-muted">{{ caption }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/** Round progress bar (today's minutes out of the goal). */
export default defineComponent({
    name: 'ProgressRing',

    props: {
        value: { type: Number, required: true },
        max: { type: Number, required: true },
        caption: { type: String, default: '' },
    },

    computed: {
        circumference(): number {
            return 2 * Math.PI * 54;
        },

        done(): boolean {
            return this.value >= this.max;
        },

        offset(): number {
            const part = this.max > 0 ? Math.min(1, this.value / this.max) : 0;

            return this.circumference * (1 - part);
        },
    },
});
</script>
