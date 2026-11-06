<template>
    <div class="panel p-4">
        <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
                <p class="text-sm text-muted">{{ label }}</p>
                <p
                    class="mt-1.5 truncate text-2xl font-semibold tracking-tight tabular-nums"
                >
                    {{ value }}
                </p>
                <p v-if="hint" class="mt-1 text-xs text-muted">{{ hint }}</p>
            </div>
            <div
                v-if="icon"
                class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
            >
                <component :is="icon" class="size-5" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import type { Component, PropType } from 'vue';
import { defineComponent } from 'vue';

/** Number tile: label, big value, optional hint and icon. */
export default defineComponent({
    name: 'StatCard',

    props: {
        label: { type: String, required: true },
        value: { type: [String, Number], required: true },
        hint: { type: String, default: '' },
        icon: {
            type: [Object, Function] as PropType<Component>,
            default: undefined,
        },
    },
});
</script>
