<template>
    <div class="rounded-lg border border-line bg-panel-2 p-3">
        <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-medium">{{ $t('Timer') }}</p>
            <p
                class="text-2xl font-semibold tabular-nums"
                :aria-label="$t('Time left')"
            >
                {{ display }}
            </p>
        </div>

        <div
            v-if="!active && options.length > 1"
            class="mt-2 flex flex-wrap gap-1.5"
            role="group"
            :aria-label="$t('Length')"
        >
            <button
                v-for="s in options"
                :key="s"
                type="button"
                class="rounded-md border px-2.5 py-1 text-xs font-semibold transition"
                :class="
                    s === chosen
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'border-line-2 text-muted hover:text-fg'
                "
                :aria-pressed="s === chosen"
                @click="chosen = s"
            >
                {{ lengthLabel(s) }}
            </button>
        </div>

        <div
            class="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            :aria-valuenow="Math.round(progress)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="$t('Progress')"
        >
            <div
                class="h-full rounded-full bg-accent transition-[width]"
                :style="{ width: `${progress}%` }"
            />
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
            <button
                v-if="!active"
                type="button"
                :class="primaryClass"
                @click="start"
            >
                {{ $t('Start the timer') }}
            </button>
            <template v-else-if="!state.finished">
                <button
                    v-if="state.running"
                    type="button"
                    :class="secondaryClass"
                    @click="pause"
                >
                    {{ $t('Pause') }}
                </button>
                <button
                    v-else
                    type="button"
                    :class="primaryClass"
                    @click="resume"
                >
                    {{ $t('Continue') }}
                </button>
                <button type="button" :class="secondaryClass" @click="stop">
                    {{ $t('Stop') }}
                </button>
            </template>
            <template v-else>
                <button type="button" :class="primaryClass" @click="start">
                    {{ $t('Once more') }}
                </button>
                <button type="button" :class="secondaryClass" @click="stop">
                    {{ $t('Close') }}
                </button>
            </template>
        </div>

        <p
            v-if="active && state.finished"
            class="mt-2 text-sm font-medium text-good"
            role="status"
        >
            {{ $t('Done! Time is up.') }}
        </p>
        <p
            v-if="active && state.interrupted"
            class="mt-2 text-sm text-warn"
            role="status"
        >
            {{
                $t(
                    'The timer paused because the page was hidden or a break started. Press “Continue” when you are ready.',
                )
            }}
        </p>
        <p class="mt-2 text-xs text-muted">
            {{ note }}
        </p>
    </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import {
    pauseTimer,
    resumeTimer,
    startTimer,
    stopTimer,
    timer,
} from '@/components/physical/timer';

/** Countdown for one exercise card (only one timer runs on the page at a time). */
export default defineComponent({
    name: 'PhysicalTimer',

    props: {
        exerciseKey: { type: String, required: true },
        /** Lengths in seconds; the first one is the suggested one. */
        options: { type: Array as PropType<number[]>, required: true },
        /** Counts as practice time in the daily progress. */
        tracked: { type: Boolean, default: true },
    },

    data() {
        return {
            chosen: this.options[0] ?? 300,
            state: timer,
            primaryClass:
                'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110',
            secondaryClass:
                'rounded-lg border border-line-2 bg-panel px-4 py-2 text-sm font-semibold text-fg hover:bg-hover',
        };
    },

    computed: {
        active(): boolean {
            return this.state.key === this.exerciseKey;
        },

        remaining(): number {
            return this.active
                ? Math.max(0, this.state.total - this.state.elapsed)
                : this.chosen;
        },

        progress(): number {
            return this.active && this.state.total
                ? Math.min(100, (this.state.elapsed / this.state.total) * 100)
                : 0;
        },

        display(): string {
            const s = Math.ceil(this.remaining);
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = String(s % 60).padStart(2, '0');

            return h
                ? `${h}:${String(m).padStart(2, '0')}:${sec}`
                : `${m}:${sec}`;
        },

        note(): string {
            return this.tracked
                ? this.$t('While the timer runs, the minutes count in today’s progress. Keep this page open.')
                : this.$t('This timer does not count as practice time in the app.');
        },
    },

    methods: {
        lengthLabel(seconds: number): string {
            if (seconds < 60) {
                return `${seconds} s`;
            }

            const h = Math.floor(seconds / 3600);
            const m = Math.round((seconds % 3600) / 60);

            if (!h) {
                return `${m} min`;
            }

            return m ? `${h} h ${m} min` : `${h} h`;
        },

        start(): void {
            startTimer(this.exerciseKey, this.chosen, this.tracked);
        },

        pause(): void {
            pauseTimer();
        },

        resume(): void {
            resumeTimer();
        },

        stop(): void {
            stopTimer();
        },
    },
});
</script>
