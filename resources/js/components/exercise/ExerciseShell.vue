<template>
    <div class="amb min-h-screen bg-ink">
        <header
            class="flex flex-wrap items-center gap-3 border-b border-line bg-[#0b0e12] px-4 py-2.5"
        >
            <Link :href="homeUrl" class="btn ghost small">← Meniu</Link>
            <h1 class="m-0 min-w-40 flex-1 text-lg font-semibold">
                {{ exercise.title }}
            </h1>
            <div class="flex flex-wrap gap-2">
                <Link
                    :href="settingsUrl"
                    class="pill hover:text-fg"
                    title="Schimbă ochiul leneș sau modul de lucru"
                >
                    {{ mode }}
                </Link>
                <span class="pill" title="Timp de exercițiu azi / obiectiv">
                    Azi: {{ todayMinutes }} / {{ goal }} min
                </span>
            </div>
        </header>

        <div ref="root">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { Link } from '@inertiajs/vue3';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import { mountExercise } from '@/exercises/runtime';
import type { ExerciseStart } from '@/exercises/runtime';
import type { ExerciseMeta, ResultMap } from '@/types';

/**
 * Frame of every exercise page: top bar (menu, title, mode, today's minutes)
 * and the exercise itself. It loads the settings and previous results into
 * Amb, starts the exercise module after the markup is on the page and stops
 * everything (timers, keys, time tracking) when you leave.
 */
export default defineComponent({
    name: 'ExerciseShell',

    components: { Link },

    props: {
        exercise: { type: Object as PropType<ExerciseMeta>, required: true },
        results: { type: Object as PropType<ResultMap>, default: () => ({}) },
        /** The exercise module (default export of resources/js/exercises/<name>.ts). */
        start: { type: Function as PropType<ExerciseStart>, required: true },
    },

    data() {
        return {
            dispose: null as (() => void) | null,
        };
    },

    computed: {
        mode(): string {
            // reading the reactive settings makes the text follow changes
            void Amb.settings().viewMode;
            void Amb.settings().lazyEye;

            return Amb.modeText();
        },

        todayMinutes(): number {
            return Math.floor(Amb.todaySeconds() / 60);
        },

        goal(): number {
            return Amb.settings().dailyGoalMin;
        },

        homeUrl(): string {
            return Amb.urls.home;
        },

        settingsUrl(): string {
            return Amb.urls.settings;
        },
    },

    created() {
        Amb.initSettings(this.$page.props.settings);
        Amb.setTodayBase(this.$page.props.todaySeconds);
        Amb.seedResults(this.results);
    },

    mounted() {
        this.dispose = mountExercise(
            this.$refs.root as HTMLElement,
            this.start,
        );
    },

    beforeUnmount() {
        this.dispose?.();
        this.dispose = null;
    },
});
</script>
