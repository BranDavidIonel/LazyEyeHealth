<template>
    <div class="amb min-h-screen bg-ink">
        <header
            class="flex flex-wrap items-center gap-3 border-b border-line bg-header px-4 py-2.5"
        >
            <Link :href="homeUrl" class="btn ghost small">{{
                $t('← Menu')
            }}</Link>
            <h1 class="m-0 min-w-40 flex-1 text-lg font-semibold">
                {{ exercise.title }}
            </h1>
            <div class="flex flex-wrap items-center gap-2">
                <Link
                    :href="settingsUrl"
                    class="pill hover:text-fg"
                    :title="$t('Change the lazy eye or the way you work')"
                >
                    {{ mode }}
                </Link>
                <span
                    class="pill"
                    :title="$t(`Today's practice time / daily goal`)"
                >
                    {{ $t('Today: :min / :goal min', { min: todayMinutes, goal }) }}
                </span>
                <ThemeSwitcher />
                <LanguageSwitcher />
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
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher.vue';
import { mountExercise } from '@/exercises/runtime';
import type { ExerciseStart } from '@/exercises/runtime';
import { setLocale } from '@/i18n';
import { applyTheme } from '@/utils/theme';
import type { ExerciseMeta, ResultMap } from '@/types';

/**
 * Frame of every exercise page: top bar (menu, title, mode, today's minutes,
 * language) and the exercise itself. It loads the settings and previous
 * results into Amb, starts the exercise module after the markup is on the
 * page and stops everything (timers, keys, time tracking) when you leave.
 */
export default defineComponent({
    name: 'ExerciseShell',

    components: { LanguageSwitcher, Link, ThemeSwitcher },

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
            void this.$page.props.locale;

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
        setLocale(String(this.$page.props.locale ?? 'ro'));
        Amb.initSettings(this.$page.props.settings);
        applyTheme(Amb.settings().theme);
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
