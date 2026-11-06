<template>
    <div class="min-h-screen bg-ink text-fg">
        <header
            class="flex flex-wrap items-center gap-3 border-b border-line bg-header px-4 py-2.5"
        >
            <Link
                href="/test-vedere"
                class="rounded-md border border-line-2 px-3 py-1.5 text-sm text-fg no-underline hover:border-accent"
            >
                {{ $t('← Vision tests') }}
            </Link>
            <h1 class="min-w-40 flex-1 text-lg font-semibold">{{ title }}</h1>
            <ThemeSwitcher />
                <LanguageSwitcher />
        </header>
        <main class="mx-auto max-w-5xl px-4 py-6">
            <slot />
        </main>
    </div>
</template>

<script lang="ts">
import { Link } from '@inertiajs/vue3';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher.vue';
import { setLocale } from '@/i18n';
import { applyTheme } from '@/utils/theme';

/**
 * Frame of the vision test pages: back link, title, language. Loads the
 * settings (screen size from the calibration) and counts the test time
 * as practice ('test-vedere') while the parent says the test is running.
 */
export default defineComponent({
    name: 'TestShell',

    components: { LanguageSwitcher, Link, ThemeSwitcher },

    props: {
        title: { type: String, required: true },
        /** true while a test is on screen (counts practice time). */
        running: { type: Boolean, default: false },
    },

    watch: {
        running(on: boolean) {
            Amb.setActive(on);
        },
    },

    created() {
        setLocale(String(this.$page.props.locale ?? 'ro'));
        Amb.initSettings(this.$page.props.settings);
        applyTheme(Amb.settings().theme);
        Amb.setTodayBase(this.$page.props.todaySeconds);
    },

    mounted() {
        Amb.startTracking('test-vedere');
    },

    beforeUnmount() {
        Amb.stopTracking();
        void Amb.flushSettings();
    },
});
</script>
