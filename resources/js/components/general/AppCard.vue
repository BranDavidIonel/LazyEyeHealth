<template>
    <section class="panel">
        <header
            v-if="title || $slots.actions"
            class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5"
        >
            <div class="min-w-0">
                <h2 class="text-base font-semibold">{{ title }}</h2>
                <p v-if="description" class="mt-0.5 text-sm text-muted">
                    {{ description }}
                </p>
            </div>
            <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
                <slot name="actions" />
            </div>
        </header>
        <div :class="flush ? '' : 'p-5'">
            <slot />
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'AppCard',

    props: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        /** No inner padding (tables that touch the edges). */
        flush: { type: Boolean, default: false },
    },
});
</script>
