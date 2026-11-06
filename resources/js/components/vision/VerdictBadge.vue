<template>
    <span
        class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
        :class="tone.classes"
        :title="$t(tone.hint)"
    >
        <component :is="tone.icon" class="size-3.5" />
        {{ $t(tone.label) }}
    </span>
</template>

<script lang="ts">
import { Minus, TrendingDown, TrendingUp } from '@lucide/vue';
import type { Component, PropType } from 'vue';
import { defineComponent, markRaw } from 'vue';
import type { VisionDelta } from '@/types';

type Tone = { label: string; hint: string; icon: Component; classes: string };

const TONES: Record<VisionDelta['verdict'], Tone> = {
    better: {
        label: 'Clear progress',
        hint: 'Better by 2 lines or more: more than the measurement error.',
        icon: markRaw(TrendingUp),
        classes: 'bg-good/15 text-good',
    },
    maybe_better: {
        label: 'Possible progress',
        hint: 'Better by about one line: repeat the test to confirm it.',
        icon: markRaw(TrendingUp),
        classes: 'bg-accent/15 text-accent',
    },
    stable: {
        label: 'Stable',
        hint: 'The difference is within the measurement error.',
        icon: markRaw(Minus),
        classes: 'bg-panel-2 text-muted',
    },
    maybe_worse: {
        label: 'Slightly weaker',
        hint: 'Weaker by about one line: often tiredness or light. Repeat the test.',
        icon: markRaw(TrendingDown),
        classes: 'bg-warn/15 text-warn',
    },
    worse: {
        label: 'Weaker',
        hint: 'Weaker by 2 lines or more. Repeat the test rested; if it stays, see your eye doctor.',
        icon: markRaw(TrendingDown),
        classes: 'bg-bad/15 text-bad',
    },
};

/** "Clear progress / Stable / Weaker" label with icon (never colour alone). */
export default defineComponent({
    name: 'VerdictBadge',

    props: {
        verdict: {
            type: String as PropType<VisionDelta['verdict']>,
            required: true,
        },
    },

    computed: {
        tone(): Tone {
            return TONES[this.verdict];
        },
    },
});
</script>
