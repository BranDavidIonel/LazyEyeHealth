<template>
    <!-- eslint-disable-next-line vue/no-v-html -- static SVG from this file -->
    <span v-if="svg" class="contents" v-html="svg"></span>
    <component :is="fallback" v-else class="size-7 text-accent" />
</template>

<script lang="ts">
import { Dumbbell, Move, ScanEye, Sparkles } from '@lucide/vue';
import type { Component } from 'vue';
import { defineComponent, markRaw } from 'vue';

// Small pictures of the exercises (the first six come from the first version).
const ICONS: Record<string, string> = {
    tetris: '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><g fill="#ff3b3b"><rect x="4" y="4" width="8" height="8"/><rect x="4" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></g><g fill="#1c8a99"><rect x="4" y="25" width="8" height="8"/><rect x="13" y="25" width="8" height="8"/><rect x="22" y="25" width="8" height="8"/><rect x="22" y="16" width="8" height="8"/></g></svg>',
    breakout: '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><g fill="#ff3b3b"><rect x="3" y="4" width="9" height="5"/><rect x="13.5" y="4" width="9" height="5"/><rect x="24" y="4" width="9" height="5"/><rect x="8" y="11" width="9" height="5"/><rect x="19" y="11" width="9" height="5"/><circle cx="20" cy="23" r="2.6"/></g><rect x="9" y="29" width="16" height="3.5" rx="1.5" fill="#1c8a99"/></svg>',
    sarpe: '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><g fill="#ff3b3b"><rect x="4" y="20" width="6" height="6"/><rect x="10" y="20" width="6" height="6"/><rect x="16" y="20" width="6" height="6"/><rect x="16" y="14" width="6" height="6"/><rect x="16" y="8" width="6" height="6" rx="1.5"/></g><circle cx="28" cy="11" r="3" fill="#1c8a99"/><rect x="26" y="24" width="6" height="6" fill="#1c8a99"/></svg>',
    contrast: '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><defs><radialGradient id="gm"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="gk"><circle cx="18" cy="18" r="15" fill="url(#gm)"/></mask></defs><rect width="36" height="36" fill="#666"/><g mask="url(#gk)" transform="rotate(35 18 18)"><rect x="0" y="0" width="36" height="36" fill="#666"/><g fill="#ddd"><rect x="4" y="-4" width="3.5" height="44"/><rect x="11" y="-4" width="3.5" height="44"/><rect x="18" y="-4" width="3.5" height="44"/><rect x="25" y="-4" width="3.5" height="44"/></g><g fill="#2a2a2a"><rect x="7.5" y="-4" width="3.5" height="44"/><rect x="14.5" y="-4" width="3.5" height="44"/><rect x="21.5" y="-4" width="3.5" height="44"/><rect x="28.5" y="-4" width="3.5" height="44"/></g></g></svg>',
    'litera-e': '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="6" fill="#fff"/><g fill="#000"><rect x="8" y="8" width="4" height="20"/><rect x="8" y="8" width="20" height="4"/><rect x="8" y="16" width="20" height="4"/><rect x="8" y="24" width="20" height="4"/></g></svg>',
    vernier: '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="6" fill="#fff"/><rect x="16" y="4" width="3" height="12" fill="#000"/><rect x="19" y="20" width="3" height="12" fill="#000"/></svg>',
    inel: '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="6" fill="#fff"/><g fill="none" stroke="#000" stroke-width="2.4"><circle cx="10" cy="10" r="5"/><circle cx="26" cy="10" r="5"/><circle cx="10" cy="26" r="5"/></g><path d="M31 25.2 A5 5 0 1 0 31 26.8" fill="none" stroke="#000" stroke-width="2.4"/></svg>',
    citire: '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="6" fill="#000"/><g fill="#ff3b3b"><rect x="6" y="8" width="24" height="3" rx="1"/><rect x="6" y="14" width="20" height="3" rx="1"/><rect x="6" y="20" width="14" height="2.4" rx="1"/><rect x="6" y="25" width="10" height="2" rx="1"/></g></svg>',
    relief: '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="6" fill="#000"/><g fill="#ff3b3b"><rect x="5" y="6" width="3" height="3"/><rect x="12" y="11" width="3" height="3"/><rect x="21" y="5" width="3" height="3"/><rect x="27" y="14" width="3" height="3"/><rect x="7" y="22" width="3" height="3"/><rect x="18" y="26" width="3" height="3"/></g><g fill="#1fd3ea"><rect x="9" y="7" width="3" height="3"/><rect x="16" y="15" width="3" height="3"/><rect x="24" y="9" width="3" height="3"/><rect x="5" y="15" width="3" height="3"/><rect x="25" y="25" width="3" height="3"/><rect x="13" y="22" width="3" height="3"/></g><rect x="11" y="11" width="14" height="14" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2 2" opacity=".7"/></svg>',
    convergenta: '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="6" fill="#000"/><circle cx="14" cy="18" r="8" fill="none" stroke="#ff3b3b" stroke-width="2.4"/><circle cx="22" cy="18" r="8" fill="none" stroke="#1fd3ea" stroke-width="2.4"/><path d="M4 18h5M27 18h5" stroke="#fff" stroke-width="1.6"/><path d="M8 15l3 3-3 3M28 15l-3 3 3 3" fill="none" stroke="#fff" stroke-width="1.6"/></svg>',
};

const FALLBACK: Record<string, Component> = {
    'fara-ecran': markRaw(Dumbbell),
    calibrare: markRaw(ScanEye),
};

export default defineComponent({
    name: 'ExerciseIcon',

    props: {
        slug: { type: String, required: true },
    },

    computed: {
        svg(): string | null {
            return ICONS[this.slug] ?? null;
        },

        fallback(): Component {
            return FALLBACK[this.slug] ?? markRaw(this.slug === 'relief' ? Sparkles : Move);
        },
    },
});
</script>
