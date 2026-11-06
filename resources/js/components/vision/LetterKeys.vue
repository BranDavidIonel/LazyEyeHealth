<template>
    <div class="space-y-3">
        <div class="flex justify-center gap-2" :aria-label="$t('Letters you typed')">
            <span
                v-for="i in count"
                :key="i"
                class="flex size-12 items-center justify-center rounded-lg border-2 text-2xl font-bold"
                :class="i - 1 === typed.length ? 'border-accent' : 'border-line-2'"
            >
                {{ typed[i - 1] ?? '' }}
            </span>
        </div>
        <div class="flex flex-wrap justify-center gap-1.5">
            <button
                v-for="letter in letters"
                :key="letter"
                type="button"
                class="size-11 rounded-lg border border-line-2 bg-panel-2 text-lg font-bold hover:border-accent"
                @click="add(letter)"
            >
                {{ letter }}
            </button>
            <button
                type="button"
                class="h-11 rounded-lg border border-line-2 bg-panel-2 px-3 text-sm hover:border-accent"
                :aria-label="$t('Delete the last letter')"
                @click="back"
            >
                ⌫
            </button>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
            <button
                type="button"
                class="rounded-lg border border-line-2 px-4 py-2 text-sm text-muted hover:text-fg"
                @click="$emit('submit', [])"
            >
                {{ $t('I cannot see anything') }}
            </button>
            <button
                type="button"
                class="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50"
                :disabled="typed.length === 0"
                @click="submit"
            >
                {{ $t('Next (Enter)') }}
            </button>
        </div>
        <p class="text-center text-xs text-muted">
            {{ $t('Type the letters on the keyboard, from left to right (or click them). Backspace deletes, Enter confirms.') }}
        </p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { SLOAN } from '@/vision/sloan';

/** Answer of one chart line: the letters typed in order (keyboard or on-screen keys). */
export default defineComponent({
    name: 'LetterKeys',

    props: {
        count: { type: Number, required: true },
    },

    emits: ['submit'],

    data() {
        return {
            typed: [] as string[],
            letters: [...SLOAN],
        };
    },

    mounted() {
        window.addEventListener('keydown', this.onKey);
    },

    beforeUnmount() {
        window.removeEventListener('keydown', this.onKey);
    },

    methods: {
        add(letter: string): void {
            if (this.typed.length < this.count) {
                this.typed.push(letter);
            }
        },

        back(): void {
            this.typed.pop();
        },

        submit(): void {
            if (this.typed.length) {
                this.$emit('submit', [...this.typed]);
                this.typed = [];
            }
        },

        onKey(event: KeyboardEvent): void {
            if (event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            const key = event.key.toUpperCase();

            if ((SLOAN as readonly string[]).includes(key)) {
                event.preventDefault();
                this.add(key);
            } else if (event.key === 'Backspace') {
                event.preventDefault();
                this.back();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                this.submit();
            }
        },
    },
});
</script>
