<template>
    <div ref="root" class="relative">
        <button
            type="button"
            class="flex items-center rounded-md p-2 text-muted transition hover:bg-hover hover:text-fg"
            :aria-expanded="open"
            :title="$t('Colour theme')"
            @click="open = !open"
        >
            <Palette class="size-5" />
        </button>
        <div
            v-if="open"
            class="absolute top-full right-0 z-50 mt-1 w-48 rounded-lg border border-line bg-panel p-1 shadow-lg"
        >
            <button
                v-for="theme in themes"
                :key="theme"
                type="button"
                class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm"
                :class="theme === current ? 'bg-accent/15 font-medium text-accent' : 'text-fg hover:bg-hover'"
                @click="choose(theme)"
            >
                <span class="flex size-6 shrink-0 overflow-hidden rounded-full border border-line-2">
                    <span class="h-full w-1/2" :style="{ background: swatches[theme][0] }" />
                    <span class="h-full w-1/2" :style="{ background: swatches[theme][1] }" />
                </span>
                {{ $t(labels[theme]) }}
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { Palette } from '@lucide/vue';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import { applyTheme, THEME_LABELS, THEMES, themeState } from '@/utils/theme';
import type { Theme } from '@/utils/theme';

/** Top-right colour theme menu: light, light blue, dark. */
export default defineComponent({
    name: 'ThemeSwitcher',

    components: { Palette },

    data() {
        return {
            open: false,
            themes: THEMES,
            labels: THEME_LABELS,
            // page background + accent, to preview each theme
            swatches: {
                light: ['#f4f6fa', '#1f6fd1'],
                blue: ['#dfeaf7', '#0d5bd7'],
                dark: ['#07090c', '#4fc3f7'],
            } as Record<Theme, [string, string]>,
        };
    },

    computed: {
        current(): Theme {
            return themeState.theme;
        },
    },

    mounted() {
        document.addEventListener('mousedown', this.onClickOutside);
    },

    beforeUnmount() {
        document.removeEventListener('mousedown', this.onClickOutside);
    },

    methods: {
        choose(theme: Theme): void {
            this.open = false;
            applyTheme(theme);

            // Logged in: save it with the other settings (before login it stays in the browser).
            if (this.$page.props.auth?.user) {
                Amb.set({ theme });
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
