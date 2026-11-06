<template>
    <div class="min-h-screen bg-ink text-fg">
        <header
            class="sticky top-0 z-30 border-b border-line bg-header/95 backdrop-blur print:hidden"
        >
            <div
                class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6"
            >
                <button
                    type="button"
                    class="-ml-1 rounded-md p-2 text-muted hover:bg-hover hover:text-fg xl:hidden"
                    :aria-label="$t('Menu')"
                    :aria-expanded="menuOpen"
                    @click="menuOpen = !menuOpen"
                >
                    <Menu class="size-5" />
                </button>

                <Link
                    href="/"
                    class="flex shrink-0 items-center gap-2 text-fg no-underline"
                >
                    <AppLogo class="size-8" />
                    <span class="font-semibold tracking-tight">
                        LazyEye<span class="text-accent">Health</span>
                    </span>
                </Link>

                <nav class="ml-4 hidden items-center gap-0.5 xl:flex">
                    <Link
                        v-for="item in items"
                        :key="item.href"
                        :href="item.href"
                        class="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap no-underline transition"
                        :class="itemClass(item)"
                    >
                        <component :is="item.icon" class="size-4" />
                        {{ $t(item.label) }}
                    </Link>
                </nav>

                <div class="ml-auto flex items-center gap-1">
                    <span
                        class="hidden rounded-full border border-line bg-panel-2 px-3 py-1 text-xs text-muted 2xl:inline"
                        :title="$t(`Today's practice time / daily goal`)"
                    >
                        {{ $t('Today: :min / :goal min', { min: todayMinutes, goal }) }}
                    </span>
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                    <Link
                        href="/setari"
                        class="rounded-md p-2 transition"
                        :class="
                            settingsActive
                                ? 'bg-accent/15 text-accent'
                                : 'text-muted hover:bg-hover hover:text-fg'
                        "
                        :title="$t('Settings')"
                    >
                        <Settings class="size-5" />
                    </Link>
                    <Link
                        v-if="$page.props.auth.loginRequired"
                        href="/logout"
                        method="post"
                        as="button"
                        class="rounded-md p-2 text-muted transition hover:bg-hover hover:text-fg"
                        :title="$t('Log out (:email)', { email: $page.props.auth.user?.email ?? '' })"
                    >
                        <LogOut class="size-5" />
                    </Link>
                </div>
            </div>

            <nav
                v-if="menuOpen"
                class="border-t border-line px-4 py-2 xl:hidden"
            >
                <Link
                    v-for="item in items"
                    :key="item.href"
                    :href="item.href"
                    class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium no-underline"
                    :class="itemClass(item)"
                >
                    <component :is="item.icon" class="size-4" />
                    {{ $t(item.label) }}
                </Link>
            </nav>
        </header>

        <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
            <slot />
        </main>

        <FlashToasts />
    </div>
</template>

<script lang="ts">
import { LogOut, Menu, Settings } from '@lucide/vue';
import { Link } from '@inertiajs/vue3';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import AppLogo from '@/components/general/AppLogo.vue';
import FlashToasts from '@/components/general/FlashToasts.vue';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher.vue';
import { setLocale } from '@/i18n';
import { applyTheme } from '@/utils/theme';
import { isActive, navigationItems } from '@/utils/navigation';
import type { NavItem } from '@/utils/navigation';

/** Frame of the normal pages: top bar with the menu, content, messages. */
export default defineComponent({
    name: 'AppLayout',

    components: {
        AppLogo,
        FlashToasts,
        LanguageSwitcher,
        Link,
        LogOut,
        Menu,
        Settings,
        ThemeSwitcher,
    },

    data() {
        return {
            menuOpen: false,
        };
    },

    computed: {
        items(): NavItem[] {
            return navigationItems();
        },

        settingsActive(): boolean {
            return this.$page.url.startsWith('/setari');
        },

        todayMinutes(): number {
            return Math.floor(Amb.todaySeconds() / 60);
        },

        goal(): number {
            return Amb.settings().dailyGoalMin;
        },
    },

    watch: {
        '$page.url'() {
            this.menuOpen = false;
        },

        '$page.props.locale': {
            immediate: true,
            handler(locale: string) {
                setLocale(locale);
            },
        },

        // Settings and today's time come from the server with every page.
        '$page.props.settings': {
            immediate: true,
            handler() {
                Amb.initSettings(this.$page.props.settings);
                applyTheme(Amb.settings().theme);
            },
        },

        '$page.props.todaySeconds': {
            immediate: true,
            handler(seconds: number) {
                Amb.setTodayBase(seconds);
            },
        },
    },

    methods: {
        itemClass(item: NavItem): string {
            return isActive(item, this.$page.url)
                ? 'bg-accent/15 text-accent'
                : 'text-muted hover:bg-hover hover:text-fg';
        },
    },
});
</script>
