<template>
    <div ref="root" class="relative">
        <button
            type="button"
            class="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-muted transition hover:bg-hover hover:text-fg"
            :aria-expanded="open"
            :title="$t('Language')"
            @click="open = !open"
        >
            <Languages class="size-5" />
            <span class="uppercase">{{ current }}</span>
        </button>
        <div
            v-if="open"
            class="absolute top-full right-0 z-50 mt-1 w-40 rounded-lg border border-line bg-panel p-1 shadow-lg"
        >
            <button
                v-for="option in options"
                :key="option.code"
                type="button"
                class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm"
                :class="
                    option.code === current
                        ? 'bg-accent/15 font-medium text-accent'
                        : 'text-fg hover:bg-hover'
                "
                @click="choose(option.code)"
            >
                {{ option.label }}
                <span class="text-xs text-muted uppercase">{{
                    option.code
                }}</span>
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { Languages } from '@lucide/vue';
import { router } from '@inertiajs/vue3';
import { defineComponent } from 'vue';

/** Top-right language menu: Română / English (saved in the session and a cookie). */
export default defineComponent({
    name: 'LanguageSwitcher',

    components: { Languages },

    data() {
        return {
            open: false,
            // Each language is written in itself, so it is easy to find.
            options: [
                { code: 'ro', label: 'Română' },
                { code: 'en', label: 'English' },
            ],
        };
    },

    computed: {
        current(): string {
            return String(this.$page.props.locale ?? 'ro');
        },
    },

    mounted() {
        document.addEventListener('mousedown', this.onClickOutside);
    },

    beforeUnmount() {
        document.removeEventListener('mousedown', this.onClickOutside);
    },

    methods: {
        choose(code: string): void {
            this.open = false;

            if (code !== this.current) {
                router.put('/locale', { locale: code }, { preserveScroll: true });
            }
        },

        onClickOutside(event: MouseEvent): void {
            const root = this.$refs.root as HTMLElement | undefined;

            if (this.open && !root?.contains(event.target as Node)) {
                this.open = false;
            }
        },
    },
});
</script>
