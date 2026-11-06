<template>
    <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#11151a" />
        <path
            d="M4 16c3.2-5.3 7.2-8 12-8s8.8 2.7 12 8c-3.2 5.3-7.2 8-12 8s-8.8-2.7-12-8Z"
            fill="none"
            stroke="#e9eef3"
            stroke-width="1.8"
            stroke-linejoin="round"
        />
        <circle cx="13.6" cy="16" r="4.2" fill="#ff4d4d" opacity="0.9" />
        <circle cx="18.4" cy="16" r="4.2" fill="#29e0ff" opacity="0.8" />
    </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/** Eye with a red and a cyan pupil (the two lenses of the glasses). */
export default defineComponent({
    name: 'AppLogo',
});
</script>
