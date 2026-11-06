<template>
    <section :id="item.key" class="panel scroll-mt-20" :aria-labelledby="`${item.key}-title`">
        <header class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-3.5 sm:px-5">
            <h2 :id="`${item.key}-title`" class="text-lg font-semibold">
                <span class="mr-1.5 text-muted tabular-nums">{{ number }}.</span>{{ tx(item.title) }}
            </h2>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap" :class="targetClass">
                {{ targetLabel }}
            </span>
        </header>

        <div class="grid gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div class="min-w-0 space-y-5 text-[0.95rem] leading-relaxed">
                <div>
                    <h3 class="pg-h">{{ $t('Why it may help') }}</h3>
                    <p>{{ tx(item.why, vars) }}</p>
                </div>
                <div class="rounded-lg border border-line bg-panel-2 px-3.5 py-3">
                    <h3 class="pg-h">{{ $t('What the studies say') }}</h3>
                    <p class="text-sm">{{ tx(item.evidence, vars) }}</p>
                </div>
                <div>
                    <h3 class="pg-h">{{ $t('What you need') }}</h3>
                    <ul class="list-disc space-y-1 pl-5">
                        <li v-for="(n, i) in item.need" :key="i">{{ tx(n, vars) }}</li>
                    </ul>
                </div>
                <div>
                    <h3 class="pg-h">{{ $t('Step by step') }}</h3>
                    <ol class="space-y-2">
                        <li v-for="(s, i) in item.steps" :key="i" class="flex gap-3">
                            <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                                {{ i + 1 }}
                            </span>
                            <!-- static texts from guide.ts (may contain <b>) -->
                            <span class="min-w-0" v-html="tx(s, vars)" />
                        </li>
                    </ol>
                </div>
                <div v-if="item.extra">
                    <h3 class="pg-h">{{ tx(item.extra.title) }}</h3>
                    <ul class="list-disc space-y-1.5 pl-5">
                        <li v-for="(e, i) in item.extra.items" :key="i" v-html="tx(e, vars)" />
                    </ul>
                </div>
                <p v-if="item.caution" class="rounded-lg border border-warn/40 bg-warn/10 px-3.5 py-2.5 text-sm">
                    <b>{{ $t('Careful') }}:</b> {{ tx(item.caution, vars) }}
                </p>
                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <h3 class="pg-h">{{ $t('How long and how often') }}</h3>
                        <p>{{ tx(item.dose, vars) }}</p>
                    </div>
                    <div>
                        <h3 class="pg-h">{{ $t('Signs you are doing it right') }}</h3>
                        <ul class="list-disc space-y-1 pl-5">
                            <li v-for="(r, i) in item.right" :key="i">{{ tx(r, vars) }}</li>
                        </ul>
                    </div>
                </div>
                <div class="rounded-lg border border-bad/40 bg-bad/5 px-3.5 py-3">
                    <h3 class="pg-h pg-h-bad">{{ $t('Stop if') }}</h3>
                    <ul class="list-disc space-y-1 pl-5 text-sm">
                        <li v-for="(s, i) in item.stop" :key="i">{{ tx(s, vars) }}</li>
                    </ul>
                </div>
                <slot />
            </div>

            <div class="min-w-0 space-y-4">
                <figure v-for="f in item.figures" :key="f.name" class="rounded-lg border border-line bg-panel p-3">
                    <PhysicalFigure :name="f.name" :label="tx(f.caption, vars)" />
                    <figcaption class="mt-2 text-xs text-muted">{{ tx(f.caption, vars) }}</figcaption>
                </figure>
                <PhysicalTimer :exercise-key="item.key" :options="item.timer.options" :tracked="item.timer.tracked" />
                <slot name="aside" />
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import Amb from '@/amb';
import PhysicalFigure from '@/components/physical/PhysicalFigure.vue';
import PhysicalTimer from '@/components/physical/PhysicalTimer.vue';
import { tx } from '@/components/physical/guide';
import type { GuideExercise } from '@/components/physical/guide';
import type { Replacements } from '@/i18n';

/** One off-screen exercise: what for, why, evidence, steps, stop signs, drawings and timer. */
export default defineComponent({
    name: 'GuideCard',

    components: { PhysicalFigure, PhysicalTimer },

    props: {
        item: { type: Object as PropType<GuideExercise>, required: true },
        number: { type: Number, required: true },
    },

    computed: {
        /** Eye names used in the texts (":good", ":lazy"), from the settings. */
        vars(): Replacements {
            return {
                good: Amb.EYE[Amb.goodEye()],
                lazy: Amb.EYE[Amb.settings().lazyEye],
            };
        },

        targetLabel(): string {
            return {
                amblyopia: this.$t('Lazy eye (amblyopia)'),
                exotropia: this.$t('Outward-drifting eye (exotropia)'),
                both: this.$t('Lazy eye and drifting eye'),
                comfort: this.$t('Comfort, not a treatment'),
            }[this.item.target];
        },

        targetClass(): string {
            return {
                amblyopia: 'bg-warn/15 text-warn',
                exotropia: 'bg-accent/15 text-accent',
                both: 'bg-good/15 text-good',
                comfort: 'bg-panel-2 text-muted',
            }[this.item.target];
        },
    },

    methods: {
        tx,
    },
});
</script>

<style>
.pg-h {
    margin-bottom: 0.35rem;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--color-muted);
}

.pg-h.pg-h-bad {
    color: var(--color-bad);
}
</style>
