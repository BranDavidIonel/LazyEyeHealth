<template>
    <div
        class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        aria-live="polite"
    >
        <div
            v-for="toast in toasts"
            :key="toast.id"
            class="pointer-events-auto flex max-w-md items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
            :class="
                toast.kind === 'error'
                    ? 'border-bad/40 bg-[#2a1214] text-bad'
                    : 'border-good/40 bg-[#0f2219] text-good'
            "
        >
            <span class="flex-1">{{ toast.text }}</span>
            <button
                type="button"
                class="text-muted hover:text-fg"
                aria-label="Închide"
                @click="remove(toast.id)"
            >
                ×
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

type Toast = { id: number; kind: 'success' | 'error'; text: string };

let nextId = 1;

/** Messages from the server ("Setările au fost salvate."), shown for a few seconds. */
export default defineComponent({
    name: 'FlashToasts',

    data() {
        return {
            toasts: [] as Toast[],
        };
    },

    watch: {
        '$page.props.flash': {
            immediate: true,
            deep: true,
            handler(flash: { success: string | null; error: string | null }) {
                if (flash?.success) {
                    this.add('success', flash.success);
                }

                if (flash?.error) {
                    this.add('error', flash.error);
                }
            },
        },
    },

    methods: {
        add(kind: Toast['kind'], text: string): void {
            const id = nextId++;
            this.toasts.push({ id, kind, text });
            setTimeout(() => this.remove(id), 4000);
        },

        remove(id: number): void {
            this.toasts = this.toasts.filter((t) => t.id !== id);
        },
    },
});
</script>
