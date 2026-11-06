<template>
    <Head :title="$t('Create an account')" />

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
                    <h2 class="text-lg font-semibold">
                        {{ $t('Create an account') }}
                    </h2>
                    <div>
                        <label class="form-label" for="name">{{
                            $t('Name')
                        }}</label>
                        <input
                            id="name"
                            v-model="form.name"
                            v-focus
                            type="text"
                            autocomplete="name"
                            required
                            maxlength="100"
                            class="form-control"
                        />
                        <p v-if="errors.name" class="form-error">
                            {{ errors.name }}
                        </p>
                    </div>
                    <div>
                        <label class="form-label" for="email">{{
                            $t('Email')
                        }}</label>
                        <input
                            id="email"
                            v-model="form.email"
                            type="email"
                            autocomplete="email"
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
                            autocomplete="new-password"
                            required
                            minlength="8"
                            class="form-control"
                        />
                        <p v-if="errors.password" class="form-error">
                            {{ errors.password }}
                        </p>
                        <p v-else class="mt-1.5 text-xs text-muted">
                            {{ $t('At least 8 characters.') }}
                        </p>
                    </div>
                    <div>
                        <label class="form-label" for="password_confirmation">{{
                            $t('Repeat the password')
                        }}</label>
                        <input
                            id="password_confirmation"
                            v-model="form.password_confirmation"
                            type="password"
                            autocomplete="new-password"
                            required
                            class="form-control"
                        />
                    </div>
                    <button
                        type="submit"
                        class="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:brightness-110 disabled:opacity-60"
                        :disabled="processing"
                    >
                        {{ $t('Create the account') }}
                    </button>
                </form>

                <p class="mt-4 text-center text-sm text-muted">
                    {{ $t('Already have an account?') }}
                    <Link href="/login">{{ $t('Log in') }}</Link>
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

/** New account (only when registration is enabled). No menu bar. */
export default defineComponent({
    name: 'RegisterPage',

    components: { AppLogo, Head, LanguageSwitcher, Link, ThemeSwitcher },

    data() {
        return {
            processing: false,
            form: {
                name: '',
                email: '',
                password: '',
                password_confirmation: '',
            },
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
                '/register',
                { ...this.form },
                {
                    onFinish: () => {
                        this.processing = false;
                        this.form.password = '';
                        this.form.password_confirmation = '';
                    },
                },
            );
        },
    },
});
</script>
