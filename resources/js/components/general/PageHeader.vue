<template>
    <div
        class="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3"
    >
        <div class="min-w-0">
            <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
                {{ title }}
            </h1>
            <p v-if="description" class="mt-1 max-w-3xl text-muted">
                {{ description }}
            </p>
        </div>
        <div v-if="$slots.default" class="flex flex-wrap items-center gap-2">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'PageHeader',

    props: {
        title: { type: String, required: true },
        description: { type: String, default: '' },
    },
});
</script>
