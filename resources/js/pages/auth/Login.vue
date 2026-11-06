<template>
    <Head :title="$t('Log in')" />

    <div class="flex min-h-screen flex-col bg-ink text-fg">
        <div class="flex items-center justify-end gap-2 p-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
        </div>

        <main class="flex flex-1 items-center justify-center px-4 pb-16">
            <div class="w-full max-w-sm">
                <div class="mb-6 flex flex-col items-center gap-3 text-center">
                    <AppLogo class="size-14" />
                    <h1 class="text-xl font-semibold tracking-tight">
                        LazyEye<span class="text-accent">Health</span>
                    </h1>
                    <p class="text-sm text-muted">
                        {{ $t('Training for the lazy eye') }}
                    </p>
                </div>

                <form class="panel space-y-4 p-6" @submit.prevent="submit">
                    <h2 class="text-lg font-semibold">{{ $t('Log in') }}</h2>
                    <div>
                        <label class="form-label" for="email">{{
                            $t('Email')
                        }}</label>
                        <input
                            id="email"
                            v-model="form.email"
                            v-focus
                            type="email"
                            autocomplete="username"
                            required
                            class="form-control"
                        />
                        <p v-if="errors.email" class="form-error">
                            {{ errors.email }}
                        </p>
                    </div>
                    <div>
                        <label class="form-label" for="password">{{
                            $t('Password')
                        }}</label>
                        <input
                            id="password"
                            v-model="form.password"
                            type="password"
                            autocomplete="current-password"
                            required
                            class="form-control"
                        />
                        <p v-if="errors.password" class="form-error">
                            {{ errors.password }}
                        </p>
                    </div>
                    <label class="flex items-center gap-2 text-sm">
                        <input
                            v-model="form.remember"
                            type="checkbox"
                            class="size-4 accent-accent"
                        />
                        {{ $t('Remember me') }}
                    </label>
                    <button
                        type="submit"
                        class="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:brightness-110 disabled:opacity-60"
                        :disabled="processing"
                    >
                        {{ $t('Log in') }}
                    </button>
                </form>

                <p v-if="canRegister" class="mt-4 text-center text-sm text-muted">
                    {{ $t('No account yet?') }}
                    <Link href="/register">{{ $t('Create one') }}</Link>
                </p>
            </div>
        </main>
    </div>
</template>

<script lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { defineComponent } from 'vue';
import AppLogo from '@/components/general/AppLogo.vue';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher.vue';
import { setLocale } from '@/i18n';
import { applyTheme, storedTheme } from '@/utils/theme';

/** Login page (no menu bar). Before login the theme is kept in the browser. */
export default defineComponent({
    name: 'LoginPage',

    components: { AppLogo, Head, LanguageSwitcher, Link, ThemeSwitcher },

    props: {
        canRegister: { type: Boolean, default: false },
    },

    data() {
        return {
            processing: false,
            form: { email: '', password: '', remember: false },
        };
    },

    computed: {
        errors(): Record<string, string> {
            return (this.$page.props.errors ?? {}) as Record<string, string>;
        },
    },

    watch: {
        // the language switcher reloads the page props, not the page
        '$page.props.locale'(locale: unknown) {
            setLocale(String(locale ?? 'ro'));
        },
    },

    created() {
        setLocale(String(this.$page.props.locale ?? 'ro'));
        applyTheme(storedTheme());
    },

    methods: {
        submit(): void {
            this.processing = true;
            router.post(
                '/login',
                { ...this.form },
                {
                    onFinish: () => {
                        this.processing = false;
                        this.form.password = '';
                    },
                },
            );
        },
    },
});
</script>
